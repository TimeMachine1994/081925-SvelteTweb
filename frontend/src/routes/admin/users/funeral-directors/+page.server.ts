import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export const load = async ({ locals, url }: any) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	// Get query params
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '50');
	const sortBy = url.searchParams.get('sortBy') || 'createdAt';
	const sortDir = url.searchParams.get('sortDir') || 'desc';
	const statusFilter = url.searchParams.get('status');

	// Load funeral directors
	let query = adminDb.collection('funeral_directors');

	// Apply status filter if provided
	if (statusFilter) {
		query = query.where('status', '==', statusFilter);
	}

	const snapshot = await (query.orderBy(sortBy, sortDir as any).limit(limit).get());

	// Count memorials created by each director
	const directorIds = snapshot.docs.map((doc) => doc.id);
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

	const funeralDirectors = snapshot.docs.map((doc) => {
		const data = doc.data();

		return {
			id: doc.id,
			companyName: data.companyName || 'Unknown',
			contactPerson: data.contactPerson || data.name || 'Unknown',
			email: data.email || '',
			phone: data.phone || null,
			status: data.status || 'pending',
			memorialsCreated: memorialCounts.get(doc.id) || 0,
			createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
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
