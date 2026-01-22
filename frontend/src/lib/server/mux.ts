/**
 * Mux Service Utilities
 * 
 * Provides wrapper functions for Mux API operations including:
 * - Live stream creation and management
 * - Chat space creation and management
 * - Video analytics retrieval
 * 
 * All functions include comprehensive logging for debugging and monitoring.
 */

import Mux from '@mux/mux-node';
import { env } from '$env/dynamic/private';

// Lazy-initialized Mux client
let muxClient: Mux | null = null;

function getMux(): Mux {
	if (!muxClient) {
		muxClient = new Mux({
			tokenId: env.MUX_TOKEN_ID,
			tokenSecret: env.MUX_TOKEN_SECRET
		});
		console.log('🎬 [MUX SERVICE] Mux client initialized');
	}
	return muxClient;
}

// Proxy for backwards compatibility - exposes all Mux client properties
const mux = {
	get video() { return getMux().video; },
	get chat() { return getMux().chat; },
	get data() { return getMux().data; }
};

/**
 * Create a new Mux Live Stream
 * 
 * @param title - Stream title for metadata
 * @param options - Optional configuration
 * @returns Mux live stream object with RTMP credentials
 */
export async function createMuxLiveStream(
	title: string,
	options: {
		reconnectWindow?: number;
		reducedLatency?: boolean;
	} = {}
) {
	console.log('🎬 [MUX SERVICE] Creating new live stream:', title);
	console.log('🎬 [MUX SERVICE] Options:', JSON.stringify(options, null, 2));

	try {
		// Create live stream with automatic recording enabled
		const liveStream = await mux.video.liveStreams.create({
			// Public playback policy - no authentication required
			playback_policy: ['public'],
			
			// Automatic asset creation settings for recording
			new_asset_settings: {
				playback_policy: ['public'],
				mp4_support: 'standard' // Enable MP4 downloads
			},
			
			// Reconnection window (seconds before stream times out)
			reconnect_window: options.reconnectWindow || 60,
			
			// Low latency mode for real-time streaming
			reduced_latency: options.reducedLatency !== false
		});

		console.log('✅ [MUX SERVICE] Live stream created successfully');
		console.log('🎬 [MUX SERVICE] Stream ID:', liveStream.id);
		console.log('🎬 [MUX SERVICE] Playback ID:', liveStream.playback_ids?.[0]?.id);
		console.log('🎬 [MUX SERVICE] Stream Key:', liveStream.stream_key?.substring(0, 20) + '...');

		// Extract RTMP URL and stream key from the full stream key
		const fullStreamKey = liveStream.stream_key || '';
		const rtmpUrl = 'rtmps://global-live.mux.com:443/app';
		const streamKey = fullStreamKey;

		console.log('🎬 [MUX SERVICE] RTMP URL:', rtmpUrl);

		return {
			id: liveStream.id,
			playbackId: liveStream.playback_ids?.[0]?.id || '',
			rtmpUrl,
			streamKey,
			reconnectWindow: liveStream.reconnect_window,
			status: liveStream.status,
			streamKey: liveStream.stream_key || ''
		};
	} catch (error) {
		console.error('❌ [MUX SERVICE] Failed to create live stream:', error);
		throw error;
	}
}

/**
 * Create a new Mux Chat Space
 * 
 * @param name - Chat space name
 * @param description - Optional description
 * @returns Mux chat space object
 */
export async function createMuxChatSpace(name: string, description?: string) {
	console.log('💬 [MUX SERVICE] Creating new chat space:', name);
	console.log('💬 [MUX SERVICE] Description:', description);

	try {
		const chatSpace = await mux.chat.spaces.create({
			name,
			description: description || `Chat for ${name}`
		});

		console.log('✅ [MUX SERVICE] Chat space created successfully');
		console.log('💬 [MUX SERVICE] Space ID:', chatSpace.id);

		return {
			id: chatSpace.id,
			name: chatSpace.name,
			description: chatSpace.description
		};
	} catch (error) {
		console.error('❌ [MUX SERVICE] Failed to create chat space:', error);
		throw error;
	}
}

/**
 * Get live stream details from Mux
 * 
 * @param liveStreamId - Mux live stream ID
 * @returns Live stream details
 */
export async function getMuxLiveStream(liveStreamId: string) {
	console.log('🎬 [MUX SERVICE] Fetching live stream details:', liveStreamId);

	try {
		const liveStream = await mux.video.liveStreams.retrieve(liveStreamId);

		console.log('✅ [MUX SERVICE] Live stream retrieved');
		console.log('🎬 [MUX SERVICE] Status:', liveStream.status);
		console.log('🎬 [MUX SERVICE] Stream key exists:', !!liveStream.stream_key);

		return liveStream;
	} catch (error) {
		console.error('❌ [MUX SERVICE] Failed to get live stream:', error);
		throw error;
	}
}

