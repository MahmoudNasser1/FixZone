const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware
router.use(authMiddleware);

// Helper to ensure user is a customer
const ensureCustomer = (req, res, next) => {
    if (req.user.type !== 'customer' && !req.user.customerId) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Customers only.'
        });
    }
    next();
};

router.use(ensureCustomer);

// GET /api/customer/notifications
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, unreadOnly, type } = req.query;

        let query = 'SELECT * FROM Notification WHERE userId = ?';
        const params = [userId];

        if (unreadOnly === 'true') {
            query += ' AND isRead = 0';
        }

        // Filter by notification type
        if (type && type !== 'all') {
            query += ' AND type = ?';
            params.push(type);
        }

        query += ' ORDER BY createdAt DESC';

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        // CRITICAL: Use db.query instead of db.execute for queries with LIMIT/OFFSET
        // db.execute uses prepared statements which cause issues with LIMIT/OFFSET in MariaDB strict mode
        // db.query interpolates values directly and works perfectly with LIMIT/OFFSET
        const [notifications] = await db.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM Notification WHERE userId = ?';
        const countParams = [userId];

        if (unreadOnly === 'true') {
            countQuery += ' AND isRead = 0';
        }

        if (type && type !== 'all') {
            countQuery += ' AND type = ?';
            countParams.push(type);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        // Get unread count
        const [unreadResult] = await db.execute(
            'SELECT COUNT(*) as unread FROM Notification WHERE userId = ? AND isRead = 0',
            [userId]
        );

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                },
                unreadCount: unreadResult[0].unread
            }
        });

    } catch (error) {
        console.error('Error fetching customer notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            code: 'SERVER_ERROR'
        });
    }
});

// PUT /api/customer/notifications/:id/read
router.put('/:id/read', async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;

        const [result] = await db.execute(
            'UPDATE Notification SET isRead = 1, updatedAt = NOW() WHERE id = ? AND userId = ?',
            [notificationId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            code: 'SERVER_ERROR'
        });
    }
});

// PUT /api/customer/notifications/read-all
router.put('/read-all', async (req, res) => {
    try {
        const userId = req.user.id;

        await db.execute(
            'UPDATE Notification SET isRead = 1, updatedAt = NOW() WHERE userId = ? AND isRead = 0',
            [userId]
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });

    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            code: 'SERVER_ERROR'
        });
    }
});

// DELETE /api/customer/notifications/:id
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;

        const [result] = await db.execute(
            'DELETE FROM Notification WHERE id = ? AND userId = ?',
            [notificationId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted'
        });

    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            code: 'SERVER_ERROR'
        });
    }
});

module.exports = router;
