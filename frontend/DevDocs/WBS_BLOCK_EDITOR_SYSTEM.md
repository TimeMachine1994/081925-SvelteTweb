# WBS: Memorial Block Editor System

**Date:** February 17, 2026  
**Last Updated:** February 26, 2026  
**Status:** Implemented (Production)  
**Version:** 1.1 — Added text block customization (font color, size, line height, alignment)  
**Replaces:** Emergency Embed, Emergency Chat Embed, Public Note, Inline Stream Creation

---

## 1. Executive Summary

The Memorial Block Editor is a WYSIWYG content management system that allows admins to compose memorial page content from ordered, toggleable blocks. It replaces four legacy systems:

| Legacy System | Block Replacement | Migration Date |
|--------------|-------------------|----------------|
| `emergencyEmbed` (video override) | Embed block (`embedType: 'video'`) | Feb 2026 |
| `emergencyChatEmbed` (chat override) | Embed block (`embedType: 'chat'`) | Feb 2026 |
| `publicNote` (text announcement) | Text block (`style: 'note'`) | Feb 2026 |
| Inline stream creation form | Livestream block (creates stream + block atomically) | Feb 2026 |

### Why Blocks?

- **Ordered:** Admins control the visual order of all content on the memorial page
- **Toggleable:** Each block can be enabled/disabled without deletion
- **Type-safe:** Three distinct block types with validated configs
- **Composable:** Mix livestreams, embeds, and text in any order
- **Versioned:** `contentBlocksVersion` counter prevents stale writes

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  ADMIN DETAIL PAGE                    │
│  /admin/services/memorials/[memorialId]/+page.svelte │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │         MemorialBlockEditor.svelte               │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────────┐ │ │
│  │  │ BlockList  │ │BlockToolbar│ │  Save Status  │ │ │
│  │  │ ┌───────┐ │ │ [+ Add]   │ │ ⏳/✅/❌      │ │ │
│  │  │ │BlockItem│ │ └───────────┘ └───────────────┘ │ │
│  │  │ │BlockItem│ │                                  │ │
│  │  │ │BlockItem│ │     ┌──────────────────────┐    │ │
│  │  │ └───────┘ │     │     EDIT MODALS        │    │ │
│  │  └───────────┘     │  EditLivestreamModal   │    │ │
│  │                     │  EditEmbedModal        │    │ │
│  │  ┌───────────────┐ │  EditTextModal         │    │ │
│  │  │ AddBlockModal  │ │  AddBlockModal         │    │ │
│  │  └───────────────┘ └──────────────────────┘    │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────┘
                           │ fetch()
                           ▼
┌─────────────────────────────────────────────────────┐
│                    BLOCK APIs                         │
│  /api/memorials/[memorialId]/blocks/                  │
│                                                       │
│  GET  /blocks          → Fetch all blocks             │
│  POST /blocks          → Create text/embed block      │
│  POST /blocks/livestream → Create stream + block      │
│  POST /blocks/reorder  → Reorder blocks               │
│  PATCH /blocks/[blockId] → Update block config        │
│  DELETE /blocks/[blockId] → Delete block              │
└──────────────────────────┬──────────────────────────┘
                           │ adminDb
                           ▼
┌─────────────────────────────────────────────────────┐
│               FIRESTORE: memorials/{id}               │
│                                                       │
│  contentBlocks: MemorialBlock[]                       │
│  contentBlocksVersion: number                         │
└─────────────────────────────────────────────────────┘
                           │
                           ▼ (public page reads)
┌─────────────────────────────────────────────────────┐
│                  PUBLIC PAGE                           │
│  /[fullSlug]/+page.svelte                             │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │           BlockRenderer.svelte                    │ │
│  │  ┌────────────────────────────────────────────┐ │ │
│  │  │ livestream block → MemorialStreamDisplay   │ │ │
│  │  │ embed block      → EmbedRenderer           │ │ │
│  │  │ text block       → TextRenderer            │ │ │
│  │  └────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 3. File Inventory

