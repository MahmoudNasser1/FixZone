// backend/middleware/settings/settingsEncryption.js
const crypto = require('crypto');

class SettingsEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.key = this.getEncryptionKey();
  }
  
  /**
   * Get encryption key from environment or generate one
   */
  getEncryptionKey() {
    const key = process.env.SETTINGS_ENCRYPTION_KEY;
    if (!key) {
      console.warn('⚠️ SETTINGS_ENCRYPTION_KEY not set, using default (NOT SECURE FOR PRODUCTION)');
      // Generate a default key (32 bytes for AES-256)
      return crypto.randomBytes(32).toString('hex').substring(0, 64);
    }
    
    // Ensure key is 32 bytes (64 hex characters)
    if (key.length < 64) {
      return crypto.createHash('sha256').update(key).digest('hex').substring(0, 64);
    }
    
    return key.substring(0, 64);
  }
  
  /**
   * Encrypt sensitive value
   */
  encrypt(value) {
    if (!value) {
      return null;
    }
    
    try {
      const iv = crypto.randomBytes(16);
      const keyBuffer = Buffer.from(this.key, 'hex');
      const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv);
      
      let encrypted = cipher.update(String(value), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      console.error('Error encrypting value:', error);
      throw new Error('Encryption failed');
    }
  }
  
  /**
   * Decrypt sensitive value
   */
  decrypt(encryptedData) {
    if (!encryptedData || !encryptedData.encrypted) {
      return null;
    }
    
    try {
      const keyBuffer = Buffer.from(this.key, 'hex');
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        keyBuffer,
        Buffer.from(encryptedData.iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting value:', error);
      throw new Error('Decryption failed');
    }
  }
  
  /**
   * Encrypt setting value before saving
   */
  encryptSettingValue(value, isEncrypted) {
    if (!isEncrypted) {
      return value;
    }
    
    const encrypted = this.encrypt(value);
    return JSON.stringify(encrypted);
  }
  
  /**
   * Decrypt setting value after loading
   */
  decryptSettingValue(value, isEncrypted) {
    if (!isEncrypted || !value) {
      return value;
    }
    
    try {
      const encryptedData = typeof value === 'string' ? JSON.parse(value) : value;
      return this.decrypt(encryptedData);
    } catch (error) {
      console.error('Error decrypting setting value:', error);
      return value; // Return original value if decryption fails
    }
  }
}

const settingsEncryption = new SettingsEncryption();

/**
 * Middleware to encrypt sensitive settings before saving
 */
const encryptSensitiveSettings = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    // Check if setting should be encrypted
    if (req.body.isEncrypted || req.body.isEncrypted === true) {
      if (req.body.value) {
        try {
          // Encrypt the value
          const encrypted = settingsEncryption.encryptSettingValue(
            req.body.value,
            true
          );
          req.body.value = encrypted;
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: 'Failed to encrypt setting value',
            error: error.message
          });
        }
      }
    }
  }
  
  next();
};

/**
 * Middleware to decrypt sensitive settings after loading
 */
const decryptSensitiveSettings = (req, res, next) => {
  // This will be handled in the repository/service layer
  // But we can add it here if needed for response modification
  next();
};

module.exports = {
  settingsEncryption,
  encryptSensitiveSettings,
  decryptSensitiveSettings
};

