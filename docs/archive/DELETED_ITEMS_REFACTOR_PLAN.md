# Deleted Items System Refactor Plan

**Date:** November 17, 2025  
**Status:** 🔴 CRITICAL - Deleted items not showing in recovery system  
**Priority:** P0 - Blocking data recovery functionality

---

## 🐛 Root Cause Analysis

### The Problem
When admins delete items through the admin panel, they are **permanently deleted** instead of **soft-deleted**, causing them to never appear in the Deleted Items recovery page.

### Current State Findings

#### ✅ What Works (Soft Delete)
1. **Memorials via Bulk Actions** - Uses `/api/admin/bulk-actions` with `action: 'delete'`
   - Sets `isDeleted: true`, `deletedAt: Date`, `deletedBy: uid`
   - Items appear in Deleted Items page ✅
   - Can be recovered within 30 days ✅

#### ❌ What's Broken (Hard Delete)

1. **Streams** - Uses `/api/streams/[streamId]/delete`
   - Line 72: `await streamDoc.ref.delete()` - **PERMANENT DELETION**
   - Never sets `isDeleted` flag
   - Items **immediately gone forever** ❌
   - Called from: `/admin/services/memorials/[memorialId]/+page.svelte` line 132

2. **Individual Memorial Delete API** - `/api/admin/delete-memorial/+server.ts`
   - Line 35: `await adminDb.collection('memorials').doc(memorialId).delete()` - **PERMANENT DELETION**
   - Not currently used in UI (UI uses bulk-actions correctly)
   - Should be updated to match bulk-actions behavior

3. **Users** - `/api/admin/delete-user/+server.ts`
   - Line 40: Firestore delete - **PERMANENT DELETION**
   - Line 46: Firebase Auth delete - **PERMANENT DELETION**
   - No soft delete implemented
   - Unknown where this is called from (needs investigation)

4. **Slideshows** - Status unclear
   - No dedicated delete endpoint found
   - Likely using bulk-actions (needs verification)

5. **Blog Posts** - Status unclear
   - No delete endpoint found in `/api` structure
   - Likely managed through FireCMS
   - Needs soft delete implementation

---

## 📋 System Architecture Issues

### Issue 1: Inconsistent Deletion Patterns
```
CORRECT:  UI → /api/admin/bulk-actions → Soft Delete (isDeleted: true)
WRONG:    UI → /api/streams/[id]/delete → Hard Delete (document.delete())
WRONG:    UI → /api/admin/delete-memorial → Hard Delete (document.delete())
```

### Issue 2: Missing API Endpoints
The Deleted Items page references endpoints that **do not exist**:
- `/api/admin/restore-deleted` - **404 Not Found**
- `/api/admin/permanent-delete` - **404 Not Found**
- `/api/admin/cleanup-expired` - **404 Not Found**

### Issue 3: Incomplete Bulk Actions Coverage
The bulk-actions endpoint handles:
- ✅ Memorials
- ✅ Users (soft delete logic exists)
- ✅ Funeral Directors
- ❌ Streams (not included)
- ❌ Slideshows (not included)
- ❌ Blog Posts (not included)

---

## 🎯 Refactor Goals

1. **Standardize ALL deletions to soft delete by default**
2. **Route ALL delete operations through bulk-actions API**
3. **Implement missing restore/permanent delete endpoints**
4. **Add 30-day auto-cleanup system**
5. **Deprecate old hard-delete endpoints**
6. **Add comprehensive audit logging**

---

## 📐 Implementation Plan

### Phase 1: Fix Immediate Issues (P0 - 4 hours)

#### 1.1 Refactor Stream Deletion
**File:** `/api/streams/[streamId]/delete/+server.ts`

```typescript
// BEFORE (line 72):
await streamDoc.ref.delete();

// AFTER:
await streamDoc.ref.update({
  isDeleted: true,
  deletedAt: new Date(),
  deletedBy: userId
});
```

**Also update:**
- Remove Cloudflare cleanup (move to permanent delete)
- Update audit log action to `stream_soft_deleted`
- Update success message to indicate soft delete

#### 1.2 Add Streams to Bulk Actions
**File:** `/api/admin/bulk-actions/+server.ts`

Update `getCollectionName()` function (line 139):
```typescript
function getCollectionName(resourceType: string): string {
  const map: Record<string, string> = {
    memorial: 'memorials',
    stream: 'streams',
    slideshow: 'slideshows',  // Add this
    user: 'users',
    funeral_director: 'funeral_directors',
    blog_post: 'blog'  // Add this
  };
  return map[resourceType] || resourceType;
}
```

#### 1.3 Update Individual Memorial Delete API
**File:** `/api/admin/delete-memorial/+server.ts`

```typescript
// BEFORE (line 35):
await adminDb.collection('memorials').doc(memorialId).delete();

// AFTER:
await adminDb.collection('memorials').doc(memorialId).update({
  isDeleted: true,
  deletedAt: new Date(),
  deletedBy: locals.user.uid
});
```

