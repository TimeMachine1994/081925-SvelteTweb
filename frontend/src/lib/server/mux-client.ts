// Mux API Client
// Handles live stream creation and asset management

import Mux from '@mux/mux-node';
import { MUX_TOKEN_ID, MUX_TOKEN_SECRET } from '$env/static/private';
import type { MuxLiveStream, MuxAsset } from '$lib/types/stream-v2';

// Initialize Mux client
const mux = new Mux({
	tokenId: MUX_TOKEN_ID,
	tokenSecret: MUX_TOKEN_SECRET
});

const MUX_RTMP_URL = 'rtmps://global-live.mux.com:443/app';

/**
 * Creates a Mux Live Stream with automatic recording enabled
 * @param name - Name/title for the live stream
 * @returns Mux live stream details including stream key and RTMP URL
 */
export async function createMuxLiveStream(name: string): Promise<{
	liveStreamId: string;
	streamKey: string;
	rtmpUrl: string;
	playbackId?: string;
}> {
	console.log('🎥 [Mux] Creating Live Stream:', name);

	try {
		const liveStream = await mux.video.liveStreams.create({
			playback_policy: ['public'],
			new_asset_settings: {
				playback_policy: ['public']
			},
			reconnect_window: 60,
			reduced_latency: true
		});

		console.log('✅ [Mux] Live Stream created:', liveStream.id);

		return {
			liveStreamId: liveStream.id,
			streamKey: liveStream.stream_key,
			rtmpUrl: MUX_RTMP_URL,
			playbackId: liveStream.playback_ids?.[0]?.id
		};
	} catch (error) {
		console.error('❌ [Mux] Failed to create live stream:', error);
		throw new Error(`Mux API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Gets a Mux Live Stream by ID
 * @param liveStreamId - The Mux live stream ID
 * @returns Live stream details
 */
export async function getMuxLiveStream(liveStreamId: string): Promise<MuxLiveStream> {
	console.log('🔍 [Mux] Fetching Live Stream:', liveStreamId);

	try {
		const liveStream = await mux.video.liveStreams.retrieve(liveStreamId);
		console.log('✅ [Mux] Live Stream retrieved:', liveStreamId);
		return liveStream as unknown as MuxLiveStream;
	} catch (error) {
		console.error('❌ [Mux] Failed to fetch live stream:', error);
		throw new Error(`Mux API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Gets a Mux Asset (VOD) by ID
 * @param assetId - The Mux asset ID
 * @returns Asset details
 */
export async function getMuxAsset(assetId: string): Promise<MuxAsset> {
	console.log('🔍 [Mux] Fetching Asset:', assetId);

	try {
		const asset = await mux.video.assets.retrieve(assetId);
		console.log('✅ [Mux] Asset retrieved:', assetId);
		return asset as unknown as MuxAsset;
	} catch (error) {
		console.error('❌ [Mux] Failed to fetch asset:', error);
		throw new Error(`Mux API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Disables a Mux Live Stream (stops accepting new streams)
 * @param liveStreamId - The Mux live stream ID
 */
export async function disableMuxLiveStream(liveStreamId: string): Promise<void> {
	console.log('⏸️ [Mux] Disabling Live Stream:', liveStreamId);

	try {
		await mux.video.liveStreams.disable(liveStreamId);
		console.log('✅ [Mux] Live Stream disabled');
	} catch (error) {
		console.error('❌ [Mux] Failed to disable live stream:', error);
		throw new Error(`Mux API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Deletes a Mux Live Stream
 * @param liveStreamId - The Mux live stream ID
 */
export async function deleteMuxLiveStream(liveStreamId: string): Promise<void> {
	console.log('🗑️ [Mux] Deleting Live Stream:', liveStreamId);

	try {
		await mux.video.liveStreams.del(liveStreamId);
		console.log('✅ [Mux] Live Stream deleted');
	} catch (error) {
		console.error('❌ [Mux] Failed to delete live stream:', error);
		// Don't throw - deletion is often not critical
		console.warn('⚠️ [Mux] Continuing despite deletion failure');
	}
}
