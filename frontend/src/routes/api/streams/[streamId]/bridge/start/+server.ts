import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const MUX_TOKEN_ID = env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = env.MUX_TOKEN_SECRET;

/**
 * Mux Bridge Start Endpoint
 * 
 * URL: /api/streams/[streamId]/bridge/start
 * Purpose: Start Mux bridge for WebRTC → RTMP conversion with guaranteed recording
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { streamId } = params;

	console.log('🌉 [BRIDGE_START] Starting bridge for stream:', streamId);

	try {
		// Parse request body
		const body = await request.json();
		const { priority = 'standard', recordingSettings } = body;

		console.log('📋 [BRIDGE_START] Request details:', {
			streamId,
			priority,
			recordingSettings,
			userId: locals.user?.uid
		});

		// Validate user authentication
		if (!locals.user) {
			console.error('❌ [BRIDGE_START] Unauthorized request');
			throw error(401, 'Authentication required');
		}

		// Get stream from database
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();
		if (!streamDoc.exists) {
			console.error('❌ [BRIDGE_START] Stream not found:', streamId);
			throw error(404, 'Stream not found');
		}

		const stream = streamDoc.data();
		console.log('📋 [BRIDGE_START] Stream data:', {
			id: streamId,
			title: stream?.title,
			status: stream?.status,
			cloudflareInputId: stream?.cloudflareInputId,
			memorialId: stream?.memorialId
		});

		// Validate stream has WHIP capability
		if (!stream?.cloudflareInputId) {
			console.error('❌ [BRIDGE_START] Stream not configured for WHIP');
			throw error(400, 'Stream not configured for live input');
		}

		// Check user permissions
		const hasPermission = await checkBridgePermissions(locals.user.uid, stream);
		if (!hasPermission) {
			console.error('❌ [BRIDGE_START] Insufficient permissions');
			throw error(403, 'Insufficient permissions to start bridge');
		}

		// Check if Mux bridge already exists for this stream
		const existingBridge = await adminDb
			.collection('mux_bridges')
			.doc(streamId)
			.get();

		if (existingBridge.exists) {
			const bridgeData = existingBridge.data();
			if (['ready', 'active'].includes(bridgeData?.status)) {
				console.log('⚠️ [MUX_BRIDGE] Bridge already exists:', bridgeData?.muxLiveStreamId);
				return json({
					success: true,
					bridgeId: bridgeData?.muxLiveStreamId,
					streamKey: bridgeData?.muxStreamKey,
					rtmpUrl: 'rtmps://global-live.mux.com:443/live',
					webrtcUrl: `https://global-live.mux.com/webrtc/${bridgeData?.muxStreamKey}`,
					status: bridgeData?.status,
					message: 'Mux bridge already active for this stream'
				});
			}
		}

		// Validate Mux credentials
		console.log('🔧 [MUX_BRIDGE] Checking credentials...');
		if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
			console.error('❌ [MUX_BRIDGE] Missing Mux credentials:', {
				MUX_TOKEN_ID: MUX_TOKEN_ID ? 'SET' : 'MISSING',
				MUX_TOKEN_SECRET: MUX_TOKEN_SECRET ? 'SET' : 'MISSING'
			});
			console.error('❌ [MUX_BRIDGE] Please add MUX_TOKEN_ID and MUX_TOKEN_SECRET to your .env file');
			console.error('❌ [MUX_BRIDGE] Get credentials from: https://dashboard.mux.com/settings/access-tokens');
			throw error(500, 'Mux integration not configured - missing API credentials');
		}
		console.log('✅ [MUX_BRIDGE] Mux credentials found');

		// Get RTMP credentials for Cloudflare recording
		console.log('🔧 [MUX_BRIDGE] Getting RTMP credentials...');
		const rtmpCredentials = await getStreamRtmpCredentials(streamId);
		console.log('📋 [MUX_BRIDGE] RTMP credentials:', {
			url: rtmpCredentials.url ? 'SET' : 'MISSING',
			streamKey: rtmpCredentials.streamKey ? 'SET' : 'MISSING'
		});
		if (!rtmpCredentials.url || !rtmpCredentials.streamKey) {
			console.error('❌ [MUX_BRIDGE] Missing Cloudflare RTMP credentials');
			throw error(400, 'Stream not configured for RTMP recording');
		}

		// Create Mux live stream with simulcast to Cloudflare
		console.log('🎬 [MUX_BRIDGE] Creating Mux live stream with Cloudflare bridge...');
		const muxResponse = await fetch('https://api.mux.com/video/v1/live-streams', {
			method: 'POST',
			headers: {
				'Authorization': 'Basic ' + btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`),
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				playback_policy: ['signed'], // Private stream
				new_asset_settings: {
					playback_policy: ['signed']
				},
				// Bridge to Cloudflare RTMP for recording
				simulcast_targets: [{
					url: rtmpCredentials.url,
					stream_key: rtmpCredentials.streamKey,
					stream_id: `cloudflare_${streamId}`
				}],
				// Recording settings
				recording_settings: {
					mode: 'automatic'
				},
				// Connection settings
				reconnect_window: 60,
				reduced_latency: true
			})
		});

		if (!muxResponse.ok) {
			const errorText = await muxResponse.text();
			console.error('❌ [MUX_BRIDGE] Mux API error:', muxResponse.status, errorText);
			throw error(500, `Mux API error: ${muxResponse.status}`);
		}

		const muxData = await muxResponse.json();
		console.log('✅ [MUX_BRIDGE] Mux live stream created:', muxData.data.id);

		// Create bridge session in database
		const bridgeSession = {
			streamId,
			muxLiveStreamId: muxData.data.id,
			muxStreamKey: muxData.data.stream_key,
			muxPlaybackId: muxData.data.playback_ids[0]?.id,
			cloudflareRtmpUrl: rtmpCredentials.url,
			cloudflareStreamKey: rtmpCredentials.streamKey,
			status: 'ready',
			recordingSettings: {
				quality: recordingSettings?.quality || '720p',
				bitrate: recordingSettings?.bitrate || 2000,
				backup: recordingSettings?.backup || true
			},
			createdAt: new Date().toISOString(),
			createdBy: locals.user.uid
		};

		// Save to database
		await adminDb.collection('mux_bridges').doc(streamId).set(bridgeSession);

		console.log('✅ [MUX_BRIDGE] Bridge created successfully:', muxData.data.id);

		return json({
			success: true,
			bridgeId: muxData.data.id,
			// Phone uses these Mux credentials instead of Cloudflare WHIP
			streamKey: muxData.data.stream_key,
			rtmpUrl: 'rtmps://global-live.mux.com:443/live',
			webrtcUrl: `https://global-live.mux.com/webrtc/${muxData.data.stream_key}`,
			playbackUrl: muxData.data.playback_ids[0]?.id ? 
				`https://stream.mux.com/${muxData.data.playback_ids[0].id}.m3u8` : null,
			status: 'ready',
			message: 'Mux bridge ready - stream to provided endpoints for automatic Cloudflare recording'
		});

	} catch (err) {
		console.error('❌ [BRIDGE_START] Error:', err);
		console.error('❌ [BRIDGE_START] Error details:', {
			message: err instanceof Error ? err.message : 'Unknown error',
			stack: err instanceof Error ? err.stack : undefined,
			streamId,
			timestamp: new Date().toISOString()
		});
		throw error(500, `Failed to start bridge: ${err instanceof Error ? err.message : 'Unknown error'}`);
	}
};

/**
 * Check if user has permission to start bridge for stream
 */
async function checkBridgePermissions(userId: string, stream: any): Promise<boolean> {
	try {
		// Get user data
		const userDoc = await adminDb.collection('users').doc(userId).get();
		const user = userDoc.data();

		// Admins can always start bridges
		if (user?.role === 'admin') {
			return true;
		}

		// Funeral directors can start bridges
		if (user?.role === 'funeral_director') {
			return true;
		}

		// Memorial owners can start bridges for their memorials
		if (stream?.memorialId) {
			const memorialDoc = await adminDb.collection('memorials').doc(stream.memorialId).get();
			const memorial = memorialDoc.data();
			
			if (memorial?.createdBy === userId) {
				return true;
			}
		}

		return false;
	} catch (error) {
		console.error('❌ [MUX_BRIDGE] Error checking permissions:', error);
		return false;
	}
}

/**
 * Get RTMP credentials for stream (Cloudflare)
 */
async function getStreamRtmpCredentials(streamId: string) {
	const streamDoc = await adminDb.collection('streams').doc(streamId).get();
	const stream = streamDoc.data();

	return {
		url: stream?.rtmpUrl || '',
		streamKey: stream?.streamKey || ''
	};
}
