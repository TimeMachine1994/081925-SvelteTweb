# Mux Livestream → Block Editor Integration — Work Breakdown Structure

Wire Mux live stream creation (RTMP credentials, playback IDs) into the block editor's livestream workflow. Currently, adding a "Livestream" block creates a bare Firestore document with no Mux integration — no RTMP URL, no stream key, no playback ID. This refactor fixes that gap and surfaces the full `StreamCard` credential UI inside each livestream block.

**Branch:** `mux-integration-attempt-2`

**Svelte 5 conventions (same as prior refactor):**
- `$state()` for mutable local state
- `$derived()` for computed values
- `$props()` with `interface Props` for component inputs
- `onclick={handler}` attribute syntax
- Event callbacks via props (e.g., `onSave`, `onEdit`)

---

## Root Cause Analysis

### What works (old streams API)

**File:** `src/routes/api/memorials/[memorialId]/streams/+server.ts` (lines 159–227)

The old POST handler:
1. Calls `createMuxLiveStream()` from `$lib/server/mux`
2. Receives back `{ id, playbackId, rtmpUrl, streamKey, reconnectWindow, status }`
3. Stores a full `mux` config object on the Firestore stream document:
   ```typescript
   mux: {
       liveStreamId: muxLiveStream.id,
       playbackId: muxLiveStream.playbackId,
       rtmpUrl: muxLiveStream.rtmpUrl,
       streamKey: muxLiveStream.streamKey,
       recordingReady: false,
       streamingStatus: 'idle',
       reconnectWindow: 60
   }
   ```
4. The `StreamCard.svelte` component then renders credentials when `stream.mux?.rtmpUrl && stream.mux?.streamKey` is truthy (line 414).

### What's broken (block editor livestream API)

**File:** `src/routes/api/memorials/[memorialId]/blocks/livestream/+server.ts` (lines 49–64)

The block editor POST handler:
1. **Never imports or calls `createMuxLiveStream()`**
2. Creates a bare `streamData` object with only `title`, `description`, `scheduledStartTime`, `status`, `chat`
3. **No `mux` field** — no RTMP URL, no stream key, no playback ID, no live stream ID
4. Result: `StreamCard` conditional `{#if stream.mux?.rtmpUrl && stream.mux?.streamKey}` is `false` → credentials section never renders

### Frontend gap

**File:** `src/lib/components/admin/memorial-editor/blocks/LivestreamBlock.svelte` (94 lines)

This component only shows a status badge and schedule time. It does NOT render `StreamCard` or any credential display. The `EditLivestreamModal` tells users to "use the Stream Card on this memorial's detail page" — but there's no StreamCard rendered anywhere in the block editor flow.

---

## Phase 1: Backend — Wire Mux Into Block Livestream API

**Goal:** When a livestream block is created via the block editor, actually create a Mux live stream and store the full `mux` config on the Firestore stream document.

**File:** `src/routes/api/memorials/[memorialId]/blocks/livestream/+server.ts`

### Step 1.1 — Add Mux import

**Line 5** — Add import for `createMuxLiveStream`:

```typescript
// Before (line 1-5):
import { adminDb } from '$lib/server/firebase';
import { error as svelteError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { MemorialBlock, CreateLivestreamBlockRequest } from '$lib/types/memorial-blocks';
import { sortBlocksByOrder, createLivestreamBlock, insertBlockAt } from '$lib/utils/block-utils';

// After (add line 6):
import { adminDb } from '$lib/server/firebase';
import { error as svelteError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { MemorialBlock, CreateLivestreamBlockRequest } from '$lib/types/memorial-blocks';
import { sortBlocksByOrder, createLivestreamBlock, insertBlockAt } from '$lib/utils/block-utils';
import { createMuxLiveStream } from '$lib/server/mux';
```

### Step 1.2 — Add Mux live stream creation before Firestore write

**Lines 45–64** — Insert Mux creation call between the memorial validation and the `streamData` object construction.

**Current code (lines 45-64):**
```typescript
// Create stream document in root streams collection (not subcollection)
const streamsRef = adminDb.collection('streams');
const now = new Date().toISOString();

const streamData = {
    title: title.trim(),
    description: description?.trim() || '',
    scheduledStartTime: scheduledStartTime || null,
    status: 'scheduled',
    memorialId,
    createdAt: now,
    updatedAt: now,
    createdBy: locals.user.uid,
    createdByEmail: locals.user.email,
    // Chat defaults
    chat: {
        enabled: true,
        locked: false
    }
};
```

