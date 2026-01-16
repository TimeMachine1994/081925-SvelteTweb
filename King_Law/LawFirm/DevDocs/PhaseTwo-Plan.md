# King Law Firm - Phase Two Implementation Plan

## Overview
Phase Two focuses on implementing the messaging system, enhanced document management with chat integration, file upload improvements, and real-time updates.

---

## 1. Messaging System Implementation

### 1.1 Database & Schema
- **1.1.1** Message table already exists (ready to use)
  - `id`, `caseId`, `senderId`, `recipientId`, `content`, `sentAt`, `readAt`
- **1.1.2** Add message attachment support
  - **1.1.2.1** Create `messageAttachment` table
  - **1.1.2.2** Fields: `id`, `messageId`, `documentId`, `attachedAt`
  - **1.1.2.3** Foreign keys to `message` and `document` tables
- **1.1.3** Update document table schema
  - **1.1.3.1** Add `direction` field (TEXT: 'incoming' | 'outgoing')
  - **1.1.3.2** Add `messageId` field (nullable, foreign key)
  - **1.1.3.3** Add `viewedAt` field (INTEGER timestamp, nullable)
  - **1.1.3.4** Add `sharedVia` field (TEXT: 'upload' | 'message')
- **1.1.4** Generate and push schema migrations

### 1.2 Backend API Routes
- **1.2.1** Message CRUD operations
  - **1.2.1.1** `POST /api/messages` - Send new message
    - Validate user authentication
    - Verify case access
    - Create message record
    - Return created message
  - **1.2.1.2** `GET /api/messages/[caseId]` - Get case messages
    - Verify case access
    - Load messages with sender/recipient data
    - Mark as read if user is recipient
    - Return sorted by `sentAt` DESC
  - **1.2.1.3** `PATCH /api/messages/[id]/read` - Mark message as read
    - Verify user is recipient
    - Update `readAt` timestamp
    - Return updated message
- **1.2.2** Message with document attachment
  - **1.2.2.1** `POST /api/messages/with-document` - Send message with file
    - Accept multipart form data
    - Upload document to filesystem
    - Create document record
    - Create message record
    - Link document to message
    - Return message with document data

### 1.3 Client Dashboard - Messages UI
- **1.3.1** Message panel component
  - **1.3.1.1** Create `MessagePanel.svelte` component
  - **1.3.1.2** Right sidebar layout (fixed position)
  - **1.3.1.3** Collapsible/expandable panel
  - **1.3.1.4** Responsive: full screen on mobile
- **1.3.2** Message list view
  - **1.3.2.1** Display messages in chronological order
  - **1.3.2.2** Visual distinction: sent vs received
  - **1.3.2.3** Show sender name and timestamp
  - **1.3.2.4** Unread message indicator (bold, badge)
  - **1.3.2.5** Document attachment preview/download
  - **1.3.2.6** Auto-scroll to latest message
- **1.3.3** Message composition
  - **1.3.3.1** Text input field at bottom
  - **1.3.3.2** Send button (disabled if empty)
  - **1.3.3.3** Character limit indicator
  - **1.3.3.4** Attach document button
  - **1.3.3.5** File upload from composition area
- **1.3.4** Notification system
  - **1.3.4.1** Unread message count badge
  - **1.3.4.2** Display in navigation bar
  - **1.3.4.3** Update count on new messages
  - **1.3.4.4** Clear count when messages viewed
- **1.3.5** Integrate into client dashboard
  - **1.3.5.1** Load messages in `+page.server.ts`
  - **1.3.5.2** Add MessagePanel to `+page.svelte`
  - **1.3.5.3** Position on right side of dashboard
  - **1.3.5.4** Connect to active case (if multiple cases, show dropdown)

### 1.4 Lawyer Dashboard - Messages UI
- **1.4.1** Enhanced message view
  - **1.4.1.1** List all client conversations
  - **1.4.1.2** Group messages by case/client
  - **1.4.1.3** Quick client switcher
  - **1.4.1.4** Unread count per client
- **1.4.2** Message composition for lawyers
  - **1.4.2.1** Send messages to any client
  - **1.4.2.2** Attach documents from case files
  - **1.4.2.3** Quick document upload + send
- **1.4.3** Bulk operations
  - **1.4.3.1** Mark all as read
  - **1.4.3.2** Filter by read/unread
  - **1.4.3.3** Search messages by content

---

## 2. Enhanced Document Management

