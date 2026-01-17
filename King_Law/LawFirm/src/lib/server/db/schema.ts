import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Users Table
export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: text('role', { enum: ['client', 'lawyer', 'admin'] })
		.notNull()
		.default('client'),
	email: text('email').notNull().unique(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	phoneNumber: text('phone_number'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

// Cases Table
export const cases = sqliteTable('cases', {
	id: text('id').primaryKey(),
	clientId: text('client_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	lawyerId: text('lawyer_id')
		.notNull()
		.references(() => user.id, { onDelete: 'restrict' }),
	title: text('title').notNull(),
	description: text('description'),
	status: text('status', { enum: ['active', 'pending', 'closed'] })
		.notNull()
		.default('pending'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

// Documents Table
export const documents = sqliteTable('documents', {
	id: text('id').primaryKey(),
	caseId: text('case_id').references(() => cases.id, { onDelete: 'set null' }),
	uploadedById: text('uploaded_by_id')
		.notNull()
		.references(() => user.id, { onDelete: 'restrict' }),
	fileName: text('file_name').notNull(),
	filePath: text('file_path').notNull(),
	fileSize: integer('file_size').notNull(),
	mimeType: text('mime_type').notNull(),
	uploadedAt: integer('uploaded_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

// Invoices Table
export const invoices = sqliteTable('invoices', {
	id: text('id').primaryKey(),
	caseId: text('case_id')
		.notNull()
		.references(() => cases.id, { onDelete: 'cascade' }),
	amount: integer('amount').notNull(),
	description: text('description').notNull(),
	status: text('status', { enum: ['unpaid', 'partial', 'paid'] })
		.notNull()
		.default('unpaid'),
	dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
	paidAmount: integer('paid_amount').notNull().default(0),
	stripePaymentIntentId: text('stripe_payment_intent_id'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	paidAt: integer('paid_at', { mode: 'timestamp' })
});

// Messages Table
export const messages = sqliteTable('messages', {
	id: text('id').primaryKey(),
	caseId: text('case_id').references(() => cases.id, { onDelete: 'set null' }),
	senderId: text('sender_id')
		.notNull()
		.references(() => user.id, { onDelete: 'restrict' }),
	recipientId: text('recipient_id').references(() => user.id, { onDelete: 'restrict' }),
	content: text('content').notNull(),
	attachmentDocumentId: text('attachment_document_id').references(() => documents.id, {
		onDelete: 'set null'
	}),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	readAt: integer('read_at', { mode: 'timestamp' })
});

// Session Table (for Lucia auth)
export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

// Relations
export const userRelations = relations(user, ({ many }) => ({
	casesAsClient: many(cases, { relationName: 'client' }),
	casesAsLawyer: many(cases, { relationName: 'lawyer' }),
	documents: many(documents),
	messagesSent: many(messages, { relationName: 'sender' }),
	messagesReceived: many(messages, { relationName: 'recipient' }),
	sessions: many(session)
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
	client: one(user, {
		fields: [cases.clientId],
		references: [user.id],
		relationName: 'client'
	}),
	lawyer: one(user, {
		fields: [cases.lawyerId],
		references: [user.id],
		relationName: 'lawyer'
	}),
	documents: many(documents),
	invoices: many(invoices),
	messages: many(messages)
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
	case: one(cases, {
		fields: [documents.caseId],
		references: [cases.id]
	}),
	uploadedBy: one(user, {
		fields: [documents.uploadedById],
		references: [user.id]
	}),
	attachedMessages: many(messages)
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
	case: one(cases, {
		fields: [invoices.caseId],
		references: [cases.id]
	})
}));

export const messagesRelations = relations(messages, ({ one }) => ({
	case: one(cases, {
		fields: [messages.caseId],
		references: [cases.id]
	}),
	sender: one(user, {
		fields: [messages.senderId],
		references: [user.id],
		relationName: 'sender'
	}),
	recipient: one(user, {
		fields: [messages.recipientId],
		references: [user.id],
		relationName: 'recipient'
	}),
	attachment: one(documents, {
		fields: [messages.attachmentDocumentId],
		references: [documents.id]
	})
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}));
