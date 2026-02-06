# TimelineCreator — New UI Plan & Work Breakdown Structure
**Document ID:** 1-6-26-newuiplan  
**Created:** February 6, 2026  
**Project:** Legal Timeline Editor — 4-Tab Redesign

---

## Overview

Redesign the editor interface (`/projects/[id]`) from a single empty workspace into a **4-tab sidebar-driven editor** with a contextual top toolbar. Each tab represents a distinct phase of the timeline creation workflow.

---

## Architecture

```
┌─ Top Navbar ──────────────────────────────────────────────────┐
│  [← Back] [Project Title]        [Tool Buttons (Tab 3 only)] │
├───────────┬───────────────────────────────────────────────────┤
│  Sidebar  │                                                   │
│           │                                                   │
│  1. Schema│            Main Workspace                         │
│  2. Data  │            (content changes per active tab)       │
│  3. Editor│                                                   │
│  4. Preview│                                                  │
│           │                                                   │
│  [Back to │                                                   │
│  Projects]│                                                   │
└───────────┴───────────────────────────────────────────────────┘
```

### Tab Flow (Left → Right)

```
Schema → Data → Editor → Preview
  │        │       │         │
  ▼        ▼       ▼         ▼
Define   Import  Arrange   Interact
columns  CSV     timeline  & Print
& types  file    visually
```

---

## Tab 1: Schema Editor

### Purpose
Define the data structure before importing data. Map CSV column names to semantic roles (Date, Title, Category, etc.) and configure category → color associations.

### UI Components

| Component | Description |
|-----------|-------------|
| **Column Mapping Table** | Rows for each semantic field (Date, Title, Description, Category, Facility, Exhibit_ID, Media_URL). Each row has a dropdown to select which CSV column maps to it. |
| **Category Color Config** | A list of category entries, each with: name input, color picker, keyword auto-detect rules. Pre-populated with Legal/Medical defaults (Yellow, Red, Orange, Green). |
| **Add/Remove Category** | Buttons to add custom categories or remove unused ones. |
| **Template Selector** | Dropdown to apply a preset schema template (e.g., "Legal/Medical", "Generic", "Custom"). Selecting one pre-fills column mappings and categories. |
| **Save Schema** | Persists to `projectSettings.columnMapping` and a new `projectSettings.categoryConfig` field. |

### Data Model Changes

```typescript
// Add to projectSettings in schema.ts
categoryConfig: text('category_config') // JSON: [{ name, color, keywords[] }]
```

### Default Categories (Legal/Medical Template)

| Category | Color | Hex | Auto-Keywords |
|----------|-------|-----|---------------|
| Medical Treatment | Yellow | `#FFFF00` | surgery, clinic, imaging, injection, visit |
| Incident/Accident | Red | `#CC0000` | MVA, fall, accident, injury, collision |
| Legal Milestone | Orange | `#FF9900` | filing, deposition, subject accident, complaint |
| Gap in Treatment | Green | `#006600` | no treatment, gap, none |

### Tasks

- [ ] **1.1** Create `SchemaEditor.svelte` component
- [ ] **1.2** Build Column Mapping Table UI with dropdowns
- [ ] **1.3** Build Category Color Config UI with color pickers
- [ ] **1.4** Create template presets in `$lib/config/templates.ts`
- [ ] **1.5** Add `categoryConfig` field to DB schema + migration
- [ ] **1.6** Wire Save Schema to PATCH `/api/projects/[id]`
- [ ] **1.7** Load existing schema on mount (pre-fill if CSV already imported)

---

## Tab 2: Add Data

### Purpose
Import a CSV file from the local filesystem, preview the parsed data in a table, and confirm/edit before committing to the project.

### UI States

