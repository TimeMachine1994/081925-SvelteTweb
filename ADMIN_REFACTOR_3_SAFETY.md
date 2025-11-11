# Admin Dashboard Refactor - Part 3: Safety & Guardrails

## Overview

This document covers RBAC/ABAC permissions, destructive action guards, undo systems, dry-runs, and rate limiting for TributeStream admin operations.

---

## 1. Least-Privilege RBAC/ABAC

### Permission Model

```typescript
// lib/admin/permissions.ts
interface Permission {
  resource: 'memorial' | 'stream' | 'user' | 'funeral_director' | 'blog' | 'audit_log' | 'system';
  action: 'read' | 'create' | 'update' | 'delete' | 'approve' | 'export';
  scope?: 'own' | 'team' | 'all';
  conditions?: PermissionCondition[];
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  inherits?: string[]; // Role inheritance
}

// Define roles
const ADMIN_ROLES: Record<string, Role> = {
  super_admin: {
    id: 'super_admin',
    name: 'Super Administrator',
    permissions: [
      { resource: '*', action: '*', scope: 'all' } // Full access
    ]
  },
  
  content_admin: {
    id: 'content_admin',
    name: 'Content Administrator',
    permissions: [
      { resource: 'memorial', action: 'read', scope: 'all' },
      { resource: 'memorial', action: 'update', scope: 'all' },
      { resource: 'stream', action: 'read', scope: 'all' },
      { resource: 'stream', action: 'update', scope: 'all' },
      { resource: 'blog', action: '*', scope: 'all' },
      { resource: 'audit_log', action: 'read', scope: 'all' }
    ]
  },
  
  customer_support: {
    id: 'customer_support',
    name: 'Customer Support',
    permissions: [
      { resource: 'memorial', action: 'read', scope: 'all' },
      { resource: 'memorial', action: 'update', scope: 'all', conditions: [
        { field: 'isPaid', operator: 'eq', value: false } // Can only edit unpaid
      ]},
      { resource: 'user', action: 'read', scope: 'all' },
      { resource: 'user', action: 'update', scope: 'all', conditions: [
        { field: 'role', operator: 'ne', value: 'admin' } // Cannot edit admins
      ]},
      { resource: 'stream', action: 'read', scope: 'all' },
      { resource: 'audit_log', action: 'read', scope: 'own' }
    ]
  },
  
  financial_admin: {
    id: 'financial_admin',
    name: 'Financial Administrator',
    permissions: [
      { resource: 'memorial', action: 'read', scope: 'all' },
      { resource: 'memorial', action: 'update', scope: 'all', conditions: [
        { field: 'action', operator: 'in', value: ['markPaid', 'markUnpaid'] }
      ]},
      { resource: 'audit_log', action: 'read', scope: 'all' },
      { resource: 'audit_log', action: 'export', scope: 'all' }
    ]
  },
  
  readonly_admin: {
    id: 'readonly_admin',
    name: 'Read-Only Administrator',
    permissions: [
      { resource: '*', action: 'read', scope: 'all' }
    ]
  }
};
```

### Permission Checking

```typescript
// lib/admin/permissions.ts
export function hasPermission(
  user: AdminUser, 
  resource: string, 
  action: string, 
  target?: any
): boolean {
  const role = ADMIN_ROLES[user.adminRole || 'readonly_admin'];
  
  // Check direct permissions
  for (const permission of role.permissions) {
    if (permission.resource !== '*' && permission.resource !== resource) continue;
    if (permission.action !== '*' && permission.action !== action) continue;
    
    // Check scope
    if (permission.scope === 'own' && target?.ownerId !== user.uid) continue;
    
    // Check conditions
    if (permission.conditions) {
      const meetsConditions = permission.conditions.every(condition => {
        return evaluateCondition(condition, target);
      });
      if (!meetsConditions) continue;
    }
    
    return true;
  }
  
  // Check inherited roles
  if (role.inherits) {
    for (const inheritedRoleId of role.inherits) {
      const inheritedRole = ADMIN_ROLES[inheritedRoleId];
      if (hasPermission({ ...user, adminRole: inheritedRoleId }, resource, action, target)) {
        return true;
      }
    }
  }
  
  return false;
}

function evaluateCondition(condition: PermissionCondition, target: any): boolean {
  const value = getNestedValue(target, condition.field);
  
  switch (condition.operator) {
    case 'eq': return value === condition.value;
    case 'ne': return value !== condition.value;
    case 'in': return condition.value.includes(value);
    case 'gt': return value > condition.value;
    // ... more operators
  }
}
```

