import { integer, text } from 'drizzle-orm/sqlite-core';

// Conventions shared by every table:
//  - TEXT primary keys (Firestore document IDs are preserved during migration)
//  - timestamps stored as ISO 8601 strings
//  - booleans stored as INTEGER 0/1 via drizzle's boolean mode
//  - JSON blobs stored as TEXT via drizzle's json mode

export const bool = (name: string) => integer(name, { mode: 'boolean' });
export const json = <T>(name: string) => text(name, { mode: 'json' }).$type<T>();

export const nowIso = () => new Date().toISOString();

export const timestamps = {
	createdAt: text('created_at').notNull().$defaultFn(nowIso),
	updatedAt: text('updated_at').notNull().$defaultFn(nowIso)
};

/** Catch-all for undeclared legacy fields discovered during migration. */
export const extra = json<Record<string, unknown>>('extra');
