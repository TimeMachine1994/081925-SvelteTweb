// Cloudflare Stream API Client
// Handles Live Input creation and Live Output configuration

import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from '$env/static/private';

const CLOUDFLARE_API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`;

interface CloudflareAPIResponse<T> {
	result: T;
	success: boolean;
	errors: Array<{ code: number; message: string }>;
	messages: Array<string>;
}

// Cloudflare API types
interface CloudflareLiveInput {
	uid: string;
	webRTC: {
		url: string;
	};
	webRTCPlayback?: {
		url: string;
	};
	rtmps: {
		url: string;
		streamKey: string;
	};
	rtmpsPlayback?: {
		url: string;
		streamKey: string;
	};
	srt?: {
		url: string;
		streamId: string;
		passphrase: string;
	};
}

/**
 * Creates a Cloudflare Live Input with automatic recording enabled
 * @param name - Name/title for the live input
 * @returns Live Input details including WHIP URL
 */
export async function createLiveInput(name: string): Promise<{
	liveInputId: string;
	whipUrl: string;
	whepUrl?: string;
	rtmpsUrl: string;
	rtmpsStreamKey: string;
}> {
	console.log('🎬 [Cloudflare] Creating Live Input:', name);
	console.log('🔑 [Cloudflare] Account ID:', CLOUDFLARE_ACCOUNT_ID ? 'SET' : 'MISSING');
	console.log('🔑 [Cloudflare] API Token:', CLOUDFLARE_API_TOKEN ? `SET (${CLOUDFLARE_API_TOKEN.substring(0, 10)}...)` : 'MISSING');

	const response = await fetch(`${CLOUDFLARE_API_BASE}/live_inputs`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			meta: { name },
			recording: {
				mode: 'automatic',
				timeoutSeconds: 60
			}
		})
	});

	if (!response.ok) {
		const error = await response.text();
		console.error('❌ [Cloudflare] Failed to create Live Input:', error);
		throw new Error(`Cloudflare API error: ${response.status} - ${error}`);
	}

	const data: CloudflareAPIResponse<CloudflareLiveInput> = await response.json();

	if (!data.success) {
		throw new Error(`Cloudflare API error: ${data.errors.map((e) => e.message).join(', ')}`);
	}

	console.log('✅ [Cloudflare] Live Input created:', data.result.uid);
	console.log('📺 [Cloudflare] RTMPS URL:', data.result.rtmps.url);
	console.log('🔑 [Cloudflare] RTMPS Stream Key:', data.result.rtmps.streamKey);

	return {
		liveInputId: data.result.uid,
		whipUrl: data.result.webRTC.url,
		whepUrl: data.result.webRTCPlayback?.url,
		rtmpsUrl: data.result.rtmps.url,
		rtmpsStreamKey: data.result.rtmps.streamKey
	};
}

/**
 * Gets the status of a Cloudflare Live Input
 * @param liveInputId - The Live Input ID to check
 * @returns Current status information
 */
export async function getLiveInputStatus(liveInputId: string): Promise<{
	status: string;
	isLive: boolean;
	videoUid?: string;
}> {
	console.log('🔍 [Cloudflare] Checking Live Input status:', liveInputId);

	const response = await fetch(`${CLOUDFLARE_API_BASE}/live_inputs/${liveInputId}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`
		}
	});

	if (!response.ok) {
		const error = await response.text();
		console.error('❌ [Cloudflare] Failed to get Live Input status:', error);
		throw new Error(`Cloudflare API error: ${response.status} - ${error}`);
	}

	const data: CloudflareAPIResponse<any> = await response.json();

	if (!data.success) {
		throw new Error(`Cloudflare API error: ${data.errors.map((e) => e.message).join(', ')}`);
	}

	// Cloudflare returns status in current.state field
	const currentState = data.result.current?.state || data.result.status || 'unknown';
	const isLive = currentState === 'connected' || currentState === 'live';
	const videoUid = data.result.recording?.uid;

	console.log('✅ [Cloudflare] Live Input status:', currentState, 'Is Live:', isLive);
	console.log('📊 [Cloudflare] Full status data:', JSON.stringify(data.result.current || data.result, null, 2));

	return {
		status: currentState,
		isLive,
		videoUid
	};
}

/**
 * Gets playback URL for a completed stream recording
 * @param videoUid - The video UID from completed stream
 * @returns Playback URLs
 */
export async function getStreamPlaybackUrl(videoUid: string): Promise<{
	hlsUrl?: string;
	dashUrl?: string;
	embedUrl?: string;
}> {
	console.log('🎥 [Cloudflare] Getting playback URL for video:', videoUid);

	const response = await fetch(`${CLOUDFLARE_API_BASE}/${videoUid}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`
		}
	});

	if (!response.ok) {
		const error = await response.text();
		console.error('❌ [Cloudflare] Failed to get video:', error);
		throw new Error(`Cloudflare API error: ${response.status} - ${error}`);
	}

	const data: CloudflareAPIResponse<any> = await response.json();

	if (!data.success) {
		throw new Error(`Cloudflare API error: ${data.errors.map((e) => e.message).join(', ')}`);
	}

	return {
		hlsUrl: data.result.playback?.hls,
		dashUrl: data.result.playback?.dash,
		embedUrl: `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${videoUid}/iframe`
	};
}
