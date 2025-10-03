#!/usr/bin/env node

// Create a test memorial for testing the streams page
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin for emulators
let adminApp;
if (getApps().length === 0) {
  console.log('🔥 Initializing Firebase Admin for emulators...');
  
  // Set emulator environment variables
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  
  adminApp = initializeApp({
    projectId: 'fir-tweb' // Use the emulator project ID
  });
  
  console.log('✅ Firebase Admin initialized');
} else {
  adminApp = getApps()[0];
  console.log('✅ Using existing Firebase Admin app');
}

const adminDb = getFirestore(adminApp);

async function createTestMemorial() {
  console.log('🎬 Creating test memorial for streams testing...');
  
  const testMemorialId = 'test-memorial-streams';
  const testMemorial = {
    id: testMemorialId,
    lovedOneName: 'John Doe',
    fullSlug: 'john-doe-memorial',
    ownerUid: 'owner-test-uid', // Links to our test owner account
    funeralDirectorUid: 'director-test-uid', // Links to our test funeral director
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublic: true,
    services: {
      main: {
        location: {
          name: 'Memorial Chapel',
          address: '123 Memorial Drive, Orlando, FL 32801',
          isUnknown: false
        },
        time: {
          date: '2024-12-25',
          time: '14:00',
          isUnknown: false
        },
        hours: 2
      },
      additional: []
    },
    // Add some basic memorial info
    birthDate: '1950-01-15',
    deathDate: '2024-10-01',
    biography: 'A loving father and grandfather who will be deeply missed.',
    photos: [],
    followers: [],
    customStreams: {} // For our streams system
  };

  try {
    await adminDb.collection('memorials').doc(testMemorialId).set(testMemorial);
    console.log('✅ Test memorial created successfully!');
    console.log(`📍 Memorial ID: ${testMemorialId}`);
    console.log(`👤 Owner: owner@test.com (owner-test-uid)`);
    console.log(`🏢 Funeral Director: director@test.com (director-test-uid)`);
    console.log(`🔗 Test URL: http://localhost:5173/memorials/${testMemorialId}/streams`);
    console.log('\n🎯 To test:');
    console.log('1. Login as owner@test.com or director@test.com (password: test123)');
    console.log('2. Navigate to the streams URL above');
    console.log('3. You should see the streams management page');
  } catch (error) {
    console.error('❌ Error creating test memorial:', error);
  }
}

createTestMemorial().then(() => {
  console.log('\n🎉 Test memorial ready for streams testing!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
