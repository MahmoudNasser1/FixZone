#!/usr/bin/env node
/**
 * Build Performance Analyzer
 * Instruments webpack build to identify bottlenecks
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const LOG_FILE = path.join(__dirname, '../../../.cursor/debug.log');
const SERVER_ENDPOINT = 'http://127.0.0.1:7243/ingest/528f83bf-4bb2-489e-9b1b-d36c1bafd8c5';

function log(data) {
  const logEntry = JSON.stringify({
    ...data,
    timestamp: Date.now(),
    sessionId: 'debug-session',
    location: 'analyze-build-performance.js'
  }) + '\n';
  
  fs.appendFileSync(LOG_FILE, logEntry);
  
  try {
    require('http').request({
      hostname: '127.0.0.1',
      port: 7243,
      path: '/ingest/528f83bf-4bb2-489e-9b1b-d36c1bafd8c5',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, () => {}).end(JSON.stringify(data));
  } catch (e) {}
}

// Analyze source code for potential bottlenecks
function analyzeSourceCode() {
  const srcDir = path.join(__dirname, '../src');
  const issues = [];
  
  // Check for large files
  function checkFile(filePath, relativePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const size = content.length;
      const lines = content.split('\n').length;
      
      // Large files (>500KB or >5000 lines)
      if (size > 500000 || lines > 5000) {
        issues.push({
          type: 'large_file',
          file: relativePath,
          size: (size / 1024).toFixed(2) + ' KB',
          lines: lines
        });
      }
      
      // Check for heavy imports
      const heavyImports = [
        /import.*from.*['"]@mui\/material['"]/g,
        /import.*from.*['"]chart\.js['"]/g,
        /import.*from.*['"]recharts['"]/g,
        /import.*from.*['"]exceljs['"]/g,
        /import.*from.*['"]jspdf['"]/g,
        /import.*\*.*from/g, // Star imports
      ];
      
      heavyImports.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          issues.push({
            type: 'heavy_import',
            file: relativePath,
            importType: ['mui', 'chartjs', 'recharts', 'exceljs', 'jspdf', 'star_import'][index],
            count: matches.length
          });
        }
      });
      
      // Check for synchronous operations
      const syncOps = [
        /require\(/g,
        /readFileSync/g,
        /writeFileSync/g,
        /execSync/g,
      ];
      
      syncOps.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          issues.push({
            type: 'sync_operation',
            file: relativePath,
            operation: ['require', 'readFileSync', 'writeFileSync', 'execSync'][index],
            count: matches.length
          });
        }
      });
      
      // Check for circular dependency patterns
      if (content.includes('export *') && content.match(/export \*/g).length > 5) {
        issues.push({
          type: 'many_reexports',
          file: relativePath,
          count: content.match(/export \*/g).length
        });
      }
      
    } catch (e) {
      // Ignore errors
    }
  }
  
  function walkDir(dir, baseDir = srcDir) {
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        const relativePath = path.relative(baseDir, filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath, baseDir);
        } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
          checkFile(filePath, relativePath);
        }
      });
    } catch (e) {
      // Ignore errors
    }
  }
  
  walkDir(srcDir);
  
  return issues;
}

// Start analysis
log({
  message: 'Starting build performance analysis',
  hypothesisId: 'G',
  data: { action: 'start' }
});

const issues = analyzeSourceCode();

// Log findings
log({
  message: 'Source code analysis complete',
  hypothesisId: 'G',
  data: {
    totalIssues: issues.length,
    issuesByType: issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {}),
    topIssues: issues.slice(0, 20)
  }
});

// Log large files
const largeFiles = issues.filter(i => i.type === 'large_file');
if (largeFiles.length > 0) {
  log({
    message: 'Large files found',
    hypothesisId: 'H',
    data: { files: largeFiles }
  });
}

// Log heavy imports
const heavyImports = issues.filter(i => i.type === 'heavy_import');
if (heavyImports.length > 0) {
  log({
    message: 'Heavy imports found',
    hypothesisId: 'I',
    data: { imports: heavyImports }
  });
}

// Log sync operations
const syncOps = issues.filter(i => i.type === 'sync_operation');
if (syncOps.length > 0) {
  log({
    message: 'Synchronous operations found',
    hypothesisId: 'J',
    data: { operations: syncOps }
  });
}

console.log(`\n📊 Analysis complete: Found ${issues.length} potential issues`);
console.log(`   - Large files: ${largeFiles.length}`);
console.log(`   - Heavy imports: ${heavyImports.length}`);
console.log(`   - Sync operations: ${syncOps.length}`);

