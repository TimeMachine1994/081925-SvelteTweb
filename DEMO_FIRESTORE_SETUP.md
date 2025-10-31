# Demo System Firestore Setup Guide

**Purpose:** Document the Firestore collection structure and indexes required for the demo system.

---

## Collection: `demoSessions`

### Document Structure

```typescript
{
  // Session identification
  id: string;                    // Format: "demo_1730345678_abc123"
  
  // Timestamps
  createdAt: Timestamp;
  expiresAt: Timestamp;
  lastRoleSwitch?: Timestamp;
  
  // Status
  status: "active" | "expired" | "ended";
  
  // Creator
  createdBy: string;             // Admin user UID
  
  // Pre-created demo users (4 roles)
  users: {
    admin: {
      uid: string;               // Firebase Auth UID
      email: string;             // demo-admin-{sessionId}@tributestream.demo
      displayName: string;       // "Demo Admin User"
      role: "admin"
    },
    funeral_director: {
      uid: string;
      email: string;             // demo-funeral_director-{sessionId}@tributestream.demo
      displayName: string;       // "Sarah Johnson (Johnson Funeral Home)"
      role: "funeral_director"
    },
    owner: {
      uid: string;
      email: string;             // demo-owner-{sessionId}@tributestream.demo
      displayName: string;       // "Michael Anderson"
      role: "owner"
    },
    viewer: {
      uid: string;
      email: string;             // demo-viewer-{sessionId}@tributestream.demo
      displayName: string;       // "Guest Viewer"
      role: "viewer"
    }
  },
  
  // Current state
  currentRole: "admin" | "funeral_director" | "owner" | "viewer";
  
  // Metadata (optional)
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    entryPoint?: "landing_page" | "sales_portal" | "magic_link";
    scenario?: string;
  }
}
```

### Sample Document

```json
{
  "id": "demo_1730345678_abc123",
  "createdAt": "2025-10-30T22:00:00.000Z",
  "expiresAt": "2025-10-31T00:00:00.000Z",
  "status": "active",
  "createdBy": "admin_uid_xyz",
  "users": {
    "admin": {
      "uid": "demo_admin_abc123_xyz",
      "email": "demo-admin-demo_1730345678_abc123@tributestream.demo",
      "displayName": "Demo Admin User",
      "role": "admin"
    },
    "funeral_director": {
      "uid": "demo_fd_abc123_xyz",
      "email": "demo-funeral_director-demo_1730345678_abc123@tributestream.demo",
      "displayName": "Sarah Johnson (Johnson Funeral Home)",
      "role": "funeral_director"
    },
    "owner": {
      "uid": "demo_owner_abc123_xyz",
      "email": "demo-owner-demo_1730345678_abc123@tributestream.demo",
      "displayName": "Michael Anderson",
      "role": "owner"
    },
    "viewer": {
      "uid": "demo_viewer_abc123_xyz",
      "email": "demo-viewer-demo_1730345678_abc123@tributestream.demo",
      "displayName": "Guest Viewer",
      "role": "viewer"
    }
  },
  "currentRole": "funeral_director",
  "metadata": {
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "entryPoint": "landing_page",
    "scenario": "first_memorial_service"
  }
}
```

---

## Firestore Indexes Required

### Composite Indexes

**Index 1: Cleanup Query**
- **Collection:** `demoSessions`
- **Fields:**
  - `status` (Ascending)
  - `expiresAt` (Ascending)
- **Query:** Find expired active sessions for cleanup
- **Usage:** `demoSessions.where('status', '==', 'active').where('expiresAt', '<', now)`

**Index 2: Admin Dashboard**
- **Collection:** `demoSessions`
- **Fields:**
  - `createdBy` (Ascending)
  - `createdAt` (Descending)
- **Query:** Show admin's created sessions
- **Usage:** `demoSessions.where('createdBy', '==', adminUid).orderBy('createdAt', 'desc')`

**Index 3: Active Sessions Monitoring**
- **Collection:** `demoSessions`
- **Fields:**
  - `status` (Ascending)
  - `createdAt` (Descending)
- **Query:** List all active sessions
- **Usage:** `demoSessions.where('status', '==', 'active').orderBy('createdAt', 'desc')`

### Single-field Indexes (Auto-created)

These are automatically created by Firestore:
- `id`
- `status`
- `createdBy`
- `createdAt`
- `expiresAt`

---

## Setup Instructions

### 1. Create Collection (Automatic)

The collection will be created automatically when the first demo session is created via the API. No manual creation needed.

### 2. Create Composite Indexes

