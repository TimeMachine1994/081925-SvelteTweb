#!/usr/bin/env node

// Comprehensive test suite for DevRoleSwitcher functionality
// Run with: node scripts/test-dev-role-switcher.js

import { readFileSync } from 'fs';

const TEST_ACCOUNTS = [
  { role: 'admin', email: 'admin@test.com', password: 'test123' },
  { role: 'funeral_director', email: 'director@test.com', password: 'test123' },
  { role: 'owner', email: 'owner@test.com', password: 'test123' },
  { role: 'viewer', email: 'viewer@test.com', password: 'test123' }
];

const BASE_URL = 'http://localhost:5173';
const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';

console.log('🧪 DevRoleSwitcher Test Suite');
console.log('================================\n');

// Test 1: Check if emulators are running
async function testEmulatorsRunning() {
  console.log('1️⃣ Testing Firebase Emulator Connectivity...');
  
  try {
    // Test Auth emulator
    const authResponse = await fetch(`${AUTH_EMULATOR_URL}`);
    if (authResponse.ok) {
      console.log('   ✅ Auth emulator (127.0.0.1:9099) is running');
    } else {
      console.log('   ❌ Auth emulator not responding');
      return false;
    }

    // Test Firestore emulator
    const firestoreResponse = await fetch('http://127.0.0.1:8080');
    console.log('   ✅ Firestore emulator (127.0.0.1:8080) is accessible');

    // Test dev server
    const devServerResponse = await fetch(BASE_URL);
    if (devServerResponse.ok) {
      console.log('   ✅ Dev server (localhost:5173) is running');
    } else {
      console.log('   ❌ Dev server not responding');
      return false;
    }

    return true;
  } catch (error) {
    console.log('   ❌ Error testing emulators:', error.message);
    return false;
  }
}

// Test 2: Direct Firebase Auth API calls
async function testFirebaseAuthAPI() {
  console.log('\n2️⃣ Testing Firebase Auth API directly...');
  
  for (const account of TEST_ACCOUNTS) {
    try {
      const response = await fetch(
        `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=dummy`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: account.email,
            password: account.password,
            returnSecureToken: true
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ ${account.role}: ${account.email} authenticated successfully`);
        console.log(`      Token: ${data.idToken.substring(0, 50)}...`);
      } else {
        const errorData = await response.text();
        console.log(`   ❌ ${account.role}: ${account.email} failed - ${response.status}`);
        console.log(`      Error: ${errorData}`);
      }
    } catch (error) {
      console.log(`   ❌ ${account.role}: ${account.email} - Network error: ${error.message}`);
    }
  }
}

// Test 3: Test session creation endpoint
async function testSessionCreation() {
  console.log('\n3️⃣ Testing session creation endpoint...');
  
  // First get a valid token from Auth emulator
  try {
    const authResponse = await fetch(
      `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=dummy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'test123',
          returnSecureToken: true
        })
      }
    );

    if (!authResponse.ok) {
      console.log('   ❌ Could not get auth token for session test');
      return;
    }

    const authData = await authResponse.json();
    const idToken = authData.idToken;

    // Test session creation
    const sessionResponse = await fetch(`${BASE_URL}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log('   ✅ Session creation successful');
      console.log(`      Redirect to: ${sessionData.redirectTo}`);
    } else {
      const errorText = await sessionResponse.text();
      console.log(`   ❌ Session creation failed - ${sessionResponse.status}`);
      console.log(`      Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Session creation test error: ${error.message}`);
  }
}

// Test 4: Test logout endpoint
async function testLogoutEndpoint() {
  console.log('\n4️⃣ Testing logout endpoint...');
  
  try {
    // Test regular logout
    const logoutResponse = await fetch(`${BASE_URL}/logout`, {
      method: 'POST'
    });

    if (logoutResponse.ok || logoutResponse.status === 303) {
      console.log('   ✅ Regular logout endpoint working');
    } else {
      console.log(`   ❌ Regular logout failed - ${logoutResponse.status}`);
    }

    // Test dev logout (no redirect)
    const devLogoutResponse = await fetch(`${BASE_URL}/logout?dev=true`, {
      method: 'POST'
    });

    if (devLogoutResponse.ok) {
      console.log('   ✅ Dev logout endpoint working (no redirect)');
    } else {
      console.log(`   ❌ Dev logout failed - ${devLogoutResponse.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Logout test error: ${error.message}`);
  }
}

// Test 5: Test complete DevRoleSwitcher flow simulation
async function testCompleteFlow() {
  console.log('\n5️⃣ Testing complete DevRoleSwitcher flow...');
  
  for (const account of TEST_ACCOUNTS.slice(0, 2)) { // Test first 2 accounts
    console.log(`\n   Testing ${account.role} (${account.email}):`);
    
    try {
      // Step 1: Logout
      console.log('      1. Logout...');
      await fetch(`${BASE_URL}/logout?dev=true`, { method: 'POST' });
      console.log('         ✅ Logout completed');

      // Step 2: Firebase Auth
      console.log('      2. Firebase Auth...');
      const authResponse = await fetch(
        `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=dummy`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: account.email,
            password: account.password,
            returnSecureToken: true
          })
        }
      );

      if (!authResponse.ok) {
        console.log('         ❌ Firebase Auth failed');
        continue;
      }

      const authData = await authResponse.json();
      console.log('         ✅ Firebase Auth successful');

      // Step 3: Session creation
      console.log('      3. Session creation...');
      const sessionResponse = await fetch(`${BASE_URL}/api/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: authData.idToken })
      });

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        console.log('         ✅ Session created successfully');
        console.log(`         📍 Would redirect to: ${sessionData.redirectTo}`);
      } else {
        console.log('         ❌ Session creation failed');
      }

    } catch (error) {
      console.log(`         ❌ Flow error: ${error.message}`);
    }
  }
}

// Test 6: Browser compatibility test
async function testBrowserCompatibility() {
  console.log('\n6️⃣ Testing browser compatibility issues...');
  
  // Test CORS headers
  try {
    const corsResponse = await fetch(`${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=dummy`, {
      method: 'OPTIONS'
    });
    
    console.log('   📋 CORS preflight response:');
    console.log(`      Status: ${corsResponse.status}`);
    
    const corsHeaders = ['Access-Control-Allow-Origin', 'Access-Control-Allow-Methods', 'Access-Control-Allow-Headers'];
    corsHeaders.forEach(header => {
      const value = corsResponse.headers.get(header);
      console.log(`      ${header}: ${value || 'Not set'}`);
    });
    
  } catch (error) {
    console.log(`   ❌ CORS test error: ${error.message}`);
  }
}

// Run all tests
async function runAllTests() {
  const startTime = Date.now();
  
  const emulatorsOk = await testEmulatorsRunning();
  if (!emulatorsOk) {
    console.log('\n❌ Emulators not running properly. Please start Firebase emulators first.');
    console.log('   Run: firebase emulators:start');
    return;
  }

  await testFirebaseAuthAPI();
  await testSessionCreation();
  await testLogoutEndpoint();
  await testCompleteFlow();
  await testBrowserCompatibility();

  const endTime = Date.now();
  console.log(`\n🏁 Test suite completed in ${endTime - startTime}ms`);
  
  console.log('\n💡 If tests pass but DevRoleSwitcher still fails:');
  console.log('   1. Check browser console for CORS errors');
  console.log('   2. Try refreshing the page to reinitialize Firebase');
  console.log('   3. Ensure you\'re in development mode (DEV=true)');
  console.log('   4. Check if the red DEV MODE banner is visible');
}

runAllTests().catch(console.error);
