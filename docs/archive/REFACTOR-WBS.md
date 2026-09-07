# Block-Only Memorial Manager — Work Breakdown Structure

Consolidate the admin memorial detail page into a block-driven content manager. Remove all emergency/piecemeal UI. The block editor becomes the single interface for managing memorial page content.

**Svelte 5 conventions used throughout:**
- `$state()` for mutable local state
- `$derived()` for computed values (never `$:`)
- `$props()` with `interface Props` for component inputs
- `$effect()` for side effects (never `onMount` for reactive dependencies)
- Event callbacks via props (e.g., `onSave`, `onReorder`), never `createEventDispatcher`
- `onclick={handler}` attribute syntax (not `on:click`)

---

## Phase 1: Strip the Admin Detail Page

**Goal:** Remove ~350 lines of duplicate content-management UI from the admin detail page, leaving the block editor as the sole content interface.

**File:** `src/routes/admin/services/memorials/[memorialId]/+page.svelte` (1479 lines → ~1100 lines)

### Step 1.1 — Remove emergency/video/stream state variables

**Lines 38–69** — Delete these `$state()` declarations:

```
// Lines 38-43: Stream creation state (moves into block editor)
let showStreamForm = $state(false);
let streamTitle = $state('');
let streamDate = $state('');
let streamTime = $state('');
let isCreatingStream = $state(false);

// Lines 45-49: Emergency embed state (replaced by embed blocks)
let showEmergencyEmbed = $state(false);
let embedCode = $state('');
let embedTitle = $state('');
let isCreatingEmbed = $state(false);

// Lines 51-55: Emergency chat embed state (replaced by embed blocks)
let showEmergencyChatEmbed = $state(false);
let chatEmbedCode = $state('');
let chatEmbedTitle = $state('');
let isCreatingChatEmbed = $state(false);

// Lines 65-69: Video file state (replaced by embed blocks)
let showVideoFileForm = $state(false);
let videoFileUrl = $state('');
let videoFileTitle = $state('');
let isAddingVideoFile = $state(false);
```

**Keep:** Lines 57-63 (display settings state), but remove `publicNoteInput` (line 63) — publicNote becomes a text block.

### Step 1.2 — Remove handler functions for removed features

Delete these functions entirely:

| Function | Lines | Replacement |
|---|---|---|
| `handleCreateStream()` | 122–163 | Block editor's "Add Livestream" block |
| `cancelStreamForm()` | 165–170 | N/A |
| `handleDeleteStream()` | 172–196 | Block editor delete button |
| `handleCreateEmergencyEmbed()` | 198–229 | Block editor "Add Embed" block |
| `cancelEmbedForm()` | 231–235 | N/A |
| `handleCreateEmergencyChatEmbed()` | 238–271 | Block editor "Add Embed" (type: chat) |
| `cancelChatEmbedForm()` | 273–277 | N/A |
| `handleRemoveEmergencyChatEmbed()` | 279–300 | Block editor delete |
| `handleRemoveEmergencyEmbed()` | 378–400 | Block editor delete |
| `handleAddVideoFile()` | 403–443 | Block editor "Add Embed" |
| `cancelVideoFileForm()` | 445–449 | N/A |
| `handleRemoveVideoFile()` | 451–472 | Block editor delete |

**Keep:** `handleDelete()` (memorial delete), `handlePricingUpdate()`, display settings handlers.

### Step 1.3 — Simplify Display Settings (remove publicNote)

**Lines 553–564** — Remove the `publicNote` textarea from the edit form. Keep only the `customTitle` input (lines 539–551).

**Lines 601–608** — Remove the publicNote preview row.

**Lines 302–335** — In `handleSaveDisplaySettings()`, remove `publicNote` from the API body (line 314). Only send `customTitle`.

**Lines 337–342** — In `cancelDisplayEdit()`, remove `publicNoteInput` reset (line 340).

### Step 1.4 — Replace the Livestreams card with a streamlined block-only section

**Lines 630–932** — This entire `<div class="card">` section (the "Livestreams" card) gets replaced. Currently it contains:
- Section header with 5 buttons (lines 631–653)
- Active emergency embed indicator (lines 655–667)
- Emergency embed form (lines 669–720)
- Active emergency chat embed indicator (lines 722–734)
- Emergency chat embed form (lines 736–780)
- Active video file indicator (lines 782–812)
- Video file form (lines 814–858)
- Standalone create stream form (lines 860–912)
- Empty state message (lines 914–916)
- Stream cards with delete buttons (lines 918–931)

**Replace with:** A smaller "Livestream Info" card that only shows the Video Switcher link and a read-only list of streams (for reference). Stream CRUD is handled by the block editor. Something like:

