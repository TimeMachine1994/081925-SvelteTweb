# Photo Security Implementation Plan

## Executive Summary
This plan addresses critical security gaps in the memorial photo management system, enabling family members to upload photos while maintaining proper security boundaries.

## Current Gaps
1. **Family members cannot upload photos** - Only owners can currently upload
2. **No Firebase Storage security rules** - Default rules likely in place
3. **Firestore rules don't support family member editing** - Missing role-based access
4. **Inefficient invitation lookups** - No predictable invitation IDs

## Phase 1: Database Schema Optimization (Day 1)

### 1.1 Optimize Invitation Document IDs
**Problem**: Current invitation IDs are random, making security rule lookups inefficient.

**Solution**: Use predictable composite IDs: `{email}_{memorialId}`

#### Implementation Steps:

1. **Create migration script** (`scripts/migrate-invitations.js`):
```javascript
const { adminDb } = require('../src/lib/server/firebase');

async function migrateInvitations() {
  const invitationsSnapshot = await adminDb.collection('invitations').get();
  const batch = adminDb.batch();
  
  for (const doc of invitationsSnapshot.docs) {
    const data = doc.data();
    const newId = `${data.inviteeEmail}_${data.memorialId}`;
    
    // Create new document with predictable ID
    const newRef = adminDb.collection('invitations').doc(newId);
    batch.set(newRef, data);
    
    // Delete old document
    batch.delete(doc.ref);
  }
  
  await batch.commit();
  console.log(`✅ Migrated ${invitationsSnapshot.size} invitations`);
}
```

2. **Update invitation creation** in `/api/memorials/[memorialId]/invite/+server.ts`:
```typescript
// Change from random ID to composite ID
const invitationId = `${inviteeEmail}_${memorialId}`;
const invitationRef = adminDb.collection('invitations').doc(invitationId);

// Check if invitation already exists
const existingInvitation = await invitationRef.get();
if (existingInvitation.exists) {
  throw error(409, 'Invitation already sent to this email');
}

await invitationRef.set(invitationData);
```

### 1.2 Add Family Member Tracking
**Problem**: No efficient way to query family members for a memorial.

**Solution**: Add a `familyMembers` subcollection to memorials.

#### Implementation:
1. **Update invitation acceptance** to add family member record:
```typescript
// In /api/memorials/[memorialId]/invite/[invitationId]/+server.ts
await adminDb.runTransaction(async (transaction) => {
  // Update invitation status
  transaction.update(invitationRef, { 
    status: 'accepted',
    acceptedAt: Timestamp.now() 
  });
  
  // Add to familyMembers subcollection
  const familyMemberRef = adminDb
    .collection('memorials')
    .doc(memorialId)
    .collection('familyMembers')
    .doc(userId);
    
  transaction.set(familyMemberRef, {
    userId: userId,
    email: userEmail,
    role: 'family_member',
    addedAt: Timestamp.now(),
    invitationId: invitationId
  });
});
```

## Phase 2: Security Rules Implementation (Day 2)

### 2.1 Deploy Firestore Security Rules
**File**: `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }
    
    function isOwner(memorialId) {
      return request.auth != null && (
        request.auth.uid == get(/databases/$(database)/documents/memorials/$(memorialId)).data.creatorUid ||
        request.auth.uid == get(/databases/$(database)/documents/memorials/$(memorialId)).data.createdByUserId
      );
    }
    
    function isFamilyMember(memorialId) {
      return request.auth != null && 
        exists(/databases/$(database)/documents/memorials/$(memorialId)/familyMembers/$(request.auth.uid));
    }
    
    function canEditMemorial(memorialId) {
      return isAdmin() || isOwner(memorialId) || isFamilyMember(memorialId);
    }
    
    // ============================================
    // MEMORIAL DOCUMENTS
    // ============================================
    
    match /memorials/{memorialId} {
      allow read: if resource.data.isPublic == true || canEditMemorial(memorialId);
      allow create: if request.auth != null;
      allow update: if canEditMemorial(memorialId) && 
        (isOwner(memorialId) || onlyUpdatingAllowedFields());
      allow delete: if isAdmin() || isOwner(memorialId);
      
      function onlyUpdatingAllowedFields() {
        let changedFields = request.resource.data.diff(resource.data).affectedKeys();
        return changedFields.hasOnly(['photos', 'photoMetadata', 'updatedAt']);
      }
      
      // Family Members subcollection
      match /familyMembers/{userId} {
        allow read: if canEditMemorial(memorialId);
        allow write: if isOwner(memorialId) || isAdmin();
      }
      
      // Followers subcollection
      match /followers/{userId} {
        allow read, create, delete: if request.auth != null && request.auth.uid == userId;
        allow update: if false;
      }
    }
    
    // ============================================
    // INVITATION DOCUMENTS
    // ============================================
    
    match /invitations/{invitationId} {
      allow read: if isAdmin() ||
        (request.auth != null && request.auth.uid == resource.data.invitedByUid) ||
        (request.auth != null && request.auth.token.email == resource.data.inviteeEmail);
      
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.invitedByUid &&
        isOwner(request.resource.data.memorialId);
      
      allow update: if request.auth != null && 
        request.auth.token.email == resource.data.inviteeEmail &&
        request.resource.data.status == 'accepted';
      
      allow delete: if false;
    }
  }
}
```

