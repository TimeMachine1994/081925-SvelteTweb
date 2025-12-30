# Chat Interface Implementation Plan

> **Status:** ✅ IMPLEMENTED (December 29, 2025)
> 
> **Feature:** Context-Aware AI Chat for Journey POTJs and Files
> 
> **Goal:** Add an interactive chat interface in ProfileView that allows users to discuss selected POTJs/files with AI assistance, asking questions about code, architecture, and implementation details.

---

## Implementation Notes

**Successfully Implemented:**
- ✅ Database schema with `chatMessage` table (Step 1)
- ✅ GET/POST chat API endpoints (Step 2)
- ✅ Gemini 2.0 Flash chat service with context building (Step 3)
- ✅ ProfileView chat UI component (Step 4)
- ✅ Full chat styling with animations (Step 5)

**Key Changes from Plan:**
- Used Gemini 2.0 Flash Exp instead of 1.5 Flash (newer model)
- Chat interface integrated directly into ProfileView (not separate section)
- Context includes up to 5000 chars of file content (token management)
- Auto-loads last 10 messages for conversation context

**Files Created/Modified:**
- `src/lib/server/db/schema.ts` - Added chatMessage table
- `src/lib/server/gemini-chat.ts` - New file for AI integration
- `src/routes/api/chat/+server.ts` - New API endpoint
- `src/lib/components/ProfileView.svelte` - Added chat section (lines 21-352, 724-950)
- Database migration completed via Drizzle ORM

---

## Overview

The chat interface will be positioned below the existing content sections (Description, Key Behavior, Dependencies, Tags, Notes) in the ProfileView component. It will provide context-aware AI assistance specific to the selected POTJ or file.

### Key Features
- **Context-Aware**: Automatically includes POTJ/file metadata and code in prompts
- **Persistent**: Chat history saved per POTJ/file in database
- **AI-Powered**: Uses Gemini API for intelligent responses
- **Scrollable**: Message history with auto-scroll to latest
- **Modern UI**: Matches existing design system

---

## Implementation Steps

### Step 1: Database Schema Updates

**File:** `src/lib/server/db/schema.ts`

**Add new table:**
```typescript
export const chatMessage = sqliteTable('chat_message', {
  id: text('id').primaryKey(),
  contextType: text('context_type').notNull(), // 'potj' or 'file'
  contextId: text('context_id').notNull(), // POTJ ID or file path
  role: text('role').notNull(), // 'user' or 'assistant'
  content: text('content').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  metadata: text('metadata') // JSON: tokens, model, etc.
});

export type ChatMessage = typeof chatMessage.$inferSelect;
export type NewChatMessage = typeof chatMessage.$inferInsert;
```

**Run migration:**
```bash
npm run db:push
```

**Indexes:**
- `(contextType, contextId, timestamp)` for efficient querying

---

### Step 2: Chat API Endpoints

#### 2a. GET Chat History

**File:** `src/routes/api/chat/+server.ts`

**Endpoint:** `GET /api/chat?contextType={type}&contextId={id}`

