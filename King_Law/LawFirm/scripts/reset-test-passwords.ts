/**
 * Reset Test User Passwords
 * Updates passwords for test users to the standard test password
 *
 * Run with: npx tsx scripts/reset-test-passwords.ts
 */

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { user } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
	url: process.env.DATABASE_URL || 'file:local.db',
	authToken: process.env.DATABASE_AUTH_TOKEN
});

const db = drizzle(client);

const TEST_PASSWORD = 'TestPassword123!';
const TEST_USERNAMES = ['nocases', 'lawyer@test.com', 'client@test.com'];

async function resetTestPasswords() {
	console.log('🔧 Resetting test user passwords...\n');

	// Hash the standard test password
	const hashedPassword = await hash(TEST_PASSWORD, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	for (const username of TEST_USERNAMES) {
		const [existingUser] = await db.select().from(user).where(eq(user.username, username)).limit(1);

		if (existingUser) {
			await db.update(user).set({ passwordHash: hashedPassword }).where(eq(user.username, username));
			console.log(`✅ Reset password for ${username} (${existingUser.email})`);
		} else {
			console.log(`⚠️ User ${username} not found`);
		}
	}

	console.log(`\n🎉 All test users now have password: ${TEST_PASSWORD}`);
}

resetTestPasswords()
	.then(() => {
		console.log('\n✅ Done');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Error:', error);
		process.exit(1);
	});
