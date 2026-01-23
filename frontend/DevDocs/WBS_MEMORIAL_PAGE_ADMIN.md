# WBS: Admin Panel Memorial Page - Firestore Interactions

**Document Created:** January 22, 2026  
**Routes:** 
- List: `/admin/services/memorials` → `src/routes/admin/services/memorials/+page.server.ts`
- Detail: `/admin/services/memorials/[memorialId]` → `src/routes/admin/services/memorials/[memorialId]/+page.server.ts`

---

## 1. List Page Server Load (READ Operations)

| **Task ID** | **Operation** | **Collection** | **Type** | **Purpose** |
|-------------|---------------|----------------|----------|-------------|
| **1.1** | Query with sort | `memorials` | READ | Load all memorials paginated |
| **1.2** | Filter `isDeleted !== true` | (in-memory) | FILTER | Exclude soft-deleted |
| **1.3** | In-memory search | (in-memory) | FILTER | Search by name/slug/email/location |

### Code Reference

```typescript
// 1.1 - Query memorials with sorting
let query = adminDb.collection('memorials')
    .orderBy(sortBy, sortDir)
    .limit(limit);
snapshot = await query.get();

// 1.2 - Filter deleted memorials
const rawMemorials = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return !data.isDeleted;
});

// 1.3 - In-memory search
const memorials = searchQuery
    ? rawMemorials.filter((memorial) => {
        const haystack = [
            memorial.lovedOneName,
            memorial.fullSlug,
            memorial.creatorEmail,
            memorial.creatorName,
            memorial.location
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(searchQuery);
    })
    : rawMemorials;
```

---

## 2. Detail Page Server Load (READ Operations - Parallel)

| **Task ID** | **Operation** | **Collection** | **Type** | **Purpose** |
|-------------|---------------|----------------|----------|-------------|
| **2.1** | Get by doc ID | `memorials/{id}` | READ | Load single memorial |
| **2.2** | Query by `memorialId` | `streams` | READ | Load all streams |
| **2.3** | Get subcollection | `memorials/{id}/slideshows` | READ | Load slideshows |
| **2.4** | Get subcollection | `memorials/{id}/followers` | READ | Get follower count |

### Code Reference

```typescript
// Parallel loading for performance
const [memorialDoc, streamsSnap, slideshowsSnap, followersSnap] = await Promise.all([
    adminDb.collection('memorials').doc(memorialId).get(),
    adminDb.collection('streams')
        .where('memorialId', '==', memorialId)
        .get(),
    adminDb.collection('memorials').doc(memorialId).collection('slideshows').get(),
    adminDb.collection('memorials').doc(memorialId).collection('followers').get()
]);

// Follower count
const followerCount = followersSnap.size;
```

---

## 3. Admin WRITE Operations (via API Endpoints)

### 3.1 Bulk Actions API (`/api/admin/bulk-actions`)

| **Action** | **Collection** | **Type** | **Fields Modified** |
|------------|----------------|----------|---------------------|
| `markPaid` | `memorials` | UPDATE | `isPaid`, `paidAt`, `manualPayment.markedPaidBy`, `manualPayment.markedPaidAt`, `manualPayment.method` |
| `markUnpaid` | `memorials` | UPDATE | `isPaid=false`, `paidAt=null`, `manualPayment=null` |
| `makePublic` | `memorials` | UPDATE | `isPublic=true` |
| `makePrivate` | `memorials` | UPDATE | `isPublic=false` |
| `delete` | `memorials` | UPDATE | `isDeleted=true`, `deletedAt`, `deletedBy` |
| (all actions) | `admin_audit_logs` | CREATE | Audit log entry |

### Code Reference

```typescript
// Mark as paid
await adminDb.collection('memorials').doc(id).update({
    isPaid: true,
    paidAt: new Date(),
    'manualPayment.markedPaidBy': user.email,
    'manualPayment.markedPaidAt': new Date(),
    'manualPayment.method': params?.method || 'manual'
});

// Soft delete
await adminDb.collection('memorials').doc(id).update({
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: user.uid
});

// Audit log
await adminDb.collection('admin_audit_logs').add({
    adminId: user.uid,
    action: `bulk_${action}`,
    resourceType,
    resourceIds: ids,
    results,
    timestamp: new Date()
});
```

