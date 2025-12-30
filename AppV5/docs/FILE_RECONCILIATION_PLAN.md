# File Change Detection & Reconciliation Plan

> **Status:** ✅ Complete  
> **Created:** December 30, 2025  
> **Completed:** December 30, 2025  
> **Purpose:** Detect when source files referenced in journeys change, and provide reconciliation UI

---

## Problem Statement

Currently, journeys are static snapshots. When developers edit source files in their IDE:
- The journey documentation becomes stale
- There's no indication that code has drifted from documentation
- Users must manually remember which POTJs need updating

**The Vision states:** "A badge appears: 'Code changed since journey was generated.' You can then choose to reconcile that specific POTJ."

---

## Solution Overview

### Core Components

1. **File Tracking Database** - Store file paths, modification timestamps, and hashes
2. **Source File Watcher** - Extend `journey-watcher.ts` to watch referenced source files
3. **Reconciliation Status API** - Compare stored vs. current file states
4. **POTJ Status Badges** - Visual indicators in JourneyGrid
5. **Reconcile Button** - Trigger targeted AI re-scan for specific POTJ

---

## Phase 1: Database Schema

### New Table: `fileSnapshot`

**File:** `src/lib/server/db/schema.ts`

```typescript
export const fileSnapshot = sqliteTable('file_snapshot', {
  id: text('id').primaryKey(),
  
  // File identification
  filePath: text('file_path').notNull(),           // Absolute path to file
  relativePath: text('relative_path').notNull(),   // @/ prefixed path from journey
  
  // Snapshot data
  lastModified: integer('last_modified').notNull(), // File mtime when snapshot taken
  contentHash: text('content_hash').notNull(),      // SHA-256 hash of file content
  fileSize: integer('file_size').notNull(),
  
  // Journey association
  journeyId: text('journey_id').notNull(),          // Which journey references this
  potjId: text('potj_id'),                          // Specific POTJ (optional)
  
  // Timestamps
  snapshotAt: integer('snapshot_at', { mode: 'timestamp' }).notNull(),
  
  // Current state (updated by watcher)
  currentStatus: text('current_status').default('synced'), // 'synced' | 'modified' | 'deleted'
  detectedAt: integer('detected_at', { mode: 'timestamp' })
});

export type FileSnapshot = typeof fileSnapshot.$inferSelect;
export type NewFileSnapshot = typeof fileSnapshot.$inferInsert;
```

**Indexes:**
- `(journeyId, potjId)` - Quick lookup per POTJ
- `(filePath)` - Efficient file path queries
- `(currentStatus)` - Find all modified/deleted files

**Migration:**
```bash
npm run db:push
```

---

## Phase 2: File Snapshot Service

### New File: `src/lib/server/file-snapshot.ts`

