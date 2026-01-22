// Encoder Types for TributeStream
// Persistent streaming devices managed by Super Admin, assigned by Funeral Directors

export type EncoderStatus = 'available' | 'assigned' | 'maintenance';
export type EncoderDeviceType = 'phone' | 'hardware' | 'obs';

export interface EncoderCredentials {
	// Cloudflare Live Input credentials (persistent)
	cloudflareInputId: string;
	rtmpUrl: string;
	streamKey: string;
	whipUrl?: string;
	whepUrl?: string;
}

export interface EncoderAssignment {
	memorialId: string;
	memorialName?: string;
	funeralDirectorId: string;
	funeralDirectorName?: string;
	assignedAt: string;
}

export interface Encoder {
	id: string;
	name: string;
	description?: string;

	// Cloudflare credentials (persistent, created once)
	credentials: EncoderCredentials;

	// Status
	status: EncoderStatus;
	currentAssignment?: EncoderAssignment;

	// Device info
	deviceType?: EncoderDeviceType;
	location?: string;

	// Metadata
	createdAt: string;
	createdBy: string;
	updatedAt: string;
}

// Memorial-side encoder configuration
export interface MemorialEncoderConfig {
	assignedEncoderId?: string;
	assignedEncoderName?: string;
	scheduledStartTime?: string;

	// Live stream state (updated by webhook)
	streamStatus?: 'offline' | 'live' | 'completed';
	liveStartedAt?: string;
	liveWatchUrl?: string;
	hlsUrl?: string;
}

// API request/response types
export interface CreateEncoderRequest {
	name: string;
	description?: string;
	deviceType?: EncoderDeviceType;
	location?: string;
}

export interface AssignEncoderRequest {
	encoderId: string;
}

export interface EncoderListResponse {
	encoders: Encoder[];
	total: number;
}
