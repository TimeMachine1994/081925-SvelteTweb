import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Check if we're in development mode (emulators)
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.DEV === 'true';

// Initialize Firebase Admin SDK
let adminApp;

if (getApps().length === 0) {
  if (isDevelopment) {
    // Development mode - connect to emulators
    console.log('🔥 Firebase Admin connecting to emulators...');
    
    // Set emulator environment variables for Admin SDK
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    
    adminApp = initializeApp({
      projectId: 'fir-tweb' // Use the emulator project ID
    });
  } else {
    // Production mode - use service account credentials
    try {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : undefined;

      adminApp = initializeApp({
        credential: serviceAccount ? cert(serviceAccount) : undefined,
        projectId: process.env.FIREBASE_PROJECT_ID || 'fir-tweb'
      });
    } catch (error) {
      console.warn('Firebase Admin initialization failed:', error);
      // Fallback initialization
      adminApp = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'fir-tweb'
      });
    }
  }
} else {
  adminApp = getApps()[0];
}

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);

// Configure Firestore to use emulator in development
if (isDevelopment && getApps().length === 1) {
  try {
    adminDb.settings({
      host: '127.0.0.1:8080',
      ssl: false
    });
    console.log('🔥 Firestore Admin configured for emulator');
  } catch (error) {
    // Settings already configured, ignore
    console.log('🔥 Firestore Admin already configured');
  }
}

export { adminApp, FieldValue };
