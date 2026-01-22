# MUX FIX B: RTMP Credentials Not Displaying After Arm

**Date:** January 22, 2026  
**Status:** Ready for Implementation  
**Priority:** HIGH - Blocks OBS streaming setup workflow

---

## Problem Summary

When an admin arms a stream for "Stream Key" mode, the page reloads but the RTMP credentials (Server URL and Stream Key) do not appear in the StreamCard component. The user cannot copy credentials to OBS.

---

## Root Cause Analysis

### Data Flow Issue
```
1. Admin clicks "Arm Stream" with "Stream Key" selected
2. POST /api/streams/[streamId]/arm is called
3. arm/+server.ts creates Mux live stream
4. arm/+server.ts saves to Firestore:
   - streamCredentials: { rtmpUrl, streamKey }
   - mux: { liveStreamId, playbackId, rtmpUrl, streamKey, streamingStatus }
5. Page reloads (window.location.reload())
6. page.server.ts loads stream data
7. ❌ page.server.ts does NOT include `mux` property in mapping
8. StreamCard receives stream WITHOUT mux data
9. StreamCard checks `stream.mux?.rtmpUrl` → undefined
10. Credentials section is not rendered
```

### The Missing Line
In `src/routes/admin/services/memorials/[memorialId]/+page.server.ts` lines 172-174:

```typescript
// Current code (BROKEN):
armStatus: data.armStatus || null,
streamCredentials: data.streamCredentials || null,
// mux property is NOT included

// StreamCard expects:
stream.mux?.rtmpUrl
stream.mux?.streamKey
```

---

## Implementation Steps

### Step 1: Fix page.server.ts Stream Mapping

**File:** `src/routes/admin/services/memorials/[memorialId]/+page.server.ts`

**Location:** Around line 174, in the streams mapping function

**Current Code:**
```typescript
// Stream Arming (NEW)
armStatus: data.armStatus || null,
streamCredentials: data.streamCredentials || null,
```

**Updated Code:**
```typescript
// Stream Arming (NEW)
armStatus: data.armStatus || null,
streamCredentials: data.streamCredentials || null,

// Mux streaming platform data
mux: data.mux || null,
```

---

### Step 2: Verify the Fix

1. Start the dev server: `npm run dev`
2. Navigate to Admin → Services → Memorials → [Any Memorial]
3. Find a stream without credentials
4. Click dropdown, select "Stream Key"
5. Click "Arm" button
6. After page reload, verify:
   - Purple "OBS Streaming Setup (Mux Platform)" section appears
   - RTMP Server URL is displayed
   - Stream Key is displayed
   - Copy buttons work

---

### Step 3: Check Other Page Loaders

Search for other files that load streams and verify they include `mux`:

```bash
# Files to check:
grep -r "streamsSnap.docs.map" src/routes/
```

**Potential files:**
- `src/routes/[fullSlug]/+page.server.ts` - Memorial public page
- `src/routes/admin/services/memorials/+page.server.ts` - Memorial list
- `src/routes/funeral-director/dashboard/+page.server.ts` - FD dashboard

For each file, ensure `mux: data.mux || null` is included if streams are loaded.

---

### Step 4: Update TypeScript Interface (Optional)

If there's a Stream type that doesn't include `mux`, update it:

**File:** `src/lib/types/stream.ts` (or similar)

```typescript
interface Stream {
  // ... existing fields ...
  
  // Add if missing:
  mux?: {
    liveStreamId: string;
    playbackId: string;
    rtmpUrl: string;
    streamKey: string;
    streamingStatus: 'idle' | 'active' | 'disconnected';
    assetId?: string;
    vodPlaybackId?: string;
    recordingReady?: boolean;
    duration?: number;
  };
}
```

---

### Step 5: Test End-to-End Workflow

1. **Create new stream** (or use existing scheduled stream)
2. **Arm for Stream Key**
3. **Verify credentials appear**
4. **Copy RTMP URL** → Paste in OBS Settings → Stream → Server
5. **Copy Stream Key** → Paste in OBS Settings → Stream → Stream Key
6. **Start streaming from OBS**
7. **Verify stream goes live** (check Mux dashboard or webhook logs)

---

## Verification Checklist

- [ ] `mux` property added to `page.server.ts` stream mapping
- [ ] Page reload shows RTMP credentials after arming
- [ ] Copy buttons work for both URL and key
- [ ] OBS Setup Instructions section appears below credentials
- [ ] Other page loaders checked and updated if needed
- [ ] TypeScript types updated if needed
- [ ] End-to-end test with OBS successful

---

## Rollback

If issues occur, simply remove the `mux: data.mux || null` line. The arm API will still work; credentials just won't display in the UI (admins can retrieve from Firestore directly as a workaround).

---

## Related Files

| File | Purpose |
|------|---------|
| `src/routes/admin/services/memorials/[memorialId]/+page.server.ts` | Loads streams for admin detail page |
| `src/routes/api/streams/[streamId]/arm/+server.ts` | Creates Mux live stream and saves credentials |
| `src/lib/components/streaming/StreamCard.svelte` | Displays RTMP credentials UI |
| `src/lib/server/mux.ts` | Mux API utility functions |

---

**Next Step:** Switch to Code mode and implement Step 1.
