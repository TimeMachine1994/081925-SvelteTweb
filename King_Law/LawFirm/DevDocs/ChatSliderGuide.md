# ChatSlider Component Documentation

## Overview
**Component**: `ChatSlider.svelte`  
**Size**: 483 lines  
**Type**: Real-time messaging UI with polling  
**Status**: ✅ Fully Implemented  
**Dependencies**: MessagePanel.svelte (separate component)

---

## Purpose

ChatSlider is a **fixed-position, slide-out messaging panel** that provides real-time communication between clients and lawyers. It appears as a floating chat button and slides in from the right side of the screen.

### Key Features
- 🗨️ Real-time message polling (5-second intervals)
- 📎 File attachment support
- 🔔 Unread message notifications with badge
- 📁 Case-based message organization
- 📱 Fully responsive (mobile-friendly)
- 🚀 Auto-scroll to latest messages
- ✅ Read receipts
- ⏱️ Message timestamps

---

## Component Props

```typescript
interface Props {
  cases: Case[];               // User's cases (can be empty)
  currentUserId: string;       // Current authenticated user ID
  userRole: 'client' | 'lawyer' | 'admin';  // User's role
  defaultRecipientId?: string | null;       // Optional: for clients with no cases
}
```

### Prop Descriptions

#### `cases`
Array of cases the user has access to.

```typescript
interface Case {
  id: string;
  title: string;
}
```

**Client**: Only their own cases  
**Lawyer**: All cases they're assigned to  
**Admin**: All cases (if needed)

#### `currentUserId`
Used to distinguish sent vs received messages for UI styling.

#### `userRole`
Affects message display and permissions.

#### `defaultRecipientId`
For clients who haven't created a case yet. Allows them to message a default lawyer/admin to initiate contact.

---

## Usage Examples

### Client Dashboard Integration
```svelte
<script lang="ts">
  import ChatSlider from '$lib/components/ChatSlider.svelte';
  
  let { data } = $props();
</script>

<ChatSlider 
  cases={data.cases}
  currentUserId={data.user.id}
  userRole={data.user.role}
  defaultRecipientId={data.defaultLawyerId}
/>
```

### Lawyer Dashboard Integration
```svelte
<script lang="ts">
  import ChatSlider from '$lib/components/ChatSlider.svelte';
  
  let { data } = $props();
</script>

<ChatSlider 
  cases={data.allCases}
  currentUserId={data.user.id}
  userRole={data.user.role}
/>
```

---

## UI Components

### 1. Chat Toggle Button (Fixed)
```svelte
<button class="fixed bottom-6 right-6 z-40 ...">
  <Icon icon={faComments} />
  {#if totalUnread > 0}
    <span class="badge">{totalUnread > 9 ? '9+' : totalUnread}</span>
  {/if}
</button>
```

**Features**:
- Fixed position (bottom-right corner)
- Unread count badge (red circle)
- Shows "9+" for 10+ unread messages
- Scales on hover (1.1x)
- Gold background with black text

### 2. Slide-Out Panel
```svelte
<div class="fixed bottom-0 right-0 top-0 z-50 w-full max-w-md 
     transform transition-transform {isOpen ? 'translate-x-0' : 'translate-x-full'}">
```

**Features**:
- 400px max width (`max-w-md`)
- Slides from right side
- Full height
- Smooth 300ms transition
- Above toggle button (z-50)

### 3. Header
- Component title: "Messages"
- Close button (X icon)
- Sticky at top

### 4. Case Selector (Conditional)
**Shown when**: User has multiple cases

```svelte
{#if cases.length > 1}
  <select bind:value={selectedCaseId}>
    {#each cases as caseItem}
      <option value={caseItem.id}>
        {caseItem.title}
        {#if unreadCounts[caseItem.id]}
          ({unreadCounts[caseItem.id]} unread)
        {/if}
      </option>
    {/each}
  </select>
{/if}
```

