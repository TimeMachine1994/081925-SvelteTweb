# Auto-Login and Redirect Plan

## 1. Objective

The goal is to automatically log in a new user after they register through the "loved one" registration form and redirect them to the custom URL created for their loved one's memorial.

## 2. Current State

- The registration form at `frontend/src/routes/register/loved-one/+page.server.ts` successfully creates a new user in Firebase Authentication, a user profile in Firestore, and a new memorial document.
- After registration, the user is shown a success message but is not logged in or redirected.
- The application uses session cookies for authentication, managed through `frontend/src/routes/login/+page.server.ts` and verified in `frontend/src/hooks.server.ts`.

## 3. Proposed Solution

The primary challenge is that creating a user on the server does not automatically create a client-side session. We need a secure way to bridge this gap. The proposed solution involves using a custom Firebase authentication token.

### Workflow

The following sequence diagram illustrates the proposed authentication flow:

```mermaid
sequenceDiagram
    participant Client
    participant Register Loved One Page (+page.server.ts)
    participant New Session Page (+page.svelte)
    participant New Session Endpoint (+page.server.ts)

    Client->>Register Loved One Page (+page.server.ts): Submits registration form
    Register Loved One Page (+page.server.ts)->>Register Loved One Page (+page.server.ts): Create Firebase User & Memorial
    Register Loved One Page (+page.server.ts)->>Register Loved One Page (+page.server.ts): Generate Custom Auth Token
    Register Loved One Page (+page.server.ts)->>Client: Redirect to /auth/session?token=[...&slug=[...]
    Client->>New Session Page (+page.svelte): Loads with token and slug
    New Session Page (+page.svelte)->>New Session Page (+page.svelte): Sign in with Custom Token (client-side)
    New Session Page (+page.svelte)->>New Session Page (+page.svelte): Get idToken from Firebase
    New Session Page (+page.svelte)->>New Session Endpoint (+page.server.ts): POST idToken and slug
    New Session Endpoint (+page.server.ts)->>New Session Endpoint (+page.server.ts): Create Session Cookie
    New Session Endpoint (+page.server.ts)->>Client: Set session cookie & Redirect to /tributes/[slug]
```

## 4. Implementation Steps

### Step 1: Modify Registration Logic

**File:** `frontend/src/routes/register/loved-one/+page.server.ts`

- After successfully creating the user (`userRecord`), generate a custom authentication token using `adminAuth.createCustomToken(userRecord.uid)`.
- Instead of returning `{ success: true }`, redirect the user to a new route, e.g., `/auth/session`, passing the custom token and the newly created memorial `slug` as query parameters.

### Step 2: Create a Session Handler Page

**File:** `frontend/src/routes/auth/session/+page.svelte`

- This page will be responsible for handling the client-side part of the authentication.
- It will read the `token` and `slug` from the URL query parameters.
- On mount (`onMount`), it will use the Firebase client-side SDK's `signInWithCustomToken` method to sign the user in.
- After a successful sign-in, it will get the user's `idToken` using `user.getIdToken()`.
- It will then `POST` this `idToken` and the `slug` to a new server endpoint. A simple form that submits on mount can handle this.

### Step 3: Create a Session Creation Endpoint

**File:** `frontend/src/routes/auth/session/+page.server.ts`

- This file will export a `load` function that receives the POST request from the `+page.svelte` file.
- It will extract the `idToken` and `slug` from the request body.
- It will use `adminAuth.createSessionCookie(idToken, { expiresIn })` to create a session cookie, mirroring the logic in the existing `/login` endpoint.
- It will set the session cookie on the response.
- Finally, it will redirect the user to their new memorial page using the `slug`, e.g., `/tributes/${slug}`.

### Step 4: Final Redirect

The user will be seamlessly redirected from the session creation endpoint to their new memorial page, now fully authenticated.

## 5. Next Steps

Once this plan is approved, I will request to switch to the appropriate mode to begin implementation.