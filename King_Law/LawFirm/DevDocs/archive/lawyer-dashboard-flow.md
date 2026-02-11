> **⚠️ ARCHIVED** — This document is outdated and kept for historical reference only.
> The authoritative project doc is [`DevDocs/1-27-26-master-wbs.md`](../1-27-26-master-wbs.md).
> Historical: plan was executed but doesn't reflect staff system or subsequent UI changes.

# Lawyer Dashboard Flow - Work Order Structure

## Overview
Complete case management system allowing lawyers to create cases, assign them to clients, manage documents, invoices, and communications. Clients can view their cases, respond to messages, and upload documents.

---

## PHASE 1: LAWYER CASE CREATION

### 1.1: Create Case List Page
**File**: `/routes/dashboard/lawyer/+page.svelte`

- [ ] Create stats overview section:
  - [ ] Total cases count
  - [ ] Active cases count
  - [ ] Number of Outstanding Invoices
  - [ ] Active clients count
- [ ] Add "Create New Case" button (prominent placement)
- [ ] Display cases grid/list:
  - [ ] Case title
  - [ ] Client name
  - [ ] Status badge (Open/Closed/Archived)
  - [ ] Last updated date
  - [ ] Click to view case details
- [ ] Add filter checkboxes (All/Open/Closed/Archived)
- [ ] Add search bar (search by title or client name)

### 1.2: Create Case List Server Load
**File**: `/routes/dashboard/lawyer/+page.server.ts`

- [ ] Verify user is authenticated
- [ ] Verify user role is 'lawyer' or 'admin'
- [ ] Load lawyer's cases from database:
  - [ ] Join with user table to get client info
  - [ ] Order by updatedAt desc
- [ ] Load case statistics:
  - [ ] Count total cases
  - [ ] Count by status
  - [ ] Count unique clients
- [ ] Return cases array and stats

### 1.3: Build Create Case Modal Component
**File**: `/lib/components/CreateCaseModal.svelte`

- [ ] Modal overlay with backdrop
- [ ] Form fields:
  - [ ] Client selector (searchable dropdown):
    - [ ] Display: firstName + lastName + email
    - [ ] Filter to only show users with role='client'
    - [ ] Search functionality
  - [ ] Case title input (required, text)
  - [ ] Case description textarea (required, min 20 chars)
  - [ ] Status selector (default: 'Open'):
    - [ ] Options: Open, Closed
- [ ] Validation:
  - [ ] Client must be selected
  - [ ] Title required (max 100 chars)
  - [ ] Description required (min 20 chars)
- [ ] Action buttons:
  - [ ] Cancel (close modal)
  - [ ] Create Case (submit)
- [ ] Loading state during submission
- [ ] Error display area

### 1.4: Create Case API Endpoint
**File**: `/routes/api/cases/+server.ts`

**POST Handler**:
- [ ] Verify user is authenticated
- [ ] Verify user role is 'lawyer' or 'admin'
- [ ] Validate request body:
  - [ ] `clientId` (required, must be valid user ID)
  - [ ] `title` (required, string)
  - [ ] `description` (required, string)
  - [ ] `status` (optional, default 'open')
- [ ] Verify client exists and has role='client'
- [ ] Generate case ID
- [ ] Insert case into database:
  - [ ] Set lawyerId to current user ID
  - [ ] Set createdAt and updatedAt timestamps
- [ ] Return created case object with client info

**GET Handler**:
- [ ] Verify user is authenticated
- [ ] If lawyer: return cases where lawyerId = user.id
- [ ] If client: return cases where clientId = user.id
- [ ] Join with user table to get client/lawyer info
- [ ] Order by updatedAt desc
- [ ] Return cases array

---

## PHASE 2: CASE DETAIL PAGE (LAWYER VIEW)

### 2.1: Create Case Detail Layout
**File**: `/routes/dashboard/lawyer/case/[id]/+page.svelte`

- [ ] Case header section:
  - [ ] Case title (editable inline)
  - [ ] Status badge with dropdown to change status
  - [ ] Client info card:
    - [ ] Name
    - [ ] Email
    - [ ] Phone
    - [ ] "View Client Profile" link
  - [ ] Created date
  - [ ] Last updated date
  - [ ] Archive case button 
