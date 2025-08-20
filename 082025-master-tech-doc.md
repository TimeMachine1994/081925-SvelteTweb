# Master Technical Documentation

## 1. Project Overview

### Purpose

This document outlines the technical architecture and implementation details of a secure, full-stack web application. The application provides users with a robust authentication system, a secure portal for accessing protected content, and the ability to manage their personal profiles. The primary goal is to offer a seamless and secure user experience, from initial registration to ongoing profile management, while ensuring data persistence and integrity through a reliable backend service.

### Key Features

*   **User Registration and Authentication:** New users can create an account using their email and password. The system securely handles user authentication to grant access to protected areas of the application.
*   **Secure User Portal:** Once authenticated, users gain access to a secure portal (`/my-portal`) that serves as a personalized dashboard or landing page.
*   **Profile Management:** Users can view and update their profile information, which is securely stored and managed in a backend database.
*   **Database Interaction:** The application leverages a persistent database to store and retrieve user data, ensuring that information is saved across sessions.

## 2. Technology Stack

The application is built using a modern, type-safe technology stack designed for performance, scalability, and developer efficiency.

*   **Framework:** [SvelteKit](https://kit.svelte.dev/) - A full-stack web framework that uses Svelte to build highly performant web applications with features like server-side rendering, routing, and build optimizations.
*   **Build Tool:** [Vite](https://vitejs.dev/) - A next-generation frontend build tool that provides an extremely fast development experience and bundles code for production.
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapidly building custom user interfaces without leaving your HTML.
*   **Backend Services:** [Firebase](https://firebase.google.com/) - A comprehensive platform from Google that provides backend services, including:
    *   **Firebase Authentication:** For handling user sign-up, sign-in, and session management.
    *   **Firestore:** A NoSQL cloud database for storing and syncing user data in real-time.
*   **Language:** [TypeScript](https://www.typescriptlang.org/) - A statically typed superset of JavaScript that adds type safety to the codebase, reducing bugs and improving maintainability.

## 3. Project Structure

The project is organized within the `frontend/` directory, following SvelteKit conventions to separate concerns and maintain a clean, scalable architecture.

*   **`frontend/`**: The root directory for the SvelteKit application.
    *   **`src/`**: Contains the main application source code.
        *   **`lib/`**: A directory for reusable modules, components, and utilities accessible throughout the application via the `$lib` alias.
            *   **`components/`**: Houses reusable Svelte components like `Login.svelte`, `Register.svelte`, and `Profile.svelte`.
            *   **`server/`**: Contains server-side only modules that are never exposed to the client. This is where the Firebase Admin SDK is initialized in `firebase.ts`.
            *   **`auth.ts`**: Manages client-side user authentication state, typically using a Svelte store to reactively update the UI based on the user's login status.
            *   **`firebase.ts`**: Initializes the client-side Firebase SDK, making it available for use in Svelte components.
        *   **`routes/`**: Implements the application's routing using SvelteKit's filesystem-based router. Each directory corresponds to a URL path.
            *   **`+layout.svelte`**: The root layout component that wraps all pages. It's used to manage global styles, persistent UI elements (like navigation), and propagate user state to child components.
            *   **`+layout.server.ts`**: A server-side load function for the root layout. It retrieves the authenticated user's data from `event.locals` and makes it available to all pages.
            *   **`login/`**: The route for the user login page.
            *   **`register/`**: The route for the user registration page.
            *   **`logout/`**: A server endpoint (`+server.ts`) that handles user logout by clearing the session cookie.
            *   **`my-portal/`**: A protected route accessible only to authenticated users.
            *   **`profile/`**: The user profile page where users can view and edit their information.
        *   **`hooks.server.ts`**: Contains server-side hooks, primarily the `handle` function, which intercepts every request to manage session cookies and populate `event.locals.user`.
    *   **`static/`**: For static assets like `robots.txt` or `favicon.ico` that are served as-is.
    *   **`svelte.config.js`**: The configuration file for SvelteKit, including adapters and preprocessors.
    *   **`vite.config.ts`**: The configuration file for the Vite build tool.
    *   **`package.json`**: Defines project metadata, dependencies, and scripts.
## 4. Authentication Flow

The authentication flow is designed to be secure and robust, leveraging both client-side and server-side Firebase SDKs for different parts of the process.

### Registration (`/register`)

1.  A new user fills out the registration form in the `Register.svelte` component with their email and password.
2.  Upon submission, a SvelteKit form action in `src/routes/register/+page.server.ts` is invoked.
3.  This server-side action uses the Firebase Admin SDK to securely create a new user in Firebase Authentication.
4.  Simultaneously, a corresponding user document is created in the `users` collection in Firestore to store additional profile information.

```typescript
// src/routes/register/+page.server.ts
import { adminAuth, adminDb } from '$lib/server/firebase';
import { fail } from '@sveltejs/kit';

export const actions = {
	register: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		// ... validation ...

		try {
			const userRecord = await adminAuth.createUser({
				email: email.toString(),
				password: password.toString()
			});

			const userDocRef = adminDb.collection('users').doc(userRecord.uid);
			await userDocRef.set({
				email: userRecord.email,
				createdAt: new Date().toISOString()
			});
		} catch (error: any) {
			return fail(400, { message: error.message });
		}

		return { status: 201, message: 'Account created successfully' };
	}
};
```

### Login (`/login`)

1.  The user enters their credentials into the `Login.svelte` component.
2.  The component uses the *client-side* Firebase SDK to sign the user in. This is done on the client to avoid sending the user's plain-text password to the server.
3.  Upon successful sign-in, the client-side SDK returns a short-lived ID token.
4.  This ID token is sent to a form action in `src/routes/login/+page.server.ts`.
5.  The server uses the Firebase Admin SDK to verify the ID token and create a secure, HTTP-only session cookie.
6.  The user is then redirected to the protected `/my-portal` page.

```typescript
// src/routes/login/+page.server.ts
import { adminAuth } from '$lib/server/firebase';
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const idToken = data.get('idToken');

		if (typeof idToken !== 'string') {
			return fail(400, { message: 'idToken is required' });
		}

		const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

		try {
			const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
			cookies.set('session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true, path: '/' });
		} catch (error: any) {
			return fail(401, { message: 'Could not create session cookie.' });
		}

		redirect(303, '/my-portal');
	}
};
```

### Session Management (`hooks.server.ts`)

1.  For every request made to the SvelteKit server, the `handle` function in `src/hooks.server.ts` is executed.
2.  It checks for the presence of the `session` cookie.
3.  If the cookie exists, the Firebase Admin SDK is used to verify its validity.
4.  If verification is successful, the decoded user information (like UID and email) is attached to the `event.locals.user` object. This makes the user's session data available to all subsequent server-side code for that request (e.g., `load` functions, API routes).
5.  This user object is then passed down to the client through the root layout's server load function, making it accessible to all pages.

```typescript
// src/hooks.server.ts
import { adminAuth } from '$lib/server/firebase';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionCookie = event.cookies.get('session');

	if (sessionCookie) {
		try {
			const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
			event.locals.user = {
				uid: decodedClaims.uid,
				email: decodedClaims.email
			};
		} catch (error) {
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};
```

### Logout (`/logout`)

1.  The user initiates a logout, which sends a `POST` request to the `/logout` server endpoint.
2.  The server-side code in `src/routes/logout/+server.ts` deletes the session cookie.
3.  The user is then redirected back to the `/login` page.
## 5. Database Interaction

Firebase is used for both client-side and server-side database operations, with separate initialization files to maintain security.

### Client-Side (`src/lib/firebase.ts`)

This file initializes the client-side Firebase SDK, which is necessary for browser-based interactions like user sign-in. It connects to the Firebase emulators in development to provide a local testing environment. It exports the `auth`, `db` (Firestore), and `storage` instances for use in Svelte components.

```typescript
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { dev, browser } from '$app/environment';

// ... firebaseConfig ...

let app;
if (browser) {
	if (!getApps().length) {
		app = initializeApp(firebaseConfig);
	} else {
		app = getApp();
	}

	const auth = getAuth();
	const db = getFirestore();

	if (dev) {
		connectAuthEmulator(auth, 'http://127.0.0.1:9099');
		connectFirestoreEmulator(db, '127.0.0.1', 8080);
	}
}
// ... export auth, db ...
```

### Server-Side (`src/lib/server/firebase.ts`)

This file initializes the Firebase Admin SDK, which is required for privileged operations like creating users, minting session cookies, and accessing Firestore with admin rights. It uses service account credentials in production and connects to emulators in development. This module is strictly server-side and is never exposed to the client.

```typescript
// src/lib/server/firebase.ts
import admin from 'firebase-admin';
import { dev } from '$app/environment';
import { GOOGLE_APPLICATION_CREDENTIALS } from '$env/static/private';

if (!admin.apps.length) {
	if (dev) {
		// Connect to emulators
		process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';
		process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';
		admin.initializeApp({ projectId: 'fir-tweb' });
	} else {
		// Use service account in production
		const serviceAccount = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS);
		admin.initializeApp({
			credential: admin.credential.cert(serviceAccount)
		});
	}
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
```

### Data Models

*   **`users` collection:** This Firestore collection stores user profile information. Each document is keyed by the user's unique Firebase UID. This allows for easy lookup of user data and can be expanded to store additional information like display names, profile pictures, and other application-specific data.
## 6. Routing

SvelteKit's filesystem-based routing defines the application's pages and endpoints.

*   **`/` (Home):** The main landing page. It conditionally displays links to log in or register. If the user is already authenticated, it provides a link to their profile.
*   **`/login`:** The page containing the `Login.svelte` component for user sign-in.
*   **`/register`:** The page containing the `Register.svelte` component for new user sign-up.
*   **`/logout`:** A server-side endpoint that handles the logout process by clearing the session cookie.
*   **`/my-portal`:** A protected route that is only accessible to authenticated users. Its `+page.server.ts` file checks for a valid user session and redirects to `/login` if none is found.
*   **`/profile`:** A page where authenticated users can view and edit their profile information.

## 7. Key Components

These Svelte components form the core of the user-facing authentication and profile management system.

*   **`Login.svelte`:** Provides the user interface for logging in. It captures the user's email and password, uses the client-side Firebase SDK to authenticate, and then submits the resulting ID token to a server action to establish a session.
*   **`Register.svelte`:** Provides the user interface for creating a new account. It captures the required information (email, password) and submits it directly to a server action, which handles the user creation process securely on the backend.
*   **`Profile.svelte`:** Displays the authenticated user's profile data. It also includes a form that allows the user to update their information, which is then persisted to the Firestore database.