import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config();

const client = createClient({
	url: process.env.DATABASE_URL,
	authToken: process.env.DATABASE_AUTH_TOKEN
});

async function migrate() {
	try {
		console.log('Applying Phase Two schema updates...');
		
		await client.execute(`ALTER TABLE document ADD COLUMN direction text DEFAULT 'outgoing' NOT NULL`);
		console.log('✓ Added direction column');
		
		await client.execute(`ALTER TABLE document ADD COLUMN message_id text REFERENCES message(id)`);
		console.log('✓ Added message_id column');
		
		await client.execute(`ALTER TABLE document ADD COLUMN viewed_at integer`);
		console.log('✓ Added viewed_at column');
		
		await client.execute(`ALTER TABLE document ADD COLUMN shared_via text DEFAULT 'upload' NOT NULL`);
		console.log('✓ Added shared_via column');
		
		console.log('\n✅ Phase Two schema migration complete!');
		process.exit(0);
	} catch (error) {
		if (error.message.includes('duplicate column name')) {
			console.log('⚠️  Columns already exist - migration skipped');
			process.exit(0);
		}
		console.error('❌ Migration error:', error.message);
		process.exit(1);
	}
}

migrate();
