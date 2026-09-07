# Multi-VOD Recording Support — Work Breakdown Structure

Store an array of VOD recordings per stream so stop/start cycles don't overwrite previous sessions. Fix the race condition where a recording-ready webhook can clobber a live stream's status.

**Branch:** `mux-integration-attempt-2`

**Svelte 5 conventions:** Same as prior refactors (`$state()`, `$derived()`, `$props()`, `onclick={handler}`)

---

## Root Cause

When a streamer stops OBS and the 60-second reconnect window expires, Mux fires `video.live_stream.idle` → our `handleStreamEnded()` sets `status: 'ended'`. Mux then processes the recording and fires `video.asset.ready` → our `handleRecordingReady()` overwrites `mux.assetId`, `mux.vodPlaybackId`, `mux.duration`, and sets `status: 'completed'`.

If the streamer starts OBS again (new session on same live stream), the same cycle repeats — **overwriting** the previous recording data. Worse, the `asset.ready` from session 1 can arrive **while session 2 is live**, setting `status: 'completed'` and killing the live indicator.

**Current single-recording fields** (`src/lib/types/stream.ts` lines 38-42):
```typescript
assetId?: string;             // Mux VOD asset ID
vodPlaybackId?: string;       // VOD playback ID for recordings
recordingReady: boolean;      // Is recording processed and ready?
duration?: number;            // Recording duration in seconds
```

---

## Phase 1: Type Definitions

**Goal:** Add `MuxRecording` interface and `recordings[]` array to the type system.

### Step 1.1 — Add MuxRecording interface

**File:** `src/lib/types/stream.ts`

Insert after `MuxStreamingStatus` (line 8), before `StreamCredentials` (line 10):

```typescript
/** Individual VOD recording from a stream session */
export interface MuxRecording {
	assetId: string;              // Mux asset ID for this recording
	vodPlaybackId: string;        // Playback ID for this VOD
	duration?: number;            // Duration in seconds
	createdAt: string;            // ISO timestamp when recording was processed
}
```

### Step 1.2 — Add recordings array to MuxStreamConfig

**File:** `src/lib/types/stream.ts`

Add after `duration` (line 42), before the `reconnectWindow` comment (line 44):

```typescript
	// Multiple recordings (one per stream session, newest last)
	recordings?: MuxRecording[];
```

Keep existing `assetId` / `vodPlaybackId` / `duration` as legacy fields — they always hold the **latest** recording's data for backward compat.

---

## Phase 2: Webhook Handler Fixes

**Goal:** `handleRecordingReady()` appends to `recordings[]` array and guards against overwriting live status. `handleStreamEnded()` guards against overwriting `completed` status.

**File:** `src/routes/api/webhooks/mux/+server.ts`

### Step 2.1 — Add FieldValue import

**Line 15** — Add `FieldValue` to the firebase import:

```typescript
// Before:
import { adminDb } from '$lib/server/firebase';

// After:
import { adminDb, FieldValue } from '$lib/server/firebase';
```

### Step 2.2 — Fix handleRecordingReady() (lines 211-266)

Replace the update block (lines 247-257) with:

```typescript
		// Read current stream status to guard against race conditions
		const currentData = streamDoc.data();
		const isCurrentlyLive = currentData.status === 'live';

		console.log('📼 [MUX WEBHOOK] Current stream status:', currentData.status);
		console.log('📼 [MUX WEBHOOK] Is currently live:', isCurrentlyLive);

		// Build recording entry
		const recording = {
			assetId,
			vodPlaybackId: playbackId,
			duration: duration || 0,
			createdAt: new Date().toISOString()
		};

		// Build update — append to recordings array + update legacy fields
		const updateData: Record<string, any> = {
			// Legacy single-recording fields (latest recording wins)
			'mux.assetId': assetId,
			'mux.vodPlaybackId': playbackId,
			'mux.recordingReady': true,
			'mux.duration': duration,
			// Append to recordings array
			'mux.recordings': FieldValue.arrayUnion(recording),
			// Legacy field for backward compatibility
			recordingReady: true,
			updatedAt: new Date().toISOString()
		};

		// RACE GUARD: Only set status to 'completed' if NOT currently live
		// (a new session may have started while this recording was processing)
		if (!isCurrentlyLive) {
			updateData.status = 'completed';
			console.log('📼 [MUX WEBHOOK] Setting status to completed');
		} else {
			console.log('⚠️ [MUX WEBHOOK] Stream is currently LIVE — NOT overwriting status to completed');
		}

		console.log('💾 [MUX WEBHOOK] Updating stream with recording data...');
		await streamDoc.ref.update(updateData);
```

