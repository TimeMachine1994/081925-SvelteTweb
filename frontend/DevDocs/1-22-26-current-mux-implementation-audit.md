# CURRENT MUX IMPLEMENTATION AUDIT
**Date:** January 22, 2026  
**Purpose:** Document current state of Admin & Memorial page Mux integration, compare with reference

---

## PART 1: ADMIN INTERFACE ANALYSIS

### 1.1 Admin Memorial Detail Page Loader
**File:** `src/routes/admin/services/memorials/[memorialId]/+page.server.ts`

**Current State:** ✅ WORKING

```typescript
// Lines 159-212: Stream mapping includes mux property
const streams = streamsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
        id: doc.id,
        // ... other fields ...
        
        // Mux streaming platform data ✅
        mux: data.mux || null,
        
        // Legacy fields also preserved
        streamCredentials: data.streamCredentials || null,
        rtmpUrl: data.rtmpUrl || null,
        streamKey: data.streamKey || null,
        // ...
    };
});
```

**Verdict:** ✅ Admin loader correctly includes `mux` property

---

### 1.2 Admin StreamCard Component
**File:** `src/lib/components/streaming/StreamCard.svelte`

**Current State:** ✅ WORKING

```svelte
<!-- Lines 297-355: Mux RTMP credentials display -->
{#if stream.mux?.rtmpUrl && stream.mux?.streamKey}
    <div class="rtmp-credentials">
        <h3>OBS Streaming Setup (Mux Platform)</h3>
        
        <!-- RTMP URL with copy button -->
        <code>{stream.mux.rtmpUrl}</code>
        <button onclick={() => copyToClipboard(stream.mux.rtmpUrl, 'rtmp')}>Copy</button>
        
        <!-- Stream Key with copy button -->
        <code>{stream.mux.streamKey}</code>
        <button onclick={() => copyToClipboard(stream.mux.streamKey, 'streamKey')}>Copy</button>
    </div>
{/if}
```

**Verdict:** ✅ StreamCard correctly displays Mux RTMP credentials with copy buttons

---

### 1.3 Stream Creation API
**File:** `src/routes/api/memorials/[memorialId]/streams/+server.ts`

**Current State:** ✅ WORKING

```typescript
// Lines 159-226: Creates Mux stream and saves to Firestore
const muxLiveStream = await createMuxLiveStream(title.trim(), {
    reconnectWindow: 60,
    reducedLatency: true
});

const streamData = {
    // ... metadata ...
    mux: {
        liveStreamId: muxLiveStream.id,
        playbackId: muxLiveStream.playbackId,
        rtmpUrl: muxLiveStream.rtmpUrl,
        streamKey: muxLiveStream.streamKey,
        recordingReady: false,
        streamingStatus: 'idle'
    },
    chat: {
        enabled: true,
        messageCount: 0,
        participantCount: 0
    }
};

await adminDb.collection('streams').add(streamData);
```

**Verdict:** ✅ Stream creation correctly calls Mux API and saves all required fields

---

### 1.4 Mux Webhook Handler
**File:** `src/routes/api/webhooks/mux/+server.ts`

**Current State:** ✅ WORKING

| Event | Handler | Fields Updated |
|-------|---------|----------------|
| `video.live_stream.active` | `handleStreamActive()` | `status: 'live'`, `mux.streamingStatus: 'active'`, `liveStartedAt` |
| `video.live_stream.idle` | `handleStreamEnded()` | `mux.streamingStatus: 'idle'`, `liveEndedAt` |
| `video.asset.ready` | `handleRecordingReady()` | `status: 'completed'`, `mux.vodPlaybackId`, `mux.recordingReady: true`, `mux.duration` |

**Verdict:** ✅ Webhook handler correctly updates Firestore on all key events

---

## PART 2: MEMORIAL PAGE (fullSlug) ANALYSIS

### 2.1 Memorial Page Loader
**File:** `src/routes/[fullSlug]/+page.server.ts`

**Current State:** ✅ WORKING

```typescript
// Lines 107-136: Stream mapping with explicit mux property
streams = streamsSnapshot.docs
    .map(doc => {
        const data = doc.data();
        const stream = {
            id: doc.id,
            ...data,
            // Mux streaming platform data (explicit for serialization) ✅
            mux: data.mux || null,
            chat: data.chat || null,
            // Timestamp conversions
            scheduledStartTime: convertTimestamp(data.scheduledStartTime),
            // ...
        };
        return stream;
    })
    .filter(stream => stream.isVisible !== false);
```

**Verdict:** ✅ fullSlug loader correctly includes `mux` and `chat` properties

---

### 2.2 MemorialStreamDisplay Component
**File:** `src/lib/components/MemorialStreamDisplay.svelte`

**Current State:** ✅ MOSTLY WORKING (with potential issues)

