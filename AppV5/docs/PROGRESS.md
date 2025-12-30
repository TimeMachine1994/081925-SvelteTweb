# Journey Tree — Development Progress

> Last Updated: December 30, 2025

## Vision

Journey Tree is a **Journey-First Visual Orchestration** tool that transforms flat file trees into experience-based hierarchies. Instead of organizing code by type (`/components`, `/utils`), it reclassifies files by **user journey** — showing what powers the "Admin Dashboard" or "Guest Onboarding" regardless of folder structure.

---

## Completed Phases

### ✅ Phase 1: Directory Scanner

**Status:** Complete

Built the foundation for scanning and displaying project structures.

| Component | Description |
|-----------|-------------|
| `src/lib/server/scanner.ts` | Recursive directory scanner with .gitignore-like filtering |
| `src/routes/api/scan/+server.ts` | POST `/api/scan` endpoint |
| `src/lib/components/NestedItem.svelte` | Recursive tree display with expand/collapse |
| `src/routes/+page.svelte` | Home page with directory input and tree display |
| `src/lib/types/journey.ts` | Shared TypeScript interfaces |

**Features:**
- Input any directory path and scan its structure
- Displays files and folders in a nested, collapsible tree
- Shows file counts and folder statistics
- Ignores common directories (node_modules, .git, etc.)

---

### ✅ Phase 2: Metadata Discovery

**Status:** Complete

Added the ability to parse `.meta.md` companion files for rich metadata.

| Component | Description |
|-----------|-------------|
| `src/lib/server/metadata-parser.ts` | YAML frontmatter parser using `gray-matter` |
| Enhanced `scanner.ts` | Detects and parses `.meta.md` files alongside source files |
| Enhanced `NestedItem.svelte` | Displays level badges (L1-L4), journey tags, and tag lists |

**The `.meta.md` Format:**

```markdown
---
level: 3                    # 1-4 hierarchy level
journey: admin              # Which experience this belongs to
partOf: user-dashboard      # Parent relationship
tags:                       # Flexible filtering
  - authentication
uses:                       # Dependencies
  - lib/utils/formatDate
---

# Component Title

Description and documentation.
```

**The 4 Levels:**
| Level | Name | Examples |
|-------|------|----------|
| L1 | Journey Container | Top-level routes (admin/, guest/) |
| L2 | Structural Layout | `+layout.svelte` files |
| L3 | Logic Connector | `+page.server.ts`, guards |
| L4 | Atomic Module | Utils, APIs, components |

---

### ✅ Phase 3: Journey Reclassification

**Status:** Complete

Built the "Journey Tree" view that groups files by experience instead of folder.

| Component | Description |
|-----------|-------------|
| `src/lib/utils/journey-classifier.ts` | Transforms file tree → journey tree |
| Enhanced `+page.svelte` | Toggle between File Tree / Journey Tree views |

**Features:**
- **File Tree View:** Traditional folder structure
- **Journey Tree View:** Files grouped by `journey` metadata
- Auto-groups by level (L2 Layouts, L3 Logic, L4 Modules)
- Shows "Unclassified" section for files without metadata

---

### ✅ Phase 4: Editable Descriptions + Gemini AI

**Status:** Complete

Added AI-powered description generation and inline editing.

| Component | Description |
|-----------|-------------|
| `src/lib/server/gemini.ts` | Gemini 1.5 Flash API integration |
| `src/routes/api/generate-description/+server.ts` | AI description generation endpoint |
| `src/routes/api/save-metadata/+server.ts` | Save metadata to `.meta.md` files |
| Enhanced `NestedItem.svelte` | Inline edit + AI generate buttons |

**Features:**
- Hover over any file to see action buttons
- **✏️ Edit:** Manually edit description
- **✨ Generate:** AI analyzes file and suggests:
  - Description (2-3 sentences)
  - Level (1-4)
  - Journey name
  - Tags
- Changes saved to `.meta.md` companion files
- Bidirectional sync: IDE ↔ Journey Tree

---

## Current File Structure

