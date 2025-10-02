#!/usr/bin/env node

/**
 * Create admin user for PRODUCTION environment
 * Run with: node scripts/create-admin-production.js <email> [displayName]
 * 
 * ⚠️  PRODUCTION SCRIPT - USE WITH CAUTION ⚠️
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0];
const displayName = args[1] || 'Production Administrator';

if (!email) {
  console.error('❌ Usage: node scripts/create-admin-production.js <email> [displayName]');
  console.error('   Example: node scripts/create-admin-production.js admin@yourdomain.com "Production Admin"');
  process.exit(1);
}

// Production safety check
function confirmProduction() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('🚨 PRODUCTION ENVIRONMENT DETECTED 🚨');
    console.log('You are about to create an admin user in PRODUCTION.');
    console.log('');
    rl.question('Type "CONFIRM PRODUCTION" to proceed: ', (answer) => {
      rl.close();
      if (answer === 'CONFIRM PRODUCTION') {
        resolve(true);
      } else {
        console.log('❌ Production admin creation cancelled.');
        process.exit(0);
      }
    });
  });
}

async function createProductionAdmin() {
  try {
    console.log('🏭 Creating admin user for PRODUCTION environment...');
    
    // Production safety confirmation
    await confirmProduction();
    
    // Initialize Firebase Admin for production
    const serviceAccountPath = join(__dirname, '..', 'service-account-key-production.json');
    
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    } catch (error) {
      console.error('❌ Production service account key not found at:', serviceAccountPath);
      console.error('   Please ensure service-account-key-production.json exists in the project root');
      console.error('   This should be different from your testing/development key');
      process.exit(1);
    }

    // Verify this is actually a production project
    if (!serviceAccount.project_id.includes('prod') && !serviceAccount.project_id.includes('production')) {
      console.warn('⚠️  Warning: Project ID does not contain "prod" or "production"');
      console.warn('   Project ID:', serviceAccount.project_id);
      console.warn('   Please verify this is your production Firebase project');
    }

    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id
    }, 'production-admin-app');

    const auth = getAuth(app);
    const db = getFirestore(app);

    // Check if any admin already exists in production
    const existingAdmins = await db.collection('users')
      .where('role', '==', 'admin')
      .limit(5)
      .get();

    if (!existingAdmins.empty) {
      console.log('⚠️  Found', existingAdmins.size, 'existing admin(s) in production:');
      existingAdmins.forEach(doc => {
        const data = doc.data();
        console.log('   -', data.email, '(', data.displayName, ')');
      });
      console.log('');
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      await new Promise((resolve) => {
        rl.question('Continue creating additional admin? (yes/no): ', (answer) => {
          rl.close();
          if (answer.toLowerCase() !== 'yes') {
            console.log('❌ Production admin creation cancelled.');
            process.exit(0);
          }
          resolve();
        });
      });
    }

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
      environment: 'production'
    });

    // Create/update Firestore user document
    const adminData = {
      email: email,
      displayName: displayName,
      role: 'admin',
      admin: true,
      environment: 'production',
      createdAt: new Date(),
      updatedAt: new Date(),
      suspended: false,
      createdBy: 'production-admin-script',
      uid: userRecord.uid
    };

    await db.collection('users').doc(userRecord.uid).set(adminData, { merge: true });

    console.log('');
    console.log('✅ Production admin user created successfully!');
    console.log('🏭 Environment: PRODUCTION');
    console.log('📧 Email:', email);
    console.log('👤 Display Name:', displayName);
    console.log('🆔 Firebase UID:', userRecord.uid);
    console.log('🔑 Custom Claims: admin=true, role=admin, environment=production');
    console.log('');
    console.log('🔐 This user can now access:');
    console.log('   - Admin portal at: /admin');
    console.log('   - My portal at: /my-portal');
    console.log('   - Profile page at: /profile');
    console.log('');
    console.log('💡 User can sign in immediately with their email/password');
    console.log('');
    console.log('🚨 IMPORTANT SECURITY REMINDERS:');
    console.log('   - Change default passwords immediately');
    console.log('   - Enable 2FA for this admin account');
    console.log('   - Review admin permissions regularly');
    console.log('   - Monitor admin activity logs');

  } catch (error) {
    console.error('❌ Error creating production admin user:', error);
    process.exit(1);
  }
}

createProductionAdmin();