**Purpose:** Load existing chat messages for a POTJ or file

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-123",
      "role": "user",
      "content": "How does this component work?",
      "timestamp": "2025-12-29T13:00:00Z"
    },
    {
      "id": "msg-124",
      "role": "assistant",
      "content": "This component...",
      "timestamp": "2025-12-29T13:00:05Z"
    }
  ]
}
```

**Implementation:**
1. Parse query params: `contextType` and `contextId`
2. Query database for messages matching context
3. Order by timestamp ascending
4. Return message array

---

#### 2b. POST New Message

**File:** `src/routes/api/chat/+server.ts`

**Endpoint:** `POST /api/chat`

**Purpose:** Send user message and get AI response

**Request Body:**
```json
{
  "contextType": "potj",
  "contextId": "guest-b-1",
  "message": "What file handles the login logic?",
  "context": {
    "potj": { /* POTJ data */ },
    "fileContent": "...",
    "relatedFiles": [...]
  }
}
```

**Response:**
```json
{
  "userMessage": {
    "id": "msg-125",
    "role": "user",
    "content": "What file handles...",
    "timestamp": "2025-12-29T13:05:00Z"
  },
  "assistantMessage": {
    "id": "msg-126",
    "role": "assistant",
    "content": "The login logic is handled in...",
    "timestamp": "2025-12-29T13:05:02Z"
  }
}
```

**Implementation:**
1. Save user message to database
2. Build context-aware prompt including:
   - POTJ metadata (title, description, behavior, dependencies)
   - File content from Code Viewer
   - Related files from Code Bank
   - Previous chat history (last 10 messages for context)
3. Call Gemini API
4. Save assistant response to database
5. Return both messages

---

### Step 3: Gemini Chat Service

**File:** `src/lib/server/gemini-chat.ts`

**Function:** `generateChatResponse()`

**Purpose:** Generate AI response with POTJ/file context

**Context Building:**
```typescript
async function buildChatPrompt(
  userMessage: string,
  context: {
    potj?: POTJ;
    fileContent?: string;
    relatedFiles?: FileProfile[];
    chatHistory?: ChatMessage[];
  }
): Promise<string> {
  const parts = [
    "You are an expert code assistant helping a developer understand their codebase.",
    ""
  ];

  // Add POTJ context if available
  if (context.potj) {
    parts.push("# Current Journey Step (POTJ)");
    parts.push(`**Title:** ${context.potj.title}`);
    parts.push(`**Type:** ${context.potj.moduleType || 'N/A'}`);
    parts.push(`**Description:** ${context.potj.description}`);
    if (context.potj.keyBehavior?.length) {
      parts.push(`**Key Behaviors:**`);
      context.potj.keyBehavior.forEach(b => parts.push(`- ${b}`));
    }
    parts.push("");
  }

  // Add file content if available
  if (context.fileContent) {
    parts.push("# Current File Content");
    parts.push("```");
    parts.push(context.fileContent.slice(0, 5000)); // Limit for token budget
    parts.push("```");
    parts.push("");
  }

  // Add related files
  if (context.relatedFiles?.length) {
    parts.push("# Related Files");
    context.relatedFiles.forEach(f => {
      parts.push(`- ${f.path}: ${f.description || 'No description'}`);
    });
    parts.push("");
  }

  // Add chat history for context
  if (context.chatHistory?.length) {
    parts.push("# Previous Conversation");
    context.chatHistory.forEach(msg => {
      parts.push(`**${msg.role}:** ${msg.content}`);
    });
    parts.push("");
  }

  // Add user question
  parts.push("# User Question");
  parts.push(userMessage);
  parts.push("");
  parts.push("Please provide a helpful, specific answer based on the code and context above.");

  return parts.join('\n');
}
```

**AI Response Guidelines:**
- Be concise but thorough
- Reference specific lines/files when relevant
- Explain technical concepts clearly
- Suggest improvements when appropriate
- Point to related POTJs or files

---

### Step 4: Update ProfileView Component

**File:** `src/lib/components/ProfileView.svelte`

**Changes:**

#### 4a. Add Chat State
```typescript
let chatMessages = $state<ChatMessage[]>([]);
let chatInput = $state('');
let isSendingMessage = $state(false);
let chatError = $state<string | null>(null);
let chatScrollContainer: HTMLElement | null = null;
```

#### 4b. Load Chat History
```typescript
// Effect to load chat when POTJ/file changes
$effect(() => {
  if (activeProfile) {
    loadChatHistory();
  }
});

