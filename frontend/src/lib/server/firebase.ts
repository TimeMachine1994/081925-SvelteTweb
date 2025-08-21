import admin from 'firebase-admin';
import { dev } from '$app/environment';
import { GOOGLE_APPLICATION_CREDENTIALS } from '$env/static/private';

console.log('--- SERVER FIREBASE INITIALIZATION START ---');

if (admin.apps.length) {
	console.log('Firebase Admin SDK already initialized.');
} else {
	console.log('Firebase Admin SDK not initialized. Starting setup...');
	console.log(`SvelteKit dev mode: ${dev}`);

	if (dev) {
		console.log('Running in development mode. Preparing to connect to emulators.');
		// In development, we use the emulators.
		// Unset GOOGLE_APPLICATION_CREDENTIALS to ensure the Admin SDK
		// connects to the emulators when running locally.
		console.log('Deleting GOOGLE_APPLICATION_CREDENTIALS env var.');
		delete process.env['GOOGLE_APPLICATION_CREDENTIALS'];

		// Setting these environment variables is the most reliable way to
		// ensure the Admin SDK connects to the emulators.
		const authHost = '127.0.0.1:9099';
		const firestoreHost = '127.0.0.1:8080';
		console.log(`Setting FIREBASE_AUTH_EMULATOR_HOST to ${authHost}`);
		process.env['FIREBASE_AUTH_EMULATOR_HOST'] = authHost;
		console.log(`Setting FIRESTORE_EMULATOR_HOST to ${firestoreHost}`);
		process.env['FIRESTORE_EMULATOR_HOST'] = firestoreHost;

		console.log("Initializing admin app with projectId: 'fir-tweb'");
		admin.initializeApp({
			projectId: 'fir-tweb'
		});
		console.log('✅ Firebase Admin initialized for local development with emulators.');
	} else {
		console.log('Running in production mode.');
		// In production, we use the service account credentials.
		// The GOOGLE_APPLICATION_CREDENTIALS env var is only available in production.
		if (GOOGLE_APPLICATION_CREDENTIALS) {
			console.log('Found GOOGLE_APPLICATION_CREDENTIALS. Initializing with service account.');
			const serviceAccount = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS);
			admin.initializeApp({
				credential: admin.credential.cert(serviceAccount)
			});
			console.log('✅ Firebase Admin initialized for production.');
		} else {
			// This case should ideally not be reached in a properly configured production environment.
			console.error(
				'❌ ERROR: Production environment detected, but GOOGLE_APPLICATION_CREDENTIALS are not set.'
			);
		}
	}
}

console.log('--- SERVER FIREBASE INITIALIZATION END ---');

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();