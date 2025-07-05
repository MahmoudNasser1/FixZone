const express = require('express');
const app = express();
const path = require('path');

// Import the main backend application
const backendApp = require('./backend/app');

app.use(express.json());

// Serve frontend as static files
app.use(express.static(path.join(__dirname, './frontend')));

// Mount the backend application
app.use('/api', backendApp);

// Root endpoint for frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});