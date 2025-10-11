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

		if (!locals.user.admin && locals.user.role !== 'admin') {
			console.log('🚫 [ADMIN LOAD] User lacks admin privileges:', {
				uid: locals.user.uid,
				admin: locals.user.admin,
				role: locals.user.role
			});
			throw redirect(302, '/profile');
		}

		console.log('✅ [ADMIN LOAD] Admin authentication verified for:', locals.user.email);

		// === DATA LOADING ===
		// Load only essential data for admin operations
		console.log('📊 [ADMIN LOAD] Loading admin dashboard data...');

		const [recentMemorialsSnap] = await Promise.all([
			// Load recent memorials for oversight (last 30 days)
			adminDb.collection('memorials').orderBy('createdAt', 'desc').limit(20).get()
		]);

		// === PROCESS RECENT MEMORIALS ===
		// Following memorial collection structure from flow analysis
		const recentMemorials = recentMemorialsSnap.docs.map((doc) => {
			const data = doc.data();
			console.log(`💝 [ADMIN LOAD] Processing memorial: ${data.lovedOneName}`);

			return {
				id: doc.id,
				lovedOneName: data.lovedOneName || 'Unknown',
				slug: data.slug,
				fullSlug: data.fullSlug,
				creatorEmail: data.creatorEmail || '',
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				// Payment status from calculatorConfig (following established pattern)
				paymentStatus: data.calculatorConfig?.status || 'draft',
				// Check if has active livestream
				hasLivestream: !!data.livestream?.isActive
			};
		});

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
			stats
		});

		return {
			// Core admin data
			pendingFuneralDirectors: [], // Obsolete, return empty array
			recentMemorials,
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
			pendingFuneralDirectors: [],
			recentMemorials: [],
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
