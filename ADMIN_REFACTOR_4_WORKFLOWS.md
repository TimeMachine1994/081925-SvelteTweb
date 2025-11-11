# Admin Dashboard Refactor - Part 4: Workflow & Approvals

## Overview

This document covers state machines, multi-step approvals, task inboxes, SLA tracking, and embedded runbooks for TributeStream admin workflows.

---

## 1. Explicit State Machines

### State Machine Definitions

```typescript
// lib/admin/stateMachines.ts

interface StateMachine {
  states: Record<string, State>;
  transitions: Transition[];
  initialState: string;
}

interface State {
  id: string;
  label: string;
  description: string;
  color: string;
  icon: string;
  allowedActions: string[];
}

interface Transition {
  from: string;
  to: string;
  event: string;
  guard?: (context: any) => boolean;
  action?: (context: any) => Promise<void>;
}

// Memorial State Machine
export const memorialStateMachine: StateMachine = {
  initialState: 'draft',
  states: {
    draft: {
      id: 'draft',
      label: 'Draft',
      description: 'Memorial is being created',
      color: 'gray',
      icon: '📝',
      allowedActions: ['edit', 'submit_for_review']
    },
    pending_review: {
      id: 'pending_review',
      label: 'Pending Review',
      description: 'Awaiting admin review',
      color: 'yellow',
      icon: '⏳',
      allowedActions: ['approve', 'reject', 'request_changes']
    },
    approved: {
      id: 'approved',
      label: 'Approved',
      description: 'Memorial approved, awaiting payment',
      color: 'blue',
      icon: '✅',
      allowedActions: ['mark_paid', 'edit']
    },
    live: {
      id: 'live',
      label: 'Live',
      description: 'Memorial is live and public',
      color: 'green',
      icon: '🌐',
      allowedActions: ['edit', 'unpublish', 'archive']
    },
    archived: {
      id: 'archived',
      label: 'Archived',
      description: 'Memorial archived',
      color: 'gray',
      icon: '📦',
      allowedActions: ['restore']
    },
    rejected: {
      id: 'rejected',
      label: 'Rejected',
      description: 'Memorial rejected',
      color: 'red',
      icon: '❌',
      allowedActions: ['edit', 'resubmit']
    }
  },
  transitions: [
    { from: 'draft', to: 'pending_review', event: 'submit_for_review' },
    { from: 'pending_review', to: 'approved', event: 'approve' },
    { from: 'pending_review', to: 'rejected', event: 'reject' },
    { from: 'pending_review', to: 'draft', event: 'request_changes' },
    { from: 'approved', to: 'live', event: 'mark_paid', 
      guard: (ctx) => ctx.isPaid === true },
    { from: 'live', to: 'archived', event: 'archive' },
    { from: 'archived', to: 'live', event: 'restore' },
    { from: 'rejected', to: 'pending_review', event: 'resubmit' }
  ]
};

// Schedule Edit Request State Machine
export const scheduleEditStateMachine: StateMachine = {
  initialState: 'pending',
  states: {
    pending: {
      id: 'pending',
      label: 'Pending',
      description: 'Awaiting admin review',
      color: 'yellow',
      icon: '⏳',
      allowedActions: ['approve', 'deny', 'request_info']
    },
    approved: {
      id: 'approved',
      label: 'Approved',
      description: 'Request approved, changes need to be applied',
      color: 'green',
      icon: '✅',
      allowedActions: ['apply_changes', 'revert']
    },
    completed: {
      id: 'completed',
      label: 'Completed',
      description: 'Changes have been applied',
      color: 'blue',
      icon: '🎉',
      allowedActions: []
    },
    denied: {
      id: 'denied',
      label: 'Denied',
      description: 'Request denied',
      color: 'red',
      icon: '❌',
      allowedActions: []
    }
  },
  transitions: [
    { from: 'pending', to: 'approved', event: 'approve' },
    { from: 'pending', to: 'denied', event: 'deny' },
    { from: 'approved', to: 'completed', event: 'apply_changes' },
    { from: 'approved', to: 'pending', event: 'revert' }
  ]
};
```

