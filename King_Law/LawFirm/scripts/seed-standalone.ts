import { hash } from '@node-rs/argon2';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as table from '../src/lib/server/db/schema';
import 'dotenv/config';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = createClient({ 
	url: process.env.DATABASE_URL, 
	authToken: process.env.DATABASE_AUTH_TOKEN 
});

const db = drizzle(client, { schema: table });

async function seed() {
	console.log('🌱 Seeding database...');

	// Create a lawyer account
	const lawyerId = 'lawyer_' + Date.now();
	const lawyerPassword = await hash('password123', {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	await db.insert(table.user).values({
		id: lawyerId,
		username: 'john.attorney',
		passwordHash: lawyerPassword,
		role: 'lawyer',
		email: 'john@kinglaw.com',
		firstName: 'John',
		lastName: 'Attorney',
		phoneNumber: '555-0100',
		createdAt: new Date(),
		updatedAt: new Date()
	});

	console.log('✓ Created lawyer account: john.attorney / password123');

	// Create client accounts
	const clients = [
		{
			username: 'jane.client',
			email: 'jane@example.com',
			firstName: 'Jane',
			lastName: 'Doe',
			phoneNumber: '555-0101'
		},
		{
			username: 'bob.client',
			email: 'bob@example.com',
			firstName: 'Bob',
			lastName: 'Smith',
			phoneNumber: '555-0102'
		},
		{
			username: 'alice.client',
			email: 'alice@example.com',
			firstName: 'Alice',
			lastName: 'Johnson',
			phoneNumber: '555-0103'
		}
	];

	const clientIds: string[] = [];

	for (const client of clients) {
		const clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substring(7);
		const clientPassword = await hash('password123', {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		await db.insert(table.user).values({
			id: clientId,
			username: client.username,
			passwordHash: clientPassword,
			role: 'client',
			email: client.email,
			firstName: client.firstName,
			lastName: client.lastName,
			phoneNumber: client.phoneNumber,
			createdAt: new Date(),
			updatedAt: new Date()
		});

		clientIds.push(clientId);
		console.log(`✓ Created client account: ${client.username} / password123`);
	}

	// Create sample cases
	const caseIds: string[] = [];

	for (let i = 0; i < clientIds.length; i++) {
		const caseId = 'case_' + Date.now() + '_' + i;
		const caseTitles = [
			'Personal Injury - Car Accident',
			'Business Contract Dispute',
			'Estate Planning'
		];

		await db.insert(table.cases).values({
			id: caseId,
			clientId: clientIds[i],
			lawyerId: lawyerId,
			title: caseTitles[i],
			description: `Sample case for ${clients[i].firstName} ${clients[i].lastName}`,
			status: 'open',
			createdAt: new Date(),
			updatedAt: new Date()
		});

		caseIds.push(caseId);
		console.log(`✓ Created case: ${caseTitles[i]}`);

		// Create sample invoice
		const invoiceId = 'invoice_' + Date.now() + '_' + i;
		const dueDate = new Date();
		dueDate.setDate(dueDate.getDate() + 30);

		await db.insert(table.invoices).values({
			id: invoiceId,
			caseId: caseId,
			amount: (5000 + i * 1000) * 100,
			description: `Legal services for ${caseTitles[i]}`,
			status: i === 0 ? 'paid' : 'unpaid',
			dueDate: dueDate,
			paidAmount: i === 0 ? 500000 : 0,
			createdAt: new Date(),
			paidAt: i === 0 ? new Date() : null
		});

		console.log(`✓ Created invoice for case ${i + 1}`);

		// Create sample messages
		const messageId1 = 'msg_' + Date.now() + '_' + i + '_1';
		const messageId2 = 'msg_' + Date.now() + '_' + i + '_2';

		await db.insert(table.messages).values([
			{
				id: messageId1,
				caseId: caseId,
				senderId: clientIds[i],
				content: `Hello, I have a question about my ${caseTitles[i].toLowerCase()} case.`,
				createdAt: new Date(Date.now() - 86400000),
				readAt: new Date(Date.now() - 43200000)
			},
			{
				id: messageId2,
				caseId: caseId,
				senderId: lawyerId,
				content: `I'd be happy to help. Let's schedule a meeting to discuss the details.`,
				createdAt: new Date(Date.now() - 43200000),
				readAt: null
			}
		]);

		console.log(`✓ Created messages for case ${i + 1}`);
	}

	console.log('✅ Database seeding complete!');
	console.log('\n📝 Test Accounts:');
	console.log('   Lawyer: john.attorney / password123');
	console.log('   Clients: jane.client, bob.client, alice.client / password123');
}

seed()
	.catch((error) => {
		console.error('❌ Seeding failed:', error);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});
