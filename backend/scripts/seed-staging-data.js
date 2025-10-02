/**
 * Seed Script for Staging Environment
 * Creates comprehensive test data for FixZone ERP
 * 
 * Usage: node scripts/seed-staging-data.js
 */

const db = require('../db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// Test users passwords (plain text - will be hashed)
const TEST_PASSWORD = 'password';

async function seedUsers() {
  console.log('📝 Seeding Users...');
  
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS);
  
  const users = [
    {
      email: 'admin@fixzone.com',
      password: hashedPassword,
      firstName: 'أحمد',
      lastName: 'الإداري',
      role: 'admin',
      phone: '01011111111',
      isActive: 1
    },
    {
      email: 'tech1@fixzone.com',
      password: hashedPassword,
      firstName: 'محمد',
      lastName: 'الفني',
      role: 'technician',
      phone: '01022222222',
      isActive: 1
    },
    {
      email: 'reception@fixzone.com',
      password: hashedPassword,
      firstName: 'فاطمة',
      lastName: 'الاستقبال',
      role: 'reception',
      phone: '01033333333',
      isActive: 1
    },
    {
      email: 'accountant@fixzone.com',
      password: hashedPassword,
      firstName: 'خالد',
      lastName: 'المحاسب',
      role: 'accountant',
      phone: '01044444444',
      isActive: 1
    }
  ];
  
  for (const user of users) {
    try {
      await db.query(`
        INSERT INTO User (email, password, firstName, lastName, role, phone, isActive, companyId)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `, [user.email, user.password, user.firstName, user.lastName, user.role, user.phone, user.isActive]);
      console.log(`  ✅ Created user: ${user.email}`);
    } catch (error) {
      console.log(`  ⚠️ User ${user.email} already exists or error: ${error.message}`);
    }
  }
}

async function seedCustomers() {
  console.log('📝 Seeding Customers...');
  
  const customers = [
    { firstName: 'عمر', lastName: 'أحمد', phone: '01012345678', email: 'customer1@example.com' },
    { firstName: 'سارة', lastName: 'محمد', phone: '01098765432', email: 'customer2@example.com' },
    { firstName: 'كريم', lastName: 'علي', phone: '01055555555', email: 'customer3@example.com' },
    { firstName: 'نور', lastName: 'حسن', phone: '01066666666', email: 'customer4@example.com' },
    { firstName: 'ليلى', lastName: 'إبراهيم', phone: '01077777777', email: 'customer5@example.com' }
  ];
  
  for (const customer of customers) {
    try {
      await db.query(`
        INSERT INTO Customer (firstName, lastName, phone, email, companyId, isActive, status)
        VALUES (?, ?, ?, ?, 1, 1, 'active')
      `, [customer.firstName, customer.lastName, customer.phone, customer.email]);
      console.log(`  ✅ Created customer: ${customer.firstName} ${customer.lastName}`);
    } catch (error) {
      console.log(`  ⚠️ Customer ${customer.phone} already exists or error: ${error.message}`);
    }
  }
}

async function seedVendors() {
  console.log('📝 Seeding Vendors...');
  
  const vendors = [
    { name: 'شركة قطع الغيار المتحدة', phone: '01012345678', email: 'vendor1@example.com', address: 'القاهرة' },
    { name: 'موزع قطع أبل الرسمي', phone: '01098765432', email: 'vendor2@example.com', address: 'الإسكندرية' },
    { name: 'شركة الإلكترونيات الحديثة', phone: '01055555555', email: 'vendor3@example.com', address: 'الجيزة' },
    { name: 'مركز قطع سامسونج', phone: '01044444444', email: 'vendor4@example.com', address: 'طنطا' },
    { name: 'موزع شاومي الرسمي', phone: '01033333333', email: 'vendor5@example.com', address: 'المنصورة' }
  ];
  
  for (const vendor of vendors) {
    try {
      await db.query(`
        INSERT INTO Vendor (name, phone, email, address, companyId, isActive)
        VALUES (?, ?, ?, ?, 1, 1)
      `, [vendor.name, vendor.phone, vendor.email, vendor.address]);
      console.log(`  ✅ Created vendor: ${vendor.name}`);
    } catch (error) {
      console.log(`  ⚠️ Vendor ${vendor.name} already exists or error: ${error.message}`);
    }
  }
}