- [ ] Tab navigation:
  - [ ] Overview tab
  - [ ] Documents tab
  - [ ] Invoices tab
  - [ ] Messages tab
- [ ] Back to cases button

### 2.2: Case Detail Server Load
**File**: `/routes/dashboard/lawyer/case/[id]/+page.server.ts`

- [ ] Verify user is authenticated
- [ ] Load case by ID
- [ ] Verify lawyer owns this case (lawyerId = user.id)
- [ ] Load client information
- [ ] Load case documents:
  - [ ] Join with user table for uploader info
  - [ ] Order by uploadedAt desc
- [ ] Load case invoices:
  - [ ] Order by createdAt desc
- [ ] Load case messages:
  - [ ] Join with user table for sender info
  - [ ] Order by createdAt asc
  - [ ] Mark unread messages count
- [ ] Return case data, client, documents, invoices, messages

### 2.3: Overview Tab Component
**File**: `/lib/components/case/OverviewTab.svelte`

- [ ] Case description display
- [ ] Edit description button
- [ ] Description editor (textarea):
  - [ ] Save button
  - [ ] Cancel button
- [ ] Case statistics:
  - [ ] Total documents count
  - [ ] Total invoices count
  - [ ] Total messages count
  - [ ] Outstanding invoice amount
- [ ] Case timeline (recent activity):
  - [ ] Document uploads
  - [ ] Invoice created
  - [ ] Messages sent
  - [ ] Status changes

### 2.4: Documents Tab Component
**File**: `/lib/components/case/DocumentsTab.svelte`

- [ ] Upload document button (opens upload modal)
- [ ] Documents table/list:
  - [ ] File name
  - [ ] File size (formatted)
  - [ ] Uploaded by (name)
  - [ ] Upload date
  - [ ] Actions:
    - [ ] Download button
    - [ ] Delete button (with confirmation)
- [ ] Empty state: "No documents uploaded yet"
- [ ] Loading state

### 2.5: Invoices Tab Component
**File**: `/lib/components/case/InvoicesTab.svelte`

- [ ] Create invoice button (opens invoice modal)
- [ ] Invoices table:
  - [ ] Description
  - [ ] Amount (formatted currency)
  - [ ] Due date
  - [ ] Status badge (Unpaid/Partial/Paid)
  - [ ] Paid amount (if partial)
  - [ ] Actions:
    - [ ] View details
    - [ ] Edit (if unpaid)
    - [ ] Delete (with confirmation)
- [ ] Summary section:
  - [ ] Total invoiced
  - [ ] Total paid
  - [ ] Outstanding balance
- [ ] Empty state: "No invoices created yet"

### 2.6: Messages Tab Component
**File**: `/lib/components/case/MessagesTab.svelte`

- [ ] Message thread display:
  - [ ] Messages ordered by time
  - [ ] Sender bubble (right aligned)
  - [ ] Recipient bubble (left aligned)
  - [ ] Timestamp
  - [ ] Read/unread indicator
  - [ ] Attachment display (if any)
- [ ] Message input area:
  - [ ] Textarea for message
  - [ ] Attach file button
  - [ ] Send button
  - [ ] Character count
- [ ] Auto-scroll to bottom
- [ ] Load more messages (pagination)
- [ ] Empty state: "No messages yet. Start the conversation!"

---

## PHASE 3: DOCUMENT MANAGEMENT

### 3.1: Create Upload Document Modal
**File**: `/lib/components/UploadDocumentModal.svelte`

- [ ] Drag and drop area
- [ ] File input button
- [ ] File type validation:
  - [ ] Allowed: PDF, DOC, DOCX, JPG, PNG, TXT
  - [ ] Show error for invalid types
- [ ] File size validation (max 10MB)
- [ ] Preview selected file:
  - [ ] File name
  - [ ] File size
  - [ ] File type icon
  - [ ] Remove button
- [ ] Upload progress bar
- [ ] Success/error message display
- [ ] Close button

### 3.2: Document Upload API
**File**: `/routes/api/documents/upload/+server.ts`

**POST Handler**:
- [ ] Verify user is authenticated
- [ ] Parse multipart form data (file + caseId)
- [ ] Validate file type (mime type check)
- [ ] Validate file size (max 10MB)
- [ ] Sanitize filename:
  - [ ] Remove special characters
  - [ ] Prevent path traversal
