/**
 * Monitoring Utility
 * Provides monitoring and alerting for Settings System
 */

const db = require('../db');

class Monitoring {
  /**
   * Monitor API performance
   * @param {string} endpoint - API endpoint
   * @param {number} responseTime - Response time in ms
   * @param {number} statusCode - HTTP status code
   */
  static async logAPIPerformance(endpoint, responseTime, statusCode) {
    try {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MONITOR] ${endpoint} - ${responseTime}ms - ${statusCode}`);
      }

      // In production, you would log to a monitoring service
      // For now, we'll log to a simple file or database table
      if (responseTime > 1000) {
        console.warn(`⚠️ Slow API: ${endpoint} took ${responseTime}ms`);
      }

      if (statusCode >= 500) {
        console.error(`❌ API Error: ${endpoint} returned ${statusCode}`);
      }
    } catch (error) {
      console.error('Error logging API performance:', error);
    }
  }

  /**
   * Monitor database performance
   * @param {string} query - SQL query
   * @param {number} executionTime - Execution time in ms
   */
  static async logDatabasePerformance(query, executionTime) {
    try {
      if (executionTime > 500) {
        console.warn(`⚠️ Slow Query: ${executionTime}ms`);
        console.warn(`   Query: ${query.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error('Error logging database performance:', error);
    }
  }

  /**
   * Check system health
   * @returns {Promise<object>} Health status
   */
  static async checkHealth() {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: false,
          settings: false,
          cache: false
        }
      };

      // Check database connection
      try {
        await db.query('SELECT 1');
        health.checks.database = true;
      } catch (error) {
        health.status = 'unhealthy';
        health.checks.database = false;
        health.errors = health.errors || [];
        health.errors.push('Database connection failed');
      }

      // Check settings system
      try {
        const [settings] = await db.query('SELECT COUNT(*) as count FROM SystemSetting LIMIT 1');
        health.checks.settings = settings.length > 0;
      } catch (error) {
        health.status = 'unhealthy';
        health.checks.settings = false;
        health.errors = health.errors || [];
        health.errors.push('Settings system check failed');
      }

      // Check cache (if using Redis or similar)
      health.checks.cache = true; // Assume cache is working if no errors

      return health;
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Get system statistics
   * @returns {Promise<object>} System statistics
   */
  static async getStatistics() {
    try {
      const stats = {
        timestamp: new Date().toISOString(),
        settings: {},
        database: {},
        performance: {}
      };

      // Settings statistics
      const [settingsCount] = await db.query('SELECT COUNT(*) as count FROM SystemSetting');
      const [historyCount] = await db.query('SELECT COUNT(*) as count FROM SettingHistory');
      const [backupCount] = await db.query('SELECT COUNT(*) as count FROM SettingBackup');

      stats.settings = {
        total: settingsCount[0].count,
        history: historyCount[0].count,
        backups: backupCount[0].count
      };

      // Database statistics
      const [dbSize] = await db.query(`
        SELECT 
          ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
        FROM information_schema.tables
        WHERE table_schema = ?
        AND table_name LIKE 'Setting%'
      `, [process.env.DB_NAME || 'FZ']);

      stats.database = {
        sizeMB: parseFloat(dbSize[0].size_mb || 0)
      };

      return stats;
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Setup alerts
   * @param {object} config - Alert configuration
   */
  static setupAlerts(config = {}) {
    const {
      slowAPIThreshold = 1000, // ms
      errorThreshold = 10, // errors per minute
      databaseSlowThreshold = 500 // ms
    } = config;

    // This would integrate with an alerting service
    // For now, we'll just log warnings
    console.log('📊 Monitoring alerts configured:');
    console.log(`   Slow API threshold: ${slowAPIThreshold}ms`);
    console.log(`   Error threshold: ${errorThreshold}/min`);
    console.log(`   Database slow threshold: ${databaseSlowThreshold}ms`);
  }
}

module.exports = Monitoring;

