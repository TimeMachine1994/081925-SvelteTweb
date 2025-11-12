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
	let query = adminDb.collection('streams').orderBy(sortBy, sortDir as any).limit(limit);

	const snapshot = await query.get();

	// Get memorial names for each stream
	const memorialIds = [...new Set(snapshot.docs.map((doc) => doc.data().memorialId))];
	const memorialsSnapshot = await adminDb
		.collection('memorials')
		.where('__name__', 'in', memorialIds.length > 0 ? memorialIds : ['__none__'])
		.get();

	const memorialMap = new Map();
	memorialsSnapshot.docs.forEach((doc) => {
		memorialMap.set(doc.id, doc.data().lovedOneName);
	});

	const streams = snapshot.docs.map((doc) => {
		const data = doc.data();

		// Calculate duration if stream has ended
		let duration = null;
		if (data.startedAt && data.endedAt) {
			const start = data.startedAt.toDate();
			const end = data.endedAt.toDate();
			duration = Math.floor((end.getTime() - start.getTime()) / 1000);
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
			memorialId: data.memorialId,
			memorialName: memorialMap.get(data.memorialId) || 'Unknown',
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
