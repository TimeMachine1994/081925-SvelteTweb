import type { Timestamp } from 'firebase/firestore';

/**
 * Unified Stream interface for the new consolidated livestream system
 * Replaces multiple fragmented stream data structures
 */
export interface Stream {
  // Identity
  id: string;
  title: string;
  description?: string;
  
  // Memorial Association (optional)
  memorialId?: string;
  memorialName?: string;
  
  // Stream Configuration
  cloudflareId?: string;
  streamKey?: string;
  streamUrl?: string;
  playbackUrl?: string;
  
  // Status & Lifecycle
  status: StreamStatus;
  scheduledStartTime?: Date | Timestamp;
  actualStartTime?: Date | Timestamp;
  endTime?: Date | Timestamp;
  
  // Recording Management (Standardized)
  recordingReady: boolean;
  recordingUrl?: string;        // Primary recording URL (HLS/DASH)
  recordingDuration?: number;   // Duration in seconds
  
  // Multi-Recording Sessions (New - supports multiple recordings per stream)
  recordingSessions?: RecordingSession[];
  
  // DEPRECATED: Legacy field names (for migration only)
  // recordingPlaybackUrl?: string;  // Use recordingUrl instead
  // videoId?: string;               // Use cloudflareId instead
  
  // Visibility & Access
  isVisible: boolean;
  isPublic: boolean;
  
  // Permissions
  createdBy: string;
  allowedUsers?: string[];
  
  // Metadata
  displayOrder?: number;
  viewerCount?: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

/**
 * Recording Session interface for multiple recordings per stream
 */
export interface RecordingSession {
  sessionId: string;
  cloudflareStreamId: string;
  startTime: Date | Timestamp;
  endTime?: Date | Timestamp;
  duration?: number; // in seconds
  status: 'processing' | 'ready' | 'failed';
  recordingReady: boolean;
  recordingUrl?: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

/**
 * Stream status enumeration
 */
export type StreamStatus = 
  | 'scheduled'  // Stream is scheduled for future
  | 'ready'      // Stream is ready to start
  | 'live'       // Stream is currently broadcasting
  | 'completed'  // Stream has ended
  | 'error';     // Stream encountered an error

/**
 * Stream creation request interface
 */
export interface CreateStreamRequest {
  title: string;
  description?: string;
  memorialId?: string;
  memorialName?: string;
  scheduledStartTime?: Date | string;
  isVisible?: boolean;
  isPublic?: boolean;
  allowedUsers?: string[];
  displayOrder?: number;
}

/**
 * Stream update request interface
 */
export interface UpdateStreamRequest {
  title?: string;
  description?: string;
  isVisible?: boolean;
  isPublic?: boolean;
  displayOrder?: number;
  scheduledStartTime?: Date | string;
  allowedUsers?: string[];
}

/**
 * Stream credentials returned when starting a stream
 */
export interface StreamCredentials {
  streamKey?: string;
  streamUrl?: string;
  whipEndpoint?: string;
  playbackUrl: string;
}

/**
 * Stream filters for querying
 */
export interface StreamFilters {
  memorialId?: string;
  status?: StreamStatus;
  isPublic?: boolean;
  createdBy?: string;
  limit?: number;
  offset?: number;
}

/**
 * Stream list response
 */
export interface StreamListResponse {
  streams: Stream[];
  total: number;
  hasMore: boolean;
  pagination: {
    limit: number;
    offset: number;
    nextOffset?: number;
  };
}

/**
 * Memorial streams response (organized by status)
 */
export interface MemorialStreamsResponse {
  memorialId: string;
  liveStreams: Stream[];
  scheduledStreams: Stream[];
  readyStreams: Stream[];
  recordedStreams: Stream[]; // All completed streams (for management)
  publicRecordedStreams: Stream[]; // Only visible streams with recordings (for public)
  totalStreams: number;
  allStreams: Stream[]; // All streams for admin interfaces
}

/**
 * Stream permissions interface
 */
export interface StreamPermissions {
  canView: boolean;
  canEdit: boolean;
  canStart: boolean;
  canStop: boolean;
  canDelete: boolean;
  reason: string;
  accessLevel: 'none' | 'view' | 'edit' | 'admin';
}

/**
 * Stream access request for middleware
 */
export interface StreamAccessRequest {
  streamId?: string;
  stream?: any;
  memorialId?: string;
  user?: any;
  action: StreamAction;
}

/**
 * Stream actions for permission checking
 */
export type StreamAction = 
  | 'view'
  | 'create' 
  | 'edit'
  | 'start'
  | 'stop'
  | 'delete';

/**
 * Recording status for sync operations
 */
export interface RecordingStatus {
  streamId: string;
  recordingReady: boolean;
  recordingUrl?: string;
  recordingDuration?: number;
  lastChecked: Date;
  error?: string;
}

/**
 * Stream analytics interface (for future use)
 */
export interface StreamAnalytics {
  peakViewers: number;
  totalViews: number;
  averageWatchTime: number; // in seconds
  chatMessages?: number;
  startTime?: Date;
  endTime?: Date;
  duration?: number; // in seconds
}

/**
 * Legacy stream data interfaces (for migration)
 */
export interface LegacyLivestreamData {
  uid: string;
  rtmpsUrl: string;
  streamKey: string;
  name: string;
}

export interface LegacyArchiveEntry {
  id: string;
  title: string;
  description?: string;
  cloudflareId: string;
  playbackUrl: string;
  startedAt: Date | Timestamp;
  endedAt?: Date | Timestamp;
  duration?: number;
  isVisible: boolean;
  recordingReady: boolean;
  startedBy: string;
  startedByName?: string;
  viewerCount?: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface MVPTwoStreamData {
  id: string;
  title: string;
  description?: string;
  status: string;
  cloudflareId?: string;
  cloudflareStreamId?: string;
  playbackUrl?: string;
  isVisible: boolean;
  isPublic: boolean;
  recordingReady: boolean;
  memorialId?: string;
  createdBy: string;
  displayOrder?: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

/**
 * Migration utilities
 */
export interface MigrationAssessment {
  legacyStreams: number;
  memorialArchives: number;
  mvpTwoStreams: number;
  livestreamSessions: number;
  conflicts: Array<{
    type: string;
    details: any;
  }>;
}

export interface MigrationResult {
  migrated: number;
  skipped: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

/**
 * Utility type guards
 */
export function isValidStreamStatus(status: string): status is StreamStatus {
  return ['scheduled', 'ready', 'live', 'completed', 'error'].includes(status);
}

export function isValidStreamAction(action: string): action is StreamAction {
  return ['view', 'create', 'edit', 'start', 'stop', 'delete'].includes(action);
}