**Deployment**:
```bash
firebase deploy --only firestore:rules
```

### 2.2 Deploy Firebase Storage Rules
**File**: `storage.rules`

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }
    
    // Get memorial data from Firestore
    function getMemorial(memorialId) {
      return firestore.get(/databases/(default)/documents/memorials/$(memorialId));
    }
    
    function isOwner(memorialId) {
      let memorial = getMemorial(memorialId);
      return request.auth.uid == memorial.data.creatorUid ||
             request.auth.uid == memorial.data.createdByUserId;
    }
    
    function isFamilyMember(memorialId) {
      return firestore.exists(/databases/(default)/documents/memorials/$(memorialId)/familyMembers/$(request.auth.uid));
    }
    
    function canUploadPhotos(memorialId) {
      return isAuthenticated() && (
        isAdmin() ||
        isOwner(memorialId) ||
        isFamilyMember(memorialId)
      );
    }
    
    // Memorial photos
    match /memorials/{memorialId}/{allPaths=**} {
      allow read: if true; // Public read access
      allow create, update: if canUploadPhotos(memorialId) &&
        request.resource.size < 10 * 1024 * 1024 && // 10MB limit
        request.resource.contentType.matches('image/.*'); // Images only
      allow delete: if isAdmin() || isOwner(memorialId);
    }
  }
}
```

**Update `firebase.json`**:
```json
{
  "storage": {
    "rules": "storage.rules"
  }
}
```

**Deployment**:
```bash
firebase deploy --only storage
```

## Phase 3: Server-Side Code Updates (Day 3)

### 3.1 Update Photo Upload Handler
**File**: `frontend/src/routes/my-portal/tributes/[memorialId]/upload/+server.ts`

```typescript
import { error, json } from '@sveltejs/kit';
import { adminDb, adminStorage } from '$lib/server/firebase';
import { getDownloadURL } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST({ request, params, locals }) {
    console.log('📬 Photo upload request for memorial:', params.memorialId);

    if (!locals.user) {
        throw error(401, 'Unauthorized');
    }

    const { memorialId } = params;
    const memorialRef = adminDb.collection('memorials').doc(memorialId);
    const memorialDoc = await memorialRef.get();

    if (!memorialDoc.exists) {
        return json({ error: 'Memorial not found' }, { status: 404 });
    }

    const memorialData = memorialDoc.data();
    
    // Check ownership
    const isOwner = memorialData?.creatorUid === locals.user.uid || 
                   memorialData?.createdByUserId === locals.user.uid;
    
    // Check family member status
    const familyMemberRef = memorialRef
        .collection('familyMembers')
        .doc(locals.user.uid);
    const familyMemberDoc = await familyMemberRef.get();
    const isFamilyMember = familyMemberDoc.exists;
    
    // Check admin status
    const isAdmin = locals.user.admin === true;
    
    if (!isOwner && !isFamilyMember && !isAdmin) {
        console.log(`🚫 Forbidden upload attempt by user ${locals.user.uid}`);
        return json({ error: 'You do not have permission to upload photos' }, { status: 403 });
    }

    const formData = await request.formData();
    const photo = formData.get('photo') as File;

    if (!photo) {
        return json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!photo.type.startsWith('image/')) {
        return json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (photo.size > 10 * 1024 * 1024) {
        return json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await photo.arrayBuffer());
    const fileName = `${Date.now()}-${crypto.randomUUID()}-${photo.name}`;
    const filePath = `memorials/${memorialId}/${fileName}`;
    const file = adminStorage.bucket().file(filePath);

    try {
        await file.save(fileBuffer, {
            metadata: { 
                contentType: photo.type,
                metadata: {
                    uploadedBy: locals.user.uid,
                    uploadedByEmail: locals.user.email,
                    uploadedByRole: isOwner ? 'owner' : isFamilyMember ? 'family_member' : 'admin',
                    originalName: photo.name
                }
            }
        });

        const downloadURL = await getDownloadURL(file);

        // Update memorial with new photo URL
        await memorialRef.update({
            photos: FieldValue.arrayUnion(downloadURL),
            updatedAt: FieldValue.serverTimestamp()
        });

        // Log the upload
        await adminDb.collection('photoUploads').add({
            memorialId,
            photoUrl: downloadURL,
            uploadedBy: locals.user.uid,
            uploadedByEmail: locals.user.email,
            uploadedByRole: isOwner ? 'owner' : isFamilyMember ? 'family_member' : 'admin',
            uploadedAt: FieldValue.serverTimestamp()
        });

        return json({ success: true, url: downloadURL });
    } catch (err) {
        console.error('🔥 Upload error:', err);
        return json({ error: 'File upload failed' }, { status: 500 });
    }
}
```

### 3.2 Update Edit Page Access
**File**: `frontend/src/routes/my-portal/tributes/[memorialId]/edit/+page.server.ts`

```typescript
export const load: PageServerLoad = async ({ params, locals }) => {
    if (!locals.user) {
        throw redirect(302, '/login');
    }

    const { memorialId } = params;
    const memorialRef = adminDb.collection('memorials').doc(memorialId);
    const memorialDoc = await memorialRef.get();

    if (!memorialDoc.exists) {
        throw error(404, 'Not Found');
    }

    const memorialData = memorialDoc.data();
    
    // Check access permissions
    const isOwner = memorialData?.creatorUid === locals.user.uid || 
                   memorialData?.createdByUserId === locals.user.uid;
    
    const familyMemberDoc = await memorialRef
        .collection('familyMembers')
        .doc(locals.user.uid)
        .get();
    const isFamilyMember = familyMemberDoc.exists;
    
    const isAdmin = locals.user.admin === true;
    
    const canEdit = isOwner || isFamilyMember || isAdmin;
    
    if (!canEdit) {
        throw error(403, 'Forbidden');
    }
    
    const memorial = {
        id: memorialDoc.id,
        ...memorialData,
        userRole: isOwner ? 'owner' : isFamilyMember ? 'family_member' : 'admin',
        canDelete: isOwner || isAdmin, // Only owners and admins can delete
        canManageSettings: isOwner || isAdmin, // Only owners and admins can change settings
        canUploadPhotos: true // All authorized users can upload photos
    };

    return {
        memorial
    };
};
```

## Phase 4: UI Updates (Day 4)

### 4.1 Update FamilyMemberPortal Component
**File**: `frontend/src/lib/components/portals/FamilyMemberPortal.svelte`

```svelte
<script lang="ts">
    import type { Memorial } from '$lib/types/memorial';
    import MemorialCard from '$lib/components/ui/MemorialCard.svelte';
    import ActionButton from '$lib/components/ui/ActionButton.svelte';

    let { memorials }: { memorials: Memorial[] } = $props();
</script>

<div class="family-portal">
    <h2 class="portal-title">Memorials You're Part Of</h2>
    
    {#if memorials && memorials.length > 0}
        <div class="memorial-grid">
            {#each memorials as memorial}
                <div class="memorial-item">
                    <MemorialCard {memorial} />
                    <div class="action-buttons">
                        <ActionButton
                            href="/tributes/{memorial.fullSlug}"
                            variant="secondary"
                            icon="view"
                        >
                            View Memorial
                        </ActionButton>
                        <ActionButton
                            href="/my-portal/tributes/{memorial.id}/edit"
                            variant="primary"
                            icon="photo"
                        >
                            Add Photos
                        </ActionButton>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div class="empty-state">
            <p>You haven't been invited to any memorials yet.</p>
            <p class="help-text">Ask the memorial owner to send you an invitation.</p>
        </div>
    {/if}
</div>

<style>
    .family-portal {
        padding: 2rem;
    }
    
    .portal-title {
        font-size: 1.875rem;
        font-weight: 700;
        margin-bottom: 2rem;
    }
    
    .memorial-grid {
        display: grid;
        gap: 2rem;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
    
    .memorial-item {
        background: white;
        border-radius: 0.5rem;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .action-buttons {
        padding: 1rem;
        display: flex;
        gap: 0.5rem;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem;
        color: #6b7280;
    }
    
    .help-text {
        margin-top: 0.5rem;
        font-size: 0.875rem;
    }
</style>
```

### 4.2 Update Edit Page UI
Add role indicator to show user's permissions:

```svelte
<!-- In edit/+page.svelte -->
{#if data.memorial.userRole}
    <div class="user-role-badge">
        {#if data.memorial.userRole === 'owner'}
            👑 Owner
        {:else if data.memorial.userRole === 'family_member'}
            👨‍👩‍👧‍👦 Family Member
        {:else if data.memorial.userRole === 'admin'}
            🛡️ Admin
        {/if}
    </div>
{/if}
```

## Phase 5: Testing & Deployment (Day 5)

### 5.1 Testing Checklist

#### Security Rules Testing
```javascript
// Create test file: test/security-rules.test.js
const testing = require('@firebase/rules-unit-testing');

describe('Firestore Security Rules', () => {
  let testEnv;
  
  beforeAll(async () => {
    testEnv = await testing.initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8')
      }
    });
  });
  
  test('Owner can upload photos', async () => {
    const memorial = testEnv.authenticatedContext('owner-id');
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('memorials').doc('memorial-1').set({
        creatorUid: 'owner-id',
        photos: []
      });
    });
    
    await assertSucceeds(
      memorial.firestore().collection('memorials').doc('memorial-1').update({
        photos: ['new-photo.jpg']
      })
    );
  });
  
  test('Family member can upload photos', async () => {
    const familyMember = testEnv.authenticatedContext('family-id');
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore()
        .collection('memorials/memorial-1/familyMembers')
        .doc('family-id')
        .set({ role: 'family_member' });
    });
    
    await assertSucceeds(
      familyMember.firestore().collection('memorials').doc('memorial-1').update({
        photos: ['family-photo.jpg']
      })
    );
  });
});
```

### 5.2 Manual Testing Steps

1. **Test Owner Upload**:
   - Login as memorial owner
   - Navigate to memorial edit page
   - Upload a photo
   - Verify photo appears in gallery

2. **Test Family Member Access**:
   - Send invitation to test account
   - Accept invitation
   - Navigate to memorial edit page
   - Upload a photo
   - Verify photo appears
   - Try to delete memorial (should fail)

3. **Test Security Boundaries**:
   - Try accessing edit page without permission (should 403)
   - Try uploading without auth (should 401)
   - Try uploading non-image file (should reject)

### 5.3 Deployment Steps

1. **Backup Current Data**:
```bash
gcloud firestore export gs://your-backup-bucket/$(date +%Y%m%d-%H%M%S)
```

2. **Deploy Security Rules**:
```bash
# Test rules first
firebase emulators:exec --only firestore "npm test"

