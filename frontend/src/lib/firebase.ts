import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';
import { dev, browser } from '$app/environment';

// Firebase configuration - using direct values since env vars aren't available in production
const firebaseConfig = {
	apiKey: 'AIzaSyAXmTxzYRc-LhMEW75nZjjjQCZov1gpiw0',
	authDomain: 'fir-tweb.firebaseapp.com',
	projectId: 'fir-tweb',
	storageBucket: 'fir-tweb.firebasestorage.app',
	messagingSenderId: '509455146790',
	appId: '1:509455146790:web:7ec99527214b05d7b9ebe7'
};

console.log('🔥 Firebase Config:', {
	projectId: firebaseConfig.projectId,
	authDomain: firebaseConfig.authDomain,
	isDev: dev,
	isBrowser: browser
});

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (browser) {
	app = getApps().length ? getApp() : initializeApp(firebaseConfig);
	auth = getAuth(app);
	db = getFirestore(app);
	storage = getStorage(app);

	if (dev) {
		try {
			console.log('🔥 Connecting to Firebase emulators...');
			
			// Check if already connected to avoid duplicate connection errors
			if (!auth.config.emulator) {
				connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
				console.log('✅ Connected to Auth emulator on port 9099');
			}
			
			if (!db._delegate._databaseId.host.includes('127.0.0.1')) {
				connectFirestoreEmulator(db, '127.0.0.1', 8080);
				console.log('✅ Connected to Firestore emulator on port 8080');
			}
			
			if (!storage._delegate._host.includes('127.0.0.1')) {
				connectStorageEmulator(storage, '127.0.0.1', 9199);
				console.log('✅ Connected to Storage emulator on port 9199');
			}
			
			console.log('🎉 All Firebase emulators connected successfully');
		} catch (error) {
			console.error('❌ Error connecting to Firebase emulators:', error);
			console.error('❌ Make sure Firebase emulators are running: firebase emulators:start');
		}
	}
}

export { auth, db, storage };