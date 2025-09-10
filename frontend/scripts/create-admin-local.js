#!/usr/bin/env node

/**
 * Bootstrap script to create the first admin user in LOCAL EMULATORS
 * Run with: node scripts/create-admin-local.js <email> <password> [displayName]
 */

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0];
const password = args[1] || 'admin123';
const displayName = args[2] || 'Local Admin';

if (!email) {
  console.error('❌ Usage: node scripts/create-admin-local.js <email> <password> [displayName]');
  console.error('   Example: node scripts/create-admin-local.js admin@test.com admin123 "Local Admin"');
  process.exit(1);
}

async function createLocalAdmin() {
  try {
    console.log('🔥 Connecting to Firebase emulators...');
    
    // Set emulator environment variables for Admin SDK
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    
    // Initialize Firebase Admin for emulators
    const app = initializeApp({
      projectId: 'fir-tweb'
    });

    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // Configure Firestore to use emulator
    db.settings({
      host: '127.0.0.1:8080',
      ssl: false
    });

    console.log('✅ Connected to emulators');

    // Check if user already exists in emulator
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('👤 User already exists in emulator, updating claims...');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('👤 Creating new user in emulator...');
        // Create user in Auth emulator
        userRecord = await auth.createUser({
          email: email,
          password: password,
          displayName: displayName,
          emailVerified: true
        });
        console.log('✅ User created in Auth emulator');
      } else {
        throw error;
      }
    }

    // Set admin custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      admin: true,
      role: 'admin'
    });
    console.log('✅ Admin custom claims set');

    // Create/update user document in Firestore emulator
    const userData = {
      email: email,
      displayName: displayName,
      role: 'admin',
      admin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      suspended: false,
      createdBy: 'local-bootstrap-script'
    };

    await db.collection('users').doc(userRecord.uid).set(userData, { merge: true });
    console.log('✅ User document created in Firestore emulator');

    console.log('');
    console.log('🎉 Local admin user ready!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Display Name:', displayName);
    console.log('🆔 User ID:', userRecord.uid);
    console.log('');
    console.log('🔐 You can now log in at: http://localhost:5173/login');
    console.log('🏛️ Admin portal: http://localhost:5173/admin');
    console.log('');
    console.log('⚠️  Note: This user only exists in the local emulators');

  } catch (error) {
    console.error('❌ Error creating local admin user:', error);
    console.error('❌ Make sure Firebase emulators are running: firebase emulators:start');
    process.exit(1);
  }
}

createLocalAdmin();
