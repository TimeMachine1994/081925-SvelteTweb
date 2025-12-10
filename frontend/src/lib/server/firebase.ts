import admin from 'firebase-admin';
import type { FieldValue } from 'firebase-admin/firestore';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

console.log('--- SERVER FIREBASE INITIALIZATION START ---');
console.log('🔥 [FIREBASE] Environment check - dev mode:', dev);
console.log('🔥 [FIREBASE] NODE_ENV:', process.env.NODE_ENV);
console.log('🔥 [FIREBASE] Current admin apps count:', admin.apps.length);

if (admin.apps.length) {
	console.log('🔥 [FIREBASE] Firebase Admin SDK already initialized.');
	console.log(
		'🔥 [FIREBASE] Existing app names:',
		admin.apps.map((app) => app.name)
	);
} else {
	console.log('🔥 [FIREBASE] Firebase Admin SDK not initialized. Starting setup...');
	console.log('🔥 [FIREBASE] SvelteKit dev mode:', dev);

	if (dev) {
		console.log('🔥 [FIREBASE] Running in development mode. Checking for emulators...');

		// Check if emulators are running by testing connection
		const net = await import('net');
		const isEmulatorRunning = await new Promise((resolve) => {
			const socket = new net.Socket();
			socket.setTimeout(1000);
			socket.on('connect', () => {
				socket.destroy();
				resolve(true);
			});
			socket.on('timeout', () => {
				socket.destroy();
				resolve(false);
			});
			socket.on('error', () => {
				resolve(false);
			});
			socket.connect(9098, '127.0.0.1');
		});

		if (isEmulatorRunning) {
			console.log('✅ [FIREBASE] Emulators detected. Connecting to local emulators...');
			// Unset GOOGLE_APPLICATION_CREDENTIALS to prioritize emulators
			delete process.env['GOOGLE_APPLICATION_CREDENTIALS'];

			// Set Auth emulator host via environment variable
			process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9098';

			admin.initializeApp({
				projectId: 'tributestreamlive',
				storageBucket: env.PRIVATE_FIREBASE_STORAGE_BUCKET
			});

			// Configure Firestore emulator
			const firestore = admin.firestore();
			firestore.settings({
				host: '127.0.0.1:8081',
				ssl: false
			});
			console.log('✅ [FIREBASE] Connected to Firebase emulators successfully');
		} else {
			console.log('⚠️ [FIREBASE] Emulators not running. Connecting to production Firebase...');
			console.log('💡 [FIREBASE] To use emulators, run: firebase emulators:start');

			// Use production Firebase in dev mode when emulators aren't available
			const serviceAccountJson = env.PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY;

			if (serviceAccountJson) {
				try {
					const serviceAccount = JSON.parse(serviceAccountJson);
					admin.initializeApp({
						credential: admin.credential.cert(serviceAccount),
						storageBucket: env.PRIVATE_FIREBASE_STORAGE_BUCKET || 'tributestreamlive.firebasestorage.app'
					});
					console.log('✅ [FIREBASE] Connected to production Firebase (dev mode fallback)');
				} catch (error) {
					console.error('❌ [FIREBASE] Service account error:', error);
					// Final fallback
					admin.initializeApp({
						projectId: 'tributestreamlive',
						storageBucket: 'tributestreamlive.firebasestorage.app'
					});
					console.log('⚠️ [FIREBASE] Using minimal configuration fallback');
				}
			} else {
				// Minimal fallback configuration
				admin.initializeApp({
					projectId: 'tributestreamlive',
					storageBucket: 'tributestreamlive.firebasestorage.app'
				});
				console.log('⚠️ [FIREBASE] Using minimal configuration (no service account)');
			}
		}
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
				console.log(
					'✅ [FIREBASE] Firebase Admin initialized for production with service account.'
				);
			} catch (parseError) {
				console.error('❌ [FIREBASE] Error parsing service account JSON:', parseError);
				console.error(
					'❌ [FIREBASE] Service account preview:',
					serviceAccountJson.substring(0, 100)
				);
				// Fallback: try to initialize with default credentials or hardcoded config
				console.log('🔄 [FIREBASE] Attempting fallback initialization...');
				admin.initializeApp({
					projectId: 'tributestreamlive',
					storageBucket: storageBucket || 'tributestreamlive.firebasestorage.app'
				});
				console.log('⚠️ [FIREBASE] Firebase Admin initialized with fallback configuration.');
			}
		} else {
			console.log('⚠️ [FIREBASE] No service account key found, using default configuration...');
			// Fallback initialization for production
			admin.initializeApp({
				projectId: 'tributestreamlive',
				storageBucket: storageBucket || 'tributestreamlive.firebasestorage.app'
			});
			console.log('⚠️ [FIREBASE] Firebase Admin initialized with default configuration.');
		}
	}
}

console.log('--- SERVER FIREBASE INITIALIZATION END ---');

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

// Export FieldValue for array operations
export { FieldValue } from 'firebase-admin/firestore';
