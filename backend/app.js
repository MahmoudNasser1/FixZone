const express = require('express');
const router = express.Router();
const db = require('./db');
const path = require('path');

router.use(express.json());



// Import routes
const customerRoutes = require('./routes/customers');
const deviceRoutes = require('./routes/devices');
const repairRoutes = require('./routes/repairs');
const technicianRoutes = require('./routes/technicians');
const inventoryRoutes = require('./routes/inventory');
const vendorRoutes = require('./routes/vendors');
const reportRoutes = require('./routes/reports');
const citiesRouter = require('./routes/cities');
const branchesRouter = require('./routes/branches');
const rolesRouter = require('./routes/roles');
const usersRouter = require('./routes/users');
const purchaseOrdersRouter = require('./routes/purchaseOrders');
const purchaseOrderItemsRouter = require('./routes/purchaseOrderItems');
const partsUsedRouter = require('./routes/partsUsed');
const invoicesRouter = require('./routes/invoices');
const invoiceItemsRouter = require('./routes/invoiceItems');
const paymentsRouter = require('./routes/payments');
const expenseCategoriesRouter = require('./routes/expenseCategories');
const expensesRouter = require('./routes/expenses');
const servicesRouter = require('./routes/services');
const repairRequestServicesRouter = require('./routes/repairRequestServices');
const inspectionTypesRouter = require('./routes/inspectionTypes');
const inspectionReportsRouter = require('./routes/inspectionReports');
const inspectionComponentsRouter = require('./routes/inspectionComponents');
const notificationsRouter = require('./routes/notifications');
const notificationTemplatesRouter = require('./routes/notificationTemplates');
const systemSettingsRouter = require('./routes/systemSettings');
const auditLogsRouter = require('./routes/auditLogs');
const deviceBatchesRouter = require('./routes/deviceBatches');
const statusUpdateLogsRouter = require('./routes/statusUpdateLogs');
const quotationsRouter = require('./routes/quotations');
const quotationItemsRouter = require('./routes/quotationItems');
const warehousesRouter = require('./routes/warehouses');
const inventoryItemsRouter = require('./routes/inventoryItems');
const stockLevelsRouter = require('./routes/stockLevels');
const stockMovementsRouter = require('./routes/stockMovements');
const authRouter = require('./routes/auth');
const dashboardRouter = require('./routes/dashboardRoutes');

router.use('/cities', citiesRouter);
router.use('/quotationitems', quotationItemsRouter);
router.use('/warehouses', warehousesRouter);
router.use('/inventoryitems', inventoryItemsRouter);

router.use('/branches', branchesRouter);
router.use('/roles', rolesRouter);
router.use('/users', usersRouter);
router.use('/devicebatches', deviceBatchesRouter);
router.use('/statusupdatelogs', statusUpdateLogsRouter);
router.use('/customers', customerRoutes);
router.use('/devices', deviceRoutes);
router.use('/repairs', repairRoutes);
router.use('/technicians', technicianRoutes);
router.use('/inventory', inventoryRoutes);
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
router.use('/reports', reportRoutes);
router.use('/stocklevels', stockLevelsRouter);
router.use('/stockmovements', stockMovementsRouter);
router.use('/notificationtemplates', notificationTemplatesRouter);
router.use('/auth', authRouter);
router.use('/dashboard', dashboardRouter);

module.exports = router; 