import { hash } from '@node-rs/argon2';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as table from '../src/lib/server/db/schema';
import 'dotenv/config';
import * as readline from 'readline';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = createClient({
	url: process.env.DATABASE_URL,
	authToken: process.env.DATABASE_AUTH_TOKEN
});

const db = drizzle(client, { schema: table });

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

function prompt(question: string): Promise<string> {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer);
		});
	});
}

async function setup() {
	console.log('🔧 King Law Firm - Admin Setup Script');
	console.log('=====================================\n');

	// Get admin details
	const adminEmail = await prompt('Admin email: ');
	const adminUsername = await prompt('Admin username: ');
	const adminFirstName = await prompt('Admin first name: ');
	const adminLastName = await prompt('Admin last name: ');
	const adminPassword = await prompt('Admin password: ');
	const staffPassword = await prompt('Staff sign-up password: ');

	console.log('\n📝 Creating admin account...');

	// Hash passwords
	const adminPasswordHash = await hash(adminPassword, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	const staffPasswordHash = await hash(staffPassword, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	// Create admin user
	const adminId = 'admin_' + Date.now();

	try {
		await db.insert(table.user).values({
			id: adminId,
			username: adminUsername,
			passwordHash: adminPasswordHash,
			role: 'admin',
			email: adminEmail,
			firstName: adminFirstName,
			lastName: adminLastName,
			phoneNumber: null
		});

		console.log('✅ Admin account created successfully');
	} catch (error: any) {
		if (error.message?.includes('UNIQUE constraint failed')) {
			console.log('⚠️  Admin user already exists, skipping creation');
		} else {
			throw error;
		}
	}

	// Store staff password in system settings
	console.log('📝 Storing staff sign-up password...');

	try {
		await db
			.insert(table.systemSettings)
			.values({
				key: 'staff_signup_password',
				value: staffPasswordHash
			})
			.onConflictDoUpdate({
				target: table.systemSettings.key,
				set: {
					value: staffPasswordHash,
					updatedAt: Math.floor(Date.now() / 1000)
				}
			});

		console.log('✅ Staff sign-up password stored');
	} catch (error) {
		console.error('❌ Failed to store staff password:', error);
		throw error;
	}

	// Optionally create some initial staff codes
	const createCodes = await prompt('\nCreate initial employee codes? (y/n): ');

	if (createCodes.toLowerCase() === 'y') {
		console.log('\nEnter employee codes (format: CODE:ROLE, e.g., EMP001:lawyer)');
		console.log('Roles: lawyer, staff, admin');
		console.log('Enter empty line when done.\n');

		while (true) {
			const codeInput = await prompt('Employee code: ');
			if (!codeInput.trim()) break;

			const [employeeNumber, role] = codeInput.split(':');
			if (!employeeNumber || !role) {
				console.log('Invalid format. Use CODE:ROLE');
				continue;
			}

			if (!['lawyer', 'staff', 'admin'].includes(role)) {
				console.log('Invalid role. Use: lawyer, staff, or admin');
				continue;
			}

			try {
				const codeId = 'code_' + Date.now() + '_' + Math.random().toString(36).substring(7);
				await db.insert(table.staffCodes).values({
					id: codeId,
					employeeNumber: employeeNumber.trim().toUpperCase(),
					role: role as 'lawyer' | 'staff' | 'admin'
				});
				console.log(`✅ Created code: ${employeeNumber.toUpperCase()} → ${role}`);
			} catch (error: any) {
				if (error.message?.includes('UNIQUE constraint failed')) {
					console.log(`⚠️  Code ${employeeNumber} already exists`);
				} else {
					console.log(`❌ Failed to create code: ${error.message}`);
				}
			}
		}
	}

	console.log('\n=====================================');
	console.log('✅ Setup complete!');
	console.log('\n📝 Summary:');
	console.log(`   Admin: ${adminUsername} (${adminEmail})`);
	console.log(`   Staff sign-up password: [hidden]`);
	console.log('\n🔗 Staff can now register at /staff-sign-up');
}

setup()
	.catch((error) => {
		console.error('❌ Setup failed:', error);
		process.exit(1);
	})
	.finally(() => {
		rl.close();
		process.exit(0);
	});