### UI Permission Guards

```svelte
<script lang="ts">
  import { hasPermission } from '$lib/admin/permissions';
  import { adminUser } from '$lib/stores/adminUser';
</script>

<!-- Guard individual actions -->
{#if hasPermission($adminUser, 'memorial', 'update', memorial)}
  <Button onclick={editMemorial}>Edit</Button>
{/if}

{#if hasPermission($adminUser, 'memorial', 'delete', memorial)}
  <Button variant="danger" onclick={deleteMemorial}>Delete</Button>
{/if}

<!-- Guard entire sections -->
{#if hasPermission($adminUser, 'audit_log', 'read')}
  <section class="audit-logs">
    <!-- Audit log content -->
  </section>
{/if}

<!-- Show disabled state for no permission -->
<Button 
  disabled={!hasPermission($adminUser, 'memorial', 'approve')}
  onclick={approveMemorial}
>
  Approve Memorial
</Button>
```

### Server-Side Enforcement

```typescript
// hooks.server.ts - Admin permission middleware
export async function handle({ event, resolve }) {
  if (event.url.pathname.startsWith('/api/admin/')) {
    const user = event.locals.user;
    const [, , , resource, id, action] = event.url.pathname.split('/');
    
    // Extract action from HTTP method
    const actionMap = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete'
    };
    
    const requiredAction = actionMap[event.request.method];
    
    // Load target resource if ID provided
    let target;
    if (id) {
      target = await loadResource(resource, id);
    }
    
    // Check permission
    if (!hasPermission(user, resource, requiredAction, target)) {
      return new Response(JSON.stringify({
        error: 'Permission denied',
        message: `You do not have permission to ${requiredAction} ${resource}`
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  return resolve(event);
}
```

### Role Assignment UI

```svelte
<!-- AdminUserRoleEditor.svelte -->
<script lang="ts">
  let { user } = $props();
  let selectedRole = $state(user.adminRole || 'readonly_admin');
  
  async function updateRole() {
    await fetch(`/api/admin/users/${user.uid}/role`, {
      method: 'PUT',
      body: JSON.stringify({ adminRole: selectedRole })
    });
  }
</script>

<FormField label="Admin Role">
  <select bind:value={selectedRole} onchange={updateRole}>
    <option value="readonly_admin">Read-Only Admin</option>
    <option value="customer_support">Customer Support</option>
    <option value="content_admin">Content Admin</option>
    <option value="financial_admin">Financial Admin</option>
    <option value="super_admin">Super Admin</option>
  </select>
  
  <RoleDescription role={selectedRole} />
</FormField>
```

---

## 2. Guarded Destructive Actions

### Confirmation Dialog System

```typescript
interface ConfirmationConfig {
  title: string;
  message: string;
  actionLabel: string;
  variant: 'danger' | 'warning';
  requireReAuth?: boolean;
  showImpact?: boolean;
  impactData?: {
    affectedRecords: number;
    cascadeDeletes?: Array<{ type: string; count: number }>;
  };
  confirmationText?: string; // Require typing specific text
}
```

### Confirmation Component