### 2.1 Document Direction & Metadata
- **2.1.1** Update upload API
  - **2.1.1.1** Determine direction automatically
    - If uploader is client: direction = 'outgoing'
    - If uploader is lawyer: direction = 'incoming'
  - **2.1.1.2** Set `sharedVia` to 'upload' or 'message'
  - **2.1.1.3** Link to `messageId` if sent via message
- **2.1.2** Document list UI updates
  - **2.1.2.1** Display direction badges
    - Outgoing: ↑ arrow + "Sent to Attorney" (gold)
    - Incoming: ↓ arrow + "From Attorney" (blue)
  - **2.1.2.2** Show associated message timestamp if applicable
  - **2.1.2.3** Add "Viewed" indicator with timestamp
  - **2.1.2.4** Sort chronologically by upload/message time

### 2.2 Improved Empty State
- **2.2.1** Client dashboard empty state
  - **2.2.1.1** Remove "No Documents Yet" text-only message
  - **2.2.1.2** Add centered card with:
    - Icon (folder upload)
    - Heading: "No Documents"
    - Description: "Upload documents or receive them from your attorney"
  - **2.2.1.3** Add primary action button
    - Text: "Upload Documents"
    - Click opens file picker
    - Supports multiple files
  - **2.2.1.4** Add secondary action
    - Text: "Request Documents from Attorney"
    - Sends pre-filled message
- **2.2.2** Lawyer dashboard empty state
  - **2.2.2.1** Similar card layout
  - **2.2.2.2** Action: "Upload Documents for Client"
  - **2.2.2.3** Case selector if multiple cases
- **2.2.3** Drag-and-drop zone
  - **2.2.3.1** Full empty state area is drop zone
  - **2.2.3.2** Visual feedback on drag-over
  - **2.2.3.3** Support multiple file drops
  - **2.2.3.4** Show upload progress overlay

### 2.3 Document Filtering & Organization
- **2.3.1** Filter controls
  - **2.3.1.1** "All Documents" (default)
  - **2.3.1.2** "Sent to Attorney" (outgoing only)
  - **2.3.1.3** "Received from Attorney" (incoming only)
  - **2.3.1.4** "Attached to Messages" (sharedVia = 'message')
- **2.3.2** Sort options
  - **2.3.2.1** Newest first (default)
  - **2.3.2.2** Oldest first
  - **2.3.2.3** By file name (A-Z)
  - **2.3.2.4** By file size

### 2.4 Chat-Integrated Document Display
- **2.4.1** Document list enhancement
  - **2.4.1.1** Show document cards with context
  - **2.4.1.2** Display: "Sent via message on [date]"
  - **2.4.1.3** Link to associated message (scroll to message)
  - **2.4.1.4** Show message preview text
- **2.4.2** Message thread document view
  - **2.4.2.1** Inline document preview in messages
  - **2.4.2.2** File icon + name in message bubble
  - **2.4.2.3** Download button within message
  - **2.4.2.4** Document metadata (size, type)
- **2.4.3** Document viewing tracking
  - **2.4.3.1** Mark `viewedAt` on download
  - **2.4.3.2** Show "Viewed by client" to lawyer
  - **2.4.3.3** Show "Viewed" checkmark to sender

---

## 3. File Upload Progress Indicator

### 3.1 Upload Progress UI Component
- **3.1.1** Create `UploadProgress.svelte` component
  - **3.1.1.1** Progress bar with percentage
  - **3.1.1.2** File name display
  - **3.1.1.3** File size and upload speed
  - **3.1.1.4** Cancel upload button
  - **3.1.1.5** Success/error states
- **3.1.2** Multiple file upload tracking
  - **3.1.2.1** List of files being uploaded
  - **3.1.2.2** Individual progress per file
  - **3.1.2.3** Overall progress summary
  - **3.1.2.4** Pause/resume functionality

### 3.2 Client-Side Upload Logic
- **3.2.1** XMLHttpRequest with progress events
  - **3.2.1.1** Listen to `progress` event
  - **3.2.1.2** Calculate upload percentage
  - **3.2.1.3** Estimate time remaining
  - **3.2.1.4** Handle upload completion
- **3.2.2** Chunked upload for large files
  - **3.2.2.1** Split files > 10MB into chunks
  - **3.2.2.2** Upload chunks sequentially
  - **3.2.2.3** Resume from failure point
  - **3.2.2.4** Combine chunks on server
- **3.2.3** Error handling
  - **3.2.3.1** Network error recovery
  - **3.2.3.2** File size validation (max 50MB)
  - **3.2.3.3** File type validation
  - **3.2.3.4** Retry failed uploads

