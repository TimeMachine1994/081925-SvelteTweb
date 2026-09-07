import { migrate } from 'drizzle-orm/libsql/migrator';
import type { Db } from './client';

// Applies pending SQL migrations from ./drizzle. Used by the CLI script and the
// vitest DB setup; production migrations run via `npm run db:migrate` in CI.
export async function runMigrations(db: Db, migrationsFolder = './drizzle') {
	await migrate(db, { migrationsFolder });
}