### Step 2.3 — Fix handleStreamEnded() (lines 162-206)

**Lines 192-197** — Add a guard so `ended` doesn't overwrite `completed`:

```typescript
		// Read current status
		const currentData = streamDoc.data();
		const currentStatus = currentData.status;

		// Guard: don't overwrite 'completed' with 'ended'
		// (stream already has recording processed)
		const newStatus = currentStatus === 'completed' ? 'completed' : 'ended';

		console.log('💾 [MUX WEBHOOK] Updating stream status...');
		console.log('⏹️ [MUX WEBHOOK] Status transition:', currentStatus, '→', newStatus);
		await streamDoc.ref.update({
			status: newStatus,
			'mux.streamingStatus': streamingStatus,
			liveEndedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});
```

### Step 2.4 — No changes to handleStreamActive()

Already correctly sets `status: 'live'` and `liveStartedAt`. If streaming resumes, this overwrites `liveStartedAt` with the new session start time — this is acceptable since `recordings[]` preserves all session data.

### Step 2.5 — No changes to handleRecordingError()

Error events don't produce recordings, so no array append needed.

---

## Phase 3: StreamCard — Multi-Recording Display

**Goal:** Show all recordings (Session 1, Session 2...) with durations in the admin StreamCard.

**File:** `src/lib/components/streaming/StreamCard.svelte`

### Step 3.1 — Replace single recording display (lines 519-532)

**Current code (lines 519-532):**
```svelte
{:else if stream.status === 'completed' || stream.mux?.recordingReady}
    <div class="rounded-lg bg-green-50 p-4">
        <p class="text-sm text-green-800">
             <strong>📼 Recording Available</strong> - Stream has been saved and is ready for playback
        </p>
        {#if stream.mux?.vodPlaybackId}
            <div class="mt-2 text-xs text-green-700">
                <p><strong>VOD Playback ID:</strong> <code class="bg-green-100 px-1 rounded">{stream.mux.vodPlaybackId}</code></p>
                {#if stream.mux?.duration}
                    <p class="mt-1"><strong>Duration:</strong> {Math.floor(stream.mux.duration / 60)}m {Math.floor(stream.mux.duration % 60)}s</p>
                {/if}
            </div>
        {/if}
    </div>
```

**Replace with:**
```svelte
{:else if stream.status === 'completed' || stream.mux?.recordingReady}
    <div class="rounded-lg bg-green-50 p-4">
        <p class="text-sm font-semibold text-green-800">
            📼 {stream.mux?.recordings?.length === 1 ? 'Recording Available' : `${stream.mux?.recordings?.length || 1} Recordings Available`}
        </p>
        {#if stream.mux?.recordings?.length}
            <div class="mt-2 space-y-2">
                {#each stream.mux.recordings as recording, i}
                    <div class="rounded bg-green-100 p-2 text-xs text-green-700">
                        <p>
                            <strong>Session {i + 1}:</strong>
                            <code class="bg-green-200 px-1 rounded">{recording.vodPlaybackId}</code>
                            {#if recording.duration}
                                — {Math.floor(recording.duration / 60)}m {Math.floor(recording.duration % 60)}s
                            {/if}
                        </p>
                    </div>
                {/each}
            </div>
        {:else if stream.mux?.vodPlaybackId}
            <!-- Legacy single recording fallback -->
            <div class="mt-2 text-xs text-green-700">
                <p><strong>VOD Playback ID:</strong> <code class="bg-green-100 px-1 rounded">{stream.mux.vodPlaybackId}</code></p>
                {#if stream.mux?.duration}
                    <p class="mt-1"><strong>Duration:</strong> {Math.floor(stream.mux.duration / 60)}m {Math.floor(stream.mux.duration % 60)}s</p>
                {/if}
            </div>
        {/if}
    </div>
```

---

## Phase 4: MuxVideoPlayer — Use Latest Recording

**Goal:** When playing back a completed stream, use the latest entry from `recordings[]`. Fall back to legacy `vodPlaybackId` for older streams.

