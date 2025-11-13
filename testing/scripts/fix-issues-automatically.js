#!/usr/bin/env node

/**
 * 🔧 Automatic Issue Fixer for Fix Zone ERP
 * 
 * This script automatically detects and fixes common issues:
 * - Database connection problems
 * - Missing data
 * - Configuration issues
 * - Common API errors
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  API_BASE_URL: 'http://localhost:3001/api',
  BASE_URL: 'http://localhost:3001',
  BACKEND_DIR: path.join(__dirname, '../../backend'),
  FRONTEND_DIR: path.join(__dirname, '../../frontend/react-app')
};

const fixes = {
  applied: [],
  failed: [],
  skipped: []
};

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  fix: (msg) => console.log(`🔧 ${msg}`)
};

// Helper function to apply fix
function applyFix(name, fixFunction) {
  try {
    const result = fixFunction();
    if (result) {
      fixes.applied.push(name);
      log.success(`Fixed: ${name}`);
      return true;
    } else {
      fixes.skipped.push(name);
      log.info(`Skipped: ${name} (not needed)`);
      return false;
    }
  } catch (error) {
    fixes.failed.push(name);
    log.error(`Failed to fix: ${name} - ${error.message}`);
    return false;
  }
}

// Fix 1: Check and create missing directories
function fixMissingDirectories() {
  const directories = [
    path.join(CONFIG.BACKEND_DIR, 'uploads'),
    path.join(CONFIG.BACKEND_DIR, 'uploads/repairs'),
    path.join(CONFIG.BACKEND_DIR, 'logs'),
    path.join(__dirname, '../results'),
    path.join(__dirname, '../reports')
  ];
  
  let created = 0;
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      created++;
    }
  });
  
  return created > 0;
}

// Fix 2: Check database connection configuration
function fixDatabaseConfig() {
  const dbPath = path.join(CONFIG.BACKEND_DIR, 'db.js');
  
  if (!fs.existsSync(dbPath)) {
    log.warning('Database configuration file not found');
    return false;
  }
  
  const dbContent = fs.readFileSync(dbPath, 'utf8');
  
  // Check for private IP or localhost
  if (dbContent.includes('localhost') || dbContent.includes('127.0.0.1')) {
    return false; // Already configured correctly
  }
  
  // Try to fix database host
  const fixedContent = dbContent.replace(
    /host:\s*['"][^'"]*['"]/,
    "host: 'localhost'"
  );
  
  if (fixedContent !== dbContent) {
    fs.writeFileSync(dbPath, fixedContent);
    return true;
  }
  
  return false;
}

// Fix 3: Check environment variables
function fixEnvironmentVariables() {
  const envPath = path.join(CONFIG.BACKEND_DIR, '.env');
  const packagePath = path.join(CONFIG.BACKEND_DIR, 'package.json');
  
  // Create .env file if it doesn't exist
  if (!fs.existsSync(envPath)) {
    const envContent = `# Fix Zone ERP Environment Variables
NODE_ENV=development
PORT=3001
JWT_SECRET=your_jwt_secret_key_here
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=FZ
CORS_ORIGIN=http://localhost:3000
`;
    
    fs.writeFileSync(envPath, envContent);
    return true;
  }
  
  return false;
}

// Fix 4: Check package.json dependencies
function fixPackageDependencies() {
  const packagePath = path.join(CONFIG.BACKEND_DIR, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    return false;
  }
  
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = [
    'express', 'mysql2', 'cors', 'bcryptjs', 'jsonwebtoken',
    'express-validator', 'joi', 'multer', 'cookie-parser'
  ];
  
  let missingDeps = [];
  requiredDeps.forEach(dep => {
    if (!packageContent.dependencies || !packageContent.dependencies[dep]) {
      missingDeps.push(dep);
    }
  });
  
  if (missingDeps.length > 0) {
    log.warning(`Missing dependencies: ${missingDeps.join(', ')}`);
    log.info('Run: cd backend && npm install');
    return false;
  }
  
  return false; // No fix needed
}

// Fix 5: Check CORS configuration
function fixCORSConfiguration() {
  const appPath = path.join(CONFIG.BACKEND_DIR, 'app.js');
  
  if (!fs.existsSync(appPath)) {
    return false;
  }
  
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  // Check if CORS is properly configured
  if (appContent.includes('localhost:3000') && appContent.includes('localhost:3001')) {
    return false; // Already configured
  }
  
  // Try to fix CORS configuration
  if (appContent.includes('cors')) {
    const fixedContent = appContent.replace(
      /origin:\s*\[([^\]]*)\]/,
      "origin: ['http://localhost:3001', 'http://localhost:3000']"
    );
    
    if (fixedContent !== appContent) {
      fs.writeFileSync(appPath, fixedContent);
      return true;
    }
  }
  
  return false;
}

// Fix 6: Create sample data if database is empty
async function fixEmptyDatabase() {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/customers`);
    
    if (!response.ok) {
      return false; // Can't check, skip
    }
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length === 0) {
      log.info('Database appears to be empty, creating sample data...');
      
      // Create sample customer
      const customerData = {
        firstName: 'عينة',
        lastName: 'اختبار',
        phone: '01000000001',
        email: 'test@fixzone.com',
        address: 'عنوان تجريبي',
        notes: 'عميل تجريبي تم إنشاؤه تلقائياً'
      };
      
      const createResponse = await fetch(`${CONFIG.API_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });
      
      return createResponse.ok;
    }
    
    return false; // Database not empty
  } catch (error) {
    return false; // Can't check
  }
}

// Fix 7: Check file permissions
function fixFilePermissions() {
  const uploadsDir = path.join(CONFIG.BACKEND_DIR, 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    return false; // Directory doesn't exist, will be created by other fix
  }
  
  try {
    // Try to write a test file
    const testFile = path.join(uploadsDir, '.test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return false; // Permissions are fine
  } catch (error) {
    log.warning('Upload directory may have permission issues');
    return false; // Can't fix permissions automatically
  }
}

// Fix 8: Check server configuration
function fixServerConfiguration() {
  const serverPath = path.join(CONFIG.BACKEND_DIR, 'server.js');
  
  if (!fs.existsSync(serverPath)) {
    return false;
  }
  
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Check if port is properly configured
  if (serverContent.includes('process.env.PORT || 3001')) {
    return false; // Already configured correctly
  }
  
  // Try to fix port configuration
  const fixedContent = serverContent.replace(
    /const PORT = [^;]+;/,
    "const PORT = process.env.PORT || 3001;"
  );
  
  if (fixedContent !== serverContent) {
    fs.writeFileSync(serverPath, fixedContent);
    return true;
  }
  
  return false;
}

// Fix 9: Check frontend configuration
function fixFrontendConfiguration() {
  const packagePath = path.join(CONFIG.FRONTEND_DIR, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    return false;
  }
  
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Check if proxy is configured for API calls
  if (packageContent.proxy && packageContent.proxy === 'http://localhost:3001') {
    return false; // Already configured
  }
  
  // Add proxy configuration
  packageContent.proxy = 'http://localhost:3001';
  fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2));
  return true;
}

// Fix 10: Check and fix common database issues
async function fixDatabaseIssues() {
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/health`);
    
    if (!response.ok) {
      log.warning('Database connection issues detected');
      return false;
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      log.warning('Database health check failed');
      return false;
    }
    
    return false; // Database is healthy
  } catch (error) {
    log.warning('Cannot connect to database - check if server is running');
    return false;
  }
}

// Main execution
async function runAutomaticFixes() {
  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    🔧 AUTOMATIC ISSUE FIXER                          ║');
  console.log('║                          Fix Zone ERP System                          ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝');
  console.log(`\n⏰ Started at: ${new Date().toLocaleString('ar-SA')}`);
  
  log.info('Scanning for common issues...');
  
  // Apply all fixes
  applyFix('Missing Directories', fixMissingDirectories);
  applyFix('Database Configuration', fixDatabaseConfig);
  applyFix('Environment Variables', fixEnvironmentVariables);
  applyFix('Package Dependencies', fixPackageDependencies);
  applyFix('CORS Configuration', fixCORSConfiguration);
  applyFix('Empty Database', fixEmptyDatabase);
  applyFix('File Permissions', fixFilePermissions);
  applyFix('Server Configuration', fixServerConfiguration);
  applyFix('Frontend Configuration', fixFrontendConfiguration);
  applyFix('Database Issues', fixDatabaseIssues);
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 AUTOMATIC FIXES SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Applied: ${fixes.applied.length}`);
  console.log(`⚠️  Skipped: ${fixes.skipped.length}`);
  console.log(`❌ Failed: ${fixes.failed.length}`);
  console.log('='.repeat(50));
  
  if (fixes.applied.length > 0) {
    console.log('\n🔧 Applied Fixes:');
    fixes.applied.forEach(fix => console.log(`  ✅ ${fix}`));
  }
  
  if (fixes.failed.length > 0) {
    console.log('\n❌ Failed Fixes:');
    fixes.failed.forEach(fix => console.log(`  ❌ ${fix}`));
  }
  
  if (fixes.skipped.length > 0) {
    console.log('\n⚠️  Skipped Fixes:');
    fixes.skipped.forEach(fix => console.log(`  ⚠️  ${fix}`));
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (fixes.applied.includes('Package Dependencies')) {
    console.log('  📦 Run: cd backend && npm install');
  }
  
  if (fixes.applied.includes('Frontend Configuration')) {
    console.log('  ⚛️  Run: cd frontend/react-app && npm install');
  }
  
  console.log('  🚀 Run: node testing/scripts/quick-system-check.js');
  console.log('  🧪 Run: node testing/scripts/comprehensive-test-suite.js');
  
  console.log('\n🎯 Automatic fixes completed!');
  
  process.exit(fixes.failed.length > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  runAutomaticFixes().catch((error) => {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runAutomaticFixes, applyFix };