### 3.1 Type Definitions

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/types/memorial-blocks.ts` | 116 | All block types, configs, API request/response interfaces, type guards |

**Key Types:**

```typescript
type BlockType = 'livestream' | 'embed' | 'text';
type EmbedType = 'video' | 'chat' | 'other';
type TextStyle = 'paragraph' | 'heading' | 'note';

interface MemorialBlock {
  id: string;           // UUID
  type: BlockType;
  order: number;        // Sequential: 0, 1, 2...
  enabled: boolean;     // Toggle visibility without deletion
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
  config: BlockConfig;  // Union: LivestreamConfig | EmbedConfig | TextConfig
}

interface LivestreamConfig { streamId: string; }
interface EmbedConfig { title: string; embedCode: string; embedType: EmbedType; }
interface TextConfig {
  content: string;
  style: TextStyle;
  fontSize?: string;    // CSS value, e.g. "2rem" — defaults: heading 2rem, paragraph 1.125rem
  fontColor?: string;   // CSS color, e.g. "#ffffff" — defaults: white (note: #92400e)
  lineHeight?: string;  // CSS line-height, e.g. "1.4" — defaults: heading 1.3, paragraph 1.7
  textAlign?: 'left' | 'center' | 'right';  // default: center
}
```

**API Types:**

```typescript
interface CreateBlockRequest { type: BlockType; config: BlockConfig; insertAt?: number; }
interface UpdateBlockRequest { enabled?: boolean; config?: Partial<BlockConfig>; }
interface ReorderBlocksRequest { order: string[]; }
interface CreateLivestreamBlockRequest { title: string; scheduledStartTime: string; description?: string; insertAt?: number; }
interface BlocksResponse { blocks: MemorialBlock[]; version: number; }
interface BlockResponse { block: MemorialBlock; blocks: MemorialBlock[]; }
interface DeleteBlockResponse { deleted: string; blocks: MemorialBlock[]; }
```

### 3.2 Utility Functions

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/utils/block-utils.ts` | 304 | Block CRUD helpers, sorting, validation, sanitization |

**Exported Functions:**

| Function | Purpose |
|----------|---------|
| `generateBlockId()` | UUID generation via `crypto.randomUUID()` |
| `sortBlocksByOrder(blocks)` | Sort by `order` field ascending |
| `recomputeOrder(blocks)` | Reindex order values to 0, 1, 2... after mutations |
| `insertBlockAt(blocks, block, pos)` | Insert at position, recompute order |
| `removeBlock(blocks, blockId)` | Remove by ID, recompute order |
| `updateBlock(blocks, blockId, updates)` | Partial update with `updatedAt` |
| `reorderBlocks(blocks, newOrder)` | Reorder based on ID array |
| `createBlock(type, config, order)` | Factory with defaults |
| `createLivestreamBlock(streamId, order)` | Convenience: create livestream block |
| `createEmbedBlock(title, code, type, order)` | Convenience: create embed block |
| `createTextBlock(content, style, order, customStyles?)` | Convenience: create text block with optional styling overrides |
| `validateBlockConfig(type, config)` | Returns error string or null (validates optional text styling fields) |
| `getBlockIcon(type)` | Emoji icon per type |
| `getBlockTypeLabel(type)` | Human label per type |
| `getEnabledBlocks(blocks)` | Filter enabled + sort |
| `findBlock(blocks, blockId)` | Find by ID |
| `hasStreamBlock(blocks, streamId)` | Check if stream has block — **DEPRECATED** |
| `sanitizeEmbedCode(code)` | URL wrapping + domain allowlist validation |

**Sanitization Allowlist:** YouTube, Vimeo, Dailymotion, Facebook, Twitch, Cloudflare Stream, TributeStream

