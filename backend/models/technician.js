// backend/models/technician.js
// Install Joi: npm install joi
const Joi = require('joi');

const technicianSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().allow('', null),
  isActive: Joi.boolean().optional()
});

exports.validateTechnician = (data) => technicianSchema.validate(data); 