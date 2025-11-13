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

	const streams = streamsSnapshot.docs.map((doc) => {
		const data = doc.data();
		return {
			id: doc.id,
			memorialId: data.memorialId,
			title: data.title || 'Untitled Stream',
			description: data.description || '',
			status: data.status || 'scheduled',
			visibility: data.visibility || 'public',
			scheduledStartTime: data.scheduledStartTime || null,
			
			// Stream Arming
			armStatus: data.armStatus || null,
			streamCredentials: data.streamCredentials || null,
			
			// Timestamps
			liveStartedAt: data.liveStartedAt || null,
			liveEndedAt: data.liveEndedAt || null,
			createdAt: data.createdAt || null,
			updatedAt: data.updatedAt || null,
			
			// Other fields
			playbackUrl: data.playbackUrl || null,
			embedUrl: data.embedUrl || null,
			recordingReady: data.recordingReady || false
		};
	});

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