### 3.3 Admin Editor Components (11 files)

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/components/admin/memorial-editor/MemorialBlockEditor.svelte` | 335 | Main orchestrator: state, CRUD calls, modals |
| `src/lib/components/admin/memorial-editor/BlockList.svelte` | — | Sortable block list with drag-and-drop |
| `src/lib/components/admin/memorial-editor/BlockItem.svelte` | — | Single block card: type icon, title, toggle, actions |
| `src/lib/components/admin/memorial-editor/BlockToolbar.svelte` | — | "+ Add Block" button |
| `src/lib/components/admin/memorial-editor/blocks/EmbedBlock.svelte` | — | Embed block preview in editor |
| `src/lib/components/admin/memorial-editor/blocks/LivestreamBlock.svelte` | — | Livestream block preview in editor |
| `src/lib/components/admin/memorial-editor/blocks/TextBlock.svelte` | — | Text block preview in editor (shows color swatch + font size indicator) |
| `src/lib/components/admin/memorial-editor/modals/AddBlockModal.svelte` | — | Type picker + config form for new blocks |
| `src/lib/components/admin/memorial-editor/modals/EditEmbedModal.svelte` | — | Edit embed: title, code, type |
| `src/lib/components/admin/memorial-editor/modals/EditLivestreamModal.svelte` | — | Edit livestream: view stream details |
| `src/lib/components/admin/memorial-editor/modals/EditTextModal.svelte` | — | Edit text: content, style, font color, font size, line height, text align (with live dark-bg preview) |

### 3.4 Public Page Renderers (3 files)

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/components/memorial/BlockRenderer.svelte` | 76 | Routes blocks to correct renderer by type |
| `src/lib/components/memorial/EmbedRenderer.svelte` | 75 | Renders embed HTML with video/chat styling |
| `src/lib/components/memorial/TextRenderer.svelte` | 76 | Renders text in heading/paragraph/note styles |

**BlockRenderer Data Flow:**

```
BlockRenderer receives: { blocks: MemorialBlock[], streams: any[], memorial: any }
  └─ $derived: getEnabledBlocks(blocks) → only enabled blocks, sorted
  └─ {#each enabledBlocks as block}
       ├─ type === 'livestream' → findStream(config.streamId) → MemorialStreamDisplay
       ├─ type === 'embed'     → EmbedRenderer
       └─ type === 'text'      → TextRenderer
```

### 3.5 API Endpoints (6 routes)

| Route | Methods | File | Purpose |
|-------|---------|------|---------|
| `/api/memorials/[memorialId]/blocks` | GET, POST | `+server.ts` (128 lines) | List all blocks; Create text/embed block |
| `/api/memorials/[memorialId]/blocks/[blockId]` | PATCH, DELETE | `+server.ts` (143 lines) | Update or delete single block |
| `/api/memorials/[memorialId]/blocks/livestream` | POST | `+server.ts` (148 lines) | Atomically create Mux stream + livestream block |
| `/api/memorials/[memorialId]/blocks/reorder` | POST | `+server.ts` (80 lines) | Reorder all blocks by ID array |
| `/api/memorials/[memorialId]/blocks/sync` | POST | `+server.ts` (116 lines) | **DEPRECATED** — One-time orphan stream sync |
| `/api/memorials/[memorialId]/embeds` | — | `+server.ts` | Per-stream embed management (above/below/replace) |

---

## 4. Data Model

### 4.1 Firestore Fields on `memorials/{id}`

| Field | Type | Description |
|-------|------|-------------|
| `contentBlocks` | `MemorialBlock[]` | Ordered array of block objects |
| `contentBlocksVersion` | `number` | Incrementing counter, bumped on every mutation |

