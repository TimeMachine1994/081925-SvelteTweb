// Script to set up admin user in production Firebase (tributestream-lemhr)
// Run with: node setup-prod-admin.js

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account
const serviceAccountPath = join(__dirname, '..', 'firecms', 'tributestream-lemhr-firebase-adminsdk-fbsvc-51612048ca.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'tributestream-lemhr'
});

const auth = admin.auth();
const db = admin.firestore();

async function setupAdminUser() {
  const email = 'austinbryanfilm@gmail.com';
  const password = 'admin123';
  
  try {
    // First, try to create the user (or get existing)
    let user;
    try {
      user = await auth.createUser({
        email: email,
        password: password,
        displayName: 'Austin Bryan',
        emailVerified: true
      });
      console.log('✅ Created user:', email);
    } catch (e) {
      if (e.code === 'auth/email-already-exists') {
        user = await auth.getUserByEmail(email);
        console.log('✅ User already exists:', email);
      } else {
        throw e;
      }
    }
    
    const uid = user.uid;
    
    // Set custom claims for admin role
    await auth.setCustomUserClaims(uid, {
      role: 'admin',
      admin: true
    });
    console.log('✅ Set admin custom claims for:', email);

    // Create user profile in Firestore
    await db.collection('users').doc(uid).set({
      email: email,
      displayName: 'Austin Bryan',
      role: 'admin',
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('✅ Created/updated admin user profile in Firestore');

    // Verify the claims were set
    const verifiedUser = await auth.getUser(uid);
    console.log('✅ User custom claims:', verifiedUser.customClaims);
    
    console.log('\n🎉 Admin user setup complete in PRODUCTION!');
    console.log('Email:', email);
    console.log('Password: admin123');
    console.log('\nYou can now log in with these credentials.');
    
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
  }
  
  process.exit(0);
}

setupAdminUser();
