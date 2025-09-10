import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('🧪 [ADMIN TEST] Testing admin access for user:', locals.user?.email);
	console.log('🧪 [ADMIN TEST] User object:', JSON.stringify(locals.user, null, 2));

	// Redirect to login if not authenticated
	if (!locals.user) {
		console.log('🚫 [ADMIN TEST] User not authenticated, redirecting to login');
		throw redirect(302, '/login');
	}

	// Check if user is admin
	if (!locals.user.admin && locals.user.role !== 'admin') {
		console.log('🚫 [ADMIN TEST] User is not admin, redirecting to profile');
		console.log('🚫 [ADMIN TEST] User admin flag:', locals.user.admin);
		console.log('🚫 [ADMIN TEST] User role:', locals.user.role);
		throw redirect(302, '/profile');
	}

	console.log('👑 [ADMIN TEST] User is admin, testing basic functionality...');

	try {
		// Test 1: Basic Firestore connection
		console.log('🧪 Test 1: Testing Firestore connection...');
		await adminDb.collection('test').limit(1).get();
		console.log('✅ Test 1 passed: Firestore connection successful');

		// Test 2: Count memorials without loading data
		console.log('🧪 Test 2: Counting memorials...');
		const memorialsSnap = await adminDb.collection('memorials').get();
		console.log('✅ Test 2 passed: Found', memorialsSnap.size, 'memorials');

		// Test 3: Count users without loading data
		console.log('🧪 Test 3: Counting users...');
		const usersSnap = await adminDb.collection('users').get();
		console.log('✅ Test 3 passed: Found', usersSnap.size, 'users');

		// Test 4: Load one memorial with timestamp conversion
		console.log('🧪 Test 4: Testing single memorial load...');
		const singleMemorialSnap = await adminDb.collection('memorials').limit(1).get();
		if (!singleMemorialSnap.empty) {
			const doc = singleMemorialSnap.docs[0];
			const data = doc.data();
			console.log('✅ Test 4 passed: Single memorial loaded, has createdAt:', !!data.createdAt);
			console.log('🧪 Memorial createdAt type:', typeof data.createdAt, data.createdAt?.constructor?.name);
		}

		return {
			user: locals.user,
			testResults: {
				firestoreConnection: true,
				memorialCount: memorialsSnap.size,
				userCount: usersSnap.size,
				sampleMemorialLoaded: !singleMemorialSnap.empty
			}
		};

	} catch (error) {
		console.error('❌ [ADMIN TEST] Error during testing:', error);
		console.error('❌ [ADMIN TEST] Error type:', error.constructor.name);
		console.error('❌ [ADMIN TEST] Error message:', error.message);
		console.error('❌ [ADMIN TEST] Error stack:', error.stack);
		
		return {
			user: locals.user,
			testResults: {
				firestoreConnection: false,
				error: error.message,
				errorType: error.constructor.name
			}
		};
	}
};