```svelte
<!-- Livestream Info (read-only reference) -->
{#if streams.length > 0}
  <div class="card">
    <div class="section-header">
      <h2>📹 Livestreams ({streams.length})</h2>
      <button
        class="switcher-btn"
        onclick={() => goto(`/admin/services/memorials/${memorial.id}/switcher`)}
      >
        🎬 Open Video Switcher
      </button>
    </div>
    <div class="streams-grid">
      {#each streams as stream}
        <StreamCard {stream} canManage={true} memorialId={memorial.id} />
      {/each}
    </div>
  </div>
{/if}
```

This keeps stream management (credentials, RTMP keys, status) visible but removes all content-layout controls.

### Step 1.5 — Remove unused CSS

**Lines 1000–1478** — Delete styles for removed elements:
- `.emergency-btn`, `.chat-emergency-btn`, `.video-file-btn` button styles (lines 1024–1031)
- `.stream-form` (line 1042–1043)
- `.emergency-form`, `.info-text`, `.warning-box` (lines 1046–1049)
- `.emergency-embed-active`, `.emergency-header`, `.warning-text` (lines 1051–1057)
- `.video-file-form`, `.video-file-active`, `.video-preview`, `.video-player`, `.video-actions`, `.download-btn` (lines 1059–1067)
- `.delete-stream-btn` (lines 1096–1119)
- `.note-preview` (lines 1278–1287) — publicNote removed

**Keep:** `.card`, `.section-header`, `.button-group`, `.form-group`, `.form-actions`, `.streams-grid`, `.stream-item` (simplified), `.chat-panels`, `.slideshows-list`, display settings styles.

### Step 1.6 — Remove unused imports

**Line 3** — `StreamCard` import stays (still used in read-only stream list).

No other imports need removal since the removed features were inline.

### Step 1.7 — Verify: Svelte 5 patterns

After all edits, confirm:
- All remaining state uses `$state()` (no `let x;` without rune)
- All computed values use `$derived()` (no `$:`)
- All event handlers use `onclick={fn}` (no `on:click`)
- Props use `$props()` with typed interface
- No unused variables (run `svelte-check`)

---

## Phase 2: Clean Up Block Editor UX

**Goal:** Remove orphan sync, add move-up/move-down buttons for simpler reordering alongside existing drag-and-drop.

### Step 2.1 — Remove orphan sync from MemorialBlockEditor

**File:** `src/lib/components/admin/memorial-editor/MemorialBlockEditor.svelte`

- **Line 3:** Remove `hasStreamBlock` from import
- **Line 25:** Remove `let isSyncing = $state(false);`
- **Lines 33–36:** Remove `orphanCount` derived:
  ```typescript
  let orphanCount = $derived(() => {
    return streams.filter(s => !hasStreamBlock(blocks, s.id)).length;
  });
  ```
- **Lines 207–234:** Remove `handleSync()` function entirely
- **Lines 239–244:** Update `BlockToolbar` usage — remove `orphanCount`, `onSync`, `isSyncing` props:
  ```svelte
  <!-- Before -->
  <BlockToolbar
    onAdd={() => showAddModal = true}
    orphanCount={orphanCount()}
    onSync={handleSync}
    {isSyncing}
  />

  <!-- After -->
  <BlockToolbar onAdd={() => showAddModal = true} />
  ```

### Step 2.2 — Simplify BlockToolbar

**File:** `src/lib/components/admin/memorial-editor/BlockToolbar.svelte`

Remove `orphanCount`, `onSync`, `isSyncing` props and the sync button. Keep only `onAdd`.

**Current Props interface (lines ~5-11):**
```typescript
interface Props {
  onAdd: () => void;
  orphanCount: number;
  onSync: () => void;
  isSyncing: boolean;
}
```

**New Props interface:**
```typescript
interface Props {
  onAdd: () => void;
}
```

Remove the "Import X Streams" button from the template (lines ~40-60).

### Step 2.3 — Add move-up/move-down to BlockItem

**File:** `src/lib/components/admin/memorial-editor/BlockItem.svelte`

Add `onMoveUp` and `onMoveDown` optional callback props, plus `isFirst` and `isLast` booleans:

```typescript
interface Props {
  block: MemorialBlock;
  stream?: any;
  onEdit: (block: MemorialBlock) => void;
  onToggle: (blockId: string, enabled: boolean) => void;
  onDelete: (blockId: string) => void;
  onMoveUp?: (blockId: string) => void;    // NEW
  onMoveDown?: (blockId: string) => void;   // NEW
  isFirst?: boolean;                         // NEW
  isLast?: boolean;                          // NEW
}
```

Add ▲/▼ buttons in the action bar (next to the existing edit/toggle/delete buttons):

