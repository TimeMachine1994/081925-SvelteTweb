# Viewer Role Implementation Plan

## 🎯 Overview

This document outlines the implementation of a full-featured **viewer role** system for Tributestream, enabling users to register as viewers, participate in memorial services through chat, follow memorials, and manage their activity through a dedicated profile page.

## 🔍 Current State Analysis

### ✅ What Already Exists
- **Backend Registration**: `registerViewer` server action in `/register/+page.server.ts`
- **Firebase Auth Setup**: Custom claims for viewer role (`role: 'viewer'`, `isViewer: true`)
- **User Profile Creation**: Firestore user document creation with viewer role
- **Type Definitions**: Viewer role in most TypeScript interfaces (`lib/auth.ts`, `lib/utils/user-profile.ts`)
- **Test Support**: Demo system and test accounts include viewer role

### ❌ What Was Missing
- **Type Coverage**: `app.d.ts` missing viewer in role union → **FIXED**
- **UI Registration**: No viewer option in registration form → **FIXED**
- **Permissions & Features**: No distinct viewer capabilities defined
- **Profile Page**: No viewer-specific dashboard
- **Chat System**: No memorial chat functionality
- **Following System**: Firestore structure exists but no UI implementation

## 🏗️ Architecture Design

### User Roles & Capabilities

| Role | Memorial Creation | Memorial Management | Chat | Following | Stream Viewing |
|------|-------------------|---------------------|------|-----------|----------------|
| **Admin** | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All |
| **Owner** | ✅ Own | ✅ Own | ✅ Own | ✅ All | ✅ All |
| **Funeral Director** | ✅ Clients | ✅ Clients | ✅ Clients | ✅ All | ✅ All |
| **Viewer** | ❌ No | ❌ No | ✅ Public | ✅ Public | ✅ Public |

### Data Structure

#### 1. **Chat System** (`memorials/{memorialId}/chat/{chatId}`)
```typescript
interface ChatMessage {
  id: string;
  memorialId: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'owner' | 'funeral_director' | 'viewer';
  message: string;
  timestamp: Timestamp;
  isEdited: boolean;
  editedAt?: Timestamp;
  isDeleted: boolean;
  deletedAt?: Timestamp;
  replyTo?: string; // ID of message being replied to
}
```

#### 2. **Following System** (`memorials/{memorialId}/followers/{userId}`)
```typescript
interface MemorialFollower {
  userId: string;
  memorialId: string;
  followedAt: Timestamp;
  notificationsEnabled: boolean;
  lastVisited?: Timestamp;
}
```

#### 3. **User Following List** (`users/{userId}/following/{memorialId}`)
```typescript
interface UserFollowing {
  memorialId: string;
  memorialName: string;
  memorialSlug: string;
  followedAt: Timestamp;
  notificationsEnabled: boolean;
  unreadMessages: number;
}
```

## 📋 Implementation Phases

### Phase 1: Foundation ✅ COMPLETED
- [x] Fix `app.d.ts` to include viewer role in type unions
- [x] Update registration UI to include viewer option
- [x] Set viewer as default selection (most common use case)
- [x] Update form action routing for viewer registration
- [x] Add reCAPTCHA verification for viewer registration

### Phase 2: Chat System 🚧 IN PROGRESS
- [ ] Create chat TypeScript interfaces
- [ ] Build chat API endpoints
  - POST `/api/memorials/[memorialId]/chat` - Send message
  - GET `/api/memorials/[memorialId]/chat` - Fetch messages
  - PUT `/api/memorials/[memorialId]/chat/[chatId]` - Edit message
  - DELETE `/api/memorials/[memorialId]/chat/[chatId]` - Delete message
- [ ] Create `ChatToggleButton` component (positioned below video)
- [ ] Create `ChatPanel` component (expandable/collapsible)
- [ ] Create `ChatBox` component for memorial pages
- [ ] Create `ChatMessage` component for individual messages
- [ ] Implement real-time chat updates (polling or Firestore listeners)
- [ ] Add message moderation for memorial owners
- [ ] Add unread message count badge on toggle button

