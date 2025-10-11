import { env } from '$env/dynamic/private';
const CLOUDFLARE_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_STREAM_API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`;

interface CloudflareLiveInput {
	uid: string;
	rtmps: {
		url: string;
		streamKey: string;
	};
	rtmp?: {
		url: string;
		streamKey: string;
	};
	rtmpsPlayback: {
		url: string;
	};
	srt?: {
		url: string;
		streamId: string;
	};
	webRTC?: {
		url: string;
	};
	webRTCPlayback?: {
		url: string;
	};
	created: string;
	modified: string;
	meta?: {
		name?: string;
		[key: string]: any;
	};
	recording?: {
		mode: 'automatic' | 'off';
		timeoutSeconds?: number;
		requireSignedURLs?: boolean;
	};
}

interface CloudflareApiResponse<T> {
	result: T;
	success: boolean;
	errors: Array<{ code: number; message: string }>;
	messages: string[];
}

/**
 * Create a Cloudflare Stream Live Input
 * This generates RTMP credentials for streaming
 */
export async function createLiveInput(options: {
	name: string;
	recording?: boolean;
	recordingTimeout?: number;
}): Promise<CloudflareLiveInput> {
	console.log('🎬 [CLOUDFLARE] Creating live input:', options.name);

	if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
		console.error('❌ [CLOUDFLARE] Missing credentials');
		throw new Error('Cloudflare Stream credentials not configured');
	}

	try {
		const response = await fetch(`${CLOUDFLARE_STREAM_API_BASE}/live_inputs`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				meta: {
					name: options.name
				},
				recording: {
					mode: options.recording !== false ? 'automatic' : 'off',
					timeoutSeconds: options.recordingTimeout || 10,
					requireSignedURLs: false
				}
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ [CLOUDFLARE] API error:', response.status, errorText);
			throw new Error(`Cloudflare API error: ${response.status} ${errorText}`);
		}

		const data: CloudflareApiResponse<CloudflareLiveInput> = await response.json();

		if (!data.success) {
			console.error('❌ [CLOUDFLARE] API returned errors:', data.errors);
			throw new Error(`Cloudflare API error: ${data.errors.map((e) => e.message).join(', ')}`);
		}

		console.log('✅ [CLOUDFLARE] Live input created:', data.result.uid);
		return data.result;
	} catch (error) {
		console.error('❌ [CLOUDFLARE] Failed to create live input:', error);
		throw error;
	}
}

/**
 * Get live input details
 */
export async function getLiveInput(inputId: string): Promise<CloudflareLiveInput> {
	console.log('🚀 [CLOUDFLARE_GET_LIVE] ===== GETTING LIVE INPUT =====');
	console.log('🎬 [CLOUDFLARE_GET_LIVE] Getting live input for ID:', inputId);
	console.log('🎬 [CLOUDFLARE_GET_LIVE] Input ID type:', typeof inputId);
	console.log('🎬 [CLOUDFLARE_GET_LIVE] Input ID length:', inputId?.length);

	console.log('🔍 [CLOUDFLARE_GET_LIVE] Checking credentials...');
	if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
		console.error('❌ [CLOUDFLARE_GET_LIVE] Missing credentials!');
		console.error('❌ [CLOUDFLARE_GET_LIVE] CLOUDFLARE_ACCOUNT_ID:', !!CLOUDFLARE_ACCOUNT_ID);
		console.error('❌ [CLOUDFLARE_GET_LIVE] CLOUDFLARE_API_TOKEN:', !!CLOUDFLARE_API_TOKEN);
		throw new Error('Cloudflare Stream credentials not configured');
	}
	console.log('✅ [CLOUDFLARE_GET_LIVE] Credentials found');

	try {
		const url = `${CLOUDFLARE_STREAM_API_BASE}/live_inputs/${inputId}`;
		console.log('🔍 [CLOUDFLARE_GET_LIVE] Making API request to:', url);
		console.log('🔍 [CLOUDFLARE_GET_LIVE] API base:', CLOUDFLARE_STREAM_API_BASE);

		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`
			}
		});

		console.log('📞 [CLOUDFLARE_GET_LIVE] Response status:', response.status);
		console.log('📞 [CLOUDFLARE_GET_LIVE] Response ok:', response.ok);
		console.log(
			'📞 [CLOUDFLARE_GET_LIVE] Response headers:',
			Object.fromEntries(response.headers.entries())
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ [CLOUDFLARE_GET_LIVE] API error response:', errorText);
			throw new Error(`Cloudflare API error: ${response.status} - ${errorText}`);
		}

		const data: CloudflareApiResponse<CloudflareLiveInput> = await response.json();
		console.log('📋 [CLOUDFLARE_GET_LIVE] Full API response:', JSON.stringify(data, null, 2));
		console.log('📋 [CLOUDFLARE_GET_LIVE] Result data:', JSON.stringify(data.result, null, 2));
		return data.result;
	} catch (error) {
		console.error('❌ [CLOUDFLARE_GET_LIVE] ===== ERROR GETTING LIVE INPUT =====');
		console.error('❌ [CLOUDFLARE_GET_LIVE] Failed to get live input:', error);
		console.error('❌ [CLOUDFLARE_GET_LIVE] Error type:', typeof error);
		console.error(
			'❌ [CLOUDFLARE_GET_LIVE] Error message:',
			error instanceof Error ? error.message : 'Unknown'
		);
		throw error;
	}
}

