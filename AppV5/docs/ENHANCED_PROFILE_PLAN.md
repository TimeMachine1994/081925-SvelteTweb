# Phase 11: Enhanced Profile View with Deep File Analysis

> **Status:** ✅ Complete  
> **Created:** December 30, 2025  
> **Completed:** December 30, 2025  
> **Purpose:** Display rich file internals (state, functions, dependencies) in organized sections with data tables

---

## Problem Statement

Currently, the Profile View shows minimal information about files:
- Simple AI-generated description
- One or two dependencies
- Basic file reference

This doesn't capture the complexity of real components like `+page.svelte` which may have:
- 10+ state variables
- Multiple async functions
- Complex prop structures
- Nested dependency chains

**Goal:** Surface the internal structure of files in an organized, scannable format using subheadings and data tables.

---

## Solution Overview

### UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  📄 Dashboard Page                              [POTJ]  │
│  /routes/dashboard/+page.svelte                         │
├─────────────────────────────────────────────────────────┤
│  [Overview] [State] [Functions] [Dependencies] [Chat]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ## 📊 State Management                                 │
│  ┌────────────────┬──────────────┬───────────────────┐  │
│  │ Variable       │ Type         │ Initial Value     │  │
│  ├────────────────┼──────────────┼───────────────────┤  │
│  │ selectedProject│ Project|null │ null              │  │
│  │ journeys       │ RootJourney[]│ []                │  │
│  │ isScanning     │ boolean      │ false             │  │
│  └────────────────┴──────────────┴───────────────────┘  │
│                                                         │
│  ## ⚡ Functions                                        │
│  ┌────────────────┬────────────┬─────────────────────┐  │
│  │ Name           │ Params     │ Returns             │  │
│  ├────────────────┼────────────┼─────────────────────┤  │
│  │ loadProjects   │ ()         │ Promise<void>       │  │
│  │ handleScan     │ ()         │ Promise<void>       │  │
│  │ selectProject  │ (project)  │ void                │  │
│  └────────────────┴────────────┴─────────────────────┘  │
│                                                         │
│  ## 📦 Imports (12)                                     │
│  ┌────────────────────────────────┬───────────────────┐ │
│  │ Import Path                    │ Category          │ │
│  ├────────────────────────────────┼───────────────────┤ │
│  │ $lib/components/JourneyDash... │ 🧩 Component      │ │
│  │ $lib/types/journey             │ 📝 Type           │ │
│  │ $lib/utils/journey-classifier  │ 🔧 Utility        │ │
│  └────────────────────────────────┴───────────────────┘ │
│  [Click any row to view file in Code Viewer]            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 11.1: File Analyzer Service

**File:** `src/lib/server/file-analyzer.ts`

**Purpose:** Parse Svelte and TypeScript files to extract structured metadata.

**Extracted Data:**

| Category | What to Extract | Example |
|----------|-----------------|---------|
| **State Variables** | `$state()` declarations, `let` with initial values | `let count = $state(0)` |
| **Derived State** | `$derived()` declarations | `let doubled = $derived(count * 2)` |
| **Props** | `$props()` destructuring | `let { data, form } = $props()` |
| **Functions** | Function declarations with signatures | `async function load()` |
| **Imports** | All import statements, categorized | `import X from '$lib/...'` |
| **Exports** | Exported values | `export let value` |

**Output Interface:**

```typescript
interface FileAnalysis {
  filePath: string;
  fileType: 'svelte' | 'typescript' | 'javascript';
  
  state: StateVariable[];
  derived: DerivedVariable[];
  props: PropDefinition[];
  functions: FunctionDefinition[];
  imports: ImportDefinition[];
  exports: ExportDefinition[];
  
  analyzedAt: string;
}

interface StateVariable {
  name: string;
  type: string | null;
  initialValue: string | null;
  line: number;
}

interface FunctionDefinition {
  name: string;
  params: string;
  returnType: string | null;
  isAsync: boolean;
  isExported: boolean;
  line: number;
}

interface ImportDefinition {
  path: string;
  imports: string[];      // Named imports
  defaultImport: string | null;
  category: 'component' | 'utility' | 'type' | 'store' | 'external' | 'svelte';
  line: number;
}
```

