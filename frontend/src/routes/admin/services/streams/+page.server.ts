import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError } from '@sveltejs/kit';
import type { Stream } from '$lib/types/stream';

export const load: PageServerLoad = async ({ locals }) => {
	// Check if user is admin
	if (!locals.user || locals.user.role !== 'admin') {
		throw SvelteKitError(403, 'Admin access required');
	}

	// Fetch all streams across all memorials
	const streamsSnapshot = await adminDb
		.collection('streams')
		.orderBy('createdAt', 'desc')
		.limit(100) // Limit to recent 100 streams
		.get();

	const streams: Stream[] = streamsSnapshot.docs.map((doc) => ({
		id: doc.id,
		...doc.data()
	})) as Stream[];

	// Fetch memorial names for each stream
	const memorialIds = [...new Set(streams.map(s => s.memorialId))];
	const memorialDocs = await Promise.all(
		memorialIds.map(id => adminDb.collection('memorials').doc(id).get())
	);

	const memorialNames: Record<string, string> = {};
	memorialDocs.forEach(doc => {
		if (doc.exists) {
			memorialNames[doc.id] = doc.data()?.lovedOneName || 'Unknown';
		}
	});

	// Add memorial names to streams
	const streamsWithMemorials = streams.map(stream => ({
		...stream,
		memorialName: memorialNames[stream.memorialId] || 'Unknown Memorial'
	}));

	return {
		streams: streamsWithMemorials,
		canManage: true // Admins can always manage
	};
};