### State Transition Handler

```typescript
// lib/admin/stateManager.ts
export async function transitionState(
  stateMachine: StateMachine,
  currentState: string,
  event: string,
  context: any
): Promise<{ success: boolean; newState?: string; error?: string }> {
  
  // Find valid transition
  const transition = stateMachine.transitions.find(
    t => t.from === currentState && t.event === event
  );
  
  if (!transition) {
    return {
      success: false,
      error: `Invalid transition: ${event} from ${currentState}`
    };
  }
  
  // Check guard
  if (transition.guard && !transition.guard(context)) {
    return {
      success: false,
      error: 'Transition guard failed'
    };
  }
  
  // Execute action
  if (transition.action) {
    try {
      await transition.action(context);
    } catch (error) {
      return {
        success: false,
        error: `Action failed: ${error.message}`
      };
    }
  }
  
  return {
    success: true,
    newState: transition.to
  };
}
```

### State Visualizer Component

```svelte
<!-- StateVisualizer.svelte -->
<script lang="ts">
  let { stateMachine, currentState, onTransition } = $props();
  
  $: state = stateMachine.states[currentState];
  $: availableTransitions = stateMachine.transitions.filter(
    t => t.from === currentState
  );
</script>

<div class="state-visualizer">
  <!-- Current state badge -->
  <div class="current-state" style="--color: {state.color}">
    <span class="icon">{state.icon}</span>
    <div class="details">
      <h3>{state.label}</h3>
      <p>{state.description}</p>
    </div>
  </div>
  
  <!-- State diagram -->
  <div class="state-diagram">
    {#each Object.values(stateMachine.states) as s}
      <div 
        class="state-node"
        class:current={s.id === currentState}
        style="--color: {s.color}"
      >
        {s.icon} {s.label}
      </div>
    {/each}
    
    {#each stateMachine.transitions as transition}
      <div class="transition-arrow" data-from={transition.from} data-to={transition.to}>
        {transition.event}
      </div>
    {/each}
  </div>
  
  <!-- Available actions -->
  {#if availableTransitions.length > 0}
    <div class="available-actions">
      <h4>Available Actions:</h4>
      {#each availableTransitions as transition}
        <Button onclick={() => onTransition(transition.event)}>
          {transition.event.replace(/_/g, ' ')}
        </Button>
      {/each}
    </div>
  {/if}
</div>
```

---

## 2. Multi-Step Approvals

### Approval Workflow Definition

```typescript
interface ApprovalWorkflow {
  id: string;
  name: string;
  steps: ApprovalStep[];
  sla?: {
    totalHours: number;
    perStepHours?: number;
    escalationRules?: EscalationRule[];
  };
}

interface ApprovalStep {
  id: string;
  label: string;
  assignedTo: 'role' | 'user' | 'team';
  assignedId: string;
  requireAll?: boolean; // Require all assignees to approve
  minApprovals?: number; // Minimum number of approvals needed
}

interface EscalationRule {
  afterHours: number;
  escalateTo: string;
  notificationTemplate: string;
}

// Example: Schedule edit request workflow
const scheduleEditWorkflow: ApprovalWorkflow = {
  id: 'schedule_edit_approval',
  name: 'Schedule Edit Request Approval',
  steps: [
    {
      id: 'customer_support',
      label: 'Customer Support Review',
      assignedTo: 'role',
      assignedId: 'customer_support',
      minApprovals: 1
    },
    {
      id: 'content_admin',
      label: 'Content Admin Approval',
      assignedTo: 'role',
      assignedId: 'content_admin',
      minApprovals: 1
    }
  ],
  sla: {
    totalHours: 48,
    perStepHours: 24,
    escalationRules: [
      {
        afterHours: 24,
        escalateTo: 'super_admin',
        notificationTemplate: 'approval_overdue'
      }
    ]
  }
};
```

### Approval Tracking

