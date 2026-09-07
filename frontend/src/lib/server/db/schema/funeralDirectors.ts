import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { extra, timestamps } from './_helpers';

// Keyed by Firebase Auth UID (same id as the matching users row).
export const funeralDirectors = sqliteTable(
	'funeral_directors',
	{
		id: text('id').primaryKey(),
		companyName: text('company_name').notNull().default(''),
		contactPerson: text('contact_person').notNull().default(''),
		email: text('email').notNull().default(''),
		phone: text('phone').notNull().default(''),
		website: text('website'),
		licenseNumber: text('license_number'),
		addressStreet: text('address_street'),
		addressCity: text('address_city'),
		addressState: text('address_state'),
		addressZip: text('address_zip'),
		status: text('status').notNull().default('approved'),
		approvedAt: text('approved_at'),
		extra,
		...timestamps
	},
	(t) => [index('fd_email_idx').on(t.email), index('fd_status_idx').on(t.status)]
);