**Shown when**: User has exactly 1 case
- Displays case title (non-interactive)

**Not shown**: User has 0 cases

### 5. Messages Area
**Empty States**:

1. **No Cases, No Default Recipient**:
```svelte
<Icon icon={faComments} />
<p>No active cases</p>
<p class="text-sm">Contact us to get started</p>
```

2. **No Cases, Has Default Recipient**:
```svelte
<Icon icon={faComments} />
<p>Send a message to your attorney</p>
<p class="text-sm">Your message will be reviewed and a case may be created</p>
```

3. **Has Cases, No Messages**:
```svelte
<Icon icon={faComments} />
<p>No messages yet</p>
<p class="text-sm">Start the conversation!</p>
```

**Message Display**:
```svelte
{#each messages as message}
  {@const isOwn = message.senderId === currentUserId}
  <div class="flex {isOwn ? 'justify-end' : 'justify-start'}">
    <div class="message-bubble {isOwn ? 'bg-gold text-black' : 'bg-secondary text-foreground'}">
      {#if !isOwn}
        <div class="sender-name">
          {message.senderFirstName} {message.senderLastName}
          <span>({message.senderRole})</span>
        </div>
      {/if}
      <p>{message.content}</p>
      {#if message.attachmentDocumentId}
        <a href="/api/documents/{message.attachmentDocumentId}">
          <!-- File download link -->
        </a>
      {/if}
    </div>
    <div class="timestamp">
      {formatTime(message.createdAt)}
      {#if isOwn && message.readAt}
        <span class="text-green-500">Read</span>
      {/if}
    </div>
  </div>
{/each}
```

### 6. Message Input Area
**Components**:
- File attachment button (paperclip icon) - only for users with cases
- Text area (auto-resize)
- Send button (paper plane icon)

**Features**:
- Enter to send (Shift+Enter for new line)
- Disabled when empty and no attachment
- Disabled when sending (shows spinner)
- Shows attached file preview with remove option

```svelte
<div class="flex items-end gap-2">
  {#if selectedCaseId}
    <button onclick={() => fileInput?.click()}>
      <Icon icon={faPaperclip} />
    </button>
  {/if}
  <textarea 
    bind:value={newMessage}
    onkeydown={handleKeydown}
    placeholder="Type a message..."
  />
  <button onclick={sendMessage} disabled={...}>
    {#if isSending}
      <Icon icon={faSpinner} class="animate-spin" />
    {:else}
      <Icon icon={faPaperPlane} />
    {/if}
  </button>
</div>
```

---

## Real-Time Features

### 1. Unread Count Polling
```typescript
onMount(() => {
  fetchUnreadCounts();
  unreadPollingInterval = setInterval(fetchUnreadCounts, 10000);
});
```

**Interval**: Every 10 seconds  
**Endpoint**: `GET /api/messages/unread`  
**Response**:
```json
{
  "unreadCount": 5,
  "unreadByCaseId": {
    "case-1": 3,
    "case-2": 2
  }
}
```

### 2. Message Polling
```typescript
$effect(() => {
  if (isOpen && selectedCaseId) {
    messagePollingInterval = setInterval(() => {
      pollNewMessages(selectedCaseId);
    }, 5000);
  }
});
```

**Interval**: Every 5 seconds (only when panel is open)  
**Endpoint**: `GET /api/messages?caseId={caseId}`  
**Auto-actions**:
- Scrolls to bottom on new messages
- Marks new messages as read automatically

### 3. Auto-Scroll
```typescript
function scrollToBottom() {
  setTimeout(() => {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, 50);
}
```

Triggers on:
- New messages received
- Panel opened
- Case changed

---

## File Attachment Flow

### 1. User Selects File
```typescript
function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    attachmentFile = target.files[0];
  }
}
```

