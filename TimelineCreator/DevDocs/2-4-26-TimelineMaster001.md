# TimelineCreator — Master Development Document
**Document ID:** 2-4-26-TimelineMaster001  
**Created:** February 4, 2026  
**Project:** Legal Timeline Presentation App

---

## Executive Summary

A 3-page SvelteKit application for creating and presenting interactive legal timelines in courtroom settings. Features Google Sheets integration for live data editing, offline caching for presentation resilience, and a separate print layout state for final adjustments.

---

## Application Architecture

### Core Concept
```
┌─────────────────────────────────────────────────────────────────┐
│                         TimelineCreator                         │
├─────────────────┬─────────────────────┬─────────────────────────┤
│   Page 1        │      Page 2         │        Page 3           │
│   Project       │   New Timeline      │   Editor Interface      │
│   Selector      │      Panel          │   (3 modes)             │
├─────────────────┼─────────────────────┼─────────────────────────┤
│ • List projects │ • Title editor      │ • Editor Mode           │
│ • Create new    │ • Data link input   │ • Preview Mode          │
│ • Delete        │ • Timeline options  │ • Print Preview Mode    │
└─────────────────┴─────────────────────┴─────────────────────────┘
```

### Data Flow
```
Google Sheets (CSV) ──► SvelteKit API ──► Cached Events Table ──► Timeline Viewer
                              │
                              ▼
                     Project Settings DB
                              │
                              ▼
                     Print Layout DB (separate state)
```

### Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | SvelteKit + Svelte 5 |
| Database | SQLite via Drizzle ORM |
| Auth | Session-based (Lucia-style) |
| Styling | Tailwind CSS 4 |
| Data Source | Google Sheets public CSV |

---

## Existing Foundation

| Component | Status | Location |
|-----------|--------|----------|
| SvelteKit + Svelte 5 | ✅ Ready | `package.json` |
| Drizzle ORM + SQLite | ✅ Ready | `drizzle.config.ts`, `local.db` |
| Session-based auth | ✅ Ready | `src/lib/server/auth.ts` |
| Tailwind CSS 4 | ✅ Ready | `package.json` |
| User/session tables | ✅ Ready | `src/lib/server/db/schema.ts` |

---

## Work Breakdown Structure

### Phase 0: Bootstrap & Seed Admin User

#### 0.1 Seed Script
- [ ] Create `scripts/seed-admin.ts` to insert admin user (username: `admin`, password: `admin`)
- [ ] Add npm script: `"db:seed": "tsx scripts/seed-admin.ts"`
- [ ] Run seed to create single admin user

#### 0.2 Auto-Login Hook (No UI)
- [ ] Create startup logic to auto-create session for admin user if none exists
- [ ] Keep auth infrastructure intact for future login/logout UI

---

### Phase 1: Database Schema Extensions

#### 1.1 Project Table
```typescript
// src/lib/server/db/schema.ts
export const project = sqliteTable('project', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  title: text('title').notNull(),
  dataSourceUrl: text('data_source_url'),
  dataSourceType: text('data_source_type'), // 'google_sheets' | 'local_csv'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});
```

#### 1.2 Project Settings Table
```typescript
export const projectSettings = sqliteTable('project_settings', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => project.id),
  colorTheme: text('color_theme'),
  defaultZoomLevel: text('default_zoom_level'), // 'year' | 'month' | 'day' | 'hour'
  labelConfig: text('label_config'), // JSON
  masterTimelineHeight: integer('master_timeline_height'),
  zoomTimelineHeight: integer('zoom_timeline_height')
});
```

#### 1.3 Cached Events Table
```typescript
export const cachedEvents = sqliteTable('cached_events', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => project.id),
  eventData: text('event_data'), // JSON blob
  cachedAt: integer('cached_at', { mode: 'timestamp' }).notNull(),
  etag: text('etag')
});
```

#### 1.4 Print Layout Table
```typescript
export const printLayout = sqliteTable('print_layout', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => project.id),
  layoutData: text('layout_data'), // JSON: positions, sizes, adjustments
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});
```

#### 1.5 Migration Tasks
- [ ] Add all tables to `schema.ts`
- [ ] Run `npm run db:generate`
- [ ] Run `npm run db:push`