```typescript
// Firestore: approval_tracking collection
interface ApprovalTracking {
  workflowId: string;
  resourceType: string;
  resourceId: string;
  currentStep: number;
  status: 'pending' | 'approved' | 'rejected';
  steps: Array<{
    stepId: string;
    status: 'pending' | 'approved' | 'rejected' | 'skipped';
    assignedTo: string[];
    approvals: Array<{
      userId: string;
      decision: 'approve' | 'reject';
      comment?: string;
      timestamp: Date;
    }>;
    startedAt: Date;
    completedAt?: Date;
  }>;
  createdAt: Date;
  completedAt?: Date;
  slaDeadline?: Date;
}

async function startApprovalWorkflow(
  workflowId: string,
  resourceType: string,
  resourceId: string
) {
  const workflow = WORKFLOWS[workflowId];
  
  const tracking: ApprovalTracking = {
    workflowId,
    resourceType,
    resourceId,
    currentStep: 0,
    status: 'pending',
    steps: workflow.steps.map(step => ({
      stepId: step.id,
      status: 'pending',
      assignedTo: await resolveAssignees(step),
      approvals: [],
      startedAt: new Date()
    })),
    createdAt: new Date(),
    slaDeadline: workflow.sla 
      ? new Date(Date.now() + workflow.sla.totalHours * 60 * 60 * 1000)
      : undefined
  };
  
  await adminDb.collection('approval_tracking').add(tracking);
  
  // Notify assignees
  await notifyAssignees(tracking.steps[0].assignedTo, resourceType, resourceId);
  
  return tracking;
}
```

### Approval UI

```svelte
<!-- ApprovalPanel.svelte -->
<script lang="ts">
  let { tracking, workflow } = $props();
  
  async function submitApproval(decision: 'approve' | 'reject', comment?: string) {
    await fetch('/api/admin/approvals/submit', {
      method: 'POST',
      body: JSON.stringify({
        trackingId: tracking.id,
        decision,
        comment
      })
    });
  }
</script>

<div class="approval-panel">
  <!-- Progress indicator -->
  <div class="approval-progress">
    {#each workflow.steps as step, index}
      <div 
        class="step"
        class:current={index === tracking.currentStep}
        class:completed={tracking.steps[index].status === 'approved'}
        class:rejected={tracking.steps[index].status === 'rejected'}
      >
        <div class="step-indicator">
          {#if tracking.steps[index].status === 'approved'}
            ✅
          {:else if tracking.steps[index].status === 'rejected'}
            ❌
          {:else if index === tracking.currentStep}
            ⏳
          {:else}
            ⭕
          {/if}
        </div>
        <div class="step-label">{step.label}</div>
      </div>
      
      {#if index < workflow.steps.length - 1}
        <div class="step-connector" />
      {/if}
    {/each}
  </div>
  
  <!-- Current step details -->
  {#if tracking.currentStep < workflow.steps.length}
    {@const currentStepData = tracking.steps[tracking.currentStep]}
    
    <div class="current-step-details">
      <h3>{workflow.steps[tracking.currentStep].label}</h3>
      
      <!-- Assignees -->
      <div class="assignees">
        <h4>Assigned to:</h4>
        {#each currentStepData.assignedTo as assignee}
          <UserBadge userId={assignee} />
        {/each}
      </div>
      
      <!-- Approvals received -->
      {#if currentStepData.approvals.length > 0}
        <div class="approvals-received">
          <h4>Approvals ({currentStepData.approvals.length}):</h4>
          {#each currentStepData.approvals as approval}
            <div class="approval-entry">
              <UserBadge userId={approval.userId} />
              <span class="decision" class:approve={approval.decision === 'approve'}>
                {approval.decision === 'approve' ? '✅ Approved' : '❌ Rejected'}
              </span>
              {#if approval.comment}
                <p class="comment">{approval.comment}</p>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
      
      <!-- Action buttons (if user can approve) -->
      {#if canUserApprove(currentStepData)}
        <div class="approval-actions">
          <textarea 
            placeholder="Optional comment..."
            bind:value={approvalComment}
          />
          <div class="buttons">
            <Button 
              variant="danger"
              onclick={() => submitApproval('reject', approvalComment)}
            >
              Reject
            </Button>
            <Button 
              variant="success"
              onclick={() => submitApproval('approve', approvalComment)}
            >
              Approve
            </Button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
  
  <!-- SLA warning -->
  {#if tracking.slaDeadline}
    {@const hoursRemaining = (tracking.slaDeadline.getTime() - Date.now()) / (1000 * 60 * 60)}
    {#if hoursRemaining < 4}
      <Alert variant="warning">
        ⚠️ SLA deadline in {Math.round(hoursRemaining)} hours
      </Alert>
    {/if}
  {/if}
</div>
```

