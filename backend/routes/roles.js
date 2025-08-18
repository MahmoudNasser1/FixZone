const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const rolesController = require('../controllers/rolesController');

// Role Management Routes (Admin Only)
router.get('/', auth, authorize([1]), rolesController.listRoles);
router.get('/:id', auth, authorize([1]), rolesController.getRole);
router.post('/', auth, authorize([1]), rolesController.createRole);
router.put('/:id', auth, authorize([1]), rolesController.updateRole);
router.delete('/:id', auth, authorize([1]), rolesController.deleteRole);

module.exports = router;
