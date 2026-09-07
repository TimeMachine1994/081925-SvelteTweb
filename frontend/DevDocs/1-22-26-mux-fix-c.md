# MUX FIX C: Memorial Page Live Stream & Recording Display

**Date:** January 22, 2026  
**Status:** Ready for Implementation  
**Priority:** HIGH - Core viewer-facing feature

---

## Problem Summary

When an admin starts streaming via OBS to Mux, the memorial page should:
1. **Detect the stream is live** and replace the placeholder with the live Mux video player
2. **When the stream ends**, show the recording in place of the live stream

Currently, this does not happen because the `mux` data object is not being properly passed from the server to the client components.

---

## Architecture Overview

### Data Flow (Current vs Expected)

```
CURRENT (BROKEN):
┌─────────────────┐    ┌───────────────────┐    ┌─────────────────────────┐
│ Firestore       │ -> │ page.server.ts    │ -> │ MemorialStreamDisplay   │
│ stream.mux = {} │    │ ...data spread    │    │ stream.mux = undefined  │
│                 │    │ (mux not explicit)│    │ (can't show player!)    │
└─────────────────┘    └───────────────────┘    └─────────────────────────┘

EXPECTED (FIXED):
┌─────────────────┐    ┌───────────────────┐    ┌─────────────────────────┐
│ Firestore       │ -> │ page.server.ts    │ -> │ MemorialStreamDisplay   │
│ stream.mux = {} │    │ mux: data.mux     │    │ stream.mux = {...}      │
│                 │    │ (explicit!)       │    │ (shows MuxVideoPlayer!) │
└─────────────────┘    └───────────────────┘    └─────────────────────────┘
```

### Components Involved

| Component | Location | Role |
|-----------|----------|------|
| **Page Server Load** | `src/routes/[fullSlug]/+page.server.ts` | Fetches streams from Firestore |
| **MemorialStreamDisplay** | `src/lib/components/MemorialStreamDisplay.svelte` | Categorizes & displays streams |
| **MuxVideoPlayer** | `src/lib/components/streaming/MuxVideoPlayer.svelte` | Renders Mux HLS player |
| **Mux Webhook Handler** | `src/routes/api/webhooks/mux/+server.ts` | Updates Firestore on events |

---

## Root Cause Analysis

### Issue 1: Missing `mux` Property in Page Load

**File:** `src/routes/[fullSlug]/+page.server.ts`

The current code uses spread operator which should include `mux`, but SvelteKit's data serialization may not properly handle nested objects:

```typescript
// Current (lines 106-117)
streams = streamsSnapshot.docs
    .map(doc => {
        const data = doc.data();
        const stream = {
            id: doc.id,
            ...data,  // ⚠️ May not properly serialize `mux` object
            createdAt: convertTimestamp(data.createdAt),
            // ...
        };
        return stream;
    })
```

**Fix:** Explicitly include `mux` property:

```typescript
const stream = {
    id: doc.id,
    ...data,
    // Explicit Mux data serialization
    mux: data.mux || null,
    chat: data.chat || null,
    // ...timestamps
};
```

### Issue 2: Missing TypeScript Interface

**File:** `src/lib/components/MemorialStreamDisplay.svelte`

The `Stream` interface doesn't include the `mux` type, which can cause TypeScript issues and unclear expectations:

```typescript
// Current interface (lines 10-36)
interface Stream {
    id: string;
    title: string;
    // ... but no `mux` property!
}
```

**Fix:** Add complete `mux` and `chat` types based on Svelte 5 best practices:

```typescript
interface Stream {
    id: string;
    title: string;
    description?: string;
    status: string;
    scheduledStartTime?: string;
    // ... existing fields ...
    
    // Mux platform data (NEW)
    mux?: {
        liveStreamId: string;
        playbackId: string;
        rtmpUrl: string;
        streamKey: string;
        streamingStatus?: 'idle' | 'active' | 'disconnected';
        assetId?: string;
        vodPlaybackId?: string;
        recordingReady?: boolean;
        duration?: number;
    };
    
    // Chat configuration (NEW)
    chat?: {
        enabled: boolean;
        archived: boolean;
    };
}
```

---

## Implementation Steps

### Step 1: Update `/[fullSlug]/+page.server.ts`