---

### Phase 2: API Routes (Server Actions)

#### 2.1 Project CRUD
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | POST | Create new project |
| `/api/projects` | GET | List all projects |
| `/api/projects/[id]` | GET | Get project with settings |
| `/api/projects/[id]` | PATCH | Update project |
| `/api/projects/[id]` | DELETE | Delete project |

#### 2.2 CSV Data Fetching
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects/[id]/events` | GET | Fetch & parse CSV, use cache |

#### 2.3 Print Layout
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects/[id]/print-layout` | GET | Get saved print adjustments |
| `/api/projects/[id]/print-layout` | PUT | Save print adjustments |

---

### Phase 3: Shared Components Library

#### 3.1 Core UI Components
| Component | Purpose |
|-----------|---------|
| `Button.svelte` | Primary, secondary, ghost variants |
| `Input.svelte` | Text input with label, error states |
| `Modal.svelte` | Reusable modal container |
| `Card.svelte` | Project card for selector |
| `Toggle.svelte` | For timeline options |
| `Select.svelte` | Dropdown for zoom levels, themes |
| `Tabs.svelte` | For mode switching |

#### 3.2 Timeline Components
| Component | Purpose |
|-----------|---------|
| `MasterTimeline.svelte` | Bird's-eye minimap view |
| `ZoomTimeline.svelte` | Detailed granular view |
| `TimelineEvent.svelte` | Individual event marker |
| `BrushOverlay.svelte` | Draggable brush for sync |
| `InfoBubble.svelte` | Hover tooltip |
| `MediaLightbox.svelte` | Exhibit viewer |
| `TimelineAxis.svelte` | Date/time labels |
| `TimelineTrack.svelte` | Track container |

#### 3.3 Layout Components
| Component | Purpose |
|-----------|---------|
| `EditorToolbar.svelte` | Editor mode controls |
| `PreviewControls.svelte` | Minimal preview controls |
| `PrintToolbar.svelte` | Print adjustment controls |

---

### Phase 4: Page 1 — Project Selector

**Route:** `/`

#### UI Requirements
- [ ] Project grid/list with cards (title, last edited, thumbnail)
- [ ] "New Timeline" button → Navigate to `/new`
- [ ] Click project → Navigate to `/projects/[id]`
- [ ] Delete button with confirmation modal
- [ ] Empty state design when no projects

#### Files to Create
- `src/routes/+page.svelte`
- `src/routes/+page.server.ts`

---

### Phase 5: Page 2 — New Timeline Panel

**Route:** `/new`

#### Form Fields
- [ ] **Title Editor** — Text input for project name
- [ ] **Data Link Input** — URL field for Google Sheets CSV
- [ ] **Local CSV Upload** — File input (optional)

#### Timeline Options
- [ ] Color theme selector
- [ ] Default zoom level (Year/Month/Day/Hour)
- [ ] Master timeline height slider
- [ ] Zoom timeline height slider

#### Actions
- [ ] **Submit** → Create project, redirect to `/projects/[id]`
- [ ] **Cancel** → Return to `/`

#### Files to Create
- `src/routes/new/+page.svelte`
- `src/routes/new/+page.server.ts`

---

### Phase 6: Page 3 — Editor Interface

**Route:** `/projects/[id]`

#### Mode State Machine
```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  EDITOR  │◄──►│ PREVIEW  │◄──►│  PRINT   │
└──────────┘    └──────────┘    └──────────┘
     │               │               │
     ▼               ▼               ▼
  Full toolbar    No controls    Print toolbar
  Edit settings   Interactive    Drag/resize
  Modify data     Hover/click    Save layout
```

#### Editor Mode
- [ ] Full toolbar visible
- [ ] Inline title editing
- [ ] Change data source URL
- [ ] Adjust timeline options
- [ ] "Refresh Data" button

#### Preview Mode
- [ ] Hide all editor controls
- [ ] Full-screen timeline
- [ ] Interactions: hover bubbles, click lightbox
- [ ] Minimal "Back to Editor" button

#### Print Preview Mode
- [ ] Hide editor controls
- [ ] Print-specific toolbar
- [ ] Drag-to-reposition events
- [ ] Resize handles
- [ ] **Save Print Layout** → Saves to `print_layout` table (NOT editor state)
- [ ] **Print** → Browser print dialog

