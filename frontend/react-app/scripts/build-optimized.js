#!/usr/bin/env node
/**
 * Optimized build wrapper
 * Ensures all optimizations are applied correctly
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 1. Cleanup before starting
console.log('🧹 Cleaning up old build and cache...');
const cachePath = path.join(__dirname, '../node_modules/.cache');
const buildPath = path.join(__dirname, '../build');

try {
  if (fs.existsSync(cachePath)) fs.rmSync(cachePath, { recursive: true, force: true });
  if (fs.existsSync(buildPath)) fs.rmSync(buildPath, { recursive: true, force: true });
  console.log('✨ Cleanup done.');
} catch (e) {
  console.log('⚠️ Cleanup warning:', e.message);
}

// Set all optimization environment variables
process.env.GENERATE_SOURCEMAP = 'false';
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.INLINE_RUNTIME_CHUNK = 'false';
process.env.NODE_ENV = 'production';
// We use 2GB instead of 4GB for the VPS to leave room for the OS and avoid Swap thrashing
process.env.NODE_OPTIONS = '--max-old-space-size=2048';
process.env.IMAGE_INLINE_SIZE_LIMIT = '1000'; // Reduce base64 inlining to save CPU

console.log('🚀 Starting VPS Optimized Build:');
console.log('  - Environment: Production');
console.log('  - Memory Limit: 2048MB');
console.log('  - Sourcemaps: Disabled');
console.log('');

const startTime = Date.now();

const build = spawn('npx', ['react-scripts', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    CI: 'true' // Avoid interactive progress bars that consume CPU/IO
  }
});

build.on('close', (code) => {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  if (code === 0) {
    console.log(`\n✅ Build completed successfully in ${duration}s`);
  } else {
    console.error(`\n❌ Build failed with code ${code} after ${duration}s`);
    process.exit(code);
  }
});

build.on('error', (error) => {
  console.error('Build error:', error);
  process.exit(1);
});

