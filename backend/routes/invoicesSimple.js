const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoicesControllerSimple');
const { validate, invoiceSchemas, commonSchemas } = require('../middleware/validation');
const authMiddleware = require('../middleware/authMiddleware');
const Joi = require('joi');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /api/invoices - Get all invoices
router.get('/', validate(invoiceSchemas.getInvoices, 'query'), invoicesController.getAllInvoices);

// GET /api/invoices/stats - Get invoice statistics
router.get('/stats', invoicesController.getInvoiceStats);

// Repair-related invoice routes (MUST come before /:id routes)
router.get('/by-repair/:repairId', validate(Joi.object({ repairId: commonSchemas.id }), 'params'), invoicesController.getInvoiceByRepairId);
router.post('/create-from-repair/:repairId', validate(Joi.object({ repairId: commonSchemas.id }), 'params'), invoicesController.createInvoiceFromRepair);

// GET /api/invoices/:id - Get single invoice by ID
router.get('/:id', validate(Joi.object({ id: commonSchemas.id }), 'params'), invoicesController.getInvoiceById);

// POST /api/invoices - Create new invoice
router.post('/', validate(invoiceSchemas.createInvoice), invoicesController.createInvoice);

// PUT /api/invoices/:id - Update invoice
router.put('/:id', validate(Joi.object({ id: commonSchemas.id }), 'params'), validate(invoiceSchemas.updateInvoice, 'body'), invoicesController.updateInvoice);

// DELETE /api/invoices/:id - Delete invoice
router.delete('/:id', validate(Joi.object({ id: commonSchemas.id }), 'params'), invoicesController.deleteInvoice);

// POST /api/invoices/:id/recalculate - Recalculate invoice totalAmount from items
router.post('/:id/recalculate', validate(Joi.object({ id: commonSchemas.id }), 'params'), async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../db');
    
    // Recalculate totalAmount from InvoiceItems
    const [itemsTotal] = await db.execute(`
      SELECT COALESCE(SUM(totalPrice), 0) as calculatedTotal
      FROM InvoiceItem 
      WHERE invoiceId = ?
    `, [id]);
    
    const calculatedTotal = Number(itemsTotal[0]?.calculatedTotal || 0);
    
    // Update invoice totalAmount
    await db.execute(`
      UPDATE Invoice SET totalAmount = ?, updatedAt = NOW() WHERE id = ?
    `, [calculatedTotal, id]);
    
    res.json({
      success: true,
      message: 'تم إعادة حساب المجموع بنجاح',
      data: {
        invoiceId: id,
        oldTotal: null, // We don't fetch it to avoid extra query
        newTotal: calculatedTotal
      }
    });
  } catch (error) {
    console.error('Error recalculating invoice total:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: error.message
    });
  }
});

// Invoice Items routes
router.get('/:id/items', validate(Joi.object({ id: commonSchemas.id }), 'params'), invoicesController.getInvoiceItems);
router.post('/:id/items', validate(Joi.object({ id: commonSchemas.id }), 'params'), validate(invoiceSchemas.addInvoiceItem, 'body'), invoicesController.addInvoiceItem);
router.put('/:id/items/:itemId', validate(Joi.object({ id: commonSchemas.id, itemId: commonSchemas.id }), 'params'), validate(invoiceSchemas.updateInvoiceItem, 'body'), invoicesController.updateInvoiceItem);
router.delete('/:id/items/:itemId', validate(Joi.object({ id: commonSchemas.id, itemId: commonSchemas.id }), 'params'), invoicesController.removeInvoiceItem);

module.exports = router;
