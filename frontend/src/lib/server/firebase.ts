import admin from 'firebase-admin';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

console.log('--- SERVER FIREBASE INITIALIZATION START ---');

if (admin.apps.length === 0) {
	console.log('Firebase Admin SDK not initialized. Starting setup...');
	console.log(`SvelteKit dev mode: ${dev}`);

	if (dev) {
		console.log('Running in development mode. Preparing to connect to emulators.');
		// In development, we use the emulators.
		// Unset GOOGLE_APPLICATION_CREDENTIALS to ensure the Admin SDK
		// connects to the emulators when running locally.
		delete process.env['GOOGLE_APPLICATION_CREDENTIALS'];

		// Set Auth emulator host via environment variable, which is the required method for the Admin SDK.
		process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';

		admin.initializeApp({
			projectId: 'fir-tweb',
			storageBucket: env.PRIVATE_FIREBASE_STORAGE_BUCKET
		});

		// For Firestore, we can use the settings() method for a more direct connection.
		const firestore = admin.firestore();
		firestore.settings({
			host: '127.0.0.1:8080',
			ssl: false
		});
		console.log('✅ Firebase Admin initialized for local development with emulators.');
	} else {
		console.log('Running in production mode.');
		// In production, we use the service account credentials.
		const serviceAccountJson = env.PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY;
		const storageBucket = env.PRIVATE_FIREBASE_STORAGE_BUCKET;

		console.log(`PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY length: ${serviceAccountJson ? serviceAccountJson.length : 'undefined'}`);
		console.log(`PRIVATE_FIREBASE_STORAGE_BUCKET: ${storageBucket ? storageBucket : 'undefined'}`);

		if (serviceAccountJson) {
			try {
				console.log('Found service account key. Initializing with service account.');
				const serviceAccount = JSON.parse(serviceAccountJson);
				admin.initializeApp({
					credential: admin.credential.cert(serviceAccount),
					storageBucket: storageBucket
				});
				console.log('✅ Firebase Admin initialized for production.');
			} catch (parseError) {
				console.error('❌ ERROR: Failed to parse PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY:', parseError);
			}
		} else {
			console.error(
				'❌ ERROR: Production environment detected, but PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY is not set or is empty.'
			);
		}
	}
} else {
	console.log('Firebase Admin SDK already initialized.');
}

console.log('--- SERVER FIREBASE INITIALIZATION END ---');

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();