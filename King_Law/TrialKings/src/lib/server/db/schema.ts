import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const magicLink = sqliteTable('magic_link', {
	id: text('id').primaryKey(),
	email: text('email').notNull(),
	token: text('token').notNull().unique(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	used: integer('used', { mode: 'boolean' }).notNull().default(false)
});

export const file = sqliteTable('file', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	filename: text('filename').notNull(),
	originalName: text('original_name').notNull(),
	mimeType: text('mime_type').notNull(),
	size: integer('size').notNull(),
	storagePath: text('storage_path').notNull(),
	uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull()
});

export const printOrder = sqliteTable('print_order', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	status: text('status').notNull().default('pending'),
	totalAmount: integer('total_amount').notNull(),
	stripeSessionId: text('stripe_session_id'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const printOrderItem = sqliteTable('print_order_item', {
	id: text('id').primaryKey(),
	orderId: text('order_id')
		.notNull()
		.references(() => printOrder.id),
	fileId: text('file_id')
		.notNull()
		.references(() => file.id),
	quantity: integer('quantity').notNull(),
	pricePerUnit: integer('price_per_unit').notNull()
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type MagicLink = typeof magicLink.$inferSelect;
export type File = typeof file.$inferSelect;
export type PrintOrder = typeof printOrder.$inferSelect;
export type PrintOrderItem = typeof printOrderItem.$inferSelect;
