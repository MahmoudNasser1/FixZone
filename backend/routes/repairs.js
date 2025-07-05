const express = require('express');
const router = express.Router();
const repairsController = require('../controllers/repairs');

router.get('/', repairsController.getAllRepairs);
router.get('/:id', repairsController.getRepairById);
router.post('/', repairsController.createRepair);
router.put('/:id', repairsController.updateRepair);
router.delete('/:id', repairsController.deleteRepair);
router.patch('/:id/status', repairsController.updateRepairStatus);

module.exports = router; 