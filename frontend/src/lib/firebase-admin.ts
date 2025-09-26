import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
let adminApp;

if (getApps().length === 0) {
  // In production, use service account key from environment
  // In development, this will use the default credentials
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : undefined;

    adminApp = initializeApp({
      credential: serviceAccount ? cert(serviceAccount) : undefined,
      projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id'
    });
  } catch (error) {
    console.warn('Firebase Admin initialization failed:', error);
    // Fallback initialization for development
    adminApp = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id'
    });
  }
} else {
  adminApp = getApps()[0];
}

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export { adminApp, FieldValue };