**File:** `src/lib/components/streaming/MuxVideoPlayer.svelte`

### Step 4.1 — Update MuxPlayerStream interface (lines 20-31)

Add `recordings` to the local interface:

```typescript
// Before (lines 24-30):
mux?: {
    liveStreamId?: string;
    playbackId?: string;
    vodPlaybackId?: string;
    streamingStatus?: 'idle' | 'active' | 'disconnected';
    recordingReady?: boolean;
};

// After:
mux?: {
    liveStreamId?: string;
    playbackId?: string;
    vodPlaybackId?: string;
    streamingStatus?: 'idle' | 'active' | 'disconnected';
    recordingReady?: boolean;
    recordings?: { assetId: string; vodPlaybackId: string; duration?: number; createdAt: string }[];
};
```

### Step 4.2 — Update playbackId derived (lines 53-73)

Replace the VOD playback ID selection (lines 63-68) with recordings-aware logic:

```typescript
// Before (lines 63-68):
if ((stream.mux.recordingReady || stream.status === 'completed' || stream.status === 'ended') && stream.mux.vodPlaybackId) {
    console.log('📼 [MUX PLAYER] Using VOD playback ID:', stream.mux.vodPlaybackId);
    return stream.mux.vodPlaybackId;
}

// After:
if (stream.mux.recordingReady || stream.status === 'completed' || stream.status === 'ended') {
    // Prefer latest recording from recordings array
    if (stream.mux.recordings?.length) {
        const latest = stream.mux.recordings[stream.mux.recordings.length - 1];
        console.log('📼 [MUX PLAYER] Using latest recording VOD playback ID:', latest.vodPlaybackId, `(session ${stream.mux.recordings.length})`);
        return latest.vodPlaybackId;
    }
    // Fallback to legacy single field
    if (stream.mux.vodPlaybackId) {
        console.log('📼 [MUX PLAYER] Using legacy VOD playback ID:', stream.mux.vodPlaybackId);
        return stream.mux.vodPlaybackId;
    }
}
```

---

## Phase 5: Public Page — Multi-Recording Display & Download

**Goal:** Update the public memorial page to show all recordings with individual download buttons.

**File:** `src/lib/components/MemorialStreamDisplay.svelte`

### Step 5.1 — Update local Stream.mux interface (lines 41-51)

Add `recordings` field:

```typescript
// After duration (line 50), add:
recordings?: { assetId: string; vodPlaybackId: string; duration?: number; createdAt: string }[];
```

### Step 5.2 — Update recording detection (lines 296-300)

Add `recordings` check:

```typescript
// Before (lines 296-300):
const isRecording = 
    s.status === 'completed' || 
    s.status === 'ended' ||
    s.recordingReady === true || 
    s.mux?.recordingReady === true;

// After:
const isRecording = 
    s.status === 'completed' || 
    s.status === 'ended' ||
    s.recordingReady === true || 
    s.mux?.recordingReady === true ||
    (s.mux?.recordings?.length ?? 0) > 0;
```

### Step 5.3 — Update handleDownload() (lines 106-140)

Change to accept a specific `vodPlaybackId` parameter instead of reading from the stream:

```typescript
// Before (line 106):
async function handleDownload(stream: Stream) {
    if (!stream.mux?.vodPlaybackId || downloadingStreamId) return;
    
    const playbackId = stream.mux.vodPlaybackId;

// After:
async function handleDownload(stream: Stream, vodPlaybackId?: string) {
    const pid = vodPlaybackId || stream.mux?.vodPlaybackId;
    if (!pid || downloadingStreamId) return;
    
    const playbackId = pid;
```

Also update the filename (line 111):
```typescript
// Before:
const filename = `${stream.title || 'recording'}-${playbackId}.mp4`;

// After (no change needed, playbackId variable still works):
const filename = `${stream.title || 'recording'}-${playbackId}.mp4`;
```

### Step 5.4 — Update recording display section (lines 497-570)

**Current conditional (line 503):**
```svelte
{#if stream.mux?.recordingReady && stream.mux?.vodPlaybackId}
```

**Replace with:**
```svelte
{#if stream.mux?.recordingReady && (stream.mux?.recordings?.length || stream.mux?.vodPlaybackId)}
```

