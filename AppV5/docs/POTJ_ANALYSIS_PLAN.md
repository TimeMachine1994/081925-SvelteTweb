# Phase 12: Persist File Analysis Data in Journey Markdown

> **Status:** 📋 Planning  
> **Created:** December 30, 2025  
> **Purpose:** Store file analysis (state, functions, imports) directly in journey markdown files for persistence and portability

---

## Problem Statement

Currently, file analysis data is generated **on-demand** every time a user clicks the State, Functions, or Imports tabs in the Profile View. This means:

1. **Redundant Processing** - Same file parsed repeatedly across sessions
2. **No History** - Analysis results aren't tracked over time
3. **Incomplete POTJs** - Journey files lack the rich code structure data
4. **Slower UX** - Users wait for analysis on every tab click

**Goal:** Embed file analysis data directly into the journey markdown files, making POTJs self-contained documentation units.

---

## Solution Overview

### Enhanced POTJ Markdown Format

**Current Format:**
```markdown
### [POTJ:dashboard-m-1] Dashboard Page
**Type**: page
**File**: `@/routes/dashboard/+page.svelte`
**Tags**: #dashboard

User interacts with the /dashboard route.

**Dependencies**:
- Uses `@/lib/components/JourneyDashboard.svelte`
```

**Enhanced Format:**
```markdown
### [POTJ:dashboard-m-1] Dashboard Page
**Type**: page
**File**: `@/routes/dashboard/+page.svelte`
**Tags**: #dashboard

User interacts with the /dashboard route.

**Dependencies**:
- Uses `@/lib/components/JourneyDashboard.svelte`

#### 📊 State Variables
| Variable | Type | Initial Value | Line |
|----------|------|---------------|------|
| selectedProject | Project \| null | null | 15 |
| journeys | RootJourney[] | [] | 16 |
| isScanning | boolean | false | 17 |
| scanError | string \| null | null | 18 |

#### ⚡ Functions
| Function | Parameters | Returns | Async | Lines |
|----------|------------|---------|-------|-------|
| handleScan | () | Promise<void> | ✅ | 45-67 |
| loadJourneys | (projectId: string) | void | ❌ | 70-85 |
| handleSelectProject | (project: Project) | void | ❌ | 88-95 |

#### 📦 Imports
**Project Files:**
| Import | From | Type |
|--------|------|------|
| JourneyDashboard | $lib/components/JourneyDashboard.svelte | component |
| type Project | $lib/types/journey | type |

**Framework Modules:**
- `onMount` from `svelte`
- `goto` from `$app/navigation`

#### 📈 Analysis Metadata
- **Analyzed At**: 2025-12-30T19:27:44.160Z
- **File Hash**: a1b2c3d4e5f6
- **State Count**: 4
- **Function Count**: 3
- **Import Count**: 5
```

---

## Implementation Steps

### Step 1: Update POTJ Type Definition

**File:** `src/lib/types/journey.ts`

**Changes:**
Add optional fields to the `POTJ` interface for storing analysis data:

```typescript
export interface POTJ {
  // ... existing fields ...
  
  // NEW: Embedded file analysis
  analysis?: {
    state?: Array<{
      name: string;
      type: string | null;
      initialValue: string | null;
      line: number;
      isState: boolean;
      isDerived: boolean;
    }>;
    functions?: Array<{
      name: string;
      params: string;
      returnType: string | null;
      isAsync: boolean;
      isExported: boolean;
      line: number;
      endLine: number;
    }>;
    imports?: {
      projectFiles: Array<{
        path: string;
        imports: string[];
        defaultImport: string | null;
        category: string;
        line: number;
      }>;
      frameworkModules: Array<{
        path: string;
        imports: string[];
        defaultImport: string | null;
      }>;
    };
    metadata?: {
      analyzedAt: string;
      fileHash?: string;
      stateCount: number;
      functionCount: number;
      importCount: number;
    };
  };
}
```

**Estimated Time:** 15 minutes

---

### Step 2: Update Journey Writer

**File:** `src/lib/server/journey-writer.ts`

**Changes:**
Modify `formatPOTJToMarkdown()` to include analysis sections when present.

