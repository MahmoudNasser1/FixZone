// backend/models/inventory.js
// Install Joi: npm install joi
const Joi = require('joi');

const inventorySchema = Joi.object({
  sku: Joi.string().max(100).required(),
  name: Joi.string().max(100).required(),
  type: Joi.string().max(100).required(),
  purchasePrice: Joi.number().precision(2).required(),
  sellingPrice: Joi.number().precision(2).required(),
  serialNumber: Joi.string().max(100).allow('', null),
  customFields: Joi.object().optional()
});

exports.validateInventoryItem = (data) => inventorySchema.validate(data); 