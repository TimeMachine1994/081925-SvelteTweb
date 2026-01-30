import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { browser } from '$app/environment';

const firebaseConfig = {
	apiKey: 'AIzaSyDsM-1xD-edRinPLB8CuxMJ1uEe_uv9NT8',
	authDomain: 'kinglaw-b6ae5.firebaseapp.com',
	projectId: 'kinglaw-b6ae5',
	storageBucket: 'kinglaw-b6ae5.firebasestorage.app',
	messagingSenderId: '40614283025',
	appId: '1:40614283025:web:bfe0d27dcb24211fb46eb0',
	measurementId: 'G-GE9YRZ12ZP'
};

// Initialize Firebase (prevent re-initialization)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics only works in browser
export const analytics = browser ? isSupported().then((yes) => (yes ? getAnalytics(app) : null)) : null;

export { app };