```
src/
├── lib/
│   ├── components/
│   │   └── NestedItem.svelte       # Tree node with edit/AI features
│   ├── server/
│   │   ├── auth.ts                 # Authentication utilities
│   │   ├── gemini.ts               # Gemini API integration
│   │   ├── metadata-parser.ts      # YAML frontmatter parser
│   │   ├── scanner.ts              # Directory scanner
│   │   └── db/                     # Database (Drizzle/SQLite)
│   ├── types/
│   │   └── journey.ts              # Shared interfaces
│   └── utils/
│       └── journey-classifier.ts   # File → Journey tree transformer
├── routes/
│   ├── api/
│   │   ├── scan/+server.ts         # Directory scan endpoint
│   │   ├── generate-description/   # AI generation endpoint
│   │   └── save-metadata/          # Metadata save endpoint
│   ├── demo/                       # Demo pages (auth, nested)
│   └── +page.svelte                # Home: Scanner + Tree viewer
└── hooks.server.ts                 # Auth middleware
```

---

## Sample `.meta.md` Files Created

| File | Level | Journey |
|------|-------|---------|
| `src/routes/_folder.meta.md` | L1 | app |
| `src/routes/demo/_folder.meta.md` | L1 | demo |
| `src/routes/demo/lucia/_folder.meta.md` | L2 | demo |
| `src/lib/components/NestedItem.meta.md` | L4 | app |
| `src/lib/server/auth.meta.md` | L4 | app |
| `src/lib/utils/_folder.meta.md` | L4 | app |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite path (e.g., `file:local.db`) |
| `GEMINI_API_KEY` | Google Gemini API key for AI features |

---

### ✅ Phase 5: Dashboard Integration & Project Management

**Status:** Complete

**Unified Home Page:**
- Merged dashboard functionality into main home page (`src/routes/+page.svelte`)
- Scanner at top, project dashboard below
- Browse button with native OS folder picker (PowerShell on Windows)
- localStorage memory for last browsed directory
- Auto-populates path on page load

**Project Management:**
| Component | Description |
|-----------|-------------|
| `src/routes/api/projects/+server.ts` | CRUD operations for saved projects |
| `src/lib/server/db/schema.ts` | Project database schema with Drizzle ORM |
| Database table `project` | Stores: id, name, description, directoryPath, scanData, timestamps |

**Features:**
- Save scanned projects to database
- Project cards with selection checkboxes
- Bulk delete functionality
- Click project to view journey dashboard
- Live SSE updates for journey file changes

---

### ✅ Phase 6: Journey Dashboard (4-Column Layout)

**Status:** Complete

**Dashboard Architecture:**
| Column | Component | Purpose |
|--------|-----------|----------|
| 1. Journeys (Left) | `JourneyTabs.svelte` + `JourneyGrid.svelte` | Journey navigation & POTJ cards |
| 2. Profile (Middle-Left) | `ProfileView.svelte` | Detailed POTJ/file metadata |
| 3. Code Viewer (Middle-Right) | `CodeViewer.svelte` | Full file content display |
| 4. Code Bank (Right) | `CodeBank.svelte` | Journey-specific file browser |

**Journey File System:**
| Component | Description |
|-----------|-------------|
| `src/lib/server/journey-scanner.ts` | Scans `/journeys/` directory for `.journey.md` files |
| `src/lib/server/journey-parser.ts` | Parses journey markdown with YAML frontmatter |
| `src/routes/api/journeys/+server.ts` | Returns journeys and file profiles for selected project |
| `src/routes/api/journey-updates/+server.ts` | SSE endpoint for live journey file watching |
| `src/routes/api/file-content/+server.ts` | Fetches full file content on-demand |
| `src/routes/api/browse-directory/+server.ts` | Native OS folder picker dialog |

