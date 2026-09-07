# Bug Analysis: LIVE Badge Showing on Service Recordings

**Date:** January 23, 2026  
**Severity:** Medium (UI/UX Issue)  
**Status:** Open  

---

## Problem Statement

The memorial page displays a **🔴 LIVE** badge on streams in the "Service Recording" section when they should show a **📼 RECORDED** badge. This creates user confusion as viewers may think the recording is actually a live stream.

![Screenshot showing LIVE badge on recording section]

---

## Root Cause Analysis

### Issue 1: Missing Mutual Exclusion in Stream Categorization

**File:** `src/lib/components/MemorialStreamDisplay.svelte`

The `recordedStreams` filter does NOT exclude streams that are also in `categorizedLiveStreams`:

```typescript:225-246
let recordedStreams = $derived(
    liveStreams.filter(s => {
        const isRecording = s.isVisible !== false && 
            (s.status === 'completed' || 
             s.status === 'ended' ||
             s.recordingReady === true || 
             s.mux?.recordingReady === true);  // ⚠️ No exclusion of live streams!
        return isRecording;
    })
);
```

Meanwhile, `scheduledStreams` correctly excludes live streams:

```typescript:202-223
let scheduledStreams = $derived(
    liveStreams.filter(s => {
        // ...
        // If already in live streams, don't show in scheduled
        const isInLiveStreams = categorizedLiveStreams.some(live => live.id === s.id);
        if (isInLiveStreams) return false;  // ✅ Correct exclusion
        // ...
    })
);
```

### Issue 2: Badge Logic Only Checks Two States

**File:** `src/lib/components/streaming/MuxVideoPlayer.svelte`

The badge rendering logic has gaps:

```svelte:132-136
{#if isLive()}
    <span class="live-badge">🔴 LIVE</span>
{:else if stream.status === 'completed'}
    <span class="recorded-badge">📼 RECORDED</span>
{/if}
```

**Problems:**
1. `isLive()` checks `status === 'live'` which may still be true even when recording is ready
2. No badge shown when `status === 'ended'` (intermediate state)
3. Doesn't consider `mux.recordingReady` for badge determination

### Issue 3: Data Inconsistency Possibility

A stream can have conflicting states:
- `status: 'live'` (not updated by webhook)
- `mux.recordingReady: true` (set by asset.ready webhook)

This happens if:
1. The `video.live_stream.idle` webhook fails/delays
2. The `video.asset.ready` webhook fires before status is updated
3. Network issues cause webhooks to arrive out of order

---

## Data Flow Trace

```
┌────────────────────────────────────────────────────────────────────┐
│ CURRENT (BUGGY) BEHAVIOR                                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Stream State: status='live', mux.recordingReady=true              │
│                                                                    │
│  categorizedLiveStreams filter:                                    │
│    ✓ s.status === 'live' → INCLUDED                                │
│                                                                    │
│  recordedStreams filter:                                           │
│    ✓ s.mux?.recordingReady === true → INCLUDED                     │
│    ✗ No exclusion check! → ALSO INCLUDED                           │
│                                                                    │
│  Result: Stream appears in BOTH sections                           │
│                                                                    │
│  MuxVideoPlayer badge (in recording section):                      │
│    isLive() = true (status === 'live')                             │
│    → Shows 🔴 LIVE badge ❌                                         │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Possible Solutions

### Solution A: Add Mutual Exclusion to recordedStreams (Recommended)

Add the same exclusion logic used in `scheduledStreams`:

```typescript
let recordedStreams = $derived(
    liveStreams.filter(s => {
        if (s.isVisible === false) return false;
        
        // NEW: Exclude streams that are currently live
        const isInLiveStreams = categorizedLiveStreams.some(live => live.id === s.id);
        if (isInLiveStreams) return false;
        
        const isRecording = 
            s.status === 'completed' || 
            s.status === 'ended' ||
            s.recordingReady === true || 
            s.mux?.recordingReady === true;
        
        return isRecording;
    })
);
```

**Pros:** Simple, follows existing pattern  
**Cons:** Doesn't fix the badge logic issue

### Solution B: Fix Badge Logic in MuxVideoPlayer

Improve the `isLive()` function and badge rendering:

```typescript
const isLive = $derived(() => {
    // If recording is ready, it's NOT live anymore
    if (stream.mux?.recordingReady) return false;
    if (stream.status === 'completed' || stream.status === 'ended') return false;
    
    // Check for active live indicators
    return stream.status === 'live' || 
           (stream.status === 'ready' && stream.mux?.streamingStatus === 'active');
});

const isRecording = $derived(() => {
    return stream.status === 'completed' ||
           stream.status === 'ended' ||
           stream.mux?.recordingReady === true;
});
```

Update badge template:

```svelte
{#if isLive()}
    <span class="live-badge">🔴 LIVE</span>
{:else if isRecording()}
    <span class="recorded-badge">📼 RECORDED</span>
{/if}
```

**Pros:** Defensive, handles all states correctly  
**Cons:** Requires changes to MuxVideoPlayer component

### Solution C: Fix Data Consistency (Preventive)

Ensure webhooks always update status correctly in sequence:

1. In `handleRecordingReady()`, ensure status is set to 'completed':
   ```typescript
   await streamDoc.ref.update({
       status: 'completed',  // Always override
       // ...
   });
   ```

2. Add validation in the UI to prefer `mux.recordingReady` over `status`:
   ```typescript
   const effectiveStatus = stream.mux?.recordingReady ? 'completed' : stream.status;
   ```

**Pros:** Fixes root cause  
**Cons:** May have race condition edge cases

### Solution D: Combined Approach (Most Robust)

Implement all three solutions:
1. Add mutual exclusion in `recordedStreams`
2. Fix badge logic in `MuxVideoPlayer`
3. Add defensive status normalization

---

## Affected Files

| File | Changes Required |
|------|------------------|
| `src/lib/components/MemorialStreamDisplay.svelte` | Add exclusion logic to `recordedStreams` |
| `src/lib/components/streaming/MuxVideoPlayer.svelte` | Improve `isLive()` and badge rendering |
| `src/routes/api/webhooks/mux/+server.ts` | (Optional) Add status validation |

---

## Testing Checklist

- [ ] Stream shows in "Live Now" only when actively broadcasting
- [ ] Stream shows in "Service Recording" only after broadcast ends
- [ ] LIVE badge appears only on actively broadcasting streams
- [ ] RECORDED badge appears on all completed/ended streams
- [ ] No stream appears in multiple sections simultaneously
- [ ] Rapid webhook arrivals don't cause UI glitches
- [ ] Page refresh maintains correct state

---

## Related Documentation

- [Mux Webhook Events](https://docs.mux.com/guides/video/listen-for-webhooks)
- Stream Types: `src/lib/types/stream.ts`
- Previous Implementation: `1-22-26-MUX-IMPLEMENTATION.md`
