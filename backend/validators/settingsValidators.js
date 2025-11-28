// backend/validators/settingsValidators.js
const Joi = require('joi');

/**
 * Validation schema for creating a setting
 */
const createSettingSchema = Joi.object({
  key: Joi.string()
    .required()
    .min(1)
    .max(100)
    .pattern(/^[a-zA-Z0-9._-]+$/)
    .messages({
      'string.empty': 'Key is required',
      'string.min': 'Key must be at least 1 character long',
      'string.max': 'Key must be at most 100 characters long',
      'string.pattern.base': 'Key can only contain letters, numbers, dots, underscores, and hyphens',
      'any.required': 'Key is required'
    }),
  
  value: Joi.any()
    .required()
    .messages({
      'any.required': 'Value is required'
    }),
  
  type: Joi.string()
    .valid('string', 'number', 'boolean', 'json', 'text')
    .default('string')
    .messages({
      'any.only': 'Type must be one of: string, number, boolean, json, text'
    }),
  
  category: Joi.string()
    .max(50)
    .default('general')
    .messages({
      'string.max': 'Category must be at most 50 characters long'
    }),
  
  description: Joi.string()
    .max(500)
    .allow(null, '')
    .messages({
      'string.max': 'Description must be at most 500 characters long'
    }),
  
  isEncrypted: Joi.boolean()
    .default(false),
  
  isSystem: Joi.boolean()
    .default(false),
  
  isPublic: Joi.boolean()
    .default(false),
  
  defaultValue: Joi.any()
    .allow(null, ''),
  
  validationRules: Joi.object()
    .allow(null)
    .messages({
      'object.base': 'Validation rules must be an object'
    }),
  
  dependencies: Joi.array()
    .items(
      Joi.object({
        key: Joi.string().required(),
        condition: Joi.string().valid('equals', 'notEquals', 'greaterThan', 'lessThan', 'contains'),
        expectedValue: Joi.any()
      })
    )
    .allow(null),
  
  environment: Joi.string()
    .valid('production', 'development', 'all')
    .default('all')
    .messages({
      'any.only': 'Environment must be one of: production, development, all'
    }),
  
  permissions: Joi.array()
    .items(
      Joi.object({
        roleId: Joi.number().integer().required(),
        canRead: Joi.boolean().default(true),
        canWrite: Joi.boolean().default(false)
      })
    )
    .allow(null),
  
  metadata: Joi.object()
    .allow(null)
});

/**
 * Validation schema for updating a setting
 */
const updateSettingSchema = Joi.object({
  value: Joi.any()
    .required()
    .messages({
      'any.required': 'Value is required'
    }),
  
  type: Joi.string()
    .valid('string', 'number', 'boolean', 'json', 'text')
    .optional()
    .messages({
      'any.only': 'Type must be one of: string, number, boolean, json, text'
    }),
  
  description: Joi.string()
    .max(500)
    .allow(null, '')
    .optional()
    .messages({
      'string.max': 'Description must be at most 500 characters long'
    }),
  
  validationRules: Joi.object()
    .allow(null)
    .optional(),
  
  dependencies: Joi.array()
    .items(
      Joi.object({
        key: Joi.string().required(),
        condition: Joi.string().valid('equals', 'notEquals', 'greaterThan', 'lessThan', 'contains'),
        expectedValue: Joi.any()
      })
    )
    .allow(null)
    .optional(),
  
  permissions: Joi.array()
    .items(
      Joi.object({
        roleId: Joi.number().integer().required(),
        canRead: Joi.boolean().default(true),
        canWrite: Joi.boolean().default(false)
      })
    )
    .allow(null)
    .optional(),
  
  reason: Joi.string()
    .max(500)
    .allow(null, '')
    .optional()
    .messages({
      'string.max': 'Reason must be at most 500 characters long'
    })
});

/**
 * Validation schema for batch update
 */
const batchUpdateSchema = Joi.array()
  .items(
    Joi.object({
      key: Joi.string()
        .required()
        .min(1)
        .max(100)
        .messages({
          'string.empty': 'Key is required',
          'any.required': 'Key is required'
        }),
      value: Joi.any()
        .required()
        .messages({
          'any.required': 'Value is required'
        })
    })
  )
  .min(1)
  .max(100)
  .messages({
    'array.min': 'At least one setting is required',
    'array.max': 'Maximum 100 settings can be updated at once'
  });

/**
 * Validation schema for search
 */
const searchSchema = Joi.object({
  q: Joi.string()
    .required()
    .min(1)
    .max(200)
    .messages({
      'string.empty': 'Search query is required',
      'string.min': 'Search query must be at least 1 character',
      'string.max': 'Search query must be at most 200 characters',
      'any.required': 'Search query is required'
    }),
  
  category: Joi.string()
    .max(50)
    .optional(),
  
  environment: Joi.string()
    .valid('production', 'development', 'all')
    .optional()
});

/**
 * Validation schema for rollback
 */
const rollbackSchema = Joi.object({
  historyId: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'History ID must be a number',
      'any.required': 'History ID is required'
    })
});

/**
 * Validation middleware factory
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(
      source === 'body' ? req.body : 
      source === 'query' ? req.query : 
      source === 'params' ? req.params : req.body,
      { abortEarly: false }
    );
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    // Replace request data with validated value
    if (source === 'body') {
      req.body = value;
    } else if (source === 'query') {
      req.query = value;
    } else if (source === 'params') {
      req.params = value;
    }
    
    next();
  };
};

module.exports = {
  createSettingSchema,
  updateSettingSchema,
  batchUpdateSchema,
  searchSchema,
  rollbackSchema,
  validate
};

