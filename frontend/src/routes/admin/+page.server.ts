import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

/**
 * SIMPLIFIED ADMIN DASHBOARD SERVER LOAD
 *
 * Purpose: Load essential data for admin operations:
 * 1. Pending funeral directors (for approval workflow)
 * 2. Recent memorials (for oversight)
 * 3. Basic system stats
 *
 * Follows established patterns from memorial flow analysis
 */
export const load = async ({ locals }: any) => {
	console.log('🔐 [ADMIN LOAD] Starting admin dashboard load for:', locals.user?.email);

	try {
		// === AUTHENTICATION & AUTHORIZATION ===
		// Following same pattern as memorial APIs
		if (!locals.user) {
			console.log('🚫 [ADMIN LOAD] No authenticated user - redirecting to login');
			throw redirect(302, '/login');
		}

		if (locals.user.role !== 'admin') {
			console.log('🚫 [ADMIN LOAD] User lacks admin privileges:', {
				uid: locals.user.uid,
				role: locals.user.role
			});
			throw redirect(302, '/profile');
		}

		console.log('✅ [ADMIN LOAD] Admin authentication verified for:', locals.user.email);

		// === DATA LOADING ===
		// Load comprehensive data for admin operations
		console.log('📊 [ADMIN LOAD] Loading comprehensive admin dashboard data...');

		const [recentMemorialsSnap, allUsersSnap, funeralDirectorsSnap] = await Promise.all([
			// Load recent memorials for oversight
			adminDb.collection('memorials').orderBy('createdAt', 'desc').limit(50).get(),
			// Load all users for user management
			adminDb.collection('users').orderBy('createdAt', 'desc').limit(100).get(),
			// Load funeral directors
			adminDb.collection('funeral_directors').get()
		]);

		// === PROCESS RECENT MEMORIALS ===
		// Following memorial collection structure from flow analysis
		const recentMemorials = recentMemorialsSnap.docs.map((doc) => {
			const data = doc.data();
			console.log(`💝 [ADMIN LOAD] Processing memorial: ${data.lovedOneName}`);

			return {
				id: doc.id,
				lovedOneName: data.lovedOneName || 'Unknown',
				fullSlug: data.fullSlug,
				creatorEmail: data.creatorEmail || '',
				creatorName: data.creatorName || '',
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				isPublic: data.isPublic !== false,
				isComplete: data.isComplete || false, // Include completion status
				// Payment status from calculatorConfig (following established pattern)
				paymentStatus: data.calculatorConfig?.status || 'draft',
				// Check if has active livestream
				hasLivestream: !!data.livestream?.isActive
			};
		});

		// === PROCESS USERS ===
		const allUsers = allUsersSnap.docs.map((doc) => {
			const data = doc.data();
			return {
				uid: doc.id,
				email: data.email || '',
				displayName: data.displayName || data.name || '',
				role: data.role || 'owner',
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || null
			};
		});

		// === PROCESS FUNERAL DIRECTORS ===
		const allFuneralDirectors = funeralDirectorsSnap.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				companyName: data.companyName || '',
				contactPerson: data.contactPerson || '',
				email: data.email || '',
				phone: data.phone || '',
				licenseNumber: data.licenseNumber || '',
				businessType: data.businessType || '',
				status: data.status || 'approved', // V1: All auto-approved
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null
			};
		});

		// Separate pending and approved (though all are approved in V1)
		const pendingFuneralDirectors = allFuneralDirectors.filter(fd => fd.status === 'pending');
		const approvedFuneralDirectors = allFuneralDirectors.filter(fd => fd.status === 'approved');

		// === CALCULATE STATS ===
		// Get quick stats for dashboard overview
		const [totalMemorialsSnap, totalDirectorsSnap] = await Promise.all([
			adminDb.collection('memorials').count().get(),
			adminDb.collection('funeral_directors').count().get()
		]);

		const stats = {
			totalMemorials: totalMemorialsSnap.data().count,
			totalFuneralDirectors: totalDirectorsSnap.data().count,
			pendingApprovals: 0, // This is now obsolete
			recentMemorials: recentMemorials.length
		};

		console.log('✅ [ADMIN LOAD] Dashboard data loaded successfully:', {
			recentMemorials: recentMemorials.length,
			allUsers: allUsers.length,
			pendingFuneralDirectors: pendingFuneralDirectors.length,
			approvedFuneralDirectors: approvedFuneralDirectors.length,
			stats
		});

		return {
			// Core admin data
			recentMemorials,
			allUsers,
			pendingFuneralDirectors,
			approvedFuneralDirectors,
			stats,
			// User context
			adminUser: {
				email: locals.user.email,
				uid: locals.user.uid
			}
		};
	} catch (error: any) {
		console.error('💥 [ADMIN LOAD] Error loading admin dashboard:', {
			error: error.message,
			stack: error.stack,
			user: locals.user?.email
		});

		// Return safe fallback data to prevent 500 errors
		return {
			recentMemorials: [],
			allUsers: [],
			pendingFuneralDirectors: [],
			approvedFuneralDirectors: [],
			stats: {
				totalMemorials: 0,
				totalFuneralDirectors: 0,
				pendingApprovals: 0,
				recentMemorials: 0
			},
			adminUser: {
				email: locals.user?.email || '',
				uid: locals.user?.uid || ''
			},
			error: `Failed to load admin data: ${error.message}`
		};
	}
};
