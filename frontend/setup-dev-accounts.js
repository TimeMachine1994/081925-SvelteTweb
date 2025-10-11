#!/usr/bin/env node

// Quick setup script for dev bar test accounts
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin for emulators
let adminApp;
if (getApps().length === 0) {
	console.log('🔥 Initializing Firebase Admin for emulators...');

	// Set emulator environment variables
	process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
	process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

	adminApp = initializeApp({
		projectId: 'fir-tweb' // Use the emulator project ID
	});

	console.log('✅ Firebase Admin initialized');
} else {
	adminApp = getApps()[0];
	console.log('✅ Using existing Firebase Admin app');
}

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

const testAccounts = [
	{
		uid: 'admin-test-uid',
		email: 'admin@test.com',
		password: 'test123',
		role: 'admin',
		displayName: 'Admin User',
		customClaims: { role: 'admin', admin: true }
	},
	{
		uid: 'director-test-uid',
		email: 'director@test.com',
		password: 'test123',
		role: 'funeral_director',
		displayName: 'John Director',
		customClaims: { role: 'funeral_director', admin: false }
	},
	{
		uid: 'owner-test-uid',
		email: 'owner@test.com',
		password: 'test123',
		role: 'owner',
		displayName: 'Sarah Owner',
		customClaims: { role: 'owner', admin: false }
	},
	{
		uid: 'viewer-test-uid',
		email: 'viewer@test.com',
		password: 'test123',
		role: 'viewer',
		displayName: 'Mike Viewer',
		customClaims: { role: 'viewer', admin: false }
	}
];

async function createTestAccounts() {
	console.log('🔧 Creating dev bar test accounts...');

	for (const account of testAccounts) {
		try {
			console.log(`📝 Creating ${account.role}: ${account.email}...`);

			// Create user in Firebase Auth
			const userRecord = await adminAuth.createUser({
				uid: account.uid,
				email: account.email,
				password: account.password,
				displayName: account.displayName
			});

			console.log(`✅ User created: ${userRecord.uid}`);

			// Set custom claims
			await adminAuth.setCustomUserClaims(userRecord.uid, account.customClaims);
			console.log(`✅ Custom claims set for: ${account.email}`);

			// Create user document in Firestore
			await adminDb.collection('users').doc(userRecord.uid).set({
				uid: userRecord.uid,
				email: account.email,
				displayName: account.displayName,
				role: account.role,
				isAdmin: account.customClaims.admin,
				createdAt: new Date(),
				lastLoginAt: new Date()
			});

			// For funeral directors, also create profile in funeral_directors collection
			if (account.role === 'funeral_director') {
				await adminDb
					.collection('funeral_directors')
					.doc(userRecord.uid)
					.set({
						companyName: 'Smith & Sons Funeral Home',
						contactPerson: account.displayName,
						email: account.email,
						phone: '(555) 123-4567',
						address: {
							street: '123 Memorial Drive',
							city: 'Orlando',
							state: 'FL',
							zipCode: '32801'
						},
						status: 'approved',
						isActive: true,
						createdAt: new Date(),
						approvedAt: new Date(),
						approvedBy: 'system_auto_approve',
						userId: userRecord.uid
					});
				console.log(`✅ Created funeral_directors profile for: ${account.email}`);
			}

			console.log(`✅ Created ${account.role}: ${account.email}`);
		} catch (error) {
			if (error.code === 'auth/email-already-exists' || error.code === 'auth/uid-already-exists') {
				console.log(`⚠️  Account already exists: ${account.email}`);
				// Update custom claims for existing user
				try {
					const existingUser = await adminAuth.getUserByEmail(account.email);
					await adminAuth.setCustomUserClaims(existingUser.uid, account.customClaims);
					console.log(`✅ Updated claims for: ${account.email}`);

					// For funeral directors, ensure profile exists in funeral_directors collection
					if (account.role === 'funeral_director') {
						await adminDb
							.collection('funeral_directors')
							.doc(existingUser.uid)
							.set(
								{
									companyName: 'Smith & Sons Funeral Home',
									contactPerson: account.displayName,
									email: account.email,
									phone: '(555) 123-4567',
									address: {
										street: '123 Memorial Drive',
										city: 'Orlando',
										state: 'FL',
										zipCode: '32801'
									},
									status: 'approved',
									isActive: true,
									createdAt: new Date(),
									approvedAt: new Date(),
									approvedBy: 'system_auto_approve',
									userId: existingUser.uid
								},
								{ merge: true }
							); // Use merge to avoid overwriting existing data
						console.log(`✅ Created/updated funeral_directors profile for: ${account.email}`);
					}
				} catch (updateError) {
					console.error(`❌ Failed to update claims for ${account.email}:`, updateError.message);
				}
			} else {
				console.error(`❌ Error creating ${account.email}:`, error.message);
				console.error('Full error:', error);
			}
		}
	}
}

createTestAccounts()
	.then(() => {
		console.log('\n🎉 Dev bar test accounts ready!');
		console.log('\n📋 Test Accounts:');
		console.log('  👑 Admin: admin@test.com / test123');
		console.log('  🏢 Funeral Director: director@test.com / test123');
		console.log('  👤 Owner: owner@test.com / test123');
		console.log('  👀 Viewer: viewer@test.com / test123');
		console.log('\n🚀 Now run: npm run dev');
		console.log('🎯 Then open: http://localhost:5173');
		console.log('👀 Look for the red "DEV MODE" bar at the top!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Setup failed:', error);
		console.error('Make sure Firebase emulators are running: firebase emulators:start');
		process.exit(1);
	});