- [ ] Generate unique filename: `{timestamp}-{sanitized-name}`
- [ ] Create upload directory if not exists: `/uploads/cases/{caseId}/`
- [ ] Save file to disk
- [ ] Create document record in database:
  - [ ] caseId
  - [ ] uploadedById (current user)
  - [ ] fileName (original)
  - [ ] filePath (stored path)
  - [ ] fileSize
  - [ ] mimeType
  - [ ] uploadedAt
- [ ] Return document object

### 3.3: Document Download API
**File**: `/routes/api/documents/[id]/+server.ts`

**GET Handler**:
- [ ] Verify user is authenticated
- [ ] Load document by ID
- [ ] Load case to verify access:
  - [ ] User is lawyer of case OR
  - [ ] User is client of case
- [ ] Check if file exists on filesystem
- [ ] Stream file with headers:
  - [ ] Content-Type (from mime type)
  - [ ] Content-Disposition (attachment)
  - [ ] Content-Length (file size)
- [ ] Return 404 if file missing
- [ ] Log download activity

### 3.4: Document Delete API
**File**: `/routes/api/documents/[id]/delete/+server.ts`

**DELETE Handler**:
- [ ] Verify user is authenticated
- [ ] Load document by ID
- [ ] Load case to verify lawyer owns it
- [ ] Delete file from filesystem
- [ ] Delete database record
- [ ] Return success response

---

## PHASE 4: INVOICE MANAGEMENT

### 4.1: Create Invoice Modal
**File**: `/lib/components/CreateInvoiceModal.svelte`

- [ ] Form fields:
  - [ ] Description textarea (required)
  - [ ] Amount input (USD, required):
    - [ ] Format with $ prefix
    - [ ] Validate number
    - [ ] Min $0.01
  - [ ] Due date picker (required):
    - [ ] Default to 30 days from now
    - [ ] Calendar widget
- [ ] Preview section:
  - [ ] Show formatted amount
  - [ ] Show due date
  - [ ] Case title
  - [ ] Client name
- [ ] Status selector (default: 'Unpaid'):
  - [ ] Options: Unpaid, Paid, Cancelled
- [ ] Upload invoice file (optional)
- [ ] Action buttons:
  - [ ] Cancel
  - [ ] Create Invoice
- [ ] Validation errors display

### 4.2: Invoice Creation API
**File**: `/routes/api/invoices/+server.ts`

**POST Handler**:
- [ ] Verify user is authenticated
- [ ] Verify user is lawyer or admin
- [ ] Validate request body:
  - [ ] `caseId` (required)
  - [ ] `amount` (required, number)
  - [ ] `description` (required, string)
  - [ ] `dueDate` (required, valid date)
- [ ] Verify lawyer owns the case
- [ ] Convert amount from dollars to cents
- [ ] Generate invoice ID
- [ ] Create invoice record:
  - [ ] status = 'unpaid'
  - [ ] paidAmount = 0
  - [ ] createdAt timestamp
- [ ] Return invoice object

**GET Handler**:
- [ ] Verify user is authenticated
- [ ] If lawyer: return invoices for their cases
- [ ] If client: return invoices for their cases
- [ ] Join with cases table to get case info
- [ ] Order by createdAt desc
- [ ] Return invoices array

---

## PHASE 5: MESSAGING SYSTEM

### 5.1: Message Send API
**File**: `/routes/api/messages/+server.ts`

**POST Handler**:
- [ ] Verify user is authenticated
- [ ] Validate request body:
  - [ ] `caseId` (required)
  - [ ] `content` (required, non-empty)
  - [ ] `attachmentDocumentId` (optional)
- [ ] Load case to verify access
- [ ] Determine recipient:
  - [ ] If sender is lawyer: recipient is client
  - [ ] If sender is client: recipient is lawyer
- [ ] Create message record:
  - [ ] senderId (current user)
  - [ ] recipientId
  - [ ] caseId
  - [ ] content
  - [ ] attachmentDocumentId (if provided)
  - [ ] createdAt
  - [ ] readAt = null
- [ ] Return message object with sender info

