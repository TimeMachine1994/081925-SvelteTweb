/**
 * Script to make a user an admin
 * Usage: node make-admin.js <email>
 * 
 * Requires GOOGLE_APPLICATION_CREDENTIALS environment variable to be set
 * or run from a directory with a service account key.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'tributestreamlive'
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function makeAdmin(email) {
  if (!email) {
    console.error('Usage: node make-admin.js <email>');
    process.exit(1);
  }

  console.log(`🔍 Looking for user with email: ${email}`);

  try {
    // Find user by email in Firebase Auth
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;
    console.log(`✅ Found user in Firebase Auth: ${uid}`);

    // Update Firestore user document
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log(`⚠️ User document doesn't exist in Firestore, creating...`);
      await userRef.set({
        email: email,
        role: 'admin',
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      console.log(`📝 Updating existing user document...`);
      await userRef.update({
        role: 'admin',
        isAdmin: true,
        updatedAt: new Date()
      });
    }

    // Set custom claims for Firebase Auth
    console.log(`🔐 Setting admin custom claims...`);
    await auth.setCustomUserClaims(uid, { 
      admin: true, 
      role: 'admin' 
    });

    console.log(`\n✅ SUCCESS! ${email} is now an admin.`);
    console.log(`   - Firestore role: admin`);
    console.log(`   - Firestore isAdmin: true`);
    console.log(`   - Auth custom claims: { admin: true, role: 'admin' }`);
    console.log(`\n⚠️ The user may need to log out and log back in for changes to take effect.`);

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ No user found with email: ${email}`);
      console.error(`   Make sure the user has registered first.`);
    } else {
      console.error(`❌ Error:`, error.message);
    }
    process.exit(1);
  }
}

const email = process.argv[2] || 'austinbryanfilm@gmail.com';
makeAdmin(email).then(() => process.exit(0));
