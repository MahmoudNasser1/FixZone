// backend/middleware/settings/settingsAudit.js
const settingsHistoryRepository = require('../../repositories/settingsHistoryRepository');
const db = require('../../db');

/**
 * Audit middleware for settings changes
 * Logs all settings modifications to audit log and history
 */
const auditSettingsChange = async (req, res, next) => {
  // Store original send function
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override send/json to capture response
  res.send = function(data) {
    auditLog(req, res, data);
    originalSend.call(this, data);
  };
  
  res.json = function(data) {
    auditLog(req, res, data);
    originalJson.call(this, data);
  };
  
  next();
};

/**
 * Log settings change to audit log and history
 */
async function auditLog(req, res, responseData) {
  try {
    // Only log successful write operations
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const method = req.method;
      const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
      
      if (isWriteOperation && req.user) {
        const userId = req.user.id;
        const action = getActionFromMethod(method, req.path);
        const resource = getResourceFromPath(req.path);
        
        // Get setting key from params or body
        const settingKey = req.params.key || req.body.key || resource;
        
        // Get old and new values
        let oldValue = null;
        let newValue = null;
        
        if (method === 'PUT' || method === 'PATCH') {
          // For updates, we need to get old value from database
          // This is handled in the service layer, but we log here too
          newValue = req.body.value;
        } else if (method === 'POST') {
          newValue = req.body.value;
        } else if (method === 'DELETE') {
          // Old value will be set in service layer
        }
        
        // Log to audit log table (if exists)
        try {
          await db.execute(
            `INSERT INTO audit_log (userId, action, resource, details, ipAddress, userAgent, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
              userId,
              action,
              resource,
              JSON.stringify({
                method,
                path: req.path,
                settingKey,
                oldValue,
                newValue,
                reason: req.body.reason || null,
                response: responseData?.success || false
              }),
              req.ip || req.connection.remoteAddress,
              req.get('user-agent') || null
            ]
          );
        } catch (error) {
          // If audit_log table doesn't exist, just log to console
          console.log('Audit log (console):', {
            userId,
            action,
            resource,
            settingKey,
            timestamp: new Date().toISOString()
          });
        }
        
        // History is logged in the service layer, so we don't duplicate here
        // But we can add additional logging if needed
      }
    }
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Error in audit logging:', error);
  }
}

/**
 * Get action name from HTTP method
 */
function getActionFromMethod(method, path) {
  if (path.includes('/rollback')) {
    return 'settings.rollback';
  }
  if (path.includes('/history')) {
    return 'settings.history.view';
  }
  if (path.includes('/batch')) {
    return 'settings.batch.update';
  }
  
  switch (method) {
    case 'GET':
      return 'settings.view';
    case 'POST':
      return 'settings.create';
    case 'PUT':
    case 'PATCH':
      return 'settings.update';
    case 'DELETE':
      return 'settings.delete';
    default:
      return 'settings.unknown';
  }
}

/**
 * Get resource identifier from path
 */
function getResourceFromPath(path) {
  if (path.includes('/settings/')) {
    const parts = path.split('/settings/');
    if (parts[1]) {
      return `settings.${parts[1].split('/')[0]}`;
    }
  }
  return 'settings';
}

module.exports = auditSettingsChange;