### 3.2 Display Settings API (`/api/admin/memorials/[id]/display-settings`)

| **Method** | **Collection** | **Type** | **Fields Modified** |
|------------|----------------|----------|---------------------|
| GET | `memorials` | READ | (fetch `customTitle`, `publicNote`) |
| POST | `memorials` | UPDATE | `customTitle`, `publicNote`, `updatedAt` |
| POST | `auditLogs` | CREATE | Audit trail entry |
| DELETE | `memorials` | UPDATE | `customTitle=null`, `publicNote=null`, `updatedAt` |
| DELETE | `auditLogs` | CREATE | Audit trail entry |

### Code Reference

```typescript
// Update display settings
await adminDb.collection('memorials').doc(memorialId).update({
    customTitle: customTitle || null,
    publicNote: publicNote || null,
    updatedAt: new Date()
});

// Audit trail
await adminDb.collection('auditLogs').add({
    action: 'UPDATE_DISPLAY_SETTINGS',
    performedBy: locals.user.uid,
    performedByEmail: locals.user.email,
    targetId: memorialId,
    targetType: 'memorial',
    changes: { customTitle, publicNote },
    timestamp: new Date()
});
```

### 3.3 Stream Creation API (`/api/memorials/[memorialId]/streams`)

| **Method** | **Collection** | **Type** | **Purpose** |
|------------|----------------|----------|-------------|
| GET | `memorials` | READ | Verify memorial exists |
| GET | `streams` | READ | Fetch streams for memorial |
| POST | `memorials` | READ | Verify memorial + permissions |
| POST | `streams` | CREATE | Create new stream with Mux config |

### Code Reference

```typescript
// Create stream document
const streamData = {
    title: title.trim(),
    description: description?.trim() || '',
    memorialId,
    status: scheduledStartTime ? 'scheduled' : 'ready',
    visibility: 'public',
    
    // Mux Platform Configuration
    mux: {
        liveStreamId: muxLiveStream.id,
        playbackId: muxLiveStream.playbackId,
        rtmpUrl: muxLiveStream.rtmpUrl,
        streamKey: muxLiveStream.streamKey,
        recordingReady: false,
        streamingStatus: 'idle',
        reconnectWindow: 60
    },
    
    // Chat Configuration
    chat: {
        enabled: true,
        archived: false,
        messageCount: 0,
        participantCount: 0,
        moderationMode: 'manual'
    },
    
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isVisible: true
};

const streamRef = await adminDb.collection('streams').add(streamData);
```

### 3.4 Emergency Embed API (`/api/memorials/[memorialId]/emergency-embed`)

| **Method** | **Collection** | **Type** | **Fields Modified** |
|------------|----------------|----------|---------------------|
| POST | `memorials` | UPDATE | `emergencyEmbed` object |
| DELETE | `memorials` | UPDATE | `emergencyEmbed=null` |

### 3.5 Stream Delete API (`/api/streams/[streamId]/delete`)

| **Method** | **Collection** | **Type** | **Purpose** |
|------------|----------------|----------|-------------|
| DELETE | `streams` | UPDATE/DELETE | Delete stream document |

---

## 4. Data Fields Read (List Page)

| **Field** | **Type** | **Used For** |
|-----------|----------|--------------|
| `id` | string | Document ID, navigation |
| `lovedOneName` | string | Display name |
| `customTitle` | string | Display override |
| `fullSlug` | string | URL slug |
| `creatorEmail` | string | Owner email |
| `creatorName` | string | Owner name |
| `createdAt` | timestamp | Creation date column |
| `isPublic` | boolean | Visibility badge |
| `isComplete` | boolean | Completion badge |
| `isPaid` | boolean | Payment badge |
| `services.main.time` | object | Service date extraction |
| `services.main.location` | object | Location extraction |
| `services.additional` | array | Additional locations |
| `calculatorConfig.totalPrice` | number | Payment amount |

---

## 5. Data Fields Read (Detail Page)