### Phase 3: Following System 📌 PENDING
- [ ] Create following API endpoints
  - POST `/api/memorials/[memorialId]/follow` - Follow memorial
  - DELETE `/api/memorials/[memorialId]/follow` - Unfollow memorial
  - GET `/api/user/following` - Get user's followed memorials
- [ ] Add "Follow" button to memorial pages
- [ ] Show follower count on memorial pages
- [ ] Create notification preferences UI

### Phase 4: Viewer Profile Page 📊 PENDING
- [ ] Create `/profile/viewer` route for viewer-specific dashboard
- [ ] Display followed memorials with thumbnails and links
- [ ] Show chat history across all followed memorials
- [ ] Add unread message counts
- [ ] Implement "Recent Activity" feed
- [ ] Add notification preferences management

### Phase 5: Permissions & Security 🔒 PENDING
- [ ] Update Firestore security rules for chat access
- [ ] Update Firestore security rules for following access
- [ ] Implement rate limiting for chat messages
- [ ] Add profanity filter for chat messages
- [ ] Add report/flag functionality for inappropriate content

## 🔧 Technical Implementation Details

### Chat System Architecture

#### Real-time Updates Strategy
**Option 1: Polling (Simpler)**
- Client polls chat endpoint every 5-10 seconds
- Lower complexity, easier to implement
- Slightly higher latency

**Option 2: Firestore Listeners (Better UX)**
```typescript
// Client-side listener
const unsubscribe = onSnapshot(
  collection(db, `memorials/${memorialId}/chat`),
  (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    updateChatUI(messages);
  }
);
```

**Recommendation**: Start with polling, upgrade to listeners later for better UX.

#### Chat Component Structure
```
Memorial Page
├── StreamPlayer (Video)
├── ChatToggleButton.svelte (Below video - "💬 Chat (12)" with badge)
│   └── Opens/closes ChatPanel
└── ChatPanel.svelte (Collapsible container)
    ├── ChatHeader.svelte (Title, close button, follower count)
    ├── ChatMessages.svelte (Scrollable message list)
    │   └── ChatMessage.svelte (Individual message bubble)
    └── ChatInput.svelte (Message input form with send button)
```

