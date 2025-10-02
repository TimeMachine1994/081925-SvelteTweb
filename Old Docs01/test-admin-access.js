#!/usr/bin/env node

const https = require('https');

const PRODUCTION_URL = 'https://tweblol-6urvojfnb-timemachine1994s-projects.vercel.app';

async function testAdminAccess() {
    console.log('🧪 Testing admin route accessibility...\n');
    
    // Test 1: Check if admin route responds (without authentication)
    console.log('1. Testing /admin route response...');
    try {
        const response = await fetch(`${PRODUCTION_URL}/admin`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.status === 302) {
            const location = response.headers.get('location');
            console.log(`   ✅ Redirects to: ${location} (expected for unauthenticated users)`);
        } else if (response.status === 200) {
            console.log(`   ✅ Admin page loads successfully`);
        } else if (response.status === 500) {
            console.log(`   ❌ Server error - admin route still failing`);
        } else {
            console.log(`   ⚠️  Unexpected status: ${response.status}`);
        }
    } catch (error) {
        console.log(`   ❌ Network error: ${error.message}`);
    }
    
    // Test 2: Check if login page loads
    console.log('\n2. Testing /login route...');
    try {
        const response = await fetch(`${PRODUCTION_URL}/login`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.status === 200) {
            console.log(`   ✅ Login page loads successfully`);
        } else {
            console.log(`   ❌ Login page issue`);
        }
    } catch (error) {
        console.log(`   ❌ Network error: ${error.message}`);
    }
    
    // Test 3: Check if profile page redirects properly
    console.log('\n3. Testing /profile route...');
    try {
        const response = await fetch(`${PRODUCTION_URL}/profile`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.status === 302) {
            const location = response.headers.get('location');
            console.log(`   ✅ Redirects to: ${location} (expected for unauthenticated users)`);
        } else if (response.status === 200) {
            console.log(`   ✅ Profile page loads`);
        } else {
            console.log(`   ⚠️  Status: ${response.status}`);
        }
    } catch (error) {
        console.log(`   ❌ Network error: ${error.message}`);
    }
    
    console.log('\n📋 Test Summary:');
    console.log('   - If /admin redirects to /login: ✅ Authentication working');
    console.log('   - If /admin returns 500: ❌ Server error still present');
    console.log('   - If /admin returns 200: ✅ Admin fixes successful');
    console.log('\n💡 To fully test admin access:');
    console.log('   1. Go to your production site');
    console.log('   2. Login with your admin credentials');
    console.log('   3. Navigate to /admin');
    console.log('   4. Check browser console for any errors');
}

testAdminAccess().catch(console.error);
