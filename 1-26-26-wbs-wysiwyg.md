# WYSIWYG Memorial Editor - Work Breakdown Structure
## Tributestream Admin Dashboard Refactoring - January 26, 2026

This document outlines the complete implementation plan for transforming the memorial detail page (`/admin/services/memorials/[memorialId]`) into a block-based WYSIWYG editor.

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Phase 1: Data Model & Migration](#3-phase-1-data-model--migration)
4. [Phase 2: API Endpoints](#4-phase-2-api-endpoints)
5. [Phase 3: UI Components](#5-phase-3-ui-components)
6. [Phase 4: Admin Page Refactor](#6-phase-4-admin-page-refactor)
7. [Phase 5: Public Page Integration](#7-phase-5-public-page-integration)
8. [Phase 6: Testing & Rollout](#8-phase-6-testing--rollout)
9. [Timeline Summary](#9-timeline-summary)
10. [Risk Assessment](#10-risk-assessment)

---

## 1. PROJECT OVERVIEW

### 1.1 Current State
The memorial detail page (`+page.svelte`, 1,288 lines) has:
- Fixed, hardcoded section order
- Streams stored in separate `streams` subcollection
- Emergency embeds stored as `emergencyEmbed` field on memorial
- Chat tied to individual streams
- No reordering capability
- No unified content model

### 1.2 Target State
A block-based content system where:
- All content is represented as ordered blocks
- Admins can drag-and-drop to reorder
- Blocks can be enabled/disabled without deletion
- New blocks can be added via dropdown menu
- Public page renders blocks in admin-defined order
- Existing streams migrate to block format

### 1.3 MVP Scope (v1)
**In Scope:**
- 3 block types: `livestream`, `embed`, `text`
- Drag-to-reorder functionality
- Enable/disable toggle per block
- Add/delete blocks
- Modal-based block editing
- Public page block rendering

**Deferred to v2:**
- `chat` as standalone block (currently tied to streams)
- `slideshow` blocks (keep existing slideshow section)
- `title` / `divider` blocks
- Rich text editing (plain text only in v1)
- Undo/redo history
- Block templates
- Visual preview mode

---

## 2. ARCHITECTURE DECISIONS

### 2.1 Data Storage: Array Field vs Subcollection

**Decision:** Use array field `contentBlocks` on memorial document

**Rationale:**
- Atomic updates (reorder all blocks in one write)
- Simpler queries (no joins needed)
- Blocks are tightly coupled to memorial (no standalone use)
- Firestore array operations (`arrayUnion`, `arrayRemove`) available
- Typical memorial has <20 blocks (well under Firestore's 1MB doc limit)

**Trade-offs:**
- ❌ Can't query individual blocks across memorials
- ❌ Large updates when reordering
- ✅ Single read gets all content
- ✅ Easier backup/restore

### 2.2 Stream Migration Strategy

**Decision:** Existing streams BECOME blocks (not referenced)

**Rationale:**
- Unified content model
- Single source of truth for ordering
- Simplifies public page rendering
- Allows streams to be interspersed with other content

**Migration Approach:**
- On first load post-migration, auto-generate blocks from existing streams
- Preserve stream documents for backward compatibility during transition
- Block's `config.streamId` points to stream document
- Stream document remains source of truth for stream-specific data (credentials, status, etc.)

### 2.3 Drag-and-Drop Library

**Decision:** Use `svelte-dnd-action`

**Rationale:**
- Native Svelte integration (no React adapters)
- Lightweight (~8KB)
- Accessible (keyboard support)
- Well-maintained, active community
- Simple API: `use:dndzone`

**Alternative Considered:**
- Native HTML5 drag — Too low-level, poor mobile support
- `@dnd-kit` — React-focused, requires adapter

### 2.4 Block Editing UI

**Decision:** Modal-based editing (not inline)

**Rationale:**
- Simpler implementation for MVP
- Clear edit vs view states
- Consistent UX across block types
- Easier to add validation
- Can upgrade to inline in v2

---

## 3. PHASE 1: DATA MODEL & MIGRATION

### 3.1 Block Type Definitions

**File:** `frontend/src/lib/types/memorial-blocks.ts`

**Task 3.1.1:** Create TypeScript interfaces

```typescript
// Block type enum
export type BlockType = 'livestream' | 'embed' | 'text';

// Base block interface
export interface MemorialBlock {
  id: string;                    // UUID for block identification
  type: BlockType;               // Discriminator for block type
  order: number;                 // Sort order (0-indexed)
  enabled: boolean;              // Show/hide on public page
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  config: LivestreamConfig | EmbedConfig | TextConfig;
}

// Livestream block config
export interface LivestreamConfig {
  streamId: string;              // Reference to stream document
  // Stream data fetched separately, not duplicated here
}

// Embed block config  
export interface EmbedConfig {
  title: string;                 // Display title
  embedCode: string;             // iframe or embed HTML
  embedType: 'video' | 'chat' | 'other';  // For styling/icons
}

// Text block config
export interface TextConfig {
  content: string;               // Plain text (v1) or HTML (v2)
  style: 'paragraph' | 'heading' | 'note';  // Display style
}
```

**Logic:** Strong typing ensures compile-time safety. Discriminated union (`type` field) enables type narrowing in switch statements. Config is polymorphic based on block type.

**Estimated Effort:** 1 hour

---

### 3.2 Firestore Schema Update

**Task 3.2.1:** Add `contentBlocks` field to memorial documents

**Location:** Memorial document in Firestore

**Schema:**
```
memorials/{memorialId}
├── ...existing fields...
├── contentBlocks: MemorialBlock[]  // NEW
└── contentBlocksVersion: number    // NEW - for migration tracking
```

**Logic:** 
- `contentBlocks` stores ordered array of blocks
- `contentBlocksVersion` tracks schema version (start at 1)
- Existing fields remain for backward compatibility during transition

**Estimated Effort:** 30 minutes

---

### 3.3 Migration Script

**File:** `scripts/migrate-streams-to-blocks.ts`

**Task 3.3.1:** Create migration script for existing memorials

**Logic:**
1. Query all memorials
2. For each memorial:
   - Skip if `contentBlocksVersion` already exists
   - Fetch associated streams from subcollection
   - Generate `livestream` blocks from streams (ordered by `scheduledStartTime`)
   - If `emergencyEmbed` exists, add as `embed` block at position 0
   - Set `contentBlocks` array
   - Set `contentBlocksVersion = 1`
3. Log progress and errors
4. Support dry-run mode

**Pseudo-code:**
```typescript
async function migrateMemorial(memorialId: string) {
  const memorial = await getDoc(memorialsRef.doc(memorialId));
  
  if (memorial.data().contentBlocksVersion) {
    return; // Already migrated
  }
  
  const blocks: MemorialBlock[] = [];
  let order = 0;
  
  // Emergency embed becomes first block
  if (memorial.data().emergencyEmbed) {
    blocks.push({
      id: generateUUID(),
      type: 'embed',
      order: order++,
      enabled: true,
      config: {
        title: memorial.data().emergencyEmbed.title,
        embedCode: memorial.data().emergencyEmbed.embedCode,
        embedType: 'video'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  // Streams become blocks
  const streams = await getDocs(streamsRef(memorialId));
  for (const stream of streams.docs) {
    blocks.push({
      id: generateUUID(),
      type: 'livestream',
      order: order++,
      enabled: true,
      config: { streamId: stream.id },
      createdAt: stream.data().createdAt,
      updatedAt: stream.data().updatedAt
    });
  }
  
  await updateDoc(memorialsRef.doc(memorialId), {
    contentBlocks: blocks,
    contentBlocksVersion: 1
  });
}
```

**Estimated Effort:** 3 hours

---

### 3.4 Runtime Migration (Lazy)

**File:** `frontend/src/routes/admin/services/memorials/[memorialId]/+page.server.ts`

**Task 3.4.1:** Add lazy migration in page load

**Logic:**
- When loading memorial detail page, check `contentBlocksVersion`
- If missing or outdated, run migration inline
- Ensures new page works even if batch migration hasn't run
- Prevents need for "big bang" deployment

**Estimated Effort:** 1 hour

---

## 4. PHASE 2: API ENDPOINTS

### 4.1 Block CRUD Endpoints

**Base Path:** `/api/memorials/[memorialId]/blocks`

---

#### 4.1.1 GET /api/memorials/[memorialId]/blocks

**Purpose:** Fetch all blocks for a memorial

**Response:**
```json
{
  "blocks": [
    { "id": "...", "type": "livestream", "order": 0, ... },
    { "id": "...", "type": "text", "order": 1, ... }
  ],
  "version": 1
}
```

**Logic:** 
- Read memorial document
- Return `contentBlocks` array sorted by `order`
- Include `contentBlocksVersion` for cache invalidation

**Auth:** Admin with `memorial:read` permission

**Estimated Effort:** 1 hour

---

#### 4.1.2 POST /api/memorials/[memorialId]/blocks

**Purpose:** Add a new block

**Request:**
```json
{
  "type": "text",
  "config": {
    "content": "Welcome to the memorial service.",
    "style": "paragraph"
  },
  "insertAt": 2  // Optional, defaults to end
}
```

**Response:**
```json
{
  "block": { "id": "new-uuid", "type": "text", "order": 2, ... },
  "blocks": [ /* full updated array */ ]
}
```

**Logic:**
1. Validate block type and config against schema
2. Generate UUID for new block
3. If `insertAt` specified:
   - Insert at that position
   - Increment `order` for all blocks after
4. Else append to end with `order = blocks.length`
5. Set `createdAt`, `updatedAt` to now
6. Update memorial document
7. Return new block and full array

**Auth:** Admin with `memorial:update` permission

**Estimated Effort:** 2 hours

---

#### 4.1.3 PATCH /api/memorials/[memorialId]/blocks/[blockId]

**Purpose:** Update a single block

**Request:**
```json
{
  "enabled": false,
  "config": {
    "content": "Updated text content"
  }
}
```

**Response:**
```json
{
  "block": { "id": "block-id", ... },
  "blocks": [ /* full updated array */ ]
}
```

**Logic:**
1. Find block by ID in array
2. Merge updates (shallow merge for `config`)
3. Update `updatedAt` timestamp
4. Write back to Firestore
5. Return updated block

**Auth:** Admin with `memorial:update` permission

**Estimated Effort:** 1.5 hours

---

#### 4.1.4 DELETE /api/memorials/[memorialId]/blocks/[blockId]

**Purpose:** Remove a block

**Response:**
```json
{
  "deleted": "block-id",
  "blocks": [ /* remaining blocks with recomputed order */ ]
}
```

**Logic:**
1. Find and remove block from array
2. Recompute `order` values (0, 1, 2, ...)
3. If block type is `livestream`, optionally delete stream document (confirm with user)
4. Update memorial document
5. Return remaining blocks

**Auth:** Admin with `memorial:delete` permission

**Estimated Effort:** 1.5 hours

---

#### 4.1.5 POST /api/memorials/[memorialId]/blocks/reorder

**Purpose:** Batch update block order

**Request:**
```json
{
  "order": ["block-3", "block-1", "block-2"]  // Block IDs in new order
}
```

**Response:**
```json
{
  "blocks": [ /* blocks with updated order values */ ]
}
```

**Logic:**
1. Validate all block IDs exist
2. Update `order` field for each block based on array position
3. Update all `updatedAt` timestamps
4. Single atomic write to Firestore
5. Return reordered blocks

**Auth:** Admin with `memorial:update` permission

**Estimated Effort:** 1.5 hours

---

### 4.2 Livestream Block Helpers

#### 4.2.1 POST /api/memorials/[memorialId]/blocks/livestream

**Purpose:** Create livestream + block together

**Request:**
```json
{
  "title": "Memorial Service",
  "scheduledStartTime": "2026-01-28T14:00:00Z",
  "insertAt": 0
}
```

**Logic:**
1. Create stream document in streams subcollection (existing API logic)
2. Create `livestream` block referencing new stream
3. Insert block at specified position
4. Return both stream and block

**Rationale:** Combines two operations into one for better UX. Creating a stream always creates a block.

**Estimated Effort:** 2 hours

---

## 5. PHASE 3: UI COMPONENTS

### 5.1 Component Hierarchy

```
MemorialBlockEditor/
├── MemorialBlockEditor.svelte      # Main container
├── BlockList.svelte                # Drag-and-drop list
├── BlockItem.svelte                # Generic block wrapper
├── blocks/
│   ├── LivestreamBlock.svelte      # Livestream renderer
│   ├── EmbedBlock.svelte           # Embed renderer
│   └── TextBlock.svelte            # Text renderer
├── modals/
│   ├── AddBlockModal.svelte        # Block type selector
│   ├── EditLivestreamModal.svelte  # Stream editor
│   ├── EditEmbedModal.svelte       # Embed editor
│   └── EditTextModal.svelte        # Text editor
└── BlockToolbar.svelte             # Add block button
```

---

### 5.2 Core Components

#### 5.2.1 MemorialBlockEditor.svelte

**File:** `frontend/src/lib/components/admin/memorial-editor/MemorialBlockEditor.svelte`

**Purpose:** Main container that orchestrates block list and modals

**Props:**
```typescript
{
  memorialId: string;
  initialBlocks: MemorialBlock[];
  streams: Stream[];  // For resolving livestream blocks
}
```

**State:**
```typescript
let blocks = $state<MemorialBlock[]>(initialBlocks);
let editingBlock = $state<MemorialBlock | null>(null);
let showAddModal = $state(false);
let isSaving = $state(false);
```

**Logic:**
- Manages block array state
- Handles drag-end events → calls reorder API
- Opens/closes modals
- Shows save indicator

**Estimated Effort:** 3 hours

---

#### 5.2.2 BlockList.svelte

**File:** `frontend/src/lib/components/admin/memorial-editor/BlockList.svelte`

**Purpose:** Renders sortable list of blocks using `svelte-dnd-action`

**Props:**
```typescript
{
  blocks: MemorialBlock[];
  streams: Stream[];
  onReorder: (newOrder: string[]) => void;
  onEdit: (block: MemorialBlock) => void;
  onToggle: (blockId: string, enabled: boolean) => void;
  onDelete: (blockId: string) => void;
}
```

**Template Structure:**
```svelte
<script>
  import { dndzone } from 'svelte-dnd-action';
  
  function handleDndConsider(e) {
    blocks = e.detail.items;
  }
  
  function handleDndFinalize(e) {
    blocks = e.detail.items;
    onReorder(blocks.map(b => b.id));
  }
</script>

<div 
  use:dndzone={{ items: blocks, flipDurationMs: 200 }}
  on:consider={handleDndConsider}
  on:finalize={handleDndFinalize}
  class="block-list"
>
  {#each blocks as block (block.id)}
    <BlockItem 
      {block} 
      stream={block.type === 'livestream' ? findStream(block.config.streamId) : null}
      onEdit={() => onEdit(block)}
      onToggle={(enabled) => onToggle(block.id, enabled)}
      onDelete={() => onDelete(block.id)}
    />
  {/each}
</div>
```

**Estimated Effort:** 2 hours

---

#### 5.2.3 BlockItem.svelte

**File:** `frontend/src/lib/components/admin/memorial-editor/BlockItem.svelte`

**Purpose:** Generic block wrapper with drag handle, toggle, actions

**Props:**
```typescript
{
  block: MemorialBlock;
  stream?: Stream;  // Only for livestream blocks
  onEdit: () => void;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}
```

**Visual Structure:**
```
┌─────────────────────────────────────────────────────┐
│ ⋮⋮  [icon] Block Title                    [👁️] [✏️] [🗑️] │
│     ─────────────────────────────────────────────── │
│     Block-specific content preview                  │
│     (LivestreamBlock / EmbedBlock / TextBlock)      │
└─────────────────────────────────────────────────────┘
```

**Logic:**
- Renders drag handle (`⋮⋮`)
- Shows block type icon (📹/🔗/📝)
- Toggle button (👁️) calls `onToggle`
- Edit button (✏️) calls `onEdit`
- Delete button (🗑️) calls `onDelete` with confirmation
- Delegates content rendering to type-specific component
- Dimmed styling when `enabled: false`

**Estimated Effort:** 2 hours

---

#### 5.2.4 LivestreamBlock.svelte

**File:** `frontend/src/lib/components/admin/memorial-editor/blocks/LivestreamBlock.svelte`

**Purpose:** Renders livestream block content preview

**Props:**
```typescript
{
  block: MemorialBlock;
  stream: Stream;
}
```

**Displays:**
- Stream title
- Status badge (scheduled/live/completed)
- Scheduled time
- Thumbnail (if available)

**Logic:** Minimal — just display. Full StreamCard functionality accessed via edit modal.

**Estimated Effort:** 1 hour

---

#### 5.2.5 EmbedBlock.svelte

**File:** `frontend/src/lib/components/admin/memorial-editor/blocks/EmbedBlock.svelte`

**Purpose:** Renders embed block preview

**Props:**
```typescript
{
  block: MemorialBlock;
}
```

**Displays:**
- Embed title
- Embed type badge (video/chat/other)
- Truncated embed code preview
- Optional: Live preview iframe (small)

**Estimated Effort:** 1 hour

---

#### 5.2.6 TextBlock.svelte

**File:** `frontend/src/lib/components/admin/memorial-editor/blocks/TextBlock.svelte`

**Purpose:** Renders text block preview

**Props:**
```typescript
{
  block: MemorialBlock;
}
```

**Displays:**
- Text content (truncated to ~200 chars)
- Style indicator (paragraph/heading/note)

**Estimated Effort:** 45 minutes

---

### 5.3 Modal Components

#### 5.3.1 AddBlockModal.svelte

**Purpose:** Block type selector when adding new block

**Options:**
- 📹 **Livestream** — "Add a new scheduled livestream"
- 🔗 **Embed** — "Add external video/chat embed (YouTube, Vimeo, etc.)"
- 📝 **Text** — "Add a text message or announcement"

**Logic:**
- On selection, either:
  - Open type-specific edit modal for new block
  - Or for livestream, open stream creation form

**Estimated Effort:** 1 hour

---

#### 5.3.2 EditLivestreamModal.svelte

**Purpose:** Edit stream details for a livestream block

**Contains:**
- Stream title input
- Scheduled date/time picker
- Status display (read-only)
- Link to full StreamCard/credentials

**Logic:** Wraps existing stream editing functionality. Updates both stream doc and block's `updatedAt`.

**Estimated Effort:** 2 hours

---

#### 5.3.3 EditEmbedModal.svelte

**Purpose:** Edit embed code for an embed block

**Contains:**
- Title input
- Embed type selector (video/chat/other)
- Embed code textarea
- Live preview iframe
- Help text with examples

**Estimated Effort:** 1.5 hours

---

#### 5.3.4 EditTextModal.svelte

**Purpose:** Edit text content for a text block

**Contains:**
- Style selector (paragraph/heading/note)
- Text content textarea
- Character count
- Preview

**Estimated Effort:** 1 hour

---

### 5.4 Toolbar Component

#### 5.4.1 BlockToolbar.svelte

**Purpose:** Floating or fixed toolbar with "Add Block" button

**Contains:**
- "+ Add Block" button → opens AddBlockModal
- Optional: Filter/search blocks (v2)
- Optional: View mode toggle (v2)

**Estimated Effort:** 45 minutes

---

## 6. PHASE 4: ADMIN PAGE REFACTOR

### 6.1 Page Structure Changes

**File:** `frontend/src/routes/admin/services/memorials/[memorialId]/+page.svelte`

#### 6.1.1 Replace Static Sections with Block Editor

**Current (lines 534-755):**
```svelte
<!-- Hardcoded livestreams section -->
<div class="card">
  <h2>📹 Livestreams ({streams.length})</h2>
  <!-- Stream form, emergency embed, stream cards -->
</div>
```

**After:**
```svelte
<!-- Dynamic block editor -->
<div class="card">
  <div class="section-header">
    <h2>📦 Memorial Content</h2>
    <p class="subtitle">Drag blocks to reorder. Changes save automatically.</p>
  </div>
  
  <MemorialBlockEditor
    memorialId={memorial.id}
    initialBlocks={memorial.contentBlocks || []}
    streams={streams}
    onSave={handleBlocksSaved}
  />
</div>
```

**Logic:**
- Remove hardcoded livestreams section
- Remove emergency embed section (now a block type)
- Keep: Basic info, Display settings, Pricing, Schedule, Analytics, Slideshows
- Add: MemorialBlockEditor component

**Estimated Effort:** 3 hours

---

#### 6.1.2 Update Page Server Load

**File:** `frontend/src/routes/admin/services/memorials/[memorialId]/+page.server.ts`

**Changes:**
- Run lazy migration if `contentBlocksVersion` missing
- Return `contentBlocks` in page data
- Continue returning `streams` for block resolution

**Estimated Effort:** 1 hour

---

### 6.2 Remove Deprecated UI

#### 6.2.1 Elements to Remove/Refactor

| Element | Current Location | Action |
|---------|-----------------|--------|
| Stream creation form | Lines 683-734 | Move to `AddBlockModal` |
| Emergency embed form | Lines 570-621 | Replace with `EmbedBlock` |
| Emergency chat embed | Lines 637-681 | Replace with `EmbedBlock` |
| Delete stream button | Lines 745-751 | Move to `BlockItem` actions |
| Stream cards list | Lines 741-754 | Replace with `BlockList` |

**Estimated Effort:** 2 hours

---

## 7. PHASE 5: PUBLIC PAGE INTEGRATION

### 7.1 Public Memorial Page Updates

**File:** `frontend/src/routes/[username]/[memorialSlug]/+page.svelte`

#### 7.1.1 Block Renderer Component

**File:** `frontend/src/lib/components/memorial/BlockRenderer.svelte`

**Purpose:** Renders blocks in order for public memorial page

**Props:**
```typescript
{
  blocks: MemorialBlock[];
  streams: Stream[];
  memorial: Memorial;
}
```

**Logic:**
```svelte
{#each enabledBlocks as block (block.id)}
  {#if block.type === 'livestream'}
    <StreamPlayer stream={findStream(block.config.streamId)} />
  {:else if block.type === 'embed'}
    <EmbedRenderer embedCode={block.config.embedCode} title={block.config.title} />
  {:else if block.type === 'text'}
    <TextRenderer content={block.config.content} style={block.config.style} />
  {/if}
{/each}
```

**Filtering:**
- Only render blocks where `enabled: true`
- Sort by `order` ascending

**Estimated Effort:** 3 hours

---

#### 7.1.2 Embed Renderer Component

**File:** `frontend/src/lib/components/memorial/EmbedRenderer.svelte`

**Purpose:** Safely renders embed iframes on public page

**Security:**
- Sanitize embed code (allow only iframe tags)
- Whitelist allowed domains (YouTube, Vimeo, etc.)
- Add sandbox attributes for security

**Estimated Effort:** 2 hours

---

#### 7.1.3 Text Renderer Component

**File:** `frontend/src/lib/components/memorial/TextRenderer.svelte`

**Purpose:** Renders text blocks with appropriate styling

**Styles:**
- `paragraph` — Normal body text
- `heading` — Larger, bold text
- `note` — Styled card with background

**Estimated Effort:** 1 hour

---

### 7.2 Page Server Load Updates

**File:** `frontend/src/routes/[username]/[memorialSlug]/+page.server.ts`

**Changes:**
- Load `contentBlocks` from memorial
- Filter to `enabled: true` blocks
- Sort by `order`
- Continue loading streams for block resolution

**Estimated Effort:** 1 hour

---

## 8. PHASE 6: TESTING & ROLLOUT

### 8.1 Unit Tests

#### 8.1.1 Block Type Utilities

**File:** `frontend/src/lib/utils/block-utils.test.ts`

**Test Cases:**
- `sortBlocksByOrder()` — Correct ordering
- `generateBlockId()` — UUID format
- `validateBlockConfig()` — Type-specific validation
- `recomputeOrder()` — Correct order after delete

**Estimated Effort:** 2 hours

---

#### 8.1.2 API Endpoint Tests

**Test Cases per endpoint:**
- Happy path
- Invalid block type
- Block not found
- Permission denied
- Concurrent update handling

**Estimated Effort:** 4 hours

---

### 8.2 Integration Tests

#### 8.2.1 Block Editor E2E

**Scenarios:**
1. Add livestream block → verify stream created
2. Add embed block → verify renders on public page
3. Reorder blocks → verify new order persists
4. Disable block → verify hidden on public page
5. Delete block → verify removed

**Estimated Effort:** 4 hours

---

### 8.3 Migration Testing

#### 8.3.1 Test Migration Script

**Test Cases:**
- Memorial with 0 streams → empty blocks array
- Memorial with 3 streams → 3 livestream blocks
- Memorial with emergency embed → embed block at position 0
- Already-migrated memorial → skip
- Dry-run mode → no writes

**Estimated Effort:** 2 hours

---

### 8.4 Rollout Plan

#### 8.4.1 Phase A: Internal Testing (Day 1-2)
- Deploy to staging
- Test with 5 existing memorials
- Verify migration script
- Fix bugs

#### 8.4.2 Phase B: Limited Rollout (Day 3-5)
- Deploy to production
- Run migration on 10% of memorials
- Monitor for errors
- Gather admin feedback

#### 8.4.3 Phase C: Full Rollout (Day 6-7)
- Run migration on remaining memorials
- Enable for all admins
- Monitor performance
- Document known issues

#### 8.4.4 Phase D: Cleanup (Week 2)
- Remove deprecated emergency embed UI
- Update documentation
- Archive old code paths

---

## 9. TIMELINE SUMMARY

### Week 1: Foundation

| Day | Tasks | Hours |
|-----|-------|-------|
| Mon | 3.1 Type definitions, 3.2 Schema update | 1.5 |
| Mon | 3.3 Migration script | 3 |
| Tue | 4.1.1-4.1.3 GET/POST/PATCH endpoints | 4.5 |
| Wed | 4.1.4-4.1.5 DELETE/Reorder endpoints | 3 |
| Wed | 4.2.1 Livestream helper endpoint | 2 |
| Thu | 5.2.1-5.2.2 MemorialBlockEditor, BlockList | 5 |
| Fri | 5.2.3-5.2.6 BlockItem + type renderers | 4.75 |

**Week 1 Total: ~24 hours**

### Week 2: UI & Integration

| Day | Tasks | Hours |
|-----|-------|-------|
| Mon | 5.3.1-5.3.4 Modal components | 5.5 |
| Mon | 5.4.1 BlockToolbar | 0.75 |
| Tue | 6.1.1-6.1.2 Admin page refactor | 4 |
| Tue | 6.2.1 Remove deprecated UI | 2 |
| Wed | 7.1.1-7.1.3 Public page components | 6 |
| Wed | 7.2 Public page server load | 1 |
| Thu | 8.1-8.2 Unit and integration tests | 10 |
| Fri | 8.3-8.4 Migration testing, rollout | 4 |

**Week 2 Total: ~33 hours**

### Total Estimated Effort: ~57 hours

---

## 10. RISK ASSESSMENT

### 10.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Migration corrupts data | Low | High | Dry-run mode, backups, lazy migration fallback |
| Drag-drop performance with many blocks | Low | Medium | Virtual list if >50 blocks (unlikely) |
| Embed security vulnerabilities | Medium | High | Sanitize HTML, whitelist domains, sandbox iframes |
| Concurrent edit conflicts | Medium | Medium | Last-write-wins, add optimistic locking in v2 |

### 10.2 UX Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Admins confused by new UI | Medium | Medium | Training docs, tooltips, gradual rollout |
| Accidental block deletion | Medium | Low | Confirmation dialog, soft-delete option |
| Block ordering not obvious | Low | Low | Clear drag handles, visual feedback |

### 10.3 Rollback Plan

If critical issues found post-deploy:
1. Disable block editor via feature flag
2. Revert to static section UI
3. Keep `contentBlocks` data (don't delete)
4. Fix issues
5. Re-enable with fixes

---

## APPENDIX A: FILE MANIFEST

### New Files

```
frontend/src/lib/
├── types/
│   └── memorial-blocks.ts                    # Type definitions
├── utils/
│   └── block-utils.ts                        # Block helper functions
├── components/
│   └── admin/
│       └── memorial-editor/
│           ├── MemorialBlockEditor.svelte    # Main container
│           ├── BlockList.svelte              # Drag-drop list
│           ├── BlockItem.svelte              # Block wrapper
│           ├── BlockToolbar.svelte           # Add button
│           ├── blocks/
│           │   ├── LivestreamBlock.svelte
│           │   ├── EmbedBlock.svelte
│           │   └── TextBlock.svelte
│           └── modals/
│               ├── AddBlockModal.svelte
│               ├── EditLivestreamModal.svelte
│               ├── EditEmbedModal.svelte
│               └── EditTextModal.svelte
│   └── memorial/
│       ├── BlockRenderer.svelte              # Public page renderer
│       ├── EmbedRenderer.svelte              # Embed display
│       └── TextRenderer.svelte               # Text display

frontend/src/routes/api/memorials/[memorialId]/blocks/
├── +server.ts                                # GET, POST
├── [blockId]/
│   └── +server.ts                            # PATCH, DELETE
├── reorder/
│   └── +server.ts                            # POST
└── livestream/
    └── +server.ts                            # POST (create stream + block)

scripts/
└── migrate-streams-to-blocks.ts              # Migration script
```

### Modified Files

```
frontend/src/routes/admin/services/memorials/[memorialId]/
├── +page.svelte                              # Add block editor, remove hardcoded sections
└── +page.server.ts                           # Add lazy migration, return contentBlocks

frontend/src/routes/[username]/[memorialSlug]/
├── +page.svelte                              # Use BlockRenderer
└── +page.server.ts                           # Load and filter blocks
```

---

## APPENDIX B: DEPENDENCIES

### New NPM Packages

```json
{
  "svelte-dnd-action": "^0.9.x"   // Drag-and-drop
}
```

### Existing Dependencies Used

- `uuid` — Block ID generation (already installed)
- Firestore SDK — Data storage (already installed)

---

**Document Version:** 1.0  
**Created:** January 26, 2026  
**Author:** Development Team  
**Status:** Ready for Implementation
