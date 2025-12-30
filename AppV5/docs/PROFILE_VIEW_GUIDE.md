# Profile View Guide

> **Component:** `src/lib/components/ProfileView.svelte`  
> **Status:** ✅ Complete  
> **Last Updated:** December 30, 2025

---

## Overview

The Profile View is the central panel for exploring POTJ (Point of Truth in Journey) entries and files. It provides a tabbed interface with deep file analysis capabilities, allowing developers to understand code structure without leaving the Journey Scanner.

---

## Tab Navigation

The Profile View has **5 tabs**:

| Tab | Icon | Purpose |
|-----|------|---------|
| **Overview** | 📋 | Original POTJ/file info: description, behaviors, dependencies |
| **State** | 📊 | State variables, derived state, and props |
| **Functions** | ⚡ | All functions with parameters, return types, line numbers |
| **Imports** | 📦 | Categorized imports (project files vs framework modules) |
| **Chat** | 💬 | AI chat interface for questions about the code |

---

## Features by Tab

### 📋 Overview Tab
Displays the traditional POTJ information:
- **Description** - AI-generated or manual description
- **Related File** - Click to view in Code Viewer
- **Key Behavior** - List of user actions/system behaviors
- **Code Reference** - Highlighted code snippet
- **Dependencies** - Clickable links to dependent files
- **Tags** - Categorization tags
- **Data Flow** - Props in/out, events, state access

### 📊 State Tab
Analyzes the file and displays state management:

| Column | Description |
|--------|-------------|
| Variable | The state variable name |
| Type | TypeScript type (inferred or explicit) |
| Initial Value | Default value |
| Line | Line number in source |

**Includes:**
- `$state()` reactive variables (Svelte 5)
- `$derived()` computed values
- `let` declarations
- Props via `$props()`

### ⚡ Functions Tab
Lists all functions in the file:

| Column | Description |
|--------|-------------|
| Function | Function name |
| Parameters | Parameter list |
| Returns | Return type |
| Async | Yes/No indicator |
| Line | Starting line number |

**Click-to-Highlight Feature:**
- Click any function row
- Code Viewer opens the correct file
- Scrolls to the function
- **Highlights the entire function body** (all lines)
- File appears selected in Code Bank

### 📦 Imports Tab
Categorizes all imports into two sections:

**📁 Project Files** (clickable)
- `$lib/...` imports
- Relative imports (`./`, `../`)
- Click to open in Code Viewer

**🔧 Framework Modules** (not clickable)
- `$app/navigation`, `$app/environment`
- `$env/static/private`, `$env/dynamic/private`
- `svelte`, `svelte/store`, etc.
- `@sveltejs/kit`

### 💬 Chat Tab
AI-powered chat for asking questions about the code:
- Context-aware responses
- Chat history persisted per POTJ/file
- Ask about implementation, suggest improvements, etc.

---

## Technical Architecture

### File Analysis Pipeline

```
User selects POTJ/File
        ↓
ProfileView determines currentFilePath
        ↓
User clicks State/Functions/Imports tab
        ↓
Calls POST /api/analyze-file
        ↓
file-analyzer.ts parses the file:
  - extractState() → state variables
  - extractFunctions() → function definitions with start/end lines
  - extractProps() → component props
  - extractImports() → categorized imports
        ↓
Returns FileAnalysis object
        ↓
DataTable components display the data
```

### Function Highlighting Flow

```
User clicks function row in DataTable
        ↓
ProfileView calls onHighlightRange(start, end, filePath)
        ↓
JourneyDashboard:
  1. Finds or creates FileProfile for filePath
  2. Sets state.selectedFile = file
  3. Sets highlightRange = { start, end }
        ↓
CodeViewer:
  1. Loads file content
  2. Renders with line numbers
  3. Highlights lines in range
  4. Scrolls to first highlighted line
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/components/ProfileView.svelte` | Main tabbed interface |
| `src/lib/components/DataTable.svelte` | Reusable table component |
| `src/lib/components/CodeViewer.svelte` | Code display with line highlighting |
| `src/lib/server/file-analyzer.ts` | Parses files to extract structure |
| `src/routes/api/analyze-file/+server.ts` | API endpoint for file analysis |

---

## Data Types

### FileAnalysis
```typescript
interface FileAnalysis {
  filePath: string;
  fileType: 'svelte' | 'typescript' | 'javascript' | 'unknown';
  state: StateVariable[];
  props: PropDefinition[];
  functions: FunctionDefinition[];
  imports: ImportDefinition[];
  summary: {
    stateCount: number;
    functionCount: number;
    importCount: number;
    propCount: number;
  };
  analyzedAt: string;
}
```

### FunctionDefinition
```typescript
interface FunctionDefinition {
  name: string;
  params: string;
  returnType: string | null;
  isAsync: boolean;
  isExported: boolean;
  line: number;      // Start line
  endLine: number;   // End line (for highlighting)
}
```

### StateVariable
```typescript
interface StateVariable {
  name: string;
  type: string | null;
  initialValue: string | null;
  line: number;
  isState: boolean;    // Uses $state()
  isDerived: boolean;  // Uses $derived()
}
```

### ImportDefinition
```typescript
interface ImportDefinition {
  path: string;
  imports: string[];           // Named imports
  defaultImport: string | null;
  category: 'component' | 'utility' | 'type' | 'store' | 'external' | 'svelte' | 'unknown';
  line: number;
}
```

---

## Path Resolution

The system handles various import path formats:

| Input | Resolved To |
|-------|-------------|
| `$lib/components/Foo.svelte` | `src/lib/components/Foo.svelte` |
| `$lib/types/journey` | `src/lib/types/journey.ts` (extension guessed) |
| `@/routes/+page.svelte` | `src/routes/+page.svelte` |
| `./utils` | Relative to current file |

**Extension Guessing:** If a path has no extension, the system tries:
- `.ts`, `.js`, `.svelte`, `.json`
- `/index.ts`, `/index.js`, `/index.svelte`

---

## Framework Module Detection

These prefixes are detected as framework modules (not project files):
- `$app/` - SvelteKit app modules
- `$env/` - Environment variables
- `svelte/` or `svelte` - Svelte core
- `@sveltejs/` - SvelteKit packages

Framework modules are displayed but not clickable since they're not files in your project.

---

## Usage Tips

1. **Quick Navigation:** Click functions to jump directly to that code
2. **Understand State:** Use State tab to see all reactive variables at a glance
3. **Trace Dependencies:** Imports tab shows what a component relies on
4. **Ask Questions:** Use Chat tab to get AI explanations of complex code
5. **Line Numbers:** Code Viewer now shows line numbers for easy reference

---

## Related Documentation

- [ENHANCED_PROFILE_PLAN.md](./ENHANCED_PROFILE_PLAN.md) - Original planning document
- [PROGRESS.md](./PROGRESS.md) - Overall project progress
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - High-level system overview