| **Field** | **Type** | **Used For** |
|-----------|----------|--------------|
| `id` | string | Document ID |
| `lovedOneName` | string | Page title |
| `fullSlug` | string | Public URL link |
| `createdBy` | string | Creator reference |
| `ownerUid` | string | Owner link to user detail |
| `creatorEmail` | string | Display, navigation |
| `creatorName` | string | Display |
| `createdAt` | timestamp | Creation date |
| `updatedAt` | timestamp | Last update |
| `isPublic` | boolean | Status badge |
| `isComplete` | boolean | Status badge |
| `services` | object | Service details |
| `memorialDate` | string | Legacy field |
| `memorialTime` | string | Legacy field |
| `memorialLocationName` | string | Legacy field |
| `memorialLocationAddress` | string | Legacy field |
| `livestream` | object | Legacy streaming config |
| `emergencyEmbed` | object | Emergency override display |
| `customTitle` | string | Display settings editor |
| `publicNote` | string | Display settings editor |
| `calculatorConfig` | object | Payment info |
| `isPaid` | boolean | Payment status |
| `paymentStatus` | string | Payment workflow |
| `totalPrice` | number | Payment amount |
| `paymentDate` | timestamp | Payment timestamp |

---

## 6. Data Fields Read from `streams` Collection (Admin)

| **Field** | **Type** | **Used For** |
|-----------|----------|--------------|
| `id` | string | Document ID |
| `memorialId` | string | Relationship |
| `title` | string | Stream card display |
| `description` | string | Stream card display |
| `status` | string | Status display |
| `visibility` | string | Visibility setting |
| `scheduledStartTime` | timestamp | Schedule display |
| `startedAt` | timestamp | Timing info |
| `endedAt` | timestamp | Timing info |
| `liveStartedAt` | timestamp | Live timing |
| `liveEndedAt` | timestamp | Live timing |
| `streamCredentials` | object | Legacy credentials |
| `mux` | object | Mux platform config |
| `chat` | object | Chat configuration |
| `streamingMethod` | string | Legacy field |
| `cloudflareStreamId` | string | Legacy field |
| `rtmpUrl` | string | Legacy field |
| `streamKey` | string | Legacy field |
| `playbackUrl` | string | Legacy field |
| `embedUrl` | string | Legacy field |
| `phoneSourceStreamId` | string | Dual stream |
| `phoneSourcePlaybackUrl` | string | Dual stream |
| `phoneSourceWhipUrl` | string | Dual stream |
| `recordingReady` | boolean | Recording status |
| `recordingUrl` | string | Recording playback |
| `recordingPlaybackUrl` | string | Recording playback |
| `recordingDuration` | number | Recording length |
| `viewerCount` | number | Analytics |
| `peakViewerCount` | number | Analytics |
| `totalViews` | number | Analytics |
| `calculatorServiceType` | string | Calculator linking |
| `calculatorServiceIndex` | number | Calculator linking |
| `createdAt` | timestamp | Metadata |
| `updatedAt` | timestamp | Metadata |

---

## 7. Data Fields Written (Admin Actions Summary)

| **Field** | **Action** | **Value Type** | **API Endpoint** |
|-----------|------------|----------------|------------------|
| `isPaid` | Mark Paid/Unpaid | boolean | `/api/admin/bulk-actions` |
| `paidAt` | Mark Paid | timestamp | `/api/admin/bulk-actions` |
| `manualPayment.markedPaidBy` | Mark Paid | string | `/api/admin/bulk-actions` |
| `manualPayment.markedPaidAt` | Mark Paid | timestamp | `/api/admin/bulk-actions` |
| `manualPayment.method` | Mark Paid | string | `/api/admin/bulk-actions` |
| `isPublic` | Toggle Visibility | boolean | `/api/admin/bulk-actions` |
| `isDeleted` | Soft Delete | boolean | `/api/admin/bulk-actions` |
| `deletedAt` | Soft Delete | timestamp | `/api/admin/bulk-actions` |
| `deletedBy` | Soft Delete | string | `/api/admin/bulk-actions` |
| `customTitle` | Display Settings | string | `/api/admin/memorials/[id]/display-settings` |
| `publicNote` | Display Settings | string | `/api/admin/memorials/[id]/display-settings` |
| `emergencyEmbed` | Emergency Override | object | `/api/memorials/[id]/emergency-embed` |
| `updatedAt` | All updates | timestamp | (various) |

