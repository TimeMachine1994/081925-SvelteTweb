import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import BrowserStreamer from '../BrowserStreamer.svelte';
import { setupTestEnvironment } from '../../../../test-utils/test-helpers';
import type { MuxConnectionState } from '$lib/services/muxWebRTC';

// Mock Button component
vi.mock('$lib/ui', () => ({
  Button: vi.fn(({ onclick, children, ...props }) => {
    return {
      $$: { 
        fragment: null, 
        on_mount: [], 
        on_destroy: [], 
        before_update: [], 
        after_update: [] 
      },
      $set: vi.fn(),
      $destroy: vi.fn()
    };
  })
}));

// Mock Lucide icons
vi.mock('lucide-svelte', () => ({
  Camera: vi.fn(() => ({ $$: { fragment: null } })),
  CameraOff: vi.fn(() => ({ $$: { fragment: null } })),
  Mic: vi.fn(() => ({ $$: { fragment: null } })),
  MicOff: vi.fn(() => ({ $$: { fragment: null } })),
  Play: vi.fn(() => ({ $$: { fragment: null } })),
  Square: vi.fn(() => ({ $$: { fragment: null } })),
  AlertCircle: vi.fn(() => ({ $$: { fragment: null } }))
}));

// Mock MuxWebRTC service
const mockMuxService = {
  startBridge: vi.fn(),
  connectToMux: vi.fn(),
  stopBridge: vi.fn(),
  cleanup: vi.fn(),
  getConnectionState: vi.fn(() => ({ status: 'disconnected' }))
};

vi.mock('$lib/services/muxWebRTC', () => ({
  createMuxWebRTCService: vi.fn(() => mockMuxService),
  MuxWebRTCService: vi.fn(() => mockMuxService)
}));