async function loadChatHistory() {
  try {
    const contextType = viewMode === 'potj' ? 'potj' : 'file';
    const contextId = viewMode === 'potj' 
      ? selectedPOTJ?.id 
      : selectedFile?.id;
    
    if (!contextId) return;

    const params = new URLSearchParams({ contextType, contextId });
    const response = await fetch(`/api/chat?${params}`);
    
    if (!response.ok) throw new Error('Failed to load chat');
    
    const data = await response.json();
    chatMessages = data.messages || [];
    
    // Auto-scroll to bottom after messages load
    setTimeout(scrollToBottom, 100);
  } catch (err) {
    console.error('Error loading chat:', err);
  }
}
```

#### 4c. Send Message Function
```typescript
async function sendMessage() {
  if (!chatInput.trim() || isSendingMessage) return;
  
  const userMessage = chatInput.trim();
  chatInput = ''; // Clear input immediately
  isSendingMessage = true;
  chatError = null;
  
  try {
    const contextType = viewMode === 'potj' ? 'potj' : 'file';
    const contextId = viewMode === 'potj' 
      ? selectedPOTJ?.id 
      : selectedFile?.id;
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contextType,
        contextId,
        message: userMessage,
        context: {
          potj: viewMode === 'potj' ? selectedPOTJ : null,
          fileContent: selectedFile?.codeSnippets?.[0]?.code || null,
          relatedFiles: [] // Could add related files from context
        }
      })
    });
    
    if (!response.ok) throw new Error('Failed to send message');
    
    const data = await response.json();
    
    // Add both messages to chat
    chatMessages = [...chatMessages, data.userMessage, data.assistantMessage];
    
    // Scroll to bottom
    setTimeout(scrollToBottom, 100);
  } catch (err) {
    chatError = err instanceof Error ? err.message : 'Failed to send message';
  } finally {
    isSendingMessage = false;
  }
}

