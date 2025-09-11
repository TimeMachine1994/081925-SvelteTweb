#!/usr/bin/env node

// Script to fix custom claims for test accounts
// Run with: node scripts/fix-test-account-roles.js

import { adminAuth } from '../src/lib/server/firebase.js';

const testAccounts = [
  {
    email: 'admin@test.com',
    role: 'admin',
    customClaims: {
      role: 'admin',
      admin: true
    }
  },
  {
    email: 'director@test.com', 
    role: 'funeral_director',
    customClaims: {
      role: 'funeral_director',
      admin: false
    }
  },
  {
    email: 'owner@test.com',
    role: 'owner', 
    customClaims: {
      role: 'owner',
      admin: false
    }
  }
];

async function fixTestAccountRoles() {
  try {
    console.log('🔧 Fixing test account custom claims...');
    
    for (const account of testAccounts) {
      try {
        // Get user by email
        const userRecord = await adminAuth.getUserByEmail(account.email);
        
        // Set custom claims
        await adminAuth.setCustomUserClaims(userRecord.uid, account.customClaims);
        
        console.log(`✅ ${account.email}: Set role to ${account.role}`);
        
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          console.log(`⚠️  ${account.email}: User not found, skipping`);
        } else {
          console.error(`❌ ${account.email}: Error - ${error.message}`);
        }
      }
    }
    
    console.log('\n🎯 Test accounts should now work with DevRoleSwitcher!');
    console.log('Try switching roles in the dev mode banner.');
    
  } catch (error) {
    console.error('❌ Error fixing test account roles:', error.message);
  }
}

fixTestAccountRoles();
