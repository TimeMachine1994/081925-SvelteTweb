# King Law Firm Case Management System - Architecture Report

## Executive Summary

The King Law Firm case management system is a comprehensive web application built to facilitate seamless collaboration between lawyers and their clients. The system operates on a hub-and-spoke model where **cases** serve as the central organizational unit, connecting lawyers, clients, documents, invoices, and messages into a unified workflow. This architecture ensures data integrity, proper access control, and an intuitive user experience for both legal professionals and their clients.

---

## System Architecture Overview

### The Case-Centric Model

At the heart of the system lies the **case entity**, which acts as the organizational container for all client-lawyer interactions. Every piece of data—documents, invoices, messages—is associated with a specific case, creating clear boundaries and ensuring that information remains properly contextualized and secure.

**Database Relationships:**
- Each case belongs to exactly one **lawyer** (via `lawyerId`)
- Each case belongs to exactly one **client** (via `clientId`)
- Each case can have multiple **documents** (one-to-many)
- Each case can have multiple **invoices** (one-to-many)
- Each case can have multiple **messages** (one-to-many)

This structure creates a natural hierarchy that prevents orphaned data and maintains referential integrity throughout the system.

---

## Phase 1: Case Creation & Organization

### Lawyer Dashboard Entry Point

When a lawyer logs into the system, they arrive at their dashboard (`/dashboard/lawyer`), which serves as the command center for their practice. The dashboard immediately presents critical metrics:

- **Total cases count** - Overall practice volume
- **Active cases count** - Current workload
- **Outstanding invoices count** - Revenue tracking
- **Active clients count** - Relationship management

The dashboard employs a **server-side load pattern** where authentication verification happens first, followed by database queries that join the cases table with the users table. This ensures lawyers only see their own cases (enforced by `lawyerId = user.id`) while simultaneously fetching client information through SQL joins, reducing the number of database round-trips.

### Case Creation Workflow

The case creation process demonstrates the system's validation-first architecture:

1. **Trigger**: Lawyer clicks "Create New Case" button
2. **Modal Display**: `CreateCaseModal.svelte` component mounts with backdrop overlay
3. **Client Selection**: Searchable dropdown fetches all users where `role='client'`, displaying `firstName + lastName + email` for clarity
4. **Form Validation**: Multi-layer validation occurs:
   - **Client-side**: Immediate feedback on required fields, character limits
   - **Server-side**: Secondary validation before database insertion
5. **API Call**: POST to `/api/cases` endpoint with authentication verification
6. **Database Insert**: New case record created with:
   - Generated unique ID
   - `lawyerId` set to authenticated user
   - `clientId` from form selection
   - Initial status of 'open'
   - `createdAt` and `updatedAt` timestamps
7. **Response**: Returns created case object with joined client information
8. **UI Update**: Dashboard refreshes, new case appears in list

This workflow demonstrates **progressive enhancement**—basic functionality works with minimal JavaScript, but the experience improves with modal overlays and live validation.

### Filtering and Organization

The lawyer dashboard includes sophisticated filtering capabilities:

- **Status Checkboxes**: Filter by Open, Closed, or Archived
- **Search Bar**: Real-time search across case titles and client names
- **Client Filter**: Dropdown to filter cases by specific client
- **Sort Options**: Order by most recent, oldest, or alphabetically

These filtering mechanisms allow lawyers to quickly navigate large caseloads and find specific matters efficiently.

---

## Phase 2: Case Detail Architecture

### The Tabbed Interface Pattern

Once a case is created, the lawyer can click into the case detail page (`/dashboard/lawyer/case/[id]`), which employs a tabbed interface to organize different aspects of case management:

**Server Load Strategy:**
The server load function (`+page.server.ts`) executes a sophisticated data-fetching strategy:

```
1. Authenticate user
2. Load case by ID (single query)
3. Verify ownership (lawyerId = user.id) → 403 if unauthorized
4. Execute parallel data fetches:
   - Client information (join with users table)
   - Case documents (join with users for uploader info)
   - Case invoices (ordered by creation date)
   - Case messages (join with users for sender info, calculate unread count)
5. Return consolidated data object
```

This **parallel loading strategy** minimizes page load time by executing non-dependent queries simultaneously, while the ownership verification step provides security before any data is exposed.

### Case Header Section

The case header provides at-a-glance information and quick actions:

- **Editable Title**: Click-to-edit functionality with inline updating
- **Status Badge**: Dropdown menu to change status (Open/Closed/Archived)
- **Client Information Card**: Name, email, phone, and profile link
- **Timestamps**: Created date and last updated date
- **Archive Button**: Soft deletion that preserves data integrity

The header employs an **optimistic UI pattern** where title edits appear immediately, with rollback on server error.

### Tab 1: Overview - The Activity Timeline