Add explicit `mux` and `chat` properties to ensure proper serialization.

**Location:** Around line 109, in the stream mapping

**Before:**
```typescript
const stream = {
    id: doc.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    scheduledStartTime: convertTimestamp(data.scheduledStartTime),
    startedAt: convertTimestamp(data.startedAt),
    endedAt: convertTimestamp(data.endedAt)
};
```

**After:**
```typescript
const stream = {
    id: doc.id,
    ...data,
    // Mux streaming platform data (explicit for serialization)
    mux: data.mux || null,
    chat: data.chat || null,
    // Timestamp conversions
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    scheduledStartTime: convertTimestamp(data.scheduledStartTime),
    startedAt: convertTimestamp(data.startedAt),
    endedAt: convertTimestamp(data.endedAt)
};
```

### Step 2: Update `MemorialStreamDisplay.svelte` Interface

Update the Stream interface to include Mux types.

**Location:** Lines 10-36

**Add these properties to the existing interface:**
```typescript
// Mux platform data
mux?: {
    liveStreamId: string;
    playbackId: string;
    rtmpUrl: string;
    streamKey: string;
    streamingStatus?: 'idle' | 'active' | 'disconnected';
    assetId?: string;
    vodPlaybackId?: string;
    recordingReady?: boolean;
    duration?: number;
};

// Chat configuration
chat?: {
    enabled: boolean;
    archived: boolean;
};
```

### Step 3: Verify Component Logic

The existing logic in `MemorialStreamDisplay.svelte` already handles Mux streams correctly:

**Live Stream Display (line 256):**
```svelte
{#if stream.mux?.playbackId}
    <!-- MUX PLATFORM - New integrated player with chat -->
    <MuxVideoPlayer stream={stream} autoplay={true} showTitle={true} />
{:else}
    <!-- LEGACY CLOUDFLARE - Fallback iframe player -->
```

**Recording Display (line 333):**
```svelte
{#if stream.mux?.recordingReady && stream.mux?.vodPlaybackId}
    <!-- MUX PLATFORM - Recorded video player -->
    <MuxVideoPlayer stream={stream} autoplay={false} showTitle={true} />
```

### Step 4: Verify MuxVideoPlayer Logic

The `MuxVideoPlayer.svelte` component already correctly determines playback IDs:

```typescript
// Playback ID determination (line 39-58)
const playbackId = $derived(() => {
    if (!stream.mux) return null;
    
    // For completed streams with recording ready, use VOD playback ID
    if (stream.status === 'completed' && stream.mux.vodPlaybackId) {
        return stream.mux.vodPlaybackId;
    }
    
    // For live or scheduled streams, use live playback ID
    return stream.mux.playbackId;
});
```

### Step 5: Verify Webhook Updates

The Mux webhook handler already updates the correct fields:

**Stream goes live (`video.live_stream.active`):**
```typescript
await streamDoc.ref.update({
    status: 'live',
    'mux.streamingStatus': 'active',
    liveStartedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
});
```

**Recording ready (`video.asset.ready`):**
```typescript
await streamDoc.ref.update({
    status: 'completed',
    'mux.assetId': assetId,
    'mux.vodPlaybackId': playbackId,
    'mux.recordingReady': true,
    'mux.duration': duration,
    'chat.archived': true,
    recordingReady: true,
    updatedAt: new Date().toISOString()
});
```

---

## Svelte 5 Best Practices Applied

Based on Svelte MCP documentation review:

### 1. Proper TypeScript Interfaces
- Defined explicit types for `mux` and `chat` objects
- Used optional chaining (`?.`) consistently

### 2. Reactive State with `$state`
```typescript
// MemorialStreamDisplay uses $state for real-time updates
let liveStreams = $state<Stream[]>(streams || []);
```

### 3. Derived Values with `$derived`
```typescript
// Categorization logic uses $derived for automatic updates
let categorizedLiveStreams = $derived(
    liveStreams.filter(s => s.status === 'live')
);
```

### 4. Server Load Best Practices
- Explicit property serialization for complex objects
- Timestamp conversion for Firestore data
- Proper error handling with fallbacks

---

## Testing Checklist

### Pre-Implementation Verification
- [ ] Confirm `mux` data exists in Firestore after arming a stream
- [ ] Confirm webhook handler is deployed and receiving events

