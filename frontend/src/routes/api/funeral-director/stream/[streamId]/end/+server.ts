import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { getMUXLiveStream, getMUXPlaybackUrl } from '$lib/server/mux';

export const POST: RequestHandler = async ({ params, locals }) => {
	console.log('🛑 [FD_STREAM] End stream request:', params.streamId);

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
			throw error(403, 'Not authorized to end this stream');
		}

		if (stream.status === 'ended') {
			return json({
				success: true,
				message: 'Stream already ended',
				recordingAvailable: !!stream.recordingUrl
			});
		}

		const endedAt = new Date();
		const duration = stream.startedAt 
			? Math.floor((endedAt.getTime() - stream.startedAt.toDate().getTime()) / 1000)
			: 0;

		const updates: any = {
			status: 'ended',
			endedAt,
			duration
		};

		let recordingUrl = null;
		if (stream.methodConfig?.mux?.streamId) {
			try {
				const muxStream = await getMUXLiveStream(stream.methodConfig.mux.streamId);
				
				if (muxStream.status === 'active' && muxStream.new_asset_settings) {
					console.log('📼 [FD_STREAM] MUX recording will be available shortly');
					recordingUrl = getMUXPlaybackUrl(stream.methodConfig.mux.playbackId, 'hls');
					updates.recordingUrl = recordingUrl;
				}
			} catch (err) {
				console.warn('⚠️ [FD_STREAM] Could not fetch MUX recording info:', err);
			}
		}

		await streamRef.update(updates);

		console.log('✅ [FD_STREAM] Stream ended successfully:', params.streamId);

		return json({
			success: true,
			message: 'Stream ended successfully',
			recordingAvailable: !!recordingUrl,
			recordingUrl,
			stats: {
				duration,
				peakViewerCount: stream.peakViewerCount || 0
			}
		});
	} catch (err: any) {
		console.error('❌ [FD_STREAM] Error ending stream:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, `Failed to end stream: ${err.message}`);
	}
};
