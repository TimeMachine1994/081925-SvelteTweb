# Chat System Work Breakdown Structure (WBS)

**Created:** January 22, 2026  
**Purpose:** Debug chat "archived" toggle issues for live streams

---

## 🔴 CRITICAL BUG FIXED

### Bug: Chat Toggle API Had Legacy `spaceId` Check
**File:** `src/routes/api/streams/[streamId]/chat/toggle/+server.ts`

**Before (BROKEN):**
```typescript
if (!stream?.chat?.spaceId) {
    throw svelteKitError(400, 'No chat space configured for this stream');
}
```

**After (FIXED):**
```typescript
// Log current chat state for debugging
console.log('💬 [CHAT TOGGLE API] Current chat config:', {
    enabled: stream?.chat?.enabled,
    archived: stream?.chat?.archived,
    messageCount: stream?.chat?.messageCount
});
```

**Impact:** Chat toggle was ALWAYS failing for new Mux streams because `spaceId` was a legacy Mux Spaces field that no longer exists.

---

## 📊 Chat Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CHAT DATA FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. STREAM CREATION                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ POST /api/memorials/[memorialId]/streams                             │    │
│  │ Creates: chat: { enabled: true, archived: false, messageCount: 0 }   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                               │
│                              ▼                                               │
│  2. FIRESTORE: streams/{streamId}                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ {                                                                    │    │
│  │   chat: {                                                            │    │
│  │     enabled: boolean,     ◄── Toggleable via admin panel             │    │
│  │     archived: boolean,    ◄── Set TRUE by Mux webhook on recording   │    │
│  │     messageCount: number                                             │    │
│  │   }                                                                  │    │
│  │ }                                                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                               │
│         ┌────────────────────┼────────────────────┐                         │
│         ▼                    ▼                    ▼                         │
│  3a. PAGE LOAD         3b. CHAT TOGGLE      3c. MUX WEBHOOK                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │ [fullSlug]   │     │ /api/streams │     │ /api/webhooks│                 │
│  │ +page.server │     │ /[id]/chat/  │     │ /mux         │                 │
│  │              │     │ toggle       │     │              │                 │
│  │ Reads chat   │     │              │     │ Sets         │                 │
│  │ data as-is   │     │ ✅ FIXED!    │     │ archived:true│                 │
│  └──────────────┘     └──────────────┘     │ on recording │                 │
│         │                                  │ ready        │                 │
│         ▼                                  └──────────────┘                 │
│  4. COMPONENT RENDER                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ MemorialStreamDisplay.svelte                                         │    │
│  │                                                                      │    │
│  │ Live Streams:    archived={stream.chat.archived || false}            │    │
│  │ Recorded:        archived={true}  (hardcoded)                        │    │
│  │ Processing:      archived={true}  (hardcoded)                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                               │
│                              ▼                                               │
│  5. LIVECHATWIDGET                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Props: { streamId, enabled, archived }                               │    │
│  │                                                                      │    │
│  │ if (archived) {                                                      │    │
│  │   - Shows "📼 Chat Archived" notice                                  │    │
│  │   - Disables message input form                                      │    │
│  │   - Stops polling for new messages                                   │    │
│  │ }                                                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Chat API Routes

| Route | Method | Purpose | File Location |
|-------|--------|---------|---------------|
| `/api/streams/[streamId]/chat/messages` | GET | Fetch chat messages | `src/routes/api/streams/[streamId]/chat/messages/+server.ts` |
| `/api/streams/[streamId]/chat/messages` | POST | Send new message | `src/routes/api/streams/[streamId]/chat/messages/+server.ts` |
| `/api/streams/[streamId]/chat/messages/[messageId]` | DELETE | Delete/moderate message | `src/routes/api/streams/[streamId]/chat/messages/[messageId]/+server.ts` |
| `/api/streams/[streamId]/chat/toggle` | PATCH | Enable/disable chat | `src/routes/api/streams/[streamId]/chat/toggle/+server.ts` |

---

## 📁 Chat Component Files

| File | Purpose |
|------|---------|
| `src/lib/components/streaming/LiveChatWidget.svelte` | Public chat UI for viewers |
| `src/lib/components/admin/AdminChatPanel.svelte` | Admin moderation panel |
| `src/lib/components/MemorialStreamDisplay.svelte` | Container that renders chat |
| `src/lib/types/chat.ts` | Chat message types |
| `src/lib/types/stream.ts` | Stream & chat config types |

---

## 🔧 Where `chat.archived` Gets Set

### 1. Stream Creation (archived = false)
**File:** `src/routes/api/memorials/[memorialId]/streams/+server.ts`
```typescript
chat: {
    enabled: true,
    archived: false,  // ✅ New streams start with live chat
    messageCount: 0,
    participantCount: 0,
    moderationMode: 'manual'
}
```

### 2. Recording Ready Webhook (archived = true)
**File:** `src/routes/api/webhooks/mux/+server.ts`
```typescript
await streamDoc.ref.update({
    status: 'completed',
    'chat.archived': true,  // Archives chat when recording is ready
    // ...
});
```

---

## 🐛 Debug Console Logs Added

### LiveChatWidget.svelte
```
═══════════════════════════════════════════════════
💬 [CHAT WIDGET] Component initialized
💬 [CHAT WIDGET] Stream ID: xxx
💬 [CHAT WIDGET] Chat enabled: true/false
💬 [CHAT WIDGET] Chat archived: true/false
💬 [CHAT WIDGET] Props received: { streamId, enabled, archived }
═══════════════════════════════════════════════════

💬 [CHAT WIDGET] Component MOUNTED
💬 [CHAT WIDGET] Mount state: { streamId, enabled, archived }

🔄 [CHAT WIDGET] LIVE MODE - Starting message polling
   OR
📼 [CHAT WIDGET] ARCHIVED MODE - Polling DISABLED
```

### MemorialStreamDisplay.svelte
```
🟢 [STREAM DISPLAY] LIVE stream chat props: {
    streamId,
    status,
    chatEnabled,
    chatArchived,
    passedArchived
}
```

### Chat Toggle API
```
💬 [CHAT TOGGLE API] Current chat config: {
    enabled,
    archived,
    messageCount
}
```

---

## ✅ Fixes Applied (January 22, 2026)

1. **Removed legacy `spaceId` check** from chat toggle API
2. **Added `archived: boolean`** to `StreamChatConfig` interface
3. **Added `archived: false`** to new stream creation
4. **Added copious console logging** throughout chat system
5. **Fixed invalid CSS** (`ring` → `box-shadow`)

---

## 🧪 How to Debug Chat Issues

1. **Open browser DevTools Console**
2. **Filter by `[CHAT`** to see all chat-related logs
3. **Look for:**
   - `archived: true` when it should be `false` (live stream)
   - `enabled: false` when chat should be on
   - API errors in `[CHAT API]` logs

4. **Check Firestore** for the stream document:
   - `streams/{streamId}/chat.archived`
   - `streams/{streamId}/chat.enabled`
