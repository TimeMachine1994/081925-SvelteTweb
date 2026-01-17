import { db } from '../src/lib/server/db';
import { user } from '../src/lib/server/db/schema';

async function listUsers() {
	console.log('\n📋 Listing all users in database:\n');
	
	const users = await db.select().from(user);
	
	if (users.length === 0) {
		console.log('❌ No users found in database');
		return;
	}

	users.forEach((u, index) => {
		console.log(`${index + 1}. ${u.role.toUpperCase()}`);
		console.log(`   Username: ${u.username}`);
		console.log(`   Email: ${u.email}`);
		console.log(`   Name: ${u.firstName} ${u.lastName}`);
		console.log(`   ID: ${u.id}`);
		console.log(`   Created: ${u.createdAt}\n`);
	});

	console.log(`Total users: ${users.length}`);
}

listUsers()
	.then(() => {
		console.log('\n✅ Done');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Error:', error);
		process.exit(1);
	});
