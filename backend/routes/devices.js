const express = require('express');
const router = express.Router();
const devicesController = require('../controllers/devices');

router.get('/', devicesController.getAllDevices);
router.get('/:id', devicesController.getDeviceById);
router.post('/', devicesController.createDevice);
router.put('/:id', devicesController.updateDevice);
router.delete('/:id', devicesController.deleteDevice);

module.exports = router; 