const express = require('express');
const router = express.Router();
const stockCountController = require('../controllers/stockCountController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation schemas
const createStockCountSchema = Joi.object({
  warehouseId: Joi.number().integer().required().messages({
    'number.base': 'معرف المخزن يجب أن يكون رقم',
    'any.required': 'معرف المخزن مطلوب'
  }),
  countDate: Joi.date().required().messages({
    'date.base': 'تاريخ الجرد يجب أن يكون تاريخ صحيح',
    'any.required': 'تاريخ الجرد مطلوب'
  }),
  type: Joi.string().valid('full', 'partial', 'cycle', 'spot').optional().messages({
    'any.only': 'النوع يجب أن يكون: full, partial, cycle, أو spot'
  }),
  notes: Joi.string().allow('').optional(),
  countedBy: Joi.number().integer().required().messages({
    'number.base': 'معرف القائم بالجرد يجب أن يكون رقم',
    'any.required': 'معرف القائم بالجرد مطلوب'
  })
});

const addStockCountItemSchema = Joi.object({
  inventoryItemId: Joi.number().integer().required().messages({
    'number.base': 'معرف الصنف يجب أن يكون رقم',
    'any.required': 'معرف الصنف مطلوب'
  }),
  countedQuantity: Joi.number().integer().min(0).required().messages({
    'number.base': 'الكمية المعدودة يجب أن تكون رقم',
    'number.min': 'الكمية المعدودة يجب أن تكون أكبر من أو تساوي 0',
    'any.required': 'الكمية المعدودة مطلوبة'
  }),
  notes: Joi.string().allow('').optional()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('scheduled', 'in_progress', 'pending_review', 'approved', 'completed', 'cancelled').required().messages({
    'any.only': 'الحالة يجب أن تكون واحدة من: scheduled, in_progress, pending_review, approved, completed, cancelled',
    'any.required': 'الحالة مطلوبة'
  }),
  reviewedBy: Joi.number().integer().optional(),
  approvedBy: Joi.number().integer().optional(),
  adjustedBy: Joi.number().integer().optional()
});

// Routes
router.post('/', validate(createStockCountSchema), stockCountController.createStockCount);
router.get('/', stockCountController.getStockCounts);
router.get('/stats', stockCountController.getStockCountStats);
router.get('/:id', stockCountController.getStockCount);
router.post('/:id/items', validate(addStockCountItemSchema), stockCountController.addStockCountItem);
router.put('/:id/status', validate(updateStatusSchema), stockCountController.updateStockCountStatus);
router.delete('/:id', stockCountController.deleteStockCount);

module.exports = router;

