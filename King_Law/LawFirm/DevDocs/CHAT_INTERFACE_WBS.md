# Chat Interface Work Breakdown Structure

## Project Overview
Implement a comprehensive chat/messaging interface for the King Law Firm case management system that allows clients and lawyers to communicate in real-time with file attachment capabilities.

**Status**: Not Implemented  
**Priority**: High  
**Dependencies**: SPA refactor (completed), API endpoints (partially complete)

---

## 1. BACKEND API ENHANCEMENTS

### 1.1 Message Attachments API
- **1.1.1** Update message send endpoint to accept file uploads
  - Modify `/api/messages/send` to handle multipart form data
  - Accept both message content and file in single request
  - Validate file types and sizes
  - Store file using document upload logic
  - Link document to message via `attachmentDocumentId`
  
- **1.1.2** Create message attachment retrieval endpoint
  - Add attachment data to message query responses
  - Include document metadata (filename, size, type)
  - Join messages with documents table
  - Return download URLs for attachments

- **1.1.3** Update message schema/types
  - Ensure `attachmentDocumentId` is properly nullable
  - Add TypeScript types for message with attachment
  - Update API response types

### 1.2 Real-Time Message Updates
- **1.2.1** Create message polling endpoint
  - `GET /api/messages/poll?caseId={id}&since={timestamp}`
  - Return only messages newer than timestamp
  - Include unread count
  - Optimize query performance

- **1.2.2** Create mark-as-read endpoint
  - `POST /api/messages/mark-read`
  - Accept message IDs array
  - Update `readAt` timestamp
  - Return updated count

- **1.2.3** Create unread count endpoint
  - `GET /api/messages/unread`
  - Return counts per case
  - Include total unread
  - Cache for performance

### 1.3 Message Thread Management
- **1.3.1** Update messages query to support threading
  - Order by `createdAt` ascending
  - Group by case ID
  - Support pagination if needed
  - Include sender/recipient info

---

## 2. FRONTEND STORES

### 2.1 Enhanced Messages Store
- **2.1.1** Add attachment upload method
  ```typescript
  async sendMessageWithAttachment(
    caseId: string,
    content: string,
    file: File
  ): Promise<Result>
  ```

- **2.1.2** Add polling functionality
  - `startPolling(caseId: string, interval: number)`
  - `stopPolling()`
  - Update messages state automatically
  - Handle connection errors gracefully

- **2.1.3** Add unread tracking
  - Track unread counts per case
  - Update counts on new messages
  - Mark messages as read
  - Persist read state

- **2.1.4** Add message optimization
  - Cache messages by case ID
  - Implement optimistic updates
  - Handle duplicate messages
  - Clear cache on logout

### 2.2 Chat UI State Store
- **2.2.1** Create chat state store
  ```typescript
  class ChatStore {
    isOpen: boolean;
    selectedCaseId: string | null;
    draftMessages: Map<string, string>;
    attachmentPreviews: Map<string, File>;
  }
  ```

- **2.2.2** Add draft message persistence
  - Save drafts to localStorage
  - Restore on component mount
  - Clear on send
  - Handle multiple cases

---

## 3. UI COMPONENTS

### 3.1 ChatSlider Component
**File**: `src/lib/components/ChatSlider.svelte`

- **3.1.1** Component structure
  - Sliding panel from right side
  - Toggle button with unread badge
  - Backdrop overlay for mobile
  - Responsive width (mobile: full, desktop: 400px)

- **3.1.2** Header section
  - Close button
  - Case selector dropdown (if multiple cases)
  - Unread indicator
  - Minimize/expand toggle

- **3.1.3** Message list section
  - Scrollable container
  - Auto-scroll to bottom
  - Load more on scroll up (if paginated)
  - Loading skeleton
  - Empty state message

- **3.1.4** Message input section
  - Textarea with auto-resize
  - Character counter
  - Attachment button
  - Send button
  - Keyboard shortcuts (Enter to send, Shift+Enter for newline)

- **3.1.5** Attachment preview
  - Show selected file preview
  - File name, size, type
  - Remove button
  - Error states (size exceeded, wrong type)

### 3.2 MessageBubble Component
**File**: `src/lib/components/MessageBubble.svelte`

- **3.2.1** Props and layout
  ```typescript
  {
    message: Message;
    sender: User;
    isOwn: boolean;
    attachment?: Document;
  }
  ```

- **3.2.2** Message content
  - Different styles for sent/received
  - Sender name (if not own message)
  - Message text with line breaks
  - Timestamp
  - Read indicator (for sent messages)

