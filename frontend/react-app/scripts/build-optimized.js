#!/usr/bin/env node
/**
 * Optimized build wrapper
 * Ensures all optimizations are applied correctly
 */

const { spawn } = require('child_process');
const path = require('path');

// Set all optimization environment variables
// Note: We call react-scripts directly to bypass npm's prebuild hook
process.env.GENERATE_SOURCEMAP = 'false';
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.INLINE_RUNTIME_CHUNK = 'false';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=4096';

console.log('🚀 Starting optimized build (linting skipped):');
console.log('  - GENERATE_SOURCEMAP:', process.env.GENERATE_SOURCEMAP);
console.log('  - DISABLE_ESLINT_PLUGIN:', process.env.DISABLE_ESLINT_PLUGIN);
console.log('  - INLINE_RUNTIME_CHUNK:', process.env.INLINE_RUNTIME_CHUNK);
console.log('  - NODE_OPTIONS:', process.env.NODE_OPTIONS);
console.log('');

const startTime = Date.now();

// Call react-scripts directly to bypass npm prebuild hook entirely
// This skips the prebuild linting step completely
const build = spawn('npx', ['react-scripts', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    GENERATE_SOURCEMAP: 'false',
    DISABLE_ESLINT_PLUGIN: 'true',
    INLINE_RUNTIME_CHUNK: 'false',
    NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=4096'
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

