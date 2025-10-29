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
			console.log('🎬 [BRIDGE-START] Creating MUX live stream...');

			// Create MUX live stream
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
			const muxStreamKey = muxData.data.stream_key;
			
			console.log('📊 [BRIDGE-START] MUX Live Stream created:', {
				id: muxData.data.id,
				stream_key: muxStreamKey,
				status: muxData.data.status,
				playback_ids: muxData.data.playback_ids?.length || 0
			});

			// Call Cloudflare Worker to start the bridge
			console.log('🌉 [BRIDGE-START] Calling Cloudflare Worker to start bridge...');
			
			// TODO: Replace with your deployed worker URL
			const WORKER_URL = process.env.MUX_BRIDGE_WORKER_URL || 'http://localhost:8787';
			
			const workerResponse = await fetch(`${WORKER_URL}/bridge/start`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					streamId,
					cloudflareHlsUrl: inputUrl,
					muxStreamKey: muxStreamKey
				})
			});

			if (!workerResponse.ok) {
				const errorText = await workerResponse.text();
				console.log(`❌ [BRIDGE-START] Worker error: ${errorText}`);
				throw new Error(`Worker bridge failed: ${workerResponse.statusText}`);
			}

			const workerData = await workerResponse.json();
			console.log('✅ [BRIDGE-START] Cloudflare Worker bridge started:', workerData);

			// Store bridge configuration
			(global as any).bridgeProcesses = (global as any).bridgeProcesses || new Map();
			const bridgeConfig = {
				id: bridgeId,
				streamId,
				inputUrl,
				outputUrl: muxStreamKey,
				status: 'connected',
				startedAt: new Date().toISOString(),
				approach: 'cloudflare_worker',
				muxLiveStreamId: muxData.data.id,
				muxData,
				workerData,
				workerUrl: WORKER_URL,
				stats: {
					bytesTransferred: 0,
					duration: 0,
					inputConnected: true,
					outputConnected: true
				}
			};

			(global as any).bridgeProcesses.set(streamId, bridgeConfig);
			console.log('✅ [BRIDGE-START] Bridge configured successfully with Cloudflare Worker');

		} catch (error) {
			console.error(`❌ [BRIDGE-START] Failed to start bridge: ${(error as Error).message}`);
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