---

## 8. Audit Logging

### `admin_audit_logs` Collection (Bulk Actions)

| **Field** | **Type** | **Description** |
|-----------|----------|-----------------|
| `adminId` | string | Admin user UID |
| `action` | string | `bulk_{action}` |
| `resourceType` | string | `memorial` |
| `resourceIds` | array | IDs affected |
| `results` | object | Success/failed arrays |
| `timestamp` | timestamp | Action time |

### `auditLogs` Collection (Display Settings)

| **Field** | **Type** | **Description** |
|-----------|----------|-----------------|
| `action` | string | `UPDATE_DISPLAY_SETTINGS` or `DELETE_DISPLAY_SETTINGS` |
| `performedBy` | string | Admin user UID |
| `performedByEmail` | string | Admin email |
| `targetId` | string | Memorial ID |
| `targetType` | string | `memorial` |
| `changes` | object | Changed fields |
| `timestamp` | timestamp | Action time |

---

## 9. Permission Model

```typescript
// All admin routes require admin role
if (!locals.user || locals.user.role !== 'admin') {
    throw redirect(302, '/admin');
}

// Bulk actions check granular permissions
const hasPermission = hasPermission(userWithRole, resourceType, requiredAction);
```

### Permission Mapping

| **Action** | **Required Permission** |
|------------|------------------------|
| `markPaid` | `memorial:update` |
| `markUnpaid` | `memorial:update` |
| `makePublic` | `memorial:update` |
| `makePrivate` | `memorial:update` |
| `delete` | `memorial:delete` |
| `export` | `memorial:read` |

---

## 10. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN MEMORIAL LIST                           │
│               /admin/services/memorials                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    +page.server.ts                               │
│                                                                  │
│  1. Verify admin role                                           │
│  2. Query memorials with sort/limit                             │
│  3. Filter deleted, search in-memory                            │
│  4. Return paginated list                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    +page.svelte                                  │
│                                                                  │
│  - Render DataGrid with columns                                 │
│  - Handle row clicks → navigate to detail                       │
│  - Handle inline actions (toggle payment/visibility)            │
│  - Handle bulk selections + BulkActionBar                       │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────────────┐
│  Row Click              │    │  Bulk/Inline Action             │
│  → Detail Page          │    │  → /api/admin/bulk-actions      │
└─────────────────────────┘    └─────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN MEMORIAL DETAIL                         │
│          /admin/services/memorials/[memorialId]                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    +page.server.ts                               │
│                                                                  │
│  Parallel Load:                                                  │
│  ├─ memorials/{id}                                              │
│  ├─ streams (where memorialId)                                  │
│  ├─ memorials/{id}/slideshows                                   │
│  └─ memorials/{id}/followers                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    +page.svelte                                  │
│                                                                  │
│  Sections:                                                       │
│  ├─ Basic Info Card                                             │
│  ├─ Display Settings Editor                                     │
│  ├─ Custom Pricing Editor                                       │
│  ├─ Livestreams (StreamCard components)                         │
│  ├─ Chat Moderation (AdminChatPanel)                            │
│  ├─ Slideshows                                                  │
│  ├─ Payment Info                                                │
│  └─ Analytics                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Display Settings│ │ Create Stream   │ │ Emergency Embed │
│ POST/DELETE     │ │ POST            │ │ POST/DELETE     │
│ /api/admin/     │ │ /api/memorials/ │ │ /api/memorials/ │
│ memorials/[id]/ │ │ [id]/streams    │ │ [id]/emergency- │
│ display-settings│ │                 │ │ embed           │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Summary

**Total Firestore Collections Accessed:** 5
- `memorials` (READ + UPDATE)
- `streams` (READ + CREATE + UPDATE)
- `memorials/{id}/slideshows` (READ)
- `memorials/{id}/followers` (READ)
- `admin_audit_logs` / `auditLogs` (CREATE)

**Write Operations:** 
- Update memorial fields (payment, visibility, display settings, soft delete)
- Create streams with Mux configuration
- Create audit log entries

**Real-time Features:** None (server-rendered)
