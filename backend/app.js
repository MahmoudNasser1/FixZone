const express = require('express');
const cors = require('cors');
const router = express.Router();
const cookieParser = require('cookie-parser');

// Enable CORS for all routes
router.use(cors({
  origin: [
    'http://localhost:3001',
    'http://localhost:3000'
  ],
  credentials: true
}));

const db = require('./db');
const path = require('path');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

router.use(express.json());
router.use(cookieParser());



// Import routes
const customerRoutes = require('./routes/customers');
const companyRoutes = require('./routes/companiesSimple');
const deviceRoutes = require('./routes/devices');
const repairRoutes = require('./routes/repairsSimple');
const technicianRoutes = require('./routes/technicians');
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
const repairRequestServicesRouter = require('./routes/repairRequestServices');
const inspectionTypesRouter = require('./routes/inspectionTypes');
const inspectionReportsRouter = require('./routes/inspectionReports');
const inspectionComponentsRouter = require('./routes/inspectionComponents');
const notificationsRouter = require('./routes/notifications');
const notificationTemplatesRouter = require('./routes/notificationTemplates');
const systemSettingsRouter = require('./routes/systemSettings');
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
// Delivery and payment routes - using existing routes
// const deliveryRouter = require('./routes/delivery');
// const paymentRouter = require('./routes/payment');
// const purchaseOrderRouter = require('./routes/purchaseOrder');

router.use('/cities', citiesRouter);
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
router.use('/technicians', technicianRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/inventory', inventoryIssueRouter);
router.use('/vendors', vendorRoutes);
router.use('/purchaseorders', purchaseOrdersRouter);
router.use('/purchaseorderitems', purchaseOrderItemsRouter);
router.use('/partsused', partsUsedRouter);
router.use('/invoices', invoicesRouter);
router.use('/invoiceitems', invoiceItemsRouter);
router.use('/payments', paymentsRouter);
router.use('/expensecategories', expenseCategoriesRouter);
router.use('/expenses', expensesRouter);
router.use('/services', servicesRouter);
router.use('/repairrequestservices', repairRequestServicesRouter);
router.use('/inspectiontypes', inspectionTypesRouter);
router.use('/inspectionreports', inspectionReportsRouter);
router.use('/inspectioncomponents', inspectionComponentsRouter);
router.use('/notifications', notificationsRouter);

router.use('/systemsettings', systemSettingsRouter);
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
router.use('/auth', authRouter);
router.use('/dashboard', dashboardRouter);
router.use('/messaging', messagingRouter);
router.use('/inventory-enhanced', inventoryEnhancedRouter);
router.use('/inventory', itemVendorsRouter); // ItemVendor routes
router.use('/stock-count', stockCountRouter);
router.use('/stock-transfer', stockTransferRouter);
router.use('/barcode', barcodeRouter);

// Error handling middleware (must be last)
router.use(errorHandler);

// Using existing routes instead:
// router.use('/delivery', deliveryRouter); // Use existing repairs route for delivery
// router.use('/payment', paymentRouter); // Use existing payments route
// router.use('/purchaseorders', purchaseOrderRouter); // Use existing purchaseOrders route

module.exports = router; 