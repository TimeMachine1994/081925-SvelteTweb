import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';
import { dev, browser } from '$app/environment';
import { env } from '$env/dynamic/public';

// Check if we should use production Firebase instead of emulators
const useProduction = env.PUBLIC_USE_PRODUCTION === 'true' || env.PUBLIC_NODE_ENV === 'production';

// Firebase configuration with environment variables and fallbacks
const firebaseConfig = {
	apiKey: (dev && !useProduction) ? 'dummy' : env.PUBLIC_FIREBASE_API_KEY || 'REDACTED_API_KEY',
	authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN || 'tributestreamlive.firebaseapp.com',
	projectId: env.PUBLIC_FIREBASE_PROJECT_ID || 'tributestreamlive',
	storageBucket: env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'tributestreamlive.firebasestorage.app',
	messagingSenderId: env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1052723763398',
	appId: env.PUBLIC_FIREBASE_APP_ID || '1:1052723763398:web:299d27908ec08d9b4e5fc7'
};

console.log('🔥 Firebase Config:', {
	projectId: firebaseConfig.projectId,
	authDomain: firebaseConfig.authDomain,
	apiKey: firebaseConfig.apiKey,
	isDev: dev,
	isBrowser: browser,
	useProduction: useProduction,
	mode: useProduction ? 'PRODUCTION' : 'EMULATORS'
});

// Initialize Firebase  
let app!: FirebaseApp;
let auth!: Auth;
let db!: Firestore;
let storage!: FirebaseStorage;

if (browser) {
	app = getApps().length ? getApp() : initializeApp(firebaseConfig);
	auth = getAuth(app);
	db = getFirestore(app);
	storage = getStorage(app);

	if (dev && !useProduction) {
		try {
			console.log('🔥 Connecting to Firebase emulators...');

			// Connect to Auth emulator
			try {
				console.log('🔄 Connecting to Auth emulator...');
				// Use 127.0.0.1 to match emulator host
				connectAuthEmulator(auth, 'http://127.0.0.1:9098', { disableWarnings: true });
				console.log('✅ Connected to Auth emulator on port 9098');
			} catch (authError) {
				const errorMessage = (authError as Error).message;
				if (errorMessage?.includes('already') || errorMessage?.includes('emulator')) {
					console.log('ℹ️ Auth emulator already connected or connection attempted');
				} else {
					console.warn('⚠️ Auth emulator connection failed:', authError);
				}
			}

			// Connect to Firestore emulator
			try {
				connectFirestoreEmulator(db, '127.0.0.1', 8081);
				console.log('✅ Connected to Firestore emulator on port 8081');
			} catch (firestoreError) {
				const errorMessage = (firestoreError as Error).message;
				if (errorMessage?.includes('already') || errorMessage?.includes('emulator')) {
					console.log('ℹ️ Firestore emulator already connected or connection attempted');
				} else {
					console.warn('⚠️ Firestore emulator connection failed:', firestoreError);
				}
			}

			// Connect to Storage emulator
			try {
				connectStorageEmulator(storage, '127.0.0.1', 9198);
				console.log('✅ Connected to Storage emulator on port 9198');
			} catch (storageError) {
				const errorMessage = (storageError as Error).message;
				if (errorMessage?.includes('already') || errorMessage?.includes('emulator')) {
					console.log('ℹ️ Storage emulator already connected or connection attempted');
				} else {
					console.warn('⚠️ Storage emulator connection failed:', storageError);
				}
			}

			console.log('🎉 Firebase emulator connections completed');
		} catch (error) {
			console.error('❌ Error connecting to Firebase emulators:', error);
			console.error('❌ Make sure Firebase emulators are running: firebase emulators:start');
		}
	} else if (useProduction) {
		console.log('🚀 Using production Firebase - skipping emulator connections');
	}
}

export { auth, db, storage, app };

// Export as clientAuth for clarity in client-side storage utilities  
// Note: These are only available in browser context
export const clientAuth = browser ? { auth, db, storage, app } : null as any;