### 4.2 Block Object Structure

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "type": "embed",
  "order": 0,
  "enabled": true,
  "createdAt": "2026-02-15T14:30:00.000Z",
  "updatedAt": "2026-02-15T14:30:00.000Z",
  "config": {
    "title": "YouTube Live Stream",
    "embedCode": "<iframe src=\"https://youtube.com/embed/...\" ...></iframe>",
    "embedType": "video"
  }
}
```

### 4.3 Livestream Block — Stream Creation

When a livestream block is created via `POST /blocks/livestream`:

1. A Mux live stream is created with RTMP credentials
2. A stream document is added to the root `streams` collection
3. A livestream block referencing that stream ID is added to `contentBlocks`
4. The `contentBlocksVersion` is incremented

**Stream document created:**

```json
{
  "title": "Memorial Service",
  "description": "",
  "scheduledStartTime": "2026-02-20T14:00:00.000Z",
  "status": "scheduled",
  "visibility": "public",
  "memorialId": "abc123",
  "mux": {
    "liveStreamId": "...",
    "playbackId": "...",
    "rtmpUrl": "rtmps://global-live.mux.com:443/app",
    "streamKey": "...",
    "recordingReady": false,
    "streamingStatus": "idle",
    "reconnectWindow": 60
  },
  "chat": { "enabled": true, "locked": false, "archived": false, "messageCount": 0 },
  "isVisible": true,
  "createdAt": "...",
  "createdBy": "admin-uid"
}
```

---

## 5. Key Flows

### 5.1 Admin: Add Block

```
Admin clicks "+ Add Block"
  → AddBlockModal opens
  → Admin selects type (livestream | embed | text)
  → Admin fills config form
  → handleAddBlock(type, config)
    ├─ type === 'livestream':
    │    POST /api/memorials/{id}/blocks/livestream
    │      → createMuxLiveStream()
    │      → streams.add(streamData)
    │      → memorials.update({ contentBlocks: [..., newBlock] })
    │      → Returns { stream, block, blocks }
    └─ type === 'embed' | 'text':
         POST /api/memorials/{id}/blocks
           → validateBlockConfig(type, config)
           → memorials.update({ contentBlocks: [..., newBlock] })
           → Returns { block, blocks }
```

### 5.2 Admin: Reorder Blocks

```
Admin drags block to new position (or clicks ↑/↓)
  → handleReorder(newOrder: string[])
    → POST /api/memorials/{id}/blocks/reorder
      → Validates all IDs exist and count matches
      → reorderBlocks(currentBlocks, newOrder)
      → memorials.update({ contentBlocks: reordered })
```

### 5.3 Admin: Toggle Block

```
Admin clicks enable/disable toggle
  → handleToggle(blockId, enabled)
    → PATCH /api/memorials/{id}/blocks/{blockId}
      → updateBlock(blocks, blockId, { enabled })
      → memorials.update({ contentBlocks: updated })
```

### 5.4 Admin: Edit Block

```
Admin clicks edit icon
  → editingBlock = block
  → Modal opens (type-specific)
  → Admin modifies config
  → handleSaveEdit(blockId, configUpdates)
    → PATCH /api/memorials/{id}/blocks/{blockId}
      → Merges config: { ...existingConfig, ...configUpdates }
      → memorials.update({ contentBlocks: updated })
```

### 5.5 Admin: Delete Block

```
Admin clicks delete
  → confirm('Are you sure?')
  → handleDelete(blockId)
    → DELETE /api/memorials/{id}/blocks/{blockId}
      → removeBlock(blocks, blockId)
      → recomputeOrder()
      → memorials.update({ contentBlocks: remaining })
```

### 5.6 Public Page: Render Blocks

```
Server load:
  memorialData.contentBlocks → serialized to client

