// Stream Types for TributeStream Livestream System

export interface Stream {
	id: string;
	title: string;
	description?: string;
	memorialId: string;
	status: StreamStatus;
	isVisible: boolean;
	
	// Cloudflare Stream Integration
	cloudflareStreamId?: string;
	cloudflareInputId?: string;
	playbackUrl?: string;
	thumbnailUrl?: string;
	
	// Scheduling
	scheduledStartTime?: string;
	scheduledEndTime?: string;
	
	// Recording
	recordingUrl?: string;
	recordingReady?: boolean;
	recordingDuration?: number;
	
	// Analytics
	viewerCount?: number;
	peakViewerCount?: number;
	totalViews?: number;
	
	// Metadata
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	startedAt?: string;
	endedAt?: string;
}

export type StreamStatus = 
	| 'scheduled'  // Stream is scheduled but not started
	| 'ready'      // Stream is ready to start
	| 'live'       // Stream is currently live
	| 'completed'  // Stream has ended
	| 'error';     // Stream encountered an error

export interface StreamCreateRequest {
	title: string;
	description?: string;
	scheduledStartTime?: string;
}

export interface StreamUpdateRequest {
	title?: string;
	description?: string;
	isVisible?: boolean;
	scheduledStartTime?: string;
	scheduledEndTime?: string;
}

export interface StreamResponse {
	success: boolean;
	stream?: Stream;
	streams?: Stream[];
	message?: string;
	error?: string;
}

// Memorial Stream Integration
export interface MemorialStreamData {
	memorial: {
		id: string;
		lovedOneName: string;
		fullSlug: string;
		ownerUid?: string;
		funeralDirectorUid?: string;
	};
	streams: Stream[];
}

// Stream Analytics
export interface StreamAnalytics {
	streamId: string;
	viewerCount: number;
	peakViewerCount: number;
	totalViews: number;
	averageWatchTime: number;
	viewerLocations: Array<{
		country: string;
		count: number;
	}>;
	watchTimeByHour: Array<{
		hour: number;
		viewers: number;
	}>;
}

// Cloudflare Stream API Types
export interface CloudflareStreamInput {
	uid: string;
	rtmps: {
		url: string;
		streamKey: string;
	};
	rtmpsPlayback: {
		url: string;
	};
	srt: {
		url: string;
		streamId: string;
	};
	webRTC: {
		url: string;
	};
	status: {
		current: 'connected' | 'disconnected';
	};
	recording: {
		mode: 'automatic' | 'off';
		timeoutSeconds: number;
		requireSignedURLs: boolean;
	};
}

export interface CloudflareStreamVideo {
	uid: string;
	thumbnail: string;
	thumbnailTimestampPct: number;
	readyToStream: boolean;
	status: {
		state: 'ready' | 'inprogress' | 'error';
		pctComplete: string;
		errorReasonCode: string;
		errorReasonText: string;
	};
	meta: {
		name: string;
		[key: string]: any;
	};
	created: string;
	modified: string;
	size: number;
	preview: string;
	allowedOrigins: string[];
	requireSignedURLs: boolean;
	uploaded: string;
	uploadExpiry: string | null;
	maxSizeBytes: number;
	maxDurationSeconds: number;
	duration: number;
	input: {
		width: number;
		height: number;
	};
	playback: {
		hls: string;
		dash: string;
	};
	watermark?: {
		uid: string;
	};
}
