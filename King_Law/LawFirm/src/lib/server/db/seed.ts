import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { user, cases, invoices } from './schema';
import { hash } from '@node-rs/argon2';
import { encodeBase32LowerCaseNoPadding } from '@oslojs/encoding';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create database client
const turso = createClient({
	url: process.env.DATABASE_URL!,
	authToken: process.env.DATABASE_AUTH_TOKEN
});

const db = drizzle(turso);

// Generate ID function (copied from auth.ts)
function generateId(): string {
	const bytes = new Uint8Array(10);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

const ARGON2_OPTIONS = {
	memoryCost: 19456,
	timeCost: 2,
	outputLen: 32,
	parallelism: 1
};

async function seed() {
	console.log('🌱 Starting database seed...');

	try {
		// Create test lawyer
		const lawyerId = generateId();
		const lawyerPasswordHash = await hash('TestPassword123!', ARGON2_OPTIONS);
		
		const now = Math.floor(Date.now() / 1000); // Unix epoch in seconds
		
		await db.insert(user).values({
			id: lawyerId,
			username: 'lawyer@test.com',
			email: 'lawyer@test.com',
			passwordHash: lawyerPasswordHash,
			firstName: 'Ben',
			lastName: 'King',
			role: 'lawyer'
		});
		console.log('✅ Created lawyer: lawyer@test.com / TestPassword123!');

		// Create test client
		const clientId = generateId();
		const clientPasswordHash = await hash('TestPassword123!', ARGON2_OPTIONS);
		
		await db.insert(user).values({
			id: clientId,
			username: 'client@test.com',
			email: 'client@test.com',
			passwordHash: clientPasswordHash,
			firstName: 'John',
			lastName: 'Doe',
			role: 'client',
			phoneNumber: '555-1234'
		});
		console.log('✅ Created client: client@test.com / TestPassword123!');

		// Create a sample case
		const caseId = generateId();
		await db.insert(cases).values({
			id: caseId,
			clientId: clientId,
			lawyerId: lawyerId,
			title: 'Sample Case',
			description: 'This is a sample case for testing purposes',
			status: 'active'
		});
		console.log('✅ Created sample case');

		// Create a sample invoice
		const invoiceId = generateId();
		const dueDate = Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000);
		await db.insert(invoices).values({
			id: invoiceId,
			caseId: caseId,
			description: 'Sample legal consultation',
			amount: 50000, // $500.00 in cents
			dueDate: dueDate,
			status: 'unpaid',
			paidAmount: 0
		});
		console.log('✅ Created sample invoice');

		console.log('\n🎉 Database seeded successfully!');
		console.log('\nTest accounts:');
		console.log('  Lawyer: lawyer@test.com / TestPassword123!');
		console.log('  Client: client@test.com / TestPassword123!');
		
	} catch (error) {
		console.error('❌ Error seeding database:', error);
		throw error;
	}
}

seed()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