```svelte
<!-- ConfirmationDialog.svelte -->
<script lang="ts">
  let { config, onConfirm, onCancel } = $props();
  
  let confirmText = $state('');
  let reAuthPassword = $state('');
  let loading = $state(false);
  
  async function handleConfirm() {
    // Re-authentication if required
    if (config.requireReAuth) {
      loading = true;
      try {
        await reAuthenticateUser(reAuthPassword);
      } catch (error) {
        alert('Authentication failed');
        loading = false;
        return;
      }
    }
    
    // Text confirmation if required
    if (config.confirmationText && confirmText !== config.confirmationText) {
      alert(`Please type "${config.confirmationText}" to confirm`);
      return;
    }
    
    await onConfirm();
    loading = false;
  }
</script>

<Modal {title}>
  <div class="confirmation-dialog" class:danger={config.variant === 'danger'}>
    <!-- Warning icon -->
    <div class="icon">
      {#if config.variant === 'danger'}
        ⚠️
      {:else}
        ⚡
      {/if}
    </div>
    
    <!-- Message -->
    <p class="message">{config.message}</p>
    
    <!-- Impact summary -->
    {#if config.showImpact && config.impactData}
      <div class="impact-summary">
        <h4>This action will affect:</h4>
        <ul>
          <li><strong>{config.impactData.affectedRecords}</strong> primary records</li>
          {#each config.impactData.cascadeDeletes || [] as cascade}
            <li><strong>{cascade.count}</strong> {cascade.type} (cascade delete)</li>
          {/each}
        </ul>
      </div>
    {/if}
    
    <!-- Text confirmation -->
    {#if config.confirmationText}
      <div class="text-confirmation">
        <p>Type <code>{config.confirmationText}</code> to confirm:</p>
        <input 
          type="text" 
          bind:value={confirmText}
          placeholder={config.confirmationText}
        />
      </div>
    {/if}
    
    <!-- Re-authentication -->
    {#if config.requireReAuth}
      <div class="reauth">
        <p>Please enter your password to confirm:</p>
        <input 
          type="password" 
          bind:value={reAuthPassword}
          placeholder="Your password"
        />
      </div>
    {/if}
    
    <!-- Actions -->
    <div class="actions">
      <Button variant="secondary" onclick={onCancel}>
        Cancel
      </Button>
      <Button 
        variant={config.variant}
        onclick={handleConfirm}
        disabled={config.confirmationText && confirmText !== config.confirmationText}
        {loading}
      >
        {config.actionLabel}
      </Button>
    </div>
  </div>
</Modal>
```

### Usage Examples

**Delete Memorial (High Impact):**
```svelte
<script>
  async function deleteMemorial(memorial) {
    const impact = await fetchDeletionImpact(memorial.id);
    
    const confirmed = await showConfirmation({
      title: 'Delete Memorial',
      message: `Are you sure you want to permanently delete the memorial for ${memorial.lovedOneName}?`,
      actionLabel: 'Delete Memorial',
      variant: 'danger',
      requireReAuth: true,
      showImpact: true,
      impactData: {
        affectedRecords: 1,
        cascadeDeletes: [
          { type: 'streams', count: impact.streamCount },
          { type: 'slideshows', count: impact.slideshowCount },
          { type: 'followers', count: impact.followerCount }
        ]
      },
      confirmationText: memorial.lovedOneName
    });
    
    if (confirmed) {
      await performDelete(memorial.id);
    }
  }
</script>
```

**Mark Unpaid (Medium Impact):**
```svelte
<script>
  async function markUnpaid(memorial) {
    const confirmed = await showConfirmation({
      title: 'Mark Memorial Unpaid',
      message: `This will change payment status and may affect the family's access. Continue?`,
      actionLabel: 'Mark Unpaid',
      variant: 'warning',
      requireReAuth: false
    });
    
    if (confirmed) {
      await updatePaymentStatus(memorial.id, false);
    }
  }
</script>
```

---

## 3. Undo Windows & Soft Delete

### Soft Delete Implementation

```typescript
// Add to memorial interface
interface Memorial {
  // ... existing fields
  deletedAt?: Date;
  deletedBy?: string;
  deletionReason?: string;
  isDeleted?: boolean;
}