```
State 1: Empty          State 2: Preview/Edit       State 3: Confirmed
┌──────────────────┐    ┌──────────────────────┐    ┌──────────────────┐
│                  │    │ ┌──────────────────┐  │    │ ✅ 47 events     │
│   [📁 Add Data]  │───►│ │ Data Table       │  │───►│    imported       │
│                  │    │ │ (editable cells) │  │    │                  │
│  Drop CSV here   │    │ └──────────────────┘  │    │ [Re-import]      │
│  or click to     │    │ Errors: 2 rows skipped│    │ [Edit Data]      │
│  browse          │    │                      │    │ [Clear Data]     │
│                  │    │ [Confirm] [Cancel]   │    │                  │
└──────────────────┘    └──────────────────────┘    └──────────────────┘
```

### UI Components

| Component | Description |
|-----------|-------------|
| **Add Data Button** | Large centered button + drag-drop zone. Opens native file browser (`<input type="file" accept=".csv">`). |
| **Data Preview Table** | Scrollable table showing all parsed rows. Column headers match the CSV. Cells are editable inline. |
| **Validation Summary** | Shows row count, error count, and specific error messages (e.g., "Row 12: Invalid date format"). |
| **Category Preview Column** | If Schema is configured, shows auto-detected category color for each row as a colored dot. |
| **Confirm / Cancel** | Confirm parses + caches data. Cancel discards the import. |
| **Post-Confirm View** | Shows summary stats + options to re-import, edit, or clear. |

### Data Flow

```
File Browser → FileReader API → csv-parser.ts → Preview Table → Confirm → 
  Server Action (POST /api/projects/[id]/events) → cached_events table
```

### Tasks

- [ ] **2.1** Create `DataImporter.svelte` component (empty state + file input)
- [ ] **2.2** Implement drag-and-drop CSV upload zone
- [ ] **2.3** Wire FileReader to existing `parseCSV()` with column mapping from Tab 1
- [ ] **2.4** Build `DataPreviewTable.svelte` — editable table with inline cell editing
- [ ] **2.5** Add validation summary bar (row count, errors, warnings)
- [ ] **2.6** Auto-detect categories using keyword rules from Schema
- [ ] **2.7** Implement Confirm action → POST to server → cache events
- [ ] **2.8** Build post-confirm summary view with re-import/edit/clear actions
- [ ] **2.9** Support Google Sheets URL import as alternative to file upload

---

## Tab 3: Timeline Editor

### Purpose
The main visual workspace. Data is pre-populated into a column-based timeline. The top navbar shows tool buttons for editing the visual layout.

### Layout

```
┌─ Top Toolbar ─────────────────────────────────────────────────────────┐
│ [Zoom: Macro|Normal|Micro] [Spacer: Uniform|Chrono] [🖌 Stamp]      │
│ [🔍 Keyword Search] [Filter ▼] [Undo] [Redo]                        │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─2008──┐  ┌─2009──┐  ┌─2010──┐  ┌─2011──┐  ┌─2012──┐             │
│  │ ░░░░░ │  │ ░░░░░ │  │ ░░░░░ │  │ ░░░░░ │  │ ░░░░░ │   ──►scroll │
│  │ ░░░░░ │  │ ░░░░░ │  │       │  │ ░░░░░ │  │       │             │
│  │ ░░░░░ │  │       │  │       │  │ ░░░░░ │  │       │             │
│  └───────┘  └───────┘  └───────┘  └───────┘  └───────┘             │
│                                                                       │
│  ┌─ Minimap ──────────────────────────────────────────┐              │
│  │ [====]                                              │              │
│  └─────────────────────────────────────────────────────┘              │
└───────────────────────────────────────────────────────────────────────┘
```

### Tool Buttons (Top Navbar)

| Tool | Description |
|------|-------------|
| **Zoom Level** | 3-way toggle: Macro (years + accidents only), Normal (all boxes, date + title), Micro (full clinical notes) |
| **Smart Spacer** | Toggle: Uniform (equal gaps) vs Chronological (gap proportional to time elapsed) |
| **Category Stamper** | Brush mode — pick a category, click boxes to re-categorize |
| **Keyword Search** | Global search input — highlights all matches across the timeline |
| **Filter Dropdown** | Checkboxes per category to show/hide |
| **Undo / Redo** | Standard undo/redo for category changes and manual edits |

