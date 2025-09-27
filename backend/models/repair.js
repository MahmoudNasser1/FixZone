// backend/models/repair.js
// Install Joi: npm install joi
const Joi = require('joi');

const repairSchema = Joi.object({
  deviceId: Joi.number().integer().required(),
  reportedProblem: Joi.string().required(),
  technicianReport: Joi.string().allow('', null),
  status: Joi.string().required(),
  customerId: Joi.number().integer().required(),
  branchId: Joi.number().integer().required(),
  technicianId: Joi.number().integer().required(),
  quotationId: Joi.number().integer().allow(null),
  invoiceId: Joi.number().integer().allow(null),
  deviceBatchId: Joi.number().integer().allow(null),
  attachments: Joi.array().items(Joi.string()).optional(),
  customFields: Joi.object().optional()
});

exports.validateRepair = (data) => repairSchema.validate(data); 