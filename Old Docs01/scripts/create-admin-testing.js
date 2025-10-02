#!/usr/bin/env node

/**
 * Create admin user for TESTING environment
 * Run with: node scripts/create-admin-testing.js <email> [displayName]
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0];
const displayName = args[1] || 'Test Administrator';

if (!email) {
  console.error('❌ Usage: node scripts/create-admin-testing.js <email> [displayName]');
  console.error('   Example: node scripts/create-admin-testing.js test-admin@yourdomain.com "Test Admin"');
  process.exit(1);
}

async function createTestingAdmin() {
  try {
    console.log('🧪 Creating admin user for TESTING environment...');
    
    // Initialize Firebase Admin for testing
    const serviceAccountPath = join(__dirname, '..', 'service-account-key.json');
    
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    } catch (error) {
      console.error('❌ Service account key not found at:', serviceAccountPath);
      console.error('   Please ensure service-account-key.json exists in the project root');
      process.exit(1);
    }

    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id
    }, 'testing-admin-app');

    const auth = getAuth(app);
    const db = getFirestore(app);

    // Create or get Firebase Auth user
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('👤 Found existing Firebase Auth user:', userRecord.uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('👤 Creating new Firebase Auth user...');
        userRecord = await auth.createUser({
          email: email,
          displayName: displayName,
          emailVerified: true
        });
        console.log('✅ Firebase Auth user created:', userRecord.uid);
      } else {
        throw error;
      }
    }

    // Set admin custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'admin',
      admin: true,
      environment: 'testing'
    });

    // Create/update Firestore user document
    const adminData = {
      email: email,
      displayName: displayName,
      role: 'admin',
      admin: true,
      environment: 'testing',
      createdAt: new Date(),
      updatedAt: new Date(),
      suspended: false,
      createdBy: 'testing-admin-script',
      uid: userRecord.uid
    };

    await db.collection('users').doc(userRecord.uid).set(adminData, { merge: true });

    console.log('');
    console.log('✅ Testing admin user created successfully!');
    console.log('🧪 Environment: TESTING');
    console.log('📧 Email:', email);
    console.log('👤 Display Name:', displayName);
    console.log('🆔 Firebase UID:', userRecord.uid);
    console.log('🔑 Custom Claims: admin=true, role=admin, environment=testing');
    console.log('');
    console.log('🔐 This user can now access:');
    console.log('   - Admin portal at: /admin');
    console.log('   - My portal at: /my-portal');
    console.log('   - Profile page at: /profile');
    console.log('');
    console.log('💡 User can sign in immediately with their email/password');

  } catch (error) {
    console.error('❌ Error creating testing admin user:', error);
    process.exit(1);
  }
}

createTestingAdmin();