**New Helper Functions:**
```typescript
function formatStateTable(state: StateVariable[]): string {
  if (!state.length) return '';
  
  const header = '| Variable | Type | Initial Value | Line |\n|----------|------|---------------|------|\n';
  const rows = state.map(s => 
    `| ${s.name} | ${escapeMarkdown(s.type || 'unknown')} | ${escapeMarkdown(s.initialValue || '-')} | ${s.line} |`
  ).join('\n');
  
  return `\n#### 📊 State Variables\n${header}${rows}\n`;
}

function formatFunctionsTable(functions: FunctionDefinition[]): string {
  if (!functions.length) return '';
  
  const header = '| Function | Parameters | Returns | Async | Lines |\n|----------|------------|---------|-------|-------|\n';
  const rows = functions.map(f => 
    `| ${f.name} | ${escapeMarkdown(f.params || '()')} | ${escapeMarkdown(f.returnType || 'void')} | ${f.isAsync ? '✅' : '❌'} | ${f.line}-${f.endLine} |`
  ).join('\n');
  
  return `\n#### ⚡ Functions\n${header}${rows}\n`;
}

function formatImportsSection(imports: ImportDefinition[]): string {
  if (!imports.length) return '';
  
  const projectFiles = imports.filter(i => !isFrameworkModule(i.path));
  const frameworkModules = imports.filter(i => isFrameworkModule(i.path));
  
  let output = '\n#### 📦 Imports\n';
  
  if (projectFiles.length) {
    output += '**Project Files:**\n';
    output += '| Import | From | Type |\n|--------|------|------|\n';
    projectFiles.forEach(i => {
      const importName = i.defaultImport || i.imports.join(', ');
      output += `| ${importName} | ${i.path} | ${i.category} |\n`;
    });
  }
  
  if (frameworkModules.length) {
    output += '\n**Framework Modules:**\n';
    frameworkModules.forEach(i => {
      const importName = i.defaultImport || i.imports.join(', ');
      output += `- \`${importName}\` from \`${i.path}\`\n`;
    });
  }
  
  return output;
}

