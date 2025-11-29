// Invoices Controller
// Handles HTTP requests for Invoices

const invoicesService = require('../../services/financial/invoices.service');

class InvoicesController {
  /**
   * Get all invoices
   * GET /api/financial/invoices
   */
  async getAll(req, res) {
    try {
      const result = await invoicesService.getAll(req.query, {
        page: req.query.page || 1,
        limit: req.query.limit || 50
      }, req.user);

      res.json({
        success: true,
        message: 'Invoices retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error in invoicesController.getAll:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving invoices',
        error: error.message
      });
    }
  }

  /**
   * Get invoice by ID
   * GET /api/financial/invoices/:id
   */
  async getById(req, res) {
    try {
      const invoice = await invoicesService.getById(req.params.id, req.user);

      res.json({
        success: true,
        message: 'Invoice retrieved successfully',
        data: invoice
      });
    } catch (error) {
      console.error('Error in invoicesController.getById:', error);
      const statusCode = error.message === 'Invoice not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error retrieving invoice',
        error: error.message
      });
    }
  }

  /**
   * Create new invoice
   * POST /api/financial/invoices
   */
  async create(req, res) {
    try {
      const invoice = await invoicesService.create(req.body, req.user);

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice
      });
    } catch (error) {
      console.error('Error in invoicesController.create:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error creating invoice',
        error: error.message
      });
    }
  }

  /**
   * Create invoice from repair request
   * POST /api/financial/invoices/create-from-repair/:repairId
   */
  async createFromRepair(req, res) {
    try {
      const invoice = await invoicesService.createFromRepair(
        req.params.repairId,
        req.body,
        req.user
      );

      res.status(201).json({
        success: true,
        message: 'Invoice created from repair request successfully',
        data: invoice
      });
    } catch (error) {
      console.error('Error in invoicesController.createFromRepair:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error creating invoice from repair',
        error: error.message
      });
    }
  }

  /**
   * Get invoice statistics
   * GET /api/financial/invoices/stats
   */
  async getStats(req, res) {
    try {
      const stats = await invoicesService.getStats(req.query, req.user);

      res.json({
        success: true,
        message: 'Invoice statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error in invoicesController.getStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving invoice statistics',
        error: error.message
      });
    }
  }

  /**
   * Get overdue invoices
   * GET /api/financial/invoices/overdue
   */
  async getOverdue(req, res) {
    try {
      const invoices = await invoicesService.getOverdue(req.user);

      res.json({
        success: true,
        message: 'Overdue invoices retrieved successfully',
        data: invoices
      });
    } catch (error) {
      console.error('Error in invoicesController.getOverdue:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving overdue invoices',
        error: error.message
      });
    }
  }

  /**
   * Get invoice by repair request ID
   * GET /api/financial/invoices/by-repair/:repairId
   */
  async getByRepair(req, res) {
    try {
      const result = await invoicesService.getAll(
        { repairRequestId: req.params.repairId },
        { page: 1, limit: 1 },
        req.user
      );

      if (result.data.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found for this repair request'
        });
      }

      res.json({
        success: true,
        message: 'Invoice retrieved successfully',
        data: result.data[0]
      });
    } catch (error) {
      console.error('Error in invoicesController.getByRepair:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving invoice',
        error: error.message
      });
    }
  }
}

module.exports = new InvoicesController();

