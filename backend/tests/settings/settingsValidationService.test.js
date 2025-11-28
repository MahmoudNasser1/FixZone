// backend/tests/settings/settingsValidationService.test.js
const settingsValidationService = require('../../services/settings/settingsValidationService');
const settingsRepository = require('../../repositories/settingsRepository');

// Mock repository to avoid database connection
jest.mock('../../repositories/settingsRepository');

describe('SettingsValidationService', () => {
  describe('validateSetting', () => {
    it('should validate string type', async () => {
      await expect(
        settingsValidationService.validateSetting('test.string', 'valid string', 'string', {})
      ).resolves.toBe(true);
      
      await expect(
        settingsValidationService.validateSetting('test.string', 123, 'string', {})
      ).rejects.toThrow('Value must be a string');
    });

    it('should validate number type', async () => {
      await expect(
        settingsValidationService.validateSetting('test.number', '123', 'number', {})
      ).resolves.toBe(true);
      
      await expect(
        settingsValidationService.validateSetting('test.number', 'not a number', 'number', {})
      ).rejects.toThrow('Value must be a number');
    });

    it('should validate boolean type', async () => {
      await expect(
        settingsValidationService.validateSetting('test.boolean', true, 'boolean', {})
      ).resolves.toBe(true);
      
      await expect(
        settingsValidationService.validateSetting('test.boolean', 'not boolean', 'boolean', {})
      ).rejects.toThrow('Value must be a boolean');
    });

    it('should validate JSON type', async () => {
      const validJson = { key: 'value' };
      await expect(
        settingsValidationService.validateSetting('test.json', JSON.stringify(validJson), 'json', {})
      ).resolves.toBe(true);
      
      await expect(
        settingsValidationService.validateSetting('test.json', 'not json', 'json', {})
      ).rejects.toThrow('Value must be valid JSON');
    });

    it('should validate min/max constraints for numbers', async () => {
      await expect(
        settingsValidationService.validateSetting('test.number', '50', 'number', { min: 0, max: 100 })
      ).resolves.toBe(true);
      
      await expect(
        settingsValidationService.validateSetting('test.number', '-1', 'number', { min: 0, max: 100 })
      ).rejects.toThrow('Value must be at least 0');
      
      await expect(
        settingsValidationService.validateSetting('test.number', '101', 'number', { min: 0, max: 100 })
      ).rejects.toThrow('Value must be at most 100');
    });

    it('should validate min/max length for strings', async () => {
      await expect(
        settingsValidationService.validateSetting('test.string', 'valid', 'string', { minLength: 3, maxLength: 10 })
      ).resolves.toBe(true);
      
      await expect(
        settingsValidationService.validateSetting('test.string', 'ab', 'string', { minLength: 3, maxLength: 10 })
      ).rejects.toThrow('Value must be at least 3 characters');
      
      await expect(
        settingsValidationService.validateSetting('test.string', 'too long string', 'string', { minLength: 3, maxLength: 10 })
      ).rejects.toThrow('Value must be at most 10 characters');
    });

    it('should validate enum values', async () => {
      await expect(
        settingsValidationService.validateSetting('test.enum', 'option1', 'string', { enum: ['option1', 'option2', 'option3'] })
      ).resolves.toBe(true);
      
      await expect(
        settingsValidationService.validateSetting('test.enum', 'invalid', 'string', { enum: ['option1', 'option2', 'option3'] })
      ).rejects.toThrow('Value must be one of: option1, option2, option3');
    });

    it('should validate pattern (regex)', async () => {
      await expect(
        settingsValidationService.validateSetting('test.pattern', 'VALID', 'string', { pattern: '^[A-Z]+$' })
      ).resolves.toBe(true);
      
      await expect(
        settingsValidationService.validateSetting('test.pattern', 'invalid123', 'string', { pattern: '^[A-Z]+$' })
      ).rejects.toThrow('Value does not match required pattern');
    });

    it('should return true if no validation rules', async () => {
      await expect(
        settingsValidationService.validateSetting('test.setting', 'any value', 'string', null)
      ).resolves.toBe(true);
    });
  });
});