#### 1.4 Update User Delete API
**File:** `/api/admin/delete-user/+server.ts`

```typescript
// BEFORE (lines 39-47):
if (userDoc.exists) {
  await adminDb.collection('users').doc(userId).delete();
}
if (authUserData) {
  await adminAuth.deleteUser(userId);
}

// AFTER:
if (userDoc.exists) {
  await adminDb.collection('users').doc(userId).update({
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: locals.user.uid
  });
}
// Don't delete from Firebase Auth yet - do that in permanent delete
```

### Phase 2: Implement Recovery System (P0 - 6 hours)

#### 2.1 Create Restore Endpoint
**File:** `/api/admin/restore-deleted/+server.ts` (NEW)

```typescript
import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { logAuditEvent } from '$lib/server/auditLogger';

export async function POST({ request, locals, getClientAddress }) {
  // Auth check
  if (!locals.user || locals.user.role !== 'admin') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ids } = await request.json();
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return json({ error: 'Invalid request' }, { status: 400 });
  }

  const results = {
    success: [] as string[],
    failed: [] as Array<{ id: string; error: string }>
  };

  // Process each item
  for (const itemId of ids) {
    try {
      // Parse item format: "collection:id"
      const [collectionName, docId] = itemId.split(':');
      
      // Restore by removing soft delete flags
      await adminDb.collection(collectionName).doc(docId).update({
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        restoredAt: new Date(),
        restoredBy: locals.user.uid
      });

      results.success.push(itemId);

      // Audit log
      await logAuditEvent({
        uid: locals.user.uid,
        action: 'resource_restored',
        userEmail: locals.user.email,
        userRole: locals.user.role,
        resourceType: collectionName,
        resourceId: docId,
        details: { restoredBy: locals.user.email },
        success: true,
        ipAddress: getClientAddress(),
        userAgent: request.headers.get('user-agent') || undefined
      });
    } catch (error: any) {
      results.failed.push({ id: itemId, error: error.message });
    }
  }

  return json(results);
}
```

#### 2.2 Create Permanent Delete Endpoint
**File:** `/api/admin/permanent-delete/+server.ts` (NEW)

```typescript
import { json } from '@sveltejs/kit';
import { adminDb, adminAuth } from '$lib/server/firebase';
import { logAuditEvent } from '$lib/server/auditLogger';
import { deleteCloudflareStream } from '$lib/server/cloudflare-stream';

export async function POST({ request, locals, getClientAddress }) {
  // Auth check
  if (!locals.user || locals.user.role !== 'admin') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ids } = await request.json();
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return json({ error: 'Invalid request' }, { status: 400 });
  }

  const results = {
    success: [] as string[],
    failed: [] as Array<{ id: string; error: string }>
  };

  for (const itemId of ids) {
    try {
      const [collectionName, docId] = itemId.split(':');
      
      // Get document data before deletion
      const doc = await adminDb.collection(collectionName).doc(docId).get();
      const data = doc.data();

      // Perform collection-specific cleanup
      if (collectionName === 'streams' && data?.streamCredentials?.cloudflareInputId) {
        try {
          await deleteCloudflareStream(data.streamCredentials.cloudflareInputId);
        } catch (error) {
          console.warn('Failed to cleanup Cloudflare stream:', error);
        }
      }

      if (collectionName === 'users') {
        try {
          await adminAuth.deleteUser(docId);
        } catch (error) {
          console.warn('Failed to delete Firebase Auth user:', error);
        }
      }

      // PERMANENTLY delete from Firestore
      await adminDb.collection(collectionName).doc(docId).delete();

      results.success.push(itemId);

      // Audit log
      await logAuditEvent({
        uid: locals.user.uid,
        action: 'resource_permanent_delete',
        userEmail: locals.user.email,
        userRole: locals.user.role,
        resourceType: collectionName,
        resourceId: docId,
        details: {
          deletedBy: locals.user.email,
          originalData: data
        },
        success: true,
        ipAddress: getClientAddress(),
        userAgent: request.headers.get('user-agent') || undefined
      });
    } catch (error: any) {
      results.failed.push({ id: itemId, error: error.message });
    }
  }

  return json(results);
}
```

#### 2.3 Create Cleanup Expired Endpoint
**File:** `/api/admin/cleanup-expired/+server.ts` (NEW)

```typescript
import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export async function POST({ locals }) {
  // Auth check
  if (!locals.user || locals.user.role !== 'admin') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const collections = ['memorials', 'streams', 'users', 'blog', 'slideshows'];
  let totalDeleted = 0;

  for (const collection of collections) {
    const snapshot = await adminDb
      .collection(collection)
      .where('isDeleted', '==', true)
      .where('deletedAt', '<', thirtyDaysAgo)
      .get();

    for (const doc of snapshot.docs) {
      await doc.ref.delete();
      totalDeleted++;
    }
  }

  return json({
    success: true,
    deletedCount: totalDeleted,
    message: `Permanently deleted ${totalDeleted} expired items`
  });
}
```

