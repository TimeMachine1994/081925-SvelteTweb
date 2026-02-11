import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config({ path: '.env' });

const client = createClient({
	url: process.env.DATABASE_URL,
	authToken: process.env.DATABASE_AUTH_TOKEN
});

const columns = [
	{ name: 'matter_type', type: 'TEXT' },
	{ name: 'currently_represented', type: 'TEXT' },
	{ name: 'urgency', type: 'TEXT' },
	{ name: 'preferred_date', type: 'TEXT' }
];

async function migrate() {
	for (const col of columns) {
		try {
			await client.execute(`ALTER TABLE consultations ADD COLUMN ${col.name} ${col.type}`);
			console.log(`✅ Added column: ${col.name}`);
		} catch (err) {
			if (err.message?.includes('duplicate column')) {
				console.log(`⏭️  Column already exists: ${col.name}`);
			} else {
				console.error(`❌ Error adding ${col.name}:`, err.message);
			}
		}
	}
	console.log('Done.');
}

migrate();
