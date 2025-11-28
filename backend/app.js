const express = require('express');
const cors = require('cors');
const router = express.Router();
const cookieParser = require('cookie-parser');

// Enable CORS for all routes
// Note: CORS is also configured in server.js, but we keep this for route-level control
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : (process.env.NODE_ENV === 'production' 
      ? ['https://system.fixzzone.com', 'https://fixzzone.com', 'https://www.fixzzone.com']
      : ['http://localhost:4000', 'http://localhost:3000', 'https://system.fixzzone.com']);

router.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
      callback(null, true);
    } else {
      // In development, allow localhost
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Auth-Token']
}));

const db = require('./db');
const path = require('path');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

router.use(express.json());
router.use(cookieParser());

// إضافة middleware للتشخيص
router.use((req, res, next) => {
  if (req.url.includes('/repairs') && req.method === 'POST') {
    console.log('=== REPAIR REQUEST DEBUG ===');
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body keys:', Object.keys(req.body || {}));
    console.log('Accessories in body:', req.body?.accessories);
    console.log('============================');
  }
  next();
});



// Import routes
const customerRoutes = require('./routes/customers');
const companyRoutes = require('./routes/companiesSimple');
const deviceRoutes = require('./routes/devices');
const repairRoutes = require('./routes/repairs');
const repairSimpleRoutes = require('./routes/repairsSimple');
const repairApprovalsRouter = require('./routes/repairsApprovals');
const techniciansRouter = require('./routes/technicians');
const technicianRoutes = require('./routes/technicianRoutes');
const inventoryRoutes = require('./routes/inventory');
const vendorRoutes = require('./routes/vendors');
const reportRoutes = require('./routes/reports');
const stockMovementsRouter = require('./routes/stockMovements');
const stockAlertsRouter = require('./routes/stockAlerts');
const workflowIntegrationRouter = require('./routes/workflowIntegration');
const inventoryIntegrationRouter = require('./routes/inventoryIntegration');
const financialIntegrationRouter = require('./routes/financialIntegration');
const citiesRouter = require('./routes/cities');
const branchesRouter = require('./routes/branches');
const rolesRouter = require('./routes/roles');
const usersRouter = require('./routes/users');
const purchaseOrdersRouter = require('./routes/purchaseOrders');
const purchaseOrderItemsRouter = require('./routes/purchaseOrderItems');
const partsUsedRouter = require('./routes/partsUsed');
const invoicesRouter = require('./routes/invoicesSimple');
const invoiceItemsRouter = require('./routes/invoiceItems');
const paymentsRouter = require('./routes/payments');
const expenseCategoriesRouter = require('./routes/expenseCategories');
const expensesRouter = require('./routes/expenses');
const servicesRouter = require('./routes/servicesSimple');
const serviceCategoriesRouter = require('./routes/serviceCategories');
const servicePricingRulesRouter = require('./routes/servicePricingRules');
const repairRequestServicesRouter = require('./routes/repairRequestServices');
const inspectionTypesRouter = require('./routes/inspectionTypes');
const inspectionReportsRouter = require('./routes/inspectionReports');
const inspectionComponentsRouter = require('./routes/inspectionComponents');
const notificationsRouter = require('./routes/notifications');
const notificationTemplatesRouter = require('./routes/notificationTemplates');
const systemSettingsRouter = require('./routes/systemSettings');
const settingsRouter = require('./routes/settings'); // New enhanced settings router
const auditLogsRouter = require('./routes/auditLogs');
const invoiceTemplatesRouter = require('./routes/invoiceTemplates');
const deviceBatchesRouter = require('./routes/deviceBatches');
const statusUpdateLogsRouter = require('./routes/statusUpdateLogs');
const quotationsRouter = require('./routes/quotations');
const quotationItemsRouter = require('./routes/quotationItems');
const warehousesRouter = require('./routes/warehouses');
const inventoryItemsRouter = require('./routes/inventoryItems');
const variablesRouter = require('./routes/variables');
const variableCategoriesRouter = require('./routes/variable-categories');
const variableOptionsRouter = require('./routes/variable-options');
const stockLevelsRouter = require('./routes/stockLevels');
const inventoryIssueRouter = require('./routes/inventoryIssue');
const authRouter = require('./routes/auth');
const dashboardRouter = require('./routes/dashboardRoutes');
const messagingRouter = require('./routes/messaging');
const inventoryEnhancedRouter = require('./routes/inventoryEnhanced');
const stockCountRouter = require('./routes/stockCount');
const stockTransferRouter = require('./routes/stockTransfer');
const itemVendorsRouter = require('./routes/itemVendors');
const barcodeRouter = require('./routes/barcode');
const analyticsRouter = require('./routes/analytics');
const vendorPaymentsRouter = require('./routes/vendorPayments');
const customerDevicesRouter = require('./routes/customerDevices');
const customerNotificationsRouter = require('./routes/customerNotifications');
// Delivery and payment routes - using existing routes
// const deliveryRouter = require('./routes/delivery');
// const paymentRouter = require('./routes/payment');
// const purchaseOrderRouter = require('./routes/purchaseOrder');

