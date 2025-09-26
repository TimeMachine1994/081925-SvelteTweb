import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from '$env/static/private';
import { adminDb } from '$lib/firebase-admin';

/**
 * Get detailed Cloudflare Stream Live Input status
 */
export const GET: RequestHandler = async ({ params }) => {
	console.log('🔍 Checking Cloudflare Stream status for memorial:', params.memorialId);

	try {
		const { memorialId } = params;
		
		// Get the cloudflareId from the memorial document
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}
		
		const memorial = memorialDoc.data();
		const cloudflareId = memorial?.livestream?.cloudflareId;
		
		if (!cloudflareId) {
			return json({ error: 'No active livestream or cloudflareId found' }, { status: 400 });
		}
		
		console.log('🎯 Found cloudflareId:', cloudflareId);

		// Get Live Input status from Cloudflare
		const cfResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${cloudflareId}`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
				'Content-Type': 'application/json'
			}
		});

		if (!cfResponse.ok) {
			const errorBody = await cfResponse.text();
			console.error(`Cloudflare API error: ${cfResponse.status} - ${errorBody}`);
			return json({ error: 'Failed to get live input status', details: errorBody }, { status: 502 });
		}

		const cfData = await cfResponse.json();
		const liveInput = cfData.result;

		console.log('📊 Cloudflare Live Input Status:', JSON.stringify(liveInput, null, 2));

		// Check if recording is available for playback
		let recordingStatus = null;
		if (liveInput.recording?.uid) {
			console.log('🎬 Checking recording status for video:', liveInput.recording.uid);
			
			try {
				const videoResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${liveInput.recording.uid}`, {
					headers: {
						'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
						'Content-Type': 'application/json'
					}
				});

				if (videoResponse.ok) {
					const videoData = await videoResponse.json();
					const video = videoData.result;
					console.log('🎬 Recording video status:', video.status?.state);
					
					recordingStatus = {
						uid: video.uid,
						state: video.status?.state, // 'ready', 'inprogress', 'error', etc.
						isReady: video.status?.state === 'ready',
						duration: video.duration,
						playback: video.playback,
						created: video.created,
						modified: video.modified
					};

					// Update archive entry if recording just became ready
					if (video.status?.state === 'ready' && memorial?.livestreamArchive) {
						const archive = memorial.livestreamArchive;
						let archiveUpdated = false;

						for (let i = 0; i < archive.length; i++) {
							if (archive[i].cloudflareId === liveInput.recording.uid && !archive[i].recordingReady) {
								archive[i].recordingReady = true;
								archive[i].duration = video.duration;
								archive[i].updatedAt = new Date();
								archiveUpdated = true;
								console.log('🎬 Updated archive entry recording status:', archive[i].id);
								break;
							}
						}

						if (archiveUpdated) {
							await memorialRef.update({
								livestreamArchive: archive,
								updatedAt: new Date()
							});
						}
					}
				}
			} catch (recordingError) {
				console.warn('⚠️ Could not fetch recording status:', recordingError);
			}
		}

		// Extract key status information
		const status = {
			uid: liveInput.uid,
			status: liveInput.status, // Should be 'live' when streaming
			isConnected: liveInput.status === 'live',
			isStreaming: liveInput.status === 'live',
			connectionCount: liveInput.connectionCount || 0,
			rtmps: liveInput.rtmps,
			webRTC: liveInput.webRTC,
			sip: liveInput.sip,
			recording: liveInput.recording,
			recordingStatus,
			meta: liveInput.meta,
			created: liveInput.created,
			modified: liveInput.modified,
			playback: liveInput.playback
		};

		console.log('✅ Live Input Status Summary:', status);

		return json({
			success: true,
			memorialId,
			cloudflareId,
			status,
			rawResponse: liveInput,
			debugging: {
				hasActiveStream: !!memorial?.livestream?.isActive,
				streamStatus: memorial?.livestream?.status,
				cloudflareStatus: liveInput.status,
				playbackUrls: {
					primary: memorial?.livestream?.playbackUrl,
					alternative: memorial?.livestream?.alternativePlaybackUrl,
					direct: memorial?.livestream?.directPlaybackUrl
				}
			}
		});

	} catch (error) {
		console.error('💥 Error checking stream status:', error);
		return json(
			{ error: 'Failed to check stream status', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
