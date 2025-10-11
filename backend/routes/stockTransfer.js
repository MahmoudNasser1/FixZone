const express = require('express');
const router = express.Router();
const stockTransferController = require('../controllers/stockTransferController');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

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
  createdBy: Joi.number().integer().required().messages({
    'number.base': 'معرف المنشئ يجب أن يكون رقم',
    'any.required': 'معرف المنشئ مطلوب'
  })
}).custom((value, helpers) => {
  if (value.fromWarehouseId === value.toWarehouseId) {
    return helpers.error('custom.sameWarehouse');
  }
  return value;
}).messages({
  'custom.sameWarehouse': 'المخزن المرسل والمستقبل يجب أن يكونا مختلفين'
});

const approveSchema = Joi.object({
  approvedBy: Joi.number().integer().required().messages({
    'number.base': 'معرف الموافق يجب أن يكون رقم',
    'any.required': 'معرف الموافق مطلوب'
  })
});

const shipSchema = Joi.object({
  shippedBy: Joi.number().integer().required().messages({
    'number.base': 'معرف الشاحن يجب أن يكون رقم',
    'any.required': 'معرف الشاحن مطلوب'
  })
});

const receiveSchema = Joi.object({
  receivedBy: Joi.number().integer().required().messages({
    'number.base': 'معرف المستقبل يجب أن يكون رقم',
    'any.required': 'معرف المستقبل مطلوب'
  })
});

// Routes
router.post('/', validate(createStockTransferSchema), stockTransferController.createStockTransfer);
router.get('/', stockTransferController.getStockTransfers);
router.get('/stats', stockTransferController.getStockTransferStats);
router.get('/:id', stockTransferController.getStockTransfer);
router.put('/:id/approve', validate(approveSchema), stockTransferController.approveStockTransfer);
router.put('/:id/ship', validate(shipSchema), stockTransferController.shipStockTransfer);
router.put('/:id/receive', validate(receiveSchema), stockTransferController.receiveStockTransfer);
router.put('/:id/complete', stockTransferController.completeStockTransfer);
router.delete('/:id', stockTransferController.deleteStockTransfer);

module.exports = router;


