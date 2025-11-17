# Profile Page Activity Enhancement - Feature Specification

**Created:** November 17, 2025  
**Status:** Planning Phase  
**Priority:** High

---

## 🎯 Executive Summary

Enhance the profile page to show comprehensive user activity across the platform, not just memorial ownership. This creates a more engaging experience for all user types and encourages participation.

---

## 📋 Current State Analysis

### Existing Profile Page Behavior

**Route:** `/profile`

#### Owners
- ✅ Shows list of memorials they own
- ❌ No visibility into memorials they follow
- ❌ No visibility into their comment/chat activity

#### Funeral Directors
- ✅ Shows memorials they created/manage
- ❌ No visibility into memorials they follow
- ❌ No visibility into their engagement activity

#### Viewers
- ❌ Profile page shows nothing meaningful
- ❌ No call-to-action to create memorial
- ❌ No visibility into their activity

**Current Query Logic:**
```typescript
// From: src/routes/profile/+page.server.ts
if (role === 'funeral_director') {
  // Shows memorials where funeralDirectorUid matches
  memorialsSnap = await adminDb
    .collection('memorials')
    .where('funeralDirectorUid', '==', uid)
    .get();
} else if (role === 'owner') {
  // Shows memorials where ownerUid matches
  memorialsSnap = await adminDb
    .collection('memorials')
    .where('ownerUid', '==', uid)
    .get();
}
// Viewers get nothing
```

---

## 🎨 Desired State

### For All Users
Show comprehensive activity dashboard with:
1. **Owned Memorials** (if applicable)
2. **Followed Memorials** (memorials user is following)
3. **Activity Feed** (comments/messages user has posted)
4. **Create Memorial CTA** (if not owner)

---

## 🏗️ Technical Architecture

### 1. Data Collections Needed

#### A. **Followers Collection** (Partially Exists)

**Current Type Definition:**
```typescript
// From: src/lib/types/follower.ts
export interface Follower {
  uid: string;
  followedAt: Timestamp;
}
```

**Storage Structure:**
```
memorials/{memorialId}/followers/{userId}
{
  uid: string,
  followedAt: Timestamp
}
```

**Inverse Index Needed:**
```
users/{userId}/following/{memorialId}
{
  memorialId: string,
  memorialName: string,
  followedAt: Timestamp
}
```

#### B. **Chat/Comments Collection** (Already Exists! ✅)

**Current Implementation:**
```typescript
// From: src/lib/types/chat.ts
export interface ChatMessage {
  id: string;
  memorialId: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'owner' | 'funeral_director' | 'viewer';
  message: string;
  timestamp: Date | Timestamp;
  isEdited: boolean;
  editedAt?: Date | Timestamp;
  isDeleted: boolean;
  deletedAt?: Date | Timestamp;
  deletedBy?: string;
  replyTo?: string;
}
```

**Storage Structure:**
```
memorials/{memorialId}/chat/{messageId}
```

**API Endpoints Already Exist! ✅**
- `GET /api/memorials/[memorialId]/chat` - Fetch messages
- `POST /api/memorials/[memorialId]/chat` - Create message
- `PUT /api/memorials/[memorialId]/chat/[chatId]` - Edit message
- `DELETE /api/memorials/[memorialId]/chat/[chatId]` - Delete message

---

## 📊 Memorial Interface Enhancement

**Current Memorial Type:**
```typescript
// From: src/lib/types/memorial.ts (line 94)
export interface Memorial {
  // ... existing fields
  followerCount?: number; // ✅ Already exists!
  // ... other fields
}
```

---

## 🔧 Implementation Plan

### Phase 1: Backend Data Structure (Week 1)

#### Task 1.1: Create User Following Index
**New Collection:** `users/{userId}/following/{memorialId}`

**Create API Endpoint:**
```
POST /api/memorials/[memorialId]/follow
DELETE /api/memorials/[memorialId]/unfollow
GET /api/user/following
```

**Implementation Details:**
- Write to both `memorials/{id}/followers/{uid}` AND `users/{uid}/following/{memorialId}`
- Maintain followerCount on memorial document
- Include memorial name/slug for quick display

#### Task 1.2: User Activity Query Helper
**New File:** `src/lib/server/user-activity.ts`

```typescript
interface UserActivity {
  ownedMemorials: Memorial[];
  followedMemorials: Memorial[];
  recentComments: ChatMessage[];
  activityStats: {
    totalComments: number;
    memorialsFollowing: number;
    memorialsOwned: number;
  };
}

export async function getUserActivity(userId: string): Promise<UserActivity>
```

---

### Phase 2: Profile Page Server Enhancement (Week 1)

#### Update: `src/routes/profile/+page.server.ts`

