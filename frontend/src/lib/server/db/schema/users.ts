import { sqliteTable, text, primaryKey, index } from 'drizzle-orm/sqlite-core';
import { bool, extra, timestamps } from './_helpers';

// Keyed by Firebase Auth UID. Roles remain sourced from Firebase custom claims;
// the `role` column mirrors them for querying/listing in admin.
export const users = sqliteTable(
	'users',
	{
		id: text('id').primaryKey(),
		email: text('email'),
		displayName: text('display_name'),
		firstName: text('first_name'),
		lastName: text('last_name'),
		phone: text('phone'),
		photoUrl: text('photo_url'),
		role: text('role').notNull().default('owner'),
		status: text('status'),
		emailVerified: bool('email_verified').notNull().default(false),
		funeralHomeName: text('funeral_home_name'),
		createdByAdmin: bool('created_by_admin').notNull().default(false),
		createdBy: text('created_by'),
		lastLoginAt: text('last_login_at'),
		isDeleted: bool('is_deleted').notNull().default(false),
		deletedAt: text('deleted_at'),
		extra,
		...timestamps
	},
	(t) => [index('users_email_idx').on(t.email), index('users_role_idx').on(t.role)]
);

// Replaces users.followedMemorials[] (FieldValue.arrayUnion).
export const userFollowedMemorials = sqliteTable(
	'user_followed_memorials',
	{
		userId: text('user_id').notNull(),
		memorialId: text('memorial_id').notNull(),
		followedAt: text('followed_at').notNull()
	},
	(t) => [primaryKey({ columns: [t.userId, t.memorialId] })]
);

export const passwordResetTokens = sqliteTable(
	'password_reset_tokens',
	{
		token: text('token').primaryKey(),
		userId: text('user_id').notNull(),
		email: text('email').notNull(),
		expiresAt: text('expires_at').notNull(),
		usedAt: text('used_at'),
		createdAt: text('created_at').notNull()
	},
	(t) => [index('prt_user_idx').on(t.userId)]
);
