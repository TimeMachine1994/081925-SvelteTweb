// Script to set up admin user in Firebase emulator
// Run with: node scripts/setup-admin-user.js

import admin from 'firebase-admin';

// Connect to emulators
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9098';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081';

admin.initializeApp({
  projectId: 'tributestream-lemhr'
});

const auth = admin.auth();
const db = admin.firestore();

async function setupAdminUser() {
  const email = 'austinbryanfilm@gmail.com';
  const uid = 'LuffqyqsiRUVVAyBbMPjUHy6jVvz';
  
  try {
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
    });
    console.log('✅ Created admin user profile in Firestore');

    // Verify the claims were set
    const user = await auth.getUser(uid);
    console.log('✅ User custom claims:', user.customClaims);
    
    console.log('\n🎉 Admin user setup complete!');
    console.log('Email:', email);
    console.log('Password: admin123');
    console.log('\nYou can now log in at http://localhost:5175/login');
    
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
  }
  
  process.exit(0);
}

setupAdminUser();
