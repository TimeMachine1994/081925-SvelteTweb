import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '../src/lib/server/db/schema';

export type TestDb = LibSQLDatabase<typeof schema>;

/**
 * Creates a fresh, fully migrated SQLite database in a temp directory.
 * Call `cleanup()` in afterAll.
 */
export async function createTestDb(): Promise<{ db: TestDb; client: Client; cleanup: () => void }> {
	const dir = mkdtempSync(join(tmpdir(), 'tweb-test-db-'));
	const client = createClient({ url: `file:${join(dir, 'test.db')}` });
	const db = drizzle(client, { schema });
	await migrate(db, { migrationsFolder: join(process.cwd(), 'drizzle') });
	return {
		db,
		client,
		cleanup: () => {
			client.close();
			rmSync(dir, { recursive: true, force: true });
		}
	};
}
