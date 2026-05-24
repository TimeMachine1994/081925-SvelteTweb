// frontend/scripts/create-admin-emulator-user.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
// IMPORTANT: Replace './path/to/your/serviceAccountKey.json' with the actual path to your Firebase service account key.
// You can generate this from your Firebase project settings -> Service accounts.
// Keep this file secure and DO NOT commit it to public repositories.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./fir-tweb-firebase-adminsdk-fbsvc-5ff490e0ea.json');

// Initialize Firebase Admin SDK to target the emulator
// Ensure your Firebase Auth emulator is running on port 9099 and Firestore on 8080.
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth();

async function createAdminUser(email, password) {
  try {
    let userRecord;
    try {
      // Try to get the user first to avoid creating duplicates
      userRecord = await auth.getUserByEmail(email);
      console.log(`User ${email} already exists. Updating claims.`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // If user not found, create it
        userRecord = await auth.createUser({
          email: email,
          password: password,
          displayName: 'Admin User',
        });
        console.log(`Successfully created user: ${userRecord.uid} with email: ${email}`);
      } else {
        throw error; // Re-throw other errors
      }
    }

    // Set custom claim
    await auth.setCustomUserClaims(userRecord.uid, { admin: true });
    console.log(`Successfully set admin claim for user: ${email}`);

  } catch (error) {
    console.error('Error creating or setting admin claim:', error);
  }
}

// Call the function with the desired admin user details
createAdminUser('austinbryanfilm@gmail.com', 'testtest');