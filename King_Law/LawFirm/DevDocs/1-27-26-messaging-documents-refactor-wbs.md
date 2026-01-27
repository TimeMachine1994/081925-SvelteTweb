# Messaging & Documents Refactor WBS

**Date:** January 27, 2026  
**Status:** 🔵 Ready for Implementation  
**Priority:** High

---

## Overview

This document outlines the Work Breakdown Structure for four related changes to the client/lawyer messaging and documents system.

### Changes Requested

| # | Issue | Description |
|---|-------|-------------|
| 1 | Messages not showing | New submitted messages don't populate in the messages panel |
| 2 | Remove ChatSlider | The slide-out chat panel on the right is not necessary - remove completely |
| 3 | Documents not showing all | "My Documents" should display ALL documents |
| 4 | Attachments dual-display | Attachments should appear in both chat AND documents panel |

---

## Current State Analysis

### Messaging System

| Component | Location | Purpose |
|-----------|----------|---------|
| `ChatSlider.svelte` | `src/lib/components/` | Slide-out chat panel (TO BE REMOVED) |
| `MessageComposer.svelte` | `src/lib/components/` | Inline message composer with history |
| `MessageBubble.svelte` | `src/lib/components/` | Individual message display |
| `AttachmentUploader.svelte` | `src/lib/components/` | File upload component |
| `messagesStore` | `src/lib/stores/messages.svelte.ts` | Message state management |

### Documents System

| Component | Location | Purpose |
|-----------|----------|---------|
| `documentsStore` | `src/lib/stores/documents.svelte.ts` | Document state management |
| Documents page | `src/routes/dashboard/client/documents/+page.svelte` | Client documents list |

### Current Issues Identified

1. **Messages not showing:** `MessageComposer` shows history but relies on `messagesStore.messages` which may not be fetched for uncategorized messages on initial load.

2. **ChatSlider redundancy:** Both `MessageComposer` (inline) and `ChatSlider` (slide-out) exist - the slide-out panel is unnecessary.

3. **Documents filtering:** The `documentsStore.fetchDocuments()` may be filtering by caseId, missing uncategorized documents and message attachments.

4. **Attachments not in documents:** Message attachments are stored with `attachmentDocumentId` but may not be included when fetching all documents.

---

## Work Breakdown Structure

### Phase 1: Remove ChatSlider Component (30 min)

**Objective:** Completely remove the ChatSlider slide-out panel from both dashboards.

#### 1.1 Remove from Client Dashboard
**File:** `src/routes/dashboard/client/+page.svelte`

- [ ] Remove `ChatSlider` import
- [ ] Remove `chatOpen` state variable
- [ ] Remove `ChatSlider` component from template
- [ ] Update "Unread Messages" stat card to not trigger chat panel

#### 1.2 Remove from Lawyer Dashboard
**File:** `src/routes/dashboard/lawyer/+page.svelte`

- [ ] Remove `ChatSlider` import
- [ ] Remove `chatOpen` state variable
- [ ] Remove `ChatSlider` component from template
- [ ] Update "Unread Messages" stat card behavior

#### 1.3 Consider Component Retention
**Decision:** Delete or keep `ChatSlider.svelte`?

- **Option A:** Delete the component entirely
- **Option B:** Keep for potential case-specific chat (case detail pages)

**Recommendation:** Keep for now but remove from main dashboards. Case detail pages may still use it.

---

### Phase 2: Fix Messages Display in MessageComposer (45 min)

**Objective:** Ensure messages populate correctly in the inline MessageComposer.

#### 2.1 Investigate Message Loading
**File:** `src/lib/components/MessageComposer.svelte`

Current behavior:
- Shows `messagesStore.messages` but doesn't fetch them
- Relies on parent to call `messagesStore.fetchMessages()`

Fix needed:
- [ ] Add `onMount` to fetch uncategorized messages when `caseId` is null
- [ ] Or ensure parent component fetches messages before rendering

#### 2.2 Update Client Dashboard Message Loading
**File:** `src/routes/dashboard/client/+page.svelte`

- [ ] Call `messagesStore.fetchMessages(undefined, true)` on mount for clients without cases
- [ ] Ensure messages refresh after sending via `onMessageSent` callback

#### 2.3 Add Auto-Refresh After Send
**File:** `src/lib/components/MessageComposer.svelte`

- [ ] Verify `onMessageSent` callback triggers message list refresh
- [ ] Add loading state while messages refresh

---

### Phase 3: Documents Show All Documents (1 hr)

**Objective:** Ensure the Documents page shows ALL documents including message attachments.

#### 3.1 Update Documents API
**File:** `src/routes/api/documents/+server.ts`

Current behavior:
- May filter by caseId
- May exclude documents attached to messages

Changes needed:
- [ ] Add parameter `includeAttachments=true` to include message attachments
- [ ] When no caseId filter, return ALL user-accessible documents
- [ ] Include documents where `caseId` is null (uncategorized)

#### 3.2 Update Documents Store
**File:** `src/lib/stores/documents.svelte.ts`

- [ ] Add `fetchAllDocuments()` method that includes attachments
- [ ] Update `fetchDocuments()` to accept `includeAttachments` param

#### 3.3 Update Client Documents Page
**File:** `src/routes/dashboard/client/documents/+page.svelte`

- [ ] Call `documentsStore.fetchDocuments()` without caseId filter
- [ ] Ensure all documents (case docs + message attachments) are displayed
- [ ] Add source indicator (from case vs from message)

#### 3.4 Update Lawyer Documents Page
**File:** `src/routes/dashboard/lawyer/documents/+page.svelte`

- [ ] Same changes as client documents page
- [ ] Ensure lawyer sees all documents they have access to

---