+page.svelte:
  {#if memorial.contentBlocks?.length > 0}
    <BlockRenderer blocks={memorial.contentBlocks} streams={streams} memorial={memorial} />
  {:else}
    <MemorialStreamDisplay streams={streams} ... />  ← Fallback for legacy memorials
  {/if}

BlockRenderer:
  getEnabledBlocks(blocks) → filter enabled, sort by order
  {#each enabledBlocks as block}
    ├─ livestream → find matching stream → MemorialStreamDisplay (single stream)
    ├─ embed     → EmbedRenderer (renders {@html embedCode})
    └─ text      → TextRenderer (heading | paragraph | note)
```

---

## 6. Security Considerations

### 6.1 Authentication

All block API endpoints require `locals.user.role === 'admin'`. Non-admin requests return 403.

### 6.2 Embed Code Sanitization

`sanitizeEmbedCode()` in `block-utils.ts`:
- URLs are auto-wrapped in `<iframe>` tags
- `src` attributes are checked against a domain allowlist
- Non-allowlisted domains log a warning but are NOT blocked (soft validation)

**Current allowlist:** `youtube.com`, `youtube-nocookie.com`, `youtu.be`, `vimeo.com`, `player.vimeo.com`, `dailymotion.com`, `facebook.com`, `twitch.tv`, `player.twitch.tv`, `cloudflare.com`, `cloudflarestream.com`, `iframe.videodelivery.net`, `tributestream.com`

### 6.3 XSS Risk

⚠️ **`{@html embedCode}` is used in both `EmbedRenderer.svelte` and `MemorialStreamDisplay.svelte` (per-stream embeds).** This renders arbitrary HTML. The sanitization only validates iframe `src` domains but does NOT strip malicious tags/attributes.

**Recommended:** Add a proper HTML sanitizer (e.g., DOMPurify) to `getSafeEmbedHtml()` in `EmbedRenderer.svelte` and `sanitizeEmbedCode()` in `block-utils.ts`.

### 6.4 Version Conflicts

The `contentBlocksVersion` counter is incremented on every mutation, but there is no optimistic concurrency check — two simultaneous admins editing blocks could overwrite each other's changes.

**Recommended:** Add version check: reject updates where the submitted version !== current version.

---

## 7. Deprecated Systems — Migration Mapping

### 7.1 Emergency Embed → Embed Block (video)

| Old | New |
|-----|-----|
| `memorial.emergencyEmbed.embedCode` | `EmbedBlock.config.embedCode` |
| `memorial.emergencyEmbed.title` | `EmbedBlock.config.title` |
| Override priority: always first | Block ordering: admin controls position |
| API: `POST /api/memorials/{id}/emergency-embed` | API: `POST /api/memorials/{id}/blocks` with `type: 'embed'` |

### 7.2 Emergency Chat Embed → Embed Block (chat)

| Old | New |
|-----|-----|
| `memorial.emergencyChatEmbed.embedCode` | `EmbedBlock.config.embedCode` with `embedType: 'chat'` |
| Replaced chat widget globally | Block-level: only appears where placed |
| API: `POST /api/memorials/{id}/emergency-chat-embed` | API: `POST /api/memorials/{id}/blocks` with `type: 'embed'` |

### 7.3 Public Note → Text Block (note)

| Old | New |
|-----|-----|
| `memorial.publicNote` (single string) | `TextBlock.config.content` with `style: 'note'` |
| Always displayed above streams | Block ordering: admin controls position |
| API: `POST /api/admin/memorials/{id}/display-settings` | API: `POST /api/memorials/{id}/blocks` with `type: 'text'` |

### 7.4 Inline Stream Creation → Livestream Block

| Old | New |
|-----|-----|
| Form in admin detail page | `AddBlockModal` → type: livestream |
| Called `/api/memorials/{id}/streams` | Calls `/api/memorials/{id}/blocks/livestream` |
| Stream created, no block reference | Stream + block created atomically |
| Refresh page to see stream | Block list updates immediately |

---

## 8. Deprecated API Endpoints (Retained for Backward Compatibility)

These APIs are no longer called by the admin UI. They are retained until all memorials with legacy data have been migrated.

| Endpoint | Status | Replacement |
|----------|--------|-------------|
| `POST/DELETE /api/memorials/[id]/emergency-embed` | DEPRECATED | `POST /api/memorials/[id]/blocks` (type: embed) |
| `POST/DELETE /api/memorials/[id]/emergency-chat-embed` | DEPRECATED | `POST /api/memorials/[id]/blocks` (type: embed, embedType: chat) |
| `POST /api/memorials/[id]/blocks/sync` | DEPRECATED | Was one-time migration utility |

---

## 9. Known Issues & Technical Debt

| # | Issue | Severity | Notes |
|---|-------|----------|-------|
| 1 | `{@html embedCode}` — no HTML sanitizer | **High** | XSS risk in `EmbedRenderer` and `MemorialStreamDisplay` |
| 2 | No optimistic concurrency on `contentBlocksVersion` | **Medium** | Concurrent editors can overwrite each other |
| 3 | `confirm()` used in `handleDelete()` | **Low** | Should use UI modal per Svelte 5 audit |
| 4 | `any` type for `contentBlocks` in `memorial.ts` | **Low** | Should be `MemorialBlock[]` |
| 5 | `sanitizeEmbedCode()` allows non-allowlisted domains | **Medium** | Only warns, doesn't block |
| 6 | `hasStreamBlock()` is deprecated but still exported | **Low** | Only used by deprecated sync API |
| 7 | No unit tests for block-utils.ts | **Medium** | Utility functions should be tested |
| 8 | No loading states in edit modals | **Low** | UX improvement |

---

## 10. Future Enhancements

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| DOMPurify sanitization | **P1** | Strip unsafe HTML from embed codes |
| Optimistic locking | **P2** | Reject stale version writes |
| Block templates | **P3** | Pre-built block configurations (e.g., "YouTube + Chat") |
| Drag-and-drop reorder | **P3** | Already wired up in BlockList but may need UX polish |
| Image block type | **P3** | New `type: 'image'` for memorial photos |
| Block duplication | **P3** | Clone an existing block |
| Undo/redo | **P4** | Version history with rollback |

### 10.1 Completed Enhancements

| Enhancement | Date | Description |
|-------------|------|-------------|
| Text block customization | Feb 26, 2026 | Font color, font size, line height, and text alignment controls in EditTextModal. Smart defaults (white text, bigger sizes) for dark memorial background. Admin preview shows color swatch + size tag. AddBlockModal sets defaults on new blocks. TextRenderer applies inline style overrides. |

---

## 11. Component Responsibilities

### MemorialBlockEditor (Orchestrator)

- **State:** `blocks`, `editingBlock`, `showAddModal`, `isSaving`, `saveStatus`
- **Props:** `memorialId`, `initialBlocks`, `streams`, `onSave?`
- **Pattern:** Svelte 5 `$state` + `$props()`. No `$derived` (operates on mutable state).
- **API calls:** All 5 block endpoints via `fetch()`
- **Child coordination:** Opens type-specific modals based on `editingBlock.type`

### BlockRenderer (Public Display)

- **Props:** `blocks`, `streams`, `memorial`
- **Computed:** `$derived(getEnabledBlocks(blocks))` — only enabled, sorted
- **Pattern:** Pure rendering, no API calls, no mutations
- **Fallback:** If a livestream block references a non-existent stream, it silently hides

### EmbedRenderer

- **Props:** `config: EmbedConfig`
- **Computed:** `$derived(getSafeEmbedHtml(config.embedCode))` — URL wrapping
- **Styling:** Video embeds get 16:9 aspect ratio; chat embeds get min-height 400px

### TextRenderer

- **Props:** `config: TextConfig`
- **Computed:** `$derived.by` builds inline CSS string from `config.fontSize`, `config.fontColor`, `config.lineHeight`, `config.textAlign`
- **CSS Defaults:** Heading (2rem, white, bold, centered), paragraph (1.125rem, white, centered), note (amber card, #92400e)
- **Inline overrides:** Custom values from `TextConfig` override CSS defaults via `style` attribute
- **Backward compatible:** Blocks without custom fields render with new white/bigger CSS defaults

---

*Document Version: 1.1*  
*Created: February 17, 2026*  
*Updated: February 26, 2026 — Text block customization (v1.1)*  
*Author: Automated WBS from codebase audit*
