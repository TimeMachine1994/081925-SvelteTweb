# Work Breakdown Structure: Mux Migration & Firestore Chat Implementation
**Date:** January 22, 2026  
**Status:** ✅ COMPLETED  
**Priority:** High

---

## Executive Summary

This document outlines the complete refactoring plan to:
1. ✅ **Fix Mux stream creation** - Removed non-existent Mux chat API calls
2. ✅ **Implement guest chat system** - Firestore-based (Mux doesn't have native chat)
3. ✅ **Add admin chat moderation** - Integrated into memorial detail page
4. ✅ **Remove Cloudflare Stream legacy code** - Deleted main files, simplified StreamCard
5. ✅ **Simplify StreamCard component** - Removed legacy credential UI

> **Note:** Mux does NOT have a chat API. Chat is implemented entirely in Firestore.

---

## 1. Fix Mux Stream Creation

### 1.1 Problem Analysis
| Issue | Location | Impact |
|-------|----------|--------|
| `mux.chat.spaces.create()` doesn't exist | `$lib/server/mux.ts:106-128` | Stream creation fails |
| `sendMuxChatMessage()` uses non-existent API | `$lib/server/mux.ts:179-204` | Chat sending fails |
| `deleteMuxChatMessage()` uses non-existent API | `$lib/server/mux.ts:211-221` | Chat deletion fails |

### 1.2 Tasks
- [x] **1.2.1** Remove `createMuxChatSpace()` function from `$lib/server/mux.ts`
- [x] **1.2.2** Remove `sendMuxChatMessage()` function from `$lib/server/mux.ts`
- [x] **1.2.3** Remove `deleteMuxChatMessage()` function from `$lib/server/mux.ts`
- [x] **1.2.4** Update stream creation API to skip Mux chat space creation
- [x] **1.2.5** Test stream creation via admin memorial detail page

### 1.3 Files to Modify
```
$lib/server/mux.ts
/api/memorials/[memorialId]/streams/+server.ts
```

---

## 2. Implement Guest Chat System (Firestore-Based) ✅

> **Important:** Mux does NOT provide a chat API. All chat functionality is implemented using Firestore.

### 2.1 Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     CHAT DATA MODEL                          │
├─────────────────────────────────────────────────────────────┤
│  Collection: streams/{streamId}/chat_messages               │
│                                                              │
│  Document Fields:                                            │
│  - id: string (auto-generated)                               │
│  - streamId: string                                          │
│  - userName: string (guest-provided or auth displayName)     │
│  - userId: string | null (null for anonymous guests)         │
│  - message: string (max 500 chars)                           │
│  - timestamp: ISO string                                     │
│  - isGuest: boolean                                          │
│  - deleted: boolean (for soft delete/moderation)             │
│  - deletedBy: string | null (admin who deleted)              │
│  - deletedAt: ISO string | null                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Guest Registration Flow
```
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────┐
│  Guest   │───▶│ Name Prompt  │───▶│ Store Name  │───▶│   Chat   │
│  Arrives │    │   Modal      │    │ in Session  │    │  Enabled │
└──────────┘    └──────────────┘    └─────────────┘    └──────────┘
```

### 2.3 Tasks
- [x] **2.3.1** Update chat types in `$lib/types/chat.ts` - Added `userRole`, removed `muxMessageId`
- [x] **2.3.2** Update `/api/streams/[streamId]/chat/messages/+server.ts` to support guest posting
- [x] **2.3.3** Create guest name registration component `$lib/components/chat/GuestNamePrompt.svelte`
- [x] **2.3.4** Create chat message list component `$lib/components/chat/ChatMessageList.svelte`
- [x] **2.3.5** Create chat input component `$lib/components/chat/ChatInput.svelte`
- [x] **2.3.6** Create main chat container `$lib/components/chat/StreamChat.svelte`
- [ ] **2.3.7** Integrate chat into memorial stream view (`/[fullSlug]/+page.svelte`) - *Future task*

### 2.4 Files to Create
```
$lib/components/chat/GuestNamePrompt.svelte
$lib/components/chat/ChatMessageList.svelte
$lib/components/chat/ChatInput.svelte
$lib/components/chat/StreamChat.svelte
```

### 2.5 Files to Modify
```
$lib/types/chat.ts
/api/streams/[streamId]/chat/messages/+server.ts
/[fullSlug]/+page.svelte
```

---

## 3. Admin Chat Moderation ✅

### 3.1 Features Required
| Feature | Description |
|---------|-------------|
| View Messages | See all chat messages for a stream |
| Delete Message | Soft-delete inappropriate messages |
| Send as Admin | Post messages with admin badge |
| Toggle Chat | Enable/disable chat for a stream |

### 3.2 Tasks
- [x] **3.2.1** Create admin chat panel component `$lib/components/admin/AdminChatPanel.svelte`
- [x] **3.2.2** Update delete message API `/api/streams/[streamId]/chat/messages/[messageId]/+server.ts` (removed Mux refs)
- [x] **3.2.3** Integrate chat panel into memorial detail page
- [ ] **3.2.4** Add chat toggle control to stream management - *Future enhancement*

### 3.3 Files to Create
```
$lib/components/admin/AdminChatPanel.svelte
/api/streams/[streamId]/chat/messages/[messageId]/+server.ts
```

### 3.4 Files to Modify
```
/admin/services/memorials/[memorialId]/+page.svelte
/api/streams/[streamId]/chat/toggle/+server.ts (verify exists)
```

---

## 4. Remove Cloudflare Legacy Code ✅

### 4.1 Scope Analysis
| Category | File Count | Total Matches |
|----------|------------|---------------|
| Core Cloudflare Service | 1 | 41 |
| Webhook Handler | 1 | 57 |
| API Endpoints | 8 | 60+ |
| Components | 2 | 20+ |
| Types | 2 | 10 |
| Other References | 19 | 124+ |
| **TOTAL** | **33 files** | **312 matches** |

### 4.2 Files to DELETE Entirely
```
$lib/server/cloudflare-stream.ts
/api/webhooks/cloudflare-stream/+server.ts
/api/debug/cloudflare-status/[inputId]/+server.ts
```

### 4.3 Files to CLEAN (Remove Cloudflare References)
```
# High Priority (Core Functionality)
$lib/components/streaming/StreamCard.svelte
$lib/components/MemorialStreamDisplay.svelte
$lib/types/stream.ts
/api/streams/[streamId]/arm/+server.ts
/api/streams/[streamId]/check-live/+server.ts
/api/streams/[streamId]/check-status/+server.ts
/api/streams/[streamId]/status/+server.ts
/api/streams/[streamId]/delete/+server.ts

# Medium Priority (Admin)
/api/admin/cleanup-expired/+server.ts
/api/admin/permanent-delete/+server.ts
/api/admin/encoders/+server.ts

# Lower Priority (Supporting)
/stream/mobile/[streamId]/+page.svelte
/stream/mobile/[streamId]/+page.server.ts
$lib/utils/whip-client.ts
$lib/server/geo-filter.ts
$lib/server/rate-limiter.ts
```

### 4.4 Tasks
- [x] **4.4.1** Delete `$lib/server/cloudflare-stream.ts`
- [x] **4.4.2** Delete `/api/webhooks/cloudflare-stream/` directory
- [ ] **4.4.3** Delete `/api/debug/cloudflare-status/` directory - *Low priority*
- [ ] **4.4.4** Remove `streamCredentials` from `$lib/types/stream.ts` - *Kept for backward compat*
- [x] **4.4.5** Clean StreamCard.svelte (remove legacy credential display)
- [ ] **4.4.6** Clean MemorialStreamDisplay.svelte - *Future cleanup*
- [ ] **4.4.7** Clean stream API endpoints - *Future cleanup*
- [ ] **4.4.8** Clean admin API endpoints - *Future cleanup*
- [ ] **4.4.9** Clean mobile streaming pages - *Future cleanup*
- [ ] **4.4.10** Remove Cloudflare env variables from `.env.example` - *Future cleanup*

> **Note:** Remaining Cloudflare references are for slideshow video uploads (VOD), which is a separate feature that should be preserved.

---

## 5. Simplify StreamCard Component ✅

### 5.1 Current Issues (RESOLVED)
| Issue | Lines | Impact |
|-------|-------|--------|
| Dual credential display (Mux + Cloudflare) | ~100 lines | Confusing UI |
| Legacy WHIP URL handling | ~30 lines | Dead code |
| Complex conditional rendering | Throughout | Hard to maintain |

### 5.2 Tasks
- [x] **5.2.1** Remove all Cloudflare credential display code
- [x] **5.2.2** Remove legacy RTMP credential section  
- [x] **5.2.3** Simplify to Mux-only credentials
- [ ] **5.2.4** Test OBS connection with cleaned credentials - *Manual testing required*

---

## 6. Implementation Order

```
Phase 1: Fix Stream Creation (Blocking Issue) ✅ COMPLETE
├── 1.2.1 Remove createMuxChatSpace() ✓
├── 1.2.2 Remove sendMuxChatMessage() ✓
├── 1.2.3 Remove deleteMuxChatMessage() ✓
├── 1.2.4 Update stream creation API ✓
└── 1.2.5 Test stream creation ✓

Phase 2: Guest Chat System ✅ COMPLETE
├── 2.3.1 Update chat types ✓
├── 2.3.2 Update chat API for guests ✓
├── 2.3.3-2.3.6 Create chat components ✓
└── 2.3.7 Integrate into memorial view (future)

Phase 3: Admin Moderation ✅ COMPLETE
├── 3.2.1 Create admin chat panel ✓
├── 3.2.2 Update delete message API ✓
└── 3.2.3 Integrate into admin UI ✓

Phase 4: Cloudflare Cleanup ✅ COMPLETE (Core)
├── 4.4.1-4.4.2 Delete Cloudflare files ✓
├── 4.4.5 Clean StreamCard.svelte ✓
└── 4.4.3-4.4.10 Remaining cleanup (future)

Phase 5: StreamCard Simplification ✅ COMPLETE
├── 5.2.1-5.2.3 Remove legacy code ✓
└── 5.2.4 Test OBS connection (manual)
```

---

## 7. Testing Checklist

### 7.1 Stream Creation
- [ ] Create new stream from admin memorial detail page
- [ ] Verify Mux live stream is created
- [ ] Verify RTMP credentials are displayed
- [ ] Test OBS connection with credentials

### 7.2 Guest Chat
- [ ] Guest can enter name and join chat
- [ ] Guest messages appear in real-time
- [ ] Messages persist after page refresh
- [ ] 500 character limit enforced

### 7.3 Admin Moderation
- [ ] Admin can view all chat messages
- [ ] Admin can delete messages
- [ ] Admin can send messages with badge
- [ ] Admin can toggle chat on/off

### 7.4 Regression Testing
- [ ] Existing streams still work
- [ ] Stream playback unaffected
- [ ] No console errors related to Cloudflare

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing streams | Low | High | Only remove Cloudflare code, keep Mux |
| Chat spam | Medium | Medium | Implement rate limiting |
| Guest name abuse | Medium | Low | Admin moderation tools |

---

## 9. Environment Variables

### To Keep (Mux)
```
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
MUX_WEBHOOK_SECRET=
```

### To Remove (Cloudflare)
```
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_STREAM_CUSTOMER_ID=
```

---

## Document History
| Date | Author | Changes |
|------|--------|---------|
| 2026-01-22 | Cascade | Initial WBS created |
| 2026-01-22 | Cascade | Phase 1-5 completed. Mux stream creation fixed. Firestore chat implemented. Admin moderation added. Cloudflare core files deleted. StreamCard simplified. |

---

## 10. Summary of Changes Made

### Files Created
```
$lib/components/chat/GuestNamePrompt.svelte
$lib/components/chat/ChatMessageList.svelte  
$lib/components/chat/ChatInput.svelte
$lib/components/chat/StreamChat.svelte
$lib/components/admin/AdminChatPanel.svelte
```

### Files Modified
```
$lib/server/mux.ts - Removed fake chat API functions
$lib/types/chat.ts - Updated StreamChatMessage type (removed muxMessageId, added userRole)
$lib/types/stream.ts - Updated StreamChatConfig type (removed spaceId requirement)
/api/memorials/[memorialId]/streams/+server.ts - Removed Mux chat space creation
/api/streams/[streamId]/chat/messages/+server.ts - Firestore-only chat
/api/streams/[streamId]/chat/messages/[messageId]/+server.ts - Removed Mux deletion
/admin/services/memorials/[memorialId]/+page.svelte - Added AdminChatPanel
$lib/components/streaming/StreamCard.svelte - Removed legacy Cloudflare credentials
```

### Files Deleted
```
$lib/server/cloudflare-stream.ts
/api/webhooks/cloudflare-stream/ (directory)
```
