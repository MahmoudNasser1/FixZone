// Audit Log Service
// Handles audit logging for financial operations

const db = require('../db');

class AuditLogService {
  /**
   * Log an action
   */
  async log(data) {
    try {
      // Check if AuditLog table exists
      const [tables] = await db.query(`
        SELECT COUNT(*) as exists 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'AuditLog'
      `);

      if (tables[0].exists === 0) {
        // Table doesn't exist, just log to console
        console.log('[AUDIT LOG]', JSON.stringify(data));
        return;
      }

      // Insert into AuditLog table
      await db.query(
        `INSERT INTO AuditLog 
         (action, entityType, entityId, userId, module, changes, ipAddress, userAgent, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          data.action,
          data.entityType,
          data.entityId,
          data.userId,
          data.module || 'financial',
          JSON.stringify(data.changes),
          data.ipAddress || null,
          data.userAgent || null
        ]
      );
    } catch (error) {
      // If error, just log to console
      console.error('[AUDIT LOG ERROR]', error.message);
      console.log('[AUDIT LOG]', JSON.stringify(data));
    }
  }
}

module.exports = new AuditLogService();


