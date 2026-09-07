# WBS: Memorial Page (Public-Facing) - Firestore Interactions

**Document Created:** January 22, 2026  
**Route:** `/[fullSlug]` → `src/routes/[fullSlug]/+page.server.ts`

> **⚠️ PARTIALLY OUTDATED (Feb 17, 2026)**  
> The following features described in this document have been **removed** and replaced by the Block Editor system (see `WBS_BLOCK_EDITOR_SYSTEM.md`):
> - `emergencyEmbed` — replaced by embed blocks (`type: 'embed'`, `embedType: 'video'`)
> - `emergencyChatEmbed` — replaced by embed blocks (`type: 'embed'`, `embedType: 'chat'`)
> - `publicNote` — replaced by text blocks (`type: 'text'`, `style: 'note'`)
> 
> These fields are no longer loaded by the server or rendered by `MemorialStreamDisplay.svelte`.  
> The public page now uses `BlockRenderer.svelte` for content when `contentBlocks` are present.

---

## 1. Server Load Function (READ Operations)

| **Task ID** | **Operation** | **Collection** | **Type** | **Purpose** |
|-------------|---------------|----------------|----------|-------------|
| **1.1** | Query by `fullSlug` | `memorials` | READ | Find memorial document by slug |
| **1.2** | Query by `memorialId` | `streams` | READ | Load all streams for memorial |
| **1.3** | Filter `isDeleted !== true` | (in-memory) | FILTER | Exclude soft-deleted streams |
| **1.4** | Filter `isVisible !== false` | (in-memory) | FILTER | Exclude hidden streams |
| **1.5** | Query subcollection | `memorials/{id}/slideshows` | READ | Load slideshows ordered by `createdAt` |

### Code Reference

```typescript
// 1.1 - Query memorial by fullSlug
const memorialsRef = adminDb.collection('memorials');
const snapshot = await memorialsRef.where('fullSlug', '==', fullSlug).limit(1).get();

// 1.2 - Query streams for memorial
const streamsSnapshot = await adminDb
    .collection('streams')
    .where('memorialId', '==', memorial.id)
    .get();

// 1.3 & 1.4 - Filter streams in memory
streams = streamsSnapshot.docs
    .filter(doc => doc.data().isDeleted !== true)
    .filter(stream => stream.isVisible !== false);

// 1.5 - Query slideshows subcollection
const slideshowsSnapshot = await adminDb
    .collection('memorials')
    .doc(memorial.id)
    .collection('slideshows')
    .orderBy('createdAt', 'desc')
    .get();
```

---

## 2. Component Inventory

| **Component** | **Path** | **Purpose** |
|---------------|----------|-------------|
| `+page.svelte` | `src/routes/[fullSlug]/+page.svelte` | Page shell — layout, OG meta tags, permission gating |
| `MemorialStreamDisplay` | `src/lib/components/MemorialStreamDisplay.svelte` | Categorizes streams (live/scheduled/recorded), sets up real-time Firestore listeners |
| `CountdownVideoPlayer` | `src/lib/components/CountdownVideoPlayer.svelte` | Styled video placeholder showing scheduled date/time for upcoming livestreams |
| `BlockRenderer` | `src/lib/components/memorial/BlockRenderer.svelte` | Routes `contentBlocks` to the correct renderer (livestream → `MemorialStreamDisplay`, embed → `EmbedRenderer`, text → `TextRenderer`) |
| `EmbedRenderer` | `src/lib/components/memorial/EmbedRenderer.svelte` | Renders embed blocks (video/chat iframes) with sanitization |
| `TextRenderer` | `src/lib/components/memorial/TextRenderer.svelte` | Renders text blocks with custom styling (font color, size, line height, alignment). Defaults: white text, 2rem headings, 1.125rem paragraphs. Inline style overrides from `TextConfig`. |
| `BookingReminderBanner` | `src/lib/components/BookingReminderBanner.svelte` | Displays booking reminder banner to memorial owners |
| `SlideshowSection` | `src/lib/components/SlideshowSection.svelte` | Renders photo slideshows |
| `MuxVideoPlayer` | `src/lib/components/streaming/MuxVideoPlayer.svelte` | Mux HLS video player for live and recorded streams |
| `LiveChatWidget` | `src/lib/components/streaming/LiveChatWidget.svelte` | Real-time chat widget alongside streams |

