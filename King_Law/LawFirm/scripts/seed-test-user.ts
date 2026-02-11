/**
 * Seed Test User Script
 * Creates a test client user with no cases for E2E testing
 *
 * Run with: npx tsx scripts/seed-test-user.ts
 */

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { user } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { hash } from '@node-rs/argon2';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = createClient({
	url: process.env.DATABASE_URL || 'file:local.db',
	authToken: process.env.DATABASE_AUTH_TOKEN
});

const db = drizzle(client);

async function seedTestUsers() {
	console.log('🔧 Seeding test users...\n');

	const testUsers = [
		{
			email: 'nocases@test.com',
			username: 'nocases',
			firstName: 'NoCases',
			lastName: 'TestClient',
			role: 'client' as const
		},
		{
			email: 'lawyer@test.com',
			username: 'lawyer',
			firstName: 'Ben',
			lastName: 'King',
			role: 'lawyer' as const
		},
		{
			email: 'client@test.com',
			username: 'client',
			firstName: 'John',
			lastName: 'Doe',
			role: 'client' as const
		}
	];

	for (const testUser of testUsers) {
		// Check if user already exists
		const existing = await db.select().from(user).where(eq(user.email, testUser.email)).limit(1);

		if (existing.length > 0) {
			console.log(`✅ ${testUser.email} already exists`);
			continue;
		}

		// Hash password
		const hashedPassword = await hash('test', {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		// Insert user
		const userId = nanoid();
		await db.insert(user).values({
			id: userId,
			email: testUser.email,
			username: testUser.username,
			passwordHash: hashedPassword,
			firstName: testUser.firstName,
			lastName: testUser.lastName,
			role: testUser.role,
			createdAt: Date.now()
		});

		console.log(`✅ Created ${testUser.email} (${testUser.role}) with ID: ${userId}`);
	}

	console.log('\n🎉 Test users are ready!');
	console.log('   - nocases@test.com (client with no cases)');
	console.log('   - lawyer@test.com (lawyer)');
	console.log('   - client@test.com (client with cases)');
}

seedTestUsers()
	.then(() => {
		console.log('\n✅ Done');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Error:', error);
		process.exit(1);
	});
