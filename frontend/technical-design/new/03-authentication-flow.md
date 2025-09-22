# TributeStream V1 - Authentication & Authorization Flow

## Overview
TributeStream implements a hybrid authentication system combining Firebase Auth for client-side authentication with custom session cookies for server-side verification, providing secure role-based access control.

## Authentication Architecture

### Core Components
1. **Firebase Auth** - Client-side authentication
2. **Custom Session Cookies** - Server-side session management
3. **Firebase Admin SDK** - Server-side token verification
4. **Role-Based Access Control** - Permission management
5. **Audit Logging** - Security event tracking

## Authentication Flow

### 1. Client-Side Authentication (Firebase Auth)

#### Login Process (`Login.svelte`)
```typescript
// 1. User submits email/password
const userCredential = await signInWithEmailAndPassword(auth, email, password);

// 2. Get Firebase ID token
const idToken = await userCredential.user.getIdToken();

// 3. Send to server for session creation
await createSession(idToken);
```

#### Session Creation (`/api/session`)
```typescript
// 1. Verify ID token
const decodedToken = await adminAuth.verifyIdToken(idToken);

// 2. Create session cookie (24 hours)
const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

// 3. Set secure HTTP-only cookie
cookies.set('session', sessionCookie, {
  maxAge: expiresIn,
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/'
});

// 4. Role-based redirect
if (decodedToken.role === 'admin') {
  return json({ redirectTo: '/admin' });
} else if (slug) {
  return json({ redirectTo: `/tributes/${slug}` });
} else {
  return json({ redirectTo: '/my-portal' });
}
```

### 2. Server-Side Session Management

#### Authentication Middleware (`hooks.server.ts`)
```typescript
export const authHandle: Handle = async ({ event, resolve }) => {
  const sessionCookie = event.cookies.get('session');
  
  if (sessionCookie) {
    try {
      // 1. Verify session cookie
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      
      // 2. Get user record with retry logic
      let userRecord;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          userRecord = await adminAuth.getUser(decodedClaims.uid);
          break;
        } catch (userError: any) {
          if (userError.code === 'auth/user-not-found' && retryCount < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            retryCount++;
          } else {
            throw userError;
          }
        }
      }
      
      // 3. Set user context
      event.locals.user = {
        uid: userRecord.uid,
        email: userRecord.email || null,
        displayName: userRecord.displayName,
        role: userRecord.customClaims?.role || 'owner',
        isAdmin: userRecord.customClaims?.admin || false
      };
      
      // 4. Log successful authentication
      if (event.url.pathname.includes('/login')) {
        await logUserAction(userContext, 'user_login', userContext.userId, {
          loginTime: new Date().toISOString(),
          userAgent: userContext.userAgent
        });
      }
      
    } catch (error) {
      // Handle authentication errors
      if (error.message.includes('expired')) {
        console.error('Session cookie has expired');
      } else if (error.message.includes('invalid signature')) {
        event.cookies.delete('session', { path: '/' });
      }
      event.locals.user = null;
    }
  } else {
    event.locals.user = null;
  }
  
  return resolve(event);
};
```

## Role-Based Access Control

### User Roles
```typescript
type UserRole = 'admin' | 'owner' | 'funeral_director';

interface UserContext {
  uid: string;
  email: string | null;
  role: UserRole;
  isAdmin: boolean;
}
```

### Role Hierarchy & Permissions

#### Admin Role
- **System Access**: Full system administration
- **User Management**: Create, suspend, delete users
- **Memorial Access**: All memorials with admin-level access
- **Audit Access**: Full audit log access
- **Override Permissions**: Can access any resource

#### Owner Role
- **Memorial Ownership**: Memorials they own
- **Family Management**: Manage family member access
- **Content Control**: Edit memorial content and settings
- **Livestream Access**: Control livestream for owned memorials

#### Funeral Director Role
- **Memorial Creation**: Create memorials for families
- **Assigned Memorials**: Access to memorials they're assigned to
- **Family Support**: Create family accounts
- **Business Management**: Manage funeral director profile

### Access Control Implementation

#### Memorial Access Verification (`MemorialAccessVerifier`)
```typescript
class MemorialAccessVerifier {
  static async checkViewAccess(memorialId: string, user: UserContext): Promise<AccessCheckResult> {
    // 1. Admin always has access
    if (user.role === 'admin' || user.isAdmin) {
      return { hasAccess: true, accessLevel: 'admin', reason: 'Admin privileges' };
    }
    
    // 2. Get memorial document
    const memorial = await getMemorial(memorialId);
    if (!memorial) {
      return { hasAccess: false, accessLevel: 'none', reason: 'Memorial not found' };
    }
    
    // 3. Owner has full access
    if (memorial.ownerUid === user.uid) {
      return { hasAccess: true, accessLevel: 'admin', reason: 'Memorial owner' };
    }
    
    // 4. Assigned funeral director has edit access
    if (user.role === 'funeral_director' && memorial.funeralDirectorUid === user.uid) {
      return { hasAccess: true, accessLevel: 'edit', reason: 'Assigned funeral director' };
    }
    
    // 5. Public access (when implemented)
    if (memorial.isPublic) {
      return { hasAccess: true, accessLevel: 'view', reason: 'Public memorial' };
    }
    
    return { hasAccess: false, accessLevel: 'none', reason: 'Insufficient permissions' };
  }
  
  static async checkEditAccess(memorialId: string, user: UserContext): Promise<AccessCheckResult> {
    const viewAccess = await this.checkViewAccess(memorialId, user);
    
    if (!viewAccess.hasAccess) return viewAccess;
    
    // Only admin and edit level access can modify
    if (viewAccess.accessLevel === 'admin' || viewAccess.accessLevel === 'edit') {
      return viewAccess;
    }
    
    return { hasAccess: false, accessLevel: 'none', reason: 'Edit permission denied' };
  }
}
```