The Overview tab (`OverviewTab.svelte`) provides a narrative view of case progression. It displays:

- **Editable description** using inline editing patterns
- **Case statistics** aggregated from related tables:
  - Total documents count
  - Total invoices count
  - Total messages count
  - Outstanding invoice amount
- **Activity timeline** showing chronological events:
  - Document uploads (from documents table, `uploadedAt` timestamp)
  - Invoice creation (from invoices table, `createdAt` timestamp)
  - Messages sent (from messages table, `createdAt` timestamp)
  - Status changes (tracked through case `updatedAt` field)

The timeline demonstrates **event sourcing principles** where the system maintains a historical record of all case activities, enabling lawyers to quickly understand case progression without sifting through individual tabs.

### Tab 2: Documents - File Management System

The Documents tab (`DocumentsTab.svelte`) integrates with a secure file storage system:

**Upload Flow:**
1. User drags file or clicks upload button
2. `UploadDocumentModal.svelte` performs client-side validation:
   - File type whitelist (PDF, DOC, DOCX, JPG, PNG, TXT)
   - File size limit (10MB maximum)
   - Visual preview of selected file
3. File sent as multipart form data to `/api/documents/upload`
4. Server performs additional validation:
   - MIME type verification (prevents disguised file types)
   - Filename sanitization (removes special characters, prevents path traversal attacks)
5. Unique filename generated: `{timestamp}-{sanitized-name}`
6. Directory created if needed: `/uploads/cases/{caseId}/`
7. File saved to filesystem
8. Database record created linking file to case and uploader
9. Document appears in tab with download capability

**Download Flow:**
1. User clicks download button
2. Request sent to `/api/documents/[id]`
3. Server verifies user has access (lawyer owns case OR client owns case)
4. File streamed from filesystem with proper headers:
   - `Content-Type` for browser rendering
   - `Content-Disposition: attachment` to force download
   - `Content-Length` for progress tracking

**Delete Flow:**
1. Lawyer clicks delete button (with confirmation dialog)
2. DELETE request to `/api/documents/[id]/delete`
3. Server verifies lawyer owns the case
4. File removed from filesystem
5. Database record deleted
6. UI updates to remove document from list

This **dual-layer security model** (database records + filesystem storage) ensures files are both logically and physically separated by case.

### Tab 3: Invoices - Financial Management

The Invoices tab (`InvoicesTab.svelte`) manages billing with a status-driven workflow:

**Invoice States:**
- **Unpaid**: Initial state, full amount due
- **Paid**: Fully satisfied, `paidAt` timestamp set
- **Cancelled**: Voided invoice, no payment expected

**Creation Flow:**
1. Lawyer clicks "Create Invoice"
2. Modal presents form with:
   - Description textarea (services rendered)
   - Amount input (USD, validated as positive number, formatted with $ prefix)
   - Due date picker (calendar widget, defaults to +30 days)
   - Status selector (Unpaid, Paid, Cancelled)
   - Optional invoice file upload
3. Preview section shows formatted data with client name and case title
4. Submission to `/api/invoices` includes:
   - Amount conversion from dollars to cents (avoiding floating-point errors)
   - Timestamp generation
   - Status initialization
5. Database record created with `paidAmount = 0` for unpaid invoices
6. Invoice appears in tab with summary calculations:
   - Total invoiced (sum of all invoice amounts)
   - Total paid (sum of `paidAmount` fields)
   - Outstanding balance (difference)

**Invoice Management:**
- **View Details**: Displays full invoice information
- **Edit**: Available for unpaid invoices only
- **Delete**: With confirmation, prevents deletion of paid invoices

This **financial tracking system** provides lawyers with real-time visibility into accounts receivable and enables proper billing documentation.

### Tab 4: Messages - Communication Hub

The Messages tab (`MessagesTab.svelte`) implements a threaded conversation system:

**Message Architecture:**
- Messages stored with `caseId`, `senderId`, `recipientId`
- Recipient automatically determined based on case relationship:
  - If sender is lawyer → recipient is client
  - If sender is client → recipient is lawyer
- Optional `attachmentDocumentId` links to uploaded documents
- `readAt` timestamp tracks message status (null = unread)

**Real-time Updates:**
When the messages tab loads, the system:
1. Fetches all messages for the case (ordered chronologically)
2. Joins with users table to get sender names and roles
3. Joins with documents table for attachment information
4. **Automatically marks unread messages as read** where `recipientId = current user`
5. Updates unread count across the system

