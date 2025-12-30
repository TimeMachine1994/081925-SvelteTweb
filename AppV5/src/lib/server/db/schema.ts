import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const project = sqliteTable('project', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	directoryPath: text('directory_path').notNull(),
	scanData: text('scan_data'), // JSON string of scan result
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export type Project = typeof project.$inferSelect;
export type NewProject = typeof project.$inferInsert;

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const chatMessage = sqliteTable('chat_message', {
	id: text('id').primaryKey(),
	contextType: text('context_type').notNull(), // 'potj' or 'file'
	contextId: text('context_id').notNull(), // POTJ ID or file path
	role: text('role').notNull(), // 'user' or 'assistant'
	content: text('content').notNull(),
	timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
	metadata: text('metadata') // JSON: tokens, model, etc.
});

export type Session = typeof session.$inferSelect;
export type ChatMessage = typeof chatMessage.$inferSelect;
export type NewChatMessage = typeof chatMessage.$inferInsert;

export type User = typeof user.$inferSelect;

export const fileSnapshot = sqliteTable('file_snapshot', {
	id: text('id').primaryKey(),
	filePath: text('file_path').notNull(),
	relativePath: text('relative_path').notNull(),
	lastModified: integer('last_modified').notNull(),
	contentHash: text('content_hash').notNull(),
	fileSize: integer('file_size').notNull(),
	journeyId: text('journey_id').notNull(),
	potjId: text('potj_id'),
	snapshotAt: integer('snapshot_at', { mode: 'timestamp' }).notNull(),
	currentStatus: text('current_status').default('synced'),
	detectedAt: integer('detected_at', { mode: 'timestamp' })
});

export type FileSnapshot = typeof fileSnapshot.$inferSelect;
export type NewFileSnapshot = typeof fileSnapshot.$inferInsert;
