#!/usr/bin/env node

// Script to reset Firebase emulator and create fresh test accounts
// Run with: node scripts/reset-emulator-accounts.js

async function resetAndCreateAccounts() {
  try {
    console.log('🔄 Resetting Firebase Auth emulator...');
    
    // Clear all users from Firebase Auth emulator
    const clearResponse = await fetch('http://localhost:9099/emulator/v1/projects/demo-project/accounts', {
      method: 'DELETE'
    });
    
    if (clearResponse.ok) {
      console.log('✅ Firebase Auth emulator cleared');
    } else {
      console.log('⚠️  Could not clear emulator (may already be empty)');
    }
    
    // Wait a moment for emulator to reset
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🚀 Creating fresh test accounts...');
    
    // Create test accounts via our API
    const createResponse = await fetch('http://localhost:5173/api/create-test-accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!createResponse.ok) {
      throw new Error(`HTTP ${createResponse.status}: ${createResponse.statusText}`);
    }
    
    const result = await createResponse.json();
    
    if (result.success) {
      console.log('✅ Test accounts created successfully!');
      console.log('\n📋 Results:');
      result.results.forEach(item => {
        if (item.type === 'event') {
          console.log(`   Event: ${item.success ? '✅' : '❌'} ${item.id || item.error}`);
        } else {
          console.log(`   ${item.role}: ${item.success ? '✅' : '❌'} ${item.email} ${item.message || item.error || ''}`);
        }
      });
      
      console.log('\n🎯 Test Accounts Ready for Role Switching:');
      console.log('   Admin: admin@test.com / test123');
      console.log('   Funeral Director: director@test.com / test123');
      console.log('   Owner: owner@test.com / test123');
      console.log('   Viewer: viewer@test.com / test123');
      
      console.log('\n💡 Now try the role switcher in the red dev banner!');
      
    } else {
      console.error('❌ Failed to create test accounts:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Firebase emulators are running: firebase emulators:start');
    console.log('   2. Dev server is running: npm run dev');
    console.log('   3. Auth emulator is on port 9099');
  }
}

resetAndCreateAccounts();
