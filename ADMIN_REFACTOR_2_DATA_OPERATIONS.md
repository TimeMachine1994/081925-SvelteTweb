# Admin Dashboard Refactor - Part 2: Data Operations

## Overview

This document covers high-density data grids, powerful filtering, bulk actions, inline editing, validation, and revision history for TributeStream admin operations.

---

## 1. High-Density Data Grids

### Core Table Component

```typescript
interface DataGridColumn {
  id: string;
  label: string;
  field: string;
  width?: number;
  minWidth?: number;
  sortable?: boolean;
  resizable?: boolean;
  pinned?: 'left' | 'right' | false;
  formatter?: (value: any, row: any) => string | Component;
  align?: 'left' | 'center' | 'right';
}

interface DataGridConfig {
  columns: DataGridColumn[];
  data: any[];
  selectable?: boolean;
  sortable?: boolean;
  resizable?: boolean;
  pinnableColumns?: boolean;
  virtualScroll?: boolean;
  rowHeight?: number;
}
```

### Implementation

```svelte
<!-- DataGrid.svelte -->
<script lang="ts">
  import { writable } from 'svelte/store';
  
  let { 
    columns = [],
    data = [],
    selectable = false,
    onRowClick,
    onSelectionChange
  } = $props();
  
  let selectedRows = $state(new Set());
  let sortedColumn = $state(null);
  let sortDirection = $state('asc');
  let columnWidths = $state(new Map());
  let pinnedColumns = $state({ left: [], right: [] });
  
  // Multi-sort support
  let sortStack = $state([]);
  
  function handleSort(column, holdShift = false) {
    if (holdShift) {
      // Add to sort stack
      const existing = sortStack.findIndex(s => s.field === column.field);
      if (existing >= 0) {
        sortStack[existing].direction = sortStack[existing].direction === 'asc' ? 'desc' : 'asc';
      } else {
        sortStack.push({ field: column.field, direction: 'asc' });
      }
    } else {
      // Single sort
      sortStack = [{ 
        field: column.field, 
        direction: sortedColumn === column.field && sortDirection === 'asc' ? 'desc' : 'asc'
      }];
    }
    
    sortedColumn = column.field;
    sortDirection = sortStack[0].direction;
  }
  
  function handleColumnResize(columnId, newWidth) {
    columnWidths.set(columnId, newWidth);
  }
  
  function togglePin(columnId, side: 'left' | 'right') {
    // Implementation for pinning columns
  }
</script>

<div class="data-grid">
  <!-- Column header with controls -->
  <div class="grid-header">
    {#if selectable}
      <div class="header-cell checkbox-cell">
        <input 
          type="checkbox" 
          checked={selectedRows.size === data.length}
          onchange={selectAll}
        />
      </div>
    {/if}
    
    {#each columns as column}
      <div 
        class="header-cell"
        class:pinned={pinnedColumns.left.includes(column.id)}
        style="width: {columnWidths.get(column.id) || column.width}px"
      >
        <button 
          class="sort-trigger"
          onclick={(e) => handleSort(column, e.shiftKey)}
        >
          {column.label}
          {#if sortStack.find(s => s.field === column.field)}
            <span class="sort-indicator">
              {sortStack.find(s => s.field === column.field).direction === 'asc' ? '↑' : '↓'}
              {#if sortStack.length > 1}
                <span class="sort-index">{sortStack.findIndex(s => s.field === column.field) + 1}</span>
              {/if}
            </span>
          {/if}
        </button>
        
        <ColumnMenu {column}>
          <MenuItem onclick={() => togglePin(column.id, 'left')}>Pin Left</MenuItem>
          <MenuItem onclick={() => togglePin(column.id, 'right')}>Pin Right</MenuItem>
          <MenuItem onclick={() => resizeToFit(column.id)}>Resize to Fit</MenuItem>
          <MenuItem onclick={() => hideColumn(column.id)}>Hide Column</MenuItem>
        </ColumnMenu>
        
        {#if column.resizable}
          <div class="resize-handle" onmousedown={(e) => startResize(e, column.id)} />
        {/if}
      </div>
    {/each}
  </div>
  
  <!-- Data rows -->
  <div class="grid-body">
    {#each sortedData as row, index}
      <div 
        class="grid-row"
        class:selected={selectedRows.has(row.id)}
        onclick={() => onRowClick?.(row)}
      >
        {#if selectable}
          <div class="body-cell checkbox-cell">
            <input 
              type="checkbox" 
              checked={selectedRows.has(row.id)}
              onchange={() => toggleSelection(row.id)}
            />
          </div>
        {/if}
        
        {#each columns as column}
          <div 
            class="body-cell"
            style="width: {columnWidths.get(column.id) || column.width}px"
          >
            {#if column.formatter}
              {@const formatted = column.formatter(row[column.field], row)}
              {#if typeof formatted === 'string'}
                {formatted}
              {:else}
                <svelte:component this={formatted} data={row} />
              {/if}
            {:else}
              {row[column.field]}
            {/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>
</div>
```

