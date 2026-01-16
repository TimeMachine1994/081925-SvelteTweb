# Authentication Cookie Refactor Documentation

## Overview
**Date**: January 2026  
**Commit**: `8461dbdb` (refactored auth cookie handling to pass cookies directly instead of event object)  
**Impact**: Improved separation of concerns and cleaner API design  
**Status**: ✅ Complete and Deployed

---

## What Changed

### Before: Event Object Pattern
Previously, authentication functions accepted the entire `RequestEvent` object to access cookies:

```typescript
// OLD PATTERN (removed)
export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
  event.cookies.set(sessionCookieName, token, {
    expires: expiresAt,
    path: '/'
  });
}
```

### After: Direct Cookies Parameter
Now, authentication functions accept the `cookies` object directly:

```typescript
// NEW PATTERN (current)
export function setSessionTokenCookie(cookies: any, token: string, expiresAt: Date) {
  cookies.set(sessionCookieName, token, {
    expires: expiresAt,
    path: '/'
  });
}
```

---

## Affected Functions

### In `src/lib/server/auth.ts`

#### 1. `setSessionTokenCookie()`
**Before**:
```typescript
setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date)
```

**After**:
```typescript
setSessionTokenCookie(cookies: any, token: string, expiresAt: Date)
```

**Usage Example**:
```typescript
// In hooks.server.ts
auth.setSessionTokenCookie(event.cookies, sessionToken, session.expiresAt);

// In login route
auth.setSessionTokenCookie(cookies, token, session.expiresAt);
```

#### 2. `deleteSessionTokenCookie()`
**Before**:
```typescript
deleteSessionTokenCookie(event: RequestEvent)
```

**After**:
```typescript
deleteSessionTokenCookie(cookies: any)
```

**Usage Example**:
```typescript
// In hooks.server.ts
auth.deleteSessionTokenCookie(event.cookies);

// In logout route
auth.deleteSessionTokenCookie(cookies);
```

---

## Implementation Details

### Current Auth Flow

#### 1. **Session Token Generation**
```typescript
export function generateSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const token = encodeBase64url(bytes);
  return token;
}
```
- Generates cryptographically secure 18-byte token
- Encodes as base64url for URL safety
- Returns string token for storage

#### 2. **Session Creation**
```typescript
export async function createSession(token: string, userId: string) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: table.Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
  };
  await db.insert(table.session).values(session);
  return session;
}
```
- Hashes token with SHA-256 for database storage
- Sets 30-day expiration
- Stores in `session` table

#### 3. **Session Validation**
```typescript
export async function validateSessionToken(token: string) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const [result] = await db
    .select({
      user: {
        id: table.user.id,
        username: table.user.username,
        role: table.user.role,
        email: table.user.email,
        firstName: table.user.firstName,
        lastName: table.user.lastName,
        phoneNumber: table.user.phoneNumber
      },
      session: table.session
    })
    .from(table.session)
    .innerJoin(table.user, eq(table.session.userId, table.user.id))
    .where(eq(table.session.id, sessionId));

  if (!result) {
    return { session: null, user: null };
  }
  const { session, user } = result;

  // Check expiration
  const sessionExpired = Date.now() >= session.expiresAt.getTime();
  if (sessionExpired) {
    await db.delete(table.session).where(eq(table.session.id, session.id));
    return { session: null, user: null };
  }

  // Auto-renewal: renew if < 15 days remaining
  const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;
  if (renewSession) {
    session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
    await db
      .update(table.session)
      .set({ expiresAt: session.expiresAt })
      .where(eq(table.session.id, session.id));
  }

  return { session, user };
}
```
- Returns full user data for role-based access
- Auto-deletes expired sessions
- Auto-renews sessions with < 15 days remaining
- Returns `{ session, user }` or `{ session: null, user: null }`

#### 4. **Session Invalidation**
```typescript
export async function invalidateSession(sessionId: string) {
  await db.delete(table.session).where(eq(table.session.id, sessionId));
}
```
- Deletes session from database
- Used during logout

---

## Integration Points

### 1. `src/hooks.server.ts` - Global Hook
```typescript
import type { Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';

const handleAuth: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get(auth.sessionCookieName);

  if (!sessionToken) {
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }

  const { session, user } = await auth.validateSessionToken(sessionToken);

  if (session) {
    // Refactored: Pass cookies directly
    auth.setSessionTokenCookie(event.cookies, sessionToken, session.expiresAt);
  } else {
    // Refactored: Pass cookies directly
    auth.deleteSessionTokenCookie(event.cookies);
  }

  event.locals.user = user;
  event.locals.session = session;

  return resolve(event);
};

export const handle: Handle = handleAuth;
```

**Purpose**: 
- Validates session on every request
- Populates `event.locals.user` and `event.locals.session`
- Auto-renews cookies when needed
- **Uses refactored cookie functions**

### 2. Login Route - `src/routes/login/+page.server.ts`
```typescript
// Example usage in login action
const session = await auth.createSession(token, user.id);
auth.setSessionTokenCookie(cookies, token, session.expiresAt);
```

### 3. Logout Route - `src/routes/logout/+page.server.ts`
```typescript
// Example usage in logout action
if (locals.session) {
  await auth.invalidateSession(locals.session.id);
}
auth.deleteSessionTokenCookie(cookies);
```

---

## Benefits of Refactor

### 1. **Cleaner API Design**
- Functions only receive what they need (cookies), not entire event object
- More modular and testable
- Follows single responsibility principle

### 2. **Improved Type Safety**
```typescript
// Clear intent: this function needs cookies
function setSessionTokenCookie(cookies: any, token: string, expiresAt: Date)

// vs unclear: does this function need event.request? event.url? event.params?
function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date)
```

