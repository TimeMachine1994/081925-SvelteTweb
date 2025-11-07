/**
 * Streaming Methods
 * Supports OBS RTMP streaming and WHIP browser streaming via Cloudflare
 */

import { createLiveInput, createLiveOutput, getHLSPlaybackURL } from './cloudflare-stream';
import { createMuxLiveStream, isMuxConfigured } from './mux';

export interface OBSStreamConfig {
	rtmpUrl: string;
	streamKey: string;
	cloudflareInputId: string;
}

export interface WHIPStreamConfig {
	whipUrl: string;
	cloudflareInputId: string;
	hlsPlaybackUrl?: string;

	// Mux backup (optional)
	muxLiveStreamId?: string;
	muxStreamKey?: string;
	muxPlaybackId?: string;
	cloudflareOutputId?: string;
	simulcastEnabled?: boolean;
}

/**
 * Setup basic OBS RTMP streaming
 * Creates a Cloudflare live input with automatic recording
 */
export async function setupOBSStreaming(streamTitle: string): Promise<OBSStreamConfig> {
	console.log('🎬 [STREAMING] Setting up OBS RTMP streaming:', streamTitle);

	try {
		const liveInput = await createLiveInput({
			name: streamTitle,
			recording: {
				mode: 'automatic',
				timeoutSeconds: 10
			}
		});

		const config: OBSStreamConfig = {
			rtmpUrl: liveInput.rtmps.url,
			streamKey: liveInput.rtmps.streamKey,
			cloudflareInputId: liveInput.uid
		};

		console.log('✅ [STREAMING] OBS streaming configured:', {
			cloudflareInputId: config.cloudflareInputId,
			rtmpUrl: config.rtmpUrl
		});

		return config;
	} catch (error) {
		console.error('❌ [STREAMING] Failed to setup OBS streaming:', error);
		throw new Error('Failed to configure OBS streaming');
	}
}

/**
 * Setup WHIP streaming with dual recording (Cloudflare + Mux)
 */
export async function setupWHIPStreaming(
	streamTitle: string,
	enableMuxBackup: boolean = true
): Promise<WHIPStreamConfig> {
	console.log('🎬 [STREAMING] Setting up WHIP streaming:', streamTitle);

	// Step 1: Create Mux Live Stream (optional backup)
	let muxStream = null;
	if (enableMuxBackup && isMuxConfigured()) {
		muxStream = await createMuxLiveStream(streamTitle);
		if (muxStream) {
			console.log('✅ [STREAMING] Mux backup recording enabled');
		} else {
			console.warn('⚠️ [STREAMING] Mux backup creation failed, continuing without');
		}
	} else {
		console.log('ℹ️ [STREAMING] Mux backup disabled or not configured');
	}

	// Step 2: Create Cloudflare Live Input
	const liveInput = await createLiveInput({
		name: streamTitle,
		recording: {
			mode: 'automatic',
			timeoutSeconds: 10
		}
	});

	// Step 3: Setup simulcast output to Mux (if enabled)
	let outputId = null;
	if (muxStream) {
		const output = await createLiveOutput(
			liveInput.uid,
			muxStream.rtmpsUrl,
			muxStream.streamKey
		);
		if (output) {
			outputId = output.uid;
			console.log('✅ [STREAMING] Simulcast to Mux enabled');
		} else {
			console.warn('⚠️ [STREAMING] Failed to enable simulcast to Mux');
		}
	}

	const config: WHIPStreamConfig = {
		whipUrl: liveInput.webRTC!.url,
		cloudflareInputId: liveInput.uid,
		hlsPlaybackUrl: getHLSPlaybackURL(liveInput),
		...(muxStream && {
			muxLiveStreamId: muxStream.id,
			muxStreamKey: muxStream.streamKey,
			muxPlaybackId: muxStream.playbackId,
			cloudflareOutputId: outputId || undefined,
			simulcastEnabled: !!outputId
		})
	};

	console.log('✅ [STREAMING] WHIP streaming configured:', {
		cloudflareInputId: config.cloudflareInputId,
		muxBackup: !!muxStream,
		simulcast: config.simulcastEnabled
	});

	return config;
}
