// Livestream MVP Two - Stream State Management
import { writable, derived } from 'svelte/store';
import type { MVPTwoStream, StreamRenderInstance } from '../types/streamTypes.js';

// Core stream data
export const streams = writable<MVPTwoStream[]>([]);
export const selectedStream = writable<MVPTwoStream | null>(null);
export const renderInstances = writable<StreamRenderInstance[]>([]);

// UI state
export const loading = writable<boolean>(false);
export const error = writable<string | null>(null);
export const isCreating = writable<boolean>(false);
export const isEditing = writable<boolean>(false);

// Derived stores
export const liveStreams = derived(streams, ($streams) =>
  $streams.filter(stream => stream.status === 'live')
);

export const scheduledStreams = derived(streams, ($streams) =>
  $streams.filter(stream => stream.status === 'scheduled')
);

export const completedStreams = derived(streams, ($streams) =>
  $streams.filter(stream => stream.status === 'completed')
);

export const visibleStreams = derived(streams, ($streams) =>
  $streams.filter(stream => stream.isVisible)
);

export const publicStreams = derived(streams, ($streams) =>
  $streams.filter(stream => stream.isPublic && stream.isVisible)
);

export const featuredStreams = derived(streams, ($streams) =>
  $streams.filter(stream => stream.featured && stream.isVisible)
);

// Sorted streams by display order
export const sortedStreams = derived(streams, ($streams) =>
  [...$streams].sort((a, b) => a.displayOrder - b.displayOrder)
);

// Stream management functions
export const streamActions = {
  setStreams: (newStreams: MVPTwoStream[]) => {
    streams.set(newStreams);
  },

  addStream: (stream: MVPTwoStream) => {
    streams.update(current => [...current, stream]);
  },

  updateStream: (streamId: string, updates: Partial<MVPTwoStream>) => {
    streams.update(current =>
      current.map(stream =>
        stream.id === streamId ? { ...stream, ...updates, updatedAt: new Date() } : stream
      )
    );
  },

  removeStream: (streamId: string) => {
    streams.update(current => current.filter(stream => stream.id !== streamId));
  },

  selectStream: (stream: MVPTwoStream | null) => {
    selectedStream.set(stream);
  },

  reorderStreams: (streamIds: string[]) => {
    streams.update(current => {
      const reordered = [...current];
      streamIds.forEach((id, index) => {
        const stream = reordered.find(s => s.id === id);
        if (stream) {
          stream.displayOrder = index;
        }
      });
      return reordered.sort((a, b) => a.displayOrder - b.displayOrder);
    });
  },

  toggleVisibility: (streamId: string) => {
    streams.update(current =>
      current.map(stream =>
        stream.id === streamId
          ? { ...stream, isVisible: !stream.isVisible, updatedAt: new Date() }
          : stream
      )
    );
  },

  toggleFeatured: (streamId: string) => {
    streams.update(current =>
      current.map(stream =>
        stream.id === streamId
          ? { ...stream, featured: !stream.featured, updatedAt: new Date() }
          : stream
      )
    );
  },

  setLoading: (isLoading: boolean) => {
    loading.set(isLoading);
  },

  setError: (errorMessage: string | null) => {
    error.set(errorMessage);
  },

  clearError: () => {
    error.set(null);
  }
};