**Visual Presentation:**
- Sender messages align right (lawyer's messages when lawyer viewing)
- Recipient messages align left (client's messages when lawyer viewing)
- Timestamps displayed in relative format ("2 hours ago")
- Read/unread indicators for message status
- Attachments shown inline with file icons and download links
- Auto-scroll to bottom ensures latest messages visible
- Character counter for message composition

**Message Input Area:**
- Textarea for message composition
- Attach file button (links to existing case documents)
- Send button with loading state
- Character count display

This **context-aware messaging system** keeps all case-related communication in one thread, eliminating the need for external email trails and ensuring all stakeholders can track conversation history.

---

## Phase 3: Document Security Architecture

### Multi-Layer Security Model

The document management system implements defense-in-depth security:

**Layer 1: Path Validation**
- Filename sanitization removes `../`, `./`, and special characters
- Prevents directory traversal attacks
- Unique timestamp prefix prevents filename collisions
- Whitelist approach for allowed characters

**Layer 2: Access Control**
- Every document request verified against case ownership
- Users can only access documents from their own cases
- Admins have full access across all cases
- Database query ensures user-case relationship before file access

**Layer 3: Filesystem Isolation**
- Documents stored in case-specific directories: `/uploads/cases/{caseId}/`
- Even if access control fails, directory structure limits exposure
- `.gitignore` entry prevents accidental version control inclusion
- Separate upload directory outside web root

**Layer 4: MIME Type Validation**
- Server checks actual file content, not just extension
- Prevents malicious files disguised with safe extensions
- Whitelist approach (only allow known-safe types)
- Validates on both client and server side

**Layer 5: File Size Limits**
- 10MB maximum enforced on client and server
- Prevents denial-of-service through large uploads
- Progress tracking for user feedback
- Graceful error handling for exceeded limits

This **defense-in-depth strategy** ensures that even if one security layer fails, others remain in place to prevent unauthorized access or malicious uploads.

---

## Phase 4: Invoice Lifecycle Management

### State Machine Design

Invoices follow a state machine pattern with three primary states:

```
Unpaid → Paid
   ↓
Cancelled
```

**State Transitions:**
- **Unpaid → Paid**: Payment processed, `paidAmount` updated, `paidAt` timestamp set
- **Unpaid → Cancelled**: Invoice voided, no payment expected
- **Paid → [terminal]**: No transitions allowed from paid state

**Business Rules:**
- Cannot edit or delete paid invoices (maintain financial records)
- Can edit or delete unpaid invoices
- Cancelled invoices excluded from outstanding balance calculations
- All state changes tracked with timestamps

**Payment Integration Points:**
While the current implementation focuses on manual status updates, the architecture supports future Stripe integration:

1. Create PaymentIntent with invoice metadata
2. Client completes payment through Stripe Checkout
3. Webhook receives `payment_intent.succeeded` event
4. System updates invoice status and `paidAmount`
5. `paidAt` timestamp recorded
6. Client receives confirmation email

The invoice table's optional `stripePaymentIntentId` field is already provisioned for this integration, demonstrating **forward-thinking design** that anticipates future requirements without over-engineering current needs.

---

## Phase 5: Messaging System Architecture

### Bidirectional Communication Model

The messaging system implements a **bidirectional communication pattern** where both lawyers and clients have equal ability to initiate and respond to conversations, but all messages remain tied to specific cases.

**Message Flow Architecture:**

**Sending a Message:**
1. User types message in textarea
2. Optional: Attaches existing document via dropdown
3. Submits to `/api/messages` POST endpoint
4. Server validates:
   - User has access to the case
   - Message content is non-empty
   - Attachment (if provided) belongs to this case
5. Recipient auto-determined from case relationship
6. Database record created with `readAt = null`
7. Message appears in thread immediately (optimistic UI)

**Reading Messages:**
1. User opens Messages tab
2. GET request to `/api/messages?caseId={id}`
3. Server loads messages with joins:
   - Sender information (name, role)
   - Attachment details (filename, size)
4. Messages ordered chronologically (oldest to newest)
5. **Automatic read-marking**: Server updates `readAt` timestamp for all messages where `recipientId = current user AND readAt IS NULL`
6. UI displays messages with read/unread indicators

**Polling Strategy:**
To provide near-real-time updates without WebSocket complexity:
- Every 5 seconds, client polls `/api/messages/unread-count`
- Server returns count of unread messages per case
- UI updates badge counts on dashboard and case cards
- When user opens Messages tab, full message list refreshed
- Polling stops when user logs out or closes browser

This **polling-based approach** provides acceptable real-time performance for a law firm context where message volume is typically low and messages are not time-critical, while avoiding the infrastructure complexity and scaling challenges of WebSocket connections.

---

## Phase 6: Client Dashboard - The Mirror View

### Symmetrical but Restricted Architecture

The client dashboard mirrors the lawyer dashboard's structure but with **read-oriented permissions**:

**Client Dashboard (`/dashboard/client`):**
- **Stats Overview**:
  - Active cases (where `clientId = user.id`)
  - Unread messages count
  - Unpaid invoices count
  - Documents uploaded count (tracking contributions)
  
**Key Differences from Lawyer View:**
- Clients **cannot create** cases (only lawyers initiate)
- Clients **cannot create** invoices (only lawyers bill)
- Clients **can upload** documents (contributing to their case)
- Clients **can send** messages (equal communication rights)
- Clients **can view** all case details (transparency)
- No case filtering (typically have fewer cases)

**Quick Actions Section:**
- "Message Lawyer" button (navigates to most recent active case)
- "Upload Document" button (quick document contribution)
- "View Invoices" button (see outstanding payments)

**Your Cases Section:**
- Cases displayed as cards (not list view)
- Each card shows:
  - Case title
  - Assigned lawyer name
  - Status badge
  - Unread message indicator
  - Last updated timestamp
  - Click to view full details

**Recent Documents Section:**
- Last 5 documents uploaded across all cases
- Quick access to recent contributions
- Shows case association

**Outstanding Invoices Section:**
- Unpaid invoices with amounts and due dates
- Sorted by due date (urgent first)
- Direct payment links (future integration)

**Client Case Detail Page:**
The client's case detail page (`/dashboard/client/case/[id]`) uses the **same tabbed structure** as the lawyer view but with different permissions:

- **Overview Tab**: Read-only description display, case status visible
- **Documents Tab**: View, download, and **upload** (clients contribute evidence)
- **Invoices Tab**: View details, see payment status, **pay** (future Stripe integration)
- **Messages Tab**: Full read/write access, can send messages and view history

This **symmetrical architecture** means both codebases share similar structures and components, reducing maintenance burden while enforcing role-based permissions at the API layer rather than duplicating UI logic.

---

## Phase 7: Filtering & Search Architecture

### Hybrid Filtering Approach

The system employs a **hybrid filtering approach** optimized for typical law firm case volumes:

**Filter Mechanisms:**

**Status Checkboxes** (Client-Side):
- All / Open / Closed / Archived
- Filters applied to already-loaded case list
- Instant visual feedback
- No server round-trip required
- Works well for typical lawyer caseload (50-200 cases)
- Implemented with JavaScript array filtering

**Client Filter** (Server-Side):
- Searchable dropdown of all clients
- Selected client filters case list via server query
- Reduces dataset for lawyers with many clients
- Database query: `WHERE clientId = {selectedId}`
- Returns filtered case list with related data

**Text Search** (Debounced Server-Side):
- 500ms debounce delay (prevents query on every keystroke)
- Searches across:
  - Case title (primary match)
  - Client name (join with users table)
  - Case description (secondary match)
- Uses SQL `LIKE` or full-text search depending on database
- Returns filtered case list with result count
- Maintains current filter selections

**Sort Options:**
- Most recent (default, `ORDER BY updatedAt DESC`)
- Oldest (`ORDER BY updatedAt ASC`)
- Title A-Z (`ORDER BY title ASC`)
- Title Z-A (`ORDER BY title DESC`)
- Applied after filtering, before display

**Results Display:**
- Shows result count: "Showing 15 of 127 cases"
- Clear search button to reset filters
- Maintains filter state during navigation
- Visual indication of active filters

This **progressive complexity model** ensures simple operations are fast (client-side) while complex queries leverage the database (server-side), providing optimal performance across different use cases.

---

## Phase 8: Case Lifecycle Management

### Status-Driven Workflow

Cases progress through a defined lifecycle managed by status transitions:

**Status Progression:**
```
Open → Closed → Archived
```

**Status Meanings:**
- **Open**: Active work in progress, lawyer available for communication, appears in active filters
- **Closed**: Case concluded, final invoices sent, limited activity expected, still visible in default views
- **Archived**: Historical record, read-only access, removed from default filters, accessible via "Show Archived" filter

**Update Mechanisms:**

**Inline Title Editing:**
- Click title → Input field appears inline
- Edit text → Auto-save on blur or Enter key
- PATCH to `/api/cases/[id]` with `{title: newValue}`
- Success → Title updates, `updatedAt` timestamp refreshed
- Failure → Reverts to previous value, error toast shown
- Loading indicator during save
- This **optimistic UI pattern** provides instant feedback while maintaining data integrity

**Status Dropdown:**
- Click status badge → Dropdown menu appears
- Select new status → Confirmation dialog (especially for Closed/Archived)
- PATCH to `/api/cases/[id]` with `{status: newValue}`
- Success → Badge updates, case may filter out of view
- Triggers timeline event creation
- Updates affect dashboard statistics

**Archival Instead of Deletion:**
Rather than deleting cases (which would orphan documents, invoices, and messages), the system uses **soft deletion through archival**:

- Archived cases remain in database with full data
- Excluded from default dashboard views and statistics
- Accessible through "Show Archived" checkbox filter
- Maintains data integrity for regulatory compliance
- Preserves case history for potential future reference
- Can be "unarchived" by changing status back to Open/Closed

**Cascade Rules:**
- Documents: Remain accessible for archived cases
- Invoices: All financial records preserved
- Messages: Complete communication history maintained
- No data deletion occurs during archival

This **compliance-aware design** recognizes that law firms must maintain records for regulatory requirements, malpractice insurance purposes, and potential future litigation needs.

---

## Phase 9: Notification System Architecture

### Polling-Based Real-Time Updates

The notification system provides near-real-time awareness without WebSocket infrastructure:

**Unread Badge Component:**
`UnreadBadge.svelte` is a reusable component that:
- Accepts a count prop (number)
- Displays red badge only if count > 0
- Shows count number if count ≤ 99, else shows "99+"
- Positioned absolutely on top-right of parent element
- Pulsing animation for counts > 0
- Accessible with ARIA labels

**Badge Placement:**
- Dashboard stats card (total unread count across all cases)
- Case cards in list view (per-case unread count)
- Messages tab header (unread for current case)
- Navigation sidebar (global unread indicator)

**Polling Service:**
`message-polling.ts` implements a polling utility:

```typescript
// Conceptual implementation
function startPolling(userId) {
  const interval = setInterval(async () => {
    try {
      const response = await fetch('/api/messages/unread-count');
      const counts = await response.json(); // {caseId: unreadCount}
      updateStore(counts); // Updates global state
      updateBadges(); // Triggers UI re-render
    } catch (error) {
      console.error('Polling failed:', error);
      // Continue polling despite errors
    }
  }, 5000); // 5 second interval
  
  return () => clearInterval(interval); // Cleanup function
}
```

**Lifecycle Management:**
- Polling starts when user navigates to dashboard
- Continues while user navigates within dashboard
- Stops when user logs out or closes browser tab
- Automatically resumes on page refresh (if still logged in)
- Cleanup on component unmount prevents memory leaks

**Performance Considerations:**
- 5-second interval balances responsiveness with server load
- Database query optimized with index on `recipientId` and `readAt`:
  ```sql
  SELECT caseId, COUNT(*) as count 
  FROM messages 
  WHERE recipientId = ? AND readAt IS NULL 
  GROUP BY caseId
  ```
- Response payload minimal: `{caseId: unreadCount}` pairs
- 100 concurrent users = 20 requests/second (manageable load)

**Visual Feedback:**
- Badge appears/disappears based on count
- Color: Red for urgency
- Animation: Subtle pulse for new messages
- Dismisses automatically when messages read

This **polling architecture** provides acceptable real-time performance for law firm context (messages typically not time-critical) while avoiding WebSocket complexity, scaling challenges, and infrastructure overhead.

---

## Phase 10: Testing Strategy

### Three-Tier Testing Approach

The testing plan employs a **layered testing strategy** ensuring system reliability:

**Layer 1: Lawyer Flow Testing**

**Case Creation:**
- Create case with valid data (all required fields)
- Validate required field enforcement (client, title, description)
- Verify case appears in list after creation
- Test client dropdown search functionality
- Verify initial status set correctly
- Check timestamps generated properly

**Case Detail View:**
- All tabs load correctly with proper data
- Can edit title inline with save/cancel
- Can edit description with save/cancel
- Can change status via dropdown
- Overview tab shows accurate statistics
- Timeline displays events in correct order

**Document Upload:**
- Valid file types accepted (PDF, DOC, DOCX, JPG, PNG, TXT)
- Invalid types rejected with clear error
- File size limits enforced (10MB max)
- Upload progress shown correctly
- Document appears in list after upload
- Download works correctly
- Delete works with confirmation

**Invoice Creation:**
- Create invoice with valid data
- Amount validation (positive numbers only)
- Date picker works correctly
- Preview shows formatted data
- Invoice appears in tab after creation
- Summary calculations correct
- Edit unpaid invoice works
- Cannot edit paid invoice
- Delete unpaid invoice with confirmation

**Messaging:**
- Send message to client
- Receive reply from client
- Attachments display correctly
- Read/unread status updates
- Auto-scroll to bottom works
- Character counter accurate

**Layer 2: Client Flow Testing**

**Dashboard View:**
- Cases display correctly
- Stats calculations accurate
- Only own cases visible
- Quick actions work correctly
- Recent documents show correct data
- Outstanding invoices accurate

**Case Detail:**
- Can view all case information
- Can view documents and download
- Can upload documents to case
- Can view invoices with amounts
- Cannot edit case details (read-only)
- Can send messages to lawyer
- Message history displays correctly

**Permissions:**
- Cannot access other clients' cases (403 error)
- Cannot create cases (no button/endpoint access)
- Cannot create invoices (no button/endpoint access)
- Cannot delete documents (no delete button)
- Cannot edit case status or description

**Layer 3: Access Control Testing**

**Authorization Boundaries:**
- Lawyers cannot access other lawyers' cases
- Attempt returns 403 Forbidden
- Dashboard only shows own cases
- API endpoints enforce ownership

**Cross-Client Isolation:**
- Clients cannot access other clients' cases
- Direct URL access blocked with 403
- No data leakage in API responses
- Search results filtered by access

**Admin Privileges:**
- Admins can access all cases regardless of lawyer
- Can view all documents, invoices, messages
- Full system visibility for support purposes
- Proper admin role verification

**Concurrent Access:**
- Multiple users accessing same case simultaneously
- Message polling doesn't create race conditions
- Document upload/download handles concurrency
- Status updates don't conflict

**Error Handling:**
- Invalid case IDs return 404 Not Found
- Unauthorized access returns 403 Forbidden
- Missing required fields return 400 Bad Request
- Server errors return 500 with generic message

**Security Testing Checklist:**
- Path traversal attempts blocked (../../etc/passwd)
- SQL injection attempts sanitized
- File upload restrictions enforced
- Session hijacking prevented (httpOnly cookies)
- CSRF tokens validated (if implemented)
- XSS prevented (input sanitization)
- Rate limiting on API endpoints

This **comprehensive testing matrix** ensures both functional correctness and security compliance, covering happy paths, edge cases, and malicious attempts.

---

## Data Flow Summary

### Complete User Journey: Lawyer Creates Case, Client Responds

**Step 1: Lawyer Creates Case**
```
Browser → POST /api/cases {clientId, title, description, status}
       → Database INSERT cases table
       → Database SELECT JOIN users for client info
       ← Case Object + Client Info (JSON)
Browser updates → New case appears in dashboard list
```

**Step 2: Client Logs In**
```
Browser → GET /dashboard/client
       → Database SELECT cases WHERE clientId = user.id
       → Database aggregate queries for stats
       ← Cases List + Stats + Documents + Invoices (JSON)
Browser renders → Dashboard with cases, stats, quick actions
```

**Step 3: Client Views Case**
```
Browser → GET /dashboard/client/case/[id]
       → Database SELECT case, verify clientId = user.id
       → Database parallel queries:
          - Lawyer information
          - Case documents
          - Case invoices
          - Case messages
       ← Case + Lawyer + Documents + Invoices + Messages (JSON)
Browser renders → Tabbed case detail page
```

**Step 4: Client Uploads Document**
```
Browser → POST /api/documents/upload (multipart/form-data)
       → Server validates file type and size
       → Filesystem save to /uploads/cases/{caseId}/
       → Database INSERT documents table
       ← Document metadata (JSON)
Browser updates → Document appears in Documents tab
Case updatedAt → Refreshed timestamp
```

**Step 5: Lawyer Receives Notification**
```
Polling → GET /api/messages/unread-count (every 5s)
       → Database COUNT messages WHERE recipientId AND readAt IS NULL
       ← {caseId: 0} (no unread messages)
Note: Document upload doesn't create message, but case updatedAt changed
Dashboard → "Last updated" timestamp refreshes on next load
```

**Step 6: Lawyer Creates Invoice**
```
Browser → POST /api/invoices {caseId, amount, description, dueDate}
       → Database INSERT invoices table (status: unpaid)
       → Case updatedAt timestamp refreshed
       ← Invoice object (JSON)
Browser updates → Invoice appears in Invoices tab
Client dashboard → Outstanding invoices count increases (on next poll)
```

**Step 7: Client Views Invoice**
```
Polling → GET /api/messages/unread-count
Browser → Refresh case view (user navigates)
       → Database query includes invoices
       ← Updated data with new invoice
Browser renders → New invoice visible in Invoices tab
```

**Step 8: Client Sends Message**
```
Browser → POST /api/messages {caseId, content}
       → Database INSERT messages table
       → recipientId auto-set to lawyer
       → readAt = null (unread)
       ← Message object with sender info (JSON)
Browser updates → Message appears in thread
Case updatedAt → Timestamp refreshed
```

**Step 9: Lawyer Receives Message**
```
Polling → GET /api/messages/unread-count (after 0-5s delay)
       → Database COUNT unread messages
       ← {caseId: 1} (one unread message)
Badge → Updates to show "1" on case card and dashboard
Visual → Red badge pulsing on affected case
```

**Step 10: Lawyer Opens Messages Tab**
```
Browser → GET /api/messages?caseId={id}
       → Database SELECT messages JOIN users
       → Database UPDATE messages SET readAt WHERE recipientId
       ← Messages array (JSON)
Browser renders → Message thread with new message
Badge → Updates to show "0" (auto-marked as read)
Next poll → Returns {caseId: 0}
```

This **circular workflow** demonstrates how the system facilitates continuous lawyer-client collaboration around case-centric work, with proper state management, real-time notifications, and data integrity throughout the entire process.

---

## Technical Architecture Decisions

### Why This Architecture?

**1. Case-Centric Organization**
- **Benefit**: Natural mental model matches legal practice
- **Alternative**: User-centric (messages between users, not cases)
- **Rationale**: Legal work is fundamentally organized by cases/matters, not relationships. Lawyers think "What's the status of the Smith case?" not "What did I discuss with Mr. Smith?"

**2. Server-Side Rendering (SSR) with SvelteKit**
- **Benefit**: SEO-friendly, faster initial page load, progressive enhancement
- **Alternative**: Client-side SPA with separate API backend
- **Rationale**: SvelteKit SSR provides best of both worlds—fast initial render with server data, then hydrates to SPA-like experience. Forms work without JavaScript.

**3. Polling vs WebSockets for Notifications**
- **Benefit**: Simpler infrastructure, easier to debug, works through corporate firewalls
- **Alternative**: WebSocket connections for true real-time
- **Rationale**: Law firm message volume is low (< 100 messages/day typical), 5-second delay is acceptable, infrastructure much simpler, no sticky session requirements

**4. Filesystem Storage vs Cloud (S3/Azure)**
- **Benefit**: No ongoing storage costs, faster access, easier backup
- **Alternative**: Cloud object storage
- **Rationale**: Law firms typically have moderate file volumes (< 1TB), local storage sufficient until scale requires cloud, can migrate later without changing API

**5. Soft Delete (Archive) vs Hard Delete**
- **Benefit**: Regulatory compliance, data recovery, audit trail
- **Alternative**: Hard delete with cascade
- **Rationale**: Legal industry requires record retention (often 7+ years), archives maintain history, malpractice insurance requires documentation

**6. Monolithic Architecture vs Microservices**
- **Benefit**: Simpler deployment, easier development, shared database transactions
- **Alternative**: Separate services for documents, invoicing, messaging
- **Rationale**: Law firm scale doesn't justify microservices complexity (< 1000 users typical), monolith appropriate, can decompose later if needed

**7. SQL (Turso/SQLite) vs NoSQL (MongoDB/Firestore)**
- **Benefit**: ACID transactions, relational integrity, complex joins
- **Alternative**: Document database for flexibility
- **Rationale**: Case management requires strict relationships and consistency, referential integrity critical, SQL optimal for structured data

**8. Modal Forms vs Separate Pages**
- **Benefit**: Maintains context, faster interaction, no navigation
- **Alternative**: Separate pages for case/invoice creation
- **Rationale**: Legal professionals value context maintenance, modals keep them on the page, reduces mental context switching

---

## Scalability Considerations

### Current Architecture Limits

**Database (Turso/SQLite):**
- Suitable for < 100,000 cases
- Single-table queries performant up to millions of rows
- Complex joins may slow at very high volumes
- **Migration path**: Switch to PostgreSQL at 50,000+ cases

**File Storage (Local Filesystem):**
- Suitable for < 1TB documents
- Backup becomes challenging beyond this
- Single server limitation
- **Migration path**: Move to S3/Azure with signed URLs, update document URLs in database

**Polling for Notifications:**
- 5-second interval creates constant server load
- Each polling request = database query
- 100 concurrent users = 20 requests/second (manageable)
- 1000 users = 200 requests/second (high load)
- **Migration path**: Implement WebSockets or Server-Sent Events

**Session Management:**
- Cookie-based sessions scale linearly with users
- Database lookup on every request
- No special scaling requirements until thousands of concurrent users
- **Migration path**: Redis session store if horizontal scaling needed

**Search Performance:**
- SQL LIKE queries slow on large tables
- Full-text search needed beyond 10,000 cases
- **Migration path**: Implement Elasticsearch or PostgreSQL full-text search

### Growth Path

**Phase 1: 0-50 lawyers (0-5,000 cases)**
- Current architecture sufficient
- Single server deployment
- Local filesystem storage
- SQLite database

**Phase 2: 50-200 lawyers (5,000-20,000 cases)**
- Add database indexes on frequently queried fields
- Optimize N+1 query patterns
- Consider database connection pooling
- Monitor query performance

**Phase 3: 200-500 lawyers (20,000-50,000 cases)**
- Migrate to PostgreSQL for better concurrency
- Add Redis caching layer for frequently accessed data
- Implement full-text search
- Consider CDN for static assets

**Phase 4: 500+ lawyers (50,000+ cases)**
- Horizontal scaling with load balancer
- Move documents to cloud storage (S3/Azure)
- Implement WebSockets for real-time notifications
- Consider microservices for documents/messaging
- Database read replicas for reporting

---

## Security Architecture

### Authentication Flow

**Registration:**
1. User submits registration form
2. For lawyers: Must provide access code `k1ngl4w`
3. Server validates:
   - Email format and uniqueness
   - Password strength (min 8 chars, complexity rules)
   - Access code (for lawyers)
4. Password hashed with Argon2 (resistant to GPU/ASIC attacks)
5. User record created in database with role
6. Session token generated (cryptographically random, 32 bytes)
7. Session stored in database with expiration (30 days default)
8. Session cookie set (httpOnly, secure in production, sameSite)
9. Redirect to role-appropriate dashboard

**Login:**
1. User submits username/password
2. Server looks up user by username
3. Password verified with Argon2
4. Failed attempts tracked (rate limiting after 5 failures)
5. Session created and cookie set
6. Redirect to role-appropriate dashboard

**Session Validation (on every protected request):**
1. Cookie parsed from request headers
2. Session token looked up in database
3. Expiration checked (reject if expired)
4. User data loaded into `locals.user`
5. Routes verify role requirements
6. Session refreshed on activity (sliding expiration)

**Logout:**
1. Session deleted from database
2. Cookie cleared (set to expired)
3. Redirect to login page

### Authorization Patterns

**Resource Access Control:**
```typescript
// Pseudo-code representation
async function loadCase(caseId, userId, userRole) {
  const caseRecord = await db.query(
    'SELECT * FROM cases WHERE id = ?',
    [caseId]
  );
  
  if (!caseRecord) {
    throw Error(404, 'Case not found');
  }
  
  // Admin has full access
  if (userRole === 'admin') {
    return caseRecord;
  }
  
  // Owner access (lawyer or client)
  if (caseRecord.lawyerId === userId || caseRecord.clientId === userId) {
    return caseRecord;
  }
  
  // Unauthorized
  throw Error(403, 'Unauthorized');
}
```

**Action Authorization Matrix:**

| Action | Lawyer (Owner) | Lawyer (Other) | Client (Owner) | Client (Other) | Admin |
|--------|---------------|----------------|----------------|----------------|-------|
| Create Case | ✅ | ✅ | ❌ | ❌ | ✅ |
| View Case | ✅ | ❌ | ✅ | ❌ | ✅ |
| Edit Case | ✅ | ❌ | ❌ | ❌ | ✅ |
| Archive Case | ✅ | ❌ | ❌ | ❌ | ✅ |
| Upload Document | ✅ | ❌ | ✅ | ❌ | ✅ |
| Delete Document | ✅ | ❌ | ❌ | ❌ | ✅ |
| Create Invoice | ✅ | ❌ | ❌ | ❌ | ✅ |
| View Invoice | ✅ | ❌ | ✅ | ❌ | ✅ |
| Send Message | ✅ | ❌ | ✅ | ❌ | ✅ |
| View Messages | ✅ | ❌ | ✅ | ❌ | ✅ |

This **role-based access control (RBAC)** with **resource ownership verification** ensures proper data isolation and prevents unauthorized access at multiple levels.

---

## Conclusion

The King Law Firm case management system demonstrates thoughtful architectural choices that balance:

- **Simplicity** vs **Scalability**: Simple enough for small firms, scalable to medium size
- **Security** vs **Usability**: Secure by default, but not burdensome to users
- **Features** vs **Complexity**: Rich feature set without overwhelming interface
- **Present needs** vs **Future growth**: Built for today, extensible for tomorrow

The **case-centric architecture** provides a natural organizational model that matches how legal professionals think about their work. The **symmetrical dashboard pattern** (lawyer/client mirrors) reduces cognitive load while maintaining clear permission boundaries. The **defense-in-depth security model** ensures data protection at multiple layers.

### Key Architectural Strengths

**Data Integrity:**
- Relational database ensures referential integrity
- Soft deletion preserves history
- Timestamps track all changes
- No orphaned records

**User Experience:**
- Fast initial page loads (SSR)
- Optimistic UI updates (perceived performance)
- Progressive enhancement (works without JS)
- Clear visual feedback (loading states, errors)

**Security:**
- Multi-layer authentication
- Resource-level authorization
- Input validation (client and server)
- File security (path validation, MIME checking)

**Maintainability:**
- Shared components (lawyer/client dashboards)
- Consistent patterns (server loads, API endpoints)
- Clear separation of concerns (UI/business logic/data)
- Comprehensive error handling

**Scalability:**
- Clear migration paths identified
- Performance bottlenecks understood
- Gradual enhancement possible
- No architectural dead ends

Most importantly, the system architecture **enables the core mission**: facilitating effective collaboration between lawyers and clients around legal cases, with proper organization, security, and transparency. The system reduces administrative burden, improves communication, and ensures all case-related information is accessible in one centralized location.
