import Mux from '@mux/mux-node';
import { env } from '$env/dynamic/private';

const MUX_TOKEN_ID = env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = env.MUX_TOKEN_SECRET;

let muxClient: Mux | null = null;

function getMuxClient(): Mux | null {
	if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
		console.warn('⚠️ [MUX] Credentials not configured - Mux recording disabled');
		return null;
	}

	if (!muxClient) {
		muxClient = new Mux({
			tokenId: MUX_TOKEN_ID,
			tokenSecret: MUX_TOKEN_SECRET
		});
	}

	return muxClient;
}

export interface MuxLiveStream {
	id: string;
	streamKey: string;
	rtmpsUrl: string;
	playbackId?: string;
}

/**
 * Create a Mux Live Stream with automatic VOD recording
 */
export async function createMuxLiveStream(title: string): Promise<MuxLiveStream | null> {
	const mux = getMuxClient();
	if (!mux) return null;

	try {
		console.log('🎬 [MUX] Creating live stream:', title);

		const liveStream = await mux.video.liveStreams.create({
			playback_policy: ['public'],
			new_asset_settings: {
				playback_policy: ['public'],
				mp4_support: 'standard'
			},
			reconnect_window: 60,
			reduced_latency: false
		});

		console.log('✅ [MUX] Live stream created:', liveStream.id);

		return {
			id: liveStream.id,
			streamKey: liveStream.stream_key!,
			rtmpsUrl: 'rtmps://global-live.mux.com:443/app',
			playbackId: liveStream.playback_ids?.[0]?.id
		};
	} catch (error) {
		console.error('❌ [MUX] Failed to create live stream:', error);
		return null;
	}
}

/**
 * Get Mux asset details (for retrieving recording)
 */
export async function getMuxAsset(assetId: string) {
	const mux = getMuxClient();
	if (!mux) return null;

	try {
		const asset = await mux.video.assets.retrieve(assetId);
		return asset;
	} catch (error) {
		console.error('❌ [MUX] Failed to get asset:', error);
		return null;
	}
}

/**
 * Get Mux live stream details
 */
export async function getMuxLiveStream(streamId: string) {
	const mux = getMuxClient();
	if (!mux) return null;

	try {
		const stream = await mux.video.liveStreams.retrieve(streamId);
		return stream;
	} catch (error) {
		console.error('❌ [MUX] Failed to get live stream:', error);
		return null;
	}
}

/**
 * Check if Mux is configured
 */
export function isMuxConfigured(): boolean {
	return !!(MUX_TOKEN_ID && MUX_TOKEN_SECRET);
}