#### Chat Panel UI Behavior
- **Default State**: Collapsed (hidden)
- **Toggle Button**: Fixed position below video player
  - Shows unread message count badge when collapsed
  - Text: "💬 Chat" or "💬 Chat (3)" with count
  - Gold accent color matching site theme (#D5BA7F)
  - Full-width button on mobile, centered on desktop
- **Expanded State**: Slides up/down from below video
  - Height: 400px (fixed) with internal scroll
  - Width: Full width on mobile, 600px max on desktop
  - Positioned below StreamPlayer in document flow
  - Header includes close button (✕) and memorial name
- **Animations**: Smooth slide transition (300ms ease-in-out)
- **Mobile**: Full-width panel, sticky toggle button
- **Keyboard Support**: ESC key closes panel, Enter sends message

#### Chat Toggle Button States
```typescript
// State 1: No unread messages, collapsed
[💬 Chat]

// State 2: Unread messages, collapsed
[💬 Chat (3)] ← Red badge with count

// State 3: Panel open
[💬 Hide Chat ↓]

// State 4: Not authenticated
[💬 Sign in to Chat] ← Links to login
```

### Following System Flow

#### Follow Action
```typescript
1. User clicks "Follow" button on memorial page
2. POST to /api/memorials/[memorialId]/follow
3. Server creates two documents:
   - memorials/{memorialId}/followers/{userId}
   - users/{userId}/following/{memorialId}
4. UI updates to show "Following" state
5. User can now see memorial in their profile
```

#### Unfollow Action
```typescript
1. User clicks "Unfollow" button
2. DELETE to /api/memorials/[memorialId]/follow
3. Server deletes both documents
4. UI updates to show "Follow" state
```

### Viewer Profile Page Layout

```
┌─────────────────────────────────────┐
│  Viewer Dashboard                   │
├─────────────────────────────────────┤
│  👤 User Info & Account Settings    │
├─────────────────────────────────────┤
│  📌 Followed Memorials (3)          │
│  ┌───────┐ ┌───────┐ ┌───────┐    │
│  │ Photo │ │ Photo │ │ Photo │    │
│  │ Name  │ │ Name  │ │ Name  │    │
│  │ 💬 12 │ │ 💬 0  │ │ 💬 5  │    │
│  └───────┘ └───────┘ └───────┘    │
├─────────────────────────────────────┤
│  💬 Recent Chat Activity            │
│  ├─ Message in "John's Memorial"   │
│  ├─ Message in "Jane's Memorial"   │
│  └─ Message in "John's Memorial"   │
├─────────────────────────────────────┤
│  🔔 Notification Preferences        │
│  ☑ Email notifications             │
│  ☑ New messages in followed         │
│  ☐ New livestreams                  │
└─────────────────────────────────────┘
```

## 🔐 Security Considerations

### Firestore Rules Updates

```javascript
// Chat collection rules
match /memorials/{memorialId}/chat/{chatId} {
  // Anyone can read public memorial chats
  allow read: if resource.data.memorialIsPublic == true;
  
  // Authenticated users can write to public memorial chats
  allow create: if request.auth != null && 
                   request.resource.data.userId == request.auth.uid;
  
  // Users can edit/delete their own messages
  allow update, delete: if request.auth != null && 
                           resource.data.userId == request.auth.uid;
  
  // Memorial owners can delete any message
  allow delete: if request.auth != null && 
                  get(/databases/$(database)/documents/memorials/$(memorialId)).data.ownerUid == request.auth.uid;
}

// Following collection rules
match /memorials/{memorialId}/followers/{userId} {
  // Users can follow/unfollow for themselves
  allow read, create, delete: if request.auth != null && 
                                 request.auth.uid == userId;
}

match /users/{userId}/following/{memorialId} {
  // Users can manage their own following list
  allow read, write: if request.auth != null && 
                       request.auth.uid == userId;
}
```

### Rate Limiting
- Chat messages: Max 10 messages per minute per user
- Follow actions: Max 20 follows per hour per user
- Implement using Firebase Functions or API middleware

### Content Moderation
- Client-side profanity filter (basic)
- Server-side validation for message length (max 500 chars)
- Report/flag functionality for inappropriate content
- Memorial owners can moderate (delete) messages

## 📊 Database Queries & Indexes

### Required Firestore Indexes

```json
{
  "collectionGroup": "chat",
  "fields": [
    { "fieldPath": "memorialId", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```

### Optimized Queries

```typescript
// Get recent chat messages for a memorial (with pagination)
const chatQuery = query(
  collection(db, `memorials/${memorialId}/chat`),
  where('isDeleted', '==', false),
  orderBy('timestamp', 'desc'),
  limit(50)
);

// Get user's followed memorials
const followingQuery = query(
  collection(db, `users/${userId}/following`),
  orderBy('followedAt', 'desc')
);

// Get chat messages across all followed memorials (for profile page)
const userChatsQuery = query(
  collectionGroup(db, 'chat'),
  where('userId', '==', userId),
  orderBy('timestamp', 'desc'),
  limit(20)
);
```

## 🎨 UI/UX Considerations

### Chat Panel Design

#### Placement & Layout
```
┌─────────────────────────────────────┐
│  Memorial Header                     │
├─────────────────────────────────────┤
│  📹 StreamPlayer (Video)            │
│                                      │
│  [Live stream or recording here]    │
│                                      │
├─────────────────────────────────────┤
│  [💬 Chat (3)]  ← Toggle Button     │
├─────────────────────────────────────┤
│  ⬇ CHAT PANEL EXPANDS HERE ⬇       │
│  ┌───────────────────────────────┐  │
│  │ Memorial Chat        [✕]      │  │
│  ├───────────────────────────────┤  │
│  │ 👤 John: Welcome everyone     │  │
│  │ 👤 Sarah: Beautiful service   │  │
│  │ 👤 Mike: Sending love 💙      │  │
│  │                               │  │
│  │              [scroll area]    │  │
│  ├───────────────────────────────┤  │
│  │ Type message...    [Send]     │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  Slideshow section...               │
└─────────────────────────────────────┘
```

#### Chat Panel Features
- **Fixed height with scroll**: 400px container, internal scrolling
- **Auto-scroll to bottom**: On new messages (with scroll lock option)
- **Loading states**: Spinner when sending messages
- **Error handling**: Retry button for failed sends
- **Authentication**: Shows "Sign in to chat" message when not logged in
- **Username display**: Name + role badge (Owner, Viewer, etc.)
- **Unread indicator**: Badge count on toggle button when collapsed
- **Responsive**: Full-width on mobile, max 600px on desktop (centered)

### Follow Button States
- **Not Following**: Blue "Follow" button
- **Following**: Gray "Following" button with checkmark
- **Loading**: Spinner + disabled state
- **Error**: Red error message

### Viewer Profile Features
- Empty states for no followed memorials
- Empty states for no chat history
- Search/filter functionality for followed memorials
- Unread message counts with visual indicators
- Quick navigation to memorial pages

## 🧪 Testing Strategy

### Unit Tests
- Chat message validation
- Following/unfollowing logic
- User permissions checking
- Message formatting and sanitization

### Integration Tests
- Complete chat flow (send, edit, delete)
- Follow/unfollow flow
- Profile page data loading
- Real-time update synchronization

### E2E Tests
```typescript
// Test: Viewer can follow a memorial
test('viewer follows memorial', async ({ page }) => {
  await page.goto('/memorial-page-url');
  await page.click('button:has-text("Follow")');
  await expect(page.locator('button:has-text("Following")')).toBeVisible();
});

// Test: Viewer can send chat message
test('viewer sends chat message', async ({ page }) => {
  await page.goto('/memorial-page-url');
  await page.fill('[data-testid="chat-input"]', 'Hello everyone');
  await page.click('[data-testid="send-message"]');
  await expect(page.locator('text=Hello everyone')).toBeVisible();
});
```

## 📈 Performance Optimization

### Chat System
- Implement pagination for old messages
- Use virtual scrolling for long chat histories
- Cache recent messages in localStorage
- Debounce typing indicators (if implemented)

### Following System
- Cache followed memorials list
- Lazy load memorial thumbnails
- Use incremental static regeneration for profile pages

## 🚀 Rollout Plan

### Phase 1: Soft Launch (Week 1)
- Deploy registration updates
- Enable chat on test memorials
- Gather feedback from internal team

### Phase 2: Beta Testing (Week 2)
- Enable for select funeral homes
- Monitor chat usage and moderation needs
- Collect user feedback

### Phase 3: Full Release (Week 3)
- Enable for all new memorials
- Migrate existing memorials (opt-in)
- Marketing announcement

## 📝 Future Enhancements

### Short-term (Next Quarter)
- [ ] Emoji reactions to chat messages
- [ ] Image sharing in chat
- [ ] Private messages between users
- [ ] Typing indicators
- [ ] Read receipts

### Long-term (Next Year)
- [ ] Video tributes from viewers
- [ ] Memorial photo albums (viewer contributions)
- [ ] Memorial guestbook (separate from chat)
- [ ] Memorial analytics for owners
- [ ] Email digest of followed memorial activities

## 📞 Support & Documentation

### User Documentation Needed
- "How to Follow a Memorial" guide
- "Using Memorial Chat" guide
- "Managing Your Viewer Profile" guide
- "Notification Settings" guide

### Admin Documentation Needed
- Chat moderation guidelines
- Handling inappropriate content
- User reporting procedures

## ✅ Success Metrics

### Key Performance Indicators
- **Registration**: 30% of new users choose viewer role
- **Engagement**: 50% of viewers follow at least one memorial
- **Chat Activity**: Average 10 messages per memorial service
- **Retention**: 60% of viewers return within 7 days
- **Moderation**: <1% of messages require moderation action

## 🎯 Summary

This implementation transforms Tributestream from a one-way streaming platform into an **interactive memorial experience** where viewers can:
1. **Participate** through chat during services
2. **Stay Connected** by following memorials
3. **Manage Activity** through a personalized profile
4. **Engage Meaningfully** with memorial communities

The viewer role creates a more engaging, community-driven experience while maintaining the dignity and respect appropriate for memorial services.

---

**Document Status**: 🚧 In Progress  
**Last Updated**: November 16, 2025  
**Next Review**: After Phase 2 Completion  
**Owner**: Development Team