**GET Handler**:
- [ ] Verify user is authenticated
- [ ] Accept query param: `caseId`
- [ ] Verify user has access to case
- [ ] Load messages for case:
  - [ ] Join with user table for sender info
  - [ ] Join with documents for attachments
  - [ ] Order by createdAt asc
- [ ] Mark messages as read (where recipientId = current user)
- [ ] Return messages array

### 5.2: Message Mark as Read API
**File**: `/routes/api/messages/mark-read/+server.ts`

**POST Handler**:
- [ ] Verify user is authenticated
- [ ] Accept body: `{ caseId }` or `{ messageId }`
- [ ] If caseId: update all unread messages for that case
- [ ] If messageId: update specific message
- [ ] Verify user is the recipient
- [ ] Set readAt to current timestamp
- [ ] Return updated count

---

## PHASE 6: CLIENT DASHBOARD

### 6.1: Client Dashboard Home
**File**: `/routes/dashboard/client/+page.svelte`

- [ ] Overview stats:
  - [ ] Active cases count
  - [ ] Unread messages count
  - [ ] Unpaid invoices count
  - [ ] Documents uploaded count
- [ ] Quick actions:
  - [ ] "Message Lawyer" button
  - [ ] "Upload Document" button
  - [ ] "View Invoices" button
- [ ] Your cases section:
  - [ ] Display cases as cards:
    - [ ] Case title
    - [ ] Lawyer name
    - [ ] Status badge
    - [ ] Unread message indicator
    - [ ] Last updated
    - [ ] Click to view details
- [ ] Recent documents section
- [ ] Outstanding invoices section

### 6.2: Client Dashboard Server Load
**File**: `/routes/dashboard/client/+page.server.ts`

- [ ] Verify user is authenticated
- [ ] Verify user role is 'client'
- [ ] Load user's cases:
  - [ ] Join with user table for lawyer info
  - [ ] Order by updatedAt desc
- [ ] Load unread message count per case
- [ ] Load unpaid invoices
- [ ] Load recent documents
- [ ] Return data

### 6.3: Client Case Detail Page
**File**: `/routes/dashboard/client/case/[id]/+page.svelte`

- [ ] Case header:
  - [ ] Case title
  - [ ] Status badge
  - [ ] Lawyer info card
  - [ ] Created date
- [ ] Tabs:
  - [ ] Overview (case description, read-only)
  - [ ] Documents (view, upload, download)
  - [ ] Invoices (view, pay)
  - [ ] Messages (view, reply)
- [ ] Back to dashboard button

### 6.4: Client Case Detail Server Load
**File**: `/routes/dashboard/client/case/[id]/+page.server.ts`

- [ ] Verify user is authenticated
- [ ] Load case by ID
- [ ] Verify client owns this case (clientId = user.id)
- [ ] Load lawyer information
- [ ] Load case documents
- [ ] Load case invoices
- [ ] Load case messages
- [ ] Return all data

---

## PHASE 7: CASE FILTERING & SEARCH

### 7.1: Add Case Filters (Lawyer Dashboard)
**File**: `/routes/dashboard/lawyer/+page.svelte`

- [ ] Status filter dropdown:
  - [ ] All
  - [ ] Active
  - [ ] Pending
  - [ ] Closed
- [ ] Client filter (searchable dropdown)
- [ ] Date range filter (optional)
- [ ] Sort options:
  - [ ] Most recent
  - [ ] Oldest
  - [ ] Title A-Z
  - [ ] Title Z-A

### 7.2: Add Search Functionality
**File**: `/routes/dashboard/lawyer/+page.svelte`

- [ ] Search input field
- [ ] Search by:
  - [ ] Case title
  - [ ] Client name
  - [ ] Case description
- [ ] Debounced search (500ms delay)
- [ ] Show results count
- [ ] Clear search button

---

## PHASE 8: CASE UPDATE & DELETION

### 8.1: Update Case API
**File**: `/routes/api/cases/[id]/+server.ts`

**PATCH Handler**:
- [ ] Verify user is authenticated
- [ ] Verify user is lawyer and owns case
- [ ] Accept body:
  - [ ] `title` (optional)
  - [ ] `description` (optional)
  - [ ] `status` (optional)
- [ ] Update case record
- [ ] Update `updatedAt` timestamp
- [ ] Return updated case

