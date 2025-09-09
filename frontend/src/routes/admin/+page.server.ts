import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { PageServerLoad } from './$types';
import type { Memorial } from '$lib/types/memorial';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('🔐 [ADMIN PAGE] Loading admin dashboard for user:', locals.user?.email);
	console.log('🔐 [ADMIN PAGE] User object:', JSON.stringify(locals.user, null, 2));

	// Redirect to login if not authenticated
	if (!locals.user) {
		console.log('🚫 [ADMIN PAGE] User not authenticated, redirecting to login');
		throw redirect(302, '/login');
	}

	// Check if user is admin
	if (!locals.user.admin && locals.user.role !== 'admin') {
		console.log('🚫 [ADMIN PAGE] User is not admin, redirecting to profile');
		console.log('🚫 [ADMIN PAGE] User admin flag:', locals.user.admin);
		console.log('🚫 [ADMIN PAGE] User role:', locals.user.role);
		throw redirect(302, '/profile');
	}

	console.log('👑 [ADMIN PAGE] User is admin, loading admin dashboard data...');
	console.log('👑 [ADMIN PAGE] Admin check passed - admin:', locals.user.admin, 'role:', locals.user.role);

	try {
		console.log('🔥 Attempting to connect to Firestore...');
		
		// Test Firestore connection first
		await adminDb.collection('test').limit(1).get();
		console.log('✅ Firestore connection successful');

		// Load all memorials for admin view
		console.log('📊 Loading memorials...');
		const memorialsSnap = await adminDb.collection('memorials').get();
		const memorials = memorialsSnap.docs.map(doc => {
			const data = doc.data();
			
			// Helper function to convert Firestore Timestamps to ISO strings
			const convertTimestamp = (timestamp: any) => {
				if (timestamp?.toDate) {
					return timestamp.toDate().toISOString();
				}
				if (timestamp instanceof Date) {
					return timestamp.toISOString();
				}
				return timestamp;
			};

			// Convert nested paymentHistory dates
			const paymentHistory = data.paymentHistory?.map((payment: any) => ({
				...payment,
				createdAt: convertTimestamp(payment.createdAt),
				updatedAt: convertTimestamp(payment.updatedAt)
			})) || [];

			// Convert nested schedule dates
			const schedule = data.schedule ? {
				...data.schedule,
				createdAt: convertTimestamp(data.schedule.createdAt),
				updatedAt: convertTimestamp(data.schedule.updatedAt),
				serviceDate: convertTimestamp(data.schedule.serviceDate)
			} : null;

			return {
				id: doc.id,
				...data,
				// Convert main Firestore Timestamps to ISO strings
				createdAt: convertTimestamp(data.createdAt),
				updatedAt: convertTimestamp(data.updatedAt),
				serviceDate: convertTimestamp(data.serviceDate),
				// Convert nested objects
				paymentHistory,
				schedule
			};
		}) as Memorial[];

		// Load all users for admin management
		console.log('👥 Loading users...');
		const usersSnap = await adminDb.collection('users').get();
		const allUsers = usersSnap.docs.map(doc => {
			const data = doc.data();
			
			// Helper function to convert Firestore Timestamps to ISO strings
			const convertTimestamp = (timestamp: any) => {
				if (timestamp?.toDate) {
					return timestamp.toDate().toISOString();
				}
				if (timestamp instanceof Date) {
					return timestamp.toISOString();
				}
				return timestamp;
			};

			return {
				uid: doc.id,
				email: data.email || '',
				displayName: data.displayName || '',
				role: data.role || 'owner',
				createdAt: convertTimestamp(data.createdAt),
				updatedAt: convertTimestamp(data.updatedAt)
			};
		});

		console.log(`✅ Loaded ${memorials.length} memorials and ${allUsers.length} users for admin`);

		return {
			user: locals.user,
			memorials,
			allUsers,
			stats: {
				totalMemorials: memorials.length,
				totalUsers: allUsers.length,
				activeStreams: memorials.filter(m => m.livestream).length,
				recentMemorials: memorials.filter(m => {
					const createdAt = new Date(m.createdAt);
					const weekAgo = new Date();
					weekAgo.setDate(weekAgo.getDate() - 7);
					return createdAt > weekAgo;
				}).length
			}
		};

	} catch (error) {
		console.error('❌ Error loading admin dashboard data:', error);
		console.error('❌ Error details:', {
			name: error.name,
			message: error.message,
			code: error.code,
			stack: error.stack
		});
		
		return {
			user: locals.user,
			memorials: [],
			allUsers: [],
			stats: {
				totalMemorials: 0,
				totalUsers: 0,
				activeStreams: 0,
				recentMemorials: 0
			},
			error: `Failed to load admin dashboard data: ${error.message}`
		};
	}
};
