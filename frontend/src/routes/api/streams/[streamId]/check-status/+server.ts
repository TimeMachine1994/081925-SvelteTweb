import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLiveInputStatus, getStreamPlaybackUrl } from '$lib/server/cloudflare-stream';

/**
 * Manual endpoint to check and update stream status
 * FOR DEBUGGING/TESTING ONLY - Not used in production
 * Production relies on Cloudflare webhooks for instant status updates
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	console.log('🔍 [CHECK STATUS] Checking stream status:', params.streamId);

	const streamId = params.streamId;

	try {
		// Get stream document
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			throw SvelteKitError(404, 'Stream not found');
		}

		const streamData = streamDoc.data()!;
		const cloudflareInputId = streamData.streamCredentials?.cloudflareInputId;

		if (!cloudflareInputId) {
			console.log('⚠️ [CHECK STATUS] No Cloudflare Input ID found');
			return json({
				success: true,
				streamId,
				status: streamData.status,
				message: 'Stream not armed or missing Cloudflare Input ID'
			});
		}

		// Check Cloudflare status
		const cloudflareStatus = await getLiveInputStatus(cloudflareInputId);
		console.log('📊 [CHECK STATUS] Cloudflare status:', cloudflareStatus);

		// Determine new status
		let newStatus = streamData.status;
		let updates: any = {
			updatedAt: new Date().toISOString()
		};

		if (cloudflareStatus.isLive && streamData.status !== 'live') {
			// Stream just went live
			newStatus = 'live';
			updates.status = 'live';
			updates.liveStartedAt = new Date().toISOString();
			console.log('🔴 [CHECK STATUS] Stream is now LIVE');
		} else if (!cloudflareStatus.isLive && streamData.status === 'live') {
			// Stream ended
			newStatus = 'completed';
			updates.status = 'completed';
			updates.liveEndedAt = new Date().toISOString();
			console.log('⚪ [CHECK STATUS] Stream ENDED');

			// Get recording playback URL if available
			if (cloudflareStatus.videoUid) {
				try {
					const playbackUrls = await getStreamPlaybackUrl(cloudflareStatus.videoUid);
					updates.playbackUrl = playbackUrls.hlsUrl;
					updates.embedUrl = playbackUrls.embedUrl;
					updates.recordingReady = true;
					updates.cloudflareStreamId = cloudflareStatus.videoUid;
					console.log('🎥 [CHECK STATUS] Recording available:', playbackUrls.hlsUrl);
				} catch (err) {
					console.error('❌ [CHECK STATUS] Failed to get playback URL:', err);
				}
			}
		}

		// Update if status changed
		if (Object.keys(updates).length > 1) {
			await streamDoc.ref.update(updates);
			console.log('💾 [CHECK STATUS] Stream updated:', newStatus);
		}

		return json({
			success: true,
			streamId,
			status: newStatus,
			isLive: cloudflareStatus.isLive,
			cloudflareStatus: cloudflareStatus.status,
			updated: Object.keys(updates).length > 1
		});
	} catch (err: any) {
		console.error('❌ [CHECK STATUS] Error:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw SvelteKitError(500, `Failed to check stream status: ${err?.message || 'Unknown error'}`);
	}
};