- **3.2.3** Attachment display
  - File icon based on type
  - File name and size
  - Download button
  - Thumbnail for images
  - Inline preview option

- **3.2.4** Message states
  - Sending (loading indicator)
  - Sent (checkmark)
  - Failed (retry button)
  - Read (double checkmark)

### 3.3 AttachmentUploader Component
**File**: `src/lib/components/AttachmentUploader.svelte`

- **3.3.1** File input handling
  - Hidden file input
  - Click to upload button
  - Drag and drop zone
  - Multiple file support (future)

- **3.3.2** File validation
  - Allowed types: PDF, DOC, DOCX, JPG, PNG, TXT
  - Max size: 10MB
  - Validation error messages
  - Clear error on new selection

- **3.3.3** Upload preview
  - Show file details before send
  - Image thumbnail generation
  - File type icon
  - Size formatting

- **3.3.4** Upload progress
  - Progress bar during upload
  - Cancel upload button
  - Upload error handling
  - Retry mechanism

### 3.4 CaseSelector Component
**File**: `src/lib/components/CaseSelector.svelte`

- **3.4.1** Dropdown functionality
  - List all user's cases
  - Show case title and status
  - Unread message count per case
  - Search/filter cases

- **3.4.2** Visual indicators
  - Active case highlight
  - Status badges (active, pending, closed)
  - Unread count badges
  - Last message preview

### 3.5 UnreadBadge Component
**File**: `src/lib/components/UnreadBadge.svelte`

- **3.5.1** Badge display
  - Show unread count
  - Animated on update
  - Max display (99+)
  - Hide when zero

---

## 4. PAGE INTEGRATION

### 4.1 Client Dashboard Integration
**File**: `src/routes/dashboard/client/+layout.svelte`

- **4.1.1** Add ChatSlider to layout
  - Import and render ChatSlider
  - Pass user and cases data
  - Position fixed on right side
  - Z-index management

- **4.1.2** Initialize chat on mount
  - Load unread counts
  - Set up polling
  - Restore open state from localStorage

### 4.2 Lawyer Dashboard Integration
**File**: `src/routes/dashboard/lawyer/+layout.svelte`

- **4.2.1** Add ChatSlider to layout
  - Same as client with lawyer-specific features
  - Show all case messages
  - Filter by client

### 4.3 Case Detail Page Integration
**Files**: `src/routes/dashboard/*/case/[id]/+page.svelte`

- **4.3.1** Add embedded chat view
  - Full-width chat in case detail
  - Alternative to slider for desktop
  - Show case context
  - Direct file upload to case

- **4.3.2** Message/document sync
  - When file uploaded via chat, show in documents section
  - When document uploaded, show notification in chat
  - Bi-directional updates

---

## 5. FEATURES & FUNCTIONALITY

### 5.1 Core Messaging Features
- **5.1.1** Send text messages
  - Validate non-empty content
  - Trim whitespace
  - Support multiline
  - Character limit (10,000 chars)

- **5.1.2** Send messages with attachments
  - Upload file first
  - Link to message
  - Show in message thread
  - Download from message

- **5.1.3** Receive messages
  - Real-time via polling
  - Visual notification
  - Sound notification (optional)
  - Desktop notification (optional)

- **5.1.4** Message threading
  - Chronological order
  - Group by date
  - Sender avatars/initials
  - Reply indication (future)

### 5.2 File Attachment Features
- **5.2.1** File upload from chat
  - Select file via button
  - Drag and drop support
  - Preview before send
  - Upload with message

- **5.2.2** Attachment display
  - Show in message bubble
  - File icon for type
  - Download button
  - Size and name display

- **5.2.3** Attachment management
  - Linked to case documents
  - Appears in case files list
  - Tagged as "via message"
  - Full document permissions apply

### 5.3 Real-Time Updates
- **5.3.1** Polling mechanism
  - Poll every 5 seconds when chat open
  - Poll every 30 seconds when chat closed
  - Stop polling when not authenticated
  - Exponential backoff on errors

- **5.3.2** Unread indicators
  - Show count on chat toggle button
  - Show count per case
  - Update in real-time
  - Clear on message view

- **5.3.3** Presence indicators (future)
  - Show when lawyer is typing
  - Show online/offline status
  - Last seen timestamp

### 5.4 User Experience Features
- **5.4.1** Auto-scroll behavior
  - Scroll to bottom on new message
  - Preserve position on load more
  - Smooth scroll animation
  - "Scroll to bottom" button when scrolled up

- **5.4.2** Draft messages
  - Save draft on typing
  - Restore on reopen
  - Per-case drafts
  - Clear on send

