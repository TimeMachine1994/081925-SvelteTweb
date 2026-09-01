# WEBMAP IMPLEMENTATION GUIDE

**Interactive Codebase Visualization Tool**  
**Route:** `/webmap`  
**Created:** December 19, 2025

---

## PROJECT OVERVIEW

An interactive, single-page web application that visualizes the entire TributeStream codebase with a drag-and-drop interface, allowing developers to:
- Browse the project structure visually
- View file contents with syntax highlighting
- Organize files into custom groups
- Search and filter files
- Understand file relationships and dependencies

---

## ARCHITECTURE

### Tech Stack
- **Frontend:** SvelteKit + Svelte 5 (with runes)
- **Styling:** TailwindCSS
- **Visualization:** Custom implementation with Svelte stores
- **Syntax Highlighting:** Highlight.js or Prism.js
- **Drag & Drop:** Native HTML5 Drag & Drop API
- **Icons:** Lucide Svelte

### File Structure
```
frontend/src/
├── routes/
│   └── webmap/
│       ├── +page.svelte          # Main webmap UI
│       ├── +page.server.ts       # SSR data loading
│       └── api/
│           ├── file-tree/
│           │   └── +server.ts    # File tree endpoint
│           ├── file-content/
│           │   └── +server.ts    # File content endpoint
│           └── stats/
│               └── +server.ts    # Project stats endpoint
├── lib/
│   ├── components/
│   │   └── webmap/
│   │       ├── FileTreeSidebar.svelte
│   │       ├── VisualCanvas.svelte
│   │       ├── FileCard.svelte
│   │       ├── FileViewer.svelte
│   │       ├── SearchBar.svelte
│   │       └── StatsPanel.svelte
│   ├── stores/
│   │   └── webmap.ts             # Svelte stores for state
│   ├── types/
│   │   └── webmap.ts             # TypeScript interfaces
│   └── utils/
│       └── webmap/
│           ├── fileTree.ts       # File tree utilities
│           ├── fileGroups.ts     # Grouping logic
│           └── fileAnalysis.ts   # File analysis utilities
```

---

## IMPLEMENTATION PHASES

### **PHASE 1: Foundation & Data Layer** (Steps 1-5)
Set up basic structure, API endpoints, and data models

### **PHASE 2: Core UI Components** (Steps 6-10)
Build the main interface components

### **PHASE 3: Interactivity** (Steps 11-14)
Add drag-and-drop, search, and filtering

### **PHASE 4: Advanced Features** (Steps 15-18)
Enhance with statistics, relationships, and polish

---

## DETAILED IMPLEMENTATION STEPS

### **STEP 1: Create Type Definitions**

**File:** `frontend/src/lib/types/webmap.ts`

**Action:** Define TypeScript interfaces for the webmap data structures

**Types to Define:**
```typescript
// Core file node structure
interface FileNode {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  type: 'file' | 'folder';
  extension?: string;
  size: number;
  lines?: number;
  lastModified: Date;
  children?: FileNode[];
}

// File metadata and analysis
interface FileMetadata {
  path: string;
  description?: string;
  tags: string[];
  language: string;
  imports?: string[];
  exports?: string[];
  complexity?: number;
}

// Custom file groups
interface FileGroup {
  id: string;
  title: string;
  description: string;
  color: string;
  icon?: string;
  files: string[];
}

// Search and filter state
interface FilterState {
  query: string;
  fileTypes: string[];
  tags: string[];
  dateRange?: { start: Date; end: Date };
  sizeRange?: { min: number; max: number };
}

// Project statistics
interface ProjectStats {
  totalFiles: number;
  totalFolders: number;
  totalLines: number;
  languageBreakdown: Record<string, number>;
  largestFiles: Array<{ path: string; size: number }>;
  recentlyModified: Array<{ path: string; date: Date }>;
}

// View state
interface ViewState {
  selectedFile: string | null;
  selectedGroup: string | null;
  expandedFolders: Set<string>;
  zoom: number;
  panOffset: { x: number; y: number };
}
```

**Acceptance Criteria:**
- All types exported and properly documented
- Types compile without errors
- Covers all data structures needed for the application

---

### **STEP 2: Create File Tree API Endpoint**

