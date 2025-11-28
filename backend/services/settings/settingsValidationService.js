// backend/services/settings/settingsValidationService.js
const settingsRepository = require('../../repositories/settingsRepository');

class SettingsValidationService {
  /**
   * Validate setting value
   */
  async validateSetting(key, value, type, rules) {
    if (!rules) {
      return true; // No validation rules
    }
    
    // Type validation
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error('Value must be a string');
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          throw new Error(`Value must be at most ${rules.maxLength} characters`);
        }
        if (rules.minLength && value.length < rules.minLength) {
          throw new Error(`Value must be at least ${rules.minLength} characters`);
        }
        break;
        
      case 'number':
        const num = parseFloat(value);
        if (isNaN(num)) {
          throw new Error('Value must be a number');
        }
        if (rules.min !== undefined && num < rules.min) {
          throw new Error(`Value must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && num > rules.max) {
          throw new Error(`Value must be at most ${rules.max}`);
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          throw new Error('Value must be a boolean');
        }
        break;
        
      case 'json':
        try {
          JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
        } catch (e) {
          throw new Error('Value must be valid JSON');
        }
        break;
    }
    
    // Pattern validation
    if (rules.pattern && typeof value === 'string') {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(value)) {
        throw new Error(`Value does not match required pattern`);
      }
    }
    
    // Enum validation
    if (rules.enum && Array.isArray(rules.enum)) {
      if (!rules.enum.includes(value)) {
        throw new Error(`Value must be one of: ${rules.enum.join(', ')}`);
      }
    }
    
    // Custom validation function
    if (rules.custom && typeof rules.custom === 'function') {
      const result = rules.custom(value);
      if (result !== true) {
        throw new Error(result || 'Custom validation failed');
      }
    }
    
    return true;
  }
  
  /**
   * Validate multiple settings
   */
  async validateSettings(settings) {
    const errors = [];
    
    for (const [key, value] of Object.entries(settings)) {
      try {
        const setting = await settingsRepository.findByKey(key);
        if (setting && setting.validationRules) {
          await this.validateSetting(key, value, setting.type, setting.validationRules);
        }
      } catch (error) {
        errors.push({ key, error: error.message });
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => `${e.key}: ${e.error}`).join(', ')}`);
    }
    
    return true;
  }
  
  /**
   * Check dependencies
   */
  async checkDependencies(key, value, dependencies) {
    if (!dependencies || !Array.isArray(dependencies)) {
      return true;
    }
    
    for (const dep of dependencies) {
      const depSetting = await settingsRepository.findByKey(dep.key);
      if (!depSetting) {
        throw new Error(`Dependency setting "${dep.key}" not found`);
      }
      
      // Check condition
      if (dep.condition) {
        const conditionMet = this.evaluateCondition(depSetting.value, dep.condition, dep.expectedValue);
        if (!conditionMet) {
          throw new Error(`Dependency condition not met for "${dep.key}"`);
        }
      }
    }
    
    return true;
  }
  
  /**
   * Evaluate condition
   */
  evaluateCondition(actualValue, condition, expectedValue) {
    switch (condition) {
      case 'equals':
        return actualValue == expectedValue;
      case 'notEquals':
        return actualValue != expectedValue;
      case 'greaterThan':
        return parseFloat(actualValue) > parseFloat(expectedValue);
      case 'lessThan':
        return parseFloat(actualValue) < parseFloat(expectedValue);
      case 'contains':
        return String(actualValue).includes(String(expectedValue));
      default:
        return true;
    }
  }
  
  /**
   * Check permissions
   */
  async checkPermissions(userId, key, action) {
    // This should check user permissions
    // For now, it's a placeholder
    // TODO: Implement permission checking
    return true;
  }
}

module.exports = new SettingsValidationService();

