import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { user } from '../src/lib/server/db/schema';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
	url: process.env.DATABASE_URL || 'file:local.db',
	authToken: process.env.DATABASE_AUTH_TOKEN
});

const db = drizzle(client);

async function listUsers() {
	console.log('\n📋 All users in database:\n');
	const users = await db.select().from(user);

	if (users.length === 0) {
		console.log('No users found');
		return;
	}

	users.forEach((u, i) => {
		console.log(`${i + 1}. ${u.role.toUpperCase()}`);
		console.log(`   Username: ${u.username}`);
		console.log(`   Email: ${u.email}`);
		console.log(`   Name: ${u.firstName} ${u.lastName}\n`);
	});
}

listUsers().then(() => process.exit(0));
