// backend/models/setting.js
const Joi = require('joi');

const settingSchema = Joi.object({
  key: Joi.string().min(1).max(100).required(),
  value: Joi.any().required(),
  type: Joi.string().valid('string', 'number', 'boolean', 'json', 'text').default('string'),
  category: Joi.string().max(50).default('general'),
  description: Joi.string().max(500).allow(null, ''),
  isEncrypted: Joi.boolean().default(false),
  isSystem: Joi.boolean().default(false),
  isPublic: Joi.boolean().default(false),
  defaultValue: Joi.any().allow(null, ''),
  validationRules: Joi.object().allow(null),
  dependencies: Joi.array().allow(null),
  environment: Joi.string().valid('production', 'development', 'all').default('all'),
  permissions: Joi.array().allow(null),
  metadata: Joi.object().allow(null)
});

const updateSettingSchema = Joi.object({
  value: Joi.any().required(),
  type: Joi.string().valid('string', 'number', 'boolean', 'json', 'text').optional(),
  description: Joi.string().max(500).allow(null, '').optional(),
  validationRules: Joi.object().allow(null).optional(),
  dependencies: Joi.array().allow(null).optional(),
  permissions: Joi.array().allow(null).optional()
});

const batchUpdateSchema = Joi.array().items(
  Joi.object({
    key: Joi.string().required(),
    value: Joi.any().required()
  })
);

exports.validateSetting = (data) => settingSchema.validate(data);
exports.validateUpdateSetting = (data) => updateSettingSchema.validate(data);
exports.validateBatchUpdate = (data) => batchUpdateSchema.validate(data);