**Option A: Firebase Console UI**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (`fir-tweb`)
3. Navigate to Firestore Database > Indexes
4. Click "Create Index"
5. Add each composite index using the specifications above

**Option B: Using Firebase CLI**

Create `firestore.indexes.json` in your project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "demoSessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "expiresAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "demoSessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "createdBy", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "demoSessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Then deploy:
```bash
firebase deploy --only firestore:indexes
```

### 3. Update Security Rules (Later)

Security rules will be added in the deployment phase. For now, ensure admin-only access for demo session creation.

---

## Demo Data Tagging

All entities created during demo sessions must include these fields:

```typescript
{
  isDemo: true,
  demoSessionId: "demo_1730345678_abc123",
  demoExpiresAt: "2025-10-31T00:00:00.000Z"
}
```

### Tagged Collections

- **users** - Demo user accounts
- **memorials** - Demo memorials
- **streams** - Demo streams (memorials/{id}/streams subcollection)
- **slideshows** - Demo slideshows (memorials/{id}/slideshows subcollection)
- **funeral_directors** - Demo funeral director profiles (if applicable)

---

## Cleanup Strategy

### Automatic Cleanup (Cron Job)

**Trigger:** Every 15 minutes via Vercel cron or GitHub Actions

**Query:**
```javascript
const expiredSessions = await db
  .collection('demoSessions')
  .where('status', '==', 'active')
  .where('expiresAt', '<', new Date())
  .get();
```

**Cleanup Order:**
1. Delete streams (Firestore + Cloudflare cleanup if needed)
2. Delete slideshows (Firestore + Firebase Storage cleanup)
3. Delete memorials (Firestore)
4. Delete user documents (Firestore)
5. Delete Firebase Auth users (via Admin SDK)
6. Mark session as 'expired'

### Manual Cleanup

Admins can manually end sessions via:
- Demo banner "End Demo" button
- Admin dashboard session management

---

## Storage Considerations

### Expected Volume

- **Sessions per day:** ~50-100
- **Session duration:** 2 hours average
- **Active sessions:** ~10-20 concurrent
- **Documents per session:** ~20-50 (1 session + users + memorials + streams)

### Data Retention

- **Active sessions:** Retained until expiration
- **Expired sessions:** Kept for 7 days for analytics
- **Ended sessions:** Kept for 7 days for analytics
- **Demo entities:** Deleted immediately on cleanup

### Storage Costs

With 100 sessions/day:
- **Firestore writes:** ~5,000/day (creation + cleanup)
- **Firestore reads:** ~10,000/day (status checks + queries)
- **Storage:** < 1 MB (demo sessions are lightweight)

**Estimated cost:** < $1/month for demo system alone

---

## Monitoring

### Key Metrics to Track

1. **Session Creation Rate**
   - Sessions per hour/day
   - Peak creation times
   - Scenario popularity

2. **Session Duration**
   - Average time in demo
   - Completion vs early exit
   - Time by scenario

3. **Cleanup Success**
   - Sessions cleaned successfully
   - Orphaned data
   - Cleanup errors

4. **Conversion Tracking**
   - Demo to signup conversion
   - Role preferences
   - Feature engagement

### Logging

All demo operations should log to console:
- `[DEMO_SESSION] Created: {sessionId}`
- `[DEMO_SESSION] Role switch: {sessionId} -> {newRole}`
- `[DEMO_CLEANUP] Processing {count} expired sessions`
- `[DEMO_CLEANUP] Deleted memorial: {memorialId}`

---

## Testing Checklist

Before production deployment:

- [ ] Manually create test session in Firestore Console
- [ ] Verify document structure matches schema
- [ ] Test composite index queries work
- [ ] Confirm security rules allow admin access
- [ ] Test cleanup query returns correct sessions
- [ ] Verify demo user creation in Firebase Auth
- [ ] Test tagging on all demo entities
- [ ] Confirm cascade delete works properly

---

## Troubleshooting

### Issue: Index not ready

**Error:** "The query requires an index"

**Solution:** 
1. Check Firestore Console > Indexes
2. Wait for index build completion (can take minutes)
3. Follow the error link to auto-create index

### Issue: Permission denied

**Error:** "Missing or insufficient permissions"

**Solution:**
1. Verify security rules allow admin access
2. Check user has proper custom claims
3. Ensure API endpoint validates admin role

### Issue: Session not expiring

**Error:** Sessions remain active after expiration

**Solution:**
1. Check cron job is running
2. Verify cleanup API endpoint works
3. Check composite index for cleanup query
4. Review cleanup logs for errors

---

**Document Version:** 1.0  
**Last Updated:** October 30, 2025  
**Next Review:** After Phase 1 completion