**Journey Markdown Format (`.journey.md`):**
```yaml
---
type: journey
id: guest
name: Guest Journey
generated: 2025-12-29T00:00:00Z
generator: windsurf-ai
version: 1.0
---

# Journey Name

Description of the user journey...

## 🟢 Beginning

### [POTJ:guest-b-1] Landing Page
**Type**: page
**File**: `@/routes/+page.svelte`
**Level**: L3
**Tags**: #marketing #ui

User arrives and sees value proposition...

**Key Behavior**:
- Display hero section
- Show feature cards

**Code Reference** `@/routes/+page.svelte:10-20`:
```svelte
<script>
  // code snippet
</script>
```

**Dependencies**:
- Uses `@/lib/components/Hero.svelte`
```

**POTJ Module Types:**
- `layout` - Layout components (+layout.svelte)
- `page` - Page components (+page.svelte)
- `route` - Route groups
- `logic` - Server-side logic connectors
- `endpoint` - API endpoints
- `component` - Reusable components

**Features:**
- Journey tabs for switching between journeys (Guest, Admin, Creator)
- POTJ cards in vertical flow with section badges (Beginning, Middle, End)
- Profile panel shows POTJ details, behavior, dependencies
- Code Viewer displays full file content with loading states
- Code Bank filters files by active journey
- Click file in Code Bank → loads in Code Viewer
- Profile stays stable while Code Viewer updates independently

**Path Resolution:**
- Journey files reference source code using `@/` prefix (e.g., `@/routes/+page.svelte`)
- System resolves to `{projectPath}/src/routes/+page.svelte`
- Security check ensures files are within project directory
- Supports multiple saved projects with different directory paths

---

## Recent Fixes

### File Path Resolution (Dec 29, 2025)
**Issue:** Files clicked in Code Bank returned "Access denied" errors

**Root Cause:** Path resolution logic checked if original `filePath` was absolute before cleaning prefixes. Paths like `/routes/+page.svelte` were treated as Unix absolute paths, resulting in `C:\routes\+page.svelte` instead of joining with project root.

**Solution:** Changed logic to check if `cleanPath` is absolute AFTER removing `@/` and `/` prefixes. Now correctly constructs `{projectPath}/src/{cleanPath}`.

**Files Modified:**
- `src/routes/api/file-content/+server.ts` - Fixed absolute path detection
- Added extensive console logging for debugging
- Added inline comments explaining path transformations

### Scanner Exclusions (Dec 29, 2025)
**Issue:** `.journey.md` files appeared in scan results as "Unclassified"

**Solution:** Added `.journey.md` to ignore list in `src/lib/server/scanner.ts`. Journey files are documentation, not source code, and should only be loaded via the journeys API.

### Double /src Path Issue (Dec 30, 2025)
**Issue:** File paths resolved to `/AppV5/src/src/routes/...` when `projectPath` already ended with `/src`

**Solution:** Updated `src/routes/api/file-content/+server.ts` to check if `projectRoot` already ends with `/src` before appending it again.

### SVG/Image Rendering (Dec 30, 2025)
**Issue:** SVG files showed "Failed to load file" error in Code Viewer

**Solution:** Added image detection in `src/lib/components/CodeViewer.svelte`. SVG files now render as images using base64 data URLs. Added support for `.svg`, `.png`, `.jpg`, `.gif`, `.webp` extensions.

### Dependency Path Parsing (Dec 30, 2025)
**Issue:** Clicking dependencies sent malformed paths like `Uses `@/lib/path.svelte`` instead of just the path

**Solution:** Updated `handleFileClick()` in `src/lib/components/ProfileView.svelte` to strip "Uses " prefix and backticks from dependency strings before resolving file paths.

---

## Next Phase

### ✅ Phase 7: Chat Interface (Context-Aware AI Assistant)

**Status:** Complete

**Implementation:**
Added AI-powered chat interface in ProfileView for discussing POTJs and files.

| Component | Description |
|-----------|-------------|
| `src/lib/server/db/schema.ts` | Added `chatMessage` table for persistent chat history |
| `src/lib/server/gemini-chat.ts` | Gemini 2.0 Flash integration with context-aware prompts |
| `src/routes/api/chat/+server.ts` | GET/POST endpoints for loading and sending messages |
| Enhanced `ProfileView.svelte` | Chat UI with messages, input, typing indicators |

