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

console.log('--- CLIENT FIREBASE INITIALIZATION START ---');

if (!browser) {
	console.log('Not in browser environment. Skipping client-side Firebase setup.');
} else {
	console.log('In browser environment. Proceeding with client-side Firebase setup.');
	if (!getApps().length) {
		console.log('No Firebase apps found. Initializing a new one.');
		app = initializeApp(firebaseConfig);
		console.log('New Firebase app initialized.');
	} else {
		console.log('Existing Firebase app found. Using it.');
		app = getApp();
	}

	console.log('Getting Auth, Firestore, and Storage instances.');
	auth = getAuth();
	db = getFirestore();
	storage = getStorage();

	console.log(`SvelteKit dev mode: ${dev}`);
	if (dev) {
		console.log('Running in development mode. Connecting to emulators...');
		try {
			const authHost = 'http://127.0.0.1:9099';
			console.log(`Attempting to connect Auth to emulator at ${authHost}`);
			connectAuthEmulator(auth, authHost, { disableWarnings: true });
			console.log('✅ Auth emulator connected.');

			const firestoreHost = '127.0.0.1';
			const firestorePort = 8080;
			console.log(`Attempting to connect Firestore to emulator at ${firestoreHost}:${firestorePort}`);
			connectFirestoreEmulator(db, firestoreHost, firestorePort);
			console.log('✅ Firestore emulator connected.');

			const storageHost = '127.0.0.1';
			const storagePort = 9199;
			console.log(`Attempting to connect Storage to emulator at ${storageHost}:${storagePort}`);
			connectStorageEmulator(storage, storageHost, storagePort);
			console.log('✅ Storage emulator connected.');
		} catch (error) {
			console.error('❌ ERROR connecting to Firebase emulators:', error);
		}
	} else {
		console.log('Running in production mode. Using live Firebase services.');
	}
}

console.log('--- CLIENT FIREBASE INITIALIZATION END ---');

export { auth, db, storage };