**File:** `frontend/src/routes/webmap/api/file-tree/+server.ts`

**Action:** Build API endpoint that reads the project directory and returns a structured file tree

**Implementation Details:**
- Use Node.js `fs` module to read directory structure
- Recursively traverse directories
- Exclude: `node_modules`, `.git`, `build`, `.svelte-kit`, `dist`
- Calculate file sizes and line counts
- Return JSON structure matching `FileNode` interface

**Endpoint:**
- **Method:** GET
- **Route:** `/webmap/api/file-tree`
- **Query Params:** 
  - `path` (optional) - Specific directory to scan
  - `depth` (optional) - Maximum depth to traverse

**Response Format:**
```json
{
  "root": {
    "id": "root",
    "name": "081925-SvelteTweb",
    "path": "c:/Users/sanch/worker 2/081925-SvelteTweb",
    "type": "folder",
    "children": [...]
  },
  "stats": {
    "totalFiles": 342,
    "totalFolders": 87
  }
}
```

**Acceptance Criteria:**
- Successfully reads entire project structure
- Returns valid JSON matching FileNode structure
- Excludes ignored directories
- Handles errors gracefully (permission denied, etc.)
- Performance: < 2 seconds for full scan

---

### **STEP 3: Create File Content API Endpoint**

**File:** `frontend/src/routes/webmap/api/file-content/+server.ts`

**Action:** Build API endpoint that returns the contents of a specific file

**Implementation Details:**
- Accept file path as query parameter
- Read file contents
- Return with metadata (size, extension, language)
- Security: Only allow reading files within project directory

**Endpoint:**
- **Method:** GET
- **Route:** `/webmap/api/file-content`
- **Query Params:** 
  - `path` (required) - Absolute path to file

**Response Format:**
```json
{
  "path": "/frontend/src/lib/types/memorial.ts",
  "name": "memorial.ts",
  "content": "export interface Memorial {...}",
  "lines": 148,
  "size": 4523,
  "language": "typescript",
  "extension": ".ts"
}
```

**Security Considerations:**
- Validate path is within project root
- Prevent directory traversal attacks (../)
- Limit file size (max 1MB for display)
- Sanitize output

**Acceptance Criteria:**
- Successfully reads file contents
- Returns proper error for non-existent files
- Security validation passes
- Handles binary files gracefully

---

### **STEP 4: Create Project Stats API Endpoint**

**File:** `frontend/src/routes/webmap/api/stats/+server.ts`

**Action:** Build API endpoint that returns project-wide statistics

**Implementation Details:**
- Analyze file tree data
- Count files by extension
- Calculate total lines of code
- Find largest files
- Track recently modified files

**Endpoint:**
- **Method:** GET
- **Route:** `/webmap/api/stats`

**Response Format:**
```json
{
  "totalFiles": 342,
  "totalFolders": 87,
  "totalLines": 45382,
  "languageBreakdown": {
    "TypeScript": 60,
    "Svelte": 30,
    "Markdown": 10
  },
  "largestFiles": [
    { "path": "/frontend/src/routes/...", "lines": 704, "size": 28560 }
  ],
  "recentlyModified": [
    { "path": "/DATABASE_SCHEMA.md", "date": "2025-12-19T13:35:00Z" }
  ]
}
```

**Acceptance Criteria:**
- Accurate file counts
- Correct language detection
- Performance: < 1 second
- Cacheable (consider caching strategy)

---

### **STEP 5: Create Webmap State Store**

**File:** `frontend/src/lib/stores/webmap.ts`

**Action:** Create Svelte stores for managing webmap application state

**Stores to Create:**
```typescript
// File tree data
export const fileTree = writable<FileNode | null>(null);

// Current view state
export const viewState = writable<ViewState>({
  selectedFile: null,
  selectedGroup: null,
  expandedFolders: new Set(),
  zoom: 1,
  panOffset: { x: 0, y: 0 }
});

// Filter state
export const filterState = writable<FilterState>({
  query: '',
  fileTypes: [],
  tags: [],
  dateRange: undefined,
  sizeRange: undefined
});

// Custom groups
export const customGroups = writable<FileGroup[]>([
  {
    id: 'routes',
    title: 'Frontend Routes',
    description: 'SvelteKit pages and API endpoints',
    color: '#3b82f6',
    icon: 'route',
    files: []
  },
  {
    id: 'components',
    title: 'Components',
    description: 'Reusable Svelte components',
    color: '#10b981',
    icon: 'box',
    files: []
  }
  // ... more default groups
]);

// Project stats
export const projectStats = writable<ProjectStats | null>(null);

// Loading states
export const isLoadingTree = writable(false);
export const isLoadingFile = writable(false);

// Derived stores
export const filteredFiles = derived(
  [fileTree, filterState],
  ([$fileTree, $filterState]) => {
    // Filter logic here
    return filterFileTree($fileTree, $filterState);
  }
);
```