### Phase 3: Update Deleted Items UI (P1 - 3 hours)

#### 3.1 Fix Item ID Format
**File:** `/admin/system/deleted-items/+page.server.ts`

Update deleted items data structure (line 65):
```typescript
deletedItems.push({
  id: `${collectionName}:${doc.id}`,  // Add collection prefix
  collectionName,
  resourceType: collectionName === 'blog' ? 'blog_post' : collectionName.slice(0, -1),
  name,
  deletedBy: data.deletedBy,
  deletedByEmail: userMap.get(data.deletedBy) || 'System',
  deletedAt: deletedAt.toISOString(),
  daysUntilPermanent,
  originalData: data
});
```

#### 3.2 Wire Up Cleanup Button
**File:** `/admin/system/deleted-items/+page.svelte`

Update action onclick (line 128):
```typescript
{
  label: 'Cleanup Expired',
  icon: '🧹',
  onclick: async () => {
    if (confirm('Permanently delete all items older than 30 days?\n\nThis CANNOT be undone!')) {
      const response = await fetch('/api/admin/cleanup-expired', {
        method: 'POST'
      });
      if (response.ok) {
        const result = await response.json();
        alert(`Cleaned up ${result.deletedCount} expired items`);
        location.reload();
      }
    }
  }
}
```

#### 3.3 Add Toast Notifications
Install and configure a toast library for better UX feedback.

### Phase 4: Add Filters & Search (P2 - 4 hours)

#### 4.1 Wire Up Filter Functionality
- Connect FilterBuilder to URL query parameters
- Re-query server with filters
- Show active filter chips

#### 4.2 Add Detail Modal
- Create DeletedItemModal component
- Show full original data in formatted view
- Add restore/permanent delete actions

### Phase 5: Add Automated Cleanup (P2 - 2 hours)

#### 5.1 Create Cron Job
**File:** `/api/cron/cleanup-deleted-items/+server.ts` (NEW)

Set up Vercel Cron to run daily:
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/cleanup-deleted-items",
    "schedule": "0 2 * * *"
  }]
}
```

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Delete memorial → Appears in Deleted Items
- [ ] Delete stream → Appears in Deleted Items
- [ ] Delete user → Appears in Deleted Items
- [ ] Restore memorial → Reappears in memorials list
- [ ] Restore stream → Reappears in streams list
- [ ] Permanent delete → Completely removed from Firestore
- [ ] Cleanup expired → Removes items older than 30 days
- [ ] Filter by resource type → Filters correctly
- [ ] Search by name → Finds items

### Edge Cases
- [ ] Delete already deleted item → Graceful error
- [ ] Restore non-existent item → Graceful error
- [ ] Permanent delete with missing Cloudflare resource → Succeeds anyway
- [ ] Concurrent delete operations → No race conditions

---

## 🚨 Breaking Changes

### Migration Required
All existing hard-deleted items are **permanently lost** and cannot be recovered. Going forward:

1. **Old behavior:** Delete → Gone forever
2. **New behavior:** Delete → Soft delete → 30-day recovery period → Auto cleanup

### Firestore Security Rules
Update rules to filter out soft-deleted items:
```javascript
// Allow read only if NOT deleted
allow read: if !resource.data.isDeleted;
```

---

## 📊 Success Metrics

- [ ] 100% of deletions go through soft delete system
- [ ] 0% permanent data loss from accidental deletions
- [ ] Average recovery time < 2 minutes
- [ ] Automated cleanup running daily
- [ ] All delete actions have audit logs

---

## 🔄 Rollback Plan

If issues arise:
1. Revert API endpoint changes
2. Deploy previous version from git
3. Disable automated cleanup cron
4. Investigate issues in staging environment

---

## 📅 Implementation Timeline

| Phase | Tasks | Hours | Priority | Status |
|-------|-------|-------|----------|--------|
| Phase 1 | Fix deletion endpoints | 4h | P0 | 🔴 Not Started |
| Phase 2 | Recovery system | 6h | P0 | 🔴 Not Started |
| Phase 3 | UI updates | 3h | P1 | 🔴 Not Started |
| Phase 4 | Filters & search | 4h | P2 | 🔴 Not Started |
| Phase 5 | Automated cleanup | 2h | P2 | 🔴 Not Started |
| **TOTAL** | | **19h** | | |

---

## 🎯 Next Steps

1. **Review this plan with team**
2. **Create backup of production database**
3. **Start with Phase 1 (fix immediate issues)**
4. **Test thoroughly in staging**
5. **Deploy to production**
6. **Monitor for 48 hours**
7. **Continue with remaining phases**

---

## 📝 Notes

- All soft-deleted items are still in Firestore but hidden from queries
- Automated cleanup will permanently delete after 30 days
- Audit logs are created for all delete/restore operations
- Cloudflare resources are cleaned up during permanent deletion
- Firebase Auth users are only deleted during permanent deletion

---

**Document Owner:** Admin Team  
**Last Updated:** November 17, 2025  
**Next Review:** After Phase 1 completion
