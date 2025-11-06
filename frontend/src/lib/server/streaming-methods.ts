/**
 * Simplified Streaming Methods
 * Only supports basic OBS RTMP streaming via Cloudflare
 */

import { createLiveInput } from './cloudflare-stream';

export interface OBSStreamConfig {
	rtmpUrl: string;
	streamKey: string;
	cloudflareInputId: string;
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
