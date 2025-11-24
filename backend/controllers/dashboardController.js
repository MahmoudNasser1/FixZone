const db = require('../db');

// Get statistics for the dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        // Get total number of repair requests (excluding deleted)
        const [totalRequests] = await db.execute(
            'SELECT COUNT(*) AS totalRequests FROM RepairRequest WHERE deletedAt IS NULL'
        );

        // Get number of requests by status
        const [requestsByStatus] = await db.execute(
            `SELECT status, COUNT(*) AS count 
             FROM RepairRequest 
             WHERE deletedAt IS NULL 
             GROUP BY status`
        );

        // Get number of received devices (if DeviceBatch table exists)
        let receivedDevices = 0;
        try {
            const [deviceBatchRows] = await db.execute('SELECT COUNT(*) AS receivedDevices FROM DeviceBatch WHERE deletedAt IS NULL');
            receivedDevices = deviceBatchRows[0]?.receivedDevices || 0;
        } catch (e) {
            // Table might not exist, use 0
            receivedDevices = 0;
        }

        // Get pending requests (status = 'pending' or 'in_progress')
        const [pendingRequests] = await db.execute(
            `SELECT COUNT(*) AS count 
             FROM RepairRequest 
             WHERE deletedAt IS NULL 
             AND status IN ('pending', 'in_progress', 'RECEIVED', 'DIAGNOSED')`
        );

        // Get completed requests
        const [completedRequests] = await db.execute(
            `SELECT COUNT(*) AS count 
             FROM RepairRequest 
             WHERE deletedAt IS NULL 
             AND status IN ('completed', 'COMPLETED', 'delivered', 'DELIVERED')`
        );

        // Get delayed repair requests (not delivered/rejected and older than 7 days)
        const [delayedRequests] = await db.execute(
            `SELECT id, reportedProblem, status, createdAt, technicianId
             FROM RepairRequest
             WHERE deletedAt IS NULL
             AND status NOT IN ('DELIVERED', 'REJECTED', 'delivered', 'rejected')
             AND createdAt < DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );

        // Get low stock inventory items
        const [lowStockItems] = await db.execute(
            `SELECT
                ii.id AS itemId,
                ii.name AS itemName,
                sl.quantity,
                sl.minLevel,
                w.id AS warehouseId,
                w.name AS warehouseName
             FROM StockLevel sl
             JOIN InventoryItem ii ON sl.inventoryItemId = ii.id
             JOIN Warehouse w ON sl.warehouseId = w.id
             WHERE sl.isLowStock = TRUE OR sl.quantity <= sl.minLevel`
        );

        // Get technician tasks (open repair requests assigned to technicians)
        const [technicianTasks] = await db.execute(
            `SELECT
                rr.id AS repairRequestId,
                rr.reportedProblem,
                rr.status,
                u.id AS technicianId,
                u.name AS technicianName
             FROM RepairRequest rr
             LEFT JOIN User u ON rr.technicianId = u.id
             LEFT JOIN Role r ON u.roleId = r.id
             WHERE rr.deletedAt IS NULL
             AND rr.status NOT IN ('DELIVERED', 'REJECTED', 'delivered', 'rejected', 'completed', 'COMPLETED')
             AND (r.name = 'technician' OR rr.technicianId IS NOT NULL)`
        );

        // Get today's stats
        const [todayStats] = await db.execute(
            `SELECT 
                COUNT(*) AS todayRepairs,
                COUNT(CASE WHEN status IN ('pending', 'in_progress', 'RECEIVED', 'DIAGNOSED') THEN 1 END) AS todayPending
             FROM RepairRequest
             WHERE deletedAt IS NULL
             AND DATE(createdAt) = CURDATE()`
        );

        // Get recent repairs count (last 7 days)
        const [recentStats] = await db.execute(
            `SELECT COUNT(*) AS recentRepairs
             FROM RepairRequest
             WHERE deletedAt IS NULL
             AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );

        res.json({
            success: true,
            data: {
                totalRequests: totalRequests[0]?.totalRequests || 0,
                pendingRequests: pendingRequests[0]?.count || 0,
                completedRequests: completedRequests[0]?.count || 0,
                requestsByStatus: requestsByStatus || [],
                receivedDevices: receivedDevices,
                delayedRequests: delayedRequests || [],
                delayedCount: delayedRequests.length || 0,
                lowStockItems: lowStockItems || [],
                lowStockCount: lowStockItems.length || 0,
                technicianTasks: technicianTasks || [],
                technicianTasksCount: technicianTasks.length || 0,
                todayStats: {
                    repairs: todayStats[0]?.todayRepairs || 0,
                    pending: todayStats[0]?.todayPending || 0
                },
                recentStats: {
                    repairs: recentStats[0]?.recentRepairs || 0
                }
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Failed to fetch dashboard statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Recent repairs for dashboard
exports.getRecentRepairs = async (req, res) => {
    try {
        const limitValue = parseInt(req.query.limit) || 10;
        const finalLimit = Math.floor(Math.max(1, Math.min(100, limitValue))) || 10;
        const [rows] = await db.execute(
            `SELECT 
                rr.id, 
                /* بعض السكيمات لا تحتوي على requestNumber، لذلك نستخدم id كبديل آمن */
                rr.id AS requestNumber,
                rr.reportedProblem, 
                rr.status, 
                rr.createdAt,
                c.id AS customerId,
                c.name AS customerName,
                c.phone AS customerPhone,
                COALESCE(vo.label, d.brand) as deviceBrand,
                d.model as deviceModel,
                d.deviceType
             FROM RepairRequest rr
             LEFT JOIN Customer c ON rr.customerId = c.id
             LEFT JOIN Device d ON rr.deviceId = d.id
             LEFT JOIN VariableOption vo ON d.brandId = vo.id
             WHERE rr.deletedAt IS NULL
             ORDER BY rr.createdAt DESC
             LIMIT ?`,
            [Number(finalLimit)]
        );
        res.json({
            success: true,
            data: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('Error fetching recent repairs:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Failed to fetch recent repairs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Alerts for dashboard (overdue and low stock)
exports.getAlerts = async (_req, res) => {
    try {
        const [delayedRequests] = await db.execute(
            `SELECT 
                id, 
                /* استخدام id كرقم الطلب لضمان التوافق مع السكيمات الحالية */
                id AS requestNumber,
                reportedProblem, 
                status, 
                createdAt, 
                technicianId,
                DATEDIFF(NOW(), createdAt) AS daysDelayed
             FROM RepairRequest
             WHERE deletedAt IS NULL
             AND status NOT IN ('DELIVERED', 'REJECTED', 'delivered', 'rejected', 'completed', 'COMPLETED')
             AND createdAt < DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );

        const [lowStockItems] = await db.execute(
            `SELECT 
                ii.id AS itemId,
                ii.name AS itemName, 
                sl.quantity, 
                sl.minLevel, 
                w.id AS warehouseId,
                w.name AS warehouseName,
                (sl.minLevel - sl.quantity) AS shortage
             FROM StockLevel sl
             JOIN InventoryItem ii ON sl.inventoryItemId = ii.id
             JOIN Warehouse w ON sl.warehouseId = w.id
             WHERE (sl.isLowStock = TRUE OR sl.quantity <= sl.minLevel)
             AND sl.quantity >= 0`
        );

        res.json({
            success: true,
            data: {
                delayedRequests: delayedRequests || [],
                delayedCount: delayedRequests.length || 0,
                lowStockItems: lowStockItems || [],
                lowStockCount: lowStockItems.length || 0,
                totalAlerts: (delayedRequests.length || 0) + (lowStockItems.length || 0)
            }
        });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Failed to fetch alerts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get customer statistics for customer dashboard
exports.getCustomerStats = async (req, res) => {
    try {
        // Get customerId from JWT token or query parameter
        const customerId = req.user?.customerId || req.user?.id || req.query.customerId;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'معرف العميل مطلوب',
                code: 'CUSTOMER_ID_REQUIRED'
            });
        }

        // Get repair statistics
        const [repairStats] = await db.execute(`
            SELECT 
                COUNT(*) as totalRepairs,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingRepairs,
                COUNT(CASE WHEN status IN ('in_progress', 'DIAGNOSED', 'RECEIVED') THEN 1 END) as activeRepairs,
                COUNT(CASE WHEN status IN ('completed', 'COMPLETED', 'delivered', 'DELIVERED') THEN 1 END) as completedRepairs,
                COUNT(CASE WHEN status IN ('cancelled', 'CANCELLED', 'rejected', 'REJECTED') THEN 1 END) as cancelledRepairs
            FROM RepairRequest
            WHERE customerId = ? AND deletedAt IS NULL
        `, [customerId]);

        // Get invoice statistics
        const [invoiceStats] = await db.execute(`
            SELECT 
                COUNT(*) as totalInvoices,
                COUNT(CASE WHEN status = 'pending' OR status = 'unpaid' THEN 1 END) as pendingInvoices,
                COUNT(CASE WHEN status = 'paid' THEN 1 END) as paidInvoices,
                COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdueInvoices,
                COALESCE(SUM(totalAmount), 0) as totalSpent,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN totalAmount ELSE 0 END), 0) as totalPaid,
                COALESCE(SUM(totalAmount - COALESCE(amountPaid, 0)), 0) as remainingBalance
            FROM Invoice
            WHERE customerId = ? AND deletedAt IS NULL
        `, [customerId]);

        // Get unique devices count (based on deviceType and brand combinations)
        const [deviceStats] = await db.execute(`
            SELECT COUNT(DISTINCT CONCAT(COALESCE(deviceType, ''), '-', COALESCE(deviceBrand, ''))) as totalDevices
            FROM RepairRequest
            WHERE customerId = ? AND deletedAt IS NULL
        `, [customerId]);

        const stats = repairStats[0] || {};
        const invoices = invoiceStats[0] || {};
        const devices = deviceStats[0] || {};

        res.json({
            success: true,
            data: {
                totalRepairs: stats.totalRepairs || 0,
                activeRepairs: stats.activeRepairs || 0,
                completedRepairs: stats.completedRepairs || 0,
                pendingRepairs: stats.pendingRepairs || 0,
                cancelledRepairs: stats.cancelledRepairs || 0,
                totalInvoices: invoices.totalInvoices || 0,
                pendingInvoices: invoices.pendingInvoices || 0,
                paidInvoices: invoices.paidInvoices || 0,
                overdueInvoices: invoices.overdueInvoices || 0,
                totalDevices: devices.totalDevices || 0,
                totalSpent: parseFloat(invoices.totalSpent) || 0,
                totalPaid: parseFloat(invoices.totalPaid) || 0,
                remainingBalance: parseFloat(invoices.remainingBalance) || 0
            }
        });

    } catch (error) {
        console.error('Error fetching customer stats:', error);
        res.status(500).json({
            success: false,
            message: 'حصل خطأ في السيرفر',
            code: 'SERVER_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
