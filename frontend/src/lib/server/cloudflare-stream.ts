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
				'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
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
			throw new Error(`Cloudflare API error: ${data.errors.map(e => e.message).join(', ')}`);
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
	console.log('🎬 [CLOUDFLARE] Getting live input:', inputId);

	if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
		throw new Error('Cloudflare Stream credentials not configured');
	}

	try {
		const response = await fetch(`${CLOUDFLARE_STREAM_API_BASE}/live_inputs/${inputId}`, {
			headers: {
				'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
			}
		});

		if (!response.ok) {
			throw new Error(`Cloudflare API error: ${response.status}`);
		}

		const data: CloudflareApiResponse<CloudflareLiveInput> = await response.json();
		return data.result;

	} catch (error) {
		console.error('❌ [CLOUDFLARE] Failed to get live input:', error);
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
				'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
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
				'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
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
 * Check if Cloudflare Stream is configured
 */
export function isCloudflareConfigured(): boolean {
	return !!(CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN);
}