### 2. File Preview Shown
```svelte
{#if attachmentFile}
  <div class="attachment-preview">
    <Icon icon={faFile} />
    <span>{attachmentFile.name}</span>
    <span>({formatFileSize(attachmentFile.size)})</span>
    <button onclick={removeAttachment}>
      <Icon icon={faTimes} />
    </button>
  </div>
{/if}
```

### 3. Upload on Send
```typescript
async function sendMessage() {
  let attachmentDocumentId = null;

  // Upload file first
  if (attachmentFile && selectedCaseId) {
    const formData = new FormData();
    formData.append('file', attachmentFile);
    formData.append('caseId', selectedCaseId);
    
    const uploadRes = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData
    });
    
    if (uploadRes.ok) {
      const uploadData = await uploadRes.json();
      attachmentDocumentId = uploadData.documentId;
    }
  }

  // Then send message with attachment reference
  await fetch('/api/messages', {
    method: 'POST',
    body: JSON.stringify({
      caseId: selectedCaseId || null,
      recipientId: selectedCaseId ? null : defaultRecipientId,
      content: newMessage.trim() || `Attached: ${attachmentFile.name}`,
      attachmentDocumentId
    })
  });
}
```

**Note**: If message has no text but has attachment, uses filename as message content.

---

## API Integration

### Required Endpoints

#### 1. Get Unread Counts
```
GET /api/messages/unread
Response: { unreadCount: number, unreadByCaseId: Record<string, number> }
```

#### 2. Get Messages for Case
```
GET /api/messages?caseId={caseId}
Response: { messages: Message[] }
```

#### 3. Mark Messages as Read
```
POST /api/messages/mark-read
Body: { caseId: string }
Response: { success: boolean }
```

#### 4. Send Message
```
POST /api/messages
Body: { 
  caseId: string | null,
  recipientId: string | null,
  content: string,
  attachmentDocumentId: string | null
}
Response: { message: Message }
```

#### 5. Upload Document (for attachments)
```
POST /api/documents/upload
Body: FormData { file: File, caseId: string }
Response: { documentId: string }
```

#### 6. Download Attachment
```
GET /api/documents/{documentId}
Response: File stream
```

---

## Message Interface

```typescript
interface Message {
  id: string;
  caseId: string | null;
  senderId: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
  senderFirstName: string | null;
  senderLastName: string | null;
  senderRole: string | null;
  attachmentDocumentId?: string | null;
  attachmentFileName?: string | null;
  attachmentFileSize?: number | null;
}
```

---

## Styling & Theme

### CSS Classes Used
- **Gold**: `bg-gold`, `text-gold`, `border-gold`
- **Background**: `bg-background`, `bg-secondary`
- **Text**: `text-foreground`, `text-muted-foreground`
- **Border**: `border-border`

### Responsive Design
```svelte
<!-- Mobile backdrop -->
{#if isOpen}
  <button class="fixed inset-0 z-40 bg-black/50 md:hidden">
  </button>
{/if}
```

On mobile:
- Full screen width
- Backdrop overlay
- Tap backdrop to close

On desktop:
- Max 400px width
- No backdrop
- Hover effects

---

## Keyboard Shortcuts

- **Enter**: Send message
- **Shift+Enter**: New line in message
- **Escape**: *(Not implemented - could close panel)*

---

## Difference from MessagePanel Component

| Feature | ChatSlider | MessagePanel |
|---------|-----------|--------------|
| Position | Fixed (floating button) | Inline in page |
| Open/Close | User-controlled slide | Always visible |
| Mobile UI | Full screen overlay | Scrollable section |
| Unread Badge | Yes (on button) | Optional |
| Case Selector | Dropdown | Usually pre-selected |
| Use Case | Quick access anywhere | Dedicated messaging page |

**When to Use ChatSlider**:
- Dashboard integration
- Quick messaging without navigation
- Multi-page availability
- Minimize screen space when closed

**When to Use MessagePanel**:
- Dedicated messaging page
- Lawyer managing multiple clients
- More screen space for conversation
- Persistent visibility

