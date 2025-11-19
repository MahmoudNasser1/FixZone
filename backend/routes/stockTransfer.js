const express = require('express');
const router = express.Router();
const stockTransferController = require('../controllers/stockTransferController');
const { validate } = require('../middleware/validation');
const authMiddleware = require('../middleware/authMiddleware');
const Joi = require('joi');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation schemas
const createStockTransferSchema = Joi.object({
  fromWarehouseId: Joi.number().integer().required().messages({
    'number.base': 'معرف المخزن المرسل يجب أن يكون رقم',
    'any.required': 'معرف المخزن المرسل مطلوب'
  }),
  toWarehouseId: Joi.number().integer().required().messages({
    'number.base': 'معرف المخزن المستقبل يجب أن يكون رقم',
    'any.required': 'معرف المخزن المستقبل مطلوب'
  }),
  transferDate: Joi.date().required().messages({
    'date.base': 'تاريخ النقل يجب أن يكون تاريخ صحيح',
    'any.required': 'تاريخ النقل مطلوب'
  }),
  reason: Joi.string().max(255).allow('').optional(),
  notes: Joi.string().allow('').optional(),
  items: Joi.array().items(
    Joi.object({
      inventoryItemId: Joi.number().integer().required(),
      quantity: Joi.number().integer().min(1).required(),
      unitPrice: Joi.number().min(0).required(),
      notes: Joi.string().allow('').optional()
    })
  ).min(1).required().messages({
    'array.min': 'يجب إضافة عنصر واحد على الأقل',
    'any.required': 'عناصر النقل مطلوبة'
  }),
  createdBy: Joi.number().integer().optional().messages({
    'number.base': 'معرف المنشئ يجب أن يكون رقم'
  })
}).custom((value, helpers) => {
  if (value.fromWarehouseId === value.toWarehouseId) {
    return helpers.error('custom.sameWarehouse');
  }
  return value;
}).messages({
  'custom.sameWarehouse': 'المخزن المرسل والمستقبل يجب أن يكونا مختلفين'
});

// Schemas for approve/ship/receive - all fields optional, will use req.user.id in controller
const approveSchema = Joi.object({
  approvedBy: Joi.number().integer().optional().allow(null).messages({
    'number.base': 'معرف الموافق يجب أن يكون رقم'
    // سيتم استخدام req.user.id كـ fallback في controller
  })
}).unknown(false); // Allow empty object

const shipSchema = Joi.object({
  shippedBy: Joi.number().integer().optional().allow(null).messages({
    'number.base': 'معرف الشاحن يجب أن يكون رقم'
    // سيتم استخدام req.user.id كـ fallback في controller
  })
}).unknown(false); // Allow empty object

const receiveSchema = Joi.object({
  receivedBy: Joi.number().integer().optional().allow(null).messages({
    'number.base': 'معرف المستقبل يجب أن يكون رقم'
  })
}).unknown(false).custom((value, helpers) => {
  // إذا لم يتم إرسال receivedBy، سيتم استخدام req.user.id في controller
  return value;
});

// Routes
router.post('/', validate(createStockTransferSchema), stockTransferController.createStockTransfer);
router.get('/', stockTransferController.getStockTransfers);
router.get('/stats', stockTransferController.getStockTransferStats);
router.get('/:id', stockTransferController.getStockTransfer);
// Approve, ship, receive routes - validation done in controller (approvedBy/shippedBy/receivedBy optional, uses req.user.id)
router.put('/:id/approve', stockTransferController.approveStockTransfer);
router.put('/:id/ship', stockTransferController.shipStockTransfer);
router.put('/:id/receive', stockTransferController.receiveStockTransfer);
router.put('/:id/complete', stockTransferController.completeStockTransfer);
router.delete('/:id', stockTransferController.deleteStockTransfer);

module.exports = router;


