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

	return {
		liveInputId: data.result.uid,
		whipUrl: data.result.webRTC.url,
		whepUrl: data.result.webRTCPlayback?.url
	};
}