---

## 3. Client-Side Real-Time Listeners

Located in: `src/lib/components/MemorialStreamDisplay.svelte`

| **Task ID** | **Operation** | **Collection** | **Type** | **Purpose** |
|-------------|---------------|----------------|----------|-------------|
| **2.1** | `onSnapshot()` listener | `streams/{streamId}` | REALTIME | Subscribe to stream status updates |
| **2.2** | Firestore SDK import | `$lib/firebase` | CLIENT | Dynamic import for browser |

### Code Reference

```typescript
// Dynamic import to avoid SSR issues
const { db } = await import('$lib/firebase');
const { doc, onSnapshot } = await import('firebase/firestore');

// Subscribe to real-time updates for each stream
const streamDocRef = doc(db, 'streams', stream.id);
const unsubscribe = onSnapshot(streamDocRef, (snapshot) => {
    if (snapshot.exists()) {
        const updatedData = snapshot.data();
        // Update local state with new stream data
    }
});
```

---

## 3. Data Fields Read from `memorials` Collection

| **Field** | **Type** | **Used For** |
|-----------|----------|--------------|
| `id` | string | Document ID |
| `lovedOneName` | string | Page title, display name |
| `fullSlug` | string | URL matching, sharing |
| `content` | string | Memorial description |
| `isPublic` | boolean | Permission check |
| `services` | object | Service schedule display |
| `imageUrl` | string | Hero image |
| `birthDate` | string | Date display |
| `deathDate` | string | Date display |
| `photos` | array | Media content |
| `embeds` | array | Embedded content |
| `familyContactName` | string | Contact info |
| `familyContactEmail` | string | Contact info |
| `familyContactPhone` | string | Contact info |
| `familyContactPreference` | string | Contact preference |
| `funeralHomeName` | string | Funeral home info |
| `directorFullName` | string | Director info |
| `directorEmail` | string | Director contact |
| `additionalNotes` | string | Notes |
| `custom_html` | string | Legacy memorial content |
| `hasCustomHtml` | boolean | Layout type flag |
| `emergencyEmbed` | object | Override embed display |
| `customTitle` | string | Admin display override |
| `publicNote` | string | Admin public note |
| `ownerUid` | string | Permission check |
| `funeralDirectorUid` | string | Permission check |
| `createdByUserId` | string | Creator reference |
| `createdAt` | timestamp | Timestamp display |
| `updatedAt` | timestamp | Timestamp display |

---

## 4. Data Fields Read from `streams` Collection

| **Field** | **Type** | **Used For** |
|-----------|----------|--------------|
| `id` | string | Document ID |
| `title` | string | Stream title display |
| `description` | string | Stream description |
| `status` | string | Live/scheduled/completed categorization |
| `memorialId` | string | Relationship to memorial |
| `scheduledStartTime` | timestamp | Countdown timer |
| `startedAt` | timestamp | Stream timing |
| `endedAt` | timestamp | Stream timing |
| `isVisible` | boolean | Visibility filter |
| `recordingReady` | boolean | Recording availability |
| `playbackUrl` | string | Legacy Cloudflare fallback |
| `embedUrl` | string | Legacy Cloudflare fallback |
| `cloudflareInputId` | string | Legacy identifier |
| `cloudflareStreamId` | string | Legacy identifier |
| `liveWatchUrl` | string | Live playback URL |
| `hlsUrl` | string | HLS playback |
| `dashUrl` | string | DASH playback |

### Mux Platform Fields (`mux` object)

| **Field** | **Type** | **Used For** |
|-----------|----------|--------------|
| `mux.liveStreamId` | string | Mux stream identifier |
| `mux.playbackId` | string | Mux playback identifier |
| `mux.rtmpUrl` | string | RTMP ingest URL |
| `mux.streamKey` | string | Stream authentication |
| `mux.streamingStatus` | string | `idle` / `active` / `disconnected` |
| `mux.assetId` | string | Recording asset ID |
| `mux.vodPlaybackId` | string | Recording playback |
| `mux.recordingReady` | boolean | Recording availability |
| `mux.duration` | number | Recording length |

