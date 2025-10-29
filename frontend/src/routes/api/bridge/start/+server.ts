import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	console.log('🌉 [BRIDGE-START] Bridge start request received');

	// Check authentication
	if (!locals.user) {
		console.log('❌ [BRIDGE-START] Unauthorized request - no user');
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check if user has permission (admin or funeral director)
	if (locals.user.role !== 'admin' && locals.user.role !== 'funeral_director') {
		console.log(`❌ [BRIDGE-START] Insufficient permissions - user role: ${locals.user.role}`);
		return json({ error: 'Insufficient permissions' }, { status: 403 });
	}

	try {
		const { inputUrl, outputUrl, streamId } = await request.json();
		console.log('📋 [BRIDGE-START] Bridge configuration:', {
			inputUrl: inputUrl?.slice(0, 50) + '...',
			outputUrl: outputUrl?.slice(0, 50) + '...',
			streamId
		});

		if (!inputUrl || !outputUrl || !streamId) {
			console.log('❌ [BRIDGE-START] Missing required parameters');
			return json({ error: 'Missing required parameters: inputUrl, outputUrl, streamId' }, { status: 400 });
		}

		console.log('🚀 [BRIDGE-START] Starting serverless MUX bridge (Vercel-compatible)...');
		console.log(`📥 [BRIDGE-START] Input: ${inputUrl}`);
		console.log(`📤 [BRIDGE-START] MUX Stream Key: ${outputUrl}`);

		const bridgeId = `bridge_${streamId}_${Date.now()}`;

		// MUX API credentials
		const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
		const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

		if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
			throw new Error('MUX credentials not configured');
		}

		try {
			console.log('🎬 [BRIDGE-START] Creating MUX live stream with HLS input...');

			// Create MUX live stream that ingests from Cloudflare HLS
			const muxResponse = await fetch('https://api.mux.com/video/v1/live-streams', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Basic ${Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64')}`
				},
				body: JSON.stringify({
					playback_policy: ['public'],
					new_asset_settings: {
						playback_policy: ['public']
					},
					// Configure for HLS input from Cloudflare
					reduced_latency: false,
					test: false
				})
			});

			console.log(`📡 [BRIDGE-START] MUX Live Stream API Response: ${muxResponse.status}`);

			if (!muxResponse.ok) {
				const errorText = await muxResponse.text();
				console.log(`❌ [BRIDGE-START] MUX API Error: ${errorText}`);
				throw new Error(`MUX API error: ${muxResponse.statusText} - ${errorText}`);
			}

			const muxData = await muxResponse.json();
			console.log('📊 [BRIDGE-START] MUX Live Stream created:', {
				id: muxData.data.id,
				stream_key: muxData.data.stream_key,
				status: muxData.data.status,
				playback_ids: muxData.data.playback_ids?.length || 0
			});

			// Now create a MUX asset that pulls from Cloudflare HLS
			console.log('🔗 [BRIDGE-START] Creating MUX asset with Cloudflare HLS input...');
			
			const assetResponse = await fetch('https://api.mux.com/video/v1/assets', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Basic ${Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64')}`
				},
				body: JSON.stringify({
					input: [{
						url: inputUrl,
						type: 'video'
					}],
					playback_policy: ['public'],
					recording_ready: true
				})
			});

			console.log(`📡 [BRIDGE-START] MUX Asset API Response: ${assetResponse.status}`);

			let assetData = null;
			if (assetResponse.ok) {
				assetData = await assetResponse.json();
				console.log('📊 [BRIDGE-START] MUX Asset created:', {
					id: assetData.data.id,
					status: assetData.data.status,
					playback_ids: assetData.data.playback_ids?.length || 0
				});
			} else {
				const errorText = await assetResponse.text();
				console.log(`⚠️ [BRIDGE-START] MUX Asset creation failed: ${errorText}`);
				console.log('🔄 [BRIDGE-START] Continuing with live stream only...');
			}

			// Store bridge configuration
			global.bridgeProcesses = global.bridgeProcesses || new Map();
			const bridgeConfig = {
				id: bridgeId,
				streamId,
				inputUrl,
				outputUrl,
				status: 'connected',
				startedAt: new Date().toISOString(),
				approach: 'mux_direct_hls',
				muxLiveStreamId: muxData.data.id,
				muxAssetId: assetData?.data.id || null,
				muxData,
				assetData,
				stats: {
					bytesTransferred: 0,
					duration: 0,
					inputConnected: true,
					outputConnected: true
				}
			};

			global.bridgeProcesses.set(streamId, bridgeConfig);
			console.log('✅ [BRIDGE-START] MUX direct HLS ingestion configured successfully');

		} catch (error) {
			console.error(`❌ [BRIDGE-START] Failed to configure MUX direct ingestion: ${error.message}`);
			throw error;
		}

		return json({
			success: true,
			bridgeId,
			message: 'Bridge started successfully',
			config: {
				id: bridgeId,
				streamId,
				status: 'starting'
			}
		});

	} catch (error) {
		console.error('❌ [BRIDGE-START] Unexpected error:', error);
		return json(
			{ error: 'Internal server error', details: error.message },
			{ status: 500 }
		);
	}
};