**Acceptance Criteria:**
- All stores properly typed
- Derived stores work correctly
- Store updates trigger reactivity
- No memory leaks

---

### **STEP 6: Build Main Webmap Page**

**File:** `frontend/src/routes/webmap/+page.svelte`

**Action:** Create the main webmap page with layout structure

**Layout Structure:**
```svelte
<script lang="ts">
  // Layout: 3-column grid
  // Left: Sidebar (file tree + groups)
  // Center: Visual canvas (file cards)
  // Right: Info panel (file viewer/stats)
  // Bottom: Code viewer (expandable)
</script>

<div class="webmap-container">
  <header>
    <h1>🗺️ TributeStream WebMap</h1>
    <SearchBar />
    <button>Settings</button>
  </header>
  
  <div class="webmap-layout">
    <aside class="sidebar">
      <FileTreeSidebar />
    </aside>
    
    <main class="canvas">
      <VisualCanvas />
    </main>
    
    <aside class="info-panel">
      <StatsPanel />
    </aside>
  </div>
  
  <div class="code-viewer">
    <FileViewer />
  </div>
</div>
```

**Styling:**
- Full viewport height
- Resizable panels
- Dark theme by default
- Responsive (mobile: stacked layout)

**Acceptance Criteria:**
- Layout renders correctly
- All panels visible
- No layout shift
- Responsive design works

---

### **STEP 7: Build File Tree Sidebar Component**

**File:** `frontend/src/lib/components/webmap/FileTreeSidebar.svelte`

**Action:** Create collapsible file tree sidebar

**Features:**
- Recursive folder structure
- Expand/collapse folders
- Click to select file
- Icons for file types
- Search highlighting
- Folder badges (file count)

**UI Elements:**
```
📁 frontend/ (342)
  📁 src/ (287)
    📁 routes/ (147)
      📄 +layout.svelte
      📄 +page.svelte
      📁 webmap/ (5)
        📄 +page.svelte ← Selected
    📁 lib/ (140)
      📁 components/ (85)
      📁 types/ (15)
```

**Interactivity:**
- Click folder to expand/collapse
- Click file to view in canvas
- Hover shows tooltip with path
- Right-click for context menu (future)

**Acceptance Criteria:**
- Full tree renders without errors
- Expand/collapse works smoothly
- Selected state persists
- Virtualization for large trees (if needed)
- Smooth animations

---

### **STEP 8: Build File Card Component**

**File:** `frontend/src/lib/components/webmap/FileCard.svelte`

**Action:** Create draggable file card for canvas display

**Card Design:**
```
┌─────────────────────────────┐
│ 📄 memorial.ts              │ ← Icon + filename
├─────────────────────────────┤
│ Memorial Interface          │ ← Description
│                             │
│ 148 lines • TypeScript      │ ← Metadata
│ Modified: 2 days ago        │
│                             │
│ 🏷️ types 🏷️ core           │ ← Tags
│                             │
│ [View] [Copy Path]          │ ← Actions
└─────────────────────────────┘
```

**Props:**
- `file: FileNode`
- `selected: boolean`
- `draggable: boolean`

**Features:**
- Color-coded border by file type
- Badge indicators (new, large, etc.)
- Click to open in viewer
- Drag to move/group
- Hover for details

**Acceptance Criteria:**
- Card renders with all info
- Responsive sizing
- Smooth hover effects
- Click handlers work
- Draggable (Step 11)

---

### **STEP 9: Build Visual Canvas Component**

**File:** `frontend/src/lib/components/webmap/VisualCanvas.svelte`

**Action:** Create main canvas area for displaying file cards