### 3.3 Server-Side Upload Handling
- **3.3.1** Stream processing
  - **3.3.1.1** Use streaming API for large files
  - **3.3.1.2** Write to disk incrementally
  - **3.3.1.3** Validate during upload
  - **3.3.1.4** Clean up on failure
- **3.3.2** Chunked upload endpoint
  - **3.3.2.1** `POST /api/documents/chunk`
  - **3.3.2.2** Accept chunk number and total chunks
  - **3.3.2.3** Store chunks temporarily
  - **3.3.2.4** Combine on final chunk
  - **3.3.2.5** Create document record when complete

### 3.4 Upload UI Integration
- **3.4.1** Document upload modal
  - **3.4.1.1** Modal overlay with progress
  - **3.4.1.2** Drag-and-drop zone in modal
  - **3.4.1.3** File preview before upload
  - **3.4.1.4** Batch upload confirmation
- **3.4.2** Inline upload indicators
  - **3.4.2.1** Mini progress bar in document list
  - **3.4.2.2** Loading spinner during upload
  - **3.4.2.3** Success checkmark animation
  - **3.4.2.4** Toast notification on completion
- **3.4.3** Dashboard integration
  - **3.4.3.1** Show upload progress in sidebar
  - **3.4.3.2** Update document count in real-time
  - **3.4.3.3** Auto-refresh document list on completion

---

## 4. Real-Time Updates

### 4.1 WebSocket Infrastructure
- **4.1.1** WebSocket server setup
  - **4.1.1.1** Choose library: `ws` or `socket.io`
  - **4.1.1.2** Create WebSocket endpoint in SvelteKit
  - **4.1.1.3** Handle connections in `hooks.server.ts`
  - **4.1.1.4** Authenticate WebSocket connections
  - **4.1.1.5** Maintain connection pool by user
- **4.1.2** Connection management
  - **4.1.2.1** Auto-reconnect on disconnect
  - **4.1.2.2** Heartbeat/ping-pong mechanism
  - **4.1.2.3** Handle connection errors gracefully
  - **4.1.2.4** Clean up on user logout

### 4.2 Real-Time Message Delivery
- **4.2.1** Message broadcasting
  - **4.2.1.1** When message sent, emit to recipient's socket
  - **4.2.1.2** Include message data + sender info
  - **4.2.1.3** Update UI without refresh
  - **4.2.1.4** Play notification sound (optional)
- **4.2.2** Message status updates
  - **4.2.2.1** Broadcast "delivered" status
  - **4.2.2.2** Broadcast "read" status
  - **4.2.2.3** Show typing indicators
  - **4.2.2.4** Online/offline status

### 4.3 Real-Time Document Updates
- **4.3.1** Document upload notifications
  - **4.3.1.1** Notify recipient when document uploaded
  - **4.3.1.2** Update document list in real-time
  - **4.3.1.3** Show "New Document" badge
  - **4.3.1.4** Auto-increment document count
- **4.3.2** Document view tracking
  - **4.3.2.1** Notify sender when document viewed
  - **4.3.2.2** Update "viewed" indicator in real-time
  - **4.3.2.3** Log view timestamp

### 4.4 Real-Time Dashboard Updates
- **4.4.1** Case status changes
  - **4.4.1.1** Broadcast case status updates
  - **4.4.1.2** Update dashboard cards in real-time
  - **4.4.1.3** Animate status changes
- **4.4.2** Invoice updates
  - **4.4.2.1** Notify client of new invoices
  - **4.4.2.2** Update invoice status in real-time
  - **4.4.2.3** Refresh payment status
- **4.4.3** Notification system
  - **4.4.3.1** Toast notifications for events
  - **4.4.3.2** Notification center/dropdown
  - **4.4.3.3** Mark notifications as read
  - **4.4.3.4** Notification history

### 4.5 Client-Side WebSocket Store
- **4.5.1** Create Svelte store for WebSocket
  - **4.5.1.1** `src/lib/stores/websocket.ts`
  - **4.5.1.2** Export connection status
  - **4.5.1.3** Export message sending function
  - **4.5.1.4** Export event listeners
- **4.5.2** Event handling
  - **4.5.2.1** `onMessage` - handle incoming messages
  - **4.5.2.2** `onDocument` - handle document updates
  - **4.5.2.3** `onNotification` - handle notifications
  - **4.5.2.4** `onStatusChange` - handle status changes
