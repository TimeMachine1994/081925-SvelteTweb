import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';
import { dev, browser } from '$app/environment';

const firebaseConfig = {
	apiKey: 'AIzaSyAXmTxzYRc-LhMEW75nZjjjQCZov1gpiw0',
	authDomain: 'fir-tweb.firebaseapp.com',
	projectId: 'fir-tweb',
	storageBucket: 'fir-tweb.firebasestorage.app',
	messagingSenderId: '509455146790',
	appId: '1:509455146790:web:7ec99527214b05d7b9ebe7'
};

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
			connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
			connectFirestoreEmulator(db, '127.0.0.1', 8080);
			connectStorageEmulator(storage, '127.0.0.1', 9199);
		} catch (error) {
			console.error('Error connecting to Firebase emulators:', error);
		}
	}
}

export { app, auth, db, storage };