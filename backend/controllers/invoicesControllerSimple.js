const db = require('../db');

// Simplified Invoice Controller - Basic functionality only
class InvoicesControllerSimple {
  
  // Get all invoices - simplified version
  async getAllInvoices(req, res) {
    try {
      const query = `
        SELECT 
          i.id,
          i.invoiceNumber,
          i.totalAmount,
          i.status,
          i.issueDate,
          i.dueDate,
          CONCAT(c.firstName, ' ', c.lastName) as customerName,
          c.phone as customerPhone,
          c.email as customerEmail,
          rr.deviceModel,
          rr.deviceBrand,
          rr.issueDescription as problemDescription
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Customer c ON rr.customerId = c.id
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
}

module.exports = new InvoicesControllerSimple();
