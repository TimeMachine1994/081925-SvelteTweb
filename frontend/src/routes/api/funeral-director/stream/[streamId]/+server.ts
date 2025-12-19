import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { getMUXLiveStream } from '$lib/server/mux';

export const GET: RequestHandler = async ({ params, locals }) => {
	console.log('🔍 [FD_STREAM] Get stream status:', params.streamId);

	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	try {
		const streamRef = adminDb.collection('streams').doc(params.streamId);
		const streamDoc = await streamRef.get();

		if (!streamDoc.exists) {
			throw error(404, 'Stream not found');
		}

		const stream = streamDoc.data();

		if (stream.funeralDirectorUid !== locals.user.uid && locals.user.role !== 'admin') {
			const memorialRef = adminDb.collection('memorials').doc(stream.memorialId);
			const memorialDoc = await memorialRef.get();
			
			if (!memorialDoc.exists || memorialDoc.data().ownerUid !== locals.user.uid) {
				throw error(403, 'Not authorized to view this stream');
			}
		}

		const memorialRef = adminDb.collection('memorials').doc(stream.memorialId);
		const memorialDoc = await memorialRef.get();
		const memorial = memorialDoc.exists ? memorialDoc.data() : null;

		let muxStatus = null;
		if (stream.methodConfig?.mux?.streamId) {
			try {
				muxStatus = await getMUXLiveStream(stream.methodConfig.mux.streamId);
			} catch (err) {
				console.warn('⚠️ [FD_STREAM] Could not fetch MUX status:', err);
			}
		}

		const duration = stream.startedAt && stream.endedAt 
			? Math.floor((stream.endedAt.toDate().getTime() - stream.startedAt.toDate().getTime()) / 1000)
			: stream.startedAt 
				? Math.floor((Date.now() - stream.startedAt.toDate().getTime()) / 1000)
				: 0;

		return json({
			stream: {
				id: params.streamId,
				memorialId: stream.memorialId,
				status: stream.status,
				config: stream.methodConfig,
				playbackUrl: stream.playbackUrl,
				memorial: memorial ? {
					lovedOneName: memorial.lovedOneName,
					fullSlug: memorial.fullSlug
				} : null,
				stats: {
					duration,
					viewerCount: stream.viewerCount || 0,
					peakViewerCount: stream.peakViewerCount || 0,
					startedAt: stream.startedAt,
					createdAt: stream.createdAt
				},
				muxStatus
			}
		});
	} catch (err: any) {
		console.error('❌ [FD_STREAM] Error fetching stream:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, `Failed to fetch stream: ${err.message}`);
	}
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	console.log('📝 [FD_STREAM] Update stream:', params.streamId);

	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	try {
		const streamRef = adminDb.collection('streams').doc(params.streamId);
		const streamDoc = await streamRef.get();

		if (!streamDoc.exists) {
			throw error(404, 'Stream not found');
		}

		const stream = streamDoc.data();

		if (stream.funeralDirectorUid !== locals.user.uid && locals.user.role !== 'admin') {
			throw error(403, 'Not authorized to update this stream');
		}

		const updates = await request.json();
		const allowedUpdates: any = {};

		if (updates.status && ['live', 'ended'].includes(updates.status)) {
			allowedUpdates.status = updates.status;
			
			if (updates.status === 'live' && !stream.startedAt) {
				allowedUpdates.startedAt = new Date();
			}
			
			if (updates.status === 'ended' && !stream.endedAt) {
				allowedUpdates.endedAt = new Date();
			}
		}

		if (updates.actualStartTime) {
			allowedUpdates.actualStartTime = new Date(updates.actualStartTime);
		}

		if (updates.viewerCount !== undefined) {
			allowedUpdates.viewerCount = updates.viewerCount;
			if (updates.viewerCount > (stream.peakViewerCount || 0)) {
				allowedUpdates.peakViewerCount = updates.viewerCount;
			}
		}

		await streamRef.update(allowedUpdates);

		console.log('✅ [FD_STREAM] Stream updated:', params.streamId);

		return json({
			success: true,
			message: 'Stream updated successfully'
		});
	} catch (err: any) {
		console.error('❌ [FD_STREAM] Error updating stream:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, `Failed to update stream: ${err.message}`);
	}
};
