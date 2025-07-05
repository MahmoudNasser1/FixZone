const express = require('express');
const router = express.Router();
const techniciansController = require('../controllers/technicians');

router.get('/', techniciansController.getAllTechnicians);
router.get('/:id', techniciansController.getTechnicianById);
router.post('/', techniciansController.createTechnician);
router.put('/:id', techniciansController.updateTechnician);
router.delete('/:id', techniciansController.deleteTechnician);

module.exports = router; 