- **5.4.3** Keyboard shortcuts
  - Enter: Send message
  - Shift+Enter: New line
  - Esc: Close chat
  - Ctrl+U: Upload file

- **5.4.4** Mobile optimizations
  - Full-screen on mobile
  - Swipe to close
  - Touch-friendly buttons
  - Virtual keyboard handling

### 5.5 Accessibility Features
- **5.5.1** Screen reader support
  - ARIA labels on all interactive elements
  - Announce new messages
  - Focus management
  - Keyboard navigation

- **5.5.2** Keyboard navigation
  - Tab through messages
  - Arrow keys in textarea
  - Escape to close
  - Focus trap in modal

---

## 6. STYLING & DESIGN

### 6.1 Chat Interface Styling
- **6.1.1** Color scheme
  - Use existing theme colors
  - Gold accent for actions
  - Different bubble colors for sent/received
  - Dark mode support

- **6.1.2** Layout
  - Responsive breakpoints
  - Mobile-first approach
  - Flexbox for message layout
  - Grid for attachment previews

- **6.1.3** Animations
  - Slide in/out transitions
  - Fade for messages
  - Loading skeletons
  - Hover effects

### 6.2 Message Bubble Styling
- **6.2.1** Own messages
  - Right-aligned
  - Gold/primary color background
  - White text
  - Rounded corners (left side more)

- **6.2.2** Other messages
  - Left-aligned
  - Light gray background
  - Dark text
  - Rounded corners (right side more)

- **6.2.3** Attachment styling
  - Card-like appearance
  - Icon + text layout
  - Download button prominent
  - Image thumbnails with lightbox

---

## 7. ERROR HANDLING

### 7.1 Network Errors
- **7.1.1** Failed message send
  - Show error indicator on message
  - Retry button
  - Save to queue for retry
  - User notification

- **7.1.2** Failed attachment upload
  - Error message below input
  - Retry option
  - Clear failed upload
  - Fallback to text-only message

- **7.1.3** Polling failures
  - Retry with backoff
  - Show connection status
  - Offline indicator
  - Resume on reconnection

### 7.2 Validation Errors
- **7.2.1** Empty message
  - Disable send button
  - Show validation hint
  - Allow attachments without text

- **7.2.2** Invalid file type
  - Show error message
  - List allowed types
  - Clear selection
  - Highlight input

- **7.2.3** File size exceeded
  - Show size limit
  - Suggest compression
  - Clear selection
  - Allow retry with different file

### 7.3 Permission Errors
- **7.3.1** Unauthorized case access
  - Redirect to dashboard
  - Show error message
  - Log security event

- **7.3.2** Read-only case
  - Disable message input
  - Show status message
  - Still show message history

---

## 8. TESTING

### 8.1 Unit Tests
- **8.1.1** Store tests
  - Message send/receive
  - Polling logic
  - Unread counting
  - Draft persistence

- **8.1.2** Component tests
  - ChatSlider rendering
  - MessageBubble variants
  - AttachmentUploader validation
  - CaseSelector filtering

### 8.2 Integration Tests
- **8.2.1** Message flow
  - Send message end-to-end
  - Receive message simulation
  - Attachment upload flow
  - Mark as read flow

- **8.2.2** API integration
  - Message API calls
  - Document API calls
  - Error scenarios
  - Authentication checks

### 8.3 E2E Tests
- **8.3.1** Client journey
  - Login as client
  - Open chat
  - Send message with attachment
  - Verify in case documents

- **8.3.2** Lawyer journey
  - Login as lawyer
  - Receive client message
  - Reply with attachment
  - Verify client receives

- **8.3.3** Cross-user messaging
  - Two browser sessions
  - Send from client
  - Receive by lawyer
  - Verify real-time update

### 8.4 Manual Testing Checklist
- **8.4.1** Functionality
  - [ ] Send text message
  - [ ] Send message with PDF attachment
  - [ ] Send message with image attachment
  - [ ] Receive message
  - [ ] Download attachment
  - [ ] Switch between cases
  - [ ] Mark messages as read
  - [ ] View unread counts

- **8.4.2** UI/UX
  - [ ] Chat opens/closes smoothly
  - [ ] Messages scroll properly
  - [ ] Auto-scroll to new messages
  - [ ] Draft messages save
  - [ ] Keyboard shortcuts work
  - [ ] Mobile responsive

- **8.4.3** Error handling
  - [ ] Failed message send
  - [ ] Failed attachment upload
  - [ ] Network disconnection
  - [ ] Invalid file type
  - [ ] File size exceeded

---

## 9. PERFORMANCE OPTIMIZATION

