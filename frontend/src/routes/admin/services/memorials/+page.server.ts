import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export const load = async ({ locals, url }: any) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	// Get query params for filtering/sorting
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '50');
	const sortBy = url.searchParams.get('sortBy') || 'createdAt';
	const sortDir = url.searchParams.get('sortDir') || 'desc';

	// Load memorials
	let snapshot;
	try {
		let query = adminDb.collection('memorials').orderBy(sortBy, sortDir as any).limit(limit);
		snapshot = await query.get();
	} catch (error) {
		console.error('Error loading memorials with sorting:', error);
		// Fallback to no sorting if index doesn't exist
		let query = adminDb.collection('memorials').limit(limit);
		snapshot = await query.get();
	}

	const memorials = snapshot.docs.map((doc) => {
		const data = doc.data();
		
		// Extract scheduled start time
		let scheduledStartTime = null;
		if (
			data.services?.main?.time?.date &&
			data.services?.main?.time?.time &&
			!data.services.main.time.isUnknown
		) {
			scheduledStartTime = `${data.services.main.time.date}T${data.services.main.time.time}`;
		}

		// Extract location
		const location = data.services?.main?.location?.name || 'Not specified';

		// Payment status
		const isPaid = data.isPaid || data.calculatorConfig?.isPaid || false;

		return {
			id: doc.id,
			lovedOneName: data.lovedOneName || 'Unknown',
			fullSlug: data.fullSlug,
			creatorEmail: data.creatorEmail || '',
			creatorName: data.creatorName || '',
			createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
			isPublic: data.isPublic !== false,
			isComplete: data.isComplete || false,
			isPaid,
			scheduledStartTime,
			location,
			paymentAmount: data.calculatorConfig?.totalPrice || null
		};
	});

	return {
		memorials,
		pagination: {
			page,
			limit,
			total: memorials.length
		}
	};
};