**DELETE Handler**:
- [ ] Verify user is authenticated
- [ ] Verify user is lawyer and owns case
- [ ] Check for related records:
  - [ ] Documents (cascade delete or prevent)
  - [ ] Invoices (prevent if paid)
  - [ ] Messages (cascade delete or archive)
- [ ] Delete case
- [ ] Return success

### 8.2: Inline Edit Case Title
**File**: `/lib/components/case/EditableTitle.svelte`

- [ ] Display mode: title text with edit icon
- [ ] Edit mode: input field with save/cancel
- [ ] Click edit icon to enable editing
- [ ] PATCH to `/api/cases/[id]` on save
- [ ] Revert on cancel
- [ ] Show loading state during save

### 8.3: Status Dropdown Component
**File**: `/lib/components/case/StatusDropdown.svelte`

- [ ] Current status badge
- [ ] Dropdown menu with options:
  - [ ] Active
  - [ ] Pending
  - [ ] Closed
- [ ] PATCH to `/api/cases/[id]` on change
- [ ] Show confirmation for closing case
- [ ] Update UI on success

---

## PHASE 9: NOTIFICATIONS & REAL-TIME UPDATES

### 9.1: Unread Message Badge
**File**: `/lib/components/UnreadBadge.svelte`

- [ ] Display count if > 0
- [ ] Red badge styling
- [ ] Show on:
  - [ ] Case cards
  - [ ] Dashboard stats
  - [ ] Navigation tabs

### 9.2: Message Polling (Client & Lawyer)
**File**: `/lib/utils/message-polling.ts`

- [ ] Create polling function:
  - [ ] Fetch unread count every 5 seconds
  - [ ] Update store/state
  - [ ] Clear interval on component destroy
- [ ] Implement in dashboard layouts
- [ ] Show notification indicator on new messages

---

## PHASE 10: TESTING & VALIDATION

### 10.1: Lawyer Flow Testing
- [ ] Test case creation:
  - [ ] Create case with valid data
  - [ ] Validate all fields required
  - [ ] Verify case appears in list
- [ ] Test case detail view:
  - [ ] All tabs load correctly
  - [ ] Can edit title and description
  - [ ] Can change status
- [ ] Test document upload:
  - [ ] Valid file types accepted
  - [ ] Invalid types rejected
  - [ ] File size limits enforced
  - [ ] Download works
  - [ ] Delete works
- [ ] Test invoice creation:
  - [ ] Create invoice
  - [ ] Edit invoice
  - [ ] Delete unpaid invoice
- [ ] Test messaging:
  - [ ] Send message
  - [ ] Receive reply
  - [ ] Attachments work

### 10.2: Client Flow Testing
- [ ] Test dashboard view:
  - [ ] Cases display correctly
  - [ ] Stats accurate
- [ ] Test case detail:
  - [ ] Can view documents
  - [ ] Can upload documents
  - [ ] Can view invoices
  - [ ] Can send messages
- [ ] Test permissions:
  - [ ] Cannot access other clients' cases
  - [ ] Cannot edit case details
  - [ ] Cannot delete documents

### 10.3: Access Control Testing
- [ ] Verify lawyer can only access their cases
- [ ] Verify client can only access their cases
- [ ] Verify admins have full access
- [ ] Test with multiple users simultaneously
- [ ] Test invalid IDs return 404
- [ ] Test unauthorized access returns 403

---

## SUCCESS CRITERIA

✅ **Lawyer can**:
- [ ] Create new cases and assign to clients
- [ ] View all their cases with filtering
- [ ] Click on a case and see overview, documents, invoices, messages
- [ ] Upload documents to cases
- [ ] Create invoices for cases
- [ ] Send messages to clients
- [ ] Edit case details and status
- [ ] Delete cases (with proper checks)

✅ **Client can**:
- [ ] View all cases assigned to them
- [ ] Click on a case and see details
- [ ] View and download documents
- [ ] Upload documents to their cases
- [ ] View invoices and pay them
- [ ] Send messages to their lawyer
- [ ] Receive notifications for new messages

✅ **System ensures**:
- [ ] Proper access control (users only see their cases)
- [ ] Data integrity (cascading deletes handled properly)
- [ ] File security (path traversal prevented)
- [ ] Validation (all inputs validated)
- [ ] User experience (loading states, error messages)
