#!/usr/bin/env node

/**
 * Clean test data from Firebase emulators
 * This script removes all test accounts and data
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

async function deleteCollection(collectionName) {
  console.log(`Cleaning ${collectionName} collection...`);
  
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const deletePromises = [];
    
    querySnapshot.forEach((document) => {
      deletePromises.push(deleteDoc(doc(db, collectionName, document.id)));
    });
    
    await Promise.all(deletePromises);
    console.log(`✓ Deleted ${deletePromises.length} documents from ${collectionName}`);
    
  } catch (error) {
    console.error(`Error cleaning ${collectionName}:`, error);
  }
}

async function cleanTestData() {
  try {
    console.log('🧹 Cleaning test data from Tributestream emulators...\n');
    
    // Clean Firestore collections
    await deleteCollection('users');
    await deleteCollection('memorials');
    await deleteCollection('funeral_directors');
    await deleteCollection('streams');
    await deleteCollection('admin_actions');
    await deleteCollection('audit_logs');
    
    console.log('\n✅ Test data cleanup complete!');
    console.log('\nNote: Firebase Auth users in emulator will persist until emulator restart.');
    console.log('To fully clean auth data, restart the Firebase emulators.');
    
  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanTestData();