#### API Endpoint Protection
```typescript
// Example API endpoint with role verification
export const GET: RequestHandler = async ({ locals, params }) => {
  // 1. Check authentication
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  // 2. Check role-specific permissions
  if (locals.user.role !== 'admin') {
    return json({ error: 'Admin access required' }, { status: 403 });
  }
  
  // 3. Check resource-specific access
  const accessResult = await MemorialAccessVerifier.checkViewAccess(
    params.memorialId, 
    locals.user
  );
  
  if (!accessResult.hasAccess) {
    await logAccessDenied(locals.user, 'memorial', params.memorialId, accessResult.reason);
    return json({ error: 'Access denied' }, { status: 403 });
  }
  
  // 4. Process request with appropriate access level
  // ...
};
```

## Registration Flows

### 1. Family Memorial Creation (`/register/loved-one`)
```typescript
// Flow: Direct family registration
1. Family fills memorial creation form
2. Create Firebase Auth user with 'owner' role
3. Create user profile in Firestore
4. Create memorial with generated slug
5. Send registration email with credentials
6. Auto-login via custom token
7. Redirect to memorial page
```

### 2. Funeral Director Registration (`/register/funeral-director`)
```typescript
// Flow: FD creates memorial for family
1. Verify logged-in funeral director
2. Load FD profile from Firestore
3. Family fills comprehensive memorial form
4. Create Firebase Auth user for family ('owner' role)
5. Create memorial with both ownerUid and funeralDirectorUid
6. Send registration email to family
7. Return memorial link for FD to share
```

### 3. Funeral Home Registration (`/register/funeral-home`)
```typescript
// Flow: New funeral director registration
1. FD fills business registration form
2. Create Firebase Auth user with 'funeral_director' role
3. Auto-approve and create funeral_directors document
4. Set permissions and streaming configuration
5. Auto-login via custom token
6. Redirect to profile setup
```

## Security Features

### Session Security
- **HttpOnly Cookies**: Prevent XSS attacks
- **Secure Flag**: HTTPS-only transmission
- **SameSite Protection**: CSRF protection
- **24-Hour Expiry**: Limited session lifetime
- **Server-Side Verification**: Firebase Admin SDK validation

### Token Security
- **ID Token Verification**: Firebase Admin SDK verification
- **Custom Claims**: Role information in JWT
- **Token Refresh**: Automatic token refresh handling
- **Revocation Support**: Firebase token revocation

### Access Control Security
- **Principle of Least Privilege**: Minimum required permissions
- **Resource-Level Checks**: Per-resource access verification
- **Role Separation**: Clear role boundaries
- **Admin Override**: Emergency admin access

### Audit & Monitoring
- **Authentication Events**: Login/logout tracking
- **Access Attempts**: Failed access logging
- **Permission Changes**: Role modification tracking
- **Security Events**: Suspicious activity detection

## Error Handling

### Authentication Errors
```typescript
// Common authentication error scenarios
- 'auth/user-not-found': User record propagation delay
- 'auth/invalid-id-token': Expired or malformed token
- 'auth/session-cookie-expired': Session timeout
- 'auth/session-cookie-revoked': Token revocation
- 'auth/insufficient-permission': Role-based access denial
```

### Error Recovery
- **Retry Logic**: User record propagation delays
- **Graceful Degradation**: Fallback to public access
- **Session Cleanup**: Invalid session removal
- **User Feedback**: Clear error messages

## Development & Testing

### Test Accounts
```typescript
// Pre-configured test accounts for development
- admin@test.com (password: test123) - Admin role
- director@test.com (password: test123) - Funeral Director role  
- owner@test.com (password: test123) - Owner role
- viewer@test.com (password: test123) - Viewer role
```

### Firebase Emulators
- **Auth Emulator**: Port 9099 for authentication testing
- **Firestore Emulator**: Port 8080 for database testing
- **Storage Emulator**: Port 9199 for file storage testing

### Role Switching
- **DevRoleSwitcher**: Development utility for role testing
- **Test Claims**: Dynamic role assignment for testing
- **Emulator Integration**: Seamless emulator connectivity

## Performance Considerations

### Authentication Performance
- **Session Caching**: Server-side session storage
- **Token Reuse**: Efficient token management
- **Connection Pooling**: Firebase Admin SDK optimization
- **Retry Strategies**: Intelligent retry mechanisms

### Access Control Performance
- **Permission Caching**: Role-based permission caching
- **Batch Queries**: Efficient Firestore queries
- **Index Optimization**: Proper Firestore indexing
- **Lazy Loading**: On-demand permission checks

This authentication system provides robust security while maintaining good user experience and developer productivity.