### 9.1 Message Loading
- **9.1.1** Lazy loading
  - Load initial 50 messages
  - Fetch older on scroll
  - Cache loaded messages
  - Virtualize long lists

- **9.1.2** Polling optimization
  - Adaptive polling interval
  - Stop when tab inactive
  - Batch multiple updates
  - Debounce rapid polls

### 9.2 File Upload Optimization
- **9.2.1** Upload improvements
  - Show upload progress
  - Support resume (future)
  - Compress images client-side
  - Cancel in-progress uploads

- **9.2.2** Caching
  - Cache message list
  - Cache document metadata
  - Invalidate on new messages
  - Clear on logout

---

## 10. SECURITY CONSIDERATIONS

### 10.1 Message Security
- **10.1.1** Input sanitization
  - Sanitize message content
  - Prevent XSS attacks
  - Validate all inputs
  - Escape HTML in messages

- **10.1.2** Authorization checks
  - Verify case access
  - Check user role
  - Validate document permissions
  - Audit sensitive actions

### 10.2 File Upload Security
- **10.2.1** File validation
  - Server-side type checking
  - MIME type verification
  - Malware scanning (future)
  - File size limits enforced

- **10.2.2** Storage security
  - Secure file paths
  - No direct file access
  - Authenticated downloads only
  - Encryption at rest (future)

---

## 11. DOCUMENTATION

### 11.1 Developer Documentation
- **11.1.1** API documentation
  - Endpoint specifications
  - Request/response examples
  - Error codes
  - Rate limits

- **11.1.2** Component documentation
  - Props and events
  - Usage examples
  - Styling customization
  - Integration guide

### 11.2 User Documentation
- **11.2.1** User guide
  - How to send messages
  - How to attach files
  - How to manage conversations
  - Troubleshooting tips

- **11.2.2** Admin guide
  - Message moderation
  - File management
  - Performance monitoring
  - Security best practices

---

## IMPLEMENTATION TIMELINE

### Phase 1: Foundation (Week 1)
- Set up backend API enhancements
- Create enhanced message store
- Implement basic ChatSlider component

### Phase 2: Core Features (Week 2)
- Add file attachment API
- Implement AttachmentUploader component
- Create MessageBubble component
- Add basic styling

### Phase 3: Integration (Week 3)
- Integrate into dashboard layouts
- Add to case detail pages
- Implement real-time polling
- Add unread tracking

### Phase 4: Polish & Testing (Week 4)
- Add animations and transitions
- Implement error handling
- Write unit and integration tests
- Conduct E2E testing

### Phase 5: Deployment (Week 5)
- Performance optimization
- Security audit
- User acceptance testing
- Production deployment

---

## DEPENDENCIES & PREREQUISITES

### Required
- ✅ SPA refactor completed
- ✅ API endpoints structure in place
- ✅ Authentication system working
- ✅ Document upload system functional

### Optional Enhancements
- WebSocket server for true real-time (instead of polling)
- Push notifications service
- Message search functionality
- Message editing/deletion
- File preview in-browser
- Voice message support
- Video call integration

---

## SUCCESS METRICS

### Functional Metrics
- Message delivery time < 5 seconds
- File upload success rate > 95%
- Polling overhead < 100KB per minute
- Zero message loss

### User Experience Metrics
- Chat open time < 500ms
- Message send feedback < 200ms
- Unread badge update < 1 second
- Mobile usability score > 90%

### Business Metrics
- Increased client engagement
- Reduced email communication
- Faster case resolution
- Higher client satisfaction

---

## RISKS & MITIGATION

### Technical Risks
- **Real-time performance**: Mitigate with optimized polling and caching
- **File storage costs**: Implement size limits and cleanup policies
- **Browser compatibility**: Test on all major browsers, provide fallbacks

### User Experience Risks
- **Information overload**: Implement smart notifications and summaries
- **Mobile usability**: Extensive mobile testing and optimization
- **Learning curve**: Provide in-app tutorials and tooltips

### Security Risks
- **File upload abuse**: Strict validation, rate limiting, malware scanning
- **Message injection**: Input sanitization, CSP headers
- **Unauthorized access**: Robust authorization checks, audit logging

---

## NOTES

- This WBS assumes the SPA refactor is complete
- All API endpoints should follow RESTful conventions
- Consider WebSocket implementation in Phase 2 for better real-time
- File attachments are linked to cases via documents table
- Messages and documents are separate but linked entities
- Both clients and lawyers have identical chat functionality
- Unread counts are user-specific, not case-specific
- All times are stored in UTC, displayed in user timezone
