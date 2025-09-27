// backend/models/customer.js
// Install Joi: npm install joi
const Joi = require('joi');

const customerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().allow('', null),
  email: Joi.string().email().allow('', null),
  address: Joi.string().allow('', null),
  customFields: Joi.object().optional()
});

exports.validateCustomer = (data) => customerSchema.validate(data); 