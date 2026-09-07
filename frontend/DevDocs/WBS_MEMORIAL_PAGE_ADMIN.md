# WBS: Admin Panel Memorial Page - Firestore Interactions

**Document Created:** January 22, 2026  
**Routes:** 
- List: `/admin/services/memorials` → `src/routes/admin/services/memorials/+page.server.ts`
- Detail: `/admin/services/memorials/[memorialId]` → `src/routes/admin/services/memorials/[memorialId]/+page.server.ts`

> **⚠️ PARTIALLY OUTDATED (Feb 19, 2026)**  
> The following features have been **removed** from the codebase and replaced by the Block Editor system (see `WBS_BLOCK_EDITOR_SYSTEM.md`):
> - **Old Section 3.3 (Stream Creation Form)** — Deleted. Streams are now created via `MemorialBlockEditor` → `AddBlockModal` → `POST /blocks/livestream`
> - **Old Section 3.4 (Emergency Embed API)** — Deleted. API endpoints removed. Replaced by embed blocks (`type: 'embed'`)
> - **`publicNote`** — Replaced by text blocks (`type: 'text'`, `style: 'note'`)
> - **`emergencyEmbed` / `emergencyChatEmbed` / `videoFile`** — API endpoints deleted, fields no longer loaded by server
> 
> The admin detail page now uses `MemorialBlockEditor.svelte` (11 components) as the primary content management interface.  
> The detail page is now ~688 lines (was ~860 when this doc was written).

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

## 3. Component Inventory

### List Page Components

| **Component** | **Path** | **Purpose** |
|---------------|----------|-------------|
| `+page.svelte` | `src/routes/admin/services/memorials/+page.svelte` | List page shell — search, sort, pagination, inline actions |
| `AdminLayout` | `src/lib/components/admin/AdminLayout.svelte` | Shared admin sidebar + header layout |
| `DataGrid` | `src/lib/components/admin/DataGrid.svelte` | Sortable data table with column definitions |
| `BulkActionBar` | `src/lib/components/admin/BulkActionBar.svelte` | Multi-select action bar (mark paid, delete, etc.) |
| `FilterBuilder` | `src/lib/components/admin/FilterBuilder.svelte` | Dynamic filter UI for narrowing memorial list |

### Detail Page Components

| **Component** | **Path** | **Purpose** |
|---------------|----------|-------------|
| `+page.svelte` | `src/routes/admin/services/memorials/[memorialId]/+page.svelte` | Detail page shell (~688 lines) — orchestrates all sections |
| `MemorialBlockEditor` | `src/lib/components/admin/memorial-editor/MemorialBlockEditor.svelte` | Block editor for memorial content (see `WBS_BLOCK_EDITOR_SYSTEM.md` for full 11-component breakdown) |
| `CustomPricingEditor` | `src/lib/components/admin/CustomPricingEditor.svelte` | Per-memorial pricing overrides |
| `AdminScheduleEditor` | `src/lib/components/admin/AdminScheduleEditor.svelte` | Schedule & billing editor for memorial services |
| `StreamCard` | `src/lib/components/streaming/StreamCard.svelte` | Read-only stream display card (status, credentials, actions) |
| `AdminChatPanel` | `src/lib/components/admin/AdminChatPanel.svelte` | Per-stream chat moderation (see `1-22-26_CHAT_SYSTEM_WBS.md`) |

### Cross-Referenced WBS Documents

| **Area** | **Document** | **Components Covered** |
|----------|-------------|----------------------|
| Block Editor | `WBS_BLOCK_EDITOR_SYSTEM.md` | `MemorialBlockEditor`, `BlockList`, `BlockItem`, `BlockToolbar`, `AddBlockModal`, `EditEmbedModal`, `EditLivestreamModal`, `EditTextModal` + 3 block type previews |
| Chat System | `1-22-26_CHAT_SYSTEM_WBS.md` | `AdminChatPanel`, `LiveChatWidget`, `ChatModerationPanel` |

---

## 4. Admin WRITE Operations (via API Endpoints)

### 4.1 Bulk Actions API (`/api/admin/bulk-actions`)

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

### 4.2 Display Settings API (`/api/admin/memorials/[id]/display-settings`)

| **Method** | **Collection** | **Type** | **Fields Modified** |
|------------|----------------|----------|---------------------|
| GET | `memorials` | READ | (fetch `customTitle`) |
| POST | `memorials` | UPDATE | `customTitle`, `updatedAt` |
| POST | `auditLogs` | CREATE | Audit trail entry |
| DELETE | `memorials` | UPDATE | `customTitle=null`, `updatedAt` |
| DELETE | `auditLogs` | CREATE | Audit trail entry |

### 4.3 Custom Pricing API (`/api/admin/memorials/[id]/pricing`)

| **Method** | **Collection** | **Type** | **Purpose** |
|------------|----------------|----------|-------------|
| POST | `memorials` | UPDATE | Set per-memorial custom pricing overrides |

