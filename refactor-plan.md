# SvelteKit Authentication Flow Analysis

This document outlines the current authentication flow of the SvelteKit application and identifies potential issues and areas for improvement based on modern SvelteKit best practices.

## Current Authentication Flow

### 1. User Registration

-   **Component**: [`frontend/src/lib/components/Register.svelte`](frontend/src/lib/components/Register.svelte)
-   **Page**: [`frontend/src/routes/register/+page.svelte`](frontend/src/routes/register/+page.svelte)
-   **Server Logic**: [`frontend/src/routes/register/+page.server.ts`](frontend/src/routes/register/+page.server.ts)

The registration process is handled by a SvelteKit Form Action.

1.  The user fills out the registration form in the `Register.svelte` component.
2.  Upon submission, a `POST` request is made to the `?/register` action defined in `+page.server.ts`.
3.  The server-side action uses the Firebase Admin SDK to create a new user in Firebase Authentication and a corresponding user document in Firestore.
4.  The result of the action (success or failure message) is passed back to the `+page.svelte` and displayed to the user.

### 2. User Login

-   **Component**: [`frontend/src/lib/components/Login.svelte`](frontend/src/lib/components/Login.svelte)
-   **Page**: [`frontend/src/routes/login/+page.svelte`](frontend/src/routes/login/+page.svelte)
-   **API Endpoint**: [`frontend/src/routes/api/session/+server.ts`](frontend/src/routes/api/session/+server.ts)

The login process is handled client-side.

1.  The user submits their credentials through the `Login.svelte` component.
2.  The component uses the Firebase client-side SDK to sign the user in (`signInWithEmailAndPassword`).
3.  Upon successful Firebase authentication, the client retrieves an `idToken` from the user credential.
4.  A `POST` request is made to the `/api/session` endpoint, sending the `idToken` in the request body.
5.  The server verifies the `idToken` and creates a session cookie using the Firebase Admin SDK.
6.  The session cookie is set with `httpOnly`, `secure`, and a 5-day expiration.
7.  Upon a successful response from the API, the client redirects the user to the `/profile` page.

### 3. Session Management

-   **Server Hook**: [`frontend/src/hooks.server.ts`](frontend/src/hooks.server.ts)

1.  On every server-side request, the `handle` function in `hooks.server.ts` is executed.
2.  It checks for the presence of the `session` cookie.
3.  If the cookie exists, it's verified using the Firebase Admin SDK.
4.  If verification is successful, the decoded user claims (UID and email) are attached to `event.locals.user`.
5.  If the cookie is invalid or missing, `event.locals.user` is set to `null`.
6.  This makes the user's authentication state available in all server-side `load` functions and actions.

### 4. Logout

-   **API Endpoint**: [`frontend/src/routes/api/session/+server.ts`](frontend/src/routes/api/session/+server.ts)

1.  A `DELETE` request to `/api/session` clears the session cookie.
2.  This effectively logs the user out on the server side.

## Identified Issues and Deviations from Best Practices

1.  **Inconsistent Authentication Handling**:
    *   **Registration**: Uses SvelteKit Form Actions, which is the recommended approach.
    *   **Login**: Uses a client-side `fetch` to a custom API endpoint. This is an older pattern. The login flow should be converted to a Form Action for consistency, better progressive enhancement, and to simplify the client-side code.

2.  **Manual Client-Side Redirect**:
    *   In `Login.svelte`, the redirect to `/profile` is handled manually with `goto('/profile')`. When using Form Actions, redirects should be handled on the server for a more robust and secure flow.

3.  **Lack of Progressive Enhancement in Login**:
    *   The login form is entirely dependent on client-side JavaScript. If JavaScript fails, the user cannot log in. A Form Action-based approach would allow the form to work even without JavaScript.

4.  **Separation of Concerns**:
    *   The session creation logic is in a separate API route (`/api/session`). While this works, it could be integrated directly into a login Form Action, centralizing the login logic in one place (`/login/+page.server.ts`).

5.  **Client-Side State Management**:
    *   A writable store (`frontend/src/lib/auth.ts`) is used for the user state. While this is functional, SvelteKit's `$page.data.user` provides a more idiomatic and reliable way to access user data that is loaded from the server, reducing the need for a separate client-side store.

## Proposed Refactoring Plan

1.  **Refactor Login to Use Form Actions**:
    *   Create a `+page.server.ts` file in the `src/routes/login` directory.
    *   Implement a `login` action that handles the logic currently in the `/api/session` endpoint. This action will take the user's credentials, sign them in using the Firebase Admin SDK (or a similar server-side method), create the session cookie, and handle redirects.
    *   Update the `Login.svelte` component to use a standard `<form>` element that posts to the new action.

2.  **Centralize Session Logic**:
    *   Move the session creation logic from `/api/session/+server.ts` into the new login action. The logout logic can also be converted to a logout action.

3.  **Rely on `$page.data` for User State**:
    *   Remove the custom `user` store in `frontend/src/lib/auth.ts`.
    *   Ensure that the user data from `event.locals.user` is consistently passed to the client via the root `+layout.server.ts` load function.
    *   Update components to access user data from `$page.data.user`.