```typescript
import { createHash } from 'crypto';
import { readFile, stat, access } from 'fs/promises';
import { db } from './db';
import { fileSnapshot } from './db/schema';
import { eq, and } from 'drizzle-orm';
import type { RootJourney } from '$lib/types/journey';
import { extractFileReferencesFromJourney } from './journey-parser';

interface FileStatus {
  path: string;
  status: 'synced' | 'modified' | 'deleted';
  lastModified?: number;
  snapshotModified?: number;
}

/**
 * Compute SHA-256 hash of file content
 */
async function computeFileHash(filePath: string): Promise<string> {
  const content = await readFile(filePath, 'utf-8');
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve @/ prefixed path to absolute path
 */
function resolveFilePath(relativePath: string, projectPath: string): string {
  let cleanPath = relativePath;
  if (cleanPath.startsWith('@/')) cleanPath = cleanPath.slice(2);
  if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
  return `${projectPath}/src/${cleanPath}`;
}

/**
 * Find POTJs that reference a specific file
 */
function findPOTJsReferencingFile(journey: RootJourney, filePath: string): string[] {
  const potjIds: string[] = [];
  const allPOTJs = [
    ...journey.sections.beginning.items,
    ...journey.sections.middle.items,
    ...journey.sections.end.items
  ];
  
  for (const potj of allPOTJs) {
    if (potj.fileRef === filePath ||
        potj.dependencies?.includes(filePath) ||
        potj.codeReference?.file === filePath) {
      potjIds.push(potj.id);
    }
  }
  
  return potjIds;
}

/**
 * Create snapshots for all files referenced in a journey
 */
export async function createJourneySnapshots(
  journey: RootJourney,
  projectPath: string
): Promise<void> {
  const fileRefs = extractFileReferencesFromJourney(journey);
  
  for (const relativePath of fileRefs) {
    const absolutePath = resolveFilePath(relativePath, projectPath);
    
    if (await fileExists(absolutePath)) {
      const stats = await stat(absolutePath);
      const hash = await computeFileHash(absolutePath);
      
      // Find which POTJ(s) reference this file
      const potjIds = findPOTJsReferencingFile(journey, relativePath);
      
      for (const potjId of potjIds) {
        await db.insert(fileSnapshot).values({
          id: `${journey.id}-${potjId}-${relativePath.replace(/\//g, '_')}`,
          filePath: absolutePath,
          relativePath,
          lastModified: stats.mtimeMs,
          contentHash: hash,
          fileSize: stats.size,
          journeyId: journey.id,
          potjId,
          snapshotAt: new Date(),
          currentStatus: 'synced'
        }).onConflictDoUpdate({
          target: fileSnapshot.id,
          set: {
            lastModified: stats.mtimeMs,
            contentHash: hash,
            fileSize: stats.size,
            snapshotAt: new Date(),
            currentStatus: 'synced',
            detectedAt: null
          }
        });
      }
    }
  }
}

/**
 * Check current status of files for a POTJ
 */
export async function checkPOTJFileStatus(
  journeyId: string,
  potjId: string,
  projectPath: string
): Promise<FileStatus[]> {
  const snapshots = await db.select()
    .from(fileSnapshot)
    .where(and(
      eq(fileSnapshot.journeyId, journeyId),
      eq(fileSnapshot.potjId, potjId)
    ));
  
  const results: FileStatus[] = [];
  
  for (const snapshot of snapshots) {
    if (!(await fileExists(snapshot.filePath))) {
      results.push({
        path: snapshot.relativePath,
        status: 'deleted'
      });
      continue;
    }
    
    const stats = await stat(snapshot.filePath);
    
    // Quick check: if mtime unchanged, assume file unchanged
    if (stats.mtimeMs === snapshot.lastModified) {
      results.push({
        path: snapshot.relativePath,
        status: 'synced',
        lastModified: stats.mtimeMs,
        snapshotModified: snapshot.lastModified
      });
      continue;
    }
    
    // mtime changed - verify with hash
    const currentHash = await computeFileHash(snapshot.filePath);
    
    if (currentHash !== snapshot.contentHash) {
      results.push({
        path: snapshot.relativePath,
        status: 'modified',
        lastModified: stats.mtimeMs,
        snapshotModified: snapshot.lastModified
      });
    } else {
      // Hash same, just touched - update mtime in DB
      results.push({
        path: snapshot.relativePath,
        status: 'synced',
        lastModified: stats.mtimeMs,
        snapshotModified: snapshot.lastModified
      });
    }
  }
  
  return results;
}

/**
 * Get aggregated status for all POTJs in a journey
 */