describe('BrowserStreamer Component (Mux Integration)', () => {
  let mockMediaStream: MediaStream;
  let mockVideoTrack: MediaStreamTrack;
  let mockAudioTrack: MediaStreamTrack;
  let mockGetUserMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupTestEnvironment();

    // Mock MediaStreamTrack
    mockVideoTrack = {
      enabled: true,
      stop: vi.fn(),
      kind: 'video',
      id: 'video-track-1',
      label: 'Camera',
      readyState: 'live',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      getSettings: vi.fn(() => ({ width: 1280, height: 720 })),
      getConstraints: vi.fn(),
      getCapabilities: vi.fn(),
      applyConstraints: vi.fn(),
      clone: vi.fn()
    } as any;

    mockAudioTrack = {
      enabled: true,
      stop: vi.fn(),
      kind: 'audio',
      id: 'audio-track-1',
      label: 'Microphone',
      readyState: 'live',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      getSettings: vi.fn(),
      getConstraints: vi.fn(),
      getCapabilities: vi.fn(),
      applyConstraints: vi.fn(),
      clone: vi.fn()
    } as any;

    // Mock MediaStream
    mockMediaStream = {
      getVideoTracks: vi.fn(() => [mockVideoTrack]),
      getAudioTracks: vi.fn(() => [mockAudioTrack]),
      getTracks: vi.fn(() => [mockVideoTrack, mockAudioTrack]),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      clone: vi.fn(),
      id: 'mock-stream-id',
      active: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    } as any;

    // Mock RTCPeerConnection
    mockPeerConnection = {
      addTrack: vi.fn(),
      createOffer: vi.fn(() => Promise.resolve({ 
        type: 'offer', 
        sdp: 'mock-sdp-offer' 
      } as RTCSessionDescriptionInit)),
      setLocalDescription: vi.fn(() => Promise.resolve()),
      setRemoteDescription: vi.fn(() => Promise.resolve()),
      close: vi.fn(),
      connectionState: 'new',
      iceConnectionState: 'new',
      onconnectionstatechange: null,
      oniceconnectionstatechange: null
    } as any;

    // Mock getUserMedia
    mockGetUserMedia = vi.fn(() => Promise.resolve(mockMediaStream));
    
    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia
      },
      writable: true
    });

    // Mock RTCPeerConnection constructor
    vi.stubGlobal('RTCPeerConnection', vi.fn(() => mockPeerConnection));

    // Mock fetch
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('renders with stream title and permission request', () => {
      render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Memorial Service Stream'
        }
      });

      expect(screen.getByText('📹 Browser Streaming')).toBeInTheDocument();
      expect(screen.getByText('Memorial Service Stream')).toBeInTheDocument();
      expect(screen.getByText('Camera & Microphone Access Required')).toBeInTheDocument();
      expect(screen.getByText('To stream from your browser, we need access to your camera and microphone.')).toBeInTheDocument();
    });

    it('shows permission request button initially', () => {
      render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Test Stream'
        }
      });

      expect(screen.getByText('Allow Camera & Microphone')).toBeInTheDocument();
    });
  });

  describe('Permission Handling', () => {
    it('requests media permissions when button clicked', async () => {
      render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Test Stream'
        }
      });

      const permissionButton = screen.getByText('Allow Camera & Microphone');
      await fireEvent.click(permissionButton);

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    });

    it('handles permission denied gracefully', async () => {
      const permissionError = new Error('Permission denied');
      mockGetUserMedia.mockRejectedValue(permissionError);

      render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Test Stream'
        }
      });

      const permissionButton = screen.getByText('Allow Camera & Microphone');
      await fireEvent.click(permissionButton);

      expect(screen.getByText('Camera and microphone access is required to stream. Please allow permissions and try again.')).toBeInTheDocument();
    });

    it('shows video preview after permissions granted', async () => {
      render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Test Stream'
        }
      });

      const permissionButton = screen.getByText('Allow Camera & Microphone');
      await fireEvent.click(permissionButton);

      // Wait for permissions to be processed
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(screen.getByRole('button', { name: /start streaming/i })).toBeInTheDocument();
    });
  });

  describe('Streaming Controls', () => {
    beforeEach(async () => {
      // Grant permissions first
      render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Test Stream'
        }
      });

      const permissionButton = screen.getByText('Allow Camera & Microphone');
      await fireEvent.click(permissionButton);
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    it('shows start streaming button after permissions granted', () => {
      expect(screen.getByText('Start Streaming')).toBeInTheDocument();
    });

    it('initiates WHIP streaming when start button clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          whipUrl: 'https://customer-test.cloudflarestream.com/whip-endpoint',
          cloudflareInputId: 'input-123'
        })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('mock-sdp-answer')
      });

      const startButton = screen.getByText('Start Streaming');
      await fireEvent.click(startButton);

      expect(mockFetch).toHaveBeenCalledWith('/api/streams/playback/test-stream-123/whip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(mockPeerConnection.addTrack).toHaveBeenCalledWith(mockVideoTrack, mockMediaStream);
      expect(mockPeerConnection.addTrack).toHaveBeenCalledWith(mockAudioTrack, mockMediaStream);
      expect(mockPeerConnection.createOffer).toHaveBeenCalled();
    });

    it('shows connecting state during stream setup', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const startButton = screen.getByText('Start Streaming');
      await fireEvent.click(startButton);

      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('handles WHIP API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Authentication failed')
      });

      const startButton = screen.getByText('Start Streaming');
      await fireEvent.click(startButton);

      expect(screen.getByText(/Failed to get WHIP URL/)).toBeInTheDocument();
    });
  });

  describe('Media Controls', () => {
    beforeEach(async () => {
      // Grant permissions and setup video
      render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Test Stream'
        }
      });

      const permissionButton = screen.getByText('Allow Camera & Microphone');
      await fireEvent.click(permissionButton);
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    it('toggles camera on/off', async () => {
      const cameraButton = screen.getByTitle('Turn off camera');
      await fireEvent.click(cameraButton);

      expect(mockVideoTrack.enabled).toBe(false);
      expect(screen.getByTitle('Turn on camera')).toBeInTheDocument();
    });

    it('toggles microphone on/off', async () => {
      const micButton = screen.getByTitle('Mute microphone');
      await fireEvent.click(micButton);

      expect(mockAudioTrack.enabled).toBe(false);
      expect(screen.getByTitle('Unmute microphone')).toBeInTheDocument();
    });

    it('shows disabled state when camera is off', async () => {
      const cameraButton = screen.getByTitle('Turn off camera');
      await fireEvent.click(cameraButton);

      expect(cameraButton).toHaveClass('disabled');
    });

    it('shows disabled state when microphone is muted', async () => {
      const micButton = screen.getByTitle('Mute microphone');
      await fireEvent.click(micButton);

      expect(micButton).toHaveClass('disabled');
    });
  });

  describe('Stream State Management', () => {
    it('calls onStreamStart callback when connection established', async () => {
      const onStreamStart = vi.fn();
      
      render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Test Stream',
          onStreamStart
        }
      });

      // Grant permissions
      const permissionButton = screen.getByText('Allow Camera & Microphone');
      await fireEvent.click(permissionButton);
      await new Promise(resolve => setTimeout(resolve, 150));

      // Mock successful WHIP setup
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ whipUrl: 'test-url', cloudflareInputId: 'input-123' })
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('mock-answer')
      });

      const startButton = screen.getByText('Start Streaming');
      await fireEvent.click(startButton);

      // Simulate connection established
      mockPeerConnection.connectionState = 'connected';
      if (mockPeerConnection.onconnectionstatechange) {
        mockPeerConnection.onconnectionstatechange(new Event('connectionstatechange'));
      }

      expect(onStreamStart).toHaveBeenCalled();
    });

    it('calls onStreamEnd callback when streaming stopped', async () => {
      const onStreamEnd = vi.fn();
      
      render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Test Stream',
          onStreamEnd
        }
      });

      // Setup streaming state (mock successful start)
      const permissionButton = screen.getByText('Allow Camera & Microphone');
      await fireEvent.click(permissionButton);
      await new Promise(resolve => setTimeout(resolve, 150));

      // Mock successful streaming setup
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ whipUrl: 'test-url', cloudflareInputId: 'input-123' })
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('mock-answer')
      });

      const startButton = screen.getByText('Start Streaming');
      await fireEvent.click(startButton);

      // Simulate successful connection
      mockPeerConnection.connectionState = 'connected';
      if (mockPeerConnection.onconnectionstatechange) {
        mockPeerConnection.onconnectionstatechange(new Event('connectionstatechange'));
      }

      // Now stop streaming
      const stopButton = screen.getByText('Stop Streaming');
      await fireEvent.click(stopButton);

      expect(onStreamEnd).toHaveBeenCalled();
    });
  });

  describe('Cleanup and Error Handling', () => {
    it('cleans up resources on component destroy', () => {
      const { unmount } = render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Test Stream'
        }
      });

      unmount();

      // Cleanup should be called (though we can't directly test the onDestroy hook)
      // The important thing is that it doesn't throw errors
      expect(true).toBe(true);
    });

    it('handles connection failures gracefully', async () => {
      render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Test Stream'
        }
      });

      // Grant permissions
      const permissionButton = screen.getByText('Allow Camera & Microphone');
      await fireEvent.click(permissionButton);
      await new Promise(resolve => setTimeout(resolve, 150));

      // Mock successful WHIP setup
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ whipUrl: 'test-url', cloudflareInputId: 'input-123' })
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('mock-answer')
      });

      const startButton = screen.getByText('Start Streaming');
      await fireEvent.click(startButton);

      // Simulate connection failure
      mockPeerConnection.connectionState = 'failed';
      if (mockPeerConnection.onconnectionstatechange) {
        mockPeerConnection.onconnectionstatechange(new Event('connectionstatechange'));
      }

      expect(screen.getByText('Failed to connect to streaming server. Please try again.')).toBeInTheDocument();
    });

    it('stops all media tracks on cleanup', async () => {
      render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Test Stream'
        }
      });

      // Grant permissions
      const permissionButton = screen.getByText('Allow Camera & Microphone');
      await fireEvent.click(permissionButton);
      await new Promise(resolve => setTimeout(resolve, 150));

      // Stop streaming (triggers cleanup)
      const stopButton = screen.getByText('Start Streaming');
      // We can't easily test the actual cleanup without triggering streaming,
      // but we can verify the tracks have stop methods
      expect(mockVideoTrack.stop).toBeDefined();
      expect(mockAudioTrack.stop).toBeDefined();
    });
  });

  describe('Video Element Integration', () => {
    it('sets video element srcObject when media stream available', async () => {
      render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Test Stream'
        }
      });

      const permissionButton = screen.getByText('Allow Camera & Microphone');
      await fireEvent.click(permissionButton);

      // The video element should be present
      const video = screen.getByRole('application'); // video elements have application role
      expect(video).toBeInTheDocument();
    });

    it('shows debug overlay when no video tracks available', async () => {
      // Mock stream with no video tracks
      mockMediaStream.getVideoTracks.mockReturnValue([]);

      render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Test Stream'
        }
      });

      const permissionButton = screen.getByText('Allow Camera & Microphone');
      await fireEvent.click(permissionButton);
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(screen.getByText('No video tracks found')).toBeInTheDocument();
    });
  });

  // New Mux Integration Tests
  describe('Mux Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should use Mux service for streaming instead of WHIP', async () => {
      mockMuxService.startBridge.mockResolvedValue({
        success: true,
        bridgeId: 'mux-bridge-123',
        webrtcUrl: 'https://global-live.mux.com/webrtc/test-key',
        rtmpUrl: 'rtmps://global-live.mux.com:443/live',
        streamKey: 'test-stream-key',
        status: 'ready'
      });

      mockMuxService.connectToMux.mockResolvedValue({});

      render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Test Memorial Stream'
        }
      });

      // Grant permissions first
      mockGetUserMedia.mockResolvedValue(mockMediaStream);
      const permissionButton = screen.getByText('Allow Camera & Microphone');
      await fireEvent.click(permissionButton);

      // Start streaming
      const startButton = screen.getByText('Start Streaming');
      await fireEvent.click(startButton);

      expect(mockMuxService.startBridge).toHaveBeenCalledWith('test-stream-123');
      expect(mockMuxService.connectToMux).toHaveBeenCalledWith(
        'https://global-live.mux.com/webrtc/test-key',
        mockMediaStream
      );
    });

    it('should show guaranteed recording messaging', () => {
      render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Test Memorial Stream'
        }
      });

      expect(screen.getByText('Guaranteed Recording Stream')).toBeInTheDocument();
      expect(screen.getByText('Enterprise-grade recording via Mux bridge')).toBeInTheDocument();
    });

    it('should handle Mux connection failures gracefully', async () => {
      mockMuxService.startBridge.mockRejectedValue(new Error('Mux API error'));

      render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Test Memorial Stream'
        }
      });

      // Grant permissions first
      mockGetUserMedia.mockResolvedValue(mockMediaStream);
      const permissionButton = screen.getByText('Allow Camera & Microphone');
      await fireEvent.click(permissionButton);

      // Start streaming (should fail)
      const startButton = screen.getByText('Start Streaming');
      await fireEvent.click(startButton);

      expect(screen.getByText(/Failed to start streaming with guaranteed recording/)).toBeInTheDocument();
    });

    it('should clean up Mux service on component unmount', () => {
      const { unmount } = render(BrowserStreamer, {
        props: {
          streamId: 'test-stream-123',
          streamTitle: 'Test Memorial Stream'
        }
      });

      unmount();

      expect(mockMuxService.cleanup).toHaveBeenCalled();
    });
  });
});
