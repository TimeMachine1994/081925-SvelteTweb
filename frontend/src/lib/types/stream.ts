// Stream Types for TributeStream

export type StreamStatus = 'scheduled' | 'ready' | 'live' | 'completed' | 'error';
export type StreamArmType = 'mobile_input' | 'mobile_streaming' | 'stream_key';
export type StreamVisibility = 'public' | 'hidden' | 'archived';

export interface StreamArmStatus {
	isArmed: boolean;
	armType: StreamArmType | null;
	armedAt?: string;
	armedBy?: string; // user uid
}

export interface StreamCredentials {
	// For WHIP (Mobile Input & Mobile Streaming)
	whipUrl?: string;
	whepUrl?: string; // For playback
	
	// For RTMP (Stream Key)
	rtmpUrl?: string;
	streamKey?: string;
	
	// Cloudflare identifiers
	cloudflareInputId?: string;
	cloudflareStreamId?: string;
}

export interface Stream {
	id: string;
	title: string;
	description?: string;
	status: StreamStatus;
	visibility?: StreamVisibility;
	
	// Memorial association
	memorialId: string;
	
	// Scheduling
	scheduledStartTime?: string;
	
	// Arming system
	armStatus?: StreamArmStatus;
	streamCredentials?: StreamCredentials;
	
	// Playback
	playbackUrl?: string;
	embedUrl?: string;
	recordingReady?: boolean;
	
	// Live tracking
	liveStartedAt?: string;
	liveEndedAt?: string;
	
	// Legacy OBS fields (for backward compatibility)
	streamKey?: string;
	rtmpUrl?: string;
	cloudflareInputId?: string;
	cloudflareStreamId?: string;
	
	// Metadata
	isVisible?: boolean;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	
	// Calculator integration
	calculatorServiceType?: string;
	calculatorServiceIndex?: number;
	serviceHash?: string;
	lastSyncedAt?: string;
	syncStatus?: string;
}