/**
 * Delete a Mux live stream
 * 
 * @param liveStreamId - Mux live stream ID
 */
export async function deleteMuxLiveStream(liveStreamId: string) {
	console.log('🎬 [MUX SERVICE] Deleting live stream:', liveStreamId);

	try {
		await mux.video.liveStreams.delete(liveStreamId);
		console.log('✅ [MUX SERVICE] Live stream deleted successfully');
	} catch (error) {
		console.error('❌ [MUX SERVICE] Failed to delete live stream:', error);
		throw error;
	}
}

/**
 * Send a message to a Mux chat space
 * 
 * @param spaceId - Mux chat space ID
 * @param message - Message content
 * @param senderId - Sender user ID
 * @param senderName - Sender display name
 * @returns Created message object
 */
export async function sendMuxChatMessage(
	spaceId: string,
	message: string,
	senderId: string,
	senderName: string
) {
	console.log('💬 [MUX SERVICE] Sending chat message to space:', spaceId);
	console.log('💬 [MUX SERVICE] Sender:', senderName, '(' + senderId + ')');
	console.log('💬 [MUX SERVICE] Message:', message.substring(0, 50) + (message.length > 50 ? '...' : ''));

	try {
		const chatMessage = await mux.chat.spaces.sendMessage(spaceId, {
			message,
			sender_id: senderId,
			sender_name: senderName
		});

		console.log('✅ [MUX SERVICE] Message sent successfully');
		console.log('💬 [MUX SERVICE] Message ID:', chatMessage.id);

		return chatMessage;
	} catch (error) {
		console.error('❌ [MUX SERVICE] Failed to send chat message:', error);
		throw error;
	}
}

/**
 * Delete a message from a Mux chat space
 * 
 * @param messageId - Mux message ID
 */
export async function deleteMuxChatMessage(messageId: string) {
	console.log('💬 [MUX SERVICE] Deleting chat message:', messageId);

	try {
		await mux.chat.messages.delete(messageId);
		console.log('✅ [MUX SERVICE] Message deleted successfully');
	} catch (error) {
		console.error('❌ [MUX SERVICE] Failed to delete message:', error);
		throw error;
	}
}

/**
 * Get analytics metrics for a stream
 * 
 * @param assetId - Mux asset ID or live stream ID
 * @returns Analytics metrics
 */
export async function getMuxAnalytics(assetId: string) {
	console.log('📊 [MUX SERVICE] Fetching analytics for:', assetId);

	try {
		// Get concurrent viewers metric
		const viewerMetrics = await mux.data.metrics.get('concurrent-viewers', {
			filters: [`asset_id:${assetId}`]
		});

		console.log('✅ [MUX SERVICE] Analytics retrieved');
		console.log('📊 [MUX SERVICE] Data points:', viewerMetrics.data?.length || 0);

		// Get breakdown metrics for quality
		const qualityMetrics = await mux.data.metrics.breakdown('viewer-os', {
			filters: [`asset_id:${assetId}`],
			timeframe: ['now']
		});

		console.log('📊 [MUX SERVICE] Quality metrics retrieved');

		return {
			viewerCount: viewerMetrics.data?.[0]?.value || 0,
			qualityData: qualityMetrics.data || []
		};
	} catch (error) {
		console.error('❌ [MUX SERVICE] Failed to get analytics:', error);
		// Return default values instead of throwing
		return {
			viewerCount: 0,
			qualityData: []
		};
	}
}

/**
 * Verify Mux webhook signature
 * 
 * @param body - Raw request body
 * @param signature - Mux-Signature header value
 * @param secret - Webhook secret
 * @returns True if signature is valid
 */
export function verifyMuxWebhookSignature(
	body: string,
	signature: string | null,
	secret: string
): boolean {
	console.log('🔐 [MUX SERVICE] Verifying webhook signature');
	console.log('🔐 [MUX SERVICE] Signature present:', !!signature);
	console.log('🔐 [MUX SERVICE] Body length:', body.length);

	if (!signature) {
		console.warn('⚠️ [MUX SERVICE] No signature provided');
		return false;
	}

	try {
		const isValid = Mux.webhooks.verifyHeader(body, signature, secret);
		
		if (isValid) {
			console.log('✅ [MUX SERVICE] Webhook signature valid');
		} else {
			console.warn('⚠️ [MUX SERVICE] Webhook signature invalid');
		}

		return isValid;
	} catch (error) {
		console.error('❌ [MUX SERVICE] Error verifying webhook signature:', error);
		return false;
	}
}

export default mux;
