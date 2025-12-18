/**
 * Build Performance Instrumentation Script
 * Measures build time and identifies bottlenecks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../../../.cursor/debug.log');
const SERVER_ENDPOINT = 'http://127.0.0.1:7243/ingest/528f83bf-4bb2-489e-9b1b-d36c1bafd8c5';

// Helper to send log
function log(data) {
  const logEntry = JSON.stringify({
    ...data,
    timestamp: Date.now(),
    sessionId: 'debug-session',
    location: 'instrument-build.js'
  }) + '\n';
  
  // Write to log file
  fs.appendFileSync(LOG_FILE, logEntry);
  
  // Also send to server
  try {
    require('http').request({
      hostname: '127.0.0.1',
      port: 7243,
      path: '/ingest/528f83bf-4bb2-489e-9b1b-d36c1bafd8c5',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, () => {}).end(JSON.stringify(data));
  } catch (e) {
    // Ignore network errors
  }
}

// Measure build phases
const phases = {
  lint: { start: null, end: null },
  webpack: { start: null, end: null },
  minify: { start: null, end: null },
  total: { start: null, end: null }
};

phases.total.start = Date.now();
log({
  message: 'Build started',
  hypothesisId: 'A',
  data: { phase: 'total', action: 'start' }
});

// Check if prebuild hook exists
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const hasPrebuild = packageJson.scripts && packageJson.scripts.prebuild;

log({
  message: 'Prebuild hook check',
  hypothesisId: 'B',
  data: { hasPrebuild, prebuildScript: packageJson.scripts?.prebuild }
});

// Check source map generation
const buildScript = process.env.npm_lifecycle_event || 'build';
const hasSourceMaps = !process.env.GENERATE_SOURCEMAP || process.env.GENERATE_SOURCEMAP !== 'false';

log({
  message: 'Source map configuration',
  hypothesisId: 'C',
  data: { buildScript, hasSourceMaps, GENERATE_SOURCEMAP: process.env.GENERATE_SOURCEMAP }
});

// Check node memory
const nodeOptions = process.env.NODE_OPTIONS || '';
const hasMemoryLimit = nodeOptions.includes('--max-old-space-size');

log({
  message: 'Node.js memory configuration',
  hypothesisId: 'D',
  data: { nodeOptions, hasMemoryLimit }
});

// Check file count
const srcDir = path.join(__dirname, '../src');
let fileCount = 0;
let totalSize = 0;

function countFiles(dir) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        countFiles(filePath);
      } else if (/\.(js|jsx|ts|tsx|css|scss)$/.test(file)) {
        fileCount++;
        totalSize += stat.size;
      }
    });
  } catch (e) {
    // Ignore errors
  }
}

countFiles(srcDir);

log({
  message: 'Source file statistics',
  hypothesisId: 'E',
  data: { fileCount, totalSizeMB: (totalSize / 1024 / 1024).toFixed(2) }
});

// Check dependencies size
const nodeModulesPath = path.join(__dirname, '../node_modules');
let depCount = 0;
try {
  if (fs.existsSync(nodeModulesPath)) {
    const deps = fs.readdirSync(nodeModulesPath);
    depCount = deps.length;
  }
} catch (e) {
  // Ignore
}

log({
  message: 'Dependencies count',
  hypothesisId: 'F',
  data: { dependencyCount: depCount }
});

console.log('Build instrumentation complete. Check logs for details.');

