import admin from 'firebase-admin';
import { dev, building } from '$app/environment';
import { env } from '$env/dynamic/private';

let firebaseAdminApp: admin.app.App | undefined;

console.log('--- SERVER FIREBASE INITIALIZATION START ---');

if (admin.apps.length === 0) {
	console.log('Firebase Admin SDK not initialized. Starting setup...');
	console.log(`SvelteKit dev mode: ${dev}`);

	if (building) {
		console.log('Running in build mode. Skipping Firebase Admin SDK initialization.');
	} else {
		if (dev) {
			console.log('Running in development mode. Preparing to connect to emulators.');
			delete process.env['GOOGLE_APPLICATION_CREDENTIALS'];
			process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';

			firebaseAdminApp = admin.initializeApp({
			});

			const firestore = firebaseAdminApp.firestore();
			firestore.settings({
				host: '127.0.0.1:8080',
				ssl: false
			});
			console.log('✅ Firebase Admin initialized for local development with emulators.');
		} else {
			console.log('Running in production mode.');
			const serviceAccountJson = env.PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY;
			const storageBucket = env.PRIVATE_FIREBASE_STORAGE_BUCKET;

			console.log(`PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY length: ${serviceAccountJson ? serviceAccountJson.length : 'undefined'}`);
			console.log(`PRIVATE_FIREBASE_STORAGE_BUCKET: ${storageBucket ? storageBucket : 'undefined'}`);

			if (serviceAccountJson) {
				try {
					console.log('Found service account key. Initializing with service account.');
					const serviceAccount = JSON.parse(serviceAccountJson);
					firebaseAdminApp = admin.initializeApp({
						credential: admin.credential.cert(serviceAccount),
						projectId: serviceAccount.project_id, // Explicitly set projectId from service account
						storageBucket: storageBucket
					});
					console.log(`✅ Firebase Admin initialized for production. Project ID from service account: ${serviceAccount.project_id}`);
				} catch (parseError) {
					console.error('❌ ERROR: Failed to parse PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY:', parseError);
				}
			} else {
				console.error(
					'❌ ERROR: Production environment detected, but PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY is not set or is empty.'
				);
			}
		}
	}
} else {
	console.log('Firebase Admin SDK already initialized.');
	firebaseAdminApp = admin.app(); // Get the default app if already initialized
}

console.log('--- SERVER FIREBASE INITIALIZATION END ---');

function ensureFirebaseAppInitialized(): admin.app.App {
    if (!firebaseAdminApp) {
        throw new Error('Firebase Admin SDK has not been initialized. Ensure it runs in a server environment.');
    }
    return firebaseAdminApp;
}

export const getAdminAuth = () => ensureFirebaseAppInitialized().auth();
export const getAdminDb = () => ensureFirebaseAppInitialized().firestore();
export const getAdminStorage = () => ensureFirebaseAppInitialized().storage();