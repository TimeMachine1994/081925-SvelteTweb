# DevRoleSwitcher Component Analysis

This document analyzes the `DevRoleSwitcher.svelte` component and compares its authentication mechanism with the primary login/registration flow of the application.

## Initial Component Review

The `DevRoleSwitcher` is a development-only tool designed to facilitate rapid testing by allowing developers to switch between different user roles (admin, funeral_director, owner) without manual sign-ins.

### Key Features:

- **Visibility**: Only rendered in development environments (`import.meta.env.DEV`).
- **UI**: Provides a simple interface to select a pre-defined test account.
- **Functionality**: When a role is selected, the component attempts to:
    1. Log out the current user by making a `POST` request to `/logout`.
    2. Sign in to Firebase using the selected test account's email and password.
    3. Retrieve the Firebase ID token.
    4. Send this token to a server endpoint (`/login?/login`) to create a session.
    5. Force a full page reload (`window.location.reload()`) to update the application state.

### Current Authentication Flow:

The component uses a multi-step, client-side process to authenticate:

```javascript
// 1. Sign in with Firebase client SDK
const userCredential = await signInWithEmailAndPassword(auth, account.email, account.password);
const idToken = await getIdToken(userCredential.user);

// 2. Create session via custom fetch call
const formData = new FormData();
formData.append('idToken', idToken);
const loginResponse = await fetch('/login?/login', {
    method: 'POST',
    body: formData
});

// 3. Force reload
if (loginResponse.ok) {
    window.location.reload();
}
```

This implementation is functional but may differ from the application's primary, user-facing authentication flow. The next step is to analyze the main login page to identify the standard authentication pattern and ensure the `DevRoleSwitcher` aligns with it.

## Authentication Flow Comparison

After analyzing the main login component (`Login.svelte`) and its corresponding server endpoint (`/api/session/+server.ts`), several key discrepancies with the `DevRoleSwitcher`'s implementation have been identified.

### The Main Login Flow (Correct Implementation)

1.  **Client-Side (`Login.svelte`):**
    *   Signs in the user via Firebase (`signInWithEmailAndPassword`).
    *   Retrieves the `idToken`.
    *   Calls a `createSession` function which makes a `POST` request to `/api/session`.
    *   The request body is a **JSON object**: `{ idToken: '...' }`.
    *   Upon success, it receives a JSON response with a `redirectTo` path.
    *   It then uses SvelteKit's `goto()` to navigate to the specified path.

2.  **Server-Side (`/api/session/+server.ts`):**
    *   Expects a `POST` request with a JSON body containing the `idToken`.
    *   Creates a session cookie.
    *   Verifies the user's role from the token's claims.
    *   Returns a **JSON response** with a role-appropriate `redirectTo` path (e.g., `/admin`, `/my-portal`).

### `DevRoleSwitcher` Discrepancies

1.  **Incorrect Endpoint:** It sends the request to a SvelteKit form action (`/login?/login`) instead of the dedicated API endpoint (`/api/session`).
2.  **Incorrect Payload Format:** It sends the `idToken` as `FormData`, whereas the correct endpoint expects a JSON payload.
3.  **Inefficient Redirection:** It uses `window.location.reload()`, which is a blunt approach. It doesn't leverage the intelligent, role-based redirection logic provided by the `/api/session` endpoint.

## Recommendation

The `DevRoleSwitcher` should be updated to mirror the main application's authentication flow precisely. This involves:

1.  Changing the `fetch` request to target `/api/session`.
2.  Sending the `idToken` in a JSON object.
3.  Processing the JSON response and using `window.location.href` to navigate to the `redirectTo` path. This forces a full page reload, which is necessary to prevent a race condition where the browser navigates before the new session cookie is set.
