// Payments Controller
// Handles HTTP requests for Payments

const paymentsService = require('../../services/financial/payments.service');

class PaymentsController {
  /**
   * Get all payments
   * GET /api/financial/payments
   */
  async getAll(req, res) {
    try {
      const result = await paymentsService.getAll(req.query, {
        page: req.query.page || 1,
        limit: req.query.limit || 50
      }, req.user);

      res.json({
        success: true,
        message: 'Payments retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error in paymentsController.getAll:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving payments',
        error: error.message
      });
    }
  }

  /**
   * Get payment by ID
   * GET /api/financial/payments/:id
   */
  async getById(req, res) {
    try {
      const payment = await paymentsService.getById(req.params.id, req.user);

      res.json({
        success: true,
        message: 'Payment retrieved successfully',
        data: payment
      });
    } catch (error) {
      console.error('Error in paymentsController.getById:', error);
      const statusCode = error.message === 'Payment not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error retrieving payment',
        error: error.message
      });
    }
  }

  /**
   * Create new payment
   * POST /api/financial/payments
   */
  async create(req, res) {
    try {
      const payment = await paymentsService.create(req.body, req.user);

      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: payment
      });
    } catch (error) {
      console.error('Error in paymentsController.create:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error creating payment',
        error: error.message
      });
    }
  }

  /**
   * Get payments by invoice
   * GET /api/financial/payments/invoice/:invoiceId
   */
  async getByInvoice(req, res) {
    try {
      const result = await paymentsService.getByInvoice(req.params.invoiceId, req.user);

      res.json({
        success: true,
        message: 'Payments retrieved successfully',
        data: result.payments,
        summary: result.summary
      });
    } catch (error) {
      console.error('Error in paymentsController.getByInvoice:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving payments',
        error: error.message
      });
    }
  }

  /**
   * Get payment statistics
   * GET /api/financial/payments/stats/summary
   */
  async getStatsSummary(req, res) {
    try {
      const stats = await paymentsService.getStats(req.query, req.user);

      res.json({
        success: true,
        message: 'Payment statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error in paymentsController.getStatsSummary:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving payment statistics',
        error: error.message
      });
    }
  }

  /**
   * Get overdue payments
   * GET /api/financial/payments/overdue
   */
  async getOverdue(req, res) {
    try {
      const days = parseInt(req.query.days) || 0;
      const payments = await paymentsService.getOverdue(days, req.user);

      res.json({
        success: true,
        message: 'Overdue payments retrieved successfully',
        data: payments
      });
    } catch (error) {
      console.error('Error in paymentsController.getOverdue:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving overdue payments',
        error: error.message
      });
    }
  }
}

module.exports = new PaymentsController();


