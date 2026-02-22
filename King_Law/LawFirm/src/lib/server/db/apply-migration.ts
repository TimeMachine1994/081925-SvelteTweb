import { db } from './index';
import { sql } from 'drizzle-orm';

async function applyMigration() {
	try {
		console.log('Applying Phase Two schema updates...');
		
		await db.run(sql`ALTER TABLE document ADD COLUMN direction text DEFAULT 'outgoing' NOT NULL`);
		console.log('✓ Added direction column');
		
		await db.run(sql`ALTER TABLE document ADD COLUMN message_id text REFERENCES message(id)`);
		console.log('✓ Added message_id column');
		
		await db.run(sql`ALTER TABLE document ADD COLUMN viewed_at integer`);
		console.log('✓ Added viewed_at column');
		
		await db.run(sql`ALTER TABLE document ADD COLUMN shared_via text DEFAULT 'upload' NOT NULL`);
		console.log('✓ Added shared_via column');
		
		console.log('\n✅ Phase Two schema migration complete!');
	} catch (error) {
		console.error('Migration error:', error);
		process.exit(1);
	}
}

applyMigration();
