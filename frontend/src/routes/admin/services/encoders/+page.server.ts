import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { Encoder } from '$lib/types/encoder';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	// Query params
	const statusFilter = url.searchParams.get('status');
	const searchQuery = url.searchParams.get('q');

	try {
		let query: FirebaseFirestore.Query = adminDb.collection('encoders');

		if (statusFilter) {
			query = query.where('status', '==', statusFilter);
		}

		const snapshot = await query.orderBy('createdAt', 'desc').get();

		let encoders: Encoder[] = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				name: data.name,
				description: data.description || '',
				credentials: data.credentials,
				status: data.status || 'available',
				currentAssignment: data.currentAssignment || null,
				deviceType: data.deviceType || null,
				location: data.location || null,
				createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
				createdBy: data.createdBy,
				updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
			};
		});

		// Client-side search filtering
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			encoders = encoders.filter(
				(e) =>
					e.name.toLowerCase().includes(query) ||
					e.description?.toLowerCase().includes(query) ||
					e.location?.toLowerCase().includes(query) ||
					e.currentAssignment?.memorialName?.toLowerCase().includes(query)
			);
		}

		// Stats
		const stats = {
			total: encoders.length,
			available: encoders.filter((e) => e.status === 'available').length,
			assigned: encoders.filter((e) => e.status === 'assigned').length,
			maintenance: encoders.filter((e) => e.status === 'maintenance').length
		};

		return {
			encoders,
			stats,
			canManage: true,
			searchQuery: searchQuery || '',
			statusFilter: statusFilter || ''
		};
	} catch (error: any) {
		console.error('❌ [ENCODERS PAGE] Error loading encoders:', error);

		return {
			encoders: [],
			stats: { total: 0, available: 0, assigned: 0, maintenance: 0 },
			canManage: true,
			searchQuery: searchQuery || '',
			statusFilter: statusFilter || '',
			error: error.message
		};
	}
};
