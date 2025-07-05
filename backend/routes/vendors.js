const express = require('express');
const router = express.Router();
const vendorsController = require('../controllers/vendors');

router.get('/', vendorsController.getAllVendors);
router.get('/:id', vendorsController.getVendorById);
router.post('/', vendorsController.createVendor);
router.put('/:id', vendorsController.updateVendor);
router.delete('/:id', vendorsController.deleteVendor);

module.exports = router; 