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

	// Load streams
	let snapshot;
	try {
		// Try with sorting first
		let query = adminDb.collection('streams').orderBy(sortBy, sortDir as any).limit(limit);
		snapshot = await query.get();
	} catch (error) {
		console.error('Error loading streams with sorting:', error);
		// Fallback to no sorting if index doesn't exist
		let query = adminDb.collection('streams').limit(limit);
		snapshot = await query.get();
	}

	// Get memorial names for each stream
	const memorialIds = [...new Set(snapshot.docs.map((doc) => doc.data().memorialId).filter(Boolean))];
	
	const memorialMap = new Map();
	
	// Only query memorials if we have IDs
	if (memorialIds.length > 0) {
		try {
			const memorialsSnapshot = await adminDb
				.collection('memorials')
				.where('__name__', 'in', memorialIds.slice(0, 10)) // Firestore 'in' limit is 10
				.get();

			memorialsSnapshot.docs.forEach((doc) => {
				memorialMap.set(doc.id, doc.data().lovedOneName);
			});
		} catch (error) {
			console.error('Error loading memorial names:', error);
		}
	}

	const streams = snapshot.docs.map((doc) => {
		const data = doc.data();

		// Calculate duration if stream has ended
		let duration = null;
		try {
			if (data.startedAt && data.endedAt) {
				const start = data.startedAt.toDate();
				const end = data.endedAt.toDate();
				duration = Math.floor((end.getTime() - start.getTime()) / 1000);
			}
		} catch (error) {
			console.error('Error calculating stream duration:', error);
		}

		// Recording status
		let recordingStatus = 'none';
		if (data.recordingReady) {
			recordingStatus = 'ready';
		} else if (data.recordingProcessing) {
			recordingStatus = 'processing';
		} else if (data.recordingFailed) {
			recordingStatus = 'failed';
		}

		return {
			id: doc.id,
			title: data.title || 'Untitled Stream',
			memorialId: data.memorialId || null,
			memorialName: data.memorialId ? memorialMap.get(data.memorialId) || 'Unknown' : 'No Memorial',
			status: data.status || 'idle',
			isVisible: data.isVisible !== false,
			scheduledStartTime: data.scheduledStartTime || null,
			createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
			startedAt: data.startedAt?.toDate?.()?.toISOString() || null,
			endedAt: data.endedAt?.toDate?.()?.toISOString() || null,
			duration,
			recordingStatus,
			recordingUrl: data.recordingUrl || null,
			provider: data.cloudflareStreamId ? 'cloudflare' : data.mux?.liveStreamId ? 'mux' : 'unknown'
		};
	});

	return {
		streams,
		pagination: {
			page,
			limit,
			total: streams.length
		}
	};
};