### Column Presets for Each Domain

**Memorials:**
```typescript
const MEMORIAL_COLUMNS: DataGridColumn[] = [
  { id: 'lovedOneName', label: 'Name', field: 'lovedOneName', width: 200, pinned: 'left', sortable: true },
  { id: 'ownerEmail', label: 'Owner', field: 'ownerEmail', width: 200, sortable: true },
  { id: 'isPaid', label: 'Status', field: 'isPaid', width: 100, formatter: (val) => val ? '✅ Paid' : '❌ Unpaid' },
  { id: 'createdAt', label: 'Created', field: 'createdAt', width: 150, formatter: formatDate, sortable: true },
  { id: 'services.main.location.name', label: 'Location', field: 'services.main.location.name', width: 180 },
  { id: 'services.main.time.date', label: 'Service Date', field: 'services.main.time.date', width: 120, formatter: formatDate },
  { id: 'followerCount', label: 'Followers', field: 'followerCount', width: 100, align: 'center' }
];
```

**Streams:**
```typescript
const STREAM_COLUMNS: DataGridColumn[] = [
  { id: 'title', label: 'Title', field: 'title', width: 250, pinned: 'left' },
  { id: 'memorialName', label: 'Memorial', field: 'memorialName', width: 200 },
  { id: 'status', label: 'Status', field: 'status', width: 120, formatter: StatusBadge },
  { id: 'scheduledStartTime', label: 'Scheduled', field: 'scheduledStartTime', width: 150, formatter: formatDateTime },
  { id: 'viewerCount', label: 'Viewers', field: 'viewerCount', width: 100, align: 'right' },
  { id: 'recordingReady', label: 'Recording', field: 'recordingReady', width: 100, formatter: (val) => val ? '✅' : '⏳' }
];
```

---

## 2. Powerful Filtering System

### Filter Builder Component

```typescript
interface FilterRule {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'isNull' | 'isNotNull' | 'in';
  value: any;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
}

interface FilterGroup {
  logic: 'AND' | 'OR';
  rules: (FilterRule | FilterGroup)[];
}
```

### UI Implementation

```svelte
<!-- FilterBuilder.svelte -->
<script lang="ts">
  let { fields, onFilterChange } = $props();
  
  let filterGroups = $state([{
    logic: 'AND',
    rules: []
  }]);
  
  function addRule(groupIndex) {
    filterGroups[groupIndex].rules.push({
      field: fields[0].id,
      operator: 'eq',
      value: '',
      type: fields[0].type
    });
  }
  
  function addGroup() {
    filterGroups.push({
      logic: 'AND',
      rules: []
    });
  }
</script>

<div class="filter-builder">
  {#each filterGroups as group, groupIndex}
    <div class="filter-group">
      <select bind:value={group.logic}>
        <option value="AND">All conditions (AND)</option>
        <option value="OR">Any condition (OR)</option>
      </select>
      
      {#each group.rules as rule, ruleIndex}
        <div class="filter-rule">
          <select bind:value={rule.field}>
            {#each fields as field}
              <option value={field.id}>{field.label}</option>
            {/each}
          </select>
          
          <select bind:value={rule.operator}>
            {#if rule.type === 'string'}
              <option value="eq">equals</option>
              <option value="ne">not equals</option>
              <option value="contains">contains</option>
              <option value="startsWith">starts with</option>
              <option value="isNull">is empty</option>
              <option value="isNotNull">is not empty</option>
            {:else if rule.type === 'number' || rule.type === 'date'}
              <option value="eq">equals</option>
              <option value="ne">not equals</option>
              <option value="gt">greater than</option>
              <option value="gte">greater or equal</option>
              <option value="lt">less than</option>
              <option value="lte">less or equal</option>
            {:else if rule.type === 'boolean'}
              <option value="eq">is</option>
            {/if}
          </select>
          
          {#if !['isNull', 'isNotNull'].includes(rule.operator)}
            {#if rule.type === 'date'}
              <input type="date" bind:value={rule.value} />
            {:else if rule.type === 'boolean'}
              <select bind:value={rule.value}>
                <option value={true}>True</option>
                <option value={false}>False</option>
              </select>
            {:else}
              <input type="text" bind:value={rule.value} />
            {/if}
          {/if}
          
          <button onclick={() => removeRule(groupIndex, ruleIndex)}>✕</button>
        </div>
      {/each}
      
      <button onclick={() => addRule(groupIndex)}>+ Add Rule</button>
    </div>
  {/each}
  
  <button onclick={addGroup}>+ Add Group</button>
</div>
```