- **4.5.3** Integration with components
  - **4.5.3.1** Subscribe to WebSocket store in dashboards
  - **4.5.3.2** Update local state on events
  - **4.5.3.3** Trigger animations/sounds
  - **4.5.3.4** Handle offline mode gracefully

### 4.6 Fallback Mechanisms
- **4.6.1** Polling as fallback
  - **4.6.1.1** If WebSocket unavailable, use polling
  - **4.6.1.2** Poll every 5-10 seconds
  - **4.6.1.3** Compare timestamps for new data
  - **4.6.1.4** Switch to WebSocket when available
- **4.6.2** Optimistic updates
  - **4.6.2.1** Update UI immediately on action
  - **4.6.2.2** Rollback if server fails
  - **4.6.2.3** Show "sending..." indicator
  - **4.6.2.4** Retry failed operations

---

## 5. Implementation Order & Timeline

### 5.1 Sprint 1 - Messaging Foundation (Week 1-2)
- **5.1.1** Database schema updates (1.1)
- **5.1.2** Backend API routes (1.2)
- **5.1.3** Basic message UI components (1.3.1, 1.3.2)
- **5.1.4** Message sending/receiving (1.3.3)
- **5.1.5** Integration into dashboards (1.3.5, 1.4.1)

### 5.2 Sprint 2 - Document Management (Week 3-4)
- **5.2.1** Document direction & metadata (2.1)
- **5.2.2** Improved empty states (2.2)
- **5.2.3** Document filtering (2.3)
- **5.2.4** Chat-integrated document display (2.4)

### 5.3 Sprint 3 - Upload Progress (Week 5)
- **5.3.1** Progress indicator component (3.1)
- **5.3.2** Client-side upload logic (3.2)
- **5.3.3** Server-side handling (3.3)
- **5.3.4** UI integration (3.4)

### 5.4 Sprint 4 - Real-Time Updates (Week 6-7)
- **5.4.1** WebSocket infrastructure (4.1)
- **5.4.2** Real-time messages (4.2)
- **5.4.3** Real-time documents (4.3)
- **5.4.4** Dashboard updates (4.4)
- **5.4.5** Client store & integration (4.5, 4.6)

### 5.5 Sprint 5 - Testing & Polish (Week 8)
- **5.5.1** End-to-end testing
- **5.5.2** Performance optimization
- **5.5.3** Bug fixes
- **5.5.4** UI/UX refinements
- **5.5.5** Documentation updates

---

## 6. Technical Considerations

### 6.1 Performance
- **6.1.1** Implement message pagination (load 50 at a time)
- **6.1.2** Lazy load document previews
- **6.1.3** Optimize WebSocket message size
- **6.1.4** Cache frequently accessed data
- **6.1.5** Use virtual scrolling for long message lists

### 6.2 Security
- **6.2.1** Validate all WebSocket messages
- **6.2.2** Sanitize message content (XSS prevention)
- **6.2.3** Verify file types on upload
- **6.2.4** Rate limit message sending
- **6.2.5** Encrypt sensitive data in transit

### 6.3 Scalability
- **6.3.1** Design for horizontal WebSocket scaling
- **6.3.2** Use Redis for pub/sub if needed
- **6.3.3** Implement message queue for high volume
- **6.3.4** Consider CDN for document delivery
- **6.3.5** Database indexes on message queries

### 6.4 User Experience
- **6.4.1** Smooth animations and transitions
- **6.4.2** Loading states for all async operations
- **6.4.3** Clear error messages
- **6.4.4** Keyboard shortcuts for power users
- **6.4.5** Mobile-responsive design

---

## 7. Success Metrics

### 7.1 Functionality
- **7.1.1** Messages send/receive successfully
- **7.1.2** Documents upload and download correctly
- **7.1.3** Real-time updates work within 1 second
- **7.1.4** Progress indicators show accurate data
- **7.1.5** No data loss during upload

### 7.2 Performance
- **7.2.1** Message delivery < 500ms
- **7.2.2** Document upload supports up to 50MB
- **7.2.3** WebSocket reconnects within 3 seconds
- **7.2.4** Page load time < 2 seconds
- **7.2.5** UI remains responsive during uploads

### 7.3 User Satisfaction
- **7.3.1** Intuitive message interface
- **7.3.2** Clear document organization
- **7.3.3** Reliable real-time updates
- **7.3.4** Minimal user friction
- **7.3.5** Positive user feedback

---

*Document Version: 1.0*  
*Created: January 14, 2026*  
*Estimated Timeline: 8 weeks*  
*Dependencies: Phase One Complete*
