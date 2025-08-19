# Refactoring Plan: Connecting SvelteKit to Firebase Emulators

## 1. Introduction

This document outlines the necessary changes to connect the SvelteKit frontend to the Firebase emulators, specifically updating the authentication emulator port to `5002`.

## 2. File Modifications

### 2.1. `firebase.json`

Update the `auth` port to `5002`.

```json
{
  "emulators": {
    "auth": {
      "port": 5002
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true
    },
    "singleProjectMode": true
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

### 2.2. `frontend/.env`

Update the `FIREBASE_AUTH_EMULATOR_HOST` to `127.0.0.1:5002`.

```env
FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:5002"
FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
GOOGLE_APPLICATION_CREDENTIALS=""
```

### 2.3. `frontend/src/lib/firebase.ts`

Update the `connectAuthEmulator` call to use port `5002`.

```typescript
// ...
if (dev) {
    connectAuthEmulator(auth, 'http://127.0.0.1:5002');
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
}
// ...
```

### 2.4. `frontend/src/lib/server/firebase.ts`

Update the `FIREBASE_AUTH_EMULATOR_HOST` environment variable to `127.0.0.1:5002`.

```typescript
// ...
if (dev) {
    // ...
    process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:5002';
    process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';
    admin.initializeApp({
        projectId: 'fir-tweb'
    });
    // ...
}
// ...
```

## 3. Conclusion

These changes will ensure that the SvelteKit application connects to the Firebase Authentication emulator running on `localhost:5002`.