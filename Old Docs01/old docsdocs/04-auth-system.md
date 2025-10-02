# Authentication & Authorization System

## Overview

TributeStream implements a comprehensive authentication and authorization system using Firebase Auth with custom claims for role-based access control. The system supports three primary user roles with hierarchical permissions and secure session management.

## User Roles & Permissions

### Role Hierarchy

```
Admin (Highest)
├── Full system access
├── User management
├── Funeral director approval
└── System configuration

Funeral Director (Professional)
├── Create and manage memorials
├── Client memorial access
├── Livestream management
└── Business profile management

Owner (Family Member)
├── Own memorial management
├── Content editing
├── Livestream scheduling
└── Family member invitations
```

### Role Definitions

#### Admin Role
**Capabilities:**
- Complete system administration
- User account management (activate/suspend)
- Funeral director application approval/rejection
- System statistics and audit logs
- Memorial oversight and moderation
- Global configuration management

**API Access:**
- All `/api/admin/*` endpoints
- Full CRUD on all resources
- System-wide statistics
- Audit trail access

#### Funeral Director Role
**Capabilities:**
- Create memorials for client families
- Manage assigned memorial services
- Access livestream controls for client memorials
- Business profile and document management
- Client communication and coordination

**API Access:**
- `/api/funeral-director/*` endpoints
- Memorial management for assigned memorials
- Livestream control for professional services
- Client registration and invitation workflows

#### Owner Role
**Capabilities:**
- Full control over owned memorials
- Content management (photos, videos, text)
- Livestream scheduling and management
- Family member invitation system
- Memorial privacy and sharing controls

**API Access:**
- Memorial CRUD for owned memorials
- Livestream management for owned services
- Content upload and management
- Family member and invitation management

## Authentication Flow

### Registration Process

#### Family Member Registration
```typescript
// 1. User Registration
const userCredential = await createUserWithEmailAndPassword(auth, email, password);

// 2. Custom Claims Assignment
await fetch('/api/set-role-claim', {
  method: 'POST',
  body: JSON.stringify({
    uid: userCredential.user.uid,
    role: 'owner'
  })
});

// 3. Profile Creation
await setDoc(doc(db, 'users', uid), {
  email,
  displayName,
  role: 'owner',
  createdAt: serverTimestamp()
});

// 4. Session Creation
await fetch('/api/session', {
  method: 'POST',
  body: JSON.stringify({ idToken })
});
```

#### Funeral Director Registration
```typescript
// 1. Application Submission
const formData = new FormData();
formData.append('email', email);
formData.append('businessLicenseFile', licenseFile);
// ... other documents

await fetch('/api/funeral-director/register', {
  method: 'POST',
  body: formData
});

// 2. Admin Review Process
// Applications stored in 'funeral_directors' collection with 'pending' status

// 3. Admin Approval
await fetch('/api/admin/funeral-director/[uid]/approve', {
  method: 'POST'
});

// 4. Firebase Auth Claims Update
await adminAuth.setCustomUserClaims(uid, {
  role: 'funeral_director',
  isAdmin: false
});
```

### Login Process

#### Client-Side Authentication
```typescript
// Login.svelte
async function handleLogin() {
  try {
    isLoading = true;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Get ID token for server-side session
    const idToken = await userCredential.user.getIdToken();
    
    // Create server session
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
    
    if (response.ok) {
      // Force full page reload to ensure session cookie is sent
      window.location.href = '/profile';
    }
  } catch (error) {
    errorMessage = error.message;
  } finally {
    isLoading = false;
  }
}
```

#### Server-Side Session Management
```typescript
// hooks.server.ts
export const handle: Handle = async ({ event, resolve }) => {
  const sessionCookie = event.cookies.get('session');
  
  if (sessionCookie) {
    try {
      // Verify session cookie
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      
      // Set user in locals
      event.locals.user = {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        displayName: decodedClaims.name,
        role: decodedClaims.role || 'owner',
        isAdmin: decodedClaims.isAdmin || false
      };
    } catch (error) {
      // Clear invalid session
      event.cookies.delete('session', { path: '/' });
      event.locals.user = null;
    }
  }
  
  return resolve(event);
};
```

### Session Security

#### Session Cookie Configuration
```typescript
// /api/session/+server.ts
export async function POST({ request, cookies }) {
  const { idToken } = await request.json();
  
  // Create session cookie (24 hour expiration)
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  // Set secure cookie
  cookies.set('session', sessionCookie, {
    maxAge: 24 * 60 * 60, // 24 hours
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/'
  });
  
  return json({ success: true });
}
```

#### Session Validation
```typescript
// Session validation middleware
async function validateSession(sessionCookie: string) {
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return {
      valid: true,
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        role: decodedClaims.role,
        isAdmin: decodedClaims.isAdmin
      }
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

## Authorization Middleware

### Memorial Access Control

#### Memorial Middleware
```typescript
// memorialMiddleware.ts
export async function verifyMemorialAccess(
  memorialId: string,
  user: User,
  action: 'view' | 'edit' | 'delete'
): Promise<{ canAccess: boolean; reason: string }> {
  
  const memorial = await getDoc(doc(db, 'memorials', memorialId));
  
  if (!memorial.exists()) {
    return { canAccess: false, reason: 'Memorial not found' };
  }
  
  const memorialData = memorial.data();
  
  // Admin access
  if (user.isAdmin) {
    return { canAccess: true, reason: 'Admin access' };
  }
  
  // Owner access
  if (memorialData.ownerUid === user.uid) {
    return { canAccess: true, reason: 'Owner access' };
  }
  
  // Funeral director access
  if (user.role === 'funeral_director' && 
      memorialData.funeralDirectorUid === user.uid) {
    return { canAccess: true, reason: 'Funeral director access' };
  }
  
  // Public view access
  if (action === 'view' && memorialData.isPublic) {
    return { canAccess: true, reason: 'Public memorial' };
  }
  
  return { canAccess: false, reason: 'Insufficient permissions' };
}
```

### Stream Access Control

#### Stream Middleware
```typescript
// streamMiddleware.ts
export async function verifyStreamAccess(
  streamId: string,
  user: User,
  action: StreamAction
): Promise<StreamPermissions> {
  
  const stream = await getDoc(doc(db, 'streams', streamId));
  
  if (!stream.exists()) {
    return {
      canView: false,
      canEdit: false,
      canStart: false,
      canStop: false,
      canDelete: false,
      reason: 'Stream not found',
      accessLevel: 'none'
    };
  }
  
  const streamData = stream.data();
  
  // Admin permissions
  if (user.isAdmin) {
    return {
      canView: true,
      canEdit: true,
      canStart: true,
      canStop: true,
      canDelete: true,
      reason: 'Admin access',
      accessLevel: 'admin'
    };
  }
  
  // Creator permissions
  if (streamData.createdBy === user.uid) {
    return {
      canView: true,
      canEdit: true,
      canStart: true,
      canStop: true,
      canDelete: true,
      reason: 'Stream creator',
      accessLevel: 'admin'
    };
  }
  
  // Memorial-based permissions
  if (streamData.memorialId) {
    const memorialAccess = await verifyMemorialAccess(
      streamData.memorialId, 
      user, 
      'edit'
    );
    
    if (memorialAccess.canAccess) {
      return {
        canView: true,
        canEdit: true,
        canStart: true,
        canStop: true,
        canDelete: false,
        reason: 'Memorial access',
        accessLevel: 'edit'
      };
    }
  }
  
  // Public view access
  if (streamData.isPublic && streamData.isVisible) {
    return {
      canView: true,
      canEdit: false,
      canStart: false,
      canStop: false,
      canDelete: false,
      reason: 'Public stream',
      accessLevel: 'view'
    };
  }
  
  return {
    canView: false,
    canEdit: false,
    canStart: false,
    canStop: false,
    canDelete: false,
    reason: 'Insufficient permissions',
    accessLevel: 'none'
  };
}
```

## API Route Protection

### Authentication Required
```typescript
// API route with authentication
export async function GET({ locals }) {
  if (!locals.user) {
    return json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Proceed with authenticated request
  return json({ success: true, data: {} });
}
```

### Role-Based Access
```typescript
// Admin-only endpoint
export async function POST({ locals, request }) {
  if (!locals.user?.isAdmin) {
    return json(
      { success: false, error: 'Admin access required' },
      { status: 403 }
    );
  }
  
  // Admin-only functionality
  return json({ success: true });
}
```

### Resource-Specific Access
```typescript
// Memorial-specific endpoint
export async function PUT({ locals, params, request }) {
  const { memorialId } = params;
  const user = locals.user;
  
  if (!user) {
    return json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  const access = await verifyMemorialAccess(memorialId, user, 'edit');
  
  if (!access.canAccess) {
    return json(
      { success: false, error: access.reason },
      { status: 403 }
    );
  }
  
  // Proceed with memorial update
  return json({ success: true });
}
```

## Frontend Authorization

### Route Protection
```typescript
// +page.server.ts
export async function load({ locals, params }) {
  const user = locals.user;
  
  if (!user) {
    throw redirect(302, '/login');
  }
  
  if (user.role !== 'admin') {
    throw redirect(302, '/profile');
  }
  
  return {
    user
  };
}
```

### Component-Level Authorization
```typescript
// Component with role-based rendering
<script>
  export let user;
  
  $: canManageStreams = user?.role === 'funeral_director' || user?.isAdmin;
  $: canEditMemorial = user?.uid === memorial.ownerUid || 
                       user?.uid === memorial.funeralDirectorUid || 
                       user?.isAdmin;
</script>

{#if canManageStreams}
  <LivestreamControl {memorialId} {user} />
{/if}

{#if canEditMemorial}
  <button onclick={editMemorial}>Edit Memorial</button>
{/if}
```

### Conditional UI Elements
```typescript
// Role-based navigation
<script>
  export let user;
</script>

<nav>
  <a href="/profile">Profile</a>
  
  {#if user?.role === 'funeral_director'}
    <a href="/funeral-director/dashboard">Dashboard</a>
    <a href="/funeral-director/memorials">My Memorials</a>
  {/if}
  
  {#if user?.isAdmin}
    <a href="/admin">Admin Panel</a>
    <a href="/admin/users">User Management</a>
  {/if}
</nav>
```

## Password Reset Flow

### Client-Side Reset Request
```typescript
// Login.svelte
async function handlePasswordReset() {
  try {
    await sendPasswordResetEmail(auth, email);
    resetMessage = 'Password reset email sent. Check your inbox.';
    showResetForm = false;
  } catch (error) {
    errorMessage = error.message;
  }
}
```

### Reset Email Configuration
Firebase Auth handles password reset emails with custom templates configured in the Firebase Console.

## Security Best Practices

### Session Management
- 24-hour session expiration
- Secure HTTP-only cookies
- SameSite protection
- Automatic session cleanup on logout

### Token Validation
- Server-side token verification
- Custom claims validation
- Expired token handling
- Invalid session cleanup

### Role Assignment
- Admin-only role assignment
- Audit logging for role changes
- Principle of least privilege
- Regular permission reviews

### API Security
- Authentication required for sensitive endpoints
- Role-based access control
- Resource-specific permissions
- Rate limiting and abuse prevention

## Development Tools

### Role Switching (Development Only)
```typescript
// DevRoleSwitcher.svelte
async function switchRole(newRole) {
  if (import.meta.env.DEV) {
    await fetch('/api/dev-role-switch', {
      method: 'POST',
      body: JSON.stringify({ role: newRole })
    });
    
    window.location.reload();
  }
}
```

### Authentication Testing
```typescript
// Test utilities for authentication
export const createTestUser = async (role: string) => {
  const testUser = {
    uid: `test-${role}-${Date.now()}`,
    email: `test-${role}@example.com`,
    role,
    isAdmin: role === 'admin'
  };
  
  return testUser;
};
```

## Error Handling

### Authentication Errors
- Invalid credentials
- Account disabled
- Email not verified
- Session expired

### Authorization Errors
- Insufficient permissions
- Resource not found
- Access denied
- Role mismatch

### Error Response Format
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "AUTH_REQUIRED",
  "details": {
    "redirectTo": "/login"
  }
}
```

---

*For API endpoint security details, see [API Routes Reference](./02-api-routes.md). For component-level authorization patterns, see [Component Architecture](./03-components.md).*
