# MUX FIX D: Admin-to-Memorial Page Synchronization

**Date:** January 22, 2026  
**Status:** Implementation  
**Priority:** HIGH - Core user experience feature

---

## Objective

Ensure that all admin actions in `/admin/services/memorials/[memorialId]` are properly reflected on the public memorial page at `/[fullSlug]` in real-time.

### Scope

| Admin Action | Expected Memorial Page Behavior |
|--------------|--------------------------------|
| **Enable/Disable Chat** | Chat widget appears/disappears from live stream |
| **Moderate Chat** | Deleted messages disappear from public chat |
| **Go Live (via OBS)** | Placeholder → Live video player with chat |
| **Stream Ends** | Live player → Recording player (after Mux processes) |

---

## Svelte 5 Best Practices Applied

Based on official Svelte MCP documentation review:

### 1. Reactive State with `$state`
```typescript
// Arrays are deeply reactive proxies - perfect for stream updates
let liveStreams = $state<Stream[]>(streams || []);

// Updates to array items trigger granular UI updates
liveStreams = liveStreams.map((s, i) => 
    i === index ? { ...s, ...updatedData } : s
);
```

### 2. Derived Values with `$derived`
```typescript
// Side-effect free computed values
let categorizedLiveStreams = $derived(
    liveStreams.filter(s => s.status === 'live')
);

let recordedStreams = $derived(
    liveStreams.filter(s => s.status === 'completed')
);
```

### 3. Effects with `$effect` (for Firestore listeners)
```typescript
// Use $effect for side effects that depend on reactive state
$effect(() => {
    if (browser && liveStreams.length > 0) {
        setupFirestoreListeners();
    }
    
    return () => {
        // Cleanup on destroy
        firestoreUnsubscribes.forEach(unsub => unsub());
    };
});
```

### 4. Props with `$props`
```typescript
interface Props {
    streams: Stream[];
    memorialName: string;
}

let { streams, memorialName }: Props = $props();
```

### 5. SvelteKit Load Function Best Practices
```typescript
// Explicit property serialization for complex objects
const stream = {
    id: doc.id,
    ...data,
    mux: data.mux || null,  // Explicit for serialization
    chat: data.chat || null
};
```

---

## Architecture Overview

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ADMIN PANEL                                       │
│  /admin/services/memorials/[memorialId]                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  StreamCard.svelte      │  AdminChatPanel.svelte                            │
│  - Arm stream           │  - Toggle chat enabled                            │
│  - View credentials     │  - Delete messages                                │
│  - Delete stream        │  - Send admin messages                            │
└─────────────┬───────────┴────────────────┬──────────────────────────────────┘
              │                            │
              │  API Calls                 │  API Calls
              ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  /api/streams/[id]/arm           │  /api/streams/[id]/chat/messages         │
│  /api/streams/[id]/chat/toggle   │  DELETE /api/streams/[id]/chat/[msgId]   │
└─────────────┬───────────────────────────────┬───────────────────────────────┘
              │                               │
              │  Writes to Firestore          │
              ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FIRESTORE                                         │
│  Collection: streams/{streamId}                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  {                                                                           │
│    status: 'scheduled' | 'ready' | 'live' | 'completed',                    │
│    mux: { playbackId, streamingStatus, vodPlaybackId, recordingReady },     │
│    chat: { enabled: boolean, archived: boolean }                            │
│  }                                                                           │
│                                                                              │
│  Collection: streams/{streamId}/messages/{messageId}                        │
│  { message, userName, deleted: boolean, createdAt }                         │
└─────────────────────────────────────────────────────────────────────────────┘
              │
              │  Real-time Listeners (onSnapshot)
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PUBLIC MEMORIAL PAGE                                 │
│  /[fullSlug]                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  MemorialStreamDisplay.svelte                                                │
│  ├── MuxVideoPlayer.svelte (live/recorded video)                            │
│  └── LiveChatWidget.svelte (real-time chat)                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Feature 1: Chat Enable/Disable Sync

### Current Status
| Component | Status | Notes |
|-----------|--------|-------|
| `AdminChatPanel.svelte` | ⚠️ Has UI, no API | `onToggleChat` prop exists but no endpoint |
| `LiveChatWidget.svelte` | ✅ Reads `enabled` prop | Shows/hides based on `stream.chat.enabled` |
| `MemorialStreamDisplay.svelte` | ✅ Passes `enabled` | `{#if stream.chat?.enabled}` conditional |
| Firestore Listener | ✅ Active | `onSnapshot` updates `liveStreams` state |

### TODO: FIX-D-1 - Create Chat Toggle API
**File:** `src/routes/api/streams/[streamId]/chat/toggle/+server.ts`

```typescript
// POST /api/streams/[streamId]/chat/toggle
// Body: { enabled: boolean }
// Updates: streams/{streamId}.chat.enabled
```

---

## Feature 2: Chat Moderation Sync

### Current Status
| Component | Status | Notes |
|-----------|--------|-------|
| `AdminChatPanel.svelte` | ✅ Works | Calls DELETE API |
| Delete API | ✅ Works | Sets `deleted: true` |
| `LiveChatWidget.svelte` | ⚠️ Uses polling | 5s interval, not real-time |

### Design Decision
Polling is acceptable (5s delay) to avoid exposing Firestore rules to anonymous users.

---

## Feature 3: Going Live Sync

### Current Status - ✅ WORKING
| Component | Status |
|-----------|--------|
| Mux Webhook Handler | ✅ Updates `status: 'live'` |
| `/[fullSlug]/+page.server.ts` | ✅ Includes `mux` property |
| `MemorialStreamDisplay.svelte` | ✅ Firestore listener active |
| `MuxVideoPlayer.svelte` | ✅ Uses `stream.mux.playbackId` |

