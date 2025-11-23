const db = require('../db');

// Get customer devices (extracted from repair requests)
exports.getCustomerDevices = async (req, res) => {
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

        // Get unique devices from repair requests with their last repair info
        const devicesQuery = `
            SELECT 
                d.id,
                d.deviceType,
                COALESCE(vo.label, d.brand) as brand,
                d.model,
                d.serialNumber,
                COUNT(rr.id) as totalRepairs,
                MAX(rr.createdAt) as lastRepairDate,
                MAX(CASE WHEN rr.status IN ('in_progress', 'UNDER_REPAIR', 'RECEIVED', 'DIAGNOSED') THEN 'in_repair' ELSE 'completed' END) as status
            FROM Device d
            LEFT JOIN VariableOption vo ON d.brandId = vo.id
            LEFT JOIN RepairRequest rr ON d.id = rr.deviceId AND rr.deletedAt IS NULL
            WHERE d.customerId = ? AND d.deletedAt IS NULL
            GROUP BY d.id, d.deviceType, COALESCE(vo.label, d.brand), d.model, d.serialNumber
            ORDER BY MAX(rr.createdAt) DESC
        `;

        const [devices] = await db.execute(devicesQuery, [customerId]);

        res.json({
            success: true,
            data: {
                devices: devices.map(device => ({
                    id: device.id,
                    deviceType: device.deviceType || 'غير محدد',
                    brand: device.brand || 'غير محدد',
                    model: device.model || 'غير محدد',
                    serialNumber: device.serialNumber || null,
                    totalRepairs: device.totalRepairs || 0,
                    lastRepairDate: device.lastRepairDate || null,
                    status: device.status || 'completed'
                }))
            }
        });

    } catch (error) {
        console.error('Error fetching customer devices:', error);
        res.status(500).json({
            success: false,
            message: 'حصل خطأ في السيرفر',
            code: 'SERVER_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