**Parsing Strategy:**
1. For `.svelte` files: Extract `<script>` content first
2. Use regex patterns to identify declarations
3. Infer types from TypeScript annotations or initial values
4. Categorize imports by path patterns (`$lib/components/` → component)

---

### Phase 11.2: Analyze File API Endpoint

**File:** `src/routes/api/analyze-file/+server.ts`

**Endpoint:** `POST /api/analyze-file`

**Request:**
```json
{
  "filePath": "@/routes/+page.svelte",
  "projectPath": "/home/user/project"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "filePath": "/routes/+page.svelte",
    "fileType": "svelte",
    "state": [
      { "name": "count", "type": "number", "initialValue": "0", "line": 5 }
    ],
    "functions": [
      { "name": "increment", "params": "()", "returnType": "void", "isAsync": false, "line": 10 }
    ],
    "imports": [
      { "path": "$lib/components/Button.svelte", "imports": ["Button"], "category": "component" }
    ]
  }
}
```

---

### Phase 11.3: DataTable Component

**File:** `src/lib/components/DataTable.svelte`

**Purpose:** Reusable table component with:
- Column headers
- Sortable columns (optional)
- Clickable rows (for navigation)
- Empty state handling
- Compact styling for Profile View

**Props:**
```typescript
interface DataTableProps {
  columns: { key: string; label: string; width?: string }[];
  rows: Record<string, any>[];
  onRowClick?: (row: Record<string, any>) => void;
  emptyMessage?: string;
}
```

**Usage:**
```svelte
<DataTable 
  columns={[
    { key: 'name', label: 'Variable', width: '30%' },
    { key: 'type', label: 'Type', width: '30%' },
    { key: 'initialValue', label: 'Initial Value', width: '40%' }
  ]}
  rows={analysis.state}
  onRowClick={(row) => scrollToLine(row.line)}
/>
```

---

### Phase 11.4: Enhanced ProfileView

**File:** `src/lib/components/ProfileView.svelte`

**Changes:**

1. **Add Tab Navigation**
   - Overview (existing content)
   - State (state + derived variables)
   - Functions (all functions)
   - Imports (categorized imports)
   - Chat (existing chat)

2. **Add Section Subheadings**
   - 📊 State Management
   - ⚡ Functions
   - 📦 Imports
   - 🎯 Props (if applicable)

3. **Integrate DataTable**
   - Each section uses DataTable for structured display
   - Rows are clickable to jump to line in Code Viewer

4. **Lazy Loading**
   - Only analyze file when user switches to State/Functions/Imports tabs
   - Cache analysis results per file

**State Management:**
```typescript
let activeTab = $state<'overview' | 'state' | 'functions' | 'imports' | 'chat'>('overview');
let fileAnalysis = $state<FileAnalysis | null>(null);
let isAnalyzing = $state(false);

$effect(() => {
  if (activeTab !== 'overview' && activeTab !== 'chat' && selectedFile) {
    analyzeCurrentFile();
  }
});
```

---

### Phase 11.5: Update Journey Generation

**File:** `src/lib/server/gemini-journey.ts`

**Changes:**

1. **Include file analysis in POTJ generation**
   - When generating a POTJ, also analyze the file
   - Store summary in POTJ metadata

2. **Richer POTJ structure:**
```typescript
interface EnhancedPOTJ extends POTJ {
  stateCount: number;
  functionCount: number;
  importCount: number;
  keyFunctions: string[];      // Top 3-5 important functions
  keyState: string[];          // Top 3-5 state variables
}
```

