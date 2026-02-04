# Timeline Creator - Progress Journal
## February 4, 2026

This document serves as a master reference for all development work completed on the Timeline Creator application. Use this as a jumping-off point for future development sessions.

---

## Project Overview

**Tech Stack:**
- **Framework:** SvelteKit 5 (using `$state`, `$derived`, `$effect` runes)
- **Styling:** TailwindCSS
- **Database:** SQLite via better-sqlite3
- **Data Source:** Google Sheets CSV export

**Project Location:** `c:\Users\Tributestream\081925-SvelteTweb\TimelineCreator`

---

## Features Implemented

### 1. Timeline Views

#### Line Timeline (MasterTimeline + ZoomTimeline)
- **MasterTimeline** (`src/lib/components/timeline/MasterTimeline.svelte`)
  - Overview of all events across the full date range
  - Draggable brush selection (blue rectangle) to control visible range
  - Brush can be moved left/right and resized from edges
  
- **ZoomTimeline** (`src/lib/components/timeline/ZoomTimeline.svelte`)
  - Detailed view of events within the brush selection range
  - Events positioned as percentages with 5% padding to prevent edge cutoff
  - InfoBubble tooltips on hover

- **Synchronized Scrollbar** (`src/routes/projects/[id]/+page.svelte`)
  - Horizontal scrollbar below ZoomTimeline
  - Draggable thumb that slides left/right (doesn't resize)
  - Arrow buttons for 10% incremental movement
  - Syncs with MasterTimeline brush position

#### Calendar Timeline
- **CalendarTimeline** (`src/lib/components/timeline/CalendarTimeline.svelte`)
  - Grid-based calendar view (month/year granularity options)
  - Color-coded events by category
  - Tooltip popups on event hover
  - Supports custom tooltip text from mapped column

### 2. Tooltip System

- **InfoBubble** (`src/lib/components/timeline/InfoBubble.svelte`)
  - Yellow highlighted tooltip text when custom tooltip column is mapped
  - Falls back to description if no tooltip provided
  - Displays event title and formatted date

- **Custom Tooltip Column**
  - Users can map a "tooltip" column in their spreadsheet
  - Tooltip text displays on hover in both timeline views

### 3. Column Mapping & CSV Parsing

#### CSV Parser (`src/lib/utils/csvParser.ts`)
- Parses CSV data from Google Sheets
- Supports column mapping for flexible schema
- Returns warnings and remapping info instead of 500 errors
- Handles date/time parsing with multiple format support

#### Column Mapping UI (`src/routes/projects/[id]/+page.svelte`)
- Settings modal with column mapping section
- "Load Columns from Spreadsheet" button to fetch available columns
- DataPreviewTable component for mapping UI
- Saves mapping to project settings via API

#### API Endpoint (`src/routes/api/projects/[id]/+server.ts`)
- PATCH endpoint accepts `columnMapping` in settings
- Persists mapping to database

### 4. Media Lightbox

**Component:** `src/lib/components/timeline/MediaLightbox.svelte`

#### Supported Media Types:
- **Images:** Direct display with loading states and error handling
- **PDFs:** Google Docs Viewer embed with scrolling support
- **Videos:** YouTube, Vimeo, and native HTML5 video
- **Google Drive:** Preview embed for Drive-hosted files

#### Image Loading:
- Loading spinner during fetch
- Error state with "Open in new tab" fallback link
- Smooth opacity transition on load

#### PDF Scrolling:
- Wrapped in scrollable container (80vh height)
- Google Docs Viewer handles internal PDF navigation

### 5. Annotation Tools

**Component:** `src/lib/components/ui/AnnotationOverlay.svelte`

#### Tool Types (Fixed Colors, No Color Picker):
| Tool | Color | Description |
|------|-------|-------------|
| Highlight | Yellow (#FBBF24) | Semi-transparent fill, no stroke |
| Line | Red (#DC2626) | Solid line |
| Arrow | Red (#DC2626) | Line with arrowhead |

#### Features:
- Canvas-based drawing overlay
- Works on both images and PDFs
- Undo functionality (removes last annotation)
- Clear all annotations button
- Pointer-events disabled when no tool selected
- Z-index management: z-20 when active, z-10 when inactive

#### Toolbar:
- Highlight, Line, Arrow tool buttons (toggle on/off)
- Undo and Clear buttons
- Status indicator showing active tool

---

## Key Files Reference

### Pages
| File | Purpose |
|------|---------|
| `src/routes/projects/[id]/+page.svelte` | Main editor page with timeline rendering, settings modal, brush/scrollbar sync |
| `src/routes/projects/[id]/+page.server.ts` | Server-side data loading |

### Components
| File | Purpose |
|------|---------|
| `src/lib/components/timeline/MasterTimeline.svelte` | Full timeline overview with brush |
| `src/lib/components/timeline/ZoomTimeline.svelte` | Detailed view of selected range |
| `src/lib/components/timeline/CalendarTimeline.svelte` | Calendar grid view |
| `src/lib/components/timeline/InfoBubble.svelte` | Tooltip component for events |
| `src/lib/components/timeline/MediaLightbox.svelte` | Media viewer with annotations |
| `src/lib/components/ui/AnnotationOverlay.svelte` | Canvas drawing overlay |
| `src/lib/components/ui/DataPreviewTable.svelte` | Column mapping UI |

### API Routes
| File | Purpose |
|------|---------|
| `src/routes/api/projects/[id]/+server.ts` | Project CRUD operations |

### Utilities
| File | Purpose |
|------|---------|
| `src/lib/utils/csvParser.ts` | CSV parsing with column mapping |
| `src/lib/utils/mediaUtils.ts` | Media type detection, URL helpers |

---

## State Management

### Key Reactive Variables (in `+page.svelte`)
```javascript
// Brush control for line timeline
let brushStart = $state(0);    // 0-1 percentage
let brushEnd = $state(1);      // 0-1 percentage

// Column mapping
let availableColumns = $state<string[]>([]);
let columnMapping = $state<Record<string, string>>({});

// Timeline settings
let timelineStyle = $state<'line' | 'calendar'>('line');
let calendarGranularity = $state<'month' | 'year'>('month');
```

### Derived Values
```javascript
const currentEvent = $derived(displayEvents[selectedIndex] || null);
const mediaType = $derived(getMediaType(currentEvent.mediaUrl));
const canAnnotate = $derived(mediaType === 'image' || mediaType === 'pdf');
```

---

## Known Issues / Future Considerations

1. **A11y Warning:** `<div>` with mousedown handler in scrollbar needs ARIA role (line 330 in +page.svelte)

2. **Annotation Overlay State:** `annotationOverlay` variable could use `$state()` for better reactivity tracking

3. **PDF Annotations:** Canvas overlay on PDF iframe may not align perfectly with PDF content when user scrolls the PDF

---

## Recent Session Summary (Feb 4, 2026)

### Completed Today:
1. ✅ Fixed annotation colors (arrow/line = red, highlight = yellow, no color picker)
2. ✅ Removed stroke from highlight tool (soft transparent fill only)
3. ✅ Fixed image loading in lightbox
4. ✅ Added PDF scrollbar support
5. ✅ Ensured annotation tools work for both images and PDFs
6. ✅ Proper z-index layering for annotation canvas

### Previous Sessions:
- Column mapping UI and persistence
- Tooltip display from custom column
- Brush/scrollbar synchronization for line timeline
- December event cutoff fix (5% padding)
- Multiple timeline view support (line vs calendar)

---

## How to Continue Development

1. **Start the dev server:**
   ```bash
   cd TimelineCreator
   npm run dev
   ```

2. **Key areas to explore:**
   - Timeline rendering: `src/lib/components/timeline/`
   - Media handling: `MediaLightbox.svelte` + `mediaUtils.ts`
   - Data parsing: `csvParser.ts`
   - Project settings: API route + page component

3. **Testing annotations:**
   - Open any event with an image or PDF
   - Use the toolbar buttons (highlight, line, arrow)
   - Draw on the media
   - Test undo and clear functions

---

*Last updated: February 4, 2026*
