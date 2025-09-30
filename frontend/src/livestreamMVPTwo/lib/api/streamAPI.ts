// Unified Streams API Client (migrated from MVP Two)
import type { MVPTwoStream, StreamCreateRequest, StreamUpdateRequest } from '../types/streamTypes.js';

const API_BASE = '/api/streams';

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export const streamAPI = {
  getStreams: async (memorialId?: string): Promise<MVPTwoStream[]> => {
    const params = memorialId ? `?memorialId=${memorialId}&limit=50` : '?limit=50';
    const response = await apiRequest<{streams: MVPTwoStream[]}>(`${params}`);
    return response.streams || [];
  },
  getStream: (id: string): Promise<MVPTwoStream> => apiRequest(`/${id}`),
  createStream: (data: StreamCreateRequest): Promise<MVPTwoStream> => 
    apiRequest('', { method: 'POST', body: JSON.stringify(data) }),
  updateStream: (id: string, data: StreamUpdateRequest): Promise<MVPTwoStream> =>
    apiRequest(`/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStream: (id: string): Promise<void> => apiRequest(`/${id}`, { method: 'DELETE' }),
  startStream: (id: string) => apiRequest(`/${id}/start`, { method: 'POST' }),
  stopStream: (id: string) => apiRequest(`/${id}/stop`, { method: 'POST' }),
  reorderStreams: (streamIds: string[], memorialId?: string): Promise<void> => 
    apiRequest('/reorder', { method: 'PUT', body: JSON.stringify({ streamIds, memorialId }) }),
  // New unified API methods
  fixPlaybackUrl: (id: string) => apiRequest(`/${id}/fix-playback-url`, { method: 'POST' }),
  configureCors: (id: string) => apiRequest(`/${id}/configure-cors`, { method: 'POST' }),
  syncRecording: (id: string) => apiRequest(`/${id}/sync-recording`, { method: 'POST' }),
};
