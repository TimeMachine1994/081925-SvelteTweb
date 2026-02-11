# Per-User Message Read Tracking System

Implement a `message_reads` table to track which users have seen each message, enabling accurate unread counts for multi-attorney cases where multiple participants need independent read tracking.

---

## Current State Summary

| Component | Current Behavior |
|-----------|------------------|
| `messages.readAt` | Single timestamp - only tracks if ONE person read it |
| `recipientId` | Single recipient - doesn't support multi-party messaging |
| Unread count | Filters by `recipientId` OR local `readAt` check (inconsistent) |
| ChatSlider | Marks messages read only if `senderId !== currentUser` |

---

## Work Breakdown Structure

### Phase 1: Database Schema Changes

#### 1.1 Add `message_reads` table to schema
**File:** `src/lib/server/db/schema.ts`

```typescript
export const messageReads = sqliteTable('message_reads', {
  id: text('id').primaryKey(),
  messageId: text('message_id')
    .notNull()
    .references(() => messages.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  readAt: integer('read_at')
    .notNull()
    .default(sql`(unixepoch())`)
});
```

#### 1.2 Add relations for `messageReads`
- `messageReads` → `messages` (many-to-one)
- `messageReads` → `user` (many-to-one)
- `messages` → `messageReads` (one-to-many)

#### 1.3 Push schema changes
```bash
npx drizzle-kit push
```

---

### Phase 2: Backend API Changes

#### 2.1 Update `/api/messages/send/+server.ts`
- After creating message, auto-insert a `message_reads` entry for the **sender** (they've seen their own message)
- This prevents sender's own messages from counting as unread

#### 2.2 Update `/api/messages/mark-read/+server.ts`
- Change from updating `messages.readAt` to inserting into `message_reads`
- Accept `messageIds` array + use current user's ID
- Upsert logic: only insert if no existing read entry for that user+message combo

#### 2.3 Update `/api/messages/unread/+server.ts`
- Count messages where the user does NOT have a `message_reads` entry
- Filter by case participants (client, lawyer, assigned staff)
- Return counts grouped by caseId

#### 2.4 Update `/api/messages/+server.ts` (GET)
- Include current user's read status in response
- Add `isReadByMe: boolean` field derived from `message_reads` join

#### 2.5 Update `/api/messages/poll/+server.ts`
- Same as above - include `isReadByMe` in polled messages

---

### Phase 3: Frontend Store Changes

#### 3.1 Update `src/lib/stores/messages.svelte.ts`
- Update `Message` type to include `isReadByMe?: boolean`
- Update `markAsRead()` to use new API behavior
- Update unread filtering logic to use `isReadByMe`

---

### Phase 4: Frontend Component Changes

#### 4.1 Update `src/lib/components/MessageBubble.svelte`
- Change read indicator logic from `message.readAt` to `message.isReadByMe` or read status
- For sender's view: could show "read by X of Y" for multi-party (optional enhancement)

#### 4.2 Update `src/lib/components/ChatSlider.svelte`
- Change unread filter from `!item.message.readAt` to `!item.message.isReadByMe`
- Mark messages as read when chat opens (already filters by senderId)

#### 4.3 Update `src/routes/dashboard/client/+page.svelte`
- Change unread count from `filter(m => !m.message.readAt)` to use store's `unreadCounts.total`

#### 4.4 Update `src/routes/dashboard/lawyer/+page.svelte`
- Same fix for lawyer dashboard unread display

---

### Phase 5: Data Migration (Optional)

#### 5.1 Migrate existing `readAt` data
- For any message with `readAt` set, create a `message_reads` entry for the `recipientId`
- This preserves historical read state

#### 5.2 Deprecate `messages.readAt` column
- Keep column for now (backward compat)
- Remove in future migration once new system is verified

---

## File Change Summary

| File | Action |
|------|--------|
| `src/lib/server/db/schema.ts` | Add `messageReads` table + relations |
| `src/routes/api/messages/send/+server.ts` | Insert sender read entry |
| `src/routes/api/messages/mark-read/+server.ts` | Rewrite to use `message_reads` |
| `src/routes/api/messages/unread/+server.ts` | Rewrite count logic |
| `src/routes/api/messages/+server.ts` | Add `isReadByMe` to response |
| `src/routes/api/messages/poll/+server.ts` | Add `isReadByMe` to response |
| `src/lib/stores/messages.svelte.ts` | Update types and logic |
| `src/lib/components/ChatSlider.svelte` | Use new read status |
| `src/lib/components/MessageBubble.svelte` | Update read indicator |
| `src/routes/dashboard/client/+page.svelte` | Fix unread count |
| `src/routes/dashboard/lawyer/+page.svelte` | Fix unread count |

---

## Testing Checklist

- [ ] Sending a message doesn't count as unread for sender
- [ ] Message appears as unread for all other case participants
- [ ] Opening chat marks messages as read for current user only
- [ ] Other users still see messages as unread until they view
- [ ] Unread counts update correctly on dashboard
- [ ] Multiple attorneys on same case have independent read tracking
- [ ] Read receipts (✓✓) display correctly for sender

---

## Estimated Effort

| Phase | Complexity | Estimate |
|-------|------------|----------|
| Phase 1 | Low | 15 min |
| Phase 2 | Medium | 45 min |
| Phase 3 | Low | 15 min |
| Phase 4 | Low | 20 min |
| Phase 5 | Low | 10 min |
| **Total** | | **~1.5-2 hours** |