// Soft delete function
async function softDeleteMemorial(memorialId: string, reason: string, userId: string) {
  await adminDb.collection('memorials').doc(memorialId).update({
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: userId,
    deletionReason: reason
  });
  
  // Log to audit
  await logAuditEvent({
    action: 'soft_delete',
    resourceType: 'memorial',
    resourceId: memorialId,
    userId,
    details: { reason }
  });
  
  return { undoDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }; // 30 days
}
```

### Undo Toast

```svelte
<script>
  import { toast } from '$lib/stores/toast';
  
  async function deleteMemorialWithUndo(memorial) {
    const result = await softDeleteMemorial(memorial.id, 'Admin deletion', user.uid);
    
    toast.show({
      message: `Memorial for ${memorial.lovedOneName} deleted`,
      action: {
        label: 'Undo',
        onclick: async () => {
          await restoreMemorial(memorial.id);
          toast.show({ message: 'Memorial restored', variant: 'success' });
        }
      },
      duration: 10000, // 10 second undo window
      variant: 'warning'
    });
  }
</script>

<!-- Toast Component -->
<Toast {message} {variant} {duration}>
  {#if action}
    <button class="toast-action" onclick={action.onclick}>
      {action.label}
    </button>
  {/if}
</Toast>
```

### Deleted Items View

```svelte
<!-- /admin/system/deleted-items -->
<script>
  let deletedMemorials = $state([]);
  
  async function loadDeleted() {
    const response = await fetch('/api/admin/memorials?deleted=true');
    deletedMemorials = await response.json();
  }
  
  async function permanentDelete(id) {
    const confirmed = await showConfirmation({
      title: 'Permanent Deletion',
      message: 'This action cannot be undone. The memorial will be permanently deleted.',
      actionLabel: 'Permanently Delete',
      variant: 'danger',
      requireReAuth: true
    });
    
    if (confirmed) {
      await fetch(`/api/admin/memorials/${id}`, { method: 'DELETE' });
      await loadDeleted();
    }
  }
</script>

<AdminPageLayout title="Deleted Items">
  <DataGrid data={deletedMemorials} columns={[
    { field: 'lovedOneName', label: 'Name' },
    { field: 'deletedAt', label: 'Deleted', formatter: formatDate },
    { field: 'deletedBy', label: 'Deleted By', formatter: getUserName },
    { field: 'deletionReason', label: 'Reason' }
  ]}>
    <template slot="actions" let:row>
      <Button size="sm" onclick={() => restoreMemorial(row.id)}>
        Restore
      </Button>
      <Button size="sm" variant="danger" onclick={() => permanentDelete(row.id)}>
        Permanent Delete
      </Button>
    </template>
  </DataGrid>
</AdminPageLayout>
```

---

## 4. Dry-Runs & Simulations

### Dry-Run for Bulk Actions

```typescript
// API endpoint: /api/admin/bulk-actions/preview
export async function POST({ request }) {
  const { action, ids, params } = await request.json();
  
  const preview = {
    action,
    targetCount: ids.length,
    predictions: [],
    warnings: [],
    errors: []
  };
  
  // Simulate each action
  for (const id of ids) {
    try {
      const result = await simulateAction(action, id, params);
      preview.predictions.push(result);
      
      if (result.hasWarnings) {
        preview.warnings.push({ id, warnings: result.warnings });
      }
    } catch (error) {
      preview.errors.push({ id, error: error.message });
    }
  }
  
  return json(preview);
}

async function simulateAction(action: string, id: string, params: any) {
  const memorial = await getMemorial(id);
  
  switch (action) {
    case 'markPaid':
      return {
        before: { isPaid: memorial.isPaid },
        after: { isPaid: true },
        hasWarnings: memorial.isPaid === true,
        warnings: memorial.isPaid ? ['Already marked as paid'] : []
      };
      
    case 'makePublic':
      return {
        before: { isPublic: memorial.isPublic },
        after: { isPublic: true },
        hasWarnings: !memorial.isComplete,
        warnings: !memorial.isComplete ? ['Memorial is incomplete'] : []
      };
  }
}
```

### Preview UI

```svelte
<script>
  let previewData = $state(null);
  let executing = $state(false);
  
  async function showPreview() {
    const response = await fetch('/api/admin/bulk-actions/preview', {
      method: 'POST',
      body: JSON.stringify({ action, ids: selectedIds, params })
    });
    previewData = await response.json();
  }
  
  async function executeAction() {
    executing = true;
    await fetch('/api/admin/bulk-actions/execute', {
      method: 'POST',
      body: JSON.stringify({ action, ids: selectedIds, params })
    });
    executing = false;
  }
</script>

<Modal title="Bulk Action Preview">
  {#if previewData}
    <div class="preview-summary">
      <h3>Impact Summary</h3>
      <p><strong>{previewData.targetCount}</strong> records will be affected</p>
      
      {#if previewData.warnings.length > 0}
        <Alert variant="warning">
          <strong>{previewData.warnings.length} warnings:</strong>
          <ul>
            {#each previewData.warnings as warning}
              <li>{warning.id}: {warning.warnings.join(', ')}</li>
            {/each}
          </ul>
        </Alert>
      {/if}
      
      {#if previewData.errors.length > 0}
        <Alert variant="danger">
          <strong>{previewData.errors.length} errors:</strong>
          <ul>
            {#each previewData.errors as error}
              <li>{error.id}: {error.error}</li>
            {/each}
          </ul>
        </Alert>
      {/if}
    </div>
    
    <div class="actions">
      <Button variant="secondary" onclick={closePreview}>Cancel</Button>
      <Button 
        variant="primary" 
        onclick={executeAction}
        disabled={previewData.errors.length > 0}
        {executing}
      >
        Execute ({previewData.targetCount - previewData.errors.length} items)
      </Button>
    </div>
  {/if}
</Modal>
```

---

## 5. Rate Limiting & Circuit Breakers

### Rate Limiting Implementation

```typescript
// lib/server/rateLimit.ts
import { LRUCache } from 'lru-cache';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (event: RequestEvent) => string;
}

const rateLimitCache = new LRUCache<string, number[]>({
  max: 10000,
  ttl: 60000 // 1 minute
});

export function rateLimit(config: RateLimitConfig) {
  return async function(event: RequestEvent) {
    const key = config.keyGenerator 
      ? config.keyGenerator(event)
      : event.locals.user?.uid || event.getClientAddress();
      
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Get existing timestamps
    let timestamps = rateLimitCache.get(key) || [];
    
    // Filter to current window
    timestamps = timestamps.filter(ts => ts > windowStart);
    
    // Check limit
    if (timestamps.length >= config.maxRequests) {
      const oldestTimestamp = Math.min(...timestamps);
      const retryAfter = Math.ceil((oldestTimestamp + config.windowMs - now) / 1000);
      
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter
      }), {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0'
        }
      });
    }
    
    // Add current timestamp
    timestamps.push(now);
    rateLimitCache.set(key, timestamps);
    
    return null; // Allow request
  };
}
```

### Apply Rate Limits

```typescript
// routes/api/admin/bulk-actions/+server.ts
const bulkActionLimit = rateLimit({
  windowMs: 60000, // 1 minute
  maxRequests: 10, // 10 bulk actions per minute
  keyGenerator: (event) => `bulk_${event.locals.user.uid}`
});

export async function POST({ request, locals }) {
  // Check rate limit
  const limitResponse = await bulkActionLimit({ request, locals });
  if (limitResponse) return limitResponse;
  
  // Process bulk action
  // ...
}
```

### Circuit Breaker for External Services

```typescript
// lib/server/circuitBreaker.ts
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}

// Use with external services
const cloudflareBreaker = new CircuitBreaker(5, 60000);

export async function createCloudflareStream(config) {
  return cloudflareBreaker.execute(async () => {
    // Call Cloudflare API
  });
}
```

---

*Next: See ADMIN_REFACTOR_4_WORKFLOWS.md for approval workflows and task management*