### 4.4 Force Refresh API (`/api/memorials/[memorialId]/force-refresh`)

| **Method** | **Collection** | **Type** | **Purpose** |
|------------|----------------|----------|-------------|
| POST | `memorials` | UPDATE | Set `forceRefreshAt` timestamp, triggers page reload for all viewers |

### 4.5 Block Editor APIs → See `WBS_BLOCK_EDITOR_SYSTEM.md`

| **Route** | **Methods** | **Purpose** |
|-----------|-------------|-------------|
| `/api/memorials/[memorialId]/blocks` | GET, POST | List all blocks; create text/embed block |
| `/api/memorials/[memorialId]/blocks/[blockId]` | PATCH, DELETE | Update or delete single block |
| `/api/memorials/[memorialId]/blocks/livestream` | POST | Atomically create Mux stream + livestream block |
| `/api/memorials/[memorialId]/blocks/reorder` | POST | Reorder all blocks by ID array |
| `/api/memorials/[memorialId]/embeds` | — | Per-stream embed management |

### 4.6 Slideshow APIs

| **Route** | **Methods** | **Purpose** |
|-----------|-------------|-------------|
| `/api/memorials/[memorialId]/slideshow` | GET, POST | List/create slideshows |
| `/api/memorials/[memorialId]/slideshow/[slideshowId]` | PATCH, DELETE | Update/delete individual slideshow |
| `/api/memorials/[memorialId]/slideshow-embed` | GET | Get slideshow embed data |

### 4.7 Stream Management APIs

| **Route** | **Methods** | **Purpose** |
|-----------|-------------|-------------|
| `/api/streams/[streamId]/delete` | DELETE | Delete stream document |
| `/api/streams/[streamId]/status` | PATCH | Update stream status (live/ended/etc.) |
| `/api/streams/[streamId]/title` | PATCH | Update stream title |
| `/api/streams/[streamId]/visibility` | PATCH | Toggle stream visibility |
| `/api/streams/[streamId]/schedule` | PATCH | Update scheduled start time |
| `/api/streams/[streamId]/embed` | GET | Get stream embed URL |
| `/api/streams/[streamId]/analytics` | GET | Fetch stream viewer analytics |
| `/api/streams/[streamId]/check-live` | GET | Check if stream is currently live |
| `/api/streams/[streamId]/check-status` | GET | Poll current stream status |

### 4.8 Chat APIs → See `1-22-26_CHAT_SYSTEM_WBS.md`

| **Route** | **Methods** | **Purpose** |
|-----------|-------------|-------------|
| `/api/streams/[streamId]/chat/toggle` | PATCH | Enable/disable chat |
| `/api/streams/[streamId]/chat/lock` | PATCH | Lock/unlock chat |
| `/api/streams/[streamId]/chat/messages` | GET, POST | Fetch/send chat messages |

---

## 5. Data Fields Read (List Page)

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

## 6. Data Fields Read (Detail Page)

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
| `customTitle` | string | Display settings editor |
| `contentBlocks` | array | Block editor content (see `WBS_BLOCK_EDITOR_SYSTEM.md`) |
| `contentBlocksVersion` | number | Block editor version counter |
| `calculatorConfig` | object | Payment info |
| `isPaid` | boolean | Payment status |
| `paymentStatus` | string | Payment workflow |
| `totalPrice` | number | Payment amount |
| `paymentDate` | timestamp | Payment timestamp |

---

## 7. Data Fields Read from `streams` Collection (Admin)

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

## 8. Data Fields Written (Admin Actions Summary)

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
| `updatedAt` | All updates | timestamp | (various) |

---

## 9. Audit Logging

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

## 10. Permission Model

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

## 11. Data Flow Diagram

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
│  ├─ Display Settings Editor (inline)                            │
│  ├─ MemorialBlockEditor (→ WBS_BLOCK_EDITOR_SYSTEM.md)         │
│  ├─ CustomPricingEditor                                         │
│  ├─ AdminScheduleEditor                                         │
│  ├─ StreamCard(s) + AdminChatPanel                              │
│  ├─ Slideshows                                                  │
│  ├─ Payment Info                                                │
│  └─ Force Refresh control                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
       ┌──────────┬───────────┼───────────┬──────────┐
       ▼          ▼           ▼           ▼          ▼
┌───────────┐┌───────────┐┌───────────┐┌──────────┐┌──────────┐
│ Display   ││ Block     ││ Stream    ││ Slideshow││ Chat     │
│ Settings  ││ Editor    ││ Mgmt APIs ││ APIs     ││ APIs     │
│ 4.2       ││ 4.5       ││ 4.7       ││ 4.6      ││ 4.8      │
└───────────┘└───────────┘└───────────┘└──────────┘└──────────┘
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
- Create/edit/delete content blocks via block editor
- Create streams with Mux configuration (via block editor livestream blocks)
- Create audit log entries

**Real-time Features:** None (server-rendered)
