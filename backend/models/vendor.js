// backend/models/vendor.js
// Install Joi: npm install joi
const Joi = require('joi');

const vendorSchema = Joi.object({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().allow('', null)
});

exports.validateVendor = (data) => vendorSchema.validate(data); 