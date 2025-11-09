// Live Stream Types for WHIP + Mux Architecture
// This is a clean, simplified version focused on browser WHIP ingest with Mux VOD

export type LiveStreamStatus = 'ready' | 'live' | 'completed' | 'error';
export type LiveStreamVisibility = 'public' | 'hidden' | 'archived';

export interface LiveStream {
	id: string;
	memorialId: string;
	title: string;
	description?: string;

	// Status & Visibility
	status: LiveStreamStatus;
	visibility: LiveStreamVisibility;

	// Cloudflare Stream (WHIP Ingest)
	cloudflare: {
		liveInputId: string;
		whipUrl: string;
		whepUrl?: string;
		outputId?: string; // Live Output ID for Mux simulcast
	};

	// Mux (Source of Truth for Recording & Playback)
	mux: {
		liveStreamId: string;
		streamKey: string;
		playbackId?: string; // For live playback
		assetId?: string; // For VOD after stream ends
	};

	// Metadata
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	startedAt?: string;
	endedAt?: string;

	// Error tracking
	errorMessage?: string;
}

// API Request/Response Types

export interface CreateLiveSessionRequest {
	memorialId: string;
	title: string;
	description?: string;
}

export interface CreateLiveSessionResponse {
	success: true;
	stream: LiveStream;
	whipUrl: string;
	message?: string;
}

export interface UpdateVisibilityRequest {
	visibility: LiveStreamVisibility;
}

export interface LiveStreamResponse {
	success: boolean;
	stream?: LiveStream;
	streams?: LiveStream[];
	message?: string;
	error?: string;
}

// Cloudflare API Types

export interface CloudflareLiveInput {
	uid: string;
	webRTC: {
		url: string;
	};
	webRTCPlayback?: {
		url: string;
	};
	meta?: {
		name: string;
	};
	recording?: {
		mode: 'automatic' | 'off';
		timeoutSeconds?: number;
	};
}

export interface CloudflareLiveOutput {
	uid: string;
	url: string;
	streamKey: string;
	enabled: boolean;
}

// Mux API Types

export interface MuxLiveStream {
	id: string;
	stream_key: string;
	playback_ids?: Array<{
		id: string;
		policy: 'public' | 'signed';
	}>;
	status?: 'idle' | 'active' | 'disabled';
	reconnect_window?: number;
	new_asset_settings?: {
		playback_policy: Array<'public' | 'signed'>;
	};
}

export interface MuxAsset {
	id: string;
	playback_ids?: Array<{
		id: string;
		policy: 'public' | 'signed';
	}>;
	status: 'preparing' | 'ready' | 'errored';
	duration?: number;
}

// Mux Webhook Event Types

export interface MuxWebhookEvent {
	type: string;
	object: {
		type: string;
		id: string;
	};
	data: {
		id: string;
		stream_key?: string;
		playback_ids?: Array<{ id: string }>;
		status?: string;
		live_stream_id?: string;
	};
	created_at: string;
}
