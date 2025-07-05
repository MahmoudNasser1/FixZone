const express = require('express');
const app = express();
const db = require('./db');
const path = require('path');

app.use(express.json());

// Serve frontend as static files
app.use(express.static(path.join(__dirname, './frontend')));

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

app.use('/api/cities', citiesRouter);
app.use('/api/quotationitems', quotationItemsRouter);
app.use('/api/warehouses', warehousesRouter);
app.use('/api/inventoryitems', inventoryItemsRouter);

app.use('/api/branches', branchesRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/users', usersRouter);
app.use('/api/devicebatches', deviceBatchesRouter);
app.use('/api/statusupdatelogs', statusUpdateLogsRouter);
app.use('/api/customers', customerRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/purchaseorders', purchaseOrdersRouter);
app.use('/api/purchaseorderitems', purchaseOrderItemsRouter);
app.use('/api/partsused', partsUsedRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/invoiceitems', invoiceItemsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/expensecategories', expenseCategoriesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/services', servicesRouter);
app.use('/api/repairrequestservices', repairRequestServicesRouter);
app.use('/api/inspectiontypes', inspectionTypesRouter);
app.use('/api/inspectionreports', inspectionReportsRouter);
app.use('/api/inspectioncomponents', inspectionComponentsRouter);
app.use('/api/notifications', notificationsRouter);

app.use('/api/systemsettings', systemSettingsRouter);
app.use('/api/auditlogs', auditLogsRouter);
app.use('/api/reports', reportRoutes);
app.use('/api/stocklevels', stockLevelsRouter);
app.use('/api/stockmovements', stockMovementsRouter);
app.use('/api/notificationtemplates', notificationTemplatesRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Original global entry point logic (commented out to fix module resolution)
// process.chdir(path.join(__dirname, 'backend'));
// require('./app.js');
// console.log('Fix Zone ERP backend is running (via server.js)');