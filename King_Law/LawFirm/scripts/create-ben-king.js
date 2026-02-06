import { hash } from '@node-rs/argon2';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define user table schema
const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	username: text('username'),
	passwordHash: text('password_hash').notNull(),
	role: text('role', { enum: ['client', 'lawyer', 'admin'] }).notNull().default('client'),
	email: text('email').notNull().unique(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	phoneNumber: text('phone_number'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// Generate ID function (copied from auth.ts)
function generateId() {
	const bytes = new Uint8Array(10);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

async function createBenKing() {
	try {
		console.log('Creating Ben King lawyer account...');

		// Connect to database
		const DATABASE_URL = process.env.DATABASE_URL;
		const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN;

		if (!DATABASE_URL) {
			throw new Error('DATABASE_URL not found in .env file');
		}

		const client = createClient({ 
			url: DATABASE_URL, 
			authToken: DATABASE_AUTH_TOKEN 
		});
		const db = drizzle(client);

		const userId = generateId();
		const passwordHash = await hash('kinglaw123', {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		const now = new Date();

		await db.insert(user).values({
			id: userId,
			passwordHash: passwordHash,
			role: 'lawyer',
			email: 'ben@kinglaw.com',
			firstName: 'Ben',
			lastName: 'King',
			phoneNumber: '555-1234',
			createdAt: now,
			updatedAt: now
		});

		console.log('\n✅ Ben King created successfully!');
		console.log('   Email: ben@kinglaw.com');
		console.log('   Password: kinglaw123');
		console.log('   Email: ben@kinglaw.com');
		console.log('   Role: lawyer');
		console.log('   User ID:', userId);
		console.log('\n🎯 Next steps:');
		console.log('   1. Refresh your client dashboard');
		console.log('   2. Try sending a message in the chat');
		console.log('   3. Messages will be sent to Ben King\n');

		process.exit(0);
	} catch (error) {
		console.error('❌ Error creating Ben King:', error);
		process.exit(1);
	}
}

createBenKing();