### Phase 4: Attachments in Both Chat and Documents (1.5 hr)

**Objective:** When a file is attached to a message, it should appear in both the chat view AND the documents panel.

#### 4.1 Verify Current Attachment Flow
**File:** `src/routes/api/messages/send/+server.ts`

Current flow when sending message with attachment:
1. Upload file to `/api/documents/upload`
2. Create document record
3. Create message with `attachmentDocumentId`

Questions to verify:
- [ ] Is the document record created with correct `caseId`?
- [ ] Is the document accessible via `/api/documents`?

#### 4.2 Update Message Send API
**File:** `src/routes/api/messages/send/+server.ts`

Ensure when attachment is uploaded:
- [ ] Document is created with `caseId` matching the message's case (or null if uncategorized)
- [ ] Document `uploadedById` is set correctly
- [ ] Document appears in both message attachment AND documents list

#### 4.3 Update Documents API to Include Message Attachments
**File:** `src/routes/api/documents/+server.ts`

- [ ] Join with messages table to find documents that are attachments
- [ ] Include these in the documents list response
- [ ] Add `source` field: 'case' | 'message' to indicate origin

#### 4.4 Update MessageBubble to Show Attachment
**File:** `src/lib/components/MessageBubble.svelte`

Current: Already shows attachment with download link ✅

Verify:
- [ ] Attachment displays correctly
- [ ] Download link works

#### 4.5 Update Documents Display
**Files:** Client/Lawyer documents pages

- [ ] Show source indicator for each document
- [ ] Potentially group by source or allow filtering

---

## Implementation Order

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Remove ChatSlider (30 min)                         │
│ - Quick win, reduces code complexity                        │
│ - No dependencies                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Fix Messages Display (45 min)                      │
│ - Core functionality fix                                    │
│ - Depends on Phase 1 (no conflicting UI)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: Documents Show All (1 hr)                          │
│ - Backend + frontend changes                                │
│ - Independent of messaging                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: Attachments Dual Display (1.5 hr)                  │
│ - Depends on Phase 3 (documents API changes)                │
│ - Integrates messaging + documents                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

### Components
| File | Phase | Changes |
|------|-------|---------|
| `src/lib/components/MessageComposer.svelte` | 2 | Add message fetching on mount |
| `src/lib/components/MessageBubble.svelte` | 4 | Verify attachment display |
| `src/lib/components/ChatSlider.svelte` | 1 | Keep but don't use on dashboards |

### Stores
| File | Phase | Changes |
|------|-------|---------|
| `src/lib/stores/messages.svelte.ts` | 2 | Verify fetch methods |
| `src/lib/stores/documents.svelte.ts` | 3, 4 | Add fetchAllDocuments, includeAttachments param |

### Pages
| File | Phase | Changes |
|------|-------|---------|
| `src/routes/dashboard/client/+page.svelte` | 1, 2 | Remove ChatSlider, fix message loading |
| `src/routes/dashboard/lawyer/+page.svelte` | 1 | Remove ChatSlider |
| `src/routes/dashboard/client/documents/+page.svelte` | 3 | Show all documents |
| `src/routes/dashboard/lawyer/documents/+page.svelte` | 3 | Show all documents |

### API Endpoints
| File | Phase | Changes |
|------|-------|---------|
| `src/routes/api/documents/+server.ts` | 3, 4 | Include attachments, remove restrictive filtering |
| `src/routes/api/messages/send/+server.ts` | 4 | Verify attachment document creation |

---

## Testing Checklist

### Phase 1: ChatSlider Removed
- [ ] Client dashboard loads without ChatSlider
- [ ] Lawyer dashboard loads without ChatSlider
- [ ] No console errors related to missing component
- [ ] "Unread Messages" stat card still displays count

### Phase 2: Messages Display Fixed
- [ ] Client without cases sees MessageComposer
- [ ] Sending a message shows success toast
- [ ] After sending, message appears in the message history
- [ ] Message history scrolls to show new messages

### Phase 3: Documents Show All
- [ ] Documents page shows case documents
- [ ] Documents page shows uncategorized documents
- [ ] Documents page shows message attachments
- [ ] Search filter works on all document types
- [ ] Download works for all document types

### Phase 4: Attachments Dual Display
- [ ] Send message with attachment → appears in chat
- [ ] Same attachment → appears in documents page
- [ ] Attachment download works from both locations
- [ ] Document shows source indicator (case/message)

---

## Estimated Time

| Phase | Task | Time |
|-------|------|------|
| 1 | Remove ChatSlider | 30 min |
| 2 | Fix Messages Display | 45 min |
| 3 | Documents Show All | 1 hr |
| 4 | Attachments Dual Display | 1.5 hr |
| — | Testing & QA | 30 min |
| **Total** | | **4.25 hrs** |

---

## Success Criteria

1. ✅ ChatSlider panel no longer appears on client or lawyer dashboards
2. ✅ Messages sent via MessageComposer immediately appear in the message history
3. ✅ Documents page shows ALL documents (case docs + uncategorized + attachments)
4. ✅ File attached to a message appears in both chat and documents panel
5. ✅ No regressions in existing functionality

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| ChatSlider used elsewhere | Medium | Search codebase for all usages before removal |
| Documents API breaking change | High | Add new parameter, don't change default behavior |
| Message attachments not linked | Medium | Verify document creation in send API |
| Performance with large doc lists | Low | Add pagination if needed later |

---

## Notes

- The `MessageComposer` component already has `showHistory` prop which displays messages inline
- The `ChatSlider` is redundant when `MessageComposer` is used with `showHistory={true}`
- Message attachments create document records via `attachmentDocumentId` foreign key
- Need to verify the documents API includes these attachment documents in list responses
