# King Law Firm - Phase Two Implementation Guide

This document provides step-by-step programming instructions for each section in PhaseTwo.md.

---

## 1. Messaging System Core

### 1.1 Message Capabilities

#### Step 1.1.1: Send Text Messages (client ↔ lawyer)
**Already implemented in Phase One.**
- API: `POST /api/messages` accepts `{ caseId, content }`
- Verify both client and lawyer can send to shared cases

#### Step 1.1.2: Attach Documents to Messages
1. Update `messages` table schema to ensure `attachmentDocumentId` works
2. Modify `POST /api/messages` to accept optional `attachmentDocumentId`
3. When sending message with attachment:
   - First upload document via `POST /api/documents/upload`
   - Then send message with returned `documentId`
4. Update ChatSlider to show attachment button

**Files to modify:**
- `src/routes/api/messages/+server.ts`
- `src/lib/components/ChatSlider.svelte`

#### Step 1.1.3: Display Document Links in Messages
1. In `GET /api/messages`, join with `documents` table to get attachment info
2. Return `attachmentFileName`, `attachmentId` with each message
3. In ChatSlider, render clickable document link when attachment exists
4. Link should trigger download via `/api/documents/[id]/download`

**Files to modify:**
- `src/routes/api/messages/+server.ts`
- `src/lib/components/ChatSlider.svelte`

#### Step 1.1.4: Messages Associated with Case OR Uncategorized
1. Update schema: make `caseId` nullable in `messages` table
2. Update `POST /api/messages` to accept `caseId: null`
3. Add validation: if user has cases, require caseId; if no cases, allow null

**Files to modify:**
- `src/lib/server/db/schema.ts`
- `src/routes/api/messages/+server.ts`
- Generate new migration: `npm run db:generate`

---

### 1.2 Chat UI Improvements

#### Step 1.2.1: Reposition Chat Toggle Button
1. Move button from fixed bottom-right to below navbar on right
2. Change from floating circle to integrated bar element
3. Update z-index to layer correctly with navbar

**Files to modify:**
- `src/lib/components/ChatSlider.svelte`

#### Step 1.2.2: Add Vertical Indicator Bar
1. Create a thin vertical bar (4-6px wide) on right edge
2. Use gold color to indicate chat availability
3. Entire bar should be clickable to open slider
4. Add subtle hover effect

**CSS approach:**
```css
.chat-indicator-bar {
  position: fixed;
  right: 0;
  top: 64px; /* below navbar */
  bottom: 0;
  width: 6px;
  background: var(--gold);
  cursor: pointer;
}
```

#### Step 1.2.3: Message Input with Send Button
**Already implemented.** Verify:
- Textarea auto-grows
- Enter sends (Shift+Enter for newline)
- Send button disabled when empty

#### Step 1.2.4: Display Document Attachments Inline
1. Create `MessageAttachment.svelte` component
2. Show file icon + filename + download button
3. Render below message content when attachment exists

**New file:**
- `src/lib/components/MessageAttachment.svelte`

---

## 2. Case Management

### 2.1 Case Creation (Attorney)

#### Step 2.1.1: Create New Case API
1. Create `POST /api/cases` endpoint
2. Accept: `{ clientId, title, description, status }`
3. Validate: only lawyers can create cases
4. Return created case object

**New file:**
- `src/routes/api/cases/+server.ts`

```typescript
// POST handler
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'lawyer') {
    throw error(403, 'Only lawyers can create cases');
  }
  const { clientId, title, description } = await request.json();
  // Insert into cases table
  // Return new case
};
```

#### Step 2.1.2: Assign Client to Case
1. Case creation requires `clientId`
2. Validate client exists and has role 'client'
3. Set `lawyerId` to current user (the attorney)

**Handled in Step 2.1.1**

#### Step 2.1.3: Create Case from Uncategorized Messages
1. Create `POST /api/cases/from-uncategorized` endpoint
2. Accept: `{ clientId, title, messageIds[], documentIds[] }`
3. Create new case
4. Update all specified messages/documents to new `caseId`
5. Return new case with updated items count

**New file:**
- `src/routes/api/cases/from-uncategorized/+server.ts`

#### Step 2.1.4: Move Thread/Files to New Case
1. Create `PATCH /api/messages/reassign` endpoint
2. Accept: `{ messageIds[], newCaseId }`
3. Bulk update all messages to new case
4. Same for documents: `PATCH /api/documents/reassign`