### Quick Filters (Memorials Example)

```svelte
<QuickFilters>
  <FilterChip 
    active={filters.isPaid === false}
    onclick={() => toggleFilter('isPaid', false)}
  >
    💰 Unpaid
  </FilterChip>
  
  <FilterChip 
    active={filters.isPublic === false}
    onclick={() => toggleFilter('isPublic', false)}
  >
    🔒 Private
  </FilterChip>
  
  <FilterChip 
    active={filters.createdAt >= startOfMonth}
    onclick={() => toggleFilter('createdAt', { gte: startOfMonth })}
  >
    📅 This Month
  </FilterChip>
  
  <FilterChip 
    active={filters.followerCount > 0}
    onclick={() => toggleFilter('followerCount', { gt: 0 })}
  >
    ❤️ Has Followers
  </FilterChip>
</QuickFilters>
```

---

## 3. Bulk Actions

### Bulk Action Toolbar

```svelte
<script lang="ts">
  let { selectedCount, selectedIds, onAction } = $props();
</script>

{#if selectedCount > 0}
  <div class="bulk-actions-toolbar">
    <div class="selection-info">
      {selectedCount} selected
      <button onclick={clearSelection}>Clear</button>
    </div>
    
    <div class="actions">
      <!-- Memorial bulk actions -->
      {#if resourceType === 'memorial'}
        <BulkAction icon="✅" onclick={() => onAction('markPaid', selectedIds)}>
          Mark Paid
        </BulkAction>
        <BulkAction icon="🔒" onclick={() => onAction('makePrivate', selectedIds)}>
          Make Private
        </BulkAction>
        <BulkAction icon="🌐" onclick={() => onAction('makePublic', selectedIds)}>
          Make Public
        </BulkAction>
        <BulkAction icon="📧" onclick={() => onAction('sendEmail', selectedIds)}>
          Email Owners
        </BulkAction>
        <BulkAction icon="📥" onclick={() => onAction('export', selectedIds)} variant="secondary">
          Export CSV
        </BulkAction>
        <BulkAction icon="🗑️" onclick={() => onAction('delete', selectedIds)} variant="danger">
          Delete
        </BulkAction>
      {/if}
      
      <!-- Stream bulk actions -->
      {#if resourceType === 'stream'}
        <BulkAction icon="👁️" onclick={() => onAction('makeVisible', selectedIds)}>
          Make Visible
        </BulkAction>
        <BulkAction icon="🚫" onclick={() => onAction('makeInvisible', selectedIds)}>
          Hide
        </BulkAction>
        <BulkAction icon="🗑️" onclick={() => onAction('delete', selectedIds)} variant="danger">
          Delete
        </BulkAction>
      {/if}
    </div>
  </div>
{/if}
```

### Bulk Action Handler with Progress

```typescript
// Server endpoint: /api/admin/bulk-actions/+server.ts
export async function POST({ request, locals }) {
  const { action, ids, params } = await request.json();
  
  const results = {
    success: [],
    failed: [],
    total: ids.length
  };
  
  for (const id of ids) {
    try {
      await performAction(action, id, params);
      results.success.push(id);
      
      // Send progress update via SSE or WebSocket
      await sendProgressUpdate({
        completed: results.success.length + results.failed.length,
        total: results.total
      });
    } catch (error) {
      results.failed.push({ id, error: error.message });
    }
  }
  
  return json(results);
}
```

