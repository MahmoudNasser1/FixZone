const db = require('../db');

// Simplified Invoice Controller - Basic functionality only
class InvoicesControllerSimple {
  
  // Get all invoices - simplified version
  async getAllInvoices(req, res) {
    try {
      const query = `
        SELECT 
          i.id,
          i.totalAmount,
          i.status,
          i.createdAt,
          CONCAT(c.firstName, ' ', c.lastName) as customerName,
          c.phone as customerPhone,
          c.email as customerEmail,
          d.deviceBrand,
          d.deviceModel
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Customer c ON rr.customerId = c.id
        LEFT JOIN Device d ON rr.deviceId = d.id
        WHERE i.deletedAt IS NULL
        ORDER BY i.createdAt DESC
        LIMIT 50
      `;
      
      const [invoices] = await db.query(query);
      
      res.json({
        success: true,
        data: invoices,
        total: invoices.length
      });
      
    } catch (error) {
      console.error('Error in getAllInvoices:', error);
      res.status(500).json({
        success: false,
        error: 'Server error',
        details: error.message
      });
    }
  }

  // Get invoice statistics - simplified version
  async getInvoiceStats(req, res) {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
          SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue,
          SUM(totalAmount) as totalRevenue
        FROM Invoice 
        WHERE deletedAt IS NULL
      `;
      
      const [stats] = await db.query(statsQuery);
      
      res.json({
        success: true,
        data: stats[0] || {
          total: 0,
          draft: 0,
          sent: 0,
          paid: 0,
          overdue: 0,
          totalRevenue: 0
        }
      });
      
    } catch (error) {
      console.error('Error in getInvoiceStats:', error);
      res.status(500).json({
        success: false,
        error: 'Server error',
        details: error.message
      });
    }
  }

  // Create a new invoice - minimal required fields
  async createInvoice(req, res) {
    try {
      const { repairRequestId, totalAmount, status = 'draft', currency = 'EGP', taxAmount = 0 } = req.body;

      if (totalAmount === undefined || isNaN(Number(totalAmount))) {
        return res.status(400).json({ success: false, message: 'totalAmount is required and must be a number' });
      }

      let customerId = null;
      
      // Validate RepairRequest if provided and get customerId
      if (repairRequestId) {
        const [rr] = await db.query('SELECT id, customerId FROM RepairRequest WHERE id = ?', [repairRequestId]);
        if (rr.length === 0) {
          return res.status(404).json({ success: false, message: 'RepairRequest not found' });
        }
        customerId = rr[0].customerId;
      }

      // Generate invoice number and dates
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const issueDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days from now
      
      const [result] = await db.query(
        `INSERT INTO Invoice (invoiceNumber, totalAmount, status, repairRequestId, customerId, currency, taxAmount, finalAmount, issueDate, dueDate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoiceNumber, totalAmount, status, repairRequestId || null, customerId, currency, taxAmount, totalAmount, issueDate, dueDate]
      );

      return res.status(201).json({ success: true, id: result.insertId });
    } catch (error) {
      console.error('Error in createInvoice:', error);
      return res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  async getInvoiceById(req, res) {
    try {
      const { id } = req.params;
      
      const [rows] = await db.query(`
        SELECT 
          i.*,
          CONCAT(c.firstName, ' ', c.lastName) as customerName,
          c.phone as customerPhone,
          c.email as customerEmail
        FROM Invoice i
        LEFT JOIN Customer c ON i.customerId = c.id
        WHERE i.id = ? AND i.deletedAt IS NULL
      `, [id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Invoice not found' 
        });
      }
      
      return res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error in getInvoiceById:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Server error', 
        details: error.message 
      });
    }
  }
}

module.exports = new InvoicesControllerSimple();
