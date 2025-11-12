# Admin User Role

## Overview

The **admin** role is the highest privilege level in TributeStream, granting full system access and management capabilities. Admins can manage all memorials, users, and system configurations regardless of ownership.

## Role Definition

### Custom Claim Structure
```typescript
{
  role: 'admin'
}
```

This custom claim is set in Firebase Auth and verified on every request via session cookies.

## Capabilities

### Full System Access
- **All Memorials**: View, edit, delete any memorial regardless of creator
- **All Users**: View, modify, delete user accounts
- **Funeral Directors**: Approve, suspend, manage FD accounts
- **System Configuration**: Access to admin-only routes and tools
- **Wiki System**: Create, edit, delete internal documentation

### Admin-Only Routes
```
/admin                          # Main admin dashboard
/admin/mvp-dashboard           # Enhanced admin view
/admin/wiki                    # Internal wiki
/admin/wiki/new                # Create wiki pages
/admin/wiki/[slug]             # View wiki pages
/admin/wiki/[slug]/edit        # Edit wiki pages
```

### Permission Overrides
Admins bypass all ownership checks:
```typescript
// Memorial access
if (memorial.createdBy !== user.uid && user.role !== 'admin') {
  throw error(403, 'Unauthorized');
}
// Admin can access regardless of createdBy
```

## Creating Admin Users

### Method 1: Firebase Console
1. Go to Firebase Console → Authentication
2. Find the user by email/UID
3. Click "Set custom claims"
4. Add JSON: `{ "role": "admin" }`
5. User must log out and back in for role to take effect

### Method 2: Firebase Admin SDK Script
```javascript
// scripts/create-admin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function makeAdmin(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
    console.log(`✅ ${email} is now an admin`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Usage
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email');
  process.exit(1);
}

makeAdmin(email);
```

**Run:**
```bash
node scripts/create-admin.js user@example.com
```

### Method 3: Cloud Function (Production)
```typescript
// functions/src/admin.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const makeAdmin = functions.https.onCall(async (data, context) => {
  // Only existing admins can create new admins
  if (context.auth?.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can grant admin role'
    );
  }
  
  const { email } = data;
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
  
  return { success: true, message: `${email} is now an admin` };
});
```

## Authentication Flow

### Server-Side Verification
```typescript
// src/hooks.server.ts
export const handle = async ({ event, resolve }) => {
  const sessionCookie = event.cookies.get('session');
  
  if (sessionCookie) {
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      const userRecord = await adminAuth.getUser(decodedClaims.uid);
      
      event.locals.user = {
        uid: userRecord.uid,
        email: userRecord.email,
        role: userRecord.customClaims?.role || 'owner',
        isAdmin: userRecord.customClaims?.role === 'admin'
      };
    } catch (error) {
      // Invalid session, clear cookie
      event.cookies.delete('session', { path: '/' });
    }
  }
  
  return resolve(event);
};
```

### Route Protection
```typescript
// All admin routes follow this pattern
export const load = async ({ locals }) => {
  // Check authentication
  if (!locals.user) {
    throw redirect(302, '/login');
  }
  
  // Check admin role
  if (locals.user.role !== 'admin') {
    throw redirect(302, '/profile');
  }
  
  // Admin-only logic here...
};
```

## Security Considerations

### Defense in Depth
1. **Custom Claims** - Set in Firebase Auth
2. **Session Verification** - Checked on every request
3. **Route Guards** - Server-side checks in `+page.server.ts`
4. **Firestore Rules** - Database-level security
5. **API Validation** - All API endpoints verify admin role

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Admin-only collections
    match /wiki_pages/{pageId} {
      allow read, write: if isAdmin();
    }
    
    // Admin can access any memorial
    match /memorials/{memorialId} {
      allow read: if resource.data.isPublic == true || 
        isOwner(resource.data) || 
        isAdmin();
      
      allow update, delete: if isOwner(resource.data) || isAdmin();
    }
  }
}
```

### Never Trust Client-Side
```typescript
// ❌ WRONG - Client can fake this
if (user.role === 'admin') {
  showAdminPanel();
}

// ✅ CORRECT - Server verified
if (locals.user?.role === 'admin') {
  // Server-side rendering with verified role
}
```

## Checking Admin Status

### In Server Code
```typescript
// +page.server.ts
export const load = async ({ locals }) => {
  const isAdmin = locals.user?.role === 'admin';
  
  if (isAdmin) {
    // Load admin data
  }
};
```

### In Svelte Components
```svelte
<script lang="ts">
  import { page } from '$app/stores';
  
  $: isAdmin = $page.data.user?.role === 'admin';
