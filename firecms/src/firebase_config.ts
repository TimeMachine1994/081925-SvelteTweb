// Firebase configuration using environment variables with fallbacks
export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "REDACTED_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tributestreamlive.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tributestreamlive",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tributestreamlive.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1052723763398",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1052723763398:web:299d27908ec08d9b4e5fc7"
};

console.log('🔥 FireCMS Firebase Config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    usingEnvVars: !!import.meta.env.VITE_FIREBASE_PROJECT_ID
});