**Features:**
- **Context-Aware Prompts:** Automatically includes POTJ metadata, file content, dependencies
- **Chat History:** Persistent per POTJ/file, loads last 10 messages for context
- **Real-time UI:** Auto-scroll, typing indicators, error handling
- **Keyboard Shortcuts:** Enter to send, Shift+Enter for newlines
- **Token Management:** Truncates file content to 5000 chars to manage API costs

**Database Schema:**
```typescript
chatMessage table:
- id (primary key)
- contextType ('potj' or 'file')
- contextId (POTJ ID or file path)
- role ('user' or 'assistant')
- content (message text)
- timestamp
- metadata (JSON: model, tokens used)
```

---

### ✅ Phase 8: Visual Journey Flow

**Status:** Complete

**Implementation:**
Transformed journey grid into vertical flow visualization with module types and visual connectors.

| Component | Description |
|-----------|-------------|
| `src/lib/components/JourneyGrid.svelte` | Vertical flow layout with module-specific rendering |
| `src/lib/components/SquigglyConnector.svelte` | SVG dashed line connector between sections |
| `src/lib/components/RoutesBar.svelte` | Horizontal routes display with expandable logic |

**Module Types Implemented:**
- **Layout** 📐 - Layout components (+layout.svelte)
- **Page** 📄 - Page components (+page.svelte)
- **Route** 🔗 - Route groups (expandable)
- **Logic** ⚡ - Server-side logic connectors
- **Endpoint** 🎯 - API endpoints

**Visual Features:**
- Vertical flow: Beginning → SquigglyConnector → Routes → Middle → End
- Route expansion: Click route cards to show linked logic
- Parent layout indicators on endpoint modules
- Module-specific styling (logic cards have yellow theme)
- Expandable/collapsible route logic sections

**Journey Flow Pattern:**
```
Beginning:
  [Layout Module 📐]
  [Page Module 📄]
  ~~~~ Squiggly Connector ~~~~
  [Routes Bar 🔗 🔗 🔗] (horizontal, expandable)
  
Middle:
  [Logic Module ⚡] (when expanded from routes)
  [Unlinked Logic ⚡] (standalone)
  
End:
  [Endpoint Modules 🎯]
```

---

### ✅ Phase 9: File Change Detection & Reconciliation

**Status:** Complete

**Purpose:** Detect when source files referenced in journeys change and provide reconciliation UI.

> See full specification: [`FILE_RECONCILIATION_PLAN.md`](./FILE_RECONCILIATION_PLAN.md)

**Core Components:**
| Component | Description |
|-----------|-------------|
| `src/lib/server/db/schema.ts` | New `fileSnapshot` table for tracking file states |
| `src/lib/server/file-snapshot.ts` | Service for creating/checking file snapshots |
| `src/lib/server/journey-watcher.ts` | Extended to watch source files (not just .journey.md) |
| `src/routes/api/reconciliation-status/+server.ts` | API to check POTJ file statuses |
| `src/routes/api/reconcile/+server.ts` | API to trigger targeted re-scan |
| `src/lib/components/ReconciliationBadge.svelte` | Visual badge for changed/deleted files |
| `src/lib/server/gemini-reconcile.ts` | AI-powered POTJ update generation |

**Key Features:**
- **File Tracking**: Store file hashes and modification times when journeys are generated
- **Change Detection**: Compare current files against stored snapshots
- **Visual Badges**: Show "Changed" or "File missing" badges on POTJ cards
- **One-Click Reconcile**: Trigger AI re-analysis of specific POTJs
- **SSE Updates**: Real-time notifications when watched files change

**Implementation Phases:**
1. Database schema for file snapshots
2. File snapshot service (hash computation, status checking)
3. Source file watcher extension
4. Reconciliation status API endpoints
5. UI components (badges, reconcile buttons)
6. AI-powered reconciliation logic

**Estimated Time:** 8.5 hours

---

### ✅ Phase 10: AI-Powered Journey Generation

**Status:** Complete