---

## 3. Task Inbox

### Task Queue System

```typescript
// lib/admin/taskQueue.ts
interface AdminTask {
  id: string;
  type: 'approval' | 'review' | 'investigation' | 'support_ticket';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  resourceType: string;
  resourceId: string;
  assignedTo: string[];
  createdBy: string;
  createdAt: Date;
  dueAt?: Date;
  completedAt?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  metadata?: Record<string, any>;
}

// Auto-create tasks from events
export async function createTaskFromEvent(event: string, data: any) {
  switch (event) {
    case 'schedule_edit_requested':
      await adminDb.collection('admin_tasks').add({
        type: 'approval',
        priority: 'medium',
        title: `Schedule edit request for ${data.memorialName}`,
        description: data.reason,
        resourceType: 'schedule_edit_request',
        resourceId: data.requestId,
        assignedTo: await getUsersByRole('content_admin'),
        createdBy: data.requestedBy,
        createdAt: new Date(),
        dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        status: 'pending'
      });
      break;
      
    case 'payment_dispute':
      await adminDb.collection('admin_tasks').add({
        type: 'investigation',
        priority: 'high',
        title: `Payment dispute for memorial #${data.memorialId}`,
        description: data.disputeReason,
        resourceType: 'memorial',
        resourceId: data.memorialId,
        assignedTo: await getUsersByRole('financial_admin'),
        createdBy: 'system',
        createdAt: new Date(),
        status: 'pending'
      });
      break;
  }
}
```

### Task Inbox UI

```svelte
<!-- TaskInbox.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { adminUser } from '$lib/stores/adminUser';
  
  let tasks = $state([]);
  let filter = $state('pending');
  let sortBy = $state('priority');
  
  onMount(async () => {
    await loadTasks();
  });
  
  async function loadTasks() {
    const response = await fetch(`/api/admin/tasks?filter=${filter}&sort=${sortBy}`);
    tasks = await response.json();
  }
  
  async function claimTask(taskId: string) {
    await fetch(`/api/admin/tasks/${taskId}/claim`, { method: 'POST' });
    await loadTasks();
  }
  
  async function completeTask(taskId: string) {
    await fetch(`/api/admin/tasks/${taskId}/complete`, { method: 'POST' });
    await loadTasks();
  }
  
  async function bulkTriage(taskIds: string[], action: 'claim' | 'complete' | 'reassign') {
    await fetch('/api/admin/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({ taskIds, action })
    });
    await loadTasks();
  }
</script>

