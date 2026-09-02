import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { json, timestamps } from './_helpers';
import type { CalculatorFormData } from '$lib/types/livestream';

export const invoices = sqliteTable(
	'invoices',
	{
		id: text('id').primaryKey(),
		customerEmail: text('customer_email').notNull(),
		customerName: text('customer_name'),
		total: integer('total').notNull().default(0), // cents
		status: text('status').notNull().default('pending'),
		createdBy: text('created_by').notNull(),
		memorialId: text('memorial_id'),
		stripeSessionId: text('stripe_session_id'),
		paymentIntentId: text('payment_intent_id'),
		expiresAt: text('expires_at'),
		paidAt: text('paid_at'),
		...timestamps
	},
	(t) => [
		index('invoices_email_idx').on(t.customerEmail),
		index('invoices_memorial_idx').on(t.memorialId),
		index('invoices_status_idx').on(t.status)
	]
);

export const invoiceItems = sqliteTable(
	'invoice_items',
	{
		id: text('id').primaryKey(),
		invoiceId: text('invoice_id').notNull(),
		name: text('name').notNull(),
		quantity: integer('quantity').notNull().default(1),
		price: integer('price').notNull().default(0), // cents
		total: integer('total').notNull().default(0), // cents
		position: integer('position').notNull().default(0)
	},
	(t) => [index('ii_invoice_idx').on(t.invoiceId, t.position)]
);

export const bookings = sqliteTable(
	'bookings',
	{
		id: text('id').primaryKey(),
		memorialId: text('memorial_id'),
		userId: text('user_id'),
		status: text('status').notNull().default('draft'),
		step: integer('step').notNull().default(0),
		total: real('total').notNull().default(0),
		formData: json<CalculatorFormData>('form_data'),
		paymentIntentId: text('payment_intent_id'),
		...timestamps
	},
	(t) => [index('bookings_memorial_idx').on(t.memorialId), index('bookings_user_idx').on(t.userId)]
);

export const bookingItems = sqliteTable(
	'booking_items',
	{
		id: text('id').primaryKey(),
		bookingId: text('booking_id').notNull(),
		name: text('name').notNull(),
		pkg: text('package'),
		price: real('price').notNull().default(0),
		quantity: integer('quantity'),
		total: real('total'),
		position: integer('position').notNull().default(0)
	},
	(t) => [index('bi_booking_idx').on(t.bookingId, t.position)]
);
