#!/usr/bin/env node
/**
 * Conditional prebuild script
 * Only runs linting if not called from optimized build
 */

// Check if this is being called from the optimized build script
// npm_lifecycle_event is set by npm and will be 'build' when called from 'npm run build'
const lifecycleEvent = process.env.npm_lifecycle_event || '';
const isBuildScript = lifecycleEvent === 'build';
const skipPrebuild = process.env.SKIP_PREBUILD === 'true' || process.env.SKIP_PREBUILD === '1';

// Skip linting for the build script (which uses build-optimized.js)
if (isBuildScript || skipPrebuild) {
  console.log('⏭️  Skipping prebuild linting (optimized build)');
  process.exit(0);
}

// Run linting for other build scripts
console.log('🔍 Running prebuild linting...');
const { execSync } = require('child_process');
try {
  execSync('npm run lint:quiet', { stdio: 'inherit' });
  console.log('✅ Linting passed');
} catch (error) {
  console.error('❌ Linting failed:', error.message);
  process.exit(1);
}

