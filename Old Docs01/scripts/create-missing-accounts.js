#!/usr/bin/env node

/**
 * Create missing test accounts (owner and viewer) in local emulators
 */

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const accounts = [
  {
    email: 'owner@test.com',
    password: 'test123',
    displayName: 'Test Owner',
    role: 'owner'
  },
  {
    email: 'viewer@test.com',
    password: 'test123',
    displayName: 'Test Viewer',
    role: 'viewer'
  }
];

async function createMissingAccounts() {
  try {
    console.log('🔥 Connecting to Firebase emulators...');
    
    // Set emulator environment variables for Admin SDK
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    
    // Initialize Firebase Admin for emulators
    const app = initializeApp({
      projectId: 'tributestreamlive
'
    });

    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // Configure Firestore to use emulator
    db.settings({
      host: '127.0.0.1:8080',
      ssl: false
    });

    console.log('✅ Connected to emulators');

    for (const account of accounts) {
      console.log(`\n👤 Creating ${account.role}: ${account.email}`);
      
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(account.email);
        console.log('   User already exists, updating...');
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Create user in Auth emulator
          userRecord = await auth.createUser({
            email: account.email,
            password: account.password,
            displayName: account.displayName,
            emailVerified: true
          });
          console.log('   ✅ User created in Auth emulator');
        } else {
          throw error;
        }
      }

      // Set custom claims
      const customClaims = {
        role: account.role,
        admin: account.role === 'admin'
      };
      
      await auth.setCustomUserClaims(userRecord.uid, customClaims);
      console.log('   ✅ Custom claims set');

      // Create/update user document in Firestore emulator
      const userData = {
        email: account.email,
        displayName: account.displayName,
        role: account.role,
        admin: account.role === 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        suspended: false,
        createdBy: 'local-bootstrap-script'
      };

      await db.collection('users').doc(userRecord.uid).set(userData, { merge: true });
      console.log('   ✅ User document created in Firestore emulator');
    }

    console.log('\n🎉 All test accounts ready!');
    console.log('📧 Admin: admin@test.com / test123');
    console.log('📧 Funeral Director: director@test.com / test123');
    console.log('📧 Owner: owner@test.com / test123');
    console.log('📧 Viewer: viewer@test.com / test123');
    console.log('');
    console.log('🔐 You can now log in at: http://localhost:5173/login');
    console.log('');
    console.log('⚠️  Note: These users only exist in the local emulators');

  } catch (error) {
    console.error('❌ Error creating accounts:', error);
    console.error('❌ Make sure Firebase emulators are running: firebase emulators:start');
    process.exit(1);
  }
}

createMissingAccounts();