3. **Update journey markdown format:**
```markdown
### [POTJ:dashboard-m-1] Dashboard Page
**Type**: page
**File**: `@/routes/dashboard/+page.svelte`
**Complexity**: 15 state vars, 8 functions, 12 imports

**Key State**: selectedProject, journeys, files, isScanning
**Key Functions**: loadProjects(), handleScan(), selectProject()

**Description**: Main dashboard...
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/server/file-analyzer.ts` | Create | Parse files for state, functions, imports |
| `src/routes/api/analyze-file/+server.ts` | Create | API endpoint for on-demand analysis |
| `src/lib/components/DataTable.svelte` | Create | Reusable table component |
| `src/lib/components/ProfileView.svelte` | Modify | Add tabs, sections, tables |
| `src/lib/server/gemini-journey.ts` | Modify | Include analysis in POTJ generation |
| `src/lib/types/journey.ts` | Modify | Add FileAnalysis types |

---

## Estimated Time

| Phase | Task | Time |
|-------|------|------|
| 11.1 | File Analyzer Service | 2 hours |
| 11.2 | API Endpoint | 30 min |
| 11.3 | DataTable Component | 1 hour |
| 11.4 | ProfileView Enhancement | 2 hours |
| 11.5 | Journey Generation Update | 1 hour |
| | **Total** | **~6.5 hours** |

---

## Success Criteria

- [x] Clicking a POTJ shows tabs: Overview, State, Functions, Imports, Chat
- [x] State tab shows table of all `$state()` and `let` declarations
- [x] Functions tab shows table of all functions with signatures
- [x] Imports tab shows categorized imports (project files vs framework modules)
- [x] Clicking a function row opens correct file and highlights entire function body
- [x] Clicking project imports opens file in Code Viewer
- [x] Generated journeys include complexity summary (state count, function count)

---

## Implementation Notes

### Additional Features Implemented

Beyond the original plan, the following enhancements were added:

1. **Function Body Highlighting**
   - `file-analyzer.ts` now captures `endLine` for each function by counting braces
   - Clicking a function highlights all lines from `line` to `endLine`
   - Scrolls Code Viewer to the function start

2. **Framework Module Detection**
   - Imports like `$app/navigation`, `$env/...`, `svelte/...` are identified
   - Displayed in separate "Framework Modules" section (not clickable)
   - Only project files (`$lib/...`, relative imports) are clickable

3. **Path Resolution Improvements**
   - Handles `$lib/` → `src/lib/` conversion
   - Extension guessing: tries `.ts`, `.js`, `.svelte`, `.json`, `/index.*`
   - Security checks prevent directory traversal

4. **Line Numbers in Code Viewer**
   - Every line now shows its line number
   - Highlighted lines have yellow background with gold border
   - Hover effect on all lines

### Files Created/Modified

| File | Action | Notes |
|------|--------|-------|
| `src/lib/server/file-analyzer.ts` | Created | Full file parser with brace counting |
| `src/routes/api/analyze-file/+server.ts` | Created | Secure API endpoint |
| `src/lib/components/DataTable.svelte` | Created | Reusable table component |
| `src/lib/components/ProfileView.svelte` | Modified | Added tabs, analysis loading, DataTable usage |
| `src/lib/components/CodeViewer.svelte` | Modified | Added line numbers, range highlighting |
| `src/lib/components/JourneyDashboard.svelte` | Modified | Added highlightRange state, file selection on highlight |
| `src/routes/api/file-content/+server.ts` | Modified | Added `$lib` handling, extension guessing |
| `src/lib/types/journey.ts` | Modified | Extended JourneyMetadata |
| `docs/PROFILE_VIEW_GUIDE.md` | Created | Full user guide |

---

## Future Enhancements (Phase 12+)

- **Dependency Graph**: Visual tree showing import relationships
- **Call Graph**: Which functions call which
- **Data Flow**: How props/state flow between components
- **Search**: Filter functions/state by name
- **Export**: Export analysis as JSON/CSV
- **Syntax Highlighting**: Color-coded code in Code Viewer
