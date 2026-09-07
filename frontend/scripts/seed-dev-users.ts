/**
 * Seed Development Test Users
 * 
 * Creates test accounts for each user role in Firebase Auth and Firestore.
 * Safe to run multiple times - checks if users exist before creating.
 * 
 * Usage: npm run seed:dev-users
 */

import { adminAuth, adminDb } from '../src/lib/server/firebase';
import { DEV_TEST_ACCOUNTS } from '../src/lib/config/dev-mode';

async function seedDevUsers() {
	console.log('\n🌱 Seeding Development Users...');
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

	let successCount = 0;
	let skippedCount = 0;
	let errorCount = 0;

	for (const account of DEV_TEST_ACCOUNTS) {
		try {
			console.log(`\n📝 Processing: ${account.email} (${account.role})`);
			
			// Check if user already exists
			let userRecord;
			try {
				userRecord = await adminAuth.getUserByEmail(account.email);
				console.log(`   ✓ User already exists: ${account.email}`);
				skippedCount++;
			} catch (error: any) {
				// User doesn't exist, create it
				if (error.code === 'auth/user-not-found') {
					console.log(`   ➕ Creating user: ${account.email}`);
					userRecord = await adminAuth.createUser({
						email: account.email,
						password: account.password,
						displayName: account.displayName,
						emailVerified: true // Skip email verification in dev
					});
					console.log(`   ✓ Created user: ${account.email}`);
				} else {
					throw error;
				}
			}

			// Set custom claims for role-based access
			console.log(`   🔑 Setting custom claims for role: ${account.role}`);
			await adminAuth.setCustomUserClaims(userRecord.uid, {
				role: account.role,
				isAdmin: account.role === 'admin',
				isOwner: account.role === 'owner',
				isFuneralDirector: account.role === 'funeral_director',
				isViewer: account.role === 'viewer'
			});
			console.log(`   ✓ Custom claims set`);

			// Create or update Firestore profile
			console.log(`   💾 Updating Firestore profile...`);
			const userProfile: any = {
				email: account.email,
				displayName: account.displayName,
				role: account.role,
				updatedAt: new Date(),
				// Add createdAt only if creating new document
			};

			// Add role-specific fields
			if (account.companyName) {
				userProfile.companyName = account.companyName;
			}

			// Use merge to avoid overwriting existing data
			const userDocRef = adminDb.collection('users').doc(userRecord.uid);
			const userDoc = await userDocRef.get();
			
			if (!userDoc.exists) {
				userProfile.createdAt = new Date();
				userProfile.memorialCount = 0;
			}

			await userDocRef.set(userProfile, { merge: true });
			console.log(`   ✓ Firestore profile updated`);

			// Create funeral director profile if needed
			if (account.role === 'funeral_director' && account.companyName) {
				console.log(`   🏢 Creating funeral director profile...`);
				const funeralDirectorProfile = {
					userId: userRecord.uid,
					email: account.email,
					displayName: account.displayName,
					companyName: account.companyName,
					phone: '407-555-0100',
					address: {
						street: '123 Dev Street',
						city: 'Orlando',
						state: 'FL',
						zip: '32801'
					},
					licenseNumber: 'DEV-LICENSE-123',
					status: 'approved',
					createdAt: new Date(),
					updatedAt: new Date()
				};

				await adminDb.collection('funeral_directors')
					.doc(userRecord.uid)
					.set(funeralDirectorProfile, { merge: true });
				console.log(`   ✓ Funeral director profile created`);
			}

			console.log(`   ✅ SUCCESS: ${account.email}`);
			successCount++;

		} catch (error: any) {
			console.error(`   ❌ ERROR with ${account.email}:`, error.message);
			errorCount++;
		}
	}

	// Summary
	console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	console.log('📊 Seeding Summary:');
	console.log(`   ✅ Successfully created/updated: ${successCount}`);
	console.log(`   ⏭️  Skipped (already exist): ${skippedCount}`);
	console.log(`   ❌ Errors: ${errorCount}`);
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

	if (errorCount === 0) {
		console.log('✅ Development users seeded successfully!\n');
		console.log('📋 Test Account Credentials:');
		DEV_TEST_ACCOUNTS.forEach(account => {
			console.log(`   • ${account.role.toUpperCase()}: ${account.email} / ${account.password}`);
		});
		console.log('\n💡 You can now login with these accounts on localhost\n');
	} else {
		console.log('⚠️  Some errors occurred. Please check the output above.\n');
		process.exit(1);
	}
}

// Run the seeding function
seedDevUsers()
	.then(() => {
		console.log('🏁 Seeding complete!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Fatal error during seeding:', error);
		process.exit(1);
	});
