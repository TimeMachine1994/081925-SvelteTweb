import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Users Table
export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	username: text('username'),
	passwordHash: text('password_hash').notNull(),
	role: text('role', { enum: ['client', 'lawyer', 'staff', 'admin'] })
		.notNull()
		.default('client'),
	email: text('email').notNull().unique(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	phoneNumber: text('phone_number'),
	addressLine1: text('address_line1'),
	addressLine2: text('address_line2'),
	city: text('city'),
	state: text('state'),
	zipCode: text('zip_code'),
	dateOfBirth: text('date_of_birth'),
	preferredContact: text('preferred_contact', { enum: ['email', 'phone', 'text'] }),
	emergencyContactName: text('emergency_contact_name'),
	emergencyContactPhone: text('emergency_contact_phone'),
	squareCustomerId: text('square_customer_id'),
	squareCardId: text('square_card_id'),
	cardLastFour: text('card_last_four'),
	cardBrand: text('card_brand'),
	createdAt: integer('created_at')
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at')
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
	uploadedAt: integer('uploaded_at')
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
	dueDate: integer('due_date').notNull(),
	paidAmount: integer('paid_amount').notNull().default(0),
	stripePaymentIntentId: text('stripe_payment_intent_id'),
	createdAt: integer('created_at')
		.notNull()
		.default(sql`(unixepoch())`),
	paidAt: integer('paid_at')
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
	createdAt: integer('created_at')
		.notNull()
		.default(sql`(unixepoch())`),
	readAt: integer('read_at')
});

// Staff Codes Table (employee number → role mapping)
export const staffCodes = sqliteTable('staff_codes', {
	id: text('id').primaryKey(),
	employeeNumber: text('employee_number').notNull().unique(),
	role: text('role', { enum: ['lawyer', 'staff', 'admin'] }).notNull(),
	assignedToUserId: text('assigned_to_user_id').references(() => user.id, { onDelete: 'set null' }),
	createdAt: integer('created_at')
		.notNull()
		.default(sql`(unixepoch())`),
	usedAt: integer('used_at')
});

// System Settings Table (staff password, etc.)
export const systemSettings = sqliteTable('system_settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull(),
	updatedAt: integer('updated_at')
		.notNull()
		.default(sql`(unixepoch())`)
});

// Case Staff Assignments Table (staff assigned to cases)
export const caseStaffAssignments = sqliteTable('case_staff_assignments', {
	id: text('id').primaryKey(),
	caseId: text('case_id')
		.notNull()
		.references(() => cases.id, { onDelete: 'cascade' }),
	staffId: text('staff_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	assignedById: text('assigned_by_id')
		.notNull()
		.references(() => user.id, { onDelete: 'restrict' }),
	assignedAt: integer('assigned_at')
		.notNull()
		.default(sql`(unixepoch())`)
});

// Consultations Table (public form submissions)
export const consultations = sqliteTable('consultations', {
	id: text('id').primaryKey(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	email: text('email').notNull(),
	phone: text('phone'),
	message: text('message'),
	matterType: text('matter_type'),
	currentlyRepresented: text('currently_represented'),
	urgency: text('urgency'),
	preferredDate: text('preferred_date'),
	status: text('status', { enum: ['new', 'contacted', 'converted', 'dismissed'] })
		.notNull()
		.default('new'),
	createdAt: integer('created_at')
		.notNull()
		.default(sql`(unixepoch())`)
});

// Appointments Table (scheduled consultation bookings)
export const appointments = sqliteTable('appointments', {
	id: text('id').primaryKey(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	email: text('email').notNull(),
	phone: text('phone'),
	matterType: text('matter_type'),
	currentlyRepresented: text('currently_represented'),
	briefDescription: text('brief_description'),
	urgency: text('urgency'),
	startTime: text('start_time').notNull(),
	endTime: text('end_time').notNull(),
	googleEventId: text('google_event_id'),
	status: text('status', { enum: ['confirmed', 'cancelled'] })
		.notNull()
		.default('confirmed'),
	createdAt: integer('created_at')
		.notNull()
		.default(sql`(unixepoch())`)
});

// Session Table (for Lucia auth)
export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at').notNull()
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

export const staffCodesRelations = relations(staffCodes, ({ one }) => ({
	assignedUser: one(user, {
		fields: [staffCodes.assignedToUserId],
		references: [user.id]
	})
}));

export const caseStaffAssignmentsRelations = relations(caseStaffAssignments, ({ one }) => ({
	case: one(cases, {
		fields: [caseStaffAssignments.caseId],
		references: [cases.id]
	}),
	staff: one(user, {
		fields: [caseStaffAssignments.staffId],
		references: [user.id],
		relationName: 'staffAssignments'
	}),
	assignedBy: one(user, {
		fields: [caseStaffAssignments.assignedById],
		references: [user.id],
		relationName: 'assignedByUser'
	})
}));
