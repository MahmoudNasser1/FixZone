const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');
const rolesController = require('../controllers/rolesController');

// Role Management Routes (Admin Only)
router.get('/', authMiddleware, authorizeMiddleware([1]), rolesController.listRoles);
router.get('/:id', authMiddleware, authorizeMiddleware([1]), rolesController.getRole);
router.post('/', authMiddleware, authorizeMiddleware([1]), rolesController.createRole);
router.put('/:id', authMiddleware, authorizeMiddleware([1]), rolesController.updateRole);
router.delete('/:id', authMiddleware, authorizeMiddleware([1]), rolesController.deleteRole);

module.exports = router;