---

## Feature 4: Recording Display Sync

### Current Status - ✅ WORKING
| Component | Status |
|-----------|--------|
| Mux Webhook Handler | ✅ Updates `mux.vodPlaybackId` |
| `MemorialStreamDisplay.svelte` | ✅ `recordedStreams` $derived |
| `MuxVideoPlayer.svelte` | ✅ Uses VOD playback ID |

---

## Implementation Plan

### Phase 1: Create Chat Toggle API ⬜
1. Create `/api/streams/[streamId]/chat/toggle/+server.ts`
2. Update Firestore `chat.enabled` field
3. Return success response

### Phase 2: Add Admin UI for Chat Toggle ⬜
1. Add toggle button to StreamCard or admin page
2. Call new API endpoint
3. Handle loading/error states

### Phase 3: Verification Testing ⬜
1. Test live stream detection
2. Test recording display
3. Test chat toggle sync
4. Test chat moderation

---

## Files Involved

### Admin Side
| File | Role |
|------|------|
| `src/routes/admin/services/memorials/[memorialId]/+page.svelte` | Admin detail |
| `src/routes/admin/services/memorials/[memorialId]/+page.server.ts` | Loads streams |
| `src/lib/components/streaming/StreamCard.svelte` | Stream management |
| `src/lib/components/admin/AdminChatPanel.svelte` | Chat moderation |

### API Layer
| File | Role |
|------|------|
| `src/routes/api/streams/[streamId]/arm/+server.ts` | Arms stream |
| `src/routes/api/streams/[streamId]/chat/messages/+server.ts` | CRUD messages |
| `src/routes/api/streams/[streamId]/chat/toggle/+server.ts` | Toggle chat (NEW) |
| `src/routes/api/webhooks/mux/+server.ts` | Mux webhook events |

### Public Side
| File | Role |
|------|------|
| `src/routes/[fullSlug]/+page.server.ts` | Loads streams with `mux` |
| `src/lib/components/MemorialStreamDisplay.svelte` | Stream display |
| `src/lib/components/streaming/MuxVideoPlayer.svelte` | Video player |
| `src/lib/components/streaming/LiveChatWidget.svelte` | Public chat |

---

## Implementation Log

### January 22, 2026

#### FIX-D-1: Chat Toggle API (Already Existed)
**File:** `src/routes/api/streams/[streamId]/chat/toggle/+server.ts`

Endpoint that toggles `chat.enabled` in Firestore stream document.
- PATCH method with `{ enabled: boolean }` body
- Requires authentication and permission check
- Updates `chat.enabled` field in Firestore

#### FIX-D-2: Chat Toggle UI Added to StreamCard
**File:** `src/lib/components/streaming/StreamCard.svelte`

Added chat toggle button to the footer actions:

```typescript
// New state variables
let chatEnabled = $state(stream.chat?.enabled ?? true);
let togglingChat = $state(false);

// Handler function
async function handleChatToggle() {
    togglingChat = true;
    const newState = !chatEnabled;
    const response = await fetch(`/api/streams/${stream.id}/chat/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newState })
    });
    if (response.ok) {
        chatEnabled = newState;
    }
    togglingChat = false;
}
```

**UI Button:**
- Green "Chat On" button with MessageCircle icon when enabled
- Gray "Chat Off" button with MessageCircleOff icon when disabled
- Only shows when `stream.mux?.playbackId` exists (armed streams)

#### FIX-D-3: Archived Chat on Recorded Streams
**File:** `src/lib/components/MemorialStreamDisplay.svelte`

Added `LiveChatWidget` to the recorded streams section with `archived={true}`:

```svelte
{#if stream.mux?.recordingReady && stream.mux?.vodPlaybackId}
    <div class="mux-stream-container">
        <div class="video-column">
            <MuxVideoPlayer stream={stream} autoplay={false} showTitle={true} />
        </div>
        
        {#if stream.chat?.enabled}
            <div class="chat-column">
                <LiveChatWidget 
                    streamId={stream.id} 
                    enabled={stream.chat.enabled}
                    archived={true}
                />
            </div>
        {/if}
    </div>
{/if}
```

**Behavior:**
- Users can **view** all chat messages from the live stream
- Users **cannot** add new messages (input form hidden)
- Shows "📼 Chat Archived" notice in header
- Admin can still toggle chat visibility and delete messages

#### Data Flow Verification

**Chat Toggle Flow:**
```
Admin clicks "Chat On/Off" button
    ↓
StreamCard.handleChatToggle() → PATCH /api/streams/[id]/chat/toggle
    ↓
API updates Firestore: streams/{id}.chat.enabled = true/false
    ↓
MemorialStreamDisplay Firestore listener receives update
    ↓
{#if stream.chat?.enabled} conditionally shows/hides LiveChatWidget
```

---

## Success Criteria

- [ ] Live streams appear on memorial page when OBS starts streaming
- [ ] Recordings appear on memorial page after stream ends
- [ ] Chat widget shows/hides based on `chat.enabled` flag
- [ ] Deleted messages disappear from public chat
- [ ] All sync happens via Firestore real-time listeners

---

## Related Documentation

- `1-22-26-mux-fix-c.md` - Mux data serialization fix
- `1-22-26-mux-fix-b.md` - RTMP credentials display fix
- `WBS_1-22-26_MUX_STREAMING_PLATFORM.md` - Master WBS
