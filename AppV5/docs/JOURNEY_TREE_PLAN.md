# Journey Tree Implementation Plan

## Vision

Transform AppV5 into a **Journey-First Visual Orchestration** tool that scans a codebase and reclassifies files from a flat file tree into a **Journey Tree** organized by user experience.

---

## Phase 1: Directory Scanner (Current Sprint)

### 1.1 Home Page — Directory Selection
- Replace default SvelteKit landing page with Journey Tree UI
- Input field or file picker for selecting a project directory
- "Scan" button to initiate directory parsing
- Store selected path in app state

### 1.2 Server API — Directory Scanner
**Endpoint:** `POST /api/scan`

```typescript
// Input
{ path: string }

// Output
{
  tree: NestedItemData[],
  stats: { files: number, folders: number, markdownFiles: number }
}
```

**Logic:**
1. Validate path exists and is accessible
2. Recursively walk directory (respect .gitignore)
3. Build nested tree structure
4. Identify Markdown metadata files (*.meta.md or frontmatter)
5. Return hierarchical JSON

### 1.3 Display — Reuse NestedItem Component
- Feed scanned tree into existing `NestedItem.svelte`
- Each node shows: name, type (folder/file), description (if metadata found)
- Expand/collapse to navigate structure

---

## Phase 2: Metadata Discovery

### 2.1 The `.meta.md` Format Specification

The `.meta.md` file is a **companion file** that sits alongside any source file. It uses YAML frontmatter for machine-readable metadata and optional Markdown body for documentation.

#### Naming Convention

```
ComponentName.svelte      ← The actual code
ComponentName.meta.md     ← Its metadata companion

routes/admin/
routes/admin/_folder.meta.md   ← Describes an entire folder/journey
```

#### Full Format

```markdown
---
# Required: Which level in the hierarchy (1-4)
level: 3

# Required: Which journey this belongs to
journey: admin

# Optional: What this is "part of" (parent relationship)
partOf: user-dashboard

# Optional: Tags for filtering/grouping
tags:
  - authentication
  - security

# Optional: Dependencies (explicit "uses" relationship)
uses:
  - lib/utils/formatDate
  - lib/api/fetchUser
---

# Login Guard

This component handles authentication state checking before 
allowing access to protected admin routes.

## Behavior
- Redirects to `/login` if no session
- Refreshes token if within 15 days of expiry
```

#### Field Reference

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `level` | Yes | `1-4` | Hierarchy level (see below) |
| `journey` | Yes | `string` | Which experience this belongs to |
| `partOf` | No | `string` | Parent relationship for reclassification |
| `tags` | No | `string[]` | Flexible filtering/grouping |
| `uses` | No | `string[]` | Explicit dependencies |
| **Body** | No | Markdown | Human/AI readable documentation |

#### The 4 Levels Explained

| Level | Name | Typical Files | Example |
|-------|------|---------------|---------|
| **1** | Journey Container | Top-level route folders | `routes/admin/_folder.meta.md` |
| **2** | Structural Layout | `+layout.svelte` files | `routes/admin/+layout.meta.md` |
| **3** | Logic Connector | `+page.server.ts`, guards | `routes/admin/login/+page.server.meta.md` |
| **4** | Atomic Module | Utils, APIs, components | `lib/utils/formatDate.meta.md` |

#### Example: Real Project Structure

```
src/
├── routes/
│   └── admin/
│       ├── _folder.meta.md          ← L1: "Admin Journey"
│       ├── +layout.svelte
│       ├── +layout.meta.md          ← L2: "Admin Layout"
│       └── dashboard/
│           ├── +page.server.ts
│           ├── +page.server.meta.md ← L3: "Dashboard Logic"
│           ├── +page.svelte
│           └── +page.meta.md        ← L3: "Dashboard UI"
├── lib/
│   └── utils/
│       ├── formatDate.ts
│       └── formatDate.meta.md       ← L4: "Date Formatter"
```

#### The Reclassification Magic

When scanning a project:
1. A file in `/lib/utils/` with `journey: admin` and `partOf: dashboard` gets **reclassified** under the Admin Dashboard in the Journey Tree
2. Even though it *lives* in `/lib/utils`, it *belongs* to the dashboard experience
3. The Markdown body becomes the "Editable Description" viewable in the UI

### 2.2 Scanner Enhancement
- Detect `.meta.md` companion files alongside source files
- Parse YAML frontmatter using `gray-matter`
- Extract all fields: `level`, `journey`, `partOf`, `tags`, `uses`
- Attach metadata object to corresponding tree nodes
- Store Markdown body as `description` for UI display

