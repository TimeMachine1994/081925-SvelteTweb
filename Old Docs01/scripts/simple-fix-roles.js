#!/usr/bin/env node

// Simple script to fix test account roles via API call
// Run with: node scripts/simple-fix-roles.js

async function fixRoles() {
  try {
    console.log('🔧 Fixing test account roles via API...');
    
    // Try different ports
    const ports = [5173, 5174, 5175];
    let success = false;
    
    for (const port of ports) {
      try {
        console.log(`Trying port ${port}...`);
        const response = await fetch(`http://localhost:${port}/api/fix-test-accounts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Success!', result);
          success = true;
          break;
        } else {
          console.log(`❌ Port ${port} failed:`, response.status);
        }
      } catch (error) {
        console.log(`❌ Port ${port} not available`);
      }
    }
    
    if (!success) {
      console.log('❌ Could not connect to dev server on any port');
      console.log('💡 Make sure your dev server is running: npm run dev');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixRoles();
