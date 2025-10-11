const express = require('express');
const router = express.Router();
const itemVendorController = require('../controllers/itemVendorController');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// Validation schemas
const addItemVendorSchema = Joi.object({
  vendorId: Joi.number().integer().required().messages({
    'number.base': 'معرف المورد يجب أن يكون رقم',
    'any.required': 'معرف المورد مطلوب'
  }),
  isPrimary: Joi.boolean().optional(),
  price: Joi.number().min(0).optional().messages({
    'number.base': 'السعر يجب أن يكون رقم',
    'number.min': 'السعر يجب أن يكون أكبر من أو يساوي 0'
  }),
  leadTime: Joi.number().integer().min(1).optional().messages({
    'number.base': 'مدة التوصيل يجب أن تكون رقم',
    'number.min': 'مدة التوصيل يجب أن تكون يوم واحد على الأقل'
  })
});

const updateItemVendorSchema = Joi.object({
  isPrimary: Joi.boolean().optional(),
  price: Joi.number().min(0).optional(),
  leadTime: Joi.number().integer().min(1).optional()
});

// Routes - مسجلة تحت /api/inventory/:itemId/vendors
router.get('/:itemId/vendors', itemVendorController.getItemVendors);
router.post('/:itemId/vendors', validate(addItemVendorSchema), itemVendorController.addItemVendor);
router.delete('/:itemId/vendors/:vendorId', itemVendorController.removeItemVendor);
router.put('/:itemId/vendors/:vendorId/set-primary', itemVendorController.setPrimaryVendor);
router.put('/:itemId/vendors/:vendorId', validate(updateItemVendorSchema), itemVendorController.updateItemVendor);

module.exports = router;