---

## Performance Considerations

### 1. Polling Efficiency
```typescript
// Stop polling when not in use
$effect(() => {
  if (isOpen && selectedCaseId) {
    // Start polling
  } else {
    // Stop polling
    if (messagePollingInterval) {
      clearInterval(messagePollingInterval);
      messagePollingInterval = null;
    }
  }
});
```

### 2. Memory Management
```typescript
onDestroy(() => {
  if (unreadPollingInterval) {
    clearInterval(unreadPollingInterval);
  }
  if (messagePollingInterval) {
    clearInterval(messagePollingInterval);
  }
});
```

### 3. Auto-Scroll Debounce
```typescript
setTimeout(() => {
  // Scroll after DOM update
}, 50);
```

---

## Future Enhancements

### Planned with WebSocket Integration
When WebSocket implementation is complete, replace polling with:

```typescript
// Instead of polling
$effect(() => {
  if (isOpen && selectedCaseId) {
    websocket.on('new-message', (message) => {
      if (message.caseId === selectedCaseId) {
        messages = [...messages, message];
        scrollToBottom();
      }
    });
  }
});
```

### Potential Features
1. **Typing Indicators**
   - Show "Lawyer is typing..."
   - Requires WebSocket or short-interval polling

2. **Message Search**
   - Search within conversation
   - Highlight search results

3. **Message Reactions**
   - Emoji reactions to messages
   - Quick acknowledgment

4. **Voice Messages**
   - Record and send audio
   - Playback in message bubble

5. **Image Previews**
   - Show image thumbnails inline
   - Lightbox for full view

6. **Notification Sounds**
   - Audio alert on new message
   - User preference toggle

---

## Troubleshooting

### Issue: Messages not updating
**Check**:
1. Is panel open? (Polling only runs when open)
2. Is `selectedCaseId` set?
3. Check browser console for API errors
4. Verify `/api/messages` endpoint is responding

### Issue: Unread count not updating
**Check**:
1. Is polling interval running? (check in React DevTools)
2. Is `/api/messages/unread` endpoint working?
3. Check if `markMessagesAsRead` is being called

### Issue: File attachment not showing
**Check**:
1. Is `attachmentDocumentId` populated in message?
2. Is document download endpoint accessible?
3. Check file permissions in database

### Issue: Scroll not working
**Check**:
1. Is `messagesContainer` ref bound correctly?
2. Check if `scrollHeight` is being calculated
3. Try increasing `setTimeout` delay (50ms → 100ms)

---

## Testing Checklist

### Manual Testing
- [ ] Open/close panel
- [ ] Send text message
- [ ] Send message with attachment
- [ ] Receive message (test with 2 users)
- [ ] Switch between cases
- [ ] Unread count updates
- [ ] Read receipts show correctly
- [ ] Mobile responsive
- [ ] Message timestamps correct
- [ ] File download works

### Edge Cases
- [ ] User with 0 cases
- [ ] User with 1 case
- [ ] User with 10+ cases
- [ ] Very long message content
- [ ] Large file attachment (10MB+)
- [ ] Network error during send
- [ ] Session expiration while open

---

## Related Files

- `src/lib/components/ChatSlider.svelte` - This component
- `src/lib/components/MessagePanel.svelte` - Alternative messaging UI
- `src/routes/api/messages/+server.ts` - Send message endpoint
- `src/routes/api/messages/[caseId]/+server.ts` - Get messages endpoint
- `src/routes/api/messages/unread/+server.ts` - Unread counts endpoint
- `src/routes/api/messages/mark-read/+server.ts` - Mark read endpoint
- `src/routes/api/documents/upload/+server.ts` - File upload endpoint

---

**Document Version**: 1.0  
**Last Updated**: January 15, 2026  
**Component Status**: Production Ready (Phase Two)  
**Future**: WebSocket integration planned