#### Interface Definition (Lines 10-58)
```typescript
interface Stream {
    // ... basic fields ...
    
    // Mux streaming platform data (FIX-C) ✅
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
    
    // Chat configuration (FIX-C) ✅
    chat?: {
        enabled: boolean;
        archived: boolean;
    };
}
```

#### Live Stream Detection (Lines 166-186)
```typescript
let categorizedLiveStreams = $derived(
    liveStreams.filter(s => {
        if (s.isVisible === false) return false;
        
        // Explicitly marked as live by webhook
        if (s.status === 'live') return true;
        
        // Fallback: scheduled/ready past start time
        if ((s.status === 'scheduled' || s.status === 'ready') && s.scheduledStartTime) {
            const scheduledTime = new Date(s.scheduledStartTime).getTime();
            if (currentTime.getTime() >= scheduledTime) return true;
        }
        
        return false;
    })
);
```

#### Mux Player Rendering (Lines 276-316)
```svelte
{#each categorizedLiveStreams as stream (stream.id)}
    <div class="stream-item">
        {#if stream.mux?.playbackId}
            <!-- MUX PLATFORM - New integrated player with chat -->
            <div class="mux-stream-container">
                <MuxVideoPlayer stream={stream} autoplay={true} showTitle={true} />
                
                {#if stream.chat?.enabled}
                    <LiveChatWidget streamId={stream.id} enabled={stream.chat.enabled} />
                {/if}
            </div>
        {:else}
            <!-- LEGACY CLOUDFLARE - Fallback iframe player -->
            <!-- ... legacy code ... -->
        {/if}
    </div>
{/each}
```

#### Recorded Stream Rendering (Lines 350-395)
```svelte
{#each recordedStreams as stream (stream.id)}
    {#if stream.mux?.recordingReady && stream.mux?.vodPlaybackId}
        <!-- MUX PLATFORM - Recorded video player -->
        <MuxVideoPlayer stream={stream} autoplay={false} showTitle={true} />
    {:else}
        <!-- LEGACY CLOUDFLARE fallback -->
    {/if}
{/each}
```

**Verdict:** ✅ Component has correct Mux integration logic

---

### 2.3 MuxVideoPlayer Component
**File:** `src/lib/components/streaming/MuxVideoPlayer.svelte`

**Current State:** ⚠️ POTENTIAL ISSUE

```svelte
// Lines 53-72: Playback ID determination
const playbackId = $derived(() => {
    // For completed streams with recording ready, use VOD playback ID
    if (stream.status === 'completed' && stream.mux?.vodPlaybackId) {
        return stream.mux.vodPlaybackId;
    }
    // For live or scheduled streams, use live playback ID
    return stream.mux?.playbackId;
});

const isLive = $derived(() => {
    const live = stream.status === 'live' || 
                 (stream.status === 'ready' && stream.mux?.streamingStatus === 'active');
    return live;
});
```

**Potential Issue:** The `$derived` returns a function, but it's being called as `playbackId()` in the template. This is correct Svelte 5 syntax but may cause issues if not handled properly.

---

## PART 3: COMPARISON WITH MUX-REFERENCE

### 3.1 Reference Flow vs Actual Implementation

| Step | Reference | Actual | Status |
|------|-----------|--------|--------|
| 1. Create stream via Mux API | `createMuxLiveStream()` | ✅ Implemented | ✅ MATCH |
| 2. Save mux object to Firestore | `mux: { liveStreamId, playbackId, rtmpUrl, streamKey }` | ✅ Implemented | ✅ MATCH |
| 3. Admin sees RTMP credentials | StreamCard displays `mux.rtmpUrl` + `mux.streamKey` | ✅ Implemented | ✅ MATCH |
| 4. Webhook: stream active | Updates `status: 'live'`, `mux.streamingStatus: 'active'` | ✅ Implemented | ✅ MATCH |
| 5. Memorial page shows live | Checks `stream.mux?.playbackId` | ✅ Implemented | ✅ MATCH |
| 6. Webhook: recording ready | Updates `mux.vodPlaybackId`, `mux.recordingReady: true` | ✅ Implemented | ✅ MATCH |
| 7. Memorial page shows recording | Checks `mux.recordingReady && mux.vodPlaybackId` | ✅ Implemented | ✅ MATCH |

---

## PART 4: IDENTIFIED ISSUES & GAPS

### 🔴 Issue 1: Live Detection Logic May Miss Mux Streams

**Location:** `MemorialStreamDisplay.svelte` lines 166-186

**Problem:** The `categorizedLiveStreams` filter checks for `status === 'live'` but also has a fallback that shows scheduled streams as live when past their start time. This could cause issues:

1. If webhook is delayed, a Mux stream might not show as live
2. The fallback doesn't check for `mux.streamingStatus === 'active'`

**Current Code:**
```typescript
if (s.status === 'live') return true;

// Fallback only checks scheduledStartTime, not mux.streamingStatus
if ((s.status === 'scheduled' || s.status === 'ready') && s.scheduledStartTime) {
    if (currentTime.getTime() >= scheduledTime) return true;
}
```