### Post-Implementation Testing

#### Test 1: Live Stream Detection
1. Arm a stream for "Stream Key"
2. Copy RTMP URL and Stream Key to OBS
3. Start streaming from OBS
4. Open memorial page in browser
5. **Expected:** Live video appears with "LIVE" badge

#### Test 2: Recording Playback
1. Stop the OBS stream
2. Wait 1-2 minutes for Mux to process recording
3. Refresh memorial page
4. **Expected:** Recording appears with "RECORDED" badge

#### Test 3: Placeholder Behavior
1. Create a new memorial with no streams armed
2. Open memorial page
3. **Expected:** Stock placeholder appears with "LIVESTREAM UPCOMING" message

#### Test 4: Real-Time Updates
1. Open memorial page in browser
2. In another tab, arm a stream and start streaming
3. **Expected:** Memorial page updates automatically via Firestore listener

---

## Files to Modify

| File | Change |
|------|--------|
| `src/routes/[fullSlug]/+page.server.ts` | Add `mux: data.mux \|\| null` and `chat: data.chat \|\| null` |
| `src/lib/components/MemorialStreamDisplay.svelte` | Add `mux` and `chat` types to Stream interface |

## Files That Are Already Correct (Verify Only)

| File | Status |
|------|--------|
| `src/lib/components/streaming/MuxVideoPlayer.svelte` | ✅ Correct playback logic |
| `src/routes/api/webhooks/mux/+server.ts` | ✅ Correct field updates |

---

## Rollback Plan

If issues occur:
1. Remove the explicit `mux` and `chat` properties from page.server.ts
2. The spread operator will still pass data (just may not serialize properly)
3. Legacy Cloudflare fallback will be used for display

---

## Success Criteria

- [ ] Live streams show MuxVideoPlayer on memorial page
- [ ] Recording shows MuxVideoPlayer after stream ends
- [ ] Placeholder shows when no streams are armed
- [ ] Real-time Firestore listeners update UI when webhook fires
- [ ] No TypeScript errors in MemorialStreamDisplay

---

## Implementation Log

### Changes Made - January 22, 2026

#### Change 1: `/[fullSlug]/+page.server.ts` (Line 109-114)

**Added explicit `mux` and `chat` properties to stream mapping:**

```typescript
const stream = {
    id: doc.id,
    ...data,
    // Mux streaming platform data (explicit for serialization)
    mux: data.mux || null,
    chat: data.chat || null,
    // Timestamp conversions
    createdAt: convertTimestamp(data.createdAt),
    // ...
};
```

**Why:** Ensures Firestore `mux` and `chat` objects are properly serialized to the client, enabling `MemorialStreamDisplay` to access `stream.mux?.playbackId`.

#### Change 2: `MemorialStreamDisplay.svelte` (Lines 37-54)

**Added `mux` and `chat` types to Stream interface:**

```typescript
// Mux streaming platform data (FIX-C)
mux?: {
    liveStreamId: string;
    playbackId: string;
    rtmpUrl: string;
    streamKey: string;
    streamingStatus?: 'idle' | 'active' | 'disconnected';
    assetId?: string;
    vodPlaybackId?: string;
    recordingReady?: boolean;
    duration?: number;
};

// Chat configuration (FIX-C)
chat?: {
    enabled: boolean;
    archived: boolean;
};
```

**Why:** Provides proper TypeScript types for the Mux data, ensuring type safety and IDE autocompletion.

### Files Modified

| File | Lines Changed | Description |
|------|---------------|-------------|
| `src/routes/[fullSlug]/+page.server.ts` | 112-114 | Added `mux` and `chat` explicit properties |
| `src/lib/components/MemorialStreamDisplay.svelte` | 37-54 | Added `mux` and `chat` interface types |

### Verification Status

- [x] Code changes implemented
- [ ] Live stream test pending
- [ ] Recording test pending

---

## Related Documentation

- **WBS Section 15:** FIX C in `WBS_1-22-26_MUX_STREAMING_PLATFORM.md`
- **Svelte 5 $state:** Reactive state management for liveStreams
- **Svelte 5 $derived:** Computed stream categorization
- **SvelteKit Load:** Server data fetching and serialization

---

**Next Step:** Implement Step 1 (update page.server.ts) and Step 2 (update Stream interface).
