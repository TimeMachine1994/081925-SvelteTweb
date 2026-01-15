# King Law Firm - Phase Two Implementation Plan

## Overview
Phase Two focuses on the messaging system, case management workflows, and the "no case" state for new clients.

---

## Implementation Status Legend
- [x] Completed
- [ ] Not started

---

## 1. Messaging System Core

### 1.1 Message Capabilities
- [x] 1.1.1 Send text messages (client ↔ lawyer)
- [x] 1.1.2 Attach documents to messages (documents visible in thread)
- [x] 1.1.3 Receive messages with clickable document links
- [x] 1.1.4 Messages are always associated with a case OR marked as "uncategorized"

### 1.2 Chat UI Improvements
- [x] 1.2.1 Position chat toggle button below navbar on right side
- [x] 1.2.2 Add vertical indicator bar showing chat is available
- [x] 1.2.3 Message input textarea with send button
- [x] 1.2.4 Display document attachments inline in message thread

---

## 2. Case Management

### 2.1 Case Creation (Attorney)
- [x] 2.1.1 Attorney can create a new case (API exists)
- [x] 2.1.2 Attorney can assign client(s) to a case
- [x] 2.1.3 Attorney can create case from uncategorized messages/documents (API exists)
- [x] 2.1.4 When case is created, existing thread/files move under that case

### 2.2 Case Selection (Client)
- [x] 2.2.1 If client has **multiple cases** → show case dropdown selector
- [x] 2.2.2 If client has **one case** → auto-select that case
- [x] 2.2.3 If client has **zero cases** → no selector, send as "uncategorized"

### 2.3 Case Visibility
- [x] 2.3.1 New cases appear in client's "Your Cases" section
- [x] 2.3.2 Cases display as clickable rows
- [x] 2.3.3 Clicking a case opens the Case Detail Window

---

## 3. "No Case Yet" State

### 3.1 Client Without Cases
- [x] 3.1.1 Client can click "Send Message" button
- [x] 3.1.2 Message dropdown opens for composing
- [x] 3.1.3 Client can send text messages (uncategorized)
- [x] 3.1.4 Client can upload/attach documents (uncategorized)

### 3.2 Uncategorized Items (Attorney View)
- [x] 3.2.1 Attorney sees "Uncategorized" section in dashboard
- [x] 3.2.2 Shows threads/files not attached to any case
- [x] 3.2.3 Attorney can view and respond to uncategorized messages
- [x] 3.2.4 Attorney can convert uncategorized thread into a new case

---

## 4. Case Detail Window

### 4.1 Layout
- [x] 4.1.1 Opens when clicking a case row
- [x] 4.1.2 Similar to dashboard but **without** top stats cards
- [x] 4.1.3 Clean, focused view for single case

### 4.2 Case Content Sections
- [x] 4.2.1 Recent Documents (for this case)
- [x] 4.2.2 Invoices (for this case)
- [x] 4.2.3 Message thread (for this case)
- [x] 4.2.4 Ability to send messages within case context

---

## 5. Client Dashboard Updates

### 5.1 Your Cases Section
- [x] 5.1.1 Display all client's cases as clickable rows
- [x] 5.1.2 Show case title, status, last activity
- [x] 5.1.3 Click to open Case Detail Window

### 5.2 Messaging Integration
- [x] 5.2.1 Chat slider accessible from dashboard
- [x] 5.2.2 Case selector in chat (if multiple cases)
- [x] 5.2.3 View messages/documents per case

---

## 6. Attorney Dashboard Updates

### 6.1 Client Management
- [x] 6.1.1 Simple interface to view all clients
- [x] 6.1.2 Click client to open profile
- [x] 6.1.3 View client's cases from profile
- [x] 6.1.4 Click case to open Case Detail Window

### 6.2 Content Organization
- [x] 6.2.1 View case-linked threads/files
- [x] 6.2.2 View uncategorized threads/files
- [x] 6.2.3 Transfer chat/document to different case (API exists)
- [x] 6.2.4 Copy chat/document to different case (API exists)