#### Files to Create
- `src/routes/projects/[id]/+page.svelte`
- `src/routes/projects/[id]/+page.server.ts`
- `src/routes/projects/[id]/+layout.svelte`

---

### Phase 7: Timeline Engine

#### 7.1 Data Parsing
- [ ] CSV parser (Google Sheets format)
- [ ] Expected columns: `Date`, `Time`, `Title`, `Description`, `Exhibit_ID`, `Media_URL`, `Category`
- [ ] Date/time normalization
- [ ] Validation & error reporting

#### 7.2 Time Scale Calculations
- [ ] Timeline bounds (min/max dates)
- [ ] Scale functions: date → pixel
- [ ] Zoom level handlers
- [ ] Brush range state

#### 7.3 Master Timeline Logic
- [ ] Compressed full-duration view
- [ ] Brush overlay for zoom selection
- [ ] Click-to-jump navigation

#### 7.4 Zoom Timeline Logic
- [ ] Detailed view of brush selection
- [ ] Pan/scroll within zoomed range
- [ ] Event clustering for dense periods

#### 7.5 Interactions
- [ ] Hover → InfoBubble
- [ ] Click → MediaLightbox
- [ ] Keyboard navigation
- [ ] Touch/gesture support

---

### Phase 8: Media Lightbox

#### Lightbox Features
- [ ] Modal overlay with close
- [ ] Image support (jpg, png, gif, webp)
- [ ] PDF viewing (iframe or pdf.js)
- [ ] Video playback (HTML5)
- [ ] Exhibit ID in header
- [ ] Next/prev navigation

#### Loading States
- [ ] Spinner while loading
- [ ] Error state for failures
- [ ] Lazy loading

---

### Phase 9: Offline Support

#### Cache Strategy
- [ ] First load: fetch CSV → store in `cached_events`
- [ ] Store timestamp + ETag
- [ ] Check cache freshness on load
- [ ] Manual "Refresh" button

#### Offline Indicator
- [ ] Detect online/offline status
- [ ] Show "Offline Mode" badge
- [ ] Queue sync on reconnect

---

### Phase 10: Print Functionality

#### Print Styles
- [ ] `@media print` rules in `print.css`
- [ ] Hide all controls
- [ ] Optimize for A4/Letter
- [ ] Page break handling

#### Print Layout Editor
- [ ] Drag-and-drop repositioning
- [ ] Resize handles
- [ ] Manual page breaks
- [ ] Annotation overlay

#### Persistence
- [ ] Save to `print_layout` table
- [ ] Load on entering print preview
- [ ] **Print layout ≠ Editor layout**

---

### Phase 11: Polish & UX

#### Loading States
- [ ] Skeleton loaders
- [ ] Timeline shimmer
- [ ] Button loading states

#### Error Handling
- [ ] Toast notifications
- [ ] Inline validation errors
- [ ] Graceful degradation

#### Accessibility
- [ ] Keyboard navigation
- [ ] ARIA labels
- [ ] Focus management
- [ ] High contrast mode

#### Responsive Design
- [ ] Mobile project selector
- [ ] Tablet-optimized timeline
- [ ] Desktop full experience

---

### Phase 12: Testing & Validation

#### Manual Testing Checklist
- [ ] Create project with Google Sheets link
- [ ] Verify CSV parsing
- [ ] Test hover/click interactions
- [ ] Test mode switching
- [ ] Test print layout persistence
- [ ] Test offline mode

#### Edge Cases
- [ ] Empty CSV
- [ ] Malformed dates
- [ ] Missing Media_URL
- [ ] 1000+ events
- [ ] 1-5 events

---

## Task Summary

| Phase | Description | Tasks |
|-------|-------------|-------|
| 0 | Bootstrap | 4 |
| 1 | Schema | 6 |
| 2 | API | 7 |
| 3 | Components | 17 |
| 4 | Page 1 | 5 |
| 5 | Page 2 | 6 |
| 6 | Page 3 | 8 |
| 7 | Timeline Engine | 14 |
| 8 | Lightbox | 6 |
| 9 | Offline | 6 |
| 10 | Print | 7 |
| 11 | Polish | 10 |
| 12 | Testing | 8 |
| **TOTAL** | | **~104** |