<div class="task-inbox">
  <!-- Header with counts -->
  <div class="inbox-header">
    <h2>Task Inbox</h2>
    <div class="task-counts">
      <Badge variant="yellow">{tasks.filter(t => t.status === 'pending').length} Pending</Badge>
      <Badge variant="blue">{tasks.filter(t => t.status === 'in_progress').length} In Progress</Badge>
      <Badge variant="red">{tasks.filter(t => t.priority === 'urgent').length} Urgent</Badge>
    </div>
  </div>
  
  <!-- Filters -->
  <div class="inbox-filters">
    <FilterTabs>
      <Tab active={filter === 'pending'} onclick={() => filter = 'pending'}>
        Pending
      </Tab>
      <Tab active={filter === 'assigned_to_me'} onclick={() => filter = 'assigned_to_me'}>
        Assigned to Me
      </Tab>
      <Tab active={filter === 'in_progress'} onclick={() => filter = 'in_progress'}>
        In Progress
      </Tab>
      <Tab active={filter === 'completed'} onclick={() => filter = 'completed'}>
        Completed
      </Tab>
    </FilterTabs>
    
    <select bind:value={sortBy} onchange={loadTasks}>
      <option value="priority">Priority</option>
      <option value="dueAt">Due Date</option>
      <option value="createdAt">Created Date</option>
    </select>
  </div>
  
  <!-- Bulk actions -->
  {#if selectedTasks.length > 0}
    <BulkActionBar>
      <span>{selectedTasks.length} selected</span>
      <Button onclick={() => bulkTriage(selectedTasks, 'claim')}>Claim All</Button>
      <Button onclick={() => bulkTriage(selectedTasks, 'complete')}>Complete All</Button>
    </BulkActionBar>
  {/if}
  
  <!-- Task list -->
  <div class="task-list">
    {#each tasks as task}
      <div 
        class="task-item"
        class:urgent={task.priority === 'urgent'}
        class:overdue={task.dueAt && task.dueAt < new Date()}
      >
        <input 
          type="checkbox" 
          checked={selectedTasks.includes(task.id)}
          onchange={() => toggleTask(task.id)}
        />
        
        <div class="task-priority">
          {#if task.priority === 'urgent'}
            🔴
          {:else if task.priority === 'high'}
            🟠
          {:else if task.priority === 'medium'}
            🟡
          {:else}
            ⚪
          {/if}
        </div>
        
        <div class="task-content">
          <h3>{task.title}</h3>
          <p>{task.description}</p>
          <div class="task-meta">
            <span class="type-badge">{task.type}</span>
            {#if task.dueAt}
              <span class="due-date">Due: {formatRelativeTime(task.dueAt)}</span>
            {/if}
            {#if task.assignedTo.length > 0}
              <span class="assignees">
                {task.assignedTo.length} assigned
              </span>
            {/if}
          </div>
        </div>
        
        <div class="task-actions">
          {#if task.status === 'pending'}
            <Button size="sm" onclick={() => claimTask(task.id)}>
              Claim
            </Button>
          {:else if task.status === 'in_progress'}
            <Button size="sm" variant="success" onclick={() => completeTask(task.id)}>
              Complete
            </Button>
          {/if}
          <Button size="sm" variant="secondary" onclick={() => openTask(task)}>
            View
          </Button>
        </div>
      </div>
    {/each}
  </div>
</div>
```

---

## 4. Checklists & Embedded Runbooks

### Checklist Definition

```typescript
interface Checklist {
  id: string;
  title: string;
  context: 'memorial_review' | 'stream_troubleshooting' | 'payment_investigation';
  items: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
  helpText?: string;
  runbookLink?: string;
}

// Example: Memorial review checklist
const memorialReviewChecklist: Checklist = {
  id: 'memorial_review',
  title: 'Memorial Review Checklist',
  context: 'memorial_review',
  items: [
    {
      id: 'verify_name',
      text: 'Verify loved one\'s name is spelled correctly',
      required: true
    },
    {
      id: 'check_dates',
      text: 'Confirm birth and death dates are accurate',
      required: true,
      helpText: 'Cross-reference with service schedule if available'
    },
    {
      id: 'review_content',
      text: 'Review memorial content for appropriateness',
      required: true,
      runbookLink: '/admin/runbooks/content-moderation'
    },
    {
      id: 'verify_location',
      text: 'Verify service location details',
      required: false,
      helpText: 'Check address format and geocoding'
    },
    {
      id: 'check_images',
      text: 'Review uploaded images for quality and appropriateness',
      required: true
    },
    {
      id: 'verify_payment',
      text: 'Confirm payment status matches records',
      required: true,
      runbookLink: '/admin/runbooks/payment-verification'
    }
  ]
};
```

### Checklist Component

```svelte
<!-- EmbeddedChecklist.svelte -->
<script lang="ts">
  let { checklist, resourceId, onComplete } = $props();
  
  let progress = $state({});
  let notes = $state({});
  
  $: requiredItems = checklist.items.filter(i => i.required);
  $: completedRequired = requiredItems.filter(i => progress[i.id]).length;
  $: canComplete = completedRequired === requiredItems.length;
  
  async function saveProgress() {
    await fetch(`/api/admin/checklists/progress`, {
      method: 'POST',
      body: JSON.stringify({
        checklistId: checklist.id,
        resourceId,
        progress,
        notes
      })
    });
  }
  
  function toggleItem(itemId: string) {
    progress[itemId] = !progress[itemId];
    saveProgress();
  }
</script>

<div class="embedded-checklist">
  <div class="checklist-header">
    <h3>{checklist.title}</h3>
    <ProgressBar 
      value={completedRequired} 
      max={requiredItems.length}
      label="{completedRequired}/{requiredItems.length} required items"
    />
  </div>
  
  <div class="checklist-items">
    {#each checklist.items as item}
      <div class="checklist-item" class:required={item.required}>
        <label>
          <input 
            type="checkbox" 
            checked={progress[item.id]}
            onchange={() => toggleItem(item.id)}
          />
          <span class="item-text">
            {item.text}
            {#if item.required}
              <span class="required-badge">Required</span>
            {/if}
          </span>
        </label>
        
        {#if item.helpText}
          <p class="help-text">{item.helpText}</p>
        {/if}
        
        {#if item.runbookLink}
          <a href={item.runbookLink} target="_blank" class="runbook-link">
            📖 View Runbook
          </a>
        {/if}
        
        {#if progress[item.id]}
          <textarea 
            placeholder="Notes (optional)..."
            bind:value={notes[item.id]}
            onblur={saveProgress}
          />
        {/if}
      </div>
    {/each}
  </div>
  
  <div class="checklist-footer">
    <Button 
      variant="primary"
      disabled={!canComplete}
      onclick={onComplete}
    >
      Complete Review
    </Button>
  </div>
</div>
```

### Runbook System

```svelte
<!-- /admin/runbooks/[slug]/+page.svelte -->
<script>
  let { data } = $props();
  let runbook = data.runbook;
</script>

<AdminPageLayout title={runbook.title}>
  <div class="runbook-content">
    <!-- Runbook metadata -->
    <div class="runbook-meta">
      <Badge>{runbook.category}</Badge>
      <span>Last updated: {formatDate(runbook.updatedAt)}</span>
      <span>By: {runbook.author}</span>
    </div>
    
    <!-- Table of contents -->
    <nav class="runbook-toc">
      <h3>Contents</h3>
      <ul>
        {#each runbook.sections as section}
          <li><a href="#{section.id}">{section.title}</a></li>
        {/each}
      </ul>
    </nav>
    
    <!-- Runbook sections -->
    {#each runbook.sections as section}
      <section id={section.id}>
        <h2>{section.title}</h2>
        {@html section.content}
        
        {#if section.codeSnippets}
          {#each section.codeSnippets as snippet}
            <CodeBlock language={snippet.language} code={snippet.code} />
          {/each}
        {/if}
        
        {#if section.checklist}
          <EmbeddedChecklist checklist={section.checklist} />
        {/if}
      </section>
    {/each}
  </div>
</AdminPageLayout>
```

---

## 5. Implementation Summary

### Phase 1: State Machines & Workflows (Week 1)
- [ ] Define state machines for key resources
- [ ] Implement state transition handler
- [ ] Create state visualizer component
- [ ] Add state tracking to memorials and edit requests

### Phase 2: Approval System (Week 2)
- [ ] Build multi-step approval workflow engine
- [ ] Create `approval_tracking` Firestore collection
- [ ] Implement SLA tracking and escalation
- [ ] Build approval panel UI

### Phase 3: Task Queue (Week 3)
- [ ] Create `admin_tasks` Firestore collection
- [ ] Implement task auto-creation from events
- [ ] Build task inbox UI with filtering
- [ ] Add bulk triage actions

### Phase 4: Checklists & Runbooks (Week 4)
- [ ] Define checklists for common workflows
- [ ] Build embedded checklist component
- [ ] Create runbook system and pages
- [ ] Integrate checklists into approval flows

---

*Complete! All 4 admin refactor documents created. Summary available in ADMIN_REFACTOR_INDEX.md*
