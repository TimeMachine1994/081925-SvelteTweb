import admin from 'firebase-admin';
import { dev } from '$app/environment';
import { GOOGLE_APPLICATION_CREDENTIALS } from '$env/static/private';

if (!admin.apps.length) {
	if (dev) {
		// In development, we use the emulators.
		// Unset GOOGLE_APPLICATION_CREDENTIALS to ensure the Admin SDK
		// connects to the emulators when running locally.
		delete process.env['GOOGLE_APPLICATION_CREDENTIALS'];
		// Setting these environment variables is the most reliable way to
		// ensure the Admin SDK connects to the emulators.
		process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:5002';
		process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';
		admin.initializeApp({
			projectId: 'fir-tweb'
		});
		console.log('Firebase Admin initialized for local development with emulators.');
	} else {
		// In production, we use the service account credentials.
		// The GOOGLE_APPLICATION_CREDENTIALS env var is only available in production.
		if (GOOGLE_APPLICATION_CREDENTIALS) {
			const serviceAccount = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS);
			admin.initializeApp({
				credential: admin.credential.cert(serviceAccount)
			});
			console.log('Firebase Admin initialized for production.');
		} else {
			// This case should ideally not be reached in a properly configured production environment.
			console.error(
				'Production environment detected, but GOOGLE_APPLICATION_CREDENTIALS are not set.'
			);
		}
	}
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();