**New files:**
- `src/routes/api/messages/reassign/+server.ts`
- `src/routes/api/documents/reassign/+server.ts`

---

### 2.2 Case Selection (Client)

#### Step 2.2.1: Multiple Cases → Show Dropdown
**Already implemented in ChatSlider.** Verify dropdown appears when `cases.length > 1`

#### Step 2.2.2: One Case → Auto-Select
**Already implemented.** Verify:
```typescript
if (cases.length === 1) {
  selectedCaseId = cases[0].id;
}
```

#### Step 2.2.3: Zero Cases → No Selector, Send Uncategorized
1. Update ChatSlider to handle `cases.length === 0`
2. Hide case selector entirely
3. Set `selectedCaseId = null` when sending
4. Show helpful text: "Your message will be sent to your attorney"

**Files to modify:**
- `src/lib/components/ChatSlider.svelte`

---

### 2.3 Case Visibility

#### Step 2.3.1: Cases Appear in Client Dashboard
**Already implemented.** Cases fetched in `+page.server.ts`

#### Step 2.3.2: Cases Display as Clickable Rows
1. Wrap each case card in `<a href="/dashboard/client/case/{caseId}">`
2. Add hover state styling
3. Add cursor pointer

**Files to modify:**
- `src/routes/dashboard/client/+page.svelte`

#### Step 2.3.3: Click Opens Case Detail Window
1. Create new route: `/dashboard/client/case/[id]`
2. Create `+page.server.ts` to load case data
3. Create `+page.svelte` for Case Detail view

**New files:**
- `src/routes/dashboard/client/case/[id]/+page.server.ts`
- `src/routes/dashboard/client/case/[id]/+page.svelte`

---

## 3. "No Case Yet" State

### 3.1 Client Without Cases

#### Step 3.1.1: "Send Message" Button (No Cases)
1. In client dashboard, detect `cases.length === 0`
2. Show prominent "Contact Your Attorney" button
3. Button opens chat slider

**Files to modify:**
- `src/routes/dashboard/client/+page.svelte`

```svelte
{#if data.cases.length === 0}
  <button onclick={openChat}>Contact Your Attorney</button>
{/if}
```

#### Step 3.1.2: Message Dropdown Opens
1. When chat opens with no cases, show simplified view
2. No case selector needed
3. Direct message composition area

**Files to modify:**
- `src/lib/components/ChatSlider.svelte`

#### Step 3.1.3: Send Text Messages (Uncategorized)
1. Modify `POST /api/messages` to allow `caseId: null`
2. Store with `caseId = NULL` in database
3. Associate with `senderId` (client) for attorney lookup

**Files to modify:**
- `src/routes/api/messages/+server.ts`

#### Step 3.1.4: Upload Documents (Uncategorized)
1. Modify `POST /api/documents/upload` to allow `caseId: null`
2. Update schema if needed for nullable caseId
3. Store document with client's userId for lookup

**Files to modify:**
- `src/routes/api/documents/upload/+server.ts`
- `src/lib/server/db/schema.ts` (if caseId not already nullable)

---

### 3.2 Uncategorized Items (Attorney View)

#### Step 3.2.1: "Uncategorized" Section in Dashboard
1. In lawyer dashboard, add new section
2. Query messages where `caseId IS NULL`
3. Group by `senderId` (client)

**Files to modify:**
- `src/routes/dashboard/lawyer/+page.server.ts`
- `src/routes/dashboard/lawyer/+page.svelte`

```typescript
// In +page.server.ts
const uncategorizedMessages = await db
  .select()
  .from(messages)
  .where(isNull(messages.caseId));
```

#### Step 3.2.2: Display Uncategorized Threads/Files
1. Create expandable section for uncategorized items
2. Group by client (show client name)
3. List messages and documents under each client

**Files to modify:**
- `src/routes/dashboard/lawyer/+page.svelte`

#### Step 3.2.3: Reply to Uncategorized Messages
1. In ChatSlider, support viewing uncategorized thread
2. Add special "Uncategorized" option or auto-detect
3. Lawyer can reply with `caseId: null`

**Files to modify:**
- `src/lib/components/ChatSlider.svelte`

