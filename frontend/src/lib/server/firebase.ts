import admin from 'firebase-admin';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

console.log('--- SERVER FIREBASE INITIALIZATION START ---');
console.log('🔥 [FIREBASE] Environment check - dev mode:', dev);
console.log('🔥 [FIREBASE] NODE_ENV:', process.env.NODE_ENV);
console.log('🔥 [FIREBASE] Current admin apps count:', admin.apps.length);

if (admin.apps.length) {
	console.log('🔥 [FIREBASE] Firebase Admin SDK already initialized.');
	console.log('🔥 [FIREBASE] Existing app names:', admin.apps.map(app => app.name));
} else {
	console.log('🔥 [FIREBASE] Firebase Admin SDK not initialized. Starting setup...');
	console.log('🔥 [FIREBASE] SvelteKit dev mode:', dev);

	if (dev) {
		console.log('Running in development mode. Preparing to connect to emulators.');
		// In development, we use the emulators.
		// Unset GOOGLE_APPLICATION_CREDENTIALS to ensure the Admin SDK
		// connects to the emulators when running locally.
		console.log('Running in development mode. Connecting to emulators.');
		// Unset GOOGLE_APPLICATION_CREDENTIALS to prioritize emulators.
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
		console.log('✅ Firebase Admin initialized for local development with emulators.');
	} else {
		console.log('🔥 [FIREBASE] Running in production mode.');
		// In production, we use the service account credentials.
		const serviceAccountJson = env.PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY;
		const storageBucket = env.PRIVATE_FIREBASE_STORAGE_BUCKET;

		console.log('🔥 [FIREBASE] Service account key present:', !!serviceAccountJson);
		console.log('🔥 [FIREBASE] Storage bucket:', storageBucket);

		if (serviceAccountJson) {
			try {
				console.log('🔥 [FIREBASE] Found service account key. Initializing with service account.');
				console.log('🔥 [FIREBASE] Service account key length:', serviceAccountJson.length);
				const serviceAccount = JSON.parse(serviceAccountJson);
				console.log('🔥 [FIREBASE] Parsed service account project_id:', serviceAccount.project_id);
				
				admin.initializeApp({
					credential: admin.credential.cert(serviceAccount),
					storageBucket: storageBucket
				});
				console.log('✅ [FIREBASE] Firebase Admin initialized for production with service account.');
			} catch (parseError) {
				console.error('❌ [FIREBASE] Error parsing service account JSON:', parseError);
				console.error('❌ [FIREBASE] Service account preview:', serviceAccountJson.substring(0, 100));
				// Fallback: try to initialize with default credentials or hardcoded config
				console.log('🔄 [FIREBASE] Attempting fallback initialization...');
				admin.initializeApp({
					projectId: 'fir-tweb',
					storageBucket: storageBucket || 'fir-tweb.firebasestorage.app'
				});
				console.log('⚠️ [FIREBASE] Firebase Admin initialized with fallback configuration.');
			}
		} else {
			console.log('⚠️ [FIREBASE] No service account key found, using default configuration...');
			// Fallback initialization for production
			admin.initializeApp({
				projectId: 'fir-tweb',
				storageBucket: storageBucket || 'fir-tweb.firebasestorage.app'
			});
			console.log('⚠️ [FIREBASE] Firebase Admin initialized with default configuration.');
		}
	}
}

console.log('--- SERVER FIREBASE INITIALIZATION END ---');

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();