import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Users table with role-based access
export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: text('role', { enum: ['client', 'lawyer', 'admin'] }).notNull().default('client'),
	email: text('email').notNull().unique(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	phoneNumber: text('phone_number'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// Session management
export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

// Cases (legal matters)
export const cases = sqliteTable('case', {
	id: text('id').primaryKey(),
	clientId: text('client_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	lawyerId: text('lawyer_id')
		.notNull()
		.references(() => user.id, { onDelete: 'restrict' }),
	title: text('title').notNull(),
	description: text('description'),
	status: text('status', { enum: ['active', 'pending', 'closed'] }).notNull().default('pending'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// Documents attached to cases
export const documents = sqliteTable('document', {
	id: text('id').primaryKey(),
	caseId: text('case_id')
		.notNull()
		.references(() => cases.id, { onDelete: 'cascade' }),
	uploadedById: text('uploaded_by_id')
		.notNull()
		.references(() => user.id, { onDelete: 'restrict' }),
	fileName: text('file_name').notNull(),
	filePath: text('file_path').notNull(),
	fileSize: integer('file_size').notNull(),
	mimeType: text('mime_type').notNull(),
	uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull()
});

// Invoices for legal services
export const invoices = sqliteTable('invoice', {
	id: text('id').primaryKey(),
	caseId: text('case_id')
		.notNull()
		.references(() => cases.id, { onDelete: 'cascade' }),
	amount: integer('amount').notNull(), // Amount in cents
	description: text('description').notNull(),
	status: text('status', { enum: ['unpaid', 'partial', 'paid'] }).notNull().default('unpaid'),
	dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
	paidAmount: integer('paid_amount').notNull().default(0), // Amount paid in cents
	stripePaymentIntentId: text('stripe_payment_intent_id'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	paidAt: integer('paid_at', { mode: 'timestamp' })
});

// Messages between clients and lawyers
export const messages = sqliteTable('message', {
	id: text('id').primaryKey(),
	caseId: text('case_id')
		.notNull()
		.references(() => cases.id, { onDelete: 'cascade' }),
	senderId: text('sender_id')
		.notNull()
		.references(() => user.id, { onDelete: 'restrict' }),
	content: text('content').notNull(),
	attachmentDocumentId: text('attachment_document_id')
		.references(() => documents.id, { onDelete: 'set null' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	readAt: integer('read_at', { mode: 'timestamp' })
});

// Type exports
export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Case = typeof cases.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Message = typeof messages.$inferSelect;