router.use('/cities', citiesRouter);
router.use('/quotations', quotationsRouter);
router.use('/quotationitems', quotationItemsRouter);
router.use('/warehouses', warehousesRouter);
router.use('/inventoryitems', inventoryItemsRouter);
router.use('/variables', variablesRouter);
router.use('/variable-categories', variableCategoriesRouter);
router.use('/variable-options', variableOptionsRouter);

router.use('/branches', branchesRouter);
router.use('/roles', rolesRouter);
router.use('/users', usersRouter);
router.use('/devicebatches', deviceBatchesRouter);
router.use('/statusupdatelogs', statusUpdateLogsRouter);
router.use('/customers', customerRoutes);
router.use('/companies', companyRoutes);
router.use('/devices', deviceRoutes);
router.use('/repairs', repairRoutes);
router.use('/repairsSimple', repairSimpleRoutes);
router.use('/repairs-approvals', repairApprovalsRouter);
router.use('/technicians', techniciansRouter);
router.use('/inventory', inventoryIssueRouter); // Must be before inventoryRoutes to avoid route conflicts
router.use('/inventory', inventoryRoutes);
router.use('/vendors', vendorRoutes);
// Vendor payments routes must be after /vendors route to avoid conflicts
router.use('/', vendorPaymentsRouter); // Vendor payments routes are under /api/vendors/:vendorId/payments
router.use('/purchaseorders', purchaseOrdersRouter);
router.use('/purchaseorderitems', purchaseOrderItemsRouter);
router.use('/partsused', partsUsedRouter);
router.use('/invoices', invoicesRouter);
router.use('/invoiceitems', invoiceItemsRouter);
router.use('/payments', paymentsRouter);
router.use('/expensecategories', expenseCategoriesRouter);
router.use('/expenses', expensesRouter);
router.use('/services', servicesRouter);
router.use('/servicecategories', serviceCategoriesRouter);
router.use('/servicepricingrules', servicePricingRulesRouter);
router.use('/repairrequestservices', repairRequestServicesRouter);
router.use('/inspectiontypes', inspectionTypesRouter);
router.use('/inspectionreports', inspectionReportsRouter);
router.use('/inspectioncomponents', inspectionComponentsRouter);
router.use('/notifications', notificationsRouter);

router.use('/systemsettings', systemSettingsRouter); // Legacy route (keep for backward compatibility)
router.use('/settings', settingsRouter); // New enhanced settings route
router.use('/auditlogs', auditLogsRouter);
router.use('/invoicetemplates', invoiceTemplatesRouter);
router.use('/reports', reportRoutes);
router.use('/stocklevels', stockLevelsRouter);
router.use('/stock-levels', stockLevelsRouter); // Alias مع شرطة
router.use('/stockmovements', stockMovementsRouter);
router.use('/stock-movements', stockMovementsRouter); // Alias مع شرطة
router.use('/stock-alerts', stockAlertsRouter);
router.use('/workflow', workflowIntegrationRouter);
router.use('/inventory-integration', inventoryIntegrationRouter);
router.use('/financial-integration', financialIntegrationRouter);
router.use('/notificationtemplates', notificationTemplatesRouter);
router.use('/auth', authRouter); // Must be before vendorPaymentsRouter to avoid authMiddleware blocking login
router.use('/customer', customerDevicesRouter); // Customer specific routes
router.use('/customer/notifications', customerNotificationsRouter);
router.use('/tech', technicianRoutes);
router.use('/dashboard', dashboardRouter);
router.use('/messaging', messagingRouter);
router.use('/inventory-enhanced', inventoryEnhancedRouter);
router.use('/inventory', itemVendorsRouter); // ItemVendor routes
router.use('/stock-count', stockCountRouter);
router.use('/stock-transfer', stockTransferRouter);
router.use('/barcode', barcodeRouter);
router.use('/analytics', analyticsRouter);

// Error handling middleware (must be last)
router.use(errorHandler);

// Using existing routes instead:
// router.use('/delivery', deliveryRouter); // Use existing repairs route for delivery
// router.use('/payment', paymentRouter); // Use existing payments route
// router.use('/purchaseorders', purchaseOrderRouter); // Use existing purchaseOrders route

module.exports = router; 