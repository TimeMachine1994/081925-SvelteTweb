// Server-side utilities for setting up streaming methods
import { createLiveInput } from './cloudflare-stream';
import { createMUXLiveStream, getMUXRTMPUrl, getMUXPlaybackUrl, isMUXConfigured } from './mux';
import type { OBSMethodConfig, PhoneToOBSMethodConfig, PhoneToMUXMethodConfig } from '$lib/types/streaming-methods';

/**
 * Setup OBS Method
 * Creates a single Cloudflare live input with RTMP and automatic recording
 */
export async function setupOBSMethod(): Promise<OBSMethodConfig> {
	console.log('🎬 [STREAMING_METHODS] Setting up OBS method...');

	try {
		const liveInput = await createLiveInput({
			name: 'OBS Stream',
			recording: { mode: 'automatic' }
		});

		const config: OBSMethodConfig = {
			rtmpUrl: liveInput.rtmps.url,
			streamKey: liveInput.rtmps.streamKey,
			cloudflareInputId: liveInput.uid
		};

		console.log('✅ [STREAMING_METHODS] OBS method configured:', {
			cloudflareInputId: config.cloudflareInputId,
			rtmpUrl: config.rtmpUrl
		});

		return config;
	} catch (error) {
		console.error('❌ [STREAMING_METHODS] Failed to setup OBS method:', error);
		throw new Error('Failed to configure OBS streaming method');
	}
}

/**
 * Setup Phone to OBS Method
 * Creates TWO Cloudflare live inputs:
 * 1. Phone camera source (WHIP, no recording)
 * 2. OBS destination (RTMP, with recording)
 */
export async function setupPhoneToOBSMethod(): Promise<PhoneToOBSMethodConfig> {
	console.log('🎬 [STREAMING_METHODS] Setting up Phone to OBS method...');

	try {
		// Create phone camera input (WHIP)
		console.log('📱 [STREAMING_METHODS] Creating phone camera input...');
		const phoneInput = await createLiveInput({
			name: 'Phone Camera Source',
			recording: { mode: 'off' } // Don't record phone source
		});

		// Create OBS destination input (RTMP)
		console.log('💻 [STREAMING_METHODS] Creating OBS destination input...');
		const obsInput = await createLiveInput({
			name: 'OBS Output',
			recording: { mode: 'automatic' } // Record final OBS output
		});

		// Get Cloudflare account ID for playback URL
		const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
		if (!accountId) {
			throw new Error('CLOUDFLARE_ACCOUNT_ID not configured');
		}

		if (!phoneInput.webRTC) {
			throw new Error('Cloudflare input missing WebRTC configuration');
		}

		if (!phoneInput.webRTC.url) {
			throw new Error('Cloudflare input missing WebRTC URL - WHIP not enabled');
		}

		const config: PhoneToOBSMethodConfig = {
			obsDestination: {
				rtmpUrl: obsInput.rtmps.url,
				streamKey: obsInput.rtmps.streamKey,
				cloudflareInputId: obsInput.uid
			},
			phoneSource: {
				whipUrl: phoneInput.webRTC.url,
				playbackUrl: `https://customer-${accountId}.cloudflarestream.com/${phoneInput.uid}/iframe`,
				cloudflareInputId: phoneInput.uid
			}
		};

		console.log('✅ [STREAMING_METHODS] Phone to OBS method configured:', {
			phoneSourceId: config.phoneSource.cloudflareInputId,
			obsDestinationId: config.obsDestination.cloudflareInputId
		});

		return config;
	} catch (error) {
		console.error('❌ [STREAMING_METHODS] Failed to setup Phone to OBS method:', error);
		// Cleanup: attempt to delete any created inputs
		// TODO: Implement cleanup logic
		throw new Error('Failed to configure Phone to OBS streaming method');
	}
}

/**
 * Setup Phone to MUX Method
 * Creates MUX stream for recording, then Cloudflare live input with restreaming
 * 
 * Architecture:
 * - Phone streams via WHIP to Cloudflare (live playback)
 * - Cloudflare automatically restreams to MUX via RTMP (server-side)
 * - MUX records the stream (REQUIRED - WHIP cannot record)
 * - No extra phone bandwidth used (restreaming is server-to-server)
 * 
 * CRITICAL: MUX is MANDATORY because Cloudflare WHIP inputs cannot record!
 */
export async function setupPhoneToMUXMethod(): Promise<PhoneToMUXMethodConfig> {
	console.log('🎬 [STREAMING_METHODS] Setting up Phone to MUX method...');

	try {
		// 1. Create MUX live stream FIRST (we need the stream key for Cloudflare outputs)
		console.log('🎥 [STREAMING_METHODS] Creating MUX live stream for recording...');
		
		if (!isMUXConfigured()) {
			throw new Error('MUX not configured - Phone to MUX method requires MUX credentials (WHIP cannot record)');
		}

		const muxStream = await createMUXLiveStream({
			name: 'TributeStream Phone Recording',
			reconnectWindow: 60,
			recordingEnabled: true
		});
		
		console.log('✅ [STREAMING_METHODS] MUX stream created:', muxStream.id);

		// 2. Create Cloudflare live input WITH restreaming outputs to MUX
		console.log('☁️ [STREAMING_METHODS] Creating Cloudflare input with MUX restreaming...');
		
		const cloudflareInput = await createLiveInput({
			name: 'Phone to MUX Stream',
			recording: { 
				mode: 'off' // WHIP can't record anyway, MUX handles it
			},
			// ⭐ CRITICAL: Configure restreaming to MUX
			outputs: [
				{
					enabled: true,
					url: 'rtmps://global-live.mux.com:443/app',
					streamKey: muxStream.stream_key
				}
			]
		});

		if (!cloudflareInput.webRTC?.url) {
			throw new Error('Cloudflare input missing WebRTC URL - WHIP not enabled');
		}

		console.log(' [STREAMING_METHODS] Cloudflare input created with restreaming:', cloudflareInput.uid);

		const config: PhoneToMUXMethodConfig = {
			cloudflare: {
				whipUrl: cloudflareInput.webRTC.url,
				inputId: cloudflareInput.uid
			},
			mux: {
				streamId: muxStream.id,
				streamKey: muxStream.stream_key,
				playbackId: muxStream.playback_ids[0]?.id || ''
			},
			restreamingConfigured: true
		};

		console.log('✅ [STREAMING_METHODS] Phone to MUX method fully configured:', {
			cloudflareInputId: config.cloudflare.inputId,
			cloudflareWhipUrl: config.cloudflare.whipUrl,
			muxStreamId: config.mux.streamId,
			restreamingEnabled: true
		});

		return config;
	} catch (error) {
		console.error('❌ [STREAMING_METHODS] Failed to setup Phone to MUX method:', error);
		throw new Error(`Failed to configure Phone to MUX streaming method: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Cleanup streaming method resources
 * Deletes Cloudflare live inputs when stream is deleted or method is changed
 */
export async function cleanupStreamingMethod(
	method: 'obs' | 'phone-to-obs' | 'phone-to-mux',
	cloudflareInputIds: string[]
): Promise<void> {
	console.log('🧹 [STREAMING_METHODS] Cleaning up method resources:', method, cloudflareInputIds);

	// TODO: Implement cleanup logic
	// - Delete Cloudflare live inputs
	// - For phone-to-mux: also cleanup MUX resources

	console.log('⚠️ [STREAMING_METHODS] Cleanup not yet implemented');
}
