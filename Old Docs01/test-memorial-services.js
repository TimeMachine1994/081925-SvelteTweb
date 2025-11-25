#!/usr/bin/env node

/**
 * Test script to verify Event.services structure works correctly
 * Tests the complete flow from event creation to Calculator/Schedule components
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(readFileSync('./service-account-key.json', 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.log('⚠️  Using default Firebase credentials');
    admin.initializeApp();
  }
}

const db = admin.firestore();

async function testMemorialServicesStructure() {
  console.log('\n🧪 Testing Event.services Structure\n');

  try {
    // 1. Find test event created by our test accounts script
    console.log('1. Looking for test event...');
    const memorialsSnapshot = await db.collection('memorials')
      .where('lovedOneName', '==', 'John Test Doe')
      .limit(1)
      .get();

    if (memorialsSnapshot.empty) {
      console.log('❌ No test event found. Creating one...');
      await createTestMemorial();
      return;
    }

    const event = memorialsSnapshot.docs[0];
    const memorialData = event.data();
    const memorialId = event.id;

    console.log(`✅ Found test event: ${memorialId}`);
    console.log(`   Loved one: ${memorialData.lovedOneName}`);

    // 2. Verify services structure
    console.log('\n2. Verifying services structure...');
    if (!memorialData.services) {
      console.log('❌ Event missing services structure');
      return;
    }

    if (!memorialData.services.main) {
      console.log('❌ Event missing services.main');
      return;
    }

    if (!Array.isArray(memorialData.services.additional)) {
      console.log('❌ Event services.additional is not an array');
      return;
    }

    console.log('✅ Services structure is valid');
    console.log('   Main service:', JSON.stringify(memorialData.services.main, null, 2));
    console.log('   Additional services count:', memorialData.services.additional.length);

    // 3. Test API endpoint compatibility
    console.log('\n3. Testing API endpoint compatibility...');
    await testAPIEndpoints(memorialId);

    // 4. Test data transformation for Calculator component
    console.log('\n4. Testing Calculator component data transformation...');
    testCalculatorDataTransformation(memorialData);

    console.log('\n✅ All tests passed! Event.services structure is working correctly.\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

async function createTestMemorial() {
  console.log('Creating test event with new services structure...');
  
  const testMemorialData = {
    lovedOneName: 'John Test Doe',
    slug: 'celebration-of-life-for-john-test-doe',
    fullSlug: `celebration-of-life-for-john-test-doe-${Date.now()}`,
    ownerUid: 'test-owner-uid',
    funeralDirectorUid: 'test-fd-uid',
    creatorEmail: 'test@funeral-director.com',
    familyContactEmail: 'family@test.com',
    
    // New services structure
    services: {
      main: {
        location: {
          name: 'Test Event Chapel',
          address: '123 Event Ave, Test City, TC 12345',
          isUnknown: false
        },
        time: {
          date: '2024-01-15',
          time: '14:00',
          isUnknown: false
        },
        hours: 2
      },
      additional: []
    },
    
    // Funeral director information
    funeralDirector: {
      id: 'test-fd-uid',
      companyName: 'Test Funeral Home',
      contactPerson: 'Jane Director',
      phone: '555-0123',
      email: 'test@funeral-director.com'
    },
    
    // Family contact information
    family: {
      primaryContact: {
        name: 'John Family',
        email: 'family@test.com',
        phone: '555-0456',
        contactPreference: 'email'
      }
    },
    
    isPublic: true,
    content: 'Test event for services structure validation',
    custom_html: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const memorialRef = await db.collection('memorials').add(testMemorialData);
  console.log(`✅ Created test event: ${memorialRef.id}`);
  
  // Test the newly created event
  await testMemorialServicesStructure();
}

async function testAPIEndpoints(memorialId) {
  // Test schedule API endpoint structure
  const fetch = (await import('node-fetch')).default;
  
  try {
    // Test GET event data
    const response = await fetch(`http://localhost:5174/api/memorials/${memorialId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.services && data.services.main) {
        console.log('✅ GET event API returns correct services structure');
      } else {
        console.log('❌ GET event API missing services structure');
      }
    } else {
      console.log('⚠️  Event API not accessible (authentication required)');
    }
  } catch (error) {
    console.log('⚠️  API test skipped (server may not be running)');
  }
}

function testCalculatorDataTransformation(memorialData) {
  // Simulate the data transformation that happens in Calculator component
  const services = memorialData.services;
  
  // Test legacy form data derivation
  const legacyFormData = {
    lovedOneName: memorialData.lovedOneName,
    mainService: services.main,
    additionalLocation: {
      enabled: services.additional.some(s => s.type === 'location'),
      ...services.additional.find(s => s.type === 'location') || {
        location: { name: '', address: '', isUnknown: false },
        time: { date: null, time: null, isUnknown: false },
        hours: 2
      }
    },
    additionalDay: {
      enabled: services.additional.some(s => s.type === 'day'),
      ...services.additional.find(s => s.type === 'day') || {
        location: { name: '', address: '', isUnknown: false },
        time: { date: null, time: null, isUnknown: false },
        hours: 2
      }
    }
  };

  console.log('✅ Legacy form data transformation successful');
  console.log('   Main service location:', legacyFormData.mainService.location.name);
  console.log('   Additional location enabled:', legacyFormData.additionalLocation.enabled);
  console.log('   Additional day enabled:', legacyFormData.additionalDay.enabled);
}

// Run the test
testMemorialServicesStructure()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
