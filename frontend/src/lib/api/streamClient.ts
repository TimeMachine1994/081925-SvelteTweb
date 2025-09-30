import type { 
  Stream, 
  CreateStreamRequest, 
  UpdateStreamRequest, 
  StreamCredentials,
  StreamListResponse,
  MemorialStreamsResponse,
  RecordingStatus,
  StreamFilters
} from '$lib/types/stream';

/**
 * Unified Stream API Client
 * Provides a clean interface for all stream operations
 */
export class StreamAPI {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  // Stream Management
  async listStreams(filters?: StreamFilters): Promise<StreamListResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const url = `${this.baseUrl}/streams${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to list streams: ${response.statusText}`);
    }
    
    return response.json();
  }

  async createStream(data: CreateStreamRequest): Promise<Stream> {
    const response = await fetch(`${this.baseUrl}/streams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to create stream: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getStream(id: string): Promise<Stream> {
    const response = await fetch(`${this.baseUrl}/streams/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to get stream: ${response.statusText}`);
    }
    
    return response.json();
  }

  async updateStream(id: string, data: UpdateStreamRequest): Promise<Stream> {
    const response = await fetch(`${this.baseUrl}/streams/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to update stream: ${response.statusText}`);
    }
    
    return response.json();
  }

  async deleteStream(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/streams/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to delete stream: ${response.statusText}`);
    }
  }

  // Stream Lifecycle
  async startStream(id: string): Promise<StreamCredentials & { streamId: string; cloudflareId: string }> {
    const response = await fetch(`${this.baseUrl}/streams/${id}/start`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to start stream: ${response.statusText}`);
    }
    
    const result = await response.json();
    return {
      streamId: result.streamId,
      cloudflareId: result.cloudflareId,
      ...result.credentials
    };
  }

  async stopStream(id: string): Promise<{ success: boolean; recordingReady: boolean; recordingUrl?: string }> {
    const response = await fetch(`${this.baseUrl}/streams/${id}/stop`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to stop stream: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getStreamStatus(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/streams/${id}/status`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to get stream status: ${response.statusText}`);
    }
    
    return response.json();
  }

  // WHIP Protocol
  async negotiateWHIP(id: string, sdpOffer: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/streams/${id}/whip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp'
      },
      body: sdpOffer
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WHIP negotiation failed: ${errorText}`);
    }
    
    return response.text(); // SDP answer
  }

  // Recording Management
  async getRecordings(id: string): Promise<RecordingStatus> {
    const response = await fetch(`${this.baseUrl}/streams/${id}/recordings`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to get recordings: ${response.statusText}`);
    }
    
    return response.json();
  }

  async syncRecordings(id: string): Promise<RecordingStatus> {
    const response = await fetch(`${this.baseUrl}/streams/${id}/recordings`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to sync recordings: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Memorial Integration
  async getMemorialStreams(memorialId: string): Promise<MemorialStreamsResponse> {
    const response = await fetch(`${this.baseUrl}/memorials/${memorialId}/streams`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to get memorial streams: ${response.statusText}`);
    }
    
    return response.json();
  }

  async createMemorialStream(memorialId: string, data: CreateStreamRequest): Promise<Stream> {
    const response = await fetch(`${this.baseUrl}/memorials/${memorialId}/streams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to create memorial stream: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Public Streams
  async getPublicStreams(filters?: { status?: string; limit?: number; offset?: number }): Promise<StreamListResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const url = `${this.baseUrl}/streams/public${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to get public streams: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Migration Utilities (Admin only)
  async assessMigration(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/streams/migrate`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to assess migration: ${response.statusText}`);
    }
    
    return response.json();
  }

  async executeMigration(options: { dryRun?: boolean; migrateFrom?: string[] }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/streams/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to execute migration: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Default export for convenience
export const streamAPI = new StreamAPI();

// Helper functions for common operations
export async function createQuickStream(title: string, memorialId?: string): Promise<Stream> {
  return streamAPI.createStream({
    title,
    memorialId,
    isVisible: true,
    isPublic: true
  });
}

export async function startStreamSession(streamId: string): Promise<StreamCredentials & { streamId: string; cloudflareId: string }> {
  return streamAPI.startStream(streamId);
}

export async function stopStreamSession(streamId: string): Promise<{ success: boolean; recordingReady: boolean; recordingUrl?: string }> {
  return streamAPI.stopStream(streamId);
}

export async function getMemorialLiveStreams(memorialId: string): Promise<Stream[]> {
  const response = await streamAPI.getMemorialStreams(memorialId);
  return response.liveStreams;
}

export async function getMemorialRecordedStreams(memorialId: string): Promise<Stream[]> {
  const response = await streamAPI.getMemorialStreams(memorialId);
  return response.recordedStreams;
}

// Utility for checking if a stream is ready to start
export function canStartStream(stream: Stream): boolean {
  return stream.status === 'ready' || stream.status === 'scheduled';
}

// Utility for checking if a stream can be stopped
export function canStopStream(stream: Stream): boolean {
  return stream.status === 'live';
}

// Utility for checking if a stream has recordings
export function hasRecording(stream: Stream): boolean {
  return stream.recordingReady && !!stream.recordingUrl;
}