**Layout Options:**
- **Grid Layout** (default) - Cards in grid
- **Masonry Layout** - Pinterest-style
- **List Layout** - Traditional list view

**Features:**
- Pan and zoom
- Multiple layout modes
- Drop zones for grouping
- Selection tools (click, drag-select)
- Minimap (optional)

**Canvas Controls:**
```
[Grid View] [List View] [Zoom: 100%] [Reset View]
```

**Acceptance Criteria:**
- Cards display in grid
- Layout switches work
- Zoom and pan smooth
- No performance issues with 100+ cards
- Drop zones visible

---

### **STEP 10: Build File Viewer Component**

**File:** `frontend/src/lib/components/webmap/FileViewer.svelte`

**Action:** Create code viewer with syntax highlighting

**Features:**
- Syntax highlighting (by file extension)
- Line numbers
- Copy code button
- Download file button
- Full-screen mode
- Line wrapping toggle

**Viewer Layout:**
```
┌─────────────────────────────────────────┐
│ memorial.ts                    [Copy] [↗]│
├─────────────────────────────────────────┤
│  1  export interface Memorial {         │
│  2    id: string;                       │
│  3    lovedOneName: string;             │
│  4    slug: string;                     │
│  5    fullSlug: string;                 │
│     ...                                 │
│ 148  }                                  │
└─────────────────────────────────────────┘
```

**Syntax Highlighting:**
- Use Highlight.js or Prism.js
- Support: TypeScript, JavaScript, Svelte, Markdown, CSS, JSON
- Theme: VS Code Dark+ or GitHub Dark

**Acceptance Criteria:**
- Code displays with highlighting
- Line numbers align properly
- Copy button works
- Large files don't freeze UI (virtualization)
- Theme matches app

---

### **STEP 11: Implement Drag & Drop**

**Files:**
- `FileCard.svelte` (make draggable)
- `VisualCanvas.svelte` (drop zones)
- `FileTreeSidebar.svelte` (drop targets)

**Action:** Add HTML5 drag-and-drop functionality

**Drag Sources:**
- File cards from canvas
- Files from sidebar tree

**Drop Targets:**
- Custom group areas
- Canvas (reposition)
- Trash/remove zone

**Implementation:**
```typescript
// On FileCard
let isDragging = $state(false);

function handleDragStart(e: DragEvent) {
  e.dataTransfer.setData('file-path', file.path);
  isDragging = true;
}

function handleDragEnd() {
  isDragging = false;
}

// On DropZone
function handleDrop(e: DragEvent, groupId: string) {
  e.preventDefault();
  const filePath = e.dataTransfer.getData('file-path');
  addFileToGroup(filePath, groupId);
}
```

**Visual Feedback:**
- Dragged card becomes semi-transparent
- Drop zones highlight on drag-over
- Cursor changes
- Smooth animations

**Acceptance Criteria:**
- Drag works smoothly
- Drop zones respond correctly
- Files added to groups
- Visual feedback clear
- No drag bugs

---

### **STEP 12: Implement Search Functionality**

**File:** `frontend/src/lib/components/webmap/SearchBar.svelte`

**Action:** Create search bar with filtering

**Search Features:**
- Text search (filename, path, content preview)
- File type filters
- Tag filters
- Date range filters
- Size filters

**Search UI:**
```
┌─────────────────────────────────────────┐
│ 🔍 Search files...                      │
├─────────────────────────────────────────┤
│ Filters:                                │
│ ☑ .svelte  ☑ .ts  ☐ .md               │
│ Date: [Last 7 days ▼]                  │
│ Size: [< 500 lines ▼]                  │
└─────────────────────────────────────────┘
```

**Search Logic:**
- Fuzzy matching for filenames
- Highlight matches in results
- Real-time filtering (debounced)
- Save recent searches
- Keyboard shortcuts (Cmd+K)

**Acceptance Criteria:**
- Search finds files accurately
- Filters work correctly
- Results update in real-time
- Performance good with large codebase
- Keyboard navigation works

---

### **STEP 13: Implement File Grouping System**

**File:** `frontend/src/lib/utils/webmap/fileGroups.ts`

**Action:** Create system for organizing files into custom groups