#### Step 3.2.4: Convert Thread to New Case
1. Add "Create Case" button on uncategorized thread
2. Opens modal with case creation form
3. On submit, creates case and reassigns all messages/docs

**New files:**
- `src/lib/components/CreateCaseModal.svelte`

**Files to modify:**
- `src/routes/dashboard/lawyer/+page.svelte`

---

## 4. Case Detail Window

### 4.1 Layout

#### Step 4.1.1: Create Case Detail Route
1. Create route structure for both client and lawyer
2. Client: `/dashboard/client/case/[id]`
3. Lawyer: `/dashboard/lawyer/case/[id]`

**New files:**
- `src/routes/dashboard/client/case/[id]/+page.server.ts`
- `src/routes/dashboard/client/case/[id]/+page.svelte`
- `src/routes/dashboard/lawyer/case/[id]/+page.server.ts`
- `src/routes/dashboard/lawyer/case/[id]/+page.svelte`

#### Step 4.1.2: Remove Stats Cards
1. Copy dashboard layout structure
2. Remove the top stats grid (Active Cases, Documents, etc.)
3. Start with case title and status header

**Template:**
```svelte
<div class="case-detail">
  <header>
    <h1>{caseData.title}</h1>
    <span class="status">{caseData.status}</span>
  </header>
  <!-- Content sections below -->
</div>
```

#### Step 4.1.3: Clean Focused View
1. Single-column or two-column layout
2. Case info at top
3. Tabbed or sectioned content below

---

### 4.2 Case Content Sections

#### Step 4.2.1: Documents Section
1. Query documents for this specific case
2. Display in grid or list format
3. Download button for each document
4. Upload button for new documents

**In +page.server.ts:**
```typescript
const documents = await db
  .select()
  .from(documentsTable)
  .where(eq(documentsTable.caseId, caseId));
```

#### Step 4.2.2: Invoices Section
1. Query invoices for this case
2. Show amount, status, due date
3. Pay button for unpaid invoices (client view)
4. Create invoice button (lawyer view)

#### Step 4.2.3: Message Thread Section
1. Query messages for this case
2. Display as chat thread (similar to ChatSlider)
3. Inline document attachments

#### Step 4.2.4: Send Messages in Context
1. Message input at bottom of thread
2. Auto-set caseId to current case
3. No case selector needed (context is clear)

---

## 5. Client Dashboard Updates

### 5.1 Your Cases Section

#### Step 5.1.1: Display Cases as Clickable Rows
1. Update existing cases section
2. Wrap in anchor tags or use onclick navigation
3. Style as interactive cards

**Files to modify:**
- `src/routes/dashboard/client/+page.svelte`

#### Step 5.1.2: Show Case Metadata
1. Display: title, status, last activity date
2. Add unread message badge per case
3. Show assigned attorney name

#### Step 5.1.3: Navigate to Case Detail
1. Use SvelteKit `goto()` or anchor href
2. Route: `/dashboard/client/case/{id}`

---

### 5.2 Messaging Integration

#### Step 5.2.1: Chat Slider Accessible
**Already implemented.** ChatSlider component is included.

#### Step 5.2.2: Case Selector in Chat
**Already implemented.** Dropdown shows when multiple cases.

#### Step 5.2.3: View Per-Case Messages
**Already implemented.** Messages filtered by selected case.

---

## 6. Attorney Dashboard Updates

### 6.1 Client Management

#### Step 6.1.1: Client List Interface
1. Create clients section in lawyer dashboard
2. Query all unique clients from cases table
3. Display as card grid or list

**Files to modify:**
- `src/routes/dashboard/lawyer/+page.server.ts`
- `src/routes/dashboard/lawyer/+page.svelte`

```typescript
// Get unique clients
const clients = await db
  .selectDistinct({ 
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email
  })
  .from(cases)
  .innerJoin(user, eq(cases.clientId, user.id))
  .where(eq(cases.lawyerId, locals.user.id));
```

#### Step 6.1.2: Client Profile Page
1. Create route: `/dashboard/lawyer/client/[id]`
2. Show client info: name, email, phone
3. List all cases for this client

**New files:**
- `src/routes/dashboard/lawyer/client/[id]/+page.server.ts`
- `src/routes/dashboard/lawyer/client/[id]/+page.svelte`

