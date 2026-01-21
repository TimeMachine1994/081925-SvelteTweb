# 1-21-26 Missing Functionality Implementation Plan

## Overview

**Date**: January 21, 2026  
**Status**: 🔵 Planning  
**Priority**: High  

### Problem Statement
Clients who log in without an assigned case cannot message the firm or submit documents. Currently, they see a "No Active Cases" message with only a "Contact Us" link. This creates friction for new client onboarding.

### Goal
Enable clients without cases to:
1. Send messages directly to the firm
2. Attach documents to those messages
3. Have attorneys assign those messages/documents to a case
4. Auto-populate the case for the client once assigned

---

## Current State Analysis

### What Exists ✅
| Component | Status | Notes |
|-----------|--------|-------|
| `messagesStore.sendMessage()` | ✅ | Supports `caseId: null` |
| `messagesStore.sendMessageWithAttachment()` | ✅ | Supports `caseId: null` |
| `GET /api/messages?uncategorized=true` | ✅ | Fetches messages without case |
| `ChatSlider.svelte` | ✅ | Reusable chat component |
| `AttachmentUploader.svelte` | ✅ | Reusable file upload |
| `MessageBubble.svelte` | ✅ | Reusable message display |

### What's Missing ❌
| Component | Gap | Impact |
|-----------|-----|--------|
| Client "no case" messaging UI | No UI to message firm when `cases.length === 0` | Clients can't reach firm |
| Lawyer uncategorized inbox | No view for messages without case assignment | Lawyers miss new client inquiries |
| Case assignment API | No endpoint to assign message/docs to case | Can't link client to case |
| Client auto-linking | No mechanism to add client to case when assigned | Client won't see their case |

---

## Architecture

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  CLIENT         │     │  SERVER          │     │  LAWYER         │
│  (no case)      │     │                  │     │                 │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ 1. Send message │────▶│ Store message    │────▶│ 4. See in inbox │
│    + attachment │     │ (caseId: null)   │     │    (uncateg.)   │
│                 │     │                  │     │                 │
│                 │     │ Store document   │     │ 5. Assign to    │
│                 │     │ (caseId: null)   │     │    case         │
│                 │     │                  │     │                 │
│ 7. Case appears │◀────│ Update clientId  │◀────│ 6. Link client  │
│    on dashboard │     │ on case          │     │    to case      │
│                 │     │ Update caseId    │     │                 │
│                 │     │ on msg + doc     │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## Implementation Phases

### Phase 1: Client Messaging Without Case
**Priority**: Critical  
**Estimated Effort**: 2-3 hours

#### 1.1 Update Client Dashboard UI
**File**: `src/routes/dashboard/client/+page.svelte`

Replace the "No Active Cases" empty state with a messaging interface:
- Show welcome message explaining they can message the firm
- Include `ChatSlider` or inline chat for sending messages
- Support file attachments

**Changes**:
```svelte
{:else}
  <!-- NEW: No-case messaging interface -->
  <div class="bg-background border border-border rounded-lg p-8">
    <h3>Welcome to King Law Firm</h3>
    <p>You don't have any active cases yet. Send us a message to get started.</p>
    
    <!-- Inline message composer with attachment support -->
    <MessageComposer onSend={handleSendToFirm} />
  </div>
{/if}
```

#### 1.2 Create MessageComposer Component
**File**: `src/lib/components/MessageComposer.svelte` (NEW)

A reusable component for composing messages with attachments:
- Text area for message content
- Attachment button with file picker
- Send button
- File preview before sending
- Loading states

---

### Phase 2: Lawyer Uncategorized Inbox
**Priority**: Critical  
**Estimated Effort**: 2-3 hours

#### 2.1 Add Uncategorized Messages Section
**File**: `src/routes/dashboard/lawyer/+page.svelte`

Add a new section showing messages not assigned to any case:
- Display count badge for uncategorized messages
- List messages with sender info, timestamp, attachments
- "Assign to Case" action button per message

#### 2.2 Create InboxMessage Component
**File**: `src/lib/components/InboxMessage.svelte` (NEW)

Display uncategorized message with:
- Sender name and avatar
- Message content preview
- Attachment indicator
- Timestamp
- "Assign to Case" button

---

### Phase 3: Case Assignment Flow
**Priority**: Critical  
**Estimated Effort**: 3-4 hours

#### 3.1 Create Case Assignment API
**File**: `src/routes/api/messages/assign/+server.ts` (NEW)

```typescript
POST /api/messages/assign
Body: {
  messageId: string,
  caseId: string,        // existing case OR
  createCase?: {         // create new case
    title: string,
    description?: string
  }
}
```