export async function getJourneyReconciliationStatus(
  journeyId: string,
  projectPath: string
): Promise<Map<string, 'synced' | 'modified' | 'deleted'>> {
  const snapshots = await db.select()
    .from(fileSnapshot)
    .where(eq(fileSnapshot.journeyId, journeyId));
  
  const potjStatus = new Map<string, 'synced' | 'modified' | 'deleted'>();
  
  // Group by POTJ and check each
  const byPOTJ = new Map<string, typeof snapshots>();
  for (const s of snapshots) {
    if (!s.potjId) continue;
    if (!byPOTJ.has(s.potjId)) byPOTJ.set(s.potjId, []);
    byPOTJ.get(s.potjId)!.push(s);
  }
  
  for (const [potjId, potjSnapshots] of byPOTJ) {
    let worstStatus: 'synced' | 'modified' | 'deleted' = 'synced';
    
    for (const snapshot of potjSnapshots) {
      if (!(await fileExists(snapshot.filePath))) {
        worstStatus = 'deleted';
        break; // Deleted is worst
      }
      
      const stats = await stat(snapshot.filePath);
      if (stats.mtimeMs !== snapshot.lastModified) {
        const currentHash = await computeFileHash(snapshot.filePath);
        if (currentHash !== snapshot.contentHash) {
          worstStatus = 'modified';
        }
      }
    }
    
    potjStatus.set(potjId, worstStatus);
  }
  
  return potjStatus;
}

/**
 * Clear all snapshots for a journey (for re-generation)
 */
export async function clearJourneySnapshots(journeyId: string): Promise<void> {
  await db.delete(fileSnapshot)
    .where(eq(fileSnapshot.journeyId, journeyId));
}
```

---

## Phase 3: Extended Source File Watcher

### Modify: `src/lib/server/journey-watcher.ts`

Add a second watcher class for source files:

```typescript
// Add to existing file after JourneyWatcher class

class SourceFileWatcher {
  private watcher: FSWatcher | null = null;
  private listeners: Set<ChangeCallback> = new Set();
  private watchedFiles: Set<string> = new Set();
  private isInitialized = false;

  /**
   * Watch specific source files referenced in journeys
   */
  watchFiles(filePaths: string[]) {
    // Close existing watcher if any
    if (this.watcher) {
      this.watcher.close();
      this.isInitialized = false;
    }

    this.watchedFiles = new Set(filePaths);
    
    if (filePaths.length === 0) {
      console.log('[SourceFileWatcher] No files to watch');
      return;
    }

    this.watcher = chokidar.watch(filePaths, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    });

    this.watcher
      .on('change', (filePath: string) => this.notifyListeners('change', filePath))
      .on('unlink', (filePath: string) => this.notifyListeners('unlink', filePath))
      .on('error', (error: unknown) => console.error('Source watcher error:', error));
    
    this.isInitialized = true;
    console.log(`[SourceFileWatcher] Watching ${filePaths.length} source files`);
  }

  /**
   * Add a listener for file changes
   */
  addListener(callback: ChangeCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of a file change
   */
  private notifyListeners(event: 'change' | 'unlink', filePath: string) {
    console.log(`[SourceFileWatcher] ${event}: ${filePath}`);
    
    for (const listener of this.listeners) {
      try {
        listener(event, filePath);
      } catch (err) {
        console.error('Error in source watcher listener:', err);
      }
    }
  }

  /**
   * Get the number of watched files
   */
  get watchedFileCount(): number {
    return this.watchedFiles.size;
  }

  /**
   * Check if a file is being watched
   */
  isWatching(filePath: string): boolean {
    return this.watchedFiles.has(filePath);
  }

  /**
   * Close the watcher
   */
  async close() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      this.isInitialized = false;
      this.watchedFiles.clear();
      this.listeners.clear();
    }
  }
}