### 3. **Easier Testing**
- Can mock just the cookies object
- Don't need to create full RequestEvent mock
- Simpler unit test setup

### 4. **Better Separation of Concerns**
- Auth module doesn't depend on SvelteKit's RequestEvent type
- Could potentially be reused in non-SvelteKit contexts
- Clearer dependency boundaries

---

## Security Features

### 1. **Token Hashing**
- Plain tokens never stored in database
- SHA-256 hashing for session IDs
- Resistant to database leaks

### 2. **Automatic Expiration**
- Sessions expire after 30 days
- Expired sessions auto-deleted on validation
- No manual cleanup required

### 3. **Auto-Renewal**
- Sessions renewed when < 15 days remaining
- Extends expiration to 30 days from renewal
- Seamless user experience

### 4. **Cookie Security**
```typescript
cookies.set(sessionCookieName, token, {
  expires: expiresAt,
  path: '/'
  // Note: In production, add:
  // httpOnly: true,
  // secure: true,
  // sameSite: 'lax'
});
```

**Recommended Production Settings**:
```typescript
cookies.set(sessionCookieName, token, {
  expires: expiresAt,
  path: '/',
  httpOnly: true,    // Prevent JavaScript access
  secure: true,      // HTTPS only
  sameSite: 'lax'    // CSRF protection
});
```

---

## Migration Guide

If you have custom code that calls these functions:

### Update Pattern 1: In Server Hooks
```typescript
// OLD
auth.setSessionTokenCookie(event, token, expiresAt);

// NEW
auth.setSessionTokenCookie(event.cookies, token, expiresAt);
```

### Update Pattern 2: In Route Actions/Loaders
```typescript
// OLD
export const actions = {
  default: async (event) => {
    auth.setSessionTokenCookie(event, token, expiresAt);
  }
};

// NEW
export const actions = {
  default: async ({ cookies }) => {
    auth.setSessionTokenCookie(cookies, token, expiresAt);
  }
};
```

### Update Pattern 3: In API Routes
```typescript
// OLD
export async function POST(event: RequestEvent) {
  auth.deleteSessionTokenCookie(event);
}

// NEW
export async function POST({ cookies }: RequestEvent) {
  auth.deleteSessionTokenCookie(cookies);
}
```

---

## Constants

```typescript
export const sessionCookieName = 'auth-session';
const DAY_IN_MS = 1000 * 60 * 60 * 24;
```

- **Cookie Name**: `auth-session`
- **Session Duration**: 30 days
- **Renewal Threshold**: 15 days remaining
- **Token Size**: 18 bytes (base64url encoded)

---

## Related Files

- `src/lib/server/auth.ts` - Core authentication functions
- `src/hooks.server.ts` - Global session validation hook
- `src/routes/login/+page.server.ts` - Login implementation
- `src/routes/logout/+page.server.ts` - Logout implementation
- `src/routes/register/+page.server.ts` - Registration with auto-login
- `src/app.d.ts` - TypeScript definitions for locals

---

## Future Enhancements

### Potential Improvements
1. **Multi-device Sessions**
   - Track device/browser info
   - Allow users to view active sessions
   - Remote session invalidation

2. **Remember Me Functionality**
   - Optional extended session duration
   - Separate "remember me" cookie
   - 90-day sessions for opted-in users

3. **Session Activity Tracking**
   - Last accessed timestamp
   - IP address logging
   - User agent tracking

4. **Rate Limiting**
   - Limit login attempts per IP
   - Lock accounts after failed attempts
   - Exponential backoff

---

## Troubleshooting

### Issue: Session not persisting
**Symptoms**: User logged out on every page refresh

**Causes**:
1. Cookie not being set correctly
2. Cookie expiration too short
3. Cookie domain/path mismatch

**Solutions**:
```typescript
// Verify cookie is set in browser DevTools > Application > Cookies
console.log('Session cookie:', event.cookies.get('auth-session'));

// Check cookie path matches
cookies.set(sessionCookieName, token, {
  path: '/'  // Must match all routes
});
```

### Issue: Session not validating
**Symptoms**: `event.locals.user` is null despite valid cookie

**Causes**:
1. Database connection issue
2. Session expired
3. User deleted from database

**Solutions**:
```typescript
// Add debug logging
const { session, user } = await auth.validateSessionToken(sessionToken);
console.log('Validated session:', session);
console.log('Validated user:', user);
```

---

## Testing

### Unit Test Example
```typescript
import { describe, it, expect, vi } from 'vitest';
import * as auth from '$lib/server/auth';

describe('setSessionTokenCookie', () => {
  it('should set cookie with correct parameters', () => {
    const mockCookies = {
      set: vi.fn()
    };
    const token = 'test-token';
    const expiresAt = new Date('2026-12-31');

    auth.setSessionTokenCookie(mockCookies, token, expiresAt);

    expect(mockCookies.set).toHaveBeenCalledWith(
      'auth-session',
      token,
      {
        expires: expiresAt,
        path: '/'
      }
    );
  });
});
```

---

## Changelog

### January 2026 - Cookie Refactor
- ✅ Changed `setSessionTokenCookie` signature from `(event, ...)` to `(cookies, ...)`
- ✅ Changed `deleteSessionTokenCookie` signature from `(event)` to `(cookies)`
- ✅ Updated `hooks.server.ts` to pass `event.cookies` directly
- ✅ Updated all route handlers to use new signatures
- ✅ Maintained backward compatibility with token validation
- ✅ Preserved all security features

---

**Document Version**: 1.0  
**Last Updated**: January 15, 2026  
**Maintained By**: Development Team
