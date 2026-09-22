import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { bool, timestamps } from './_helpers';

/**
 * Unified memorial chat.
 *
 * Replaces the old, separate `streams/{streamId}/chat_messages` (Firestore)
 * and `memorials/{memorialId}/chat` (Firestore, never actually mounted)
 * collections with a single per-memorial thread. Chat is no longer scoped to
 * an individual livestream: it exists for the lifetime of the memorial page
 * and is always available to visitors, whether or not a service is live.
 */

/** One row per memorial. Replaces the old per-stream `chat.enabled/locked/archived` flags. */
export const memorialChatSettings = sqliteTable('memorial_chat_settings', {
	memorialId: text('memorial_id').primaryKey(),
	enabled: bool('enabled').notNull().default(true),
	locked: bool('locked').notNull().default(false),
	archived: bool('archived').notNull().default(false),
	...timestamps
});

export const memorialChatMessages = sqliteTable(
	'memorial_chat_messages',
	{
		id: text('id').primaryKey(),
		memorialId: text('memorial_id').notNull(),

		// 'user' = authenticated account, 'guest' = anonymous visitor with a display name
		authorType: text('author_type').notNull(),
		userId: text('user_id'),
		userName: text('user_name').notNull(),
		userRole: text('user_role'), // 'admin' | 'owner' | 'funeral_director' | 'viewer' | null for guests
		guestSessionId: text('guest_session_id'), // stable per-browser-session id, for guest moderation grouping

		message: text('message').notNull(),

		isEdited: bool('is_edited').notNull().default(false),
		editedAt: text('edited_at'),

		isDeleted: bool('is_deleted').notNull().default(false),
		deletedAt: text('deleted_at'),
		deletedBy: text('deleted_by'),

		flagged: bool('flagged').notNull().default(false),
		flagReason: text('flag_reason'),

		replyTo: text('reply_to'),

		// Provenance only (which stream, if any, was live when this was posted or
		// migrated from) — never used to scope/filter the chat itself.
		sourceStreamId: text('source_stream_id'),

		createdAt: text('created_at').notNull()
	},
	(t) => [index('mcm_memorial_created_idx').on(t.memorialId, t.createdAt)]
);