---

## Implementation Order

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
                                                      │
                                                      ▼
Phase 12 ← Phase 11 ← Phase 10 ← Phase 9 ← Phase 8 ← Phase 6+7
```

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth | Single admin, no login UI | Simplify MVP; infra ready for future |
| Database | SQLite via Drizzle | Already configured; offline-friendly |
| CSV Source | Google Sheets public CSV | Easy editing for legal team |
| Caching | Server-side in DB | Survives refreshes; works offline |
| Print State | Separate table | Print ≠ digital layout |
| State Mgmt | Svelte 5 runes | Modern, reactive, minimal |

---

## Google Sheets CSV Format

### Expected Columns
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `Date` | String | ✅ | Event date (YYYY-MM-DD or MM/DD/YYYY) |
| `Time` | String | ❌ | Event time (HH:MM or HH:MM:SS) |
| `Title` | String | ✅ | Event title |
| `Description` | String | ❌ | Detailed description |
| `Exhibit_ID` | String | ❌ | Evidence reference (e.g., "Exhibit A") |
| `Media_URL` | String | ❌ | URL to image/PDF/video |
| `Category` | String | ❌ | Event category for color coding |

### Example Sheet
| Date | Time | Title | Description | Exhibit_ID | Media_URL | Category |
|------|------|-------|-------------|------------|-----------|----------|
| 2024-01-15 | 09:30 | Contract Signed | Initial agreement | Exhibit A | https://... | Document |
| 2024-02-20 | 14:00 | Deposition | Witness testimony | Exhibit B | https://... | Testimony |

---

## File Structure (Target)

```
TimelineCreator/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.svelte
│   │   │   │   ├── Input.svelte
│   │   │   │   ├── Modal.svelte
│   │   │   │   ├── Card.svelte
│   │   │   │   ├── Toggle.svelte
│   │   │   │   ├── Select.svelte
│   │   │   │   └── Tabs.svelte
│   │   │   ├── timeline/
│   │   │   │   ├── MasterTimeline.svelte
│   │   │   │   ├── ZoomTimeline.svelte
│   │   │   │   ├── TimelineEvent.svelte
│   │   │   │   ├── BrushOverlay.svelte
│   │   │   │   ├── InfoBubble.svelte
│   │   │   │   ├── MediaLightbox.svelte
│   │   │   │   ├── TimelineAxis.svelte
│   │   │   │   └── TimelineTrack.svelte
│   │   │   └── layout/
│   │   │       ├── EditorToolbar.svelte
│   │   │       ├── PreviewControls.svelte
│   │   │       └── PrintToolbar.svelte
│   │   ├── server/
│   │   │   ├── auth.ts
│   │   │   └── db/
│   │   │       ├── index.ts
│   │   │       └── schema.ts
│   │   └── utils/
│   │       ├── csv-parser.ts
│   │       ├── date-utils.ts
│   │       └── scale-utils.ts
│   └── routes/
│       ├── +page.svelte              # Page 1: Project Selector
│       ├── +page.server.ts
│       ├── new/
│       │   ├── +page.svelte          # Page 2: New Timeline
│       │   └── +page.server.ts
│       ├── projects/
│       │   └── [id]/
│       │       ├── +page.svelte      # Page 3: Editor
│       │       ├── +page.server.ts
│       │       └── +layout.svelte
│       └── api/
│           └── projects/
│               ├── +server.ts
│               └── [id]/
│                   ├── +server.ts
│                   ├── events/
│                   │   └── +server.ts
│                   └── print-layout/
│                       └── +server.ts
├── scripts/
│   └── seed-admin.ts
├── DevDocs/
│   └── 2-4-26-TimelineMaster001.md   # This document
└── static/
    └── print.css
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 001 | 2026-02-04 | Cascade | Initial WBS creation |

---

## Notes

- **Admin credentials:** `admin` / `admin` (development only)
- **No login UI** in MVP — auth infrastructure preserved for future
- **Print layout saves independently** — never affects editor or digital preview
- **Offline-first design** — CSV cached in database for courtroom resilience