async function seedInventory() {
  console.log('📝 Seeding Inventory Items...');
  
  const items = [
    // High stock
    { name: 'شاشة Samsung S21', sku: 'SCR-SAM-S21', quantity: 100, minQuantity: 10, price: 500.00, category: 'screens' },
    { name: 'شاشة iPhone 12', sku: 'SCR-IPH-12', quantity: 80, minQuantity: 10, price: 800.00, category: 'screens' },
    
    // Low stock (alert)
    { name: 'بطارية iPhone 12', sku: 'BAT-IPH-12', quantity: 5, minQuantity: 10, price: 150.00, category: 'batteries' },
    { name: 'بطارية Samsung Note 10', sku: 'BAT-SAM-N10', quantity: 7, minQuantity: 10, price: 120.00, category: 'batteries' },
    
    // Out of stock
    { name: 'كاميرا Xiaomi Note 10', sku: 'CAM-XIA-N10', quantity: 0, minQuantity: 5, price: 80.00, category: 'cameras' },
    
    // Normal stock
    { name: 'زجاج حماية Universal', sku: 'GLASS-UNI', quantity: 200, minQuantity: 50, price: 20.00, category: 'accessories' },
    { name: 'كفر شفاف Universal', sku: 'CASE-UNI', quantity: 150, minQuantity: 30, price: 15.00, category: 'accessories' }
  ];
  
  for (const item of items) {
    try {
      await db.query(`
        INSERT INTO InventoryItem (name, sku, quantity, minQuantity, price, category, companyId)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `, [item.name, item.sku, item.quantity, item.minQuantity, item.price, item.category]);
      console.log(`  ✅ Created inventory item: ${item.name} (Qty: ${item.quantity})`);
    } catch (error) {
      console.log(`  ⚠️ Item ${item.sku} already exists or error: ${error.message}`);
    }
  }
}

async function seedDevices() {
  console.log('📝 Seeding Devices...');
  
  const devices = [
    { serialNumber: 'SAM-S21-001', deviceModel: 'Galaxy S21', deviceBrand: 'Samsung', deviceType: 'smartphone' },
    { serialNumber: 'IPH-12-001', deviceModel: 'iPhone 12', deviceBrand: 'Apple', deviceType: 'smartphone' },
    { serialNumber: 'XIA-N10-001', deviceModel: 'Note 10', deviceBrand: 'Xiaomi', deviceType: 'smartphone' },
    { serialNumber: 'HUA-P30-001', deviceModel: 'P30 Pro', deviceBrand: 'Huawei', deviceType: 'smartphone' },
    { serialNumber: 'OPP-R17-001', deviceModel: 'Reno 17', deviceBrand: 'Oppo', deviceType: 'smartphone' }
  ];
  
  for (const device of devices) {
    try {
      await db.query(`
        INSERT INTO Device (serialNumber, deviceModel, deviceBrand, deviceType)
        VALUES (?, ?, ?, ?)
      `, [device.serialNumber, device.deviceModel, device.deviceBrand, device.deviceType]);
      console.log(`  ✅ Created device: ${device.deviceBrand} ${device.deviceModel}`);
    } catch (error) {
      console.log(`  ⚠️ Device ${device.serialNumber} already exists or error: ${error.message}`);
    }
  }
}

async function seedRepairRequests() {
  console.log('📝 Seeding Repair Requests (30 tickets)...');
  
  const statuses = [
    { status: 'received', count: 5 },
    { status: 'inspecting', count: 4 },
    { status: 'awaiting_parts', count: 3 },
    { status: 'in_repair', count: 6 },
    { status: 'ready', count: 4 },
    { status: 'delivered', count: 6 },
    { status: 'rejected', count: 2 }
  ];
  
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const problems = [
    'شاشة مكسورة',
    'بطارية لا تشحن',
    'لا يعمل نهائياً',
    'مشكلة في الكاميرا',
    'بطء في الأداء',
    'سماعة لا تعمل',
    'مشكلة في الشحن',
    'الجهاز يسخن بشدة'
  ];
  
  let ticketCount = 0;
  
  for (const statusGroup of statuses) {
    for (let i = 0; i < statusGroup.count; i++) {
      ticketCount++;
      const customerId = Math.floor(Math.random() * 5) + 1;
      const deviceId = Math.floor(Math.random() * 5) + 1;
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const problem = problems[Math.floor(Math.random() * problems.length)];
      const ticketNumber = `TKT-${Date.now()}-${ticketCount}`;
      
      try {
        const [result] = await db.query(`
          INSERT INTO RepairRequest (
            ticketNumber, customerId, deviceId, reportedProblem, 
            priority, status, companyId, receivedBy
          ) VALUES (?, ?, ?, ?, ?, ?, 1, 1)
        `, [ticketNumber, customerId, deviceId, problem, priority, statusGroup.status]);
        
        console.log(`  ✅ Created repair #${ticketCount}: ${statusGroup.status} - ${problem}`);
      } catch (error) {
        console.log(`  ⚠️ Error creating repair request: ${error.message}`);
      }
    }
  }
}