/**
 * Delete a live input
 */
export async function deleteLiveInput(inputId: string): Promise<void> {
	console.log('🎬 [CLOUDFLARE] Deleting live input:', inputId);

	if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
		throw new Error('Cloudflare Stream credentials not configured');
	}

	try {
		const response = await fetch(`${CLOUDFLARE_STREAM_API_BASE}/live_inputs/${inputId}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`
			}
		});

		if (!response.ok) {
			throw new Error(`Cloudflare API error: ${response.status}`);
		}

		console.log('✅ [CLOUDFLARE] Live input deleted:', inputId);
	} catch (error) {
		console.error('❌ [CLOUDFLARE] Failed to delete live input:', error);
		throw error;
	}
}

/**
 * List all live inputs for the account
 */
export async function listLiveInputs(): Promise<CloudflareLiveInput[]> {
	console.log('🎬 [CLOUDFLARE] Listing live inputs');

	if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
		throw new Error('Cloudflare Stream credentials not configured');
	}

	try {
		const response = await fetch(`${CLOUDFLARE_STREAM_API_BASE}/live_inputs`, {
			headers: {
				Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`
			}
		});

		if (!response.ok) {
			throw new Error(`Cloudflare API error: ${response.status}`);
		}

		const data: CloudflareApiResponse<CloudflareLiveInput[]> = await response.json();
		return data.result;
	} catch (error) {
		console.error('❌ [CLOUDFLARE] Failed to list live inputs:', error);
		throw error;
	}
}

/**
 * Get the WHEP playback URL for a live input (for OBS Browser Source)
 */
export function getWHEPPlaybackURL(input: CloudflareLiveInput): string | undefined {
	return input.webRTCPlayback?.url;
}

/**
 * Get the HLS playback URL for a live input (for OBS Media Source)
 * Cloudflare Live Inputs provide HLS at: https://customer-{customer-code}.cloudflarestream.com/{uid}/manifest/video.m3u8
 */
export function getHLSPlaybackURL(input: CloudflareLiveInput): string | undefined {
	console.log('🔍 [HLS] Live input data:', {
		uid: input.uid,
		rtmps: input.rtmps?.url,
		webRTC: input.webRTC?.url,
		rtmpsPlayback: input.rtmpsPlayback?.url
	});

	// Use the known working customer code from our Cloudflare account
	// This is more reliable than trying to extract it from URLs
	const customerCode = 'dyz4fsbg86xy3krn';

	if (!input.uid) {
		console.log('❌ [HLS] No UID found in live input');
		return undefined;
	}

	// Construct HLS URL: https://customer-{customer-code}.cloudflarestream.com/{uid}/manifest/video.m3u8
	const hlsUrl = `https://customer-${customerCode}.cloudflarestream.com/${input.uid}/manifest/video.m3u8`;
	console.log('🎯 [HLS] Generated HLS URL:', hlsUrl);

	return hlsUrl;
}

/**
 * Get embed code HTML for a live input
 * Returns the full HTML embed code from Cloudflare Stream
 */
export async function getEmbedCode(inputId: string): Promise<string> {
	console.log('🚀 [CLOUDFLARE_EMBED] ===== GETTING EMBED CODE =====');
	console.log('🎬 [CLOUDFLARE_EMBED] Getting embed code for:', inputId);
	console.log('🎬 [CLOUDFLARE_EMBED] Input ID type:', typeof inputId);
	console.log('🎬 [CLOUDFLARE_EMBED] Input ID length:', inputId?.length);

	console.log('🔍 [CLOUDFLARE_EMBED] Checking credentials...');
	if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
		console.error('❌ [CLOUDFLARE_EMBED] Missing credentials!');
		throw new Error('Cloudflare Stream credentials not configured');
	}
	console.log('✅ [CLOUDFLARE_EMBED] Credentials found');

	try {
		const url = `${CLOUDFLARE_STREAM_API_BASE}/${inputId}/embed`;
		console.log('🔍 [CLOUDFLARE_EMBED] Making embed API request to:', url);
		console.log('🔍 [CLOUDFLARE_EMBED] API base:', CLOUDFLARE_STREAM_API_BASE);

		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`
			}
		});

		console.log('📞 [CLOUDFLARE_EMBED] Response status:', response.status);
		console.log('📞 [CLOUDFLARE_EMBED] Response ok:', response.ok);
		console.log(
			'📞 [CLOUDFLARE_EMBED] Response headers:',
			Object.fromEntries(response.headers.entries())
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ [CLOUDFLARE_EMBED] API error response:', errorText);
			throw new Error(`Cloudflare API error: ${response.status} - ${errorText}`);
		}

		const embedHtml = await response.text();
		console.log('✅ [CLOUDFLARE_EMBED] Got embed code!');
		console.log('✅ [CLOUDFLARE_EMBED] Embed HTML full:', embedHtml);
		console.log('✅ [CLOUDFLARE_EMBED] Embed HTML preview:', embedHtml.substring(0, 200) + '...');
		console.log('✅ [CLOUDFLARE_EMBED] Embed HTML length:', embedHtml.length);
		return embedHtml;
	} catch (error) {
		console.error('❌ [CLOUDFLARE_EMBED] ===== ERROR GETTING EMBED CODE =====');
		console.error('❌ [CLOUDFLARE_EMBED] Failed to get embed code:', error);
		console.error('❌ [CLOUDFLARE_EMBED] Error type:', typeof error);
		console.error(
			'❌ [CLOUDFLARE_EMBED] Error message:',
			error instanceof Error ? error.message : 'Unknown'
		);
		throw error;
	}
}

/**
 * Extract the video ID and construct the iframe src URL from Cloudflare embed HTML
 * Parses the embed HTML to get the video ID and constructs the full iframe URL
 */
export function extractEmbedIframeUrl(embedHtml: string): string | undefined {
	console.log('🚀 [EXTRACT_IFRAME] ===== EXTRACTING IFRAME URL =====');
	console.log('🔍 [EXTRACT_IFRAME] Extracting video ID from embed HTML');
	console.log('🔍 [EXTRACT_IFRAME] Embed HTML input:', embedHtml);
	console.log('🔍 [EXTRACT_IFRAME] Embed HTML type:', typeof embedHtml);
	console.log('🔍 [EXTRACT_IFRAME] Embed HTML length:', embedHtml?.length);

	// Look for the stream id attribute in the <stream> tag
	console.log('🔍 [EXTRACT_IFRAME] Looking for stream id pattern...');
	const streamIdMatch = embedHtml.match(/id="([^"]+)"/);
	console.log('🔍 [EXTRACT_IFRAME] Regex match result:', streamIdMatch);

	if (streamIdMatch && streamIdMatch[1]) {
		const videoId = streamIdMatch[1];
		console.log('✅ [EXTRACT_IFRAME] Extracted video ID:', videoId);
		console.log('✅ [EXTRACT_IFRAME] Video ID length:', videoId.length);

		// Use the same customer code as in HLS function
		const customerCode = 'dyz4fsbg86xy3krn';
		console.log('🔍 [EXTRACT_IFRAME] Using customer code:', customerCode);

		// Construct the iframe src URL
		const iframeUrl = `https://customer-${customerCode}.cloudflarestream.com/${videoId}/iframe`;
		console.log('✅ [EXTRACT_IFRAME] Constructed iframe URL:', iframeUrl);
		console.log('✅ [EXTRACT_IFRAME] Iframe URL length:', iframeUrl.length);

		return iframeUrl;
	}

	console.log('❌ [EXTRACT_IFRAME] No video ID found in embed HTML');
	console.log('❌ [EXTRACT_IFRAME] Tried to match pattern: /id="([^"]+)"/');
	return undefined;
}

/**
 * Check if Cloudflare Stream is configured
 */
export function isCloudflareConfigured(): boolean {
	return !!(CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN);
}
