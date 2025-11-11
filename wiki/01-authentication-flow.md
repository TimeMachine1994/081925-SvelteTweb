# Authentication Flow

## Overview

TributeStream uses Firebase Authentication with custom session cookies for secure, server-side authentication. The system supports multiple user roles: **admin**, **funeral_director**, and **owner** (memorial creators).

## Authentication Architecture

### Client-Side Flow

1. **Login Page** (`/login`)
   - User enters email/password
   - Firebase Auth validates credentials
   - On success, calls `/api/auth/session` to create server session

2. **Session Creation** (`/api/auth/session`)
   - Receives Firebase ID token from client
   - Verifies token with Firebase Admin SDK
   - Creates secure session cookie (httpOnly, secure, sameSite)
   - Sets 14-day expiration

### Server-Side Verification

**Location**: `src/hooks.server.ts`

```typescript
const sessionCookie = event.cookies.get('session');
const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
const userRecord = await adminAuth.getUser(decodedClaims.uid);

event.locals.user = {
  uid: userRecord.uid,
  email: userRecord.email,
  role: userRecord.customClaims?.role || 'owner',
  isAdmin: userRecord.customClaims?.role === 'admin'
};
```

## User Roles

### Admin
- Full system access
- Can manage all memorials
- Access to admin dashboard (`/admin`)
- Can approve funeral directors
- System configuration access

**Custom Claim**: `{ role: 'admin' }`

### Funeral Director
- Can create memorials for clients
- Magic link authentication support
- Access to professional dashboard
- Manage own funeral home profile

**Custom Claim**: `{ role: 'funeral_director' }`

### Owner (Memorial Creator)
- Create and manage own memorials
- Default role for new users
- Access to own memorial settings

**Custom Claim**: `{ role: 'owner' }` or no custom claim

## Protected Routes

### Admin-Only Routes
```typescript
// Pattern used in all admin pages
if (!locals.user) {
  throw redirect(302, '/login');
}

if (locals.user.role !== 'admin') {
  throw redirect(302, '/profile');
}
```

**Protected Routes:**
- `/admin/*` - Admin dashboard and tools
- `/admin/wiki/*` - Internal wiki
- `/admin/mvp-dashboard` - Enhanced admin view

### Memorial Owner Routes
Memorial pages check ownership:
```typescript
const memorial = await getMemorial(fullSlug);
if (memorial.createdBy !== locals.user.uid && locals.user.role !== 'admin') {
  throw error(403, 'Unauthorized');
}
```

## Session Management

### Session Cookie Properties
- **Name**: `session`
- **Duration**: 14 days
- **Security**: httpOnly, secure, sameSite=strict
- **Path**: `/`

### Logout Flow
1. Client calls `/logout` endpoint
2. Server deletes session cookie
3. Client-side Firebase signOut
4. Redirect to home page

## Magic Link Authentication

Used for funeral directors to quickly access the system:

### Generation
```typescript
// Creates a passwordless sign-in link
const actionCodeSettings = {
  url: `${origin}/funeral-director/auth-complete`,
  handleCodeInApp: true
};
await adminAuth.generateSignInWithEmailLink(email, actionCodeSettings);
```

### Verification
- User clicks email link
- Redirected to auth-complete page
- Signs in with email link
- Session created automatically

## Security Features

### Session Verification Timeout
Prevents hanging requests:
```typescript
const verificationPromise = adminAuth.verifySessionCookie(sessionCookie, true);
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Session verification timeout')), 5000)
);
await Promise.race([verificationPromise, timeoutPromise]);
```

### Automatic Session Cleanup
Expired or invalid sessions are automatically deleted:
```typescript
if (error.message.includes('expired') || error.message.includes('invalid signature')) {
  event.cookies.delete('session', { path: '/' });
}
```

## Custom Claims Management

### Setting Admin Role
```javascript
// Using Firebase Admin SDK
await adminAuth.setCustomUserClaims(uid, { role: 'admin' });
```

### Checking Claims
Claims are cached and checked on every request via session verification.

## Best Practices

1. **Always check `locals.user` in server load functions**
2. **Use role-based redirects** (admin → `/admin`, owner → `/profile`)
3. **Verify ownership** for memorial-specific actions
4. **Log authentication events** for audit trail
5. **Handle session timeouts gracefully**

## Troubleshooting

### Common Issues

**"No session cookie found"**
- User not logged in
- Cookie expired
- Cookie not set properly

**"Session verification timeout"**
- Firebase Admin SDK connectivity issue
- Network problems
- Consider increasing timeout

**"User lacks admin privileges"**
- Custom claims not set
- Need to run: `setCustomUserClaims(uid, { role: 'admin' })`

## Related Files

- `src/hooks.server.ts` - Main auth middleware
- `src/routes/api/auth/session/+server.ts` - Session creation
- `src/routes/login/+page.svelte` - Login UI
- `src/routes/logout/+server.ts` - Logout handler
- `src/lib/server/firebase.ts` - Firebase Admin initialization