**Default Groups:**
```typescript
const defaultGroups: FileGroup[] = [
  {
    id: 'routes',
    title: 'Frontend Routes',
    description: 'SvelteKit pages and API endpoints',
    color: '#3b82f6',
    icon: 'route',
    files: [] // Auto-detected
  },
  {
    id: 'components',
    title: 'Components',
    description: 'Reusable Svelte components',
    color: '#10b981',
    icon: 'box',
    files: []
  },
  {
    id: 'types',
    title: 'Type Definitions',
    description: 'TypeScript interfaces',
    color: '#8b5cf6',
    icon: 'code',
    files: []
  },
  {
    id: 'docs',
    title: 'Documentation',
    description: 'Markdown documentation files',
    color: '#f59e0b',
    icon: 'file-text',
    files: []
  }
];
```

**Auto-Detection Logic:**
- Scan file tree
- Match patterns (e.g., `/routes/`, `/components/`)
- Add files to appropriate groups
- User can override

**Group Management:**
- Create custom groups
- Add/remove files from groups
- Delete groups
- Export/import group configurations
- Persist in localStorage

**Acceptance Criteria:**
- Groups auto-populate correctly
- User can create custom groups
- Drag-drop to groups works
- Groups persist across sessions
- Export/import works

---

### **STEP 14: Build Stats Panel Component**

**File:** `frontend/src/lib/components/webmap/StatsPanel.svelte`

**Action:** Create statistics dashboard panel

**Stats to Display:**
```
📊 Project Overview

Total Files: 342
Total Folders: 87
Total Lines: 45,382

📈 Language Breakdown
TypeScript: 60% (204 files)
Svelte: 30% (102 files)
Markdown: 10% (36 files)

📦 Largest Files
1. +page.svelte (704 lines)
2. Calculator.svelte (523 lines)
3. memorial.ts (148 lines)

⏰ Recently Modified
1. DATABASE_SCHEMA.md (2 min ago)
2. webmap/+page.svelte (5 min ago)
3. memorial.ts (2 hours ago)

🎯 File Type Distribution
.svelte: 102
.ts: 89
.md: 78
.js: 43
.json: 30
```

**Visualizations:**
- Pie chart for language breakdown
- Bar chart for file types
- Timeline for recent activity

**Acceptance Criteria:**
- All stats display correctly
- Charts render properly
- Updates when filters change
- Responsive layout
- Fast rendering

---

### **STEP 15: Add File Analysis & Metadata**

**File:** `frontend/src/lib/utils/webmap/fileAnalysis.ts`

**Action:** Analyze files for additional metadata

**Analysis Features:**
- Detect imports/exports
- Calculate complexity (cyclomatic complexity)
- Find TODO/FIXME comments
- Detect unused exports
- Find circular dependencies

**Metadata Structure:**
```typescript
interface FileAnalysis {
  path: string;
  imports: Array<{ path: string; items: string[] }>;
  exports: string[];
  todos: Array<{ line: number; text: string }>;
  complexity: number;
  hasTests: boolean;
  testCoverage?: number;
  warnings: string[];
}
```

**Analysis Display:**
- Show in file viewer side panel
- Badge indicators on cards
- Filter by complexity
- Highlight problematic files

**Acceptance Criteria:**
- Import detection works
- Complexity calculated correctly
- TODOs found accurately
- Performance acceptable
- Results cached

---

### **STEP 16: Add Dependency Visualization**

**Action:** Visualize file relationships and dependencies

**Features:**
- Show import graph for selected file
- Highlight circular dependencies
- Show unused files (no imports)
- Display dependency depth

**Visualization Options:**
- Tree view (parent → children)
- Graph view (network diagram)
- List view (simple list)

**UI:**
```
Selected: memorial.ts

Imports From:
  ← firebase.ts
  ← types/index.ts

Imported By:
  → routes/[fullSlug]/+page.svelte
  → routes/admin/memorials/+page.svelte
  → lib/utils/memorial-helpers.ts

Dependency Depth: 3
Circular Dependencies: None ✓
```

**Acceptance Criteria:**
- Dependency graph accurate
- Circular dependencies detected
- Graph interactive
- Performance good
- Export option available

---

### **STEP 17: Polish UI/UX**

**Action:** Refine user interface and experience

