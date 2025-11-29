const db = require('../db');
const SettingsIntegration = require('../utils/settingsIntegration');

exports.getAllCustomers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Customer WHERE deletedAt IS NULL');
    
    // Get currency and locale settings for frontend
    const currencySettings = await SettingsIntegration.getCurrencySettings();
    const localeSettings = await SettingsIntegration.getLocaleSettings();
    
    res.json({
      success: true,
      data: rows,
      settings: {
        currency: currencySettings,
        locale: localeSettings
      }
    });
  } catch (err) {
    console.error('Error in getAllCustomers:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Customer WHERE id = ? AND deletedAt IS NULL', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    
    // Get currency and locale settings for frontend
    const currencySettings = await SettingsIntegration.getCurrencySettings();
    const localeSettings = await SettingsIntegration.getLocaleSettings();
    
    res.json({
      success: true,
      data: rows[0],
      settings: {
        currency: currencySettings,
        locale: localeSettings
      }
    });
  } catch (err) {
    console.error('Error in getCustomerById:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, customFields } = req.body;
    const [result] = await db.query(
      'INSERT INTO Customer (name, phone, email, address, customFields, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [name, phone, email, address, JSON.stringify(customFields || {})]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Error in createCustomer:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, customFields } = req.body;
    const [result] = await db.query(
      'UPDATE Customer SET name=?, phone=?, email=?, address=?, customFields=?, updatedAt=NOW() WHERE id=? AND deletedAt IS NULL',
      [name, phone, email, address, JSON.stringify(customFields || {}), req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Error in updateCustomer:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE Customer SET deletedAt=NOW() WHERE id=? AND deletedAt IS NULL',
      [req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Error in deleteCustomer:', err);
    res.status(500).json({ error: err.message });
  }
}; 