#### Step 6.1.3: View Client's Cases
1. On client profile, list all their cases
2. Show case status, dates, document count
3. Each case is clickable

#### Step 6.1.4: Navigate to Case from Profile
1. Click case → `/dashboard/lawyer/case/{caseId}`
2. Use same Case Detail Window as client (with lawyer permissions)

---

### 6.2 Content Organization

#### Step 6.2.1: View Case-Linked Content
**Implemented via Case Detail Window (Section 4)**

#### Step 6.2.2: View Uncategorized Content
**Implemented via Section 3.2**

#### Step 6.2.3: Transfer to Different Case
1. Add "Move to Case" action on messages/documents
2. Open modal with case selector dropdown
3. Call reassign API endpoint
4. Refresh view after move

**New component:**
- `src/lib/components/MoveToCase Modal.svelte`

**API (from 2.1.4):**
- `PATCH /api/messages/reassign`
- `PATCH /api/documents/reassign`

#### Step 6.2.4: Copy to Different Case
1. Add "Copy to Case" action
2. Create new API: `POST /api/messages/copy`
3. Duplicates message with new caseId
4. Same for documents (copy file + create new record)

**New API endpoints:**
- `src/routes/api/messages/copy/+server.ts`
- `src/routes/api/documents/copy/+server.ts`

---

## 7. Database Considerations

### 7.1 Message Schema Updates

#### Step 7.1.1: Make caseId Nullable
1. Update schema.ts:
```typescript
caseId: text('case_id')
  .references(() => cases.id, { onDelete: 'set null' })
  // Remove .notNull()
```
2. Run `npm run db:generate`
3. Run `npm run db:push`

#### Step 7.1.2: Make Document caseId Nullable
1. Same process for documents table
2. Update schema, generate, push

#### Step 7.1.3: Support Reassigning caseId
1. No schema change needed
2. Handled by UPDATE queries in API endpoints

---

### 7.2 Case Assignment Operations

#### Step 7.2.1: Bulk Update Messages
```typescript
// In reassign endpoint
await db
  .update(messages)
  .set({ caseId: newCaseId })
  .where(inArray(messages.id, messageIds));
```

#### Step 7.2.2: Bulk Update Documents
```typescript
await db
  .update(documents)
  .set({ caseId: newCaseId })
  .where(inArray(documents.id, documentIds));
```

---

## File Summary

### New Files to Create
| File | Purpose |
|------|---------|
| `src/routes/api/cases/+server.ts` | Create case API |
| `src/routes/api/cases/from-uncategorized/+server.ts` | Create case from uncategorized |
| `src/routes/api/messages/reassign/+server.ts` | Move messages to case |
| `src/routes/api/documents/reassign/+server.ts` | Move documents to case |
| `src/routes/api/messages/copy/+server.ts` | Copy message to case |
| `src/routes/api/documents/copy/+server.ts` | Copy document to case |
| `src/routes/dashboard/client/case/[id]/+page.server.ts` | Client case detail loader |
| `src/routes/dashboard/client/case/[id]/+page.svelte` | Client case detail view |
| `src/routes/dashboard/lawyer/case/[id]/+page.server.ts` | Lawyer case detail loader |
| `src/routes/dashboard/lawyer/case/[id]/+page.svelte` | Lawyer case detail view |
| `src/routes/dashboard/lawyer/client/[id]/+page.server.ts` | Client profile loader |
| `src/routes/dashboard/lawyer/client/[id]/+page.svelte` | Client profile view |
| `src/lib/components/MessageAttachment.svelte` | Attachment display |
| `src/lib/components/CreateCaseModal.svelte` | Case creation modal |
| `src/lib/components/MoveToCaseModal.svelte` | Move/reassign modal |

### Files to Modify
| File | Changes |
|------|---------|
| `src/lib/server/db/schema.ts` | Make caseId nullable |
| `src/lib/components/ChatSlider.svelte` | UI updates, uncategorized support |
| `src/routes/api/messages/+server.ts` | Allow null caseId, include attachments |
| `src/routes/api/documents/upload/+server.ts` | Allow null caseId |
| `src/routes/dashboard/client/+page.svelte` | Clickable cases, no-case state |
| `src/routes/dashboard/lawyer/+page.svelte` | Uncategorized section, client list |
| `src/routes/dashboard/lawyer/+page.server.ts` | Fetch uncategorized, clients |