**New Load Function:**
```typescript
export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const { uid, role } = locals.user;

  // 1. Fetch owned memorials (existing logic)
  let ownedMemorials: Memorial[] = [];
  if (role === 'owner' || role === 'funeral_director') {
    // ... existing query logic
  }

  // 2. NEW: Fetch followed memorials
  const followingSnap = await adminDb
    .collection('users')
    .doc(uid)
    .collection('following')
    .orderBy('followedAt', 'desc')
    .limit(20)
    .get();

  const followedMemorials = await Promise.all(
    followingSnap.docs.map(async (doc) => {
      const followData = doc.data();
      const memorialDoc = await adminDb
        .collection('memorials')
        .doc(followData.memorialId)
        .get();
      return { id: memorialDoc.id, ...memorialDoc.data() } as Memorial;
    })
  );

  // 3. NEW: Fetch user's recent comments
  const userCommentsQuery = await adminDb
    .collectionGroup('chat')
    .where('userId', '==', uid)
    .where('isDeleted', '==', false)
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();

  const recentComments = userCommentsQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ChatMessage[];

  return {
    profile: { /* existing */ },
    user: { /* existing */ },
    ownedMemorials: sanitizeData(ownedMemorials),
    followedMemorials: sanitizeData(followedMemorials), // NEW
    recentComments: sanitizeData(recentComments), // NEW
    activityStats: { // NEW
      totalComments: recentComments.length,
      memorialsFollowing: followedMemorials.length,
      memorialsOwned: ownedMemorials.length
    }
  };
};
```

---

### Phase 3: Profile Page UI Components (Week 2)

#### Component 1: Activity Dashboard
**New File:** `src/lib/components/profile/ActivityDashboard.svelte`

**Sections:**
1. **Stats Overview** - Cards showing counts
2. **Owned Memorials** - Existing memorial cards
3. **Followed Memorials** - New section with memorial cards
4. **Recent Activity** - Comment feed with links to memorials
5. **Create Memorial CTA** - For viewers/non-owners

#### Component 2: Followed Memorial Card
**New File:** `src/lib/components/profile/FollowedMemorialCard.svelte`

**Features:**
- Memorial name, dates, owner info
- "Unfollow" button
- Link to memorial page
- Last activity timestamp
- Follower count

#### Component 3: Activity Feed Item
**New File:** `src/lib/components/profile/ActivityFeedItem.svelte`

**Features:**
- Comment preview (truncated)
- Memorial context
- Timestamp
- Link to full comment on memorial page
- Edit/Delete options (if own comment)

---

### Phase 4: Follow/Unfollow Functionality (Week 2)

#### API Endpoints

**File:** `src/routes/api/memorials/[memorialId]/follow/+server.ts`

```typescript
// POST - Follow memorial
export const POST: RequestHandler = async ({ params, locals }) => {
  const { memorialId } = params;
  const userId = locals.user.uid;

  // 1. Add to memorial's followers
  await adminDb
    .collection('memorials')
    .doc(memorialId)
    .collection('followers')
    .doc(userId)
    .set({
      uid: userId,
      followedAt: Timestamp.now()
    });

  // 2. Add to user's following (inverse index)
  const memorial = await adminDb.collection('memorials').doc(memorialId).get();
  await adminDb
    .collection('users')
    .doc(userId)
    .collection('following')
    .doc(memorialId)
    .set({
      memorialId: memorialId,
      memorialName: memorial.data()?.lovedOneName,
      followedAt: Timestamp.now()
    });

  // 3. Increment follower count
  await adminDb
    .collection('memorials')
    .doc(memorialId)
    .update({
      followerCount: FieldValue.increment(1)
    });

  return json({ success: true });
};

// DELETE - Unfollow memorial
export const DELETE: RequestHandler = async ({ params, locals }) => {
  // Reverse of above operations
};
```

**File:** `src/routes/api/user/following/+server.ts`

```typescript
// GET - Fetch user's followed memorials
export const GET: RequestHandler = async ({ locals }) => {
  const userId = locals.user.uid;

  const followingSnap = await adminDb
    .collection('users')
    .doc(userId)
    .collection('following')
    .orderBy('followedAt', 'desc')
    .get();

  return json({
    following: followingSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  });
};
```

---

### Phase 5: Memorial Page Integration (Week 3)

#### Add Follow Button to Memorial Pages

**File:** `src/routes/[fullSlug]/+page.svelte`

**New Component:**
```svelte
<FollowButton 
  memorialId={memorial.id}
  isFollowing={userIsFollowing}
  followerCount={memorial.followerCount}
/>
```

**Features:**
- Shows follower count
- Toggle follow/unfollow
- Optimistic UI updates
- Login prompt if not authenticated

---

## 🎯 User Experience Flows

### Viewer User Journey

1. **Discover Memorial** → User visits public memorial
2. **Click Follow** → Follow button on memorial page
3. **View Profile** → See followed memorials in profile
4. **Engage** → Post comments, view activity feed
5. **Upgrade** → "Create Your Own Memorial" CTA

### Owner User Journey

1. **Create Memorial** → Existing flow
2. **Manage Memorials** → See owned memorials
3. **Follow Others** → Follow other memorials to show support
4. **View Activity** → See all engagement in one place

