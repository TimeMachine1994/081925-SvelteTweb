import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';
import { dev, browser } from '$app/environment';
import { env } from '$env/dynamic/public';

console.log('🔥 [firebase.ts] Module loading...');
console.log('  - Running in browser?:', browser);
console.log('  - Running in dev mode?:', dev);

const firebaseConfig = {
	apiKey: env.PUBLIC_FIREBASE_API_KEY,
	authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: env.PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: env.PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: env.PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (browser) {
	console.log('🔥 [firebase.ts] Initializing Firebase in browser...');
	app = getApps().length ? getApp() : initializeApp(firebaseConfig);
	auth = getAuth(app);
	db = getFirestore(app);
	storage = getStorage(app);

	if (dev) {
		try {
			console.log('🔥 [firebase.ts] Connecting to Firebase emulators...');
			connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
			connectFirestoreEmulator(db, '127.0.0.1', 8080);
			connectStorageEmulator(storage, '127.0.0.1', 9199);
			console.log('🔥 [firebase.ts] Connected to Firebase emulators successfully');
		} catch (error) {
			console.error('Error connecting to Firebase emulators:', error);
		}
	}
} else {
	console.log('⚠️ [firebase.ts] Not in browser - Firebase client SDK not initialized');
	console.log('  - This is expected during SSR');
	console.log('  - auth, db, storage will be undefined');
}

export { app, auth, db, storage };