---

## Phase 3: Journey Reclassification

### 3.1 The 4-Level Hierarchy
| Level | Name | Detection Strategy |
|-------|------|-------------------|
| **L1** | Journey Container | Folders named `guest/`, `admin/`, `creator/` OR files with `level: 1` |
| **L2** | Structural Layout | Files matching `+layout.svelte` OR `level: 2` |
| **L3** | Logic Connector | Files matching `+page.server.ts`, guards, OR `level: 3` |
| **L4** | Atomic Modules | Everything in `/lib/`, `/utils/`, `/api/` OR `level: 4` |

### 3.2 "Part Of" Relationship Builder
- Parse imports in source files
- Match imported paths to scanned nodes
- Build dependency graph: "This util is Part Of this page"

### 3.3 Dual View Toggle
- **File Tree View**: Traditional structure (current)
- **Journey Tree View**: Reclassified by experience level

---

## Phase 4: Editable Descriptions (AI-Assisted)

### 4.1 Inline Editing
- Click any node's description to edit
- Save updates back to `.meta.md` file

### 4.2 AI Summary Generation
- "Generate Description" button per node
- Call Gemini API with file contents
- Suggested description based on code analysis

### 4.3 Bidirectional Sync
- Changes in IDE update Journey Tree on next scan
- Changes in Journey Tree write to `.meta.md` files

---

## Phase 5: Live Watching

### 5.1 File System Watcher
- Use `chokidar` or native fs.watch
- Auto-rescan on file changes
- WebSocket push updates to UI

### 5.2 Change Indicators
- Highlight recently modified nodes
- Show diff between current and last scan

---

## Technical Stack

| Component | Technology |
|-----------|------------|
| Frontend | SvelteKit 2, Svelte 5, TailwindCSS |
| Scanner API | SvelteKit server endpoints, Node.js fs |
| Metadata | Gray-matter (YAML frontmatter parser) |
| AI | Gemini API (already configured) |
| Database | SQLite/Drizzle (store scan history, user prefs) |
| Watcher | chokidar (future phase) |

---

## File Structure (Target)

```
src/
├── lib/
│   ├── components/
│   │   ├── NestedItem.svelte      ✅ Done
│   │   ├── DirectoryPicker.svelte  ← Phase 1
│   │   └── JourneyTree.svelte      ← Phase 3
│   ├── server/
│   │   ├── scanner.ts              ← Phase 1
│   │   └── metadata-parser.ts      ← Phase 2
│   └── types/
│       └── journey.ts              ← Shared types
├── routes/
│   ├── +page.svelte                ← Home (directory picker + tree)
│   └── api/
│       └── scan/
│           └── +server.ts          ← Scanner endpoint
```

---

## Progress Tracker

### Phase 1: Directory Scanner ✅ COMPLETE
- [x] NestedItem component created
- [x] Home page with directory input
- [x] `/api/scan` endpoint
- [x] Scanner output connected to NestedItem display

### Phase 2: Metadata Discovery ✅ COMPLETE
- [x] Install `gray-matter` package
- [x] Create `metadata-parser.ts` utility
- [x] Enhance scanner to detect `.meta.md` files
- [x] Update UI to display level badges and descriptions

### Phase 3: Journey Reclassification ✅ COMPLETE
- [x] Journey classifier utility (`journey-classifier.ts`)
- [x] Toggle between File Tree / Journey Tree views
- [x] Auto-group by level (L2 Layouts, L3 Logic, L4 Modules)
- [x] "Unclassified" section for files without metadata

### Phase 4: Editable Descriptions + Gemini AI ✅ COMPLETE
- [x] Gemini 1.5 Flash API integration (`gemini.ts`)
- [x] AI description generation endpoint (`/api/generate-description`)
- [x] Metadata save endpoint (`/api/save-metadata`)
- [x] Inline edit + AI generate buttons in UI
- [x] Bidirectional sync: IDE ↔ Journey Tree

### Phase 5: Live File Watching ⏳ PENDING
- [ ] File system watcher (chokidar)
- [ ] Auto-rescan on file changes
- [ ] WebSocket push updates to UI
- [ ] Change indicators (recently modified)
- [ ] Diff between scans

---

## Future Enhancements

### Code Bank Vaults (From Overview.md)
The 4-Vault taxonomy (Route, Mechanics, Asset, Legal) described in `Project Notes/Overview.md` will be integrated as a future enhancement to provide deeper code classification beyond the current 4-Level (L1-L4) system.