### Funeral Director Journey

1. **Manage Professional** → See memorials they manage
2. **Follow Memorials** → Follow for updates
3. **Track Engagement** → Monitor comments across memorials

---

## 📱 UI Mockup Structure

```
Profile Page
├── Header (User Info)
├── Stats Cards
│   ├── Memorials Owned
│   ├── Memorials Following
│   └── Total Comments
├── Owned Memorials Section
│   └── [Memorial Cards...]
├── Followed Memorials Section
│   ├── [Memorial Cards with Unfollow...]
│   └── "No followed memorials" empty state
├── Recent Activity Section
│   ├── [Comment Feed Items...]
│   └── "View All Activity" link
└── Create Memorial CTA (if viewer/no memorials)
```

---

## 🔐 Permissions & Security

### Read Permissions
- User can read their own following list
- User can read their own comments
- Public memorials: anyone can see follower count
- Private memorials: only authorized users

### Write Permissions
- Authenticated users can follow public memorials
- Only memorial owner/admin can manage followers
- Users can edit/delete only their own comments

---

## 📊 Database Indexes Required

```javascript
// Firestore Composite Indexes
{
  collection: 'chat',
  fields: [
    { fieldPath: 'userId', order: 'ASCENDING' },
    { fieldPath: 'isDeleted', order: 'ASCENDING' },
    { fieldPath: 'timestamp', order: 'DESCENDING' }
  ]
}
```

---

## 🚀 Implementation Priority

### Must Have (MVP)
1. ✅ Chat system (already exists)
2. ⬜ Following/Unfollow functionality
3. ⬜ Profile page showing followed memorials
4. ⬜ Profile page showing recent comments

### Should Have
1. ⬜ Activity stats dashboard
2. ⬜ Create Memorial CTA for viewers
3. ⬜ Pagination for activity feed
4. ⬜ Filter/sort options

### Nice to Have
1. ⬜ Activity notifications
2. ⬜ Follow suggestions
3. ⬜ Memorial engagement analytics
4. ⬜ Export activity data

---

## 📈 Success Metrics

### Engagement Metrics
- % of viewers who follow at least 1 memorial
- Average comments per user per week
- Conversion rate: viewer → memorial owner
- Time spent on profile page

### Technical Metrics
- API response time < 500ms
- Follow/unfollow success rate > 99%
- Comment load time < 300ms

---

## 🔍 Existing Codebase Assets

### ✅ Already Implemented
1. **Chat System** - Full CRUD API at `/api/memorials/[memorialId]/chat`
2. **Chat Types** - Complete TypeScript interfaces in `src/lib/types/chat.ts`
3. **Follower Type** - Basic interface in `src/lib/types/follower.ts`
4. **Memorial Type** - Includes `followerCount` field
5. **Profile Page** - Base structure exists, needs enhancement

### ⬜ Needs Implementation
1. **User Following Collection** - Inverse index for user's followed memorials
2. **Follow/Unfollow API** - Create new endpoints
3. **Profile Activity Query** - Aggregate user activity
4. **UI Components** - Activity dashboard, followed memorials section
5. **Memorial Follow Button** - Add to memorial pages

---

## 🔄 Migration Strategy

### Phase 1: New Features (Non-Breaking)
- Add new collections without modifying existing
- Implement new API endpoints
- Add UI components behind feature flag

### Phase 2: Profile Enhancement
- Update profile page load function
- Add new UI sections
- Test with small user group

### Phase 3: Memorial Page Integration
- Add follow button to memorial pages
- Update existing memorial queries
- Full rollout

---

## 🐛 Edge Cases & Considerations

### Data Consistency
- What if memorial is deleted but user still following?
  - **Solution:** Cleanup job or soft delete handling

### Privacy
- Private memorial followed by user, then made private
  - **Solution:** Check permissions on every load

### Performance
- User follows 1000+ memorials
  - **Solution:** Pagination + caching

### Notifications
- User gets comment replies?
  - **Future:** Notification system (Phase 2)

---

## 📚 Related Documentation

- [User Profile Utilities](src/lib/utils/user-profile.ts)
- [Chat System Types](src/lib/types/chat.ts)
- [Memorial Types](src/lib/types/memorial.ts)
- [Profile Page Server](src/routes/profile/+page.server.ts)
- [Chat API](src/routes/api/memorials/[memorialId]/chat/+server.ts)

---

## 🎉 Expected Benefits

### For Viewers
- Feel connected to platform even without owning memorial
- Clear activity history and engagement tracking
- Easy upgrade path to memorial creation

### For Owners
- See complete platform engagement
- Follow other memorials to show support
- Understand their own activity

### For Platform
- Increased user engagement
- Higher retention rates
- More memorial follows → more viral growth
- Better conversion funnel visibility

---

**Next Steps:**
1. Review and approve specification
2. Create technical implementation tickets
3. Set up database indexes
4. Begin Phase 1 implementation