**Replace with:**
```typescript
// Create stream document in root streams collection (not subcollection)
const streamsRef = adminDb.collection('streams');
const now = new Date().toISOString();

// === MUX INTEGRATION: Create Live Stream with RTMP credentials ===
console.log('🎬 [BLOCKS] Creating Mux live stream for:', title.trim());

let muxLiveStream;
try {
    muxLiveStream = await createMuxLiveStream(title.trim(), {
        reconnectWindow: 60,    // 60 seconds before stream times out
        reducedLatency: true    // Low latency mode for real-time streaming
    });

    console.log('✅ [BLOCKS] Mux live stream created:', muxLiveStream.id);
    console.log('🎬 [BLOCKS] Playback ID:', muxLiveStream.playbackId);
    console.log('📺 [BLOCKS] RTMP URL:', muxLiveStream.rtmpUrl);
    console.log('🔑 [BLOCKS] Stream Key length:', muxLiveStream.streamKey?.length || 0);
} catch (muxError) {
    console.error('❌ [BLOCKS] Failed to create Mux live stream:', muxError);
    throw svelteError(500, `Failed to create Mux live stream: ${muxError instanceof Error ? muxError.message : 'Unknown error'}`);
}

const streamData = {
    title: title.trim(),
    description: description?.trim() || '',
    scheduledStartTime: scheduledStartTime || null,
    status: scheduledStartTime ? 'scheduled' : 'ready',
    visibility: 'public',
    memorialId,
    createdAt: now,
    updatedAt: now,
    createdBy: locals.user.uid,
    createdByEmail: locals.user.email,

    // Mux Platform Configuration (RTMP credentials for OBS)
    mux: {
        liveStreamId: muxLiveStream.id,
        playbackId: muxLiveStream.playbackId,
        rtmpUrl: muxLiveStream.rtmpUrl,
        streamKey: muxLiveStream.streamKey,
        recordingReady: false,
        streamingStatus: 'idle',
        reconnectWindow: 60
    },

    // Firestore Chat Configuration
    chat: {
        enabled: true,
        locked: false,
        archived: false,
        messageCount: 0,
        participantCount: 0,
        moderationMode: 'manual'
    },

    isVisible: true
};
```

**Key differences from old `streamData`:**
- `status` is `'ready'` when no `scheduledStartTime` (matching old API logic), `'scheduled'` when there is one
- `visibility: 'public'` added (matching old API)
- `mux` object with all RTMP credentials from `createMuxLiveStream()` return value
- `chat` object expanded to match the full `StreamChatConfig` interface (not just `enabled`/`locked`)
- `isVisible: true` added (matching old API)

### Step 1.3 — Include `mux` data in API response

**Lines 91–98** — The response already returns `stream: { id: streamId, ...streamData }` which will now include the `mux` field. No change needed here, but verify the response shape is correct.

**Current response (no change needed):**
```typescript
return json({
    stream: {
        id: streamId,
        ...streamData
    },
    block: newBlock,
    blocks: sortBlocksByOrder(blocks)
});
```

The `MemorialBlockEditor.svelte` already handles this at lines 157-159:
```typescript
if (type === 'livestream' && data.stream) {
    streams = [...streams, data.stream];
}
```

This means the new stream (now with `mux` data) will be added to the `streams` array and immediately available to `StreamCard`.

### Step 1.4 — Verify: Environment variables

Ensure the following are set in the deployment environment (already required for the old streams API):

| Variable | Purpose |
|---|---|
| `MUX_TOKEN_ID` | Mux API token ID |
| `MUX_TOKEN_SECRET` | Mux API token secret |
| `MUX_WEBHOOK_SECRET` | Mux webhook signature verification |

**File to check:** `src/lib/server/mux.ts` (line 1–20) — Mux client initialization reads these from `$env`.

---

## Phase 2: Frontend — Thread `memorialId` Through Block Component Chain

**Goal:** The `StreamCard` component requires `memorialId` as a prop. Currently the block editor component chain does not pass `memorialId` down to individual block renderers. We need to thread it through: `MemorialBlockEditor` → `BlockList` → `BlockItem` → `LivestreamBlock`.

### Step 2.1 — Add `memorialId` prop to BlockList

**File:** `src/lib/components/admin/memorial-editor/BlockList.svelte`