**Current download button (lines 533-556):** Shows one button using `stream.mux?.vodPlaybackId`.

**Replace single download section with multi-recording support:**
After the `<MuxVideoPlayer>` (line 530), replace the download button section (lines 532-556) with:

```svelte
<!-- Download Buttons -->
{#if stream.mux?.recordings?.length}
    <!-- Multi-recording download -->
    <div class="download-button-container">
        {#each stream.mux.recordings as recording, i}
            <button 
                type="button"
                class="download-master-button"
                disabled={downloadingStreamId === stream.id}
                onclick={() => handleDownload(stream, recording.vodPlaybackId)}
            >
                {#if downloadingStreamId === stream.id}
                    Downloading...
                {:else}
                    📥 Download {stream.mux.recordings.length > 1 ? `Part ${i + 1}` : 'Recording'}
                    {#if recording.duration}
                        ({Math.floor(recording.duration / 60)}m {Math.floor(recording.duration % 60)}s)
                    {/if}
                {/if}
            </button>
        {/each}
    </div>
{:else if stream.mux?.vodPlaybackId}
    <!-- Legacy single download fallback -->
    <div class="download-button-container">
        <button 
            type="button"
            class="download-master-button"
            disabled={downloadingStreamId === stream.id}
            onclick={() => handleDownload(stream)}
        >
            {#if downloadingStreamId === stream.id}
                Downloading...
            {:else}
                📥 Download Recording
            {/if}
        </button>
    </div>
{/if}
```

### Step 5.5 — No changes to page.server.ts

The `recordings` array is part of the `mux` object on the Firestore document, so it passes through automatically when the stream document is serialized. No explicit mapping needed.

---

## Phase 6: Backward Compatibility — No Migration Needed

| Scenario | Behavior |
|---|---|
| Existing stream with single `vodPlaybackId`, no `recordings[]` | All components check `recordings[]` first, fall back to legacy `vodPlaybackId` |
| New stream after this change | Both `recordings[]` AND legacy `vodPlaybackId` are populated (latest recording wins) |
| Stream with multiple sessions | `recordings[]` has all entries; legacy `vodPlaybackId` holds the latest |

---

## Verification Checklist

- [ ] Create a stream → go live → stop → verify `recordings[]` has 1 entry in Firestore
- [ ] Verify `status` = `completed` after recording processes
- [ ] Start same stream again → stop → verify `recordings[]` has 2 entries
- [ ] Verify latest `vodPlaybackId` matches the 2nd recording
- [ ] Start stream while previous recording is processing → verify `status` stays `live` (race guard)
- [ ] StreamCard shows "2 Recordings Available" with Session 1 and Session 2 details
- [ ] MuxVideoPlayer plays the latest recording for completed streams
- [ ] Public page shows individual download buttons for each recording session
- [ ] Existing streams with legacy single `vodPlaybackId` still display and download correctly
- [ ] `svelte-check` passes with no new errors

---

## File Summary

| Phase | File | Action | Lines Changed (est.) |
|---|---|---|---|
| 1 | `src/lib/types/stream.ts` | Add `MuxRecording` interface + `recordings[]` field | ~8 lines added |
| 2 | `src/routes/api/webhooks/mux/+server.ts` | Import FieldValue, fix `handleRecordingReady()` + `handleStreamEnded()` | ~30 lines changed |
| 3 | `src/lib/components/streaming/StreamCard.svelte` | Multi-recording display section | ~20 lines changed |
| 4 | `src/lib/components/streaming/MuxVideoPlayer.svelte` | Update interface + playbackId logic | ~15 lines changed |
| 5 | `src/lib/components/MemorialStreamDisplay.svelte` | Update interface, detection, download, display | ~40 lines changed |

**Total: 5 files, ~113 lines changed**

---

## Dependency Order

```
Phase 1 (types) ──→ prerequisite for all other phases
Phase 2 (webhooks) ──→ can be done right after Phase 1
Phase 3 (StreamCard) ──→ can be done after Phase 1
Phase 4 (MuxVideoPlayer) ──→ can be done after Phase 1
Phase 5 (MemorialStreamDisplay) ──→ can be done after Phase 1
```

**Recommended execution:** Phase 1 → Phase 2 → Phase 3 + 4 + 5 (parallel) → Verify