async function seedInvoicesAndPayments() {
  console.log('📝 Seeding Invoices and Payments...');
  
  // Get delivered repair requests
  const [repairs] = await db.query(`
    SELECT id FROM RepairRequest WHERE status = 'delivered' LIMIT 6
  `);
  
  const invoiceStatuses = ['draft', 'sent', 'paid', 'paid', 'overdue', 'cancelled'];
  const paymentMethods = ['cash', 'card', 'bank_transfer'];
  
  for (let i = 0; i < repairs.length; i++) {
    const repair = repairs[i];
    const status = invoiceStatuses[i];
    const totalAmount = Math.floor(Math.random() * 900) + 100; // 100-1000 EGP
    const invoiceNumber = `INV-${Date.now()}-${i + 1}`;
    const issueDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    try {
      // Get customerId from repair request
      const [repairDetails] = await db.query(`
        SELECT customerId FROM RepairRequest WHERE id = ?
      `, [repair.id]);
      
      const customerId = repairDetails[0].customerId;
      
      // Create invoice
      const [invoiceResult] = await db.query(`
        INSERT INTO Invoice (
          invoiceNumber, repairRequestId, customerId, totalAmount, 
          finalAmount, currency, status, issueDate, dueDate, companyId, createdBy
        ) VALUES (?, ?, ?, ?, ?, 'EGP', ?, ?, ?, 1, 1)
      `, [invoiceNumber, repair.id, customerId, totalAmount, totalAmount, status, issueDate, dueDate]);
      
      const invoiceId = invoiceResult.insertId;
      console.log(`  ✅ Created invoice: ${invoiceNumber} - ${status}`);
      
      // Add payments for paid invoices
      if (status === 'paid') {
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const paymentDate = new Date().toISOString().split('T')[0];
        
        await db.query(`
          INSERT INTO Payment (
            invoiceId, amount, currency, paymentMethod, 
            paymentDate, createdBy
          ) VALUES (?, ?, 'EGP', ?, ?, 1)
        `, [invoiceId, totalAmount, paymentMethod, paymentDate]);
        
        console.log(`    ✅ Added payment: ${totalAmount} EGP via ${paymentMethod}`);
      }
    } catch (error) {
      console.log(`  ⚠️ Error creating invoice: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting seed process for staging environment...\n');
  
  try {
    await seedUsers();
    console.log('');
    
    await seedCustomers();
    console.log('');
    
    await seedVendors();
    console.log('');
    
    await seedInventory();
    console.log('');
    
    await seedDevices();
    console.log('');
    
    await seedRepairRequests();
    console.log('');
    
    await seedInvoicesAndPayments();
    console.log('');
    
    console.log('✅ Seed process completed successfully!\n');
    console.log('📊 Summary:');
    console.log('  - Users: 4');
    console.log('  - Customers: 5');
    console.log('  - Vendors: 5');
    console.log('  - Inventory Items: 7');
    console.log('  - Devices: 5');
    console.log('  - Repair Requests: 30');
    console.log('  - Invoices: 6');
    console.log('  - Payments: 2-3');
    console.log('');
    console.log('🔑 Test Credentials:');
    console.log('  Admin:      admin@fixzone.com      / password');
    console.log('  Technician: tech1@fixzone.com      / password');
    console.log('  Reception:  reception@fixzone.com  / password');
    console.log('  Accountant: accountant@fixzone.com / password');
    
  } catch (error) {
    console.error('❌ Error during seed process:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };

