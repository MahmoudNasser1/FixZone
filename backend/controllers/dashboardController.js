const db = require('../db');

// Get statistics for the dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        // Example: Get total number of repair requests
        const [totalRequests] = await db.query('SELECT COUNT(*) AS totalRequests FROM RepairRequest');

        // Example: Get number of requests by status
        const [requestsByStatus] = await db.query('SELECT status, COUNT(*) AS count FROM RepairRequest GROUP BY status');

        // Example: Get number of received devices
        const [receivedDevices] = await db.query('SELECT COUNT(*) AS receivedDevices FROM DeviceBatch');

        // Get delayed repair requests (e.g., status not delivered/rejected and older than 7 days)
        const [delayedRequests] = await db.query(
            `SELECT id, reportedProblem, status, createdAt, technicianId
             FROM RepairRequest
             WHERE status NOT IN ('DELIVERED', 'REJECTED')
             AND createdAt < NOW() - INTERVAL 7 DAY`
        );

        // Get low stock inventory items
        const [lowStockItems] = await db.query(
            `SELECT
                ii.name AS itemName,
                sl.quantity,
                sl.minLevel,
                w.name AS warehouseName
             FROM StockLevel sl
             JOIN InventoryItem ii ON sl.inventoryItemId = ii.id
             JOIN Warehouse w ON sl.warehouseId = w.id
             WHERE sl.isLowStock = TRUE`
        );

        // Get technician tasks (open repair requests assigned to technicians)
        const [technicianTasks] = await db.query(
            `SELECT
                rr.id AS repairRequestId,
                rr.reportedProblem,
                rr.status,
                u.name AS technicianName
             FROM RepairRequest rr
             JOIN User u ON rr.technicianId = u.id
             JOIN Role r ON u.roleId = r.id
             WHERE r.name = 'technician' -- Assuming 'technician' is the role name for technicians
             AND rr.status NOT IN ('DELIVERED', 'REJECTED')`
        );

        res.json({
            totalRequests: totalRequests[0].totalRequests,
            requestsByStatus,
            receivedDevices: receivedDevices[0].receivedDevices,
            delayedRequests,
            lowStockItems,
            technicianTasks
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Recent repairs for dashboard
exports.getRecentRepairs = async (req, res) => {
    try {
        const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
        const [rows] = await db.query(
            `SELECT rr.id, rr.reportedProblem, rr.status, rr.createdAt,
                    c.name AS customerName,
                    COALESCE(vo.label, d.brand) as deviceBrand,
                    d.model as deviceModel
             FROM RepairRequest rr
             LEFT JOIN Customer c ON rr.customerId = c.id
             LEFT JOIN Device d ON rr.deviceId = d.id
             LEFT JOIN VariableOption vo ON d.brandId = vo.id
             WHERE rr.deletedAt IS NULL
             ORDER BY rr.createdAt DESC
             LIMIT ?`,
            [limit]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching recent repairs:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Alerts for dashboard (overdue and low stock)
exports.getAlerts = async (_req, res) => {
    try {
        const [delayedRequests] = await db.query(
            `SELECT id, reportedProblem, status, createdAt, technicianId
             FROM RepairRequest
             WHERE status NOT IN ('DELIVERED', 'REJECTED')
             AND createdAt < NOW() - INTERVAL 7 DAY
             AND deletedAt IS NULL`
        );
        const [lowStockItems] = await db.query(
            `SELECT ii.name AS itemName, sl.quantity, sl.minLevel, w.name AS warehouseName
             FROM StockLevel sl
             JOIN InventoryItem ii ON sl.inventoryItemId = ii.id
             JOIN Warehouse w ON sl.warehouseId = w.id
             WHERE sl.isLowStock = TRUE`
        );
        res.json({ delayedRequests, lowStockItems });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