**Current Props (lines 7-17):**
```typescript
interface Props {
    blocks: MemorialBlock[];
    streams: any[];
    findStream: (streamId: string) => any;
    onReorder: (newOrder: string[]) => void;
    onEdit: (block: MemorialBlock) => void;
    onToggle: (blockId: string, enabled: boolean) => void;
    onDelete: (blockId: string) => void;
    onMoveUp?: (blockId: string) => void;
    onMoveDown?: (blockId: string) => void;
}
```

**New Props:**
```typescript
interface Props {
    blocks: MemorialBlock[];
    streams: any[];
    memorialId: string;                          // NEW
    findStream: (streamId: string) => any;
    onReorder: (newOrder: string[]) => void;
    onEdit: (block: MemorialBlock) => void;
    onToggle: (blockId: string, enabled: boolean) => void;
    onDelete: (blockId: string) => void;
    onMoveUp?: (blockId: string) => void;
    onMoveDown?: (blockId: string) => void;
}
```

**Line 19** — Update destructuring:
```typescript
// Before:
let { blocks, streams, findStream, onReorder, onEdit, onToggle, onDelete, onMoveUp, onMoveDown }: Props = $props();

// After:
let { blocks, streams, memorialId, findStream, onReorder, onEdit, onToggle, onDelete, onMoveUp, onMoveDown }: Props = $props();
```

**Line 50-51** — Pass `memorialId` to `BlockItem`:
```svelte
<!-- Before: -->
<BlockItem
    {block}
    stream={block.type === 'livestream' ? findStream((block.config as any).streamId) : null}
    ...
/>

<!-- After: -->
<BlockItem
    {block}
    stream={block.type === 'livestream' ? findStream((block.config as any).streamId) : null}
    {memorialId}
    ...
/>
```

### Step 2.2 — Add `memorialId` prop to BlockItem

**File:** `src/lib/components/admin/memorial-editor/BlockItem.svelte`

**Current Props (lines 8-18):**
```typescript
interface Props {
    block: MemorialBlock;
    stream?: any;
    onEdit: () => void;
    onToggle: (enabled: boolean) => void;
    onDelete: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
}
```

**New Props:**
```typescript
interface Props {
    block: MemorialBlock;
    stream?: any;
    memorialId: string;                          // NEW
    onEdit: () => void;
    onToggle: (enabled: boolean) => void;
    onDelete: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
}
```

**Line 20** — Update destructuring:
```typescript
// Before:
let { block, stream, onEdit, onToggle, onDelete, onMoveUp, onMoveDown, isFirst = false, isLast = false }: Props = $props();

// After:
let { block, stream, memorialId, onEdit, onToggle, onDelete, onMoveUp, onMoveDown, isFirst = false, isLast = false }: Props = $props();
```

**Line 55** — Pass `memorialId` to `LivestreamBlock`:
```svelte
<!-- Before: -->
<LivestreamBlock {block} {stream} />

<!-- After: -->
<LivestreamBlock {block} {stream} {memorialId} />
```

### Step 2.3 — Pass `memorialId` from MemorialBlockEditor to BlockList

**File:** `src/lib/components/admin/memorial-editor/MemorialBlockEditor.svelte`

**Line 240-250** — Add `{memorialId}` to `BlockList`:
```svelte
<!-- Before: -->
<BlockList
    {blocks}
    {streams}
    {findStream}
    onReorder={handleReorder}
    onEdit={handleEdit}
    onToggle={handleToggle}
    onDelete={handleDelete}
    onMoveUp={handleMoveUp}
    onMoveDown={handleMoveDown}
/>

<!-- After: -->
<BlockList
    {blocks}
    {streams}
    {memorialId}
    {findStream}
    onReorder={handleReorder}
    onEdit={handleEdit}
    onToggle={handleToggle}
    onDelete={handleDelete}
    onMoveUp={handleMoveUp}
    onMoveDown={handleMoveDown}
/>
```

No new prop needed on `MemorialBlockEditor` — it already receives `memorialId` as a prop (line 12).

---

## Phase 3: Frontend — Render StreamCard in LivestreamBlock

**Goal:** Replace the minimal status-only `LivestreamBlock.svelte` with the full `StreamCard` component, giving users immediate access to RTMP credentials, stream status, chat controls, and embed management.

### Step 3.1 — Rewrite LivestreamBlock.svelte

**File:** `src/lib/components/admin/memorial-editor/blocks/LivestreamBlock.svelte`

