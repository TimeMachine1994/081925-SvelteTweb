import { adminDb } from '$lib/server/firebase';
import { requireAdmin } from '$lib/server/adminGuard';
import { listAll } from '$lib/server/db/repos/funeralDirectors';

export const load = async ({ locals, url }: any) => {
	requireAdmin(locals, { resource: 'funeral_director', action: 'read' });

	// Get query params
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '50');
	const sortBy = url.searchParams.get('sortBy') || 'createdAt';
	const sortDir = url.searchParams.get('sortDir') || 'desc';
	const statusFilter = url.searchParams.get('status');

	// Load funeral directors
	const directors = await listAll({
		status: statusFilter,
		sortBy,
		sortDir: sortDir as 'asc' | 'desc',
		limit
	});

	// Count memorials created by each director
	const directorIds = directors.map((d) => d.id);
	const memorialCounts = new Map();

	if (directorIds.length > 0) {
		// Count memorials where director.uid matches
		for (const directorId of directorIds) {
			const memorialsSnapshot = await adminDb
				.collection('memorials')
				.where('director.uid', '==', directorId)
				.count()
				.get();

			memorialCounts.set(directorId, memorialsSnapshot.data().count);
		}
	}

	const funeralDirectors = directors.map((data) => {
		return {
			id: data.id,
			companyName: data.companyName || 'Unknown',
			contactPerson: data.contactPerson || data.name || 'Unknown',
			email: data.email || '',
			phone: data.phone || null,
			status: data.status || 'approved',
			memorialsCreated: memorialCounts.get(data.id) || 0,
			createdAt: data.createdAt || null,
			address: data.address || null,
			website: data.website || null
		};
	});

	return {
		funeralDirectors,
		pagination: {
			page,
			limit,
			total: funeralDirectors.length
		}
	};
};
