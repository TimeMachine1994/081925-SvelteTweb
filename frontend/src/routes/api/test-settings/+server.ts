import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

export const GET: RequestHandler = async ({ locals }) => {
	console.log('🧪 [TEST-SETTINGS] Testing settings page dependencies');
	
	try {
		// Test 1: Check if user is authenticated
		console.log('🧪 [TEST-SETTINGS] Test 1: User authentication');
		if (!locals.user) {
			return json({ 
				success: false, 
				error: 'No user in locals',
				step: 'authentication'
			});
		}
		console.log('✅ [TEST-SETTINGS] User authenticated:', locals.user.uid);

		// Test 2: Check Firebase connection
		console.log('🧪 [TEST-SETTINGS] Test 2: Firebase connection');
		const testDoc = await adminDb.collection('test').doc('connection').get();
		console.log('✅ [TEST-SETTINGS] Firebase connection works');

		// Test 3: Check user document exists
		console.log('🧪 [TEST-SETTINGS] Test 3: User document');
		const userDoc = await adminDb.collection('users').doc(locals.user.uid).get();
		console.log('✅ [TEST-SETTINGS] User document exists:', userDoc.exists);
		
		if (userDoc.exists) {
			const userData = userDoc.data();
			console.log('✅ [TEST-SETTINGS] User data keys:', userData ? Object.keys(userData) : 'null');
			
			// Test 4: Check data serialization
			console.log('🧪 [TEST-SETTINGS] Test 4: Data serialization');
			const serializedData = JSON.stringify(userData);
			console.log('✅ [TEST-SETTINGS] Data serialization successful');
		}

		return json({ 
			success: true, 
			user: locals.user,
			userDocExists: userDoc.exists,
			message: 'All tests passed'
		});

	} catch (error) {
		console.error('❌ [TEST-SETTINGS] Error:', error);
		return json({ 
			success: false, 
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : 'No stack trace'
		});
	}
};