**Current code (94 lines):** Shows only a status badge and schedule time. No credentials.

**Replace entire file with:**
```svelte
<script lang="ts">
	import type { MemorialBlock, LivestreamConfig } from '$lib/types/memorial-blocks';
	import StreamCard from '$lib/components/streaming/StreamCard.svelte';

	interface Props {
		block: MemorialBlock;
		stream?: any;
		memorialId: string;
	}

	let { block, stream, memorialId }: Props = $props();

	const config = block.config as LivestreamConfig;
</script>

<div class="livestream-block">
	{#if stream}
		<StreamCard
			{stream}
			canManage={true}
			{memorialId}
		/>
	{:else}
		<div class="stream-missing">
			<p>⚠️ Stream not found</p>
			<p class="stream-id">Stream ID: {config.streamId}</p>
			<p>This stream may have been deleted. Consider removing this block.</p>
		</div>
	{/if}
</div>

<style>
	.livestream-block {
		width: 100%;
	}

	.stream-missing {
		background: #fed7d7;
		border: 1px solid #fc8181;
		border-radius: 0.375rem;
		padding: 1rem;
	}

	.stream-missing p {
		margin: 0.25rem 0;
		font-size: 0.875rem;
		color: #742a2a;
	}

	.stream-missing p:first-child {
		font-weight: 600;
	}

	.stream-id {
		font-family: monospace;
		font-size: 0.75rem !important;
		color: #a0aec0 !important;
	}
</style>
```

### Step 3.2 — Verify StreamCard Tailwind dependency

**File:** `src/lib/components/streaming/StreamCard.svelte`

`StreamCard` uses Tailwind classes extensively (e.g., `rounded-lg`, `bg-purple-50`, `text-sm`). Verify the admin pages include Tailwind in the layout. Check:

**File to check:** `src/routes/admin/+layout.svelte` or `src/app.css`

If Tailwind is available globally (which it should be since the admin pages already use it), no action needed.

### Step 3.3 — Handle BlockItem layout expansion

**File:** `src/lib/components/admin/memorial-editor/BlockItem.svelte`

The `StreamCard` is a large component (~840 lines of rendered HTML). The current `.block-content` area in `BlockItem` has `padding: 0.75rem 1rem` and `flex: 1`. The StreamCard will expand the block item significantly.

**Option A (recommended):** Allow natural expansion — the block item will be taller but all credentials are immediately visible. No CSS changes needed.

**Option B (if too tall):** Add a collapsed/expanded toggle. Defer this to a follow-up if the UI feels too heavy after testing.

For now, **no CSS changes needed** — just let the StreamCard render at full size inside the block item.

---

## Phase 4: Frontend — Update EditLivestreamModal

**Goal:** Since `StreamCard` is now rendered inline in the block, the `EditLivestreamModal` no longer needs to tell users to "go elsewhere." Update it to be a simple confirmation/info modal, or remove the edit action for livestream blocks entirely (since management is inline).

**File:** `src/lib/components/admin/memorial-editor/modals/EditLivestreamModal.svelte`

### Step 4.1 — Update the info-box message

**Current (line 78-80):**
```svelte
<div class="info-box">
    <p>💡 To edit stream details (title, time, credentials), use the Stream Card on this memorial's detail page or the Video Switcher.</p>
</div>
```

**Replace with:**
```svelte
<div class="info-box">
    <p>💡 Stream credentials and controls are displayed directly in the livestream block below. Use the StreamCard controls to manage RTMP credentials, chat, visibility, and embeds.</p>
</div>
```

This is a minimal change. The modal now correctly describes where the controls are.

---

## Phase 5: Testing & Verification

### Step 5.1 — Test livestream block creation (end-to-end)

1. Navigate to an admin memorial detail page
2. Open the block editor
3. Click "+ Add Block" → Select "Livestream"
4. Enter a stream title and optional date/time
5. Click "Add Block"
6. **Verify:**
   - Block appears in the block list
   - `StreamCard` renders inside the block with the purple "OBS Streaming Setup" credential card
   - RTMP Server URL shows `rtmps://global-live.mux.com:443/app`
   - Stream Key is populated (not empty)
   - Copy buttons work for both RTMP URL and Stream Key
   - Status badge shows "scheduled" or "ready"

### Step 5.2 — Test Firestore stream document

After creating a livestream block, check Firestore:

