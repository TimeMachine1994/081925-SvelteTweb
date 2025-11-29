import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { PRIVATE_DAILY_API_KEY } from '$env/static/private';

export const load: PageServerLoad = async ({ params, locals }) => {
	// 1. Security Check
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Unauthorized access');
	}

	const { memorialId } = params;

	// DEBUG: Allow test ID
	if (memorialId === 'test-memorial-id') {
		return {
			memorial: {
				id: 'test-memorial-id',
				name: 'Test Memorial Service',
				lovedOneName: 'John Doe'
			},
			streamData: null,
			DAILY_API_KEY: PRIVATE_DAILY_API_KEY ? 'present' : 'missing'
		};
	}

	// 2. Fetch Memorial
	const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
	if (!memorialDoc.exists) {
		throw error(404, 'Memorial not found');
	}
	const memorial = memorialDoc.data();

	// 3. Fetch or Create Daily Room (simplified for now)
	// We'll check if there's a stream record with Daily info
	const streamQuery = await adminDb
		.collection('streams')
		.where('memorialId', '==', memorialId)
		.where('isDailyStream', '==', true)
		.limit(1)
		.get();

	let streamData = null;
	if (!streamQuery.empty) {
		streamData = streamQuery.docs[0].data();
	}

	return {
		memorial: {
			id: memorialId,
			name: memorial?.lovedOneName || 'Unknown Memorial',
			...memorial
		},
		streamData,
		DAILY_API_KEY: PRIVATE_DAILY_API_KEY ? 'present' : 'missing' // Debug info
	};
};
