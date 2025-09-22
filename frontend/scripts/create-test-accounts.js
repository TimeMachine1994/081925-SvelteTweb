#!/usr/bin/env node

// Script to create test accounts directly on the server
// Run with: node scripts/create-test-accounts.js

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the server endpoint and make a request
async function createTestAccounts() {
  try {
    console.log('🚀 Creating test accounts via server endpoint...');
    
    const response = await fetch('http://localhost:5174/api/create-test-accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Test accounts created successfully!');
      console.log('\n📋 Results:');
      result.results.forEach(item => {
        if (item.type === 'memorial') {
          console.log(`   Memorial: ${item.success ? '✅' : '❌'} ${item.id || item.error}`);
        } else {
          console.log(`   ${item.role}: ${item.success ? '✅' : '❌'} ${item.email} ${item.message || item.error || ''}`);
        }
      });
      
      console.log('\n🎯 Test Accounts Ready:');
      console.log('   Admin: admin@test.com / test123');
      console.log('   Funeral Director: director@test.com / test123');
      console.log('   Owner: owner@test.com / test123');
      console.log('   Viewer: viewer@test.com / test123');
      
    } else {
      console.error('❌ Failed to create test accounts:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error creating test accounts:', error.message);
    console.log('\n💡 Make sure your dev server is running on http://localhost:5174');
    console.log('   Run: npm run dev');
  }
}

createTestAccounts();
