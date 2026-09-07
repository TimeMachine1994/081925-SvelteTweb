// Applies ./drizzle migrations to TURSO_DATABASE_URL (or file:local.db).
// Usage: npm run db:migrate
import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const db = drizzle(client);

console.log(
	`Applying migrations to ${url.startsWith('file:') ? url : url.replace(/\/\/.*@/, '//***@')}`
);
await migrate(db, { migrationsFolder: './drizzle' });
console.log('Migrations applied.');
client.close();
