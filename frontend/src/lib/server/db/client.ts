import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

// Turso (libSQL) connection. Falls back to a local SQLite file so `npm run dev`
// and unit tests work with no network access.
const url = env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = env.TURSO_AUTH_TOKEN || undefined;

let client: Client | undefined;
let database: LibSQLDatabase<typeof schema> | undefined;

export function getLibsqlClient(): Client {
	if (!client) client = createClient({ url, authToken });
	return client;
}

export function getDb(): LibSQLDatabase<typeof schema> {
	if (!database) database = drizzle(getLibsqlClient(), { schema });
	return database;
}

export type Db = LibSQLDatabase<typeof schema>;
export { schema };
