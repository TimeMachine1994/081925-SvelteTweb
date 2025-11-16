import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

/**
 * GET - List all schedule edit requests with optional filtering (admin only)
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	console.log('📋 [ADMIN] Fetching schedule edit requests');

	try {
		// Check authentication
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		if (locals.user.role !== 'admin') {
			return json({ error: 'Admin privileges required' }, { status: 403 });
		}

		// Parse query parameters for filtering
		const status = url.searchParams.get('status');
		const memorialId = url.searchParams.get('memorialId');
		const limit = parseInt(url.searchParams.get('limit') || '50');

		// Build query
		let query = adminDb.collection('schedule_edit_requests').orderBy('createdAt', 'desc');

		// Apply filters
		if (status && ['pending', 'approved', 'denied', 'completed'].includes(status)) {
			query = query.where('status', '==', status) as any;
		}

		if (memorialId) {
			query = query.where('memorialId', '==', memorialId) as any;
		}

		// Apply limit
		query = query.limit(limit) as any;

		// Execute query
		const snapshot = await query.get();

		// Format results
		const requests = snapshot.docs.map(doc => {
			const data = doc.data();
			return {
				id: doc.id,
				...data,
				createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt,
				reviewedAt: data?.reviewedAt?.toDate?.()?.toISOString() || data?.reviewedAt
			};
		});

		// Count by status
		const statusCounts = {
			pending: requests.filter((r: any) => r.status === 'pending').length,
			approved: requests.filter((r: any) => r.status === 'approved').length,
			denied: requests.filter((r: any) => r.status === 'denied').length,
			completed: requests.filter((r: any) => r.status === 'completed').length
		};

		console.log(`✅ [ADMIN] Found ${requests.length} edit requests`);

		return json({
			success: true,
			requests,
			statusCounts,
			total: requests.length
		});

	} catch (error) {
		console.error('💥 [ADMIN] Error fetching edit requests:', error);
		return json(
			{
				error: 'Failed to fetch edit requests',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
