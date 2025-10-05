import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// GET - Health check endpoint
export const GET: RequestHandler = async () => {
	return json({
		status: 'ok',
		endpoint: 'check-live-status',
		message: 'Live status polling endpoint is active',
		timestamp: new Date().toISOString(),
		features: ['cloudflare_live_input_status', 'batch_status_checking', 'automatic_updates']
	});
};

// POST - Check live status of multiple streams via Cloudflare API
export const POST: RequestHandler = async ({ request }) => {
	console.log('🔍 [LIVE STATUS] Checking live status of streams');

	try {
		const { streamIds } = await request.json();

		if (!streamIds || !Array.isArray(streamIds)) {
			throw SvelteKitError(400, 'streamIds array required');
		}

		console.log('🔍 [LIVE STATUS] Checking', streamIds.length, 'streams');

		const results = [];
		let updatedCount = 0;

		for (const streamId of streamIds) {
			try {
				const streamDoc = await adminDb.collection('streams').doc(streamId).get();

				if (!streamDoc.exists) {
					console.log('⚠️ [LIVE STATUS] Stream not found:', streamId);
					continue;
				}

				const stream = streamDoc.data()!;
				const cloudflareInputId = stream.cloudflareInputId;

				if (!cloudflareInputId) {
					console.log('⚠️ [LIVE STATUS] No cloudflareInputId for stream:', streamId);
					results.push({
						streamId,
						cloudflareInputId: null,
						wasLive: stream.status === 'live',
						isLive: false,
						status: stream.status,
						updated: false,
						error: 'No Cloudflare Input ID'
					});
					continue;
				}

				const cloudflareUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${cloudflareInputId}`;

				console.log('🔍 [LIVE STATUS] Checking Cloudflare for:', cloudflareInputId);

				const response = await fetch(cloudflareUrl, {
					headers: {
						'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
						'Content-Type': 'application/json'
					}
				});

				if (!response.ok) {
					console.log('❌ [LIVE STATUS] Cloudflare API error for stream:', streamId, response.status);
					results.push({
						streamId,
						cloudflareInputId,
						wasLive: stream.status === 'live',
						isLive: false,
						status: stream.status,
						updated: false,
						error: `Cloudflare API error: ${response.status}`
					});
					continue;
				}

				const data = await response.json();
				const liveInput = data.result;

				if (!liveInput) {
					console.log('❌ [LIVE STATUS] No live input data for stream:', streamId);
					results.push({
						streamId,
						cloudflareInputId,
						wasLive: stream.status === 'live',
						isLive: false,
						status: stream.status,
						updated: false,
						error: 'No live input data from Cloudflare'
					});
					continue;
				}

				// Check if the live input is currently connected
				const isCurrentlyLive = liveInput.status?.current?.state === 'connected';
				const wasLive = stream.status === 'live';

				console.log('🔍 [LIVE STATUS] Stream', streamId, '- Was live:', wasLive, 'Is live:', isCurrentlyLive);

				let updated = false;

				// Update database if status changed
				if (isCurrentlyLive && !wasLive) {
					// Stream went live
					console.log('🔴 [LIVE STATUS] Stream went live:', streamId);
					await adminDb.collection('streams').doc(streamId).update({
						status: 'live',
						startedAt: new Date().toISOString(),
						updatedAt: new Date().toISOString()
					});
					updated = true;
					updatedCount++;
				} else if (!isCurrentlyLive && wasLive) {
					// Stream went offline
					console.log('⏹️ [LIVE STATUS] Stream went offline:', streamId);
					await adminDb.collection('streams').doc(streamId).update({
						status: 'completed',
						endedAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
						recordingReady: false // Initialize as not ready
					});
					updated = true;
					updatedCount++;

					// Check for recordings after a short delay (Cloudflare needs time to process)
					setTimeout(async () => {
						try {
							console.log('🎥 [LIVE STATUS] Checking for recordings after stream completion:', streamId);
							const recordingsResponse = await fetch(`http://localhost:5173/api/streams/${streamId}/recordings`);
							if (recordingsResponse.ok) {
								const recordingsData = await recordingsResponse.json();
								console.log('✅ [LIVE STATUS] Recording check completed for:', streamId, 'Found:', recordingsData.recordingCount);
							}
						} catch (error) {
							console.error('❌ [LIVE STATUS] Error checking recordings:', error);
						}
					}, 30000); // Wait 30 seconds for Cloudflare to start processing
				}

				results.push({
					streamId,
					cloudflareInputId,
					wasLive,
					isLive: isCurrentlyLive,
					status: isCurrentlyLive ? 'live' : (wasLive ? 'completed' : stream.status),
					updated,
					lastConnected: liveInput.status?.current?.startTimeSeconds ? 
						new Date(liveInput.status.current.startTimeSeconds * 1000).toISOString() : null
				});

			} catch (error: any) {
				console.error('❌ [LIVE STATUS] Error checking stream:', streamId, error);
				results.push({
					streamId,
					cloudflareInputId: stream?.cloudflareInputId || null,
					wasLive: stream?.status === 'live' || false,
					isLive: false,
					status: stream?.status || 'unknown',
					updated: false,
					error: error.message || 'Unknown error'
				});
			}
		}

		console.log('✅ [LIVE STATUS] Checked', streamIds.length, 'streams, updated', updatedCount);

		return json({
			success: true,
			message: `Checked ${streamIds.length} streams, updated ${updatedCount}`,
			results,
			summary: {
				total: streamIds.length,
				updated: updatedCount,
				errors: results.filter(r => r.error).length,
				live: results.filter(r => r.isLive).length
			},
			timestamp: new Date().toISOString()
		});

	} catch (error: any) {
		console.error('❌ [LIVE STATUS] Error processing request:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw SvelteKitError(500, 'Failed to check live status');
	}
};
