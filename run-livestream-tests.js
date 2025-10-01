#!/usr/bin/env node

/**
 * Livestream Status Transitions Test Runner
 * Runs all tests for the enhanced UX flow: live → ending → completed
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🎬 Running Livestream Status Transitions Tests\n');

async function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`📋 Running: ${command} ${args.join(' ')}`);
    console.log(`📁 Directory: ${cwd}\n`);
    
    const process = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${command} completed successfully\n`);
        resolve();
      } else {
        console.log(`❌ ${command} failed with code ${code}\n`);
        reject(new Error(`Command failed: ${command}`));
      }
    });

    process.on('error', (error) => {
      console.error(`❌ Error running ${command}:`, error);
      reject(error);
    });
  });
}

async function runTests() {
  const frontendDir = path.join(__dirname, 'frontend');
  
  try {
    console.log('🧪 Step 1: Running API Endpoint Tests');
    console.log('='.repeat(50));
    await runCommand('npm', ['run', 'test', '--', 'tests/api/'], frontendDir);

    console.log('🎭 Step 2: Running Component Unit Tests');
    console.log('=' .repeat(50));
    await runCommand('npm', ['run', 'test', '--', 'tests/components/'], frontendDir);

    console.log('🌐 Step 3: Running E2E Tests');
    console.log('=' .repeat(50));
    await runCommand('npm', ['run', 'test:e2e', '--', 'e2e/livestream-status-transitions.spec.ts'], frontendDir);

    console.log('🎉 All Livestream Tests Passed!');
    console.log('=' .repeat(50));
    console.log('✅ API Endpoint Tests: PASSED');
    console.log('✅ Component Unit Tests: PASSED');
    console.log('✅ E2E Flow Tests: PASSED');
    console.log('\n🚀 Enhanced UX Flow (live → ending → completed) is working correctly!');

  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure all dependencies are installed: npm install');
    console.log('2. Check that the dev server is running for E2E tests');
    console.log('3. Verify Firebase emulators are running for API tests');
    console.log('4. Check test file paths and imports');
    process.exit(1);
  }
}

// Run specific test suites based on command line args
const args = process.argv.slice(2);

if (args.includes('--api-only')) {
  console.log('🧪 Running API Tests Only\n');
  runCommand('npm', ['run', 'test', '--', 'tests/api/'], path.join(__dirname, 'frontend'));
} else if (args.includes('--components-only')) {
  console.log('🎭 Running Component Tests Only\n');
  runCommand('npm', ['run', 'test', '--', 'tests/components/'], path.join(__dirname, 'frontend'));
} else if (args.includes('--e2e-only')) {
  console.log('🌐 Running E2E Tests Only\n');
  runCommand('npm', ['run', 'test:e2e', '--', 'e2e/livestream-status-transitions.spec.ts'], path.join(__dirname, 'frontend'));
} else {
  // Run all tests
  runTests();
}
