import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { user, cases, messages } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
	url: process.env.DATABASE_URL || 'file:local.db',
	authToken: process.env.DATABASE_AUTH_TOKEN
});

const db = drizzle(client);

async function checkNocasesUser() {
	// Find nocases user
	const [nocasesUser] = await db.select().from(user).where(eq(user.username, 'nocases')).limit(1);

	if (!nocasesUser) {
		console.log('❌ nocases user not found');
		return;
	}

	console.log('✅ Found nocases user:', nocasesUser.id);

	// Check for cases
	const userCases = await db.select().from(cases).where(eq(cases.clientId, nocasesUser.id));
	console.log(`📁 Cases for nocases user: ${userCases.length}`);
	userCases.forEach((c) => console.log(`   - ${c.title} (${c.status})`));

	// Check for messages
	const userMessages = await db.select().from(messages).where(eq(messages.senderId, nocasesUser.id));
	console.log(`💬 Messages sent by nocases: ${userMessages.length}`);

	// Delete cases if any exist (to ensure clean test state)
	if (userCases.length > 0) {
		console.log('\n🧹 Deleting cases for nocases user...');
		await db.delete(cases).where(eq(cases.clientId, nocasesUser.id));
		console.log('✅ Cases deleted');
	}

	// Delete messages if any exist
	if (userMessages.length > 0) {
		console.log('🧹 Deleting messages from nocases user...');
		await db.delete(messages).where(eq(messages.senderId, nocasesUser.id));
		console.log('✅ Messages deleted');
	}

	console.log('\n🎉 nocases user is now clean (no cases, no messages)');
}

checkNocasesUser().then(() => process.exit(0));
