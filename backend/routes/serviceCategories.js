const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const {
  getServiceCategories,
  getServiceCategoryById,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  getCategoryStats
} = require('../controllers/serviceCategoriesController');

// Get all categories - All authenticated users
router.get('/', auth, getServiceCategories);

// Get category by ID - All authenticated users
router.get('/:id', auth, getServiceCategoryById);

// Get category statistics - All authenticated users
router.get('/stats/summary', auth, getCategoryStats);

// Create category - Admin only
router.post('/', auth, authorize([1]), createServiceCategory);

// Update category - Admin only
router.put('/:id', auth, authorize([1]), updateServiceCategory);

// Delete category - Admin only
router.delete('/:id', auth, authorize([1]), deleteServiceCategory);

module.exports = router;


const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const {
  getServiceCategories,
  getServiceCategoryById,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  getCategoryStats
} = require('../controllers/serviceCategoriesController');

// Get all categories - All authenticated users
router.get('/', auth, getServiceCategories);

// Get category by ID - All authenticated users
router.get('/:id', auth, getServiceCategoryById);

// Get category statistics - All authenticated users
router.get('/stats/summary', auth, getCategoryStats);

// Create category - Admin only
router.post('/', auth, authorize([1]), createServiceCategory);

// Update category - Admin only
router.put('/:id', auth, authorize([1]), updateServiceCategory);

// Delete category - Admin only
router.delete('/:id', auth, authorize([1]), deleteServiceCategory);

module.exports = router;


const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const {
  getServiceCategories,
  getServiceCategoryById,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  getCategoryStats
} = require('../controllers/serviceCategoriesController');

// Get all categories - All authenticated users
router.get('/', auth, getServiceCategories);

// Get category by ID - All authenticated users
router.get('/:id', auth, getServiceCategoryById);

// Get category statistics - All authenticated users
router.get('/stats/summary', auth, getCategoryStats);

// Create category - Admin only
router.post('/', auth, authorize([1]), createServiceCategory);

// Update category - Admin only
router.put('/:id', auth, authorize([1]), updateServiceCategory);

// Delete category - Admin only
router.delete('/:id', auth, authorize([1]), deleteServiceCategory);

module.exports = router;


const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const {
  getServiceCategories,
  getServiceCategoryById,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  getCategoryStats
} = require('../controllers/serviceCategoriesController');

// Get all categories - All authenticated users
router.get('/', auth, getServiceCategories);

// Get category by ID - All authenticated users
router.get('/:id', auth, getServiceCategoryById);

// Get category statistics - All authenticated users
router.get('/stats/summary', auth, getCategoryStats);

// Create category - Admin only
router.post('/', auth, authorize([1]), createServiceCategory);

// Update category - Admin only
router.put('/:id', auth, authorize([1]), updateServiceCategory);

// Delete category - Admin only
router.delete('/:id', auth, authorize([1]), deleteServiceCategory);

module.exports = router;


