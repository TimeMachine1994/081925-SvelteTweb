#!/usr/bin/env node

/**
 * Setup test data for TributeStream testing
 * This script creates test accounts and data in Firebase emulators
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';

// Firebase config for emulator
const firebaseConfig = {
  apiKey: "test-api-key",
  authDomain: "test-project.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "test-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
auth.useEmulator('http://localhost:9099');
db.useEmulator('localhost', 8080);

const testUsers = [
  {
    email: 'owner@test.com',
    password: 'test123',
    role: 'owner',
    displayName: 'Test Owner',
    phone: '(555) 123-4567'
  },
  {
    email: 'director@test.com',
    password: 'test123',
    role: 'funeral_director',
    displayName: 'Test Director',
    phone: '(555) 555-5555'
  },
  {
    email: 'admin@test.com',
    password: 'test123',
    role: 'admin',
    displayName: 'Test Admin',
    phone: '(555) 111-1111'
  },
  {
    email: 'viewer@test.com',
    password: 'test123',
    role: 'viewer',
    displayName: 'Test Viewer',
    phone: '(555) 999-9999'
  }
];

const testMemorials = [
  {
    id: 'test-memorial',
    lovedOneName: 'John Doe',
    slug: 'celebration-of-life-for-john-doe',
    fullSlug: 'celebration-of-life-for-john-doe',
    ownerEmail: 'owner@test.com',
    creatorEmail: 'owner@test.com',
    creatorName: 'Test Owner',
    services: {
      main: {
        location: { name: 'Memorial Chapel', address: '123 Main St', isUnknown: false },
        time: { date: '2024-06-15', time: '14:00', isUnknown: false },
        hours: 2
      },
      additional: []
    },
    isPublic: true,
    content: 'A loving tribute to John Doe...',
    isPaid: true,
    birthDate: '1950-01-01',
    deathDate: '2024-01-01',
    memorialDate: '2024-06-15',
    familyContactName: 'Test Owner',
    familyContactEmail: 'owner@test.com',
    familyContactPhone: '(555) 123-4567',
    photos: [],
    embeds: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const testFuneralDirectors = [
  {
    uid: '', // Will be set after user creation
    email: 'director@test.com',
    companyName: 'Test Funeral Home',
    contactPerson: 'Test Director',
    phone: '(555) 555-5555',
    address: {
      street: '456 Business Ave',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345'
    },
    status: 'approved',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function createTestUsers() {
  console.log('Creating test users...');
  
  for (const user of testUsers) {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      const uid = userCredential.user.uid;
      
      // Create user profile document
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        phone: user.phone,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        memorialCount: user.role === 'owner' ? 1 : 0,
        hasPaidForMemorial: user.role === 'owner'
      });
      
      console.log(`✓ Created user: ${user.email} (${user.role})`);
      
      // Store UID for funeral director profile
      if (user.role === 'funeral_director') {
        testFuneralDirectors[0].uid = uid;
      }
      
      // Set owner UID for memorial
      if (user.role === 'owner') {
        testMemorials[0].ownerUid = uid;
      }
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`- User already exists: ${user.email}`);
      } else {
        console.error(`Error creating user ${user.email}:`, error);
      }
    }
  }
}

async function createTestMemorials() {
  console.log('Creating test memorials...');
  
  for (const memorial of testMemorials) {
    try {
      await setDoc(doc(db, 'memorials', memorial.id), memorial);
      console.log(`✓ Created memorial: ${memorial.lovedOneName}`);
    } catch (error) {
      console.error(`Error creating memorial ${memorial.lovedOneName}:`, error);
    }
  }
}

async function createTestFuneralDirectors() {
  console.log('Creating test funeral directors...');
  
  for (const director of testFuneralDirectors) {
    if (!director.uid) {
      console.log('- Skipping funeral director (no UID)');
      continue;
    }
    
    try {
      await addDoc(collection(db, 'funeral_directors'), director);
      console.log(`✓ Created funeral director: ${director.companyName}`);
    } catch (error) {
      console.error(`Error creating funeral director ${director.companyName}:`, error);
    }
  }
}

async function setupTestData() {
  try {
    console.log('🚀 Setting up test data for TributeStream...\n');
    
    await createTestUsers();
    console.log('');
    
    await createTestMemorials();
    console.log('');
    
    await createTestFuneralDirectors();
    console.log('');
    
    console.log('✅ Test data setup complete!');
    console.log('\nTest accounts created:');
    console.log('- owner@test.com (password: test123)');
    console.log('- director@test.com (password: test123)');
    console.log('- admin@test.com (password: test123)');
    console.log('- viewer@test.com (password: test123)');
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  }
}

// Run setup
setupTestData();