function formatAnalysisMetadata(metadata: AnalysisMetadata): string {
  return `
#### 📈 Analysis Metadata
- **Analyzed At**: ${metadata.analyzedAt}
- **State Count**: ${metadata.stateCount}
- **Function Count**: ${metadata.functionCount}
- **Import Count**: ${metadata.importCount}
`;
}
```

**Update `formatPOTJToMarkdown()`:**
```typescript
function formatPOTJToMarkdown(potj: POTJ): string {
  let md = `### [POTJ:${potj.id}] ${potj.title}\n`;
  md += `**Type**: ${potj.moduleType || 'unknown'}\n`;
  md += `**File**: \`${potj.fileRef || 'N/A'}\`\n`;
  
  if (potj.tags?.length) {
    md += `**Tags**: ${potj.tags.map(t => `#${t}`).join(' ')}\n`;
  }
  
  md += `\n${potj.description}\n`;
  
  if (potj.dependencies?.length) {
    md += '\n**Dependencies**:\n';
    potj.dependencies.forEach(dep => {
      md += `- ${dep}\n`;
    });
  }
  
  // NEW: Add analysis sections if present
  if (potj.analysis) {
    if (potj.analysis.state?.length) {
      md += formatStateTable(potj.analysis.state);
    }
    if (potj.analysis.functions?.length) {
      md += formatFunctionsTable(potj.analysis.functions);
    }
    if (potj.analysis.imports) {
      const allImports = [
        ...potj.analysis.imports.projectFiles,
        ...potj.analysis.imports.frameworkModules
      ];
      if (allImports.length) {
        md += formatImportsSection(allImports);
      }
    }
    if (potj.analysis.metadata) {
      md += formatAnalysisMetadata(potj.analysis.metadata);
    }
  }
  
  return md;
}
```

**Estimated Time:** 45 minutes

---

### Step 3: Update Journey Parser

**File:** `src/lib/server/journey-parser.ts`

**Changes:**
Modify the parser to extract analysis data from the markdown tables.

**New Parsing Functions:**
```typescript
function parseStateTable(content: string): StateVariable[] {
  const stateMatch = content.match(/#### 📊 State Variables\n\|[^\n]+\n\|[-|\s]+\n([\s\S]*?)(?=\n####|\n---|\n###|$)/);
  if (!stateMatch) return [];
  
  const rows = stateMatch[1].trim().split('\n').filter(r => r.startsWith('|'));
  return rows.map(row => {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    return {
      name: cells[0],
      type: cells[1] === '-' ? null : cells[1],
      initialValue: cells[2] === '-' ? null : cells[2],
      line: parseInt(cells[3]) || 0,
      isState: true,
      isDerived: false
    };
  });
}

function parseFunctionsTable(content: string): FunctionDefinition[] {
  const funcMatch = content.match(/#### ⚡ Functions\n\|[^\n]+\n\|[-|\s]+\n([\s\S]*?)(?=\n####|\n---|\n###|$)/);
  if (!funcMatch) return [];
  
  const rows = funcMatch[1].trim().split('\n').filter(r => r.startsWith('|'));
  return rows.map(row => {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    const [startLine, endLine] = (cells[4] || '0-0').split('-').map(Number);
    return {
      name: cells[0],
      params: cells[1],
      returnType: cells[2] === 'void' ? null : cells[2],
      isAsync: cells[3] === '✅',
      isExported: false,
      line: startLine,
      endLine: endLine || startLine
    };
  });
}

function parseImportsSection(content: string): { projectFiles: ImportDefinition[], frameworkModules: ImportDefinition[] } {
  // Parse project files table
  const projectMatch = content.match(/\*\*Project Files:\*\*\n\|[^\n]+\n\|[-|\s]+\n([\s\S]*?)(?=\n\*\*|\n####|\n---|\n###|$)/);
  const projectFiles: ImportDefinition[] = [];
  
  if (projectMatch) {
    const rows = projectMatch[1].trim().split('\n').filter(r => r.startsWith('|'));
    rows.forEach(row => {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      projectFiles.push({
        path: cells[1],
        imports: cells[0].includes(',') ? cells[0].split(',').map(s => s.trim()) : [],
        defaultImport: cells[0].includes(',') ? null : cells[0],
        category: cells[2] as any,
        line: 0
      });
    });
  }
  
  // Parse framework modules list
  const frameworkMatch = content.match(/\*\*Framework Modules:\*\*\n([\s\S]*?)(?=\n####|\n---|\n###|$)/);
  const frameworkModules: ImportDefinition[] = [];
  
  if (frameworkMatch) {
    const lines = frameworkMatch[1].trim().split('\n').filter(l => l.startsWith('-'));
    lines.forEach(line => {
      const match = line.match(/`([^`]+)`\s+from\s+`([^`]+)`/);
      if (match) {
        frameworkModules.push({
          path: match[2],
          imports: [match[1]],
          defaultImport: null,
          category: 'svelte',
          line: 0
        });
      }
    });
  }
  
  return { projectFiles, frameworkModules };
}

function parseAnalysisMetadata(content: string): AnalysisMetadata | null {
  const metaMatch = content.match(/#### 📈 Analysis Metadata\n([\s\S]*?)(?=\n---|\n###|$)/);
  if (!metaMatch) return null;
  
  const text = metaMatch[1];
  const analyzedAt = text.match(/Analyzed At\*\*:\s*(.+)/)?.[1] || new Date().toISOString();
  const stateCount = parseInt(text.match(/State Count\*\*:\s*(\d+)/)?.[1] || '0');
  const functionCount = parseInt(text.match(/Function Count\*\*:\s*(\d+)/)?.[1] || '0');
  const importCount = parseInt(text.match(/Import Count\*\*:\s*(\d+)/)?.[1] || '0');
  
  return { analyzedAt, stateCount, functionCount, importCount };
}
```

**Update POTJ Parsing:**
```typescript
// In parsePOTJBlock() or equivalent
function parsePOTJBlock(content: string): POTJ {
  // ... existing parsing ...
  
  // NEW: Parse analysis sections
  const state = parseStateTable(content);
  const functions = parseFunctionsTable(content);
  const imports = parseImportsSection(content);
  const metadata = parseAnalysisMetadata(content);
  
  if (state.length || functions.length || imports.projectFiles.length || imports.frameworkModules.length) {
    potj.analysis = {
      state,
      functions,
      imports,
      metadata
    };
  }
  
  return potj;
}
```

**Estimated Time:** 1 hour

---

### Step 4: Update Journey Generation

**File:** `src/lib/server/gemini-journey.ts`

**Changes:**
When creating POTJs, run file analysis and attach results.

**Update `createBasicPOTJ()`:**
```typescript
import { analyzeFile } from './file-analyzer';

export async function createBasicPOTJ(
  route: RouteInfo,
  journeyId: string,
  phase: 'beginning' | 'middle' | 'end',
  index: number,
  projectPath: string
): Promise<POTJ> {
  // ... existing POTJ creation ...
  
  // NEW: Analyze the file and attach results
  let analysis = undefined;
  
  try {
    const filePath = route.path; // e.g., "src/routes/dashboard/+page.svelte"
    const fullPath = `${projectPath}/${filePath}`;
    
    const fileContent = await fs.readFile(fullPath, 'utf-8');
    const fileAnalysis = await analyzeFile(fileContent, filePath);
    
    // Separate project files from framework modules
    const projectFiles = fileAnalysis.imports.filter(i => !isFrameworkModule(i.path));
    const frameworkModules = fileAnalysis.imports.filter(i => isFrameworkModule(i.path));
    
    analysis = {
      state: fileAnalysis.state,
      functions: fileAnalysis.functions,
      imports: { projectFiles, frameworkModules },
      metadata: {
        analyzedAt: new Date().toISOString(),
        stateCount: fileAnalysis.state.length,
        functionCount: fileAnalysis.functions.length,
        importCount: fileAnalysis.imports.length
      }
    };
  } catch (err) {
    console.warn(`[Journey Gen] Could not analyze file: ${route.path}`, err);
    // Continue without analysis - it's optional
  }
  
  return {
    id: potjId,
    title,
    description,
    // ... other fields ...
    analysis  // NEW
  };
}
```

**Estimated Time:** 30 minutes

---

### Step 5: Update ProfileView to Use Persisted Data

**File:** `src/lib/components/ProfileView.svelte`

**Changes:**
Check if POTJ has embedded analysis before calling the API.

**Update Analysis Loading:**
```typescript
// Check for persisted analysis first
$effect(() => {
  if (needsAnalysis && currentFilePath) {
    // NEW: Check if POTJ already has analysis data
    if (selectedPOTJ?.analysis) {
      console.log('[ProfileView] Using persisted analysis from POTJ');
      fileAnalysis = {
        filePath: currentFilePath,
        fileType: getFileType(currentFilePath),
        state: selectedPOTJ.analysis.state || [],
        props: [], // Props not persisted yet
        functions: selectedPOTJ.analysis.functions || [],
        imports: [
          ...(selectedPOTJ.analysis.imports?.projectFiles || []),
          ...(selectedPOTJ.analysis.imports?.frameworkModules || [])
        ],
        summary: selectedPOTJ.analysis.metadata || {
          stateCount: 0,
          functionCount: 0,
          importCount: 0,
          propCount: 0
        },
        analyzedAt: selectedPOTJ.analysis.metadata?.analyzedAt || new Date().toISOString()
      };
      isAnalyzing = false;
      return;
    }
    
    // Fallback: Fetch live analysis from API
    loadFileAnalysis(currentFilePath);
  }
});
```

**Add "Refresh Analysis" Button:**
```svelte
{#if selectedPOTJ?.analysis}
  <button 
    class="refresh-btn" 
    onclick={() => loadFileAnalysis(currentFilePath, true)}
    title="Re-analyze file (overwrites persisted data)"
  >
    🔄 Refresh
  </button>
{/if}
```

**Estimated Time:** 30 minutes

---

### Step 6: Add API Endpoint for Updating POTJ Analysis

**File:** `src/routes/api/update-potj-analysis/+server.ts` (NEW)

**Purpose:**
Allow updating a POTJ's analysis data and writing back to the journey file.

```typescript
import { json } from '@sveltejs/kit';
import { analyzeFile } from '$lib/server/file-analyzer';
import { updatePOTJInJourney } from '$lib/server/journey-writer';
import * as fs from 'fs/promises';

export const POST = async ({ request }) => {
  const { journeyId, potjId, projectPath } = await request.json();
  
  // 1. Load journey file
  // 2. Find POTJ
  // 3. Analyze its file
  // 4. Update POTJ with analysis
  // 5. Write back to journey file
  
  return json({ success: true, analysis });
};
```

**Estimated Time:** 45 minutes

---

### Step 7: Add Bulk Re-Analysis Command

**File:** `src/routes/api/reanalyze-journey/+server.ts` (NEW)

**Purpose:**
Re-analyze all POTJs in a journey and update the markdown file.

```typescript
export const POST = async ({ request }) => {
  const { journeyId, projectPath } = await request.json();
  
  // 1. Load journey
  // 2. For each POTJ with a fileRef:
  //    a. Analyze the file
  //    b. Attach analysis to POTJ
  // 3. Rewrite entire journey file
  
  return json({ 
    success: true, 
    analyzed: count,
    skipped: skippedCount 
  });
};
```

**Estimated Time:** 30 minutes

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/types/journey.ts` | Modify | Add `analysis` field to POTJ interface |
| `src/lib/server/journey-writer.ts` | Modify | Add analysis section formatting |
| `src/lib/server/journey-parser.ts` | Modify | Parse analysis sections from markdown |
| `src/lib/server/gemini-journey.ts` | Modify | Attach analysis when generating POTJs |
| `src/lib/components/ProfileView.svelte` | Modify | Use persisted data, add refresh button |
| `src/routes/api/update-potj-analysis/+server.ts` | Create | Update single POTJ analysis |
| `src/routes/api/reanalyze-journey/+server.ts` | Create | Bulk re-analyze journey |

---

## Testing Plan

### Unit Tests
1. **Writer Tests**
   - `formatStateTable()` produces valid markdown table
   - `formatFunctionsTable()` handles async functions correctly
   - `formatImportsSection()` separates project/framework imports

2. **Parser Tests**
   - `parseStateTable()` extracts all columns correctly
   - `parseFunctionsTable()` parses line ranges (45-67)
   - `parseImportsSection()` handles both table and list formats

### Integration Tests
1. **Round-Trip Test**
   - Generate POTJ with analysis → Write to markdown → Parse back → Compare
   - Verify no data loss

2. **UI Tests**
   - Load POTJ with persisted analysis → Verify tabs populate instantly
   - Click "Refresh" → Verify API is called and data updates

### Manual Tests
1. Generate new journeys → Verify analysis sections appear in .md files
2. Open existing journey without analysis → Verify live analysis works
3. Test mixed scenario: some POTJs have analysis, some don't

---

## Estimated Total Time

| Step | Task | Time |
|------|------|------|
| 1 | Update POTJ Type | 15 min |
| 2 | Update Journey Writer | 45 min |
| 3 | Update Journey Parser | 1 hour |
| 4 | Update Journey Generation | 30 min |
| 5 | Update ProfileView | 30 min |
| 6 | Single POTJ Update API | 45 min |
| 7 | Bulk Re-Analysis API | 30 min |
| | **Total** | **~4.5 hours** |

---

## Future Enhancements

- **Diff Detection**: Only update analysis if file content changed (compare hash)
- **Incremental Updates**: Update single POTJ without rewriting entire file
- **Analysis Versioning**: Track analysis schema version for migrations
- **Props Persistence**: Add props to persisted analysis
- **Code Snippets**: Persist key code snippets alongside analysis

---

## Success Criteria

- [ ] New journeys include analysis sections in markdown
- [ ] Existing POTJs without analysis fall back to live API
- [ ] ProfileView uses persisted data when available
- [ ] "Refresh Analysis" button triggers re-analysis
- [ ] Bulk re-analyze updates all POTJs in a journey
- [ ] Round-trip (write → parse) preserves all analysis data