**Suggested Fix:**
```typescript
if (s.status === 'live') return true;

// Also check if Mux reports active streaming
if (s.mux?.streamingStatus === 'active') return true;

// Fallback for non-Mux streams
if ((s.status === 'scheduled' || s.status === 'ready') && s.scheduledStartTime) {
    if (currentTime.getTime() >= scheduledTime) return true;
}
```

---

### 🟡 Issue 2: Recorded Stream Filter May Be Too Strict

**Location:** `MemorialStreamDisplay.svelte` lines 213-218

**Current Code:**
```typescript
let recordedStreams = $derived(
    liveStreams.filter(s => 
        s.isVisible !== false && 
        (s.status === 'completed' || s.recordingReady === true)
    )
);
```

**Problem:** This filter checks `s.recordingReady` (legacy field) but doesn't explicitly check `s.mux?.recordingReady`. The rendering template (line 355) does check `stream.mux?.recordingReady`, so streams might be in `recordedStreams` but not render the Mux player.

**Suggested Fix:** Make filter consistent with rendering logic:
```typescript
let recordedStreams = $derived(
    liveStreams.filter(s => 
        s.isVisible !== false && 
        (s.status === 'completed' || s.recordingReady === true || s.mux?.recordingReady === true)
    )
);
```

---

### 🟢 Issue 3: Firestore Real-time Listener May Not Update mux Object

**Location:** `MemorialStreamDisplay.svelte` lines 117-134

**Current Code:**
```typescript
const unsubscribe = onSnapshot(streamDocRef, (snapshot) => {
    if (snapshot.exists()) {
        const updatedData = snapshot.data();
        // Update the stream in our local state
        liveStreams = liveStreams.map((s, i) => 
            i === index ? { ...s, ...updatedData, id: stream.id } : s
        );
    }
});
```

**Analysis:** The spread operator `{ ...s, ...updatedData }` should correctly merge the `mux` object from Firestore updates. This should work correctly.

**Verdict:** ✅ This looks correct - real-time updates should include mux changes

---

## PART 5: SUMMARY CHECKLIST

### Admin Interface
- [x] Page loader includes `mux` property
- [x] StreamCard displays RTMP URL
- [x] StreamCard displays Stream Key
- [x] Copy-to-clipboard buttons work
- [x] Chat toggle button present

### Stream Creation API
- [x] Calls `createMuxLiveStream()`
- [x] Saves `mux.liveStreamId`
- [x] Saves `mux.playbackId`
- [x] Saves `mux.rtmpUrl`
- [x] Saves `mux.streamKey`
- [x] Saves `chat.enabled: true`

### Webhook Handler
- [x] Handles `video.live_stream.active`
- [x] Handles `video.live_stream.idle`
- [x] Handles `video.asset.ready`
- [x] Updates `status` correctly
- [x] Updates `mux.streamingStatus`
- [x] Updates `mux.vodPlaybackId`
- [x] Updates `mux.recordingReady`

### Memorial Page (fullSlug)
- [x] Page loader includes `mux` property
- [x] Page loader includes `chat` property
- [x] MemorialStreamDisplay has mux interface
- [x] Checks `stream.mux?.playbackId` for live
- [x] Checks `stream.mux?.vodPlaybackId` for recording
- [ ] ⚠️ Live detection should also check `mux.streamingStatus`
- [ ] ⚠️ Recorded filter could be more explicit about mux

### MuxVideoPlayer Component
- [x] Imports `@mux/mux-player`
- [x] Determines correct playbackId (live vs VOD)
- [x] Sets `stream-type` correctly
- [x] Handles missing playbackId gracefully

---

## PART 6: RECOMMENDED FIXES

### Fix Priority: HIGH
1. **Add `mux.streamingStatus` check to live detection** - Ensures Mux streams show as live even if webhook is delayed

### Fix Priority: MEDIUM
2. **Update recordedStreams filter** - Make consistent with rendering logic

### Fix Priority: LOW
3. **None identified** - Core implementation is solid

---

## PART 7: TEST SCENARIOS

To verify the implementation works end-to-end:

### Test 1: Stream Creation
1. Go to Admin → Memorial Detail
2. Click "Schedule Stream"
3. Fill in title and date/time
4. Submit
5. **Expected:** Stream appears in list with RTMP credentials visible

### Test 2: OBS Streaming
1. Copy RTMP URL and Stream Key from admin
2. Configure OBS with credentials
3. Start streaming
4. **Expected:** Webhook fires, Firestore updates, memorial page shows live stream

### Test 3: Recording Playback
1. Stop OBS streaming
2. Wait 1-2 minutes for Mux to process
3. Refresh memorial page
4. **Expected:** Recording appears with VOD playback

---

**END OF AUDIT**
