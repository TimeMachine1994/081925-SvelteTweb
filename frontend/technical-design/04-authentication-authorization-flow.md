# Authentication and Authorization Flow

## 1. Purpose

This document maps out the complete user authentication and authorization journey for the Tributestream platform, detailing both client-side and server-side interactions with Firebase Auth within a SvelteKit application. It provides a comprehensive guide to user registration, login, session management, and access control, ensuring a secure and seamless user experience.

## 2. Content

### 2.1. User Authentication Flows

#### 2.1.1. User Registration

1.  **Client-Side:** The user fills out the registration form (email, password).
2.  **Client-Side:** On submission, the client calls `createUserWithEmailAndPassword` from the Firebase Auth SDK.
3.  **Firebase:** Firebase Auth creates a new user and returns a user object with a JWT (ID Token).
4.  **Client-Side:** The client sends the ID token to a SvelteKit server endpoint.
5.  **Server-Side:** The SvelteKit endpoint verifies the ID token, creates a session cookie using the Firebase Admin SDK, and sets it as an `HttpOnly` cookie in the browser.
6.  **Client-Side:** The user is redirected to the "My Portal" dashboard.

#### 2.1.2. User Login (Email/Password)

1.  **Client-Side:** The user enters their email and password.
2.  **Client-Side:** On submission, the client calls `signInWithEmailAndPassword`.
3.  **Firebase:** Firebase Auth verifies the credentials and returns a user object with an ID Token.
4.  **Client-Side:** The client sends the ID token to a SvelteKit server endpoint.
5.  **Server-Side:** The endpoint verifies the token, creates a session cookie, and sets it in the browser.
6.  **Client-Side:** The user is redirected to the "My Portal" dashboard.

#### 2.1.3. User Login (Google SSO)

1.  **Client-Side:** The user clicks the "Sign in with Google" button.
2.  **Client-Side:** The client calls `signInWithPopup` or `signInWithRedirect` with the `GoogleAuthProvider`.
3.  **Firebase:** Firebase handles the OAuth flow with Google and returns a user object with an ID Token.
4.  **Client-Side:** The client sends the ID token to a SvelteKit server endpoint.
5.  **Server-Side:** The endpoint verifies the token, creates a session cookie, and sets it in the browser.
6.  **Client-Side:** The user is redirected to the "My Portal" dashboard.

#### 2.1.4. Password Reset

1.  **Client-Side:** The user requests a password reset and provides their email.
2.  **Client-Side:** The client calls `sendPasswordResetEmail`.
3.  **Firebase:** Firebase sends a password reset email to the user.
4.  **User:** The user clicks the link in the email and is directed to a page to set a new password.

### 2.2. Auth State Management

*   **`onAuthStateChanged`:** This will be used on the client-side to listen for changes in the user's authentication state.
*   **Svelte Stores:** A writable Svelte store will be used to hold the user's authentication state (e.g., `user`, `loading`, `error`). This store will be updated by the `onAuthStateChanged` listener.
*   **Server-Side Cookies/Hooks:** A server-side hook (`hooks.server.ts`) will be used to verify the session cookie on every server request. The hook will decode the JWT, retrieve the user's information, and attach it to the `event.locals` object, making it available to all server-side `load` functions and API endpoints.

### 2.3. Authorization Checks

#### 2.3.1. Client-Side (Component Rendering)

*   Components will subscribe to the auth store to get the current user's state.
*   Conditional rendering (`{#if $user}...{/if}`) will be used to show or hide UI elements based on the user's authentication status and role (e.g., showing an "Admin" button if the user has an `admin` custom claim).

#### 2.3.2. Server-Side (SvelteKit Endpoints and Load Functions)

*   **`+server.ts` Endpoints:** API endpoints will check for the user object on `event.locals.user`. If the user is not authenticated or does not have the required permissions, the endpoint will return a `401 Unauthorized` or `403 Forbidden` response.
*   **`load` Functions:** Page `load` functions will check `event.locals.user` to determine if a user can access a page. If access is denied, the `load` function will redirect the user to the login page or an "access denied" page.

### 2.4. Firebase Security Rules for Auth

```json
{
  "rules": {
    "users": {
      "$uid": {
        // Users can only read and write their own data
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "tributes": {
      "$tributeId": {
        // Logged-in users can create tributes
        ".write": "auth != null",
        // Anyone can read public tributes
        ".read": "data.child('isPublic').val() == true",
        // Only the owner or an admin can edit a tribute
        ".write": "auth != null && (data.child('ownerId').val() == auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() == true)"
      }
    }
  }
}
```

## 3. Key Question

**How will user sessions and authentication state be securely handled across SvelteKit's client and server environments?**

User sessions will be managed using a combination of Firebase ID tokens and secure, `HttpOnly` session cookies.

1.  **Token Exchange:** After a successful login or registration on the client, the Firebase ID token is sent to a dedicated server endpoint in SvelteKit.
2.  **Session Cookie Creation:** The server endpoint verifies the ID token using the Firebase Admin SDK. If valid, it generates a session cookie.
3.  **Secure Cookie Storage:** This session cookie is set as an `HttpOnly` cookie, which prevents it from being accessed by client-side JavaScript, thus mitigating XSS attacks.
4.  **Server-Side Validation:** A server hook (`hooks.server.ts`) runs on every request. It checks for the session cookie, verifies it, and decodes the user's information, attaching it to `event.locals`.
5.  **Unified Auth State:** This approach ensures that both server-side (`load` functions, API endpoints) and client-side (via data loaded from the server) have a consistent and secure understanding of the user's authentication state.
