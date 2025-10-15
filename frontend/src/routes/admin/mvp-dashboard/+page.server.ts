import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { adminAuth, adminDb } from '$lib/firebase-admin';

export const load: PageServerLoad = async ({ cookies }) => {
	console.log('🏛️ [ADMIN MVP] Loading admin dashboard data');

	// Check authentication
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		console.log('❌ [ADMIN MVP] No session cookie found');
		throw redirect(302, '/login');
	}

	try {
		// Verify admin session
		const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
		console.log('🔐 [ADMIN MVP] Session verified for user:', decodedClaims.uid);

		// Check if user has admin role
		if (!decodedClaims.admin) {
			console.log('❌ [ADMIN MVP] User does not have admin role');
			throw redirect(302, '/');
		}

		// Load dashboard statistics
		const stats = await loadDashboardStats();
		
		console.log('✅ [ADMIN MVP] Dashboard data loaded successfully');
		
		return {
			user: {
				uid: decodedClaims.uid,
				email: decodedClaims.email,
				role: 'admin'
			},
			stats
		};

	} catch (error) {
		console.error('❌ [ADMIN MVP] Error loading dashboard:', error);
		throw redirect(302, '/login');
	}
};

async function loadDashboardStats() {
	try {
		console.log('📊 [ADMIN MVP] Loading dashboard statistics');

		// Load memorials count
		const memorialsSnapshot = await adminDb.collection('memorials').count().get();
		const memorialsCount = memorialsSnapshot.data().count;

		// Load users count
		const usersSnapshot = await adminDb.collection('users').count().get();
		const usersCount = usersSnapshot.data().count;

		// Load purchases count (assuming a purchases collection exists)
		let purchasesCount = 0;
		try {
			const purchasesSnapshot = await adminDb.collection('purchases').count().get();
			purchasesCount = purchasesSnapshot.data().count;
		} catch (error) {
			console.log('ℹ️ [ADMIN MVP] Purchases collection not found, defaulting to 0');
		}

		// Load active streams count (assuming a streams collection exists)
		let activeStreamsCount = 0;
		try {
			const streamsSnapshot = await adminDb
				.collection('streams')
				.where('status', '==', 'active')
				.count()
				.get();
			activeStreamsCount = streamsSnapshot.data().count;
		} catch (error) {
			console.log('ℹ️ [ADMIN MVP] Streams collection not found, defaulting to 0');
		}

		const stats = {
			memorials: memorialsCount,
			users: usersCount,
			purchases: purchasesCount,
			activeStreams: activeStreamsCount
		};

		console.log('📊 [ADMIN MVP] Stats loaded:', stats);
		return stats;

	} catch (error) {
		console.error('❌ [ADMIN MVP] Error loading stats:', error);
		return {
			memorials: 0,
			users: 0,
			purchases: 0,
			activeStreams: 0
		};
	}
}