### Chat Configuration (`chat` object)

| **Field** | **Type** | **Used For** |
|-----------|----------|--------------|
| `chat.enabled` | boolean | Show/hide chat widget |
| `chat.archived` | boolean | Live vs archived chat mode |

---

## 5. Data Fields Read from `slideshows` Subcollection

| **Field** | **Type** | **Used For** |
|-----------|----------|--------------|
| `id` | string | Document ID |
| `title` | string | Slideshow title |
| `memorialId` | string | Parent memorial |
| `cloudflareStreamId` | string | Video hosting ID |
| `firebaseStoragePath` | string | Storage path |
| `embedUrl` | string | Embed URL |
| `playbackUrl` | string | Video playback |
| `thumbnailUrl` | string | Preview image |
| `status` | string | Processing status |
| `isCloudflareHosted` | boolean | Hosting location |
| `isFirebaseHosted` | boolean | Hosting location |
| `photos` | array | Photo list |
| `settings` | object | Slideshow settings |
| `createdBy` | string | Creator UID |
| `createdAt` | timestamp | Creation time |
| `updatedAt` | timestamp | Update time |

---

## 6. Permission Logic

```typescript
const hasPermission = 
    memorial.isPublic === true || 
    userRole === 'admin' ||
    memorialData.ownerUid === userId ||
    memorialData.funeralDirectorUid === userId;
```

### Permission Outcomes

| **Condition** | **Result** |
|---------------|------------|
| `isPublic = true` | Full data returned |
| `userRole = 'admin'` | Full data returned |
| `ownerUid = userId` | Full data returned |
| `funeralDirectorUid = userId` | Full data returned |
| None of above | Limited data returned (no streams, no slideshows) |

---

## 7. Error Handling

| **Error Code** | **Condition** | **Response** |
|----------------|---------------|--------------|
| 404 | `fullSlug` contains `.` or starts with `_` | "Not a memorial page" |
| 404 | No memorial found for `fullSlug` | "Memorial not found" |
| 500 | Firebase `permission-denied` | "Database access denied" |
| 500 | Firebase `unavailable` | "Database temporarily unavailable" |
| 500 | Other errors | "Failed to load memorial: {message}" |

---

## 8. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PUBLIC MEMORIAL PAGE                          │
│                     /[fullSlug]                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    +page.server.ts (SSR)                         │
│                                                                  │
│  1. Query memorials.where('fullSlug', '==', slug)               │
│  2. Check permissions                                            │
│  3. Query streams.where('memorialId', '==', id)                 │
│  4. Query memorials/{id}/slideshows                             │
│  5. Return serialized data                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    +page.svelte (Client)                         │
│                                                                  │
│  - Display memorial info                                         │
│  - Render BlockRenderer (if contentBlocks present)               │
│  - Render MemorialStreamDisplay (via BlockRenderer or direct)    │
│  - Render SlideshowSection component                            │
│  - Render BookingReminderBanner (if owner)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
          ┌──────────┐ ┌──────────┐ ┌──────────┐
          │BlockRend.│ │Slideshow │ │Booking   │
          │          │ │Section   │ │Reminder  │
          └────┬─────┘ └──────────┘ └──────────┘
               │
       ┌───────┼───────┐
       ▼       ▼       ▼
┌──────────┐┌──────┐┌──────┐
│ Memorial ││Embed ││Text  │
│ Stream   ││Rend. ││Rend. │
│ Display  │└──────┘└──────┘
└────┬─────┘
     │
     ├─── MuxVideoPlayer (live/recorded)
     ├─── CountdownVideoPlayer (scheduled)
     └─── LiveChatWidget (if chat.enabled)
```

---

## Summary

**Total Firestore Collections Accessed:** 3
- `memorials` (READ)
- `streams` (READ + REALTIME)
- `memorials/{id}/slideshows` (READ)

**Write Operations:** None (read-only page)

**Real-time Features:** Stream status updates via `onSnapshot()`
