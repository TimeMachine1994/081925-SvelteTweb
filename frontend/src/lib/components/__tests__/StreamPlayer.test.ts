import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StreamPlayer from '../StreamPlayer.svelte';
import { setupTestEnvironment } from '../../../../test-utils/test-helpers';
import { createTestStream } from '../../../../test-utils/factories';

// Mock CountdownVideoPlayer component
vi.mock('../CountdownVideoPlayer.svelte', () => ({
  default: vi.fn(() => ({ 
    $$: { fragment: null, on_mount: [], on_destroy: [], before_update: [], after_update: [] }
  }))
}));

describe('StreamPlayer Component', () => {
  let mockSetInterval: ReturnType<typeof vi.fn>;
  let mockClearInterval: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupTestEnvironment();
    
    // Mock timers
    mockSetInterval = vi.fn((callback, delay) => {
      // Immediately call callback once for testing
      callback();
      return 123; // Mock timer ID
    });
    mockClearInterval = vi.fn();
    
    vi.stubGlobal('setInterval', mockSetInterval);
    vi.stubGlobal('clearInterval', mockClearInterval);
    
    // Mock console methods to reduce noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Stream Filtering and Validation', () => {
    it('filters out invalid streams', () => {
      const invalidStreams = [
        null,
        undefined,
        { id: null, title: 'Invalid' },
        { id: 'undefined', title: 'Invalid' },
        { id: '', title: 'Empty ID' },
        { title: 'No ID' }
      ];

      render(StreamPlayer, {
        props: {
          streams: invalidStreams as any,
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      // Should show no streams message
      expect(screen.getByText('Memorial Service Video')).toBeInTheDocument();
      expect(screen.getByText('Live streaming and recorded services will appear here when scheduled by the funeral director or family.')).toBeInTheDocument();
    });

    it('handles empty or undefined streams array', () => {
      render(StreamPlayer, {
        props: {
          streams: undefined,
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      expect(screen.getByText('Memorial Service Video')).toBeInTheDocument();
    });

    it('validates stream IDs correctly', () => {
      const validStream = createTestStream({ 
        id: 'valid-stream-id',
        status: 'live',
        title: 'Valid Stream'
      });

      render(StreamPlayer, {
        props: {
          streams: [validStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      expect(screen.getByText('🔴 Live Memorial Services')).toBeInTheDocument();
      expect(screen.getByText('Valid Stream')).toBeInTheDocument();
    });
  });

  describe('Live Stream Display', () => {
    it('displays live streams correctly', () => {
      const liveStream = createTestStream({
        status: 'live',
        title: 'Live Memorial Service',
        description: 'A beautiful celebration of life',
        cloudflareStreamId: 'live-stream-123',
        viewerCount: 42
      });

      render(StreamPlayer, {
        props: {
          streams: [liveStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      expect(screen.getByText('🔴 Live Memorial Services')).toBeInTheDocument();
      expect(screen.getByText('Live Memorial Service')).toBeInTheDocument();
      expect(screen.getByText('A beautiful celebration of life')).toBeInTheDocument();
      expect(screen.getByText('LIVE')).toBeInTheDocument();
      expect(screen.getByText('42 viewers')).toBeInTheDocument();
    });

    it('displays live stream with iframe player', () => {
      const liveStream = createTestStream({
        status: 'live',
        title: 'Live Service',
        cloudflareStreamId: 'stream-123'
      });

      render(StreamPlayer, {
        props: {
          streams: [liveStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      const iframe = screen.getByTitle('Live Stream: Live Service');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/stream-123/iframe');
    });

    it('shows placeholder when no stream URL available', () => {
      const liveStream = createTestStream({
        status: 'live',
        title: 'Live Service',
        cloudflareStreamId: null,
        cloudflareInputId: null,
        playbackUrl: null
      });

      render(StreamPlayer, {
        props: {
          streams: [liveStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      expect(screen.getByText('Stream starting soon...')).toBeInTheDocument();
      expect(screen.getByText('Debug: No playback URL found')).toBeInTheDocument();
    });
  });

  describe('Scheduled Stream Display', () => {
    it('displays scheduled streams with countdown', () => {
      const futureTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
      const scheduledStream = createTestStream({
        status: 'scheduled',
        title: 'Upcoming Memorial Service',
        scheduledStartTime: futureTime
      });

      render(StreamPlayer, {
        props: {
          streams: [scheduledStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      // CountdownVideoPlayer should be rendered (mocked)
      expect(mockSetInterval).toHaveBeenCalled();
    });

    it('filters out past scheduled streams', () => {
      const pastTime = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      const pastScheduledStream = createTestStream({
        status: 'scheduled',
        title: 'Past Scheduled Service',
        scheduledStartTime: pastTime
      });

      render(StreamPlayer, {
        props: {
          streams: [pastScheduledStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      expect(screen.getByText('Memorial Service Video')).toBeInTheDocument();
    });
  });

  describe('Recorded Stream Display', () => {
    it('displays recorded streams correctly', () => {
      const recordedStream = createTestStream({
        status: 'completed',
        title: 'Memorial Service Recording',
        description: 'A recorded celebration of life',
        cloudflareStreamId: 'recorded-123',
        recordingReady: true,
        endedAt: new Date().toISOString()
      });

      render(StreamPlayer, {
        props: {
          streams: [recordedStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      expect(screen.getByText('🎥 Recorded Memorial Services')).toBeInTheDocument();
      expect(screen.getByText('Memorial Service Recording')).toBeInTheDocument();
      expect(screen.getByText('A recorded celebration of life')).toBeInTheDocument();
      expect(screen.getByText('RECORDED')).toBeInTheDocument();
    });

    it('displays recorded stream with iframe player', () => {
      const recordedStream = createTestStream({
        status: 'completed',
        title: 'Recorded Service',
        cloudflareStreamId: 'recorded-123',
        recordingReady: true
      });

      render(StreamPlayer, {
        props: {
          streams: [recordedStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      const iframe = screen.getByTitle('Recorded Stream: Recorded Service');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/recorded-123/iframe');
    });

    it('shows placeholder when recording not available', () => {
      const recordedStream = createTestStream({
        status: 'completed',
        title: 'Unavailable Recording',
        cloudflareStreamId: null,
        recordingPlaybackUrl: null,
        recordingUrl: null,
        recordingReady: false
      });

      render(StreamPlayer, {
        props: {
          streams: [recordedStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      expect(screen.getByText('Recording not available')).toBeInTheDocument();
    });

    it('displays recording date when available', () => {
      const endDate = new Date('2024-01-15T14:30:00Z');
      const recordedStream = createTestStream({
        status: 'completed',
        title: 'Recorded Service',
        cloudflareStreamId: 'recorded-123',
        recordingReady: true,
        endedAt: endDate.toISOString()
      });

      render(StreamPlayer, {
        props: {
          streams: [recordedStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      expect(screen.getByText(/Recorded on/)).toBeInTheDocument();
    });
  });

  describe('Stream URL Generation', () => {
    it('prioritizes Cloudflare Stream ID for live streams', () => {
      const liveStream = createTestStream({
        status: 'live',
        title: 'Live Service',
        cloudflareStreamId: 'stream-123',
        cloudflareInputId: 'input-456',
        playbackUrl: 'https://example.com/playback'
      });

      render(StreamPlayer, {
        props: {
          streams: [liveStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      const iframe = screen.getByTitle('Live Stream: Live Service');
      expect(iframe).toHaveAttribute('src', 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/stream-123/iframe');
    });

    it('falls back to Input ID for live streams', () => {
      const liveStream = createTestStream({
        status: 'live',
        title: 'Live Service',
        cloudflareStreamId: null,
        cloudflareInputId: 'input-456',
        playbackUrl: 'https://example.com/playback'
      });

      render(StreamPlayer, {
        props: {
          streams: [liveStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      const iframe = screen.getByTitle('Live Stream: Live Service');
      expect(iframe).toHaveAttribute('src', 'https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/input-456/iframe');
    });

    it('uses playback URL as final fallback for live streams', () => {
      const liveStream = createTestStream({
        status: 'live',
        title: 'Live Service',
        cloudflareStreamId: null,
        cloudflareInputId: null,
        playbackUrl: 'https://example.com/live-playback'
      });

      render(StreamPlayer, {
        props: {
          streams: [liveStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      const iframe = screen.getByTitle('Live Stream: Live Service');
      expect(iframe).toHaveAttribute('src', 'https://example.com/live-playback');
    });
  });

  describe('Stream Categorization Logic', () => {
    it('correctly categorizes mixed stream types', () => {
      const liveStream = createTestStream({
        status: 'live',
        title: 'Live Now'
      });

      const scheduledStream = createTestStream({
        id: 'scheduled-1',
        status: 'scheduled',
        title: 'Coming Soon',
        scheduledStartTime: new Date(Date.now() + 3600000).toISOString()
      });

      const recordedStream = createTestStream({
        id: 'recorded-1',
        status: 'completed',
        title: 'Past Service',
        cloudflareStreamId: 'recorded-123',
        recordingReady: true
      });

      render(StreamPlayer, {
        props: {
          streams: [liveStream, scheduledStream, recordedStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      expect(screen.getByText('🔴 Live Memorial Services')).toBeInTheDocument();
      expect(screen.getByText('🎥 Recorded Memorial Services')).toBeInTheDocument();
      expect(screen.getByText('Live Now')).toBeInTheDocument();
      expect(screen.getByText('Past Service')).toBeInTheDocument();
    });

    it('handles legacy isLive flag for backward compatibility', () => {
      const legacyLiveStream = createTestStream({
        status: 'ready',
        title: 'Legacy Live Stream',
        startedAt: null,
        endedAt: null
      });
      
      // Add legacy isLive flag
      (legacyLiveStream as any).isLive = true;

      render(StreamPlayer, {
        props: {
          streams: [legacyLiveStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      expect(screen.getByText('🔴 Live Memorial Services')).toBeInTheDocument();
      expect(screen.getByText('Legacy Live Stream')).toBeInTheDocument();
    });
  });

  describe('Timer Management', () => {
    it('sets up interval on mount', () => {
      render(StreamPlayer, {
        props: {
          streams: [],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    it('clears interval on destroy', () => {
      const { unmount } = render(StreamPlayer, {
        props: {
          streams: [],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      unmount();
      expect(mockClearInterval).toHaveBeenCalledWith(123);
    });
  });

  describe('Error Handling', () => {
    it('handles malformed stream data gracefully', () => {
      const malformedStreams = [
        { id: 'valid-1', title: 'Valid Stream', status: 'live' },
        { id: null, title: 'Invalid Stream' },
        { id: 'valid-2', title: 'Another Valid', status: 'completed', cloudflareStreamId: 'test' }
      ];

      render(StreamPlayer, {
        props: {
          streams: malformedStreams as any,
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      // Should only show valid streams
      expect(screen.getByText('Valid Stream')).toBeInTheDocument();
      expect(screen.getByText('Another Valid')).toBeInTheDocument();
      expect(screen.queryByText('Invalid Stream')).not.toBeInTheDocument();
    });

    it('handles invalid date formats in scheduledStartTime', () => {
      const invalidScheduledStream = createTestStream({
        status: 'scheduled',
        title: 'Invalid Date Stream',
        scheduledStartTime: 'invalid-date-format'
      });

      render(StreamPlayer, {
        props: {
          streams: [invalidScheduledStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      // Should show no streams message since invalid date is filtered out
      expect(screen.getByText('Memorial Service Video')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper iframe titles for screen readers', () => {
      const liveStream = createTestStream({
        status: 'live',
        title: 'Memorial Service for John Doe',
        cloudflareStreamId: 'stream-123'
      });

      render(StreamPlayer, {
        props: {
          streams: [liveStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      const iframe = screen.getByTitle('Live Stream: Memorial Service for John Doe');
      expect(iframe).toHaveAttribute('allowfullscreen');
      expect(iframe).toHaveAttribute('allow', 'accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;');
    });

    it('includes proper ARIA labels and semantic structure', () => {
      const liveStream = createTestStream({
        status: 'live',
        title: 'Live Memorial Service'
      });

      render(StreamPlayer, {
        props: {
          streams: [liveStream],
          memorialName: 'Test Memorial',
          memorialId: 'test-memorial-id'
        }
      });

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('🔴 Live Memorial Services');
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Live Memorial Service');
    });
  });
});
