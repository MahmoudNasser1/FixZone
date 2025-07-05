const db = require('../db');

exports.getSummaryReport = async (req, res) => {
  try {
    // Devices received
    const [received] = await db.query("SELECT COUNT(*) as count FROM RepairRequest WHERE status='RECEIVED' AND deletedAt IS NULL");
    // Under repair
    const [underRepair] = await db.query("SELECT COUNT(*) as count FROM RepairRequest WHERE status='UNDER_REPAIR' AND deletedAt IS NULL");
    // Delivered
    const [delivered] = await db.query("SELECT COUNT(*) as count FROM RepairRequest WHERE status='DELIVERED' AND deletedAt IS NULL");
    // Overdue (example: status not delivered and createdAt older than 7 days)
    const [overdue] = await db.query("SELECT COUNT(*) as count FROM RepairRequest WHERE status!='DELIVERED' AND createdAt < DATE_SUB(NOW(), INTERVAL 7 DAY) AND deletedAt IS NULL");
    // Low stock (StockLevel.quantity < StockLevel.minLevel)
    const [lowStock] = await db.query("SELECT COUNT(*) as count FROM StockLevel WHERE quantity < minLevel");
    res.json({
      devicesReceived: received[0].count,
      underRepair: underRepair[0].count,
      delivered: delivered[0].count,
      overdueDevices: overdue[0].count,
      lowStockItems: lowStock[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getInventoryReport = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT ii.*, sl.quantity, sl.minLevel, sl.warehouseId FROM InventoryItem ii LEFT JOIN StockLevel sl ON ii.id = sl.inventoryItemId WHERE ii.deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 