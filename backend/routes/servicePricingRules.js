const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const {
  getServicePricingRules,
  getPricingRuleById,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  calculatePrice
} = require('../controllers/servicePricingRulesController');

// Calculate price - All authenticated users
router.get('/:serviceId/calculate', auth, calculatePrice);

// Get all pricing rules for a service - All authenticated users
router.get('/service/:serviceId', auth, getServicePricingRules);

// Get pricing rule by ID - All authenticated users
router.get('/:id', auth, getPricingRuleById);

// Create pricing rule - Admin only
router.post('/', auth, authorize([1]), createPricingRule);

// Update pricing rule - Admin only
router.put('/:id', auth, authorize([1]), updatePricingRule);

// Delete pricing rule - Admin only
router.delete('/:id', auth, authorize([1]), deletePricingRule);

module.exports = router;