**Logic**:
1. Validate lawyer has access to case
2. Update message's `caseId`
3. If message has attachment, update document's `caseId`
4. Set case's `clientId` to message sender
5. Return updated message + case

#### 3.2 Create AssignToCaseModal Component
**File**: `src/lib/components/AssignToCaseModal.svelte` (NEW)

Modal dialog for case assignment:
- Dropdown to select existing case (lawyer's cases)
- OR form to create new case (title, description)
- Preview of what will be assigned (message + attachments)
- Confirm/Cancel buttons

#### 3.3 Update Messages Store
**File**: `src/lib/stores/messages.svelte.ts`

Add method:
```typescript
async assignToCase(messageId: string, caseId: string): Promise<void>
async assignToNewCase(messageId: string, caseTitle: string): Promise<void>
```

---

### Phase 4: Client Auto-Population
**Priority**: High  
**Estimated Effort**: 1 hour

#### 4.1 Update Case Assignment to Link Client
When a message is assigned to a case, the API should:
1. Get sender's user ID from message
2. Set `cases.clientId = senderId`
3. Client's next dashboard load will show the case

**Already Handled By**:
- Phase 3.1 API updates `clientId`
- Client dashboard already queries `cases.clientId = userId`
- No additional work needed

---

## Detailed Task Breakdown (WBS)

### Phase 1: Client Messaging
| ID | Task | Est. Time | Dependencies |
|----|------|-----------|--------------|
| 1.1 | Create `MessageComposer.svelte` component | 1h | - |
| 1.2 | Update client dashboard empty state | 30m | 1.1 |
| 1.3 | Wire up send to firm functionality | 30m | 1.2 |
| 1.4 | Test client → firm messaging | 30m | 1.3 |

### Phase 2: Lawyer Inbox
| ID | Task | Est. Time | Dependencies |
|----|------|-----------|--------------|
| 2.1 | Add server load for uncategorized messages | 30m | - |
| 2.2 | Create `InboxMessage.svelte` component | 1h | - |
| 2.3 | Add uncategorized section to lawyer dashboard | 1h | 2.1, 2.2 |
| 2.4 | Test lawyer sees uncategorized messages | 30m | 2.3 |

### Phase 3: Case Assignment
| ID | Task | Est. Time | Dependencies |
|----|------|-----------|--------------|
| 3.1 | Create `POST /api/messages/assign` endpoint | 1.5h | - |
| 3.2 | Create `AssignToCaseModal.svelte` | 1.5h | 3.1 |
| 3.3 | Add `assignToCase` method to store | 30m | 3.1 |
| 3.4 | Integrate modal into `InboxMessage` | 30m | 3.2, 3.3 |
| 3.5 | Test full assignment flow | 30m | 3.4 |

### Phase 4: Client Auto-Population
| ID | Task | Est. Time | Dependencies |
|----|------|-----------|--------------|
| 4.1 | Verify client sees case after assignment | 30m | 3.5 |
| 4.2 | Verify messages appear in case | 30m | 4.1 |
| 4.3 | End-to-end testing | 30m | 4.2 |

---

## API Specifications

### New Endpoint: Assign Message to Case

```
POST /api/messages/assign
```

**Request Body**:
```json
{
  "messageId": "msg_abc123",
  "caseId": "case_xyz789",
  "createNewCase": false
}
```

OR for new case:
```json
{
  "messageId": "msg_abc123",
  "createNewCase": true,
  "caseTitle": "Johnson Estate Matter",
  "caseDescription": "Initial inquiry regarding estate planning"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": {
    "id": "msg_abc123",
    "caseId": "case_xyz789",
    "content": "...",
    "attachmentDocumentId": "doc_456"
  },
  "case": {
    "id": "case_xyz789",
    "title": "Johnson Estate Matter",
    "clientId": "user_sender123"
  }
}
```

**Error Responses**:
- `400` - Invalid request (missing fields)
- `401` - Unauthorized
- `403` - Not a lawyer / no access to case
- `404` - Message or case not found

---

## Database Changes

**No schema changes required.**

All necessary columns already exist:
- `messages.caseId` - nullable, updated on assignment
- `documents.caseId` - nullable, updated on assignment
- `cases.clientId` - updated to link client

---

## UI Mockups

### Client Dashboard (No Cases)
```
┌────────────────────────────────────────────────────┐
│  Client Dashboard                                  │
├────────────────────────────────────────────────────┤
│                                                    │
│  📁 0 Open Cases   💰 $0.00   💬 0   📄 0         │
│                                                    │
├────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐  │
│  │  👋 Welcome to King Law Firm                 │  │
│  │                                              │  │
│  │  You don't have any active cases yet.        │  │
│  │  Send us a message to get started.           │  │
│  │                                              │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │ Type your message here...              │  │  │
│  │  │                                        │  │  │
│  │  │                                        │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  │                                              │  │
│  │  📎 Attach File          [ Send Message ]    │  │
│  │                                              │  │
│  │  ─────────────────────────────────────────   │  │
│  │                                              │  │
│  │  Your Messages:                              │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │ You (Jan 21, 10:30 AM)                 │  │  │
│  │  │ Hi, I need help with...                │  │  │
│  │  │ 📎 contract.pdf                        │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### Lawyer Dashboard (Uncategorized Inbox)
```
┌────────────────────────────────────────────────────┐
│  Lawyer Dashboard                                  │
├────────────────────────────────────────────────────┤
│                                                    │
│  📊 Stats cards...                                 │
│                                                    │
├────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐  │
│  │  📬 New Client Inquiries (3)                 │  │
│  │  ─────────────────────────────────────────   │  │
│  │                                              │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │ 👤 John Doe  •  Today 10:30 AM         │  │  │
│  │  │ "Hi, I need help with a contract..."   │  │  │
│  │  │ 📎 1 attachment                        │  │  │
│  │  │                     [ Assign to Case ] │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  │                                              │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │ 👤 Jane Smith  •  Yesterday 4:15 PM    │  │  │
│  │  │ "I have a question about..."           │  │  │
│  │  │                     [ Assign to Case ] │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  📁 Your Cases                                     │
│  ...                                               │
└────────────────────────────────────────────────────┘
```

### Assign to Case Modal
```
┌─────────────────────────────────────────┐
│  Assign to Case                    [X]  │
├─────────────────────────────────────────┤
│                                         │
│  Message from: John Doe                 │
│  "Hi, I need help with a contract..."   │
│  📎 contract.pdf (234 KB)               │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ○ Assign to existing case:             │
│    ┌─────────────────────────────────┐  │
│    │ Select a case...            ▼  │  │
│    └─────────────────────────────────┘  │
│                                         │
│  ● Create new case:                     │
│    Title: [____________________]        │
│    Description: [______________]        │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [ Cancel ]              [ Assign ]     │
│                                         │
└─────────────────────────────────────────┘
```

---

## Testing Plan

### Unit Tests
- [ ] `MessageComposer` sends message without case
- [ ] `MessageComposer` sends message with attachment
- [ ] `AssignToCaseModal` validates required fields
- [ ] Assignment API updates message, document, and case

### Integration Tests
- [ ] Client sends message → appears in lawyer inbox
- [ ] Lawyer assigns message → client sees case
- [ ] Document attachment follows message to case

### E2E Tests
- [ ] Full flow: client signup → message → assignment → case visible

---

## Rollout Plan

1. **Development** - Build all phases
2. **Local Testing** - Test with dev database
3. **Staging Deploy** - Deploy to staging environment
4. **QA Testing** - Full regression + new feature testing
5. **Production Deploy** - Deploy to production

---

## Success Metrics

- [ ] Client without case can send message + attachment
- [ ] Lawyer sees uncategorized messages on dashboard
- [ ] Lawyer can assign message to new or existing case
- [ ] Client sees case after assignment
- [ ] All previous messages/docs appear in case
- [ ] Build passes with no errors
- [ ] No breaking changes to existing features

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Multiple uncategorized messages from same client | Lawyer assigns to different cases | Batch assignment UI / warning |
| Client sends spam messages | Inbox flooded | Rate limiting / spam detection |
| Large file uploads timeout | Bad UX | Progress indicator, chunked upload |

---

## Dependencies

- Existing chat infrastructure (Phase 1 complete ✅)
- Lawyer cases API (exists ✅)
- Document upload API (exists ✅)
- Drizzle ORM (exists ✅)

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1 | 2-3 hours | None |
| Phase 2 | 2-3 hours | None (parallel with P1) |
| Phase 3 | 3-4 hours | P1 + P2 |
| Phase 4 | 1 hour | P3 |
| Testing | 1-2 hours | All phases |
| **Total** | **9-13 hours** | |

---

## Appendix: Files to Create/Modify

### New Files
1. `src/lib/components/MessageComposer.svelte`
2. `src/lib/components/InboxMessage.svelte`
3. `src/lib/components/AssignToCaseModal.svelte`
4. `src/routes/api/messages/assign/+server.ts`

### Modified Files
1. `src/routes/dashboard/client/+page.svelte` - Add no-case messaging UI
2. `src/routes/dashboard/lawyer/+page.svelte` - Add uncategorized inbox section
3. `src/routes/dashboard/lawyer/+page.server.ts` - Load uncategorized messages
4. `src/lib/stores/messages.svelte.ts` - Add assignToCase methods

---

**Document Status**: ✅ Complete  
**Ready for Implementation**: Yes