// Singleton instance
export const sourceFileWatcher = new SourceFileWatcher();
```

---

## Phase 4: Reconciliation Status API

### New Endpoint: `GET /api/reconciliation-status`

**File:** `src/routes/api/reconciliation-status/+server.ts`

```typescript
import { json } from '@sveltejs/kit';
import { getJourneyReconciliationStatus } from '$lib/server/file-snapshot';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const journeyId = url.searchParams.get('journeyId');
  const projectPath = url.searchParams.get('projectPath') || process.cwd();
  
  if (!journeyId) {
    return json({ error: 'journeyId required' }, { status: 400 });
  }
  
  try {
    const status = await getJourneyReconciliationStatus(journeyId, projectPath);
    return json({
      journeyId,
      potjStatus: Object.fromEntries(status),
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking reconciliation status:', error);
    return json({ 
      error: 'Failed to check status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
```

### New Endpoint: `POST /api/reconcile`

**File:** `src/routes/api/reconcile/+server.ts`

```typescript
import { json } from '@sveltejs/kit';
import { reconcilePOTJ } from '$lib/server/reconciliation';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const { journeyId, potjId, projectPath } = await request.json();
  
  if (!journeyId || !potjId) {
    return json({ error: 'journeyId and potjId required' }, { status: 400 });
  }
  
  try {
    const result = await reconcilePOTJ(journeyId, potjId, projectPath || process.cwd());
    return json(result);
  } catch (error) {
    console.error('Reconciliation failed:', error);
    return json({ 
      success: false,
      error: 'Reconciliation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
```

---

## Phase 5: UI Components

### 5a. POTJ Status Types

**Update:** `src/lib/types/journey.ts`

```typescript
// Add these types
export type POTJReconciliationStatus = 'synced' | 'modified' | 'deleted' | 'unknown';

export interface POTJWithStatus extends POTJ {
  reconciliationStatus?: POTJReconciliationStatus;
}
```

### 5b. Status Badge Component

**New File:** `src/lib/components/ReconciliationBadge.svelte`

```svelte
<script lang="ts">
  import type { POTJReconciliationStatus } from '$lib/types/journey';
  
  let { 
    status,
    onReconcile 
  }: {
    status: POTJReconciliationStatus;
    onReconcile?: () => void;
  } = $props();
</script>

{#if status === 'modified'}
  <div class="badge modified" title="Code changed since journey was generated">
    <span class="icon">⚠️</span>
    <span class="text">Changed</span>
    {#if onReconcile}
      <button class="reconcile-btn" onclick={onReconcile}>
        Reconcile
      </button>
    {/if}
  </div>
{:else if status === 'deleted'}
  <div class="badge deleted" title="File not found">
    <span class="icon">❌</span>
    <span class="text">File missing</span>
  </div>
{/if}

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.6875rem;
    font-weight: 600;
  }
  
  .modified {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
  }
  
  .deleted {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }
  
  .icon {
    font-size: 0.75rem;
  }
  
  .text {
    line-height: 1;
  }
  
  .reconcile-btn {
    padding: 0.125rem 0.375rem;
    font-size: 0.625rem;
    font-weight: 600;
    background: #f59e0b;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  
  .reconcile-btn:hover {
    background: #d97706;
  }
</style>
```

### 5c. Update JourneyGrid.svelte

Add reconciliation status to POTJ cards:

```svelte
<!-- Import at top -->
<script lang="ts">
  import ReconciliationBadge from './ReconciliationBadge.svelte';
  import type { POTJReconciliationStatus } from '$lib/types/journey';
  
  // Add to props
  let {
    journey,
    onSelectPOTJ,
    potjStatuses = new Map(),
    onReconcile
  }: {
    journey: RootJourney;
    onSelectPOTJ: (potj: POTJ) => void;
    potjStatuses?: Map<string, POTJReconciliationStatus>;
    onReconcile?: (potjId: string) => void;
  } = $props();
</script>

<!-- In module-card, after module-content div -->
{#if potjStatuses.get(potj.id) && potjStatuses.get(potj.id) !== 'synced'}
  <ReconciliationBadge 
    status={potjStatuses.get(potj.id)}
    onReconcile={onReconcile ? () => onReconcile(potj.id) : undefined}
  />
{/if}
```

### 5d. Update JourneyDashboard.svelte

Add reconciliation status loading and handling:

```svelte
<script lang="ts">
  // Add state
  let potjStatuses = $state<Map<string, POTJReconciliationStatus>>(new Map());
  let isCheckingStatus = $state(false);
  
  // Load status when journey changes
  $effect(() => {
    if (state.activeJourney && projectPath) {
      loadReconciliationStatus(state.activeJourney);
    }
  });
  
  async function loadReconciliationStatus(journeyId: string) {
    isCheckingStatus = true;
    try {
      const params = new URLSearchParams({ 
        journeyId,
        projectPath: projectPath || ''
      });
      const response = await fetch(`/api/reconciliation-status?${params}`);
      if (response.ok) {
        const data = await response.json();
        potjStatuses = new Map(Object.entries(data.potjStatus));
      }
    } catch (err) {
      console.error('Failed to load reconciliation status:', err);
    } finally {
      isCheckingStatus = false;
    }
  }
  
  async function handleReconcile(potjId: string) {
    if (!state.activeJourney) return;
    
    try {
      const response = await fetch('/api/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journeyId: state.activeJourney,
          potjId,
          projectPath
        })
      });
      
      if (response.ok) {
        // Reload status and journey data
        await loadReconciliationStatus(state.activeJourney);
        // Optionally reload journeys
      }
    } catch (err) {
      console.error('Reconciliation failed:', err);
    }
  }
</script>

<!-- Pass to JourneyGrid -->
<JourneyGrid 
  journey={activeJourneyData}
  onSelectPOTJ={handleSelectPOTJ}
  {potjStatuses}
  onReconcile={handleReconcile}
/>
```

---

## Phase 6: Reconciliation Logic

### New File: `src/lib/server/reconciliation.ts`

```typescript
import { readFile } from 'fs/promises';
import { generatePOTJUpdate } from './gemini-reconcile';
import { createJourneySnapshots } from './file-snapshot';
import { parseJourneyMarkdown, extractFileReferencesFromJourney } from './journey-parser';
import { updateJourneyMarkdownFile } from './journey-writer';
import type { POTJ, RootJourney } from '$lib/types/journey';
import path from 'path';

interface ReconcileResult {
  success: boolean;
  updatedPOTJ?: POTJ;
  error?: string;
}

/**
 * Load a journey by ID
 */
async function loadJourney(journeyId: string): Promise<RootJourney | null> {
  const journeysDir = path.join(process.cwd(), 'journeys');
  const journeyPath = path.join(journeysDir, `${journeyId}.journey.md`);
  
  try {
    const content = await readFile(journeyPath, 'utf-8');
    return parseJourneyMarkdown(content);
  } catch {
    return null;
  }
}

/**
 * Find a POTJ within a journey
 */
function findPOTJ(journey: RootJourney, potjId: string): POTJ | null {
  const allPOTJs = [
    ...journey.sections.beginning.items,
    ...journey.sections.middle.items,
    ...journey.sections.end.items
  ];
  return allPOTJs.find(p => p.id === potjId) || null;
}

/**
 * Resolve file path from @/ notation
 */
function resolveFilePath(fileRef: string | undefined, projectPath: string): string | null {
  if (!fileRef) return null;
  
  let cleanPath = fileRef;
  if (cleanPath.startsWith('@/')) cleanPath = cleanPath.slice(2);
  if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
  
  return path.join(projectPath, 'src', cleanPath);
}

/**
 * Reconcile a specific POTJ by re-analyzing its file
 */
export async function reconcilePOTJ(
  journeyId: string,
  potjId: string,
  projectPath: string
): Promise<ReconcileResult> {
  try {
    // 1. Load current journey and POTJ
    const journey = await loadJourney(journeyId);
    if (!journey) {
      return { success: false, error: 'Journey not found' };
    }
    
    const potj = findPOTJ(journey, potjId);
    if (!potj) {
      return { success: false, error: 'POTJ not found' };
    }
    
    // 2. Read current file content
    const filePath = resolveFilePath(potj.fileRef, projectPath);
    if (!filePath) {
      return { success: false, error: 'No file reference in POTJ' };
    }
    
    const fileContent = await readFile(filePath, 'utf-8');
    
    // 3. Generate updated POTJ metadata via AI
    const updatedPOTJ = await generatePOTJUpdate(potj, fileContent);
    
    // 4. Update journey markdown file
    await updateJourneyMarkdownFile(journeyId, potjId, updatedPOTJ);
    
    // 5. Create new snapshot for the updated file
    const updatedJourney = await loadJourney(journeyId);
    if (updatedJourney) {
      await createJourneySnapshots(updatedJourney, projectPath);
    }
    
    return { success: true, updatedPOTJ };
  } catch (error) {
    console.error('Reconciliation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

### New File: `src/lib/server/gemini-reconcile.ts`

```typescript
import { env } from '$env/dynamic/private';
import type { POTJ } from '$lib/types/journey';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Generate updated POTJ metadata based on current file content
 */
export async function generatePOTJUpdate(
  existingPOTJ: POTJ,
  currentFileContent: string
): Promise<POTJ> {
  const apiKey = env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = `You are updating journey documentation for a code file that has changed.

## Existing POTJ Entry:
- Title: ${existingPOTJ.title}
- Description: ${existingPOTJ.description || 'None'}
- Key Behaviors: ${existingPOTJ.keyBehavior?.join(', ') || 'None'}
- Tags: ${existingPOTJ.tags?.join(', ') || 'None'}

## Current File Content:
\`\`\`
${currentFileContent.slice(0, 6000)}
\`\`\`

Analyze the current code and update the POTJ entry. Keep the same general structure but update:
1. Description if the purpose has changed
2. Key behaviors if functionality changed
3. Tags if new concepts were introduced

Respond with JSON only:
{
  "title": "Updated title if needed, or keep original",
  "description": "2-3 sentence description of current functionality",
  "keyBehavior": ["Behavior 1", "Behavior 2", "Behavior 3"],
  "tags": ["tag1", "tag2"],
  "codeReference": {
    "startLine": 10,
    "endLine": 25,
    "code": "key code snippet"
  }
}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.3, 
        maxOutputTokens: 800 
      }
    })
  });

  if (!response.ok) {
    throw new Error('Gemini API error');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    // Return original if no response
    return existingPOTJ;
  }

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const updates = JSON.parse(jsonMatch[0]);
      
      return {
        ...existingPOTJ,
        title: updates.title || existingPOTJ.title,
        description: updates.description || existingPOTJ.description,
        keyBehavior: updates.keyBehavior || existingPOTJ.keyBehavior,
        tags: updates.tags || existingPOTJ.tags,
        codeReference: updates.codeReference ? {
          file: existingPOTJ.codeReference?.file || existingPOTJ.fileRef || '',
          lines: `${updates.codeReference.startLine}-${updates.codeReference.endLine}`,
          language: existingPOTJ.codeReference?.language || 'typescript',
          code: updates.codeReference.code
        } : existingPOTJ.codeReference
      };
    }
  } catch (err) {
    console.error('Failed to parse AI response:', err);
  }
  
  return existingPOTJ;
}
```

---

## Implementation Timeline

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Database schema + migration | 30 min |
| 2 | File snapshot service | 1.5 hours |
| 3 | Source file watcher extension | 1 hour |
| 4 | Reconciliation status API | 1 hour |
| 5 | UI components (badge, integration) | 1.5 hours |
| 6 | Reconciliation logic + AI integration | 2 hours |
| 7 | Testing & polish | 1 hour |
| **Total** | | **8.5 hours** |

---

## Testing Checklist

- [ ] Database schema migrates successfully
- [ ] Snapshots created when journeys load
- [ ] File modifications detected correctly
- [ ] File deletions detected correctly
- [ ] Badge appears on modified POTJs
- [ ] Badge appears on deleted file POTJs
- [ ] Reconcile button triggers AI re-scan
- [ ] Journey markdown updated after reconcile
- [ ] New snapshot created after reconcile
- [ ] SSE pushes status updates to UI
- [ ] Performance acceptable with many files

---

## Success Metrics

1. **Visibility**: Users immediately see which POTJs are stale
2. **Accuracy**: <5% false positives on file change detection
3. **Speed**: Status check completes in <500ms per journey
4. **Usability**: One-click reconciliation flow

---

## Future Enhancements

1. **Batch Reconciliation**: "Reconcile All" button for multiple changed POTJs
2. **Diff View**: Show what changed in the file since last snapshot
3. **Auto-Reconcile**: Option to automatically reconcile on file save
4. **Notification System**: Desktop notifications for file changes
5. **History**: Track reconciliation history and allow rollback