```svelte
<div class="actions">
  {#if onMoveUp && !isFirst}
    <button class="move-btn" onclick={() => onMoveUp(block.id)} title="Move up">▲</button>
  {/if}
  {#if onMoveDown && !isLast}
    <button class="move-btn" onclick={() => onMoveDown(block.id)} title="Move down">▼</button>
  {/if}
  <!-- existing toggle, edit, delete buttons -->
</div>
```

### Step 2.4 — Wire move callbacks through BlockList

**File:** `src/lib/components/admin/memorial-editor/BlockList.svelte`

Add `onMoveUp` and `onMoveDown` props, pass them plus `isFirst`/`isLast` to each `BlockItem`:

```svelte
{#each items as item, index (item.id)}
  <div ...>
    <BlockItem
      block={item}
      stream={findStream?.((item.config as any).streamId)}
      onEdit={onEdit}
      onToggle={onToggle}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      isFirst={index === 0}
      isLast={index === items.length - 1}
    />
  </div>
{/each}
```

### Step 2.5 — Implement move logic in MemorialBlockEditor

**File:** `src/lib/components/admin/memorial-editor/MemorialBlockEditor.svelte`

Add `handleMoveUp` and `handleMoveDown` functions that reorder and call `handleReorder`:

```typescript
function handleMoveUp(blockId: string) {
  const idx = blocks.findIndex(b => b.id === blockId);
  if (idx <= 0) return;
  const newOrder = blocks.map(b => b.id);
  [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
  handleReorder(newOrder);
}

function handleMoveDown(blockId: string) {
  const idx = blocks.findIndex(b => b.id === blockId);
  if (idx < 0 || idx >= blocks.length - 1) return;
  const newOrder = blocks.map(b => b.id);
  [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
  handleReorder(newOrder);
}
```

Pass to `BlockList`:
```svelte
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
```

---

## Phase 3: Public Page Simplification

**Goal:** Remove standalone `publicNote` rendering. The block system renders all content.

### Step 3.1 — Remove publicNote card from public page

**File:** `src/routes/[fullSlug]/+page.svelte`

Remove both instances of the publicNote card:

**Lines 322–329** (legacy layout):
```svelte
<!-- Remove this block -->
{#if (memorial as any).publicNote}
  <div class="public-note-card">
    <div class="public-note-content">
      {@html (memorial as any).publicNote}
    </div>
  </div>
{/if}
```

**Lines 442–448** (standard layout) — Same block, remove it.

**Lines 615–664** — Remove `.public-note-card` and `.public-note-content` CSS rules.

### Step 3.2 — Remove emergencyEmbed/emergencyChatEmbed from fallback path

**File:** `src/routes/[fullSlug]/+page.svelte`

In the `MemorialStreamDisplay` fallback (lines 313–318 and 432–438), remove the `emergencyEmbed` and `emergencyChatEmbed` props:

```svelte
<!-- Before -->
<MemorialStreamDisplay
  streams={streams || []}
  memorialName={...}
  emergencyEmbed={memorial.emergencyEmbed}
  emergencyChatEmbed={memorial.emergencyChatEmbed}
/>

<!-- After -->
<MemorialStreamDisplay
  streams={streams || []}
  memorialName={...}
/>
```

> **Note:** This means old memorials without blocks will lose emergency embed display. If backward compat is critical, defer this step and leave the props in place until all memorials are migrated (Phase 5).

### Step 3.3 — No changes to BlockRenderer

**File:** `src/lib/components/memorial/BlockRenderer.svelte`

This file stays as-is. It already correctly renders:
- `livestream` blocks → `MemorialStreamDisplay` (which handles live/scheduled/recorded/chat)
- `embed` blocks → `EmbedRenderer`
- `text` blocks → `TextRenderer`

---

## Phase 4: Server-Side Cleanup

**Goal:** Stop loading deprecated fields in admin, deprecate unused API routes.

### Step 4.1 — Clean up admin page.server.ts

**File:** `src/routes/admin/services/memorials/[memorialId]/+page.server.ts`

Remove processing of `emergencyEmbed`, `emergencyChatEmbed`, and `videoFile` from the returned memorial object. These fields can remain in Firestore but the admin UI won't use them.

Find where these are extracted from `memorialData` and remove them from the return object. Leave `publicNote` in the return (for migration reference) but mark with a `// DEPRECATED` comment.

### Step 4.2 — Deprecate API routes (do NOT delete)

Add a `// DEPRECATED` comment header to these files. They still work for backward compat but are no longer called by the admin UI:

| File | Reason |
|---|---|
| `src/routes/api/memorials/[memorialId]/emergency-embed/+server.ts` | Replaced by embed blocks |
| `src/routes/api/memorials/[memorialId]/emergency-chat-embed/+server.ts` | Replaced by embed blocks |
| `src/routes/api/memorials/[memorialId]/video-file/+server.ts` | Replaced by embed blocks |
| `src/routes/api/memorials/[memorialId]/blocks/sync/+server.ts` | Orphan sync no longer needed |