---

## 7. Database Considerations

### 7.1 Message Schema
- [x] 7.1.1 Messages can have `caseId = null` (uncategorized)
- [x] 7.1.2 Documents can have `caseId = null` (uncategorized)
- [x] 7.1.3 Support reassigning caseId when attorney creates case

### 7.2 Case Assignment
- [x] 7.2.1 Bulk update messages when assigned to case
- [x] 7.2.2 Bulk update documents when assigned to case

---

## 8. Lawyer Dashboard - Messaging Features (NEW)

### 8.1 Compose New Message
- [x] 8.1.1 "New Message" button on lawyer dashboard
- [x] 8.1.2 Modal/dropdown to select recipient (client dropdown)
- [x] 8.1.3 Option to select case OR send uncategorized
- [x] 8.1.4 Send message to selected client

### 8.2 View Incoming Messages
- [x] 8.2.1 Unread message indicator with count
- [x] 8.2.2 Click unread count → opens message view
- [x] 8.2.3 Mark messages as read when viewed
- [x] 8.2.4 Reply to messages inline

### 8.3 Uncategorized Thread Actions
- [x] 8.3.1 View full uncategorized thread in modal
- [x] 8.3.2 Reply to uncategorized thread
- [x] 8.3.3 "Create Case from Thread" button handler
- [x] 8.3.4 Case creation modal with title/description inputs

---

## 9. Lawyer Dashboard - Invoice System (NEW)

### 9.1 Invoice API
- [x] 9.1.1 POST /api/invoices - Create invoice
- [x] 9.1.2 GET /api/invoices - List invoices (by case or all)
- [x] 9.1.3 PATCH /api/invoices/[id] - Update invoice status
- [x] 9.1.4 DELETE /api/invoices/[id] - Delete invoice

### 9.2 Create Invoice UI
- [x] 9.2.1 "Create Invoice" button on lawyer dashboard
- [x] 9.2.2 Invoice form modal:
  - Client/Case selector dropdown
  - Amount input (dollar amount)
  - Description text input
  - Due date picker
  - Optional file attachment input
- [x] 9.2.3 Submit invoice → saves to DB
- [x] 9.2.4 Invoice appears in client's dashboard

### 9.3 Invoice Management
- [x] 9.3.1 View all invoices on lawyer dashboard
- [x] 9.3.2 Filter invoices by status (unpaid/partial/paid)
- [x] 9.3.3 Edit invoice details
- [x] 9.3.4 Mark invoice as paid manually

---

## 10. Lawyer Dashboard - Case Management UI (NEW)

### 10.1 New Case Creation
- [x] 10.1.1 "New Case" button handler
- [x] 10.1.2 Case creation modal:
  - Client selector dropdown
  - Case title input
  - Description textarea
  - Status selector (active/pending)
- [x] 10.1.3 Submit → creates case via API
- [x] 10.1.4 Redirect to new case detail page

### 10.2 Case List Improvements
- [x] 10.2.1 Sort cases by status/date
- [x] 10.2.2 Filter cases by status
- [x] 10.2.3 Search cases by title/client name

---

## 11. Document Management (NEW)

### 11.1 Document Upload (Lawyer)
- [x] 11.1.1 "Upload Document" button handler
- [x] 11.1.2 Upload modal with case selector
- [x] 11.1.3 Drag-and-drop file upload
- [x] 11.1.4 Document appears in case detail

### 11.2 Document Download
- [x] 11.2.1 Download button handler
- [x] 11.2.2 Proper file download endpoint

---

## Implementation Status: ✅ PHASE TWO COMPLETE

All Phase Two features have been implemented:

### Completed Features Summary:
- **Messaging System**: Full bidirectional messaging with document attachments
- **Case Management**: Create cases, assign clients, manage from uncategorized threads
- **Invoice System**: Full CRUD API + UI for creating/viewing invoices
- **Client Management**: Client profiles with case/document/invoice views
- **Document Management**: Upload/download with case association
- **UI Improvements**: Modals, chat slider with attachments, clickable case rows