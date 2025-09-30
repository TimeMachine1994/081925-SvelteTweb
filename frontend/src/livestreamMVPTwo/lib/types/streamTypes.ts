// Livestream MVP Two - Core Type Definitions
import type { Timestamp } from 'firebase/firestore';

export interface MVPTwoStream {
  id: string;
  title: string;
  description?: string;
  
  // Cloudflare Integration - Cleaned up, no duplicates
  cloudflareId: string;              // Primary Cloudflare Live Input ID
  streamKey: string;                 // RTMP stream key for broadcasting
  streamUrl: string;                 // RTMP URL for broadcasting software
  playbackUrl: string;               // iframe URL for viewing live stream
  recordingPlaybackUrl?: string;     // iframe URL for viewing recording (after stream ends)
  
  // Status & Visibility
  status: 'scheduled' | 'ready' | 'live' | 'completed' | 'cancelled';
  isVisible: boolean;
  isPublic: boolean;
  
  // Scheduling
  scheduledDateTime?: string;        // ISO string for scheduled start time
  actualStartTime?: Date;
  actualEndTime?: Date;
  
  // Ordering & Display
  displayOrder: number;
  featured: boolean;
  
  // Recording Status
  recordingReady: boolean;           // True when Cloudflare recording is available
  duration?: number;                 // Recording duration in seconds
  
  // Metadata
  thumbnailUrl?: string;
  viewerCount?: number;
  maxViewers?: number;
  
  // Ownership & Association
  createdBy: string;
  memorialId: string;                // Required - every stream must be associated with a memorial
  memorialName?: string;             // Cached memorial name for display
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamRenderInstance {
  id: string;
  streamId: string;
  
  // Display Properties
  title: string;
  subtitle?: string;
  customThumbnail?: string;
  displayOrder: number;
  
  // Visibility Controls
  isVisible: boolean;
  showMetadata: boolean;
  showViewerCount: boolean;
  
  // Player Configuration
  autoplay: boolean;
  showControls: boolean;
  startTime?: number;
  
  // Styling
  playerSize: 'small' | 'medium' | 'large' | 'fullwidth';
  theme: 'light' | 'dark' | 'memorial';
  
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamCreateRequest {
  title: string;
  description?: string;
  scheduledStartTime?: Date;
  isPublic?: boolean;
  memorialId?: string;
}

export interface StreamUpdateRequest {
  title?: string;
  description?: string;
  isVisible?: boolean;
  displayOrder?: number;
  featured?: boolean;
  scheduledStartTime?: Date;
}

export interface StreamReorderRequest {
  streamIds: string[];
}

export interface CloudflareStreamResponse {
  success: boolean;
  result: {
    uid: string;
    rtmps: {
      url: string;
      streamKey: string;
    };
    webRTC: {
      url: string;
    };
    sip: {
      url: string;
    };
  };
}

// Event/Channel concept for managing multiple video clips
export interface StreamEvent {
  id: string;
  title: string;
  description?: string;
  
  // Current live stream (if any)
  currentLiveVideoId?: string;
  currentLiveStreamKey?: string;
  currentLiveStatus?: 'scheduled' | 'live' | 'ended';
  
  // Collection of recorded video clips
  recordedVideoIds: string[];
  recordedVideos: RecordedVideo[];
  
  // Event metadata
  isVisible: boolean;
  isPublic: boolean;
  displayOrder: number;
  featured: boolean;
  
  // Ownership & timestamps
  createdBy: string;
  memorialId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecordedVideo {
  id: string; // Cloudflare video ID
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  playbackUrl?: string;
  duration?: number;
  recordedAt: Date;
  streamStartTime?: Date;
  streamEndTime?: Date;
  viewerCount?: number;
  maxViewers?: number;
}

export interface EventCreateRequest {
  title: string;
  description?: string;
  isPublic?: boolean;
  memorialId?: string;
}

export interface EventUpdateRequest {
  title?: string;
  description?: string;
  isVisible?: boolean;
  displayOrder?: number;
  featured?: boolean;
}

export interface StartLiveStreamRequest {
  eventId: string;
  title?: string;
}

export interface StartLiveStreamResponse {
  success: boolean;
  videoId: string;
  streamKey: string;
  rtmpUrl: string;
  whipUrl?: string;
  playbackUrl: string;
}

export type StreamStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export type PlayerSize = 'small' | 'medium' | 'large' | 'fullwidth';
export type PlayerTheme = 'light' | 'dark' | 'memorial';
