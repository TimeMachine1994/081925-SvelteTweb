import { hash } from '@node-rs/argon2';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import * as schema from '../src/lib/server/db/schema';

const DATABASE_URL = 'file:local.db';

async function seedAdmin() {
	console.log('🌱 Seeding admin user...');

	const client = createClient({ url: DATABASE_URL });
	const db = drizzle(client, { schema });

	const userId = generateUserId();
	const username = 'admin';
	const password = 'admin';

	const passwordHash = await hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	try {
		// Check if admin already exists
		const existing = await db
			.select()
			.from(schema.user)
			.where(eq(schema.user.username, username));

		if (existing.length > 0) {
			console.log('✅ Admin user already exists, skipping...');
			client.close();
			return;
		}

		await db.insert(schema.user).values({
			id: userId,
			username,
			passwordHash
		});

		console.log('✅ Admin user created successfully!');
		console.log(`   Username: ${username}`);
		console.log(`   Password: ${password}`);
	} catch (error) {
		// If error is about duplicate, that's fine
		if (String(error).includes('UNIQUE constraint failed')) {
			console.log('✅ Admin user already exists, skipping...');
		} else {
			console.error('❌ Error seeding admin:', error);
			throw error;
		}
	}

	client.close();
}

function generateUserId() {
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	return encodeBase32LowerCase(bytes);
}

seedAdmin();