### Record Box Anatomy

```
┌─────────────────────────────┐
│ 01/15/2008                  │  ← Bold date (primary sort key)
│ Paradise Palms Chiropractic │  ← Facility name (underlined)
├─────────────────────────────┤
│ • Initial consultation      │  ← Clinical summary
│ • Cervical spine exam       │     (visible at Normal + Micro)
│ • Prescribed PT 3x/week    │
│                             │
│ [Exhibit A] 📎              │  ← Media link badge (if present)
└─────────────────────────────┘
   Background: #FFFF00 (Medical Treatment)
   Border: 1px solid #000
```

### Timeline Component Architecture

```
ColumnTimeline.svelte
├── TimelineCanvas.svelte        (horizontal scroll container)
│   ├── YearColumn.svelte        (one per year, vertical stack)
│   │   ├── YearHeader.svelte    (centered year label)
│   │   └── RecordBox.svelte     (individual event card)
│   │       ├── BoxHeader        (date + facility)
│   │       ├── BoxContent       (clinical summary)
│   │       └── BoxBadges        (exhibit, UDS flags)
│   └── GapIndicator.svelte      (green "No Treatment" blocks)
├── TimelineMinimap.svelte       (compressed navigation bar)
└── EditorToolbar.svelte         (top tool buttons)
```

### Tasks

- [ ] **3.1** Create `ColumnTimeline.svelte` — data-driven: events → groupByYear → render
- [ ] **3.2** Create `YearColumn.svelte` — vertical flex container with header
- [ ] **3.3** Create `RecordBox.svelte` — event card with category colors, bold dates, borders
- [ ] **3.4** Create `GapIndicator.svelte` — green centered "No Treatment" blocks
- [ ] **3.5** Implement horizontal scrolling canvas with overflow-x
- [ ] **3.6** Build `EditorToolbar.svelte` — zoom, spacer, stamp, search, filter, undo/redo
- [ ] **3.7** Implement Chronological Zoom (Macro/Normal/Micro state machine)
- [ ] **3.8** Implement Smart Spacer (Uniform vs Chronological gap calculation)
- [ ] **3.9** Implement Category Stamper brush mode
- [ ] **3.10** Implement Keyword Auto-Highlighter (global search + `<mark>` injection)
- [ ] **3.11** Implement Category Filter toggle (show/hide by category)
- [ ] **3.12** Build `TimelineMinimap.svelte` — compressed nav with viewport indicator
- [ ] **3.13** Implement undo/redo stack for category and content changes

---

## Tab 4: Preview

### Purpose
Read-only interactive preview of the final timeline. No editing controls. Generate a print-optimized version.

### UI Components

| Component | Description |
|-----------|-------------|
| **Full-Screen Timeline** | Same ColumnTimeline but with all editor controls hidden. |
| **Hover Info Bubbles** | Hovering a record box shows a detailed tooltip with full clinical notes. |
| **Click → Lightbox** | Clicking a box with media opens the MediaLightbox for exhibits. |
| **Print Controls** | A floating bar with: [Print Preview] [Download PDF] [Export Image]. |
| **Print Layout Adjuster** | Optional drag-to-reposition for print-specific layout tweaks (saves to `print_layout` table). |

### Print Output

```
@media print:
- Hide sidebar, navbar, all controls
- Force white background
- Optimize for Letter/A4
- Page breaks between year columns
- Headers repeat on each page
```

### Tasks

