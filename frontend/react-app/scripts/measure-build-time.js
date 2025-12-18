#!/usr/bin/env node
/**
 * Build Time Measurement Script
 * Instruments build process to measure performance improvements
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
    location: 'measure-build-time.js'
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

const startTime = Date.now();

log({
  message: 'Build time measurement started',
  hypothesisId: 'K',
  data: { action: 'start', timestamp: startTime }
});

// Run the build
const build = spawn('npm', ['run', 'build'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    SKIP_PREBUILD: 'true',
    GENERATE_SOURCEMAP: 'false',
    DISABLE_ESLINT_PLUGIN: 'true',
    INLINE_RUNTIME_CHUNK: 'false',
    NODE_OPTIONS: '--max-old-space-size=4096'
  }
});

build.on('close', (code) => {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  log({
    message: 'Build time measurement completed',
    hypothesisId: 'K',
    data: {
      action: 'end',
      duration: parseFloat(duration),
      exitCode: code,
      success: code === 0
    }
  });
  
  console.log(`\n⏱️  Build completed in ${duration}s`);
  
  if (code !== 0) {
    process.exit(code);
  }
});

build.on('error', (error) => {
  log({
    message: 'Build time measurement error',
    hypothesisId: 'K',
    data: { action: 'error', error: error.message }
  });
  
  console.error('Build error:', error);
  process.exit(1);
});