**UI Improvements:**
- Smooth animations (entrance, exit, hover)
- Loading skeletons
- Empty states
- Error states
- Toast notifications
- Keyboard shortcuts panel
- Tooltips for all actions
- Accessibility (ARIA labels, focus management)

**Color Scheme:**
- Dark mode (default)
- Light mode option
- Syntax theme selector
- Custom color schemes

**Performance:**
- Lazy load file contents
- Virtual scrolling for large trees
- Debounce search
- Cache API responses
- Optimize re-renders

**Acceptance Criteria:**
- Animations smooth (60fps)
- No layout shifts
- Fast perceived performance
- Accessible (WCAG AA)
- Mobile usable

---

### **STEP 18: Add Persistence & Settings**

**Action:** Save user preferences and state

**Persistent Data:**
- Custom groups
- Expanded folders
- Selected filters
- Layout preferences
- Theme choice
- Recent files
- Favorite files

**Storage:**
- LocalStorage for preferences
- SessionStorage for temporary state
- URL params for sharing views

**Settings Panel:**
```
⚙️ Settings

Appearance:
  ○ Dark Mode
  ○ Light Mode
  ○ Auto

Default View:
  ○ Grid Layout
  ○ List Layout

File Tree:
  ☑ Show hidden files
  ☑ Show file sizes
  ☑ Auto-expand selected

Syntax Theme:
  [VS Code Dark+ ▼]

[Reset to Defaults] [Export Settings]
```

**Acceptance Criteria:**
- Settings persist across sessions
- Import/export works
- Reset clears all data
- No localStorage bloat
- URL sharing works

---

## TESTING CHECKLIST

### Functional Testing
- [ ] File tree loads completely
- [ ] File content displays correctly
- [ ] Search finds files accurately
- [ ] Filters work as expected
- [ ] Drag-and-drop functions properly
- [ ] Groups save and load
- [ ] Stats calculate correctly

### Performance Testing
- [ ] Initial load < 3 seconds
- [ ] Search response < 500ms
- [ ] File viewer opens < 200ms
- [ ] Smooth animations (60fps)
- [ ] No memory leaks
- [ ] Large files handled gracefully

### Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers (Chrome, Safari)

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus indicators visible
- [ ] Color contrast sufficient
- [ ] ARIA labels present

---

## DEPLOYMENT

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] Code reviewed
- [ ] Documentation complete

### Deployment Steps
1. Build production bundle
2. Test build locally
3. Deploy to staging
4. Smoke test on staging
5. Deploy to production
6. Monitor for errors

### Rollback Plan
- Keep previous build available
- Database migrations reversible
- Feature flag to disable webmap

---

## FUTURE ENHANCEMENTS

### Phase 2 Features
- [ ] Git integration (blame, history)
- [ ] AI-powered insights
- [ ] Code complexity analysis
- [ ] Refactoring suggestions
- [ ] Test coverage visualization
- [ ] Performance profiling
- [ ] Documentation generation
- [ ] Export options (PDF, PNG)

### Phase 3 Features
- [ ] Collaborative features (multiplayer)
- [ ] Real-time file watching
- [ ] In-browser editing
- [ ] Integration with VS Code
- [ ] Custom plugins/extensions
- [ ] API for external tools

---

## MAINTENANCE

### Regular Tasks
- Update dependencies monthly
- Review performance metrics
- Check for broken links
- Clean up old cached data
- Update documentation

### Monitoring
- Track page load times
- Monitor API response times
- Log JavaScript errors
- Track user engagement
- Collect user feedback

---

## SUPPORT & DOCUMENTATION

### User Documentation
- Getting started guide
- Feature overview
- Keyboard shortcuts reference
- Troubleshooting guide
- FAQ

### Developer Documentation
- Architecture overview
- API documentation
- Component documentation
- Contributing guidelines
- Testing guide

---

## SUCCESS METRICS

### KPIs to Track
- Daily active users
- Average session duration
- Files viewed per session
- Search success rate
- Feature adoption rate
- User satisfaction score

### Goals
- 80% of developers use webmap weekly
- Average session > 5 minutes
- Search success rate > 90%
- Page load time < 2 seconds
- User satisfaction > 4/5

---

**End of Implementation Guide**

This document will be updated as implementation progresses. Last updated: December 19, 2025.