**Purpose:** Automatically generate journey markdown files from scanning a new codebase.

> See full specification: [`JOURNEY_GENERATION_PLAN.md`](./JOURNEY_GENERATION_PLAN.md)

**Core Components:**
| Component | Description |
|-----------|-------------|
| `src/lib/server/route-analyzer.ts` | Scans routes directory, extracts imports and relationships |
| `src/lib/server/gemini-journey.ts` | AI journey classification and POTJ generation |
| `src/lib/server/journey-writer.ts` | Writes formatted `.journey.md` files |
| `src/routes/api/generate-journeys/+server.ts` | Generation endpoint with progress |
| Home page UI | "Generate Journeys" button with results display |

**Key Features:**
- **Route Analysis**: Discovers all pages, layouts, and API endpoints
- **AI Journey Classification**: Groups routes into persona journeys (Guest, Admin, etc.)
- **Section Classification**: Assigns routes to Beginning/Middle/End sections
- **POTJ Generation**: Creates detailed entries with descriptions, behaviors, code refs
- **Markdown Output**: Writes properly formatted `.journey.md` files
- **Progress UI**: Shows generation progress and results

**Implementation Phases:**
1. Route structure analyzer
2. AI journey classifier (Gemini integration)
3. Section classifier (Beginning/Middle/End)
4. Journey markdown writer
5. Generation API endpoint
6. Generation UI with progress

**Estimated Time:** 9 hours

---

### ✅ Phase 11: Enhanced Profile View with Deep File Analysis

**Status:** Complete

**Purpose:** Display rich file internals (state, functions, dependencies) in organized sections with data tables.

> See full specification: [`ENHANCED_PROFILE_PLAN.md`](./ENHANCED_PROFILE_PLAN.md)

**Core Components:**
| Component | Description |
|-----------|-------------|
| `src/lib/server/file-analyzer.ts` | Parses Svelte/TS files to extract state, functions, props, imports |
| `src/routes/api/analyze-file/+server.ts` | On-demand file analysis endpoint |
| `src/lib/components/DataTable.svelte` | Reusable table component with clickable rows |
| `src/lib/components/ProfileView.svelte` | Enhanced with 5 tabs: Overview, State, Functions, Imports, Chat |
| `src/lib/types/journey.ts` | Extended JourneyMetadata with analysis fields |

**Key Features:**
- **Tab Navigation**: Switch between Overview, State, Functions, Imports, Chat
- **State Table**: Shows all `$state()`, `$derived()`, and `let` declarations with types
- **Functions Table**: Lists all functions with parameters and return types
- **Imports Table**: Categorized imports (project files vs framework modules)
- **Lazy Loading**: File analysis only runs when switching to analysis tabs
- **Clickable Imports**: Click project imports to open in Code Viewer
- **Click-to-Highlight Functions**: Click a function → opens correct file, highlights entire function body
- **Line Numbers**: Code Viewer now displays line numbers
- **Path Resolution**: Handles `$lib/`, `@/`, extension guessing for imports
- **Framework Detection**: Distinguishes `$app/`, `$env/`, `svelte/` as non-clickable

> See full guide: [`PROFILE_VIEW_GUIDE.md`](./PROFILE_VIEW_GUIDE.md)

---

### ⏳ Phase 12: Future Enhancements

**Planned Features:**
- Syntax highlighting in Code Viewer
- Search/filter within Code Bank
- Dependency graph visualization
- Call graph (which functions call which)
- Export/import journey configurations
- Support for additional frameworks (Next.js, Remix)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | SvelteKit 2.49, Svelte 5 |
| Language | TypeScript |
| Database | SQLite via libSQL, Drizzle ORM |
| Styling | TailwindCSS 4 |
| AI | Gemini 1.5 Flash |
| Metadata | gray-matter (YAML parser) |

---

## How to Run

```bash
cd AppV5
npm install
cp .env.example .env
# Add your GEMINI_API_KEY to .env
npm run db:push
npm run dev
```

Then visit http://localhost:5173 and scan a directory!
