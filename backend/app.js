const express = require('express');
const app = express();
const db = require('./db');
const path = require('path');

app.use(express.json());

// Serve frontend as static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Import routes
const customerRoutes = require('./routes/customers');
const deviceRoutes = require('./routes/devices');
const repairRoutes = require('./routes/repairs');
const technicianRoutes = require('./routes/technicians');
const inventoryRoutes = require('./routes/inventory');
const vendorRoutes = require('./routes/vendors');
const reportRoutes = require('./routes/reports');

app.use('/api/customers', customerRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/reports', reportRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 