- [ ] **4.1** Create `PreviewMode.svelte` — read-only timeline wrapper
- [ ] **4.2** Implement hover InfoBubble with full clinical details
- [ ] **4.3** Wire click → MediaLightbox for exhibit viewing
- [ ] **4.4** Build floating print controls bar
- [ ] **4.5** Implement `@media print` CSS rules
- [ ] **4.6** Add page break logic between year columns
- [ ] **4.7** Optional: drag-to-reposition print layout editor
- [ ] **4.8** Save/load print layout to `print_layout` table

---

## Sidebar & Navigation

### Tasks

- [ ] **5.1** Refactor `projects/[id]/+page.svelte` — replace empty workspace with tab system
- [ ] **5.2** Create sidebar tab navigation (Schema / Data / Editor / Preview)
- [ ] **5.3** Add active tab state with visual indicator (highlight, icon change)
- [ ] **5.4** Conditionally render top navbar tool buttons (only on Tab 3)
- [ ] **5.5** Add tab transition animations
- [ ] **5.6** Persist active tab in URL query param (`?tab=editor`)

---

## Shared Infrastructure

### Tasks

- [ ] **6.1** Create `$lib/config/templates.ts` — preset schema templates
- [ ] **6.2** Create `$lib/config/categories.ts` — default category definitions
- [ ] **6.3** Create `$lib/stores/editor.ts` — shared editor state (active tab, zoom level, filters, brush mode, undo stack)
- [ ] **6.4** Add `categoryConfig` to DB schema + run migration
- [ ] **6.5** Update `/api/projects/[id]` PATCH to handle new fields
- [ ] **6.6** Create `/api/projects/[id]/upload` POST endpoint for CSV file upload

---

## Task Summary

| Section | Description | Tasks |
|---------|-------------|-------|
| Tab 1 | Schema Editor | 7 |
| Tab 2 | Add Data | 9 |
| Tab 3 | Timeline Editor | 13 |
| Tab 4 | Preview | 8 |
| Nav | Sidebar & Navigation | 6 |
| Infra | Shared Infrastructure | 6 |
| **TOTAL** | | **49** |

---

## Implementation Order

```
Phase 1: Infra + Navigation (6.1–6.6, 5.1–5.6)
     ▼
Phase 2: Schema Editor (1.1–1.7)
     ▼
Phase 3: Data Import (2.1–2.9)
     ▼
Phase 4: Timeline Editor (3.1–3.13)
     ▼
Phase 5: Preview & Print (4.1–4.8)
```

---

## File Structure (New/Modified)

```
src/
├── lib/
│   ├── components/
│   │   ├── editor/
│   │   │   ├── SchemaEditor.svelte       ← Tab 1
│   │   │   ├── DataImporter.svelte       ← Tab 2 (empty + upload)
│   │   │   ├── DataPreviewTable.svelte   ← Tab 2 (preview/edit)
│   │   │   ├── EditorToolbar.svelte      ← Tab 3 (top nav tools)
│   │   │   └── PreviewMode.svelte        ← Tab 4
│   │   ├── timeline/
│   │   │   ├── ColumnTimeline.svelte     ← NEW: core layout
│   │   │   ├── YearColumn.svelte         ← NEW: year container
│   │   │   ├── RecordBox.svelte          ← NEW: event card
│   │   │   ├── GapIndicator.svelte       ← NEW: gap blocks
│   │   │   └── TimelineMinimap.svelte    ← NEW: nav minimap
│   │   └── ui/
│   │       ├── ColorPicker.svelte        ← EXISTS
│   │       └── DataPreviewTable.svelte   ← EXISTS (may reuse)
│   ├── config/
│   │   ├── templates.ts                  ← NEW: schema presets
│   │   └── categories.ts                ← NEW: category defaults
│   └── stores/
│       └── editor.ts                     ← NEW: shared editor state
├── routes/
│   └── projects/
│       └── [id]/
│           ├── +page.svelte              ← MODIFY: add tab system
│           └── +page.server.ts           ← EXISTS
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 001 | 2026-02-06 | Cascade | Initial WBS for 4-tab editor redesign |