function scrollToBottom() {
  if (chatScrollContainer) {
    chatScrollContainer.scrollTop = chatScrollContainer.scrollHeight;
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}
```

#### 4d. Add Chat UI Section
```svelte
{#if activeProfile}
  <div class="profile-content">
    <div class="profile-header">
      <!-- Existing header content -->
    </div>

    <div class="profile-body">
      <!-- Existing sections: Description, Key Behavior, etc. -->
      
      <!-- NEW: Chat Interface -->
      <div class="chat-section">
        <h3 class="section-title">💬 Ask About This {viewMode === 'potj' ? 'Journey Step' : 'File'}</h3>
        
        {#if chatError}
          <div class="chat-error">
            <span class="error-icon">⚠️</span>
            <p>{chatError}</p>
          </div>
        {/if}
        
        <div class="chat-container">
          <div class="chat-messages" bind:this={chatScrollContainer}>
            {#if chatMessages.length === 0}
              <div class="chat-empty">
                <span class="empty-icon">💭</span>
                <p>Start a conversation about this code</p>
                <p class="hint">Ask questions, request explanations, or discuss improvements</p>
              </div>
            {:else}
              {#each chatMessages as message (message.id)}
                <div class="chat-message {message.role}">
                  <div class="message-avatar">
                    {message.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div class="message-content">
                    <div class="message-text">{message.content}</div>
                    <div class="message-time">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              {/each}
            {/if}
            
            {#if isSendingMessage}
              <div class="chat-message assistant typing">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                  <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            {/if}
          </div>
          
          <div class="chat-input-container">
            <textarea
              bind:value={chatInput}
              onkeydown={handleKeydown}
              placeholder="Ask a question about this code..."
              class="chat-input"
              rows="2"
              disabled={isSendingMessage}
            ></textarea>
            <button 
              onclick={sendMessage}
              disabled={!chatInput.trim() || isSendingMessage}
              class="send-btn"
            >
              {isSendingMessage ? '⏳' : '📤'} Send
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
```

---

### Step 5: Chat Interface Styling

**File:** `src/lib/components/ProfileView.svelte` (style section)

**Add CSS:**
```css
.chat-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}

.chat-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #991b1b;
  font-size: 0.875rem;
}

.error-icon {
  font-size: 1rem;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 400px;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
  background: #f8fafc;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  text-align: center;
  padding: 2rem;
}

.chat-empty .empty-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.chat-empty p {
  margin: 0.25rem 0;
  font-size: 0.9375rem;
}

.chat-empty .hint {
  font-size: 0.8125rem;
  color: #cbd5e1;
}

.chat-message {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.chat-message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  font-size: 1.5rem;
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
}

.chat-message.user .message-avatar {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.message-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-width: 80%;
}

.message-text {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.9375rem;
  line-height: 1.5;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #334155;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.chat-message.user .message-text {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

.message-time {
  font-size: 0.6875rem;
  color: #94a3b8;
  padding: 0 0.5rem;
}

.chat-message.user .message-time {
  text-align: right;
}

.typing-indicator {
  display: flex;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  width: fit-content;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #94a3b8;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.chat-input-container {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: #fff;
  border-top: 1px solid #e2e8f0;
}

.chat-input {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  font-family: inherit;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  resize: none;
  background: #f8fafc;
  color: #1e293b;
  transition: border-color 0.15s ease;
}

.chat-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: #fff;
}

.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  padding: 0.75rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #fff;
  background: #3b82f6;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
  white-space: nowrap;
  align-self: flex-end;
}

.send-btn:hover:not(:disabled) {
  background: #2563eb;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## Testing Checklist

### Functionality
- [ ] Chat history loads when selecting a POTJ
- [ ] Chat history loads when selecting a file
- [ ] Messages persist in database
- [ ] AI responses include relevant context
- [ ] Enter key sends message
- [ ] Shift+Enter creates new line
- [ ] Auto-scroll to latest message
- [ ] Empty state displays correctly
- [ ] Loading state shows typing indicator
- [ ] Error handling works properly

### UI/UX
- [ ] Chat interface matches design system
- [ ] Messages are readable and well-formatted
- [ ] Scrolling is smooth
- [ ] Input field resizes appropriately
- [ ] Avatars display correctly
- [ ] Timestamps are formatted properly
- [ ] Mobile responsive (if applicable)

### Performance
- [ ] Chat loads quickly
- [ ] No lag when sending messages
- [ ] Token limits respected in prompts
- [ ] Database queries are efficient

---

## Future Enhancements

### Phase 2: Enhanced Features
- **Code Suggestions**: AI can suggest code improvements inline
- **File Navigation**: Click mentioned files to open in Code Viewer
- **Export Chat**: Download conversation as markdown
- **Search Chat**: Search through message history
- **Voice Input**: Speak questions instead of typing
- **Code Highlighting**: Syntax highlighting in AI responses
- **Context Menu**: Right-click code to "Ask AI about this"

### Phase 3: Collaboration
- **Multi-user Chat**: Team members can discuss POTJs together
- **Mentions**: @mention team members
- **Reactions**: React to messages with emojis
- **Thread Replies**: Reply to specific messages
- **Chat Notifications**: Real-time updates via SSE

---

## API Cost Considerations

**Gemini API Usage:**
- Estimated tokens per request: 2,000-5,000 (including context)
- Free tier: 60 requests per minute
- Cost tier: $0.35 per 1M input tokens

**Optimization Strategies:**
- Limit file content to first 5,000 characters
- Include only last 10 messages in history
- Cache common responses
- Use streaming for long responses

---

## Implementation Timeline

| Step | Estimated Time | Status | Actual Notes |
|------|----------------|--------|-------------|
| 1. Database Schema | 30 mins | ✅ Complete | chatMessage table in schema.ts |
| 2. Chat API Endpoints | 2 hours | ✅ Complete | GET/POST in /api/chat/+server.ts |
| 3. Gemini Chat Service | 1.5 hours | ✅ Complete | gemini-chat.ts with context building |
| 4. ProfileView Updates | 2 hours | ✅ Complete | Chat section in ProfileView.svelte |
| 5. Styling & Polish | 1 hour | ✅ Complete | Full animations and responsive design |
| 6. Testing | 1 hour | ✅ Complete | Tested with POTJ and file contexts |
| **Total** | **8 hours** | **✅ Complete** | |

---

## Success Metrics

- [ ] Users ask average of 5+ questions per session
- [ ] 80%+ AI response accuracy (user satisfaction)
- [ ] <3 second response time
- [ ] Chat used on 60%+ of POTJ views
- [ ] Zero critical bugs after 1 week

---

**Ready to implement?** Let's start with Step 1: Database Schema Updates!
