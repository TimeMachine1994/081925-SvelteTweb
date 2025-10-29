// MUX Video API integration for TributeStream
// Provides live streaming with automatic recording capabilities

interface MUXLiveStream {
	id: string;
	stream_key: string;
	playback_ids: Array<{
		id: string;
		policy: 'public' | 'signed';
	}>;
	status: string;
	reconnect_window: number;
	new_asset_settings?: {
		playback_policy: 'public' | 'signed';
	};
}

interface MUXAsset {
	id: string;
	playback_ids: Array<{
		id: string;
		policy: 'public' | 'signed';
	}>;
	status: string;
	duration?: number;
}

/**
 * Check if MUX is configured
 */
export function isMUXConfigured(): boolean {
	const tokenId = process.env.MUX_TOKEN_ID;
	const tokenSecret = process.env.MUX_TOKEN_SECRET;
	return !!(tokenId && tokenSecret);
}

/**
 * Get MUX API credentials
 */
function getMUXAuth(): string {
	const tokenId = process.env.MUX_TOKEN_ID;
	const tokenSecret = process.env.MUX_TOKEN_SECRET;
	
	if (!tokenId || !tokenSecret) {
		throw new Error('MUX credentials not configured. Set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.');
	}
	
	// Basic Auth: base64(tokenId:tokenSecret)
	return Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64');
}

/**
 * Create a MUX live stream
 * Returns stream key and playback ID for viewing
 */
export async function createMUXLiveStream(options: {
	name?: string;
	reconnectWindow?: number;
	recordingEnabled?: boolean;
}): Promise<MUXLiveStream> {
	const { name = 'TributeStream Live', reconnectWindow = 60, recordingEnabled = true } = options;
	
	console.log('🎥 [MUX] Creating live stream:', name);
	
	const auth = getMUXAuth();
	
	const requestBody: any = {
		playback_policy: ['public'],
		reconnect_window: reconnectWindow
	};
	
	// Enable automatic recording (asset creation)
	if (recordingEnabled) {
		requestBody.new_asset_settings = {
			playback_policy: ['public']
		};
	}
	
	const response = await fetch('https://api.mux.com/video/v1/live-streams', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Basic ${auth}`
		},
		body: JSON.stringify(requestBody)
	});
	
	if (!response.ok) {
		const error = await response.text();
		console.error('❌ [MUX] Failed to create live stream:', response.status, error);
		throw new Error(`MUX API error: ${response.status} - ${error}`);
	}
	
	const data = await response.json();
	const liveStream: MUXLiveStream = data.data;
	
	console.log('✅ [MUX] Live stream created:', {
		id: liveStream.id,
		streamKey: liveStream.stream_key.substring(0, 8) + '...',
		playbackId: liveStream.playback_ids[0]?.id
	});
	
	return liveStream;
}

/**
 * Get MUX live stream details
 */
export async function getMUXLiveStream(streamId: string): Promise<MUXLiveStream> {
	console.log('🔍 [MUX] Getting live stream:', streamId);
	
	const auth = getMUXAuth();
	
	const response = await fetch(`https://api.mux.com/video/v1/live-streams/${streamId}`, {
		headers: {
			'Authorization': `Basic ${auth}`
		}
	});
	
	if (!response.ok) {
		const error = await response.text();
		console.error('❌ [MUX] Failed to get live stream:', response.status, error);
		throw new Error(`MUX API error: ${response.status} - ${error}`);
	}
	
	const data = await response.json();
	return data.data;
}

/**
 * Delete MUX live stream
 */
export async function deleteMUXLiveStream(streamId: string): Promise<void> {
	console.log('🗑️ [MUX] Deleting live stream:', streamId);
	
	const auth = getMUXAuth();
	
	const response = await fetch(`https://api.mux.com/video/v1/live-streams/${streamId}`, {
		method: 'DELETE',
		headers: {
			'Authorization': `Basic ${auth}`
		}
	});
	
	if (!response.ok) {
		const error = await response.text();
		console.error('❌ [MUX] Failed to delete live stream:', response.status, error);
		throw new Error(`MUX API error: ${response.status} - ${error}`);
	}
	
	console.log('✅ [MUX] Live stream deleted');
}

/**
 * Get MUX asset (recording) details
 */
export async function getMUXAsset(assetId: string): Promise<MUXAsset> {
	console.log('🔍 [MUX] Getting asset:', assetId);
	
	const auth = getMUXAuth();
	
	const response = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
		headers: {
			'Authorization': `Basic ${auth}`
		}
	});
	
	if (!response.ok) {
		const error = await response.text();
		console.error('❌ [MUX] Failed to get asset:', response.status, error);
		throw new Error(`MUX API error: ${response.status} - ${error}`);
	}
	
	const data = await response.json();
	return data.data;
}

/**
 * Get MUX playback URL from playback ID
 */
export function getMUXPlaybackUrl(playbackId: string, type: 'hls' | 'thumbnail' = 'hls'): string {
	if (type === 'thumbnail') {
		return `https://image.mux.com/${playbackId}/thumbnail.jpg`;
	}
	return `https://stream.mux.com/${playbackId}.m3u8`;
}

/**
 * Get MUX RTMP ingest URL
 */
export function getMUXRTMPUrl(streamKey: string): string {
	return `rtmps://global-live.mux.com:443/app/${streamKey}`;
}