1. Open Firebase Console → Firestore → `streams` collection
2. Find the newly created stream document
3. **Verify it contains:**
   ```json
   {
     "title": "...",
     "memorialId": "...",
     "status": "scheduled",
     "mux": {
       "liveStreamId": "...",
       "playbackId": "...",
       "rtmpUrl": "rtmps://global-live.mux.com:443/app",
       "streamKey": "...",
       "recordingReady": false,
       "streamingStatus": "idle",
       "reconnectWindow": 60
     },
     "chat": {
       "enabled": true,
       "locked": false,
       "archived": false,
       "messageCount": 0,
       "participantCount": 0,
       "moderationMode": "manual"
     }
   }
   ```

### Step 5.3 — Test StreamCard functionality within block

Inside the rendered StreamCard within the block editor:

- [ ] Copy RTMP URL button works
- [ ] Copy Stream Key button works
- [ ] Stream status badge displays correctly
- [ ] Chat toggle button works (if visible)
- [ ] Edit title inline works
- [ ] Edit scheduled time works
- [ ] Embed management section works
- [ ] "Go Live" / stream control buttons work
- [ ] Live detection polling works when stream is active

### Step 5.4 — Test existing streams (backward compatibility)

1. Navigate to a memorial that already has streams created via the old API
2. **Verify:** Existing `StreamCard` instances on the streams page still work
3. **Verify:** If those streams are referenced by existing livestream blocks, the block editor shows the `StreamCard` with credentials

### Step 5.5 — Test error handling

1. Temporarily set invalid Mux credentials (wrong `MUX_TOKEN_SECRET`)
2. Try to create a livestream block
3. **Verify:** Error is caught and displayed to user (not a silent failure)
4. **Verify:** No orphan Firestore document is created (Mux fails before Firestore write)
5. Restore correct credentials

### Step 5.6 — Test block operations with StreamCard

- [ ] Drag-and-drop reorder works with expanded StreamCard blocks
- [ ] Move up/down buttons work
- [ ] Toggle visibility (enabled/disabled) dims the StreamCard appropriately
- [ ] Delete block works (confirm prompt shown)
- [ ] Multiple livestream blocks can coexist in the same memorial

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Mux API rate limiting on rapid block creation | Low | Medium | Mux allows generous rate limits; warn users if creating many streams |
| StreamCard too tall in block list | Medium | Low | Allow natural expansion for now; add collapse toggle in follow-up if needed |
| Mux credentials not available in `.env` | Low | High | Backend returns clear 500 error; document required env vars |
| Existing blocks without `mux` data | N/A | None | Existing blocks show "Stream not found" or bare status — same as current behavior |
| StreamCard Tailwind classes not rendering | Low | High | Verify Tailwind is loaded in admin layout before starting |
| Circular dependency from importing StreamCard into block editor | Low | Medium | StreamCard is in `$lib/components/streaming/`, block editor is in `$lib/components/admin/memorial-editor/` — no circular risk |

---

## File Summary

| Phase | File | Action | Lines Changed (est.) |
|---|---|---|---|
| 1 | `routes/api/memorials/[memorialId]/blocks/livestream/+server.ts` | Add Mux import + `createMuxLiveStream()` call + expand `streamData` | ~40 lines added |
| 2 | `components/admin/memorial-editor/MemorialBlockEditor.svelte` | Pass `memorialId` to `BlockList` | ~1 line |
| 2 | `components/admin/memorial-editor/BlockList.svelte` | Add `memorialId` prop, pass to `BlockItem` | ~3 lines |
| 2 | `components/admin/memorial-editor/BlockItem.svelte` | Add `memorialId` prop, pass to `LivestreamBlock` | ~3 lines |
| 3 | `components/admin/memorial-editor/blocks/LivestreamBlock.svelte` | Replace with `StreamCard` render (full rewrite) | 94 → ~65 lines |
| 4 | `components/admin/memorial-editor/modals/EditLivestreamModal.svelte` | Update info-box message | ~1 line |

**Total estimated changes:** ~6 files, ~110 lines modified/added

---

## Dependency Order

```
Phase 1 (backend) ──→ can be done independently
Phase 2 (thread memorialId) ──→ prerequisite for Phase 3
Phase 3 (StreamCard in block) ──→ depends on Phase 2
Phase 4 (modal update) ──→ can be done independently
Phase 5 (testing) ──→ depends on all phases
```

**Recommended execution order:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phases 1 and 2 can be done in parallel since they touch different files (backend vs frontend component chain). Phase 3 depends on Phase 2 completing first.
