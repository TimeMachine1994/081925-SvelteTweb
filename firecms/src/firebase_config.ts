// Firebase configuration using environment variables with fallbacks
export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAXmTxzYRc-LhMEW75nZjjjQCZov1gpiw0",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fir-tweb.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fir-tweb",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fir-tweb.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "509455146790",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:509455146790:web:7ec99527214b05d7b9ebe7"
};

console.log('🔥 FireCMS Firebase Config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    usingEnvVars: !!import.meta.env.VITE_FIREBASE_PROJECT_ID
});
