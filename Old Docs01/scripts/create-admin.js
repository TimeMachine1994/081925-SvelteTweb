#!/usr/bin/env node

/**
 * Bootstrap script to create the first admin user
 * Run with: node scripts/create-admin.js <email> [displayName]
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0];
const displayName = args[1] || 'System Administrator';

if (!email) {
  console.error('❌ Usage: node scripts/create-admin.js <email> [displayName]');
  console.error('   Example: node scripts/create-admin.js admin@yourdomain.com "John Doe"');
  process.exit(1);
}

async function createFirstAdmin() {
  try {
    // Initialize Firebase Admin
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
      credential: cert(serviceAccount)
    });

    const db = getFirestore(app);

    // Check if admin already exists
    const existingAdmins = await db.collection('users')
      .where('role', '==', 'admin')
      .limit(1)
      .get();

    if (!existingAdmins.empty) {
      console.log('⚠️  Admin user already exists. Use the admin portal to create additional admins.');
      process.exit(0);
    }

    // Create the admin user
    const adminData = {
      email: email,
      displayName: displayName,
      role: 'admin',
      isAdmin: true,
      createdAt: new Date(),
      suspended: false,
      createdBy: 'bootstrap-script'
    };

    const userRef = db.collection('users').doc();
    await userRef.set(adminData);

    console.log('✅ First admin user created successfully!');
    console.log('📧 Email:', email);
    console.log('👤 Display Name:', displayName);
    console.log('🆔 User ID:', userRef.id);
    console.log('');
    console.log('🔐 This user can now access the admin portal at: /admin');
    console.log('💡 They will need to sign in with Firebase Auth first');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createFirstAdmin();