### Step 4.3 — Clean up display-settings API

**File:** `src/routes/api/admin/memorials/[id]/display-settings/+server.ts`

Remove `publicNote` handling from the POST handler. Only accept `customTitle`.

### Step 4.4 — Remove orphan utilities from block-utils

**File:** `src/lib/utils/block-utils.ts`

Remove `hasStreamBlock()` function (used only by removed orphan sync logic). Keep all other utilities.

### Step 4.5 — Remove deprecated fields from Memorial type

**File:** `src/lib/types/memorial.ts`

Mark `emergencyEmbed`, `emergencyChatEmbed`, `videoFile`, and `publicNote` as `@deprecated` with JSDoc:

```typescript
/** @deprecated Use contentBlocks with embed type instead */
emergencyEmbed?: { ... } | null;
```

Do NOT delete yet — Firestore docs still have these fields.

---

## Phase 5: Data Migration

**Goal:** Convert existing emergency embeds, video files, and public notes into proper content blocks so no memorial loses content.

### Step 5.1 — Create migration script

**File:** `scripts/migrate-to-blocks.js` (new)

Script logic:
1. Query all memorials from Firestore
2. For each memorial with `emergencyEmbed` and no matching embed block:
   - Create an embed block: `{ type: 'embed', config: { title, embedCode, embedType: 'video' } }`
   - Prepend to `contentBlocks` array
3. For each memorial with `emergencyChatEmbed` and no matching embed block:
   - Create an embed block: `{ type: 'embed', config: { title, embedCode, embedType: 'chat' } }`
   - Append after any video embed block
4. For each memorial with `videoFile` and no matching embed block:
   - Create an embed block: `{ type: 'embed', config: { title, embedCode: videoFile.url, embedType: 'video' } }`
5. For each memorial with `publicNote` and no matching text block:
   - Create a text block: `{ type: 'text', config: { content: publicNote, style: 'note' } }`
   - Append to end of `contentBlocks`
6. Run the existing `/blocks/sync` logic to create blocks for orphan streams
7. Log all changes, support `--dry-run` flag

### Step 5.2 — Run migration

```bash
node scripts/migrate-to-blocks.js --dry-run   # Preview
node scripts/migrate-to-blocks.js              # Execute
```

### Step 5.3 — Verify migration

After running:
- Check several memorials in admin — all content should appear in block editor
- Check public pages — same content rendered via BlockRenderer
- Confirm no orphan streams remain

---

## Verification Checklist

After all phases:

- [ ] Admin detail page loads without errors
- [ ] Can create a livestream via block editor "Add Block → Livestream"
- [ ] Can create an embed block (YouTube/Vimeo URL or iframe)
- [ ] Can create a text block (heading, paragraph, note)
- [ ] Can reorder blocks via drag-and-drop
- [ ] Can reorder blocks via ▲/▼ buttons
- [ ] Can toggle block visibility (enabled/disabled)
- [ ] Can edit any block type
- [ ] Can delete any block
- [ ] Video Switcher link still works
- [ ] Chat moderation panel still works for each stream
- [ ] Public memorial page renders all block types correctly
- [ ] Livestream blocks show live video + chat when stream is active
- [ ] Livestream blocks show VOD + archived chat when stream is completed
- [ ] Embed blocks render external URLs/iframes correctly
- [ ] Text blocks render heading/paragraph/note styles correctly
- [ ] No emergency embed, emergency chat, video file, or publicNote UI remains in admin
- [ ] `svelte-check` passes with no errors
- [ ] No unused imports or state variables

---

## File Summary

| Phase | File | Action |
|---|---|---|
| 1 | `[memorialId]/+page.svelte` | Remove ~350 lines (emergency/video/stream forms + handlers + CSS) |
| 1 | `[memorialId]/+page.svelte` | Simplify display settings (remove publicNote) |
| 2 | `MemorialBlockEditor.svelte` | Remove orphan sync, add move callbacks |
| 2 | `BlockToolbar.svelte` | Remove sync button + props |
| 2 | `BlockItem.svelte` | Add ▲/▼ move buttons |
| 2 | `BlockList.svelte` | Pass move callbacks + isFirst/isLast |
| 3 | `[fullSlug]/+page.svelte` | Remove publicNote cards, optionally remove emergency props |
| 4 | `[memorialId]/+page.server.ts` | Stop loading deprecated fields |
| 4 | `block-utils.ts` | Remove `hasStreamBlock()` |
| 4 | `memorial.ts` | Mark deprecated fields |
| 4 | 4 API route files | Add `// DEPRECATED` headers |
| 4 | `display-settings/+server.ts` | Remove publicNote handling |
| 5 | `scripts/migrate-to-blocks.js` | New migration script |