# Deploy to production
firebase deploy --only firestore:rules,storage:rules
```

3. **Deploy Code Updates**:
```bash
# Build and test
npm run build
npm run test

# Deploy to hosting
npm run deploy
```

4. **Run Migration Scripts**:
```bash
node scripts/migrate-invitations.js
```

5. **Monitor for Issues**:
- Watch Firebase Console for rule denials
- Monitor error logs
- Check photo upload success rate

## Phase 6: Monitoring & Optimization (Ongoing)

### 6.1 Add Analytics
```typescript
// Track photo uploads
await adminDb.collection('analytics').add({
  event: 'photo_upload',
  memorialId,
  userId: locals.user.uid,
  userRole: role,
  timestamp: FieldValue.serverTimestamp()
});
```

### 6.2 Performance Monitoring
- Monitor rule evaluation time
- Track photo upload duration
- Measure page load times

### 6.3 Security Auditing
```typescript
// Create audit log for sensitive actions
async function auditLog(action: string, details: any) {
  await adminDb.collection('auditLogs').add({
    action,
    userId: locals.user.uid,
    timestamp: FieldValue.serverTimestamp(),
    ...details
  });
}
```

## Success Criteria

✅ Family members can upload photos to memorials they're invited to
✅ Owners maintain full control over their memorials
✅ Public users can view but not modify photos
✅ Security rules prevent unauthorized access
✅ File uploads are validated for type and size
✅ All actions are properly audited

## Rollback Plan

If issues arise:
1. Revert Firestore rules: `firebase deploy --only firestore:rules --project prod --token $FIREBASE_TOKEN --force`
2. Revert Storage rules: `firebase deploy --only storage:rules --project prod --token $FIREBASE_TOKEN --force`
3. Restore from backup: `gcloud firestore import gs://your-backup-bucket/[BACKUP_ID]`
4. Roll back code deployment to previous version

## Timeline

- **Day 1**: Database schema optimization
- **Day 2**: Security rules implementation
- **Day 3**: Server-side code updates
- **Day 4**: UI updates
- **Day 5**: Testing and deployment
- **Ongoing**: Monitoring and optimization

Total estimated time: 5 days of development + ongoing monitoring