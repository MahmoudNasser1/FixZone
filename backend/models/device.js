// backend/models/device.js
// Install Joi: npm install joi
const Joi = require('joi');

const deviceSchema = Joi.object({
  customerId: Joi.number().integer().required(),
  deviceType: Joi.string().max(100).required(),
  brand: Joi.string().max(100).required(),
  model: Joi.string().max(100).required(),
  serialNumber: Joi.string().max(100).allow('', null),
  customFields: Joi.object().optional(),
  deviceBatchId: Joi.number().integer().allow(null)
});

exports.validateDevice = (data) => deviceSchema.validate(data); 