</script>

{#if isAdmin}
  <AdminPanel />
{/if}
```

### In API Endpoints
```typescript
// +server.ts
export const POST = async ({ request, locals }) => {
  if (locals.user?.role !== 'admin') {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  // Admin-only logic
};
```

## Admin Responsibilities

### User Management
- Approve/reject funeral director applications
- Modify user roles
- Handle user support requests
- Delete spam/abuse accounts

### Memorial Management
- Review flagged memorials
- Edit memorials on behalf of users
- Delete inappropriate content
- Resolve technical issues

### System Monitoring
- Check livestream health
- Monitor payment processing
- Review error logs
- Track system metrics

### Content Moderation
- Review guestbook entries
- Moderate blog comments
- Handle DMCA requests
- Enforce community guidelines

## Audit Logging

### Log Admin Actions
```typescript
async function logAdminAction(action: string, details: any) {
  await adminDb.collection('audit_logs').add({
    action,
    performedBy: locals.user.uid,
    performedByEmail: locals.user.email,
    details,
    timestamp: FieldValue.serverTimestamp()
  });
}

// Example usage
await logAdminAction('delete_memorial', {
  memorialId: memorial.id,
  memorialSlug: memorial.fullSlug,
  reason: 'User request'
});
```

### View Audit Logs
```typescript
const logs = await adminDb
  .collection('audit_logs')
  .orderBy('timestamp', 'desc')
  .limit(100)
  .get();
```

## Revoking Admin Access

### Remove Admin Role
```javascript
// Set back to owner role
await admin.auth().setCustomUserClaims(uid, { role: 'owner' });

// Or remove all custom claims
await admin.auth().setCustomUserClaims(uid, {});
```

### Force Session Invalidation
```javascript
// Revoke all refresh tokens
await admin.auth().revokeRefreshTokens(uid);

// User must log in again to get new session
```

## Testing Admin Features

### Local Development
```bash
# Set your account as admin
node scripts/create-admin.js your-dev-email@example.com

# Test admin routes
npm run dev
# Navigate to /admin
```

### Test Account Setup
```javascript
// Create test admin account
const testAdmin = await admin.auth().createUser({
  email: 'admin-test@example.com',
  password: 'TestPassword123!',
  displayName: 'Test Admin'
});

await admin.auth().setCustomUserClaims(testAdmin.uid, { role: 'admin' });
```

## Common Issues

### "Access Denied" After Setting Admin Role
**Cause**: Custom claims cached in session

**Solution**: User must log out and back in

```typescript
// Or force session refresh
await adminAuth.revokeRefreshTokens(uid);
```

### Admin Status Not Reflecting
**Check**:
1. Custom claims set correctly in Firebase Console
2. Session cookie being verified in `hooks.server.ts`
3. `locals.user.role` populated correctly
4. User logged out/in after role change

### Firestore Permission Denied
**Check**:
1. Security rules include `isAdmin()` function
2. `users` collection has role field
3. User document synced with custom claims

## Best Practices

1. **Limit Admin Accounts**: Only create admins as needed
2. **Use Strong Passwords**: Enforce 2FA for admin accounts
3. **Log All Actions**: Track admin operations for audit
4. **Principle of Least Privilege**: Consider creating sub-roles if needed
5. **Regular Reviews**: Audit admin list quarterly
6. **Secure Service Accounts**: Protect Firebase service account keys
7. **Monitor Admin Activity**: Alert on suspicious behavior

## Related Documentation

- [[Authentication Flow]] - Complete auth system overview
- [[User Roles & Permissions]] - All role types explained
- [[Admin Dashboard]] - Admin interface guide
- [[Firestore Security Rules]] - Database security
- [[Audit Logging]] - Tracking admin actions

## Emergency Procedures

### Compromised Admin Account
1. Immediately revoke custom claims
2. Revoke all refresh tokens
3. Change password via Firebase Console
4. Review audit logs for unauthorized actions
5. Notify team and affected users

### Lost Admin Access
1. Access Firebase Console directly
2. Use service account to run admin script
3. Contact Firebase support if needed
4. Review backup admin accounts

---

**Last Updated**: November 11, 2024  
**Category**: Core Systems > Authentication & Security  
**Tags**: #admin #security #authentication #permissions #roles