### Progress Modal

```svelte
<BulkActionProgress {action} {total} bind:completed bind:failed>
  <ProgressBar value={completed + failed.length} max={total} />
  
  <div class="progress-stats">
    <div class="success">✅ {completed} succeeded</div>
    <div class="failed">❌ {failed.length} failed</div>
    <div class="remaining">⏳ {total - completed - failed.length} remaining</div>
  </div>
  
  {#if failed.length > 0}
    <details>
      <summary>View failures ({failed.length})</summary>
      <ul>
        {#each failed as failure}
          <li>{failure.id}: {failure.error}</li>
        {/each}
      </ul>
    </details>
  {/if}
</BulkActionProgress>
```

---

## 4. Inline & Full-Form Editing

### Inline Edit Mode

```svelte
<script lang="ts">
  let editMode = $state(false);
  let editValue = $state(originalValue);
  let saving = $state(false);
  
  async function saveInlineEdit() {
    saving = true;
    try {
      await fetch(`/api/admin/memorials/${memorialId}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: editValue })
      });
      originalValue = editValue;
      editMode = false;
    } catch (error) {
      alert('Failed to save');
    } finally {
      saving = false;
    }
  }
</script>

<div class="inline-editable">
  {#if editMode}
    <input 
      bind:value={editValue}
      onblur={saveInlineEdit}
      onkeydown={(e) => e.key === 'Enter' && saveInlineEdit()}
      autofocus
    />
    {#if saving}
      <Spinner size="sm" />
    {/if}
  {:else}
    <span ondblclick={() => editMode = true}>
      {originalValue}
      <button class="edit-icon" onclick={() => editMode = true}>✏️</button>
    </span>
  {/if}
</div>
```

### Full Form Modal

```svelte
<!-- EditMemorialModal.svelte -->
<script lang="ts">
  let { memorial, onSave, onCancel } = $props();
  
  let formData = $state({ ...memorial });
  let errors = $state({});
  let saving = $state(false);
  
  async function handleSubmit() {
    // Validation
    errors = validateMemorial(formData);
    if (Object.keys(errors).length > 0) return;
    
    saving = true;
    try {
      const response = await fetch(`/api/admin/memorials/${memorial.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        onSave(await response.json());
      }
    } finally {
      saving = false;
    }
  }
</script>

<Modal title="Edit Memorial: {memorial.lovedOneName}">
  <form onsubmit|preventDefault={handleSubmit}>
    <FormField label="Loved One's Name" error={errors.lovedOneName}>
      <input type="text" bind:value={formData.lovedOneName} required />
    </FormField>
    
    <FormField label="Owner Email" error={errors.ownerEmail}>
      <input type="email" bind:value={formData.ownerEmail} required />
    </FormField>
    
    <FormField label="Payment Status">
      <select bind:value={formData.isPaid}>
        <option value={true}>Paid</option>
        <option value={false}>Unpaid</option>
      </select>
    </FormField>
    
    <FormField label="Visibility">
      <label>
        <input type="checkbox" bind:checked={formData.isPublic} />
        Public memorial page
      </label>
    </FormField>
    
    <div class="form-actions">
      <Button variant="secondary" onclick={onCancel}>Cancel</Button>
      <Button type="submit" loading={saving}>Save Changes</Button>
    </div>
  </form>
</Modal>
```

---

## 5. Validation & Field Masks

### Real-time Validation

```typescript
// lib/admin/validation.ts
export const memorialValidation = {
  lovedOneName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-\.]+$/,
    message: 'Name must be 2-100 characters, letters only'
  },
  ownerEmail: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Valid email required'
  },
  familyContactPhone: {
    pattern: /^\+?1?\d{10,14}$/,
    mask: '(###) ###-####',
    message: 'Valid phone number required'
  }
};

export function validateField(field: string, value: any, rules: any) {
  if (rules.required && !value) {
    return 'This field is required';
  }
  
  if (rules.minLength && value.length < rules.minLength) {
    return `Minimum ${rules.minLength} characters`;
  }
  
  if (rules.pattern && !rules.pattern.test(value)) {
    return rules.message;
  }
  
  return null;
}
```

### Server-Side Validation

```typescript
// routes/api/admin/memorials/[id]/+server.ts
export async function PUT({ params, request, locals }) {
  const data = await request.json();
  
  // Server validation
  const errors = await validateMemorialUpdate(data);
  if (errors) {
    return json({ errors }, { status: 400 });
  }
  
  // Check uniqueness
  if (data.fullSlug) {
    const existing = await adminDb
      .collection('memorials')
      .where('fullSlug', '==', data.fullSlug)
      .where('id', '!=', params.id)
      .get();
      
    if (!existing.empty) {
      return json({ 
        errors: { fullSlug: 'This URL slug is already taken' }
      }, { status: 400 });
    }
  }
  
  // Update memorial
  await adminDb.collection('memorials').doc(params.id).update(data);
  
  return json({ success: true });
}
```

---

## 6. Drafts & Staging

### Draft Storage

```typescript
// Store drafts locally or in Firestore
interface Draft {
  id: string;
  resourceType: 'memorial' | 'stream' | 'user';
  resourceId: string;
  changes: Record<string, any>;
  savedAt: Date;
  savedBy: string;
}

// Save draft
async function saveDraft(resourceType, resourceId, changes) {
  await adminDb.collection('admin_drafts').doc(`${resourceType}_${resourceId}`).set({
    resourceType,
    resourceId,
    changes,
    savedAt: new Date(),
    savedBy: locals.user.uid
  });
}

// Load draft
async function loadDraft(resourceType, resourceId) {
  const doc = await adminDb
    .collection('admin_drafts')
    .doc(`${resourceType}_${resourceId}`)
    .get();
    
  return doc.exists ? doc.data() : null;
}
```

### Compare Changes UI

```svelte
<ChangeComparison>
  <div class="compare-side">
    <h3>Current</h3>
    {#each Object.entries(originalData) as [key, value]}
      <div class="field">
        <label>{key}</label>
        <span class:changed={draftData[key] !== value}>{value}</span>
      </div>
    {/each}
  </div>
  
  <div class="compare-side">
    <h3>Draft Changes</h3>
    {#each Object.entries(draftData) as [key, value]}
      <div class="field">
        <label>{key}</label>
        <span class:changed={originalData[key] !== value}>{value}</span>
      </div>
    {/each}
  </div>
</ChangeComparison>
```

---

## 7. Revision History

### History Tracking

```typescript
// Collection: memorial_history (subcollection)
interface RevisionHistory {
  memorialId: string;
  version: number;
  changes: Record<string, { before: any; after: any }>;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}

// Track changes
async function trackChange(memorialId, changes, userId, reason) {
  const historyRef = adminDb
    .collection('memorials')
    .doc(memorialId)
    .collection('history');
    
  const lastVersion = await historyRef
    .orderBy('version', 'desc')
    .limit(1)
    .get();
    
  await historyRef.add({
    version: lastVersion.empty ? 1 : lastVersion.docs[0].data().version + 1,
    changes,
    changedBy: userId,
    changedAt: new Date(),
    reason
  });
}
```

### History UI

```svelte
<RevisionHistory {memorialId}>
  {#each revisions as revision}
    <div class="revision">
      <div class="revision-meta">
        <span class="version">v{revision.version}</span>
        <span class="user">{revision.changedBy}</span>
        <span class="date">{formatDate(revision.changedAt)}</span>
      </div>
      
      <div class="changes">
        {#each Object.entries(revision.changes) as [field, change]}
          <div class="field-change">
            <strong>{field}:</strong>
            <span class="before">{change.before}</span>
            →
            <span class="after">{change.after}</span>
          </div>
        {/each}
      </div>
      
      <div class="revision-actions">
        <Button size="sm" onclick={() => restoreVersion(revision)}>
          Restore
        </Button>
        <Button size="sm" variant="secondary" onclick={() => compareVersion(revision)}>
          Compare
        </Button>
      </div>
    </div>
  {/each}
</RevisionHistory>
```

---

*Next: See ADMIN_REFACTOR_3_SAFETY.md for safety guardrails and permissions*
