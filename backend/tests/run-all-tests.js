/**
 * Script to run all authentication and permissions tests
 * Usage: node tests/run-all-tests.js
 */

const { spawn } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function runTests(testType = 'all') {
  return new Promise((resolve, reject) => {
    const testPattern = testType === 'all' 
      ? '**/*.test.js' 
      : testType === 'unit'
      ? '**/unit/**/*.test.js'
      : '**/integration/**/*.test.js';

    log(`\n${'='.repeat(60)}`, colors.cyan);
    log(`Running ${testType} tests...`, colors.bright);
    log(`${'='.repeat(60)}\n`, colors.cyan);

    const jest = spawn('npx', ['jest', '--testPathPattern', testPattern, '--verbose'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      shell: true
    });

    jest.on('close', (code) => {
      if (code === 0) {
        log(`\n✅ ${testType} tests completed successfully!`, colors.green);
        resolve();
      } else {
        log(`\n❌ ${testType} tests failed with code ${code}`, colors.red);
        reject(new Error(`Tests failed with code ${code}`));
      }
    });

    jest.on('error', (error) => {
      log(`\n❌ Error running tests: ${error.message}`, colors.red);
      reject(error);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';

  log('\n🧪 Authentication & Permissions Test Suite', colors.bright);
  log('='.repeat(60), colors.cyan);

  try {
    if (testType === 'all') {
      await runTests('unit');
      await runTests('integration');
    } else {
      await runTests(testType);
    }

    log('\n' + '='.repeat(60), colors.cyan);
    log('✅ All tests completed!', colors.green);
    log('='.repeat(60) + '\n', colors.cyan);
  } catch (error) {
    log('\n' + '='.repeat(60), colors.red);
    log('❌ Test suite failed!', colors.red);
    log('='.repeat(60) + '\n', colors.red);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runTests };

