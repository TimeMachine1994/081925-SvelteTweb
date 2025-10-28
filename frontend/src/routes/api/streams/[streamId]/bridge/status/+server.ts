import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const MUX_TOKEN_ID = env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = env.MUX_TOKEN_SECRET;

/**
 * Mux Bridge Status Endpoint
 * 
 * URL: /api/streams/[streamId]/bridge/status
 * Purpose: Get current Mux bridge status and recording metrics
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	const { streamId } = params;

	console.log('📊 [BRIDGE_STATUS] Getting bridge status for stream:', streamId);

	try {
		// Validate user authentication
		if (!locals.user) {
			console.error('❌ [BRIDGE_STATUS] Unauthorized request');
			throw error(401, 'Authentication required');
		}

		// Find Mux bridge session for this stream
		const bridgeDoc = await adminDb
			.collection('mux_bridges')
			.doc(streamId)
			.get();

		if (!bridgeDoc.exists) {
			console.log('ℹ️ [MUX_BRIDGE_STATUS] No bridge session found for stream:', streamId);
			return json({
				bridgeId: null,
				status: 'inactive',
				message: 'No Mux bridge session found for this stream'
			});
		}

		const bridgeSession = bridgeDoc.data();

		console.log('📋 [MUX_BRIDGE_STATUS] Bridge session found:', {
			bridgeId: bridgeSession?.muxLiveStreamId,
			status: bridgeSession?.status,
			muxStreamKey: bridgeSession?.muxStreamKey
		});

		// If bridge is not active, return basic status
		if (!['ready', 'active'].includes(bridgeSession?.status)) {
			return json({
				bridgeId: bridgeSession?.muxLiveStreamId,
				status: bridgeSession?.status || 'inactive',
				startedAt: bridgeSession?.startedAt,
				stoppedAt: bridgeSession?.completedAt,
				duration: bridgeSession?.completedAt && bridgeSession?.startedAt ? 
					Math.floor((new Date(bridgeSession.completedAt).getTime() - new Date(bridgeSession.startedAt).getTime()) / 1000) : 0,
				errors: bridgeSession?.error ? [bridgeSession.error] : []
			});
		}

		// Get real-time status from Mux
		const muxStatus = await getMuxStreamStatus(bridgeSession);

		// Calculate duration
		const duration = bridgeSession?.startedAt ? 
			Math.floor((Date.now() - new Date(bridgeSession.startedAt).getTime()) / 1000) : 0;

		// Get recording information from Mux
		const recordingInfo = await getMuxRecordingInfo(bridgeSession);

		const response = {
			bridgeId: bridgeSession?.muxLiveStreamId,
			status: muxStatus.status,
			startedAt: bridgeSession?.startedAt,
			duration,
			muxStatus: {
				isLive: muxStatus.isLive,
				connectedAt: muxStatus.connectedAt,
				viewerCount: muxStatus.viewerCount || 0
			},
			cloudflareStatus: {
				isConnected: muxStatus.cloudflareConnected,
				isRecording: muxStatus.cloudflareConnected,
				lastError: muxStatus.cloudflareError
			},
			recording: recordingInfo,
			errors: muxStatus.errors || []
		};

		console.log('✅ [MUX_BRIDGE_STATUS] Status retrieved successfully');
		return json(response);

	} catch (err) {
		console.error('❌ [MUX_BRIDGE_STATUS] Error getting bridge status:', err);

		if (err instanceof Error && 'status' in err) {
			throw err;
		}

		throw error(500, 'Failed to get bridge status');
	}
};

/**
 * Get live stream status from Mux
 */
async function getMuxStreamStatus(bridgeSession: any) {
	try {
		if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
			return {
				status: 'unknown',
				isLive: false,
				cloudflareConnected: false,
				errors: ['Mux credentials not configured']
			};
		}

		// Get live stream status from Mux
		const response = await fetch(`https://api.mux.com/video/v1/live-streams/${bridgeSession.muxLiveStreamId}`, {
			headers: {
				'Authorization': 'Basic ' + btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`)
			},
			signal: AbortSignal.timeout(10000) // 10 second timeout
		});

		if (!response.ok) {
			console.warn('⚠️ [MUX_BRIDGE_STATUS] Mux API error:', response.status);
			return {
				status: 'unknown',
				isLive: false,
				cloudflareConnected: false,
				errors: [`Mux API error: ${response.status}`]
			};
		}

		const muxData = await response.json();
		const liveStream = muxData.data;

		// Get simulcast target status (Cloudflare bridge)
		const cloudflareTarget = liveStream.simulcast_targets?.find((t: any) => 
			t.stream_id === `cloudflare_${bridgeSession.streamId}`
		);

		return {
			status: liveStream.status, // 'idle', 'active', 'disconnected'
			isLive: liveStream.status === 'active',
			connectedAt: liveStream.recent_asset?.created_at,
			viewerCount: liveStream.viewer_count || 0,
			cloudflareConnected: cloudflareTarget?.status === 'connected',
			cloudflareError: cloudflareTarget?.error_message,
			errors: []
		};

	} catch (error) {
		console.error('❌ [MUX_BRIDGE_STATUS] Error getting Mux status:', error);
		return {
			status: 'unknown',
			isLive: false,
			cloudflareConnected: false,
			errors: ['Failed to connect to Mux API']
		};
	}
}

/**
 * Get recording information from Mux
 */
async function getMuxRecordingInfo(bridgeSession: any) {
	try {
		// Check if we have asset information
		if (bridgeSession?.muxAssetId) {
			// Get asset details from Mux
			const response = await fetch(`https://api.mux.com/video/v1/assets/${bridgeSession.muxAssetId}`, {
				headers: {
					'Authorization': 'Basic ' + btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`)
				}
			});

			if (response.ok) {
				const assetData = await response.json();
				const asset = assetData.data;

				return {
					isRecording: asset.status === 'preparing',
					recordingId: asset.id,
					fileSize: 0, // Mux doesn't provide file size in API
					duration: asset.duration || 0,
					status: asset.status, // 'preparing', 'ready', 'errored'
					playbackUrl: asset.playback_ids?.[0]?.id ? 
						`https://stream.mux.com/${asset.playback_ids[0].id}.mp4` : null
				};
			}
		}

		// No recording information available
		return {
			isRecording: false,
			recordingId: null,
			fileSize: 0,
			duration: 0,
			status: 'none'
		};

	} catch (error) {
		console.error('❌ [MUX_BRIDGE_STATUS] Error getting recording info:', error);
		return {
			isRecording: false,
			recordingId: null,
			fileSize: 0,
			duration: 0,
			status: 'error'
		};
	}
}
