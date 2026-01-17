import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { user, session } from '../src/lib/server/db/schema';
import { hash } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';

// Load environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN;

if (!DATABASE_URL || !DATABASE_AUTH_TOKEN) {
	console.error('❌ Missing DATABASE_URL or DATABASE_AUTH_TOKEN in .env file');
	process.exit(1);
}

// Create database client
const client = createClient({
	url: DATABASE_URL,
	authToken: DATABASE_AUTH_TOKEN
});

const db = drizzle(client, { schema: { user, session } });

// Hash password function
async function hashPassword(password: string): Promise<string> {
	return await hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
}

async function resetPassword() {
	const args = process.argv.slice(2);
	
	if (args.length < 2) {
		console.error('Usage: npm run reset-password <email_or_username> <new_password>');
		console.error('Example: npm run reset-password austinbryanfilm@gmail.com MyNewPass123');
		process.exit(1);
	}

	const identifier = args[0];
	const newPassword = args[1];

	// Normalize to lowercase for case-insensitive lookup
	const normalizedIdentifier = identifier.toLowerCase();

	console.log('\n🔐 Password Reset Utility');
	console.log('========================\n');
	console.log('Searching for user:', identifier);

	try {
		// Try to find user by email first
		let existingUser = await db
			.select()
			.from(user)
			.where(eq(user.email, normalizedIdentifier))
			.limit(1);

		// If not found by email, try username
		if (existingUser.length === 0) {
			console.log('Not found by email, trying username...');
			existingUser = await db
				.select()
				.from(user)
				.where(eq(user.username, normalizedIdentifier))
				.limit(1);
		}

		if (existingUser.length === 0) {
			console.error('❌ User not found with email or username:', identifier);
			process.exit(1);
		}

		const foundUser = existingUser[0];
		console.log('✅ User found:');
		console.log('  - ID:', foundUser.id);
		console.log('  - Username:', foundUser.username);
		console.log('  - Email:', foundUser.email);
		console.log('  - Role:', foundUser.role);
		console.log('\n🔐 Hashing new password...');

		const passwordHash = await hashPassword(newPassword);
		console.log('✅ Password hashed');

		console.log('💾 Updating database...');
		await db
			.update(user)
			.set({ 
				passwordHash,
				updatedAt: new Date()
			})
			.where(eq(user.id, foundUser.id));

		console.log('✅ Password updated successfully!');
		console.log('\n📝 You can now login with:');
		console.log('  - Username:', foundUser.username);
		console.log('  - Email:', foundUser.email);
		console.log('  - Password:', newPassword);
		console.log('\n✅ Done!\n');
		
		process.exit(0);
	} catch (error) {
		console.error('❌ Error resetting password:', error);
		process.exit(1);
	}
}

resetPassword();
