import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import WHEPViewer from '../WHEPViewer.svelte';
import { setupTestEnvironment } from '../../../../test-utils/test-helpers';
import { createTestStream } from '../../../../test-utils/factories';

describe('WHEPViewer Component', () => {
  let mockPeerConnection: RTCPeerConnection;
  let mockFetch: ReturnType<typeof vi.fn>;
  let mockClipboard: { writeText: ReturnType<typeof vi.fn> };
  let mockWindowOpen: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupTestEnvironment();

    // Mock RTCPeerConnection
    mockPeerConnection = {
      addTransceiver: vi.fn(),
      createOffer: vi.fn(() => Promise.resolve({ 
        type: 'offer', 
        sdp: 'mock-sdp-offer' 
      } as RTCSessionDescriptionInit)),
      setLocalDescription: vi.fn(() => Promise.resolve()),
      setRemoteDescription: vi.fn(() => Promise.resolve()),
      close: vi.fn(),
      connectionState: 'new',
      ontrack: null,
      onconnectionstatechange: null
    } as any;

    vi.stubGlobal('RTCPeerConnection', vi.fn(() => mockPeerConnection));

    // Mock fetch
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    // Mock clipboard API
    mockClipboard = {
      writeText: vi.fn(() => Promise.resolve())
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true
    });

    // Mock window.open
    mockWindowOpen = vi.fn();
    vi.stubGlobal('open', mockWindowOpen);

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('renders with stream title and disconnected status', () => {
      const testStream = createTestStream({
        title: 'Test WHEP Stream',
        status: 'live'
      });

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      expect(screen.getByText('WHEP Viewer - Test WHEP Stream')).toBeInTheDocument();
      expect(screen.getByText('Get WHEP URL')).toBeInTheDocument();
      expect(screen.getByText('Click Connect to start')).toBeInTheDocument();
    });

    it('shows status indicator with correct styling', () => {
      const testStream = createTestStream();

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      const statusIndicator = document.querySelector('.bg-gray-500');
      expect(statusIndicator).toBeInTheDocument();
    });

    it('renders video element with proper attributes', () => {
      const testStream = createTestStream();

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      const video = screen.getByRole('application'); // video elements have application role
      expect(video).toHaveAttribute('autoplay');
      expect(video).toHaveAttribute('muted');
      expect(video).toHaveAttribute('controls');
    });
  });

  describe('WHEP URL Fetching', () => {
    it('fetches WHEP URL when button clicked', async () => {
      const testStream = createTestStream({
        id: 'test-stream-123'
      });

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          whepUrl: 'https://customer-test.cloudflarestream.com/whep-endpoint'
        })
      });

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      const getUrlButton = screen.getByText('Get WHEP URL');
      await fireEvent.click(getUrlButton);

      expect(mockFetch).toHaveBeenCalledWith('/api/streams/test-stream-123/whep');
      expect(screen.getByText('https://customer-test.cloudflarestream.com/whep-endpoint')).toBeInTheDocument();
    });

    it('shows loading state while fetching URL', async () => {
      const testStream = createTestStream();

      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      const getUrlButton = screen.getByText('Get WHEP URL');
      await fireEvent.click(getUrlButton);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('handles fetch errors gracefully', async () => {
      const testStream = createTestStream();

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'Stream not found'
        })
      });

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      const getUrlButton = screen.getByText('Get WHEP URL');
      await fireEvent.click(getUrlButton);

      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText('Stream not found')).toBeInTheDocument();
    });

    it('auto-fetches URL on mount when autoConnect is true', async () => {
      const testStream = createTestStream({
        id: 'auto-connect-stream'
      });

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          whepUrl: 'https://auto-connect-url.com'
        })
      });

      render(WHEPViewer, {
        props: {
          stream: testStream,
          autoConnect: true
        }
      });

      // Wait for mount effect
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith('/api/streams/auto-connect-stream/whep');
    });
  });

  describe('Connection Management', () => {
    beforeEach(async () => {
      // Setup with WHEP URL already fetched
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          whepUrl: 'https://test-whep-url.com'
        })
      });
    });

    it('shows connection controls after URL is fetched', async () => {
      const testStream = createTestStream();

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      const getUrlButton = screen.getByText('Get WHEP URL');
      await fireEvent.click(getUrlButton);

      expect(screen.getByText('📋 Copy URL')).toBeInTheDocument();
      expect(screen.getByText('🧪 Test')).toBeInTheDocument();
      expect(screen.getByText('Connect')).toBeInTheDocument();
    });

    it('initiates WebRTC connection when Connect clicked', async () => {
      const testStream = createTestStream();

      mockFetch.mockResolvedValueOnce({
        text: () => Promise.resolve('mock-answer-sdp')
      });

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      // First get the URL
      const getUrlButton = screen.getByText('Get WHEP URL');
      await fireEvent.click(getUrlButton);

      // Then connect
      const connectButton = screen.getByText('Connect');
      await fireEvent.click(connectButton);

      expect(mockPeerConnection.addTransceiver).toHaveBeenCalledWith('video', { direction: 'recvonly' });
      expect(mockPeerConnection.addTransceiver).toHaveBeenCalledWith('audio', { direction: 'recvonly' });
      expect(mockPeerConnection.createOffer).toHaveBeenCalled();
      expect(mockPeerConnection.setLocalDescription).toHaveBeenCalled();
    });

    it('shows connecting state during connection attempt', async () => {
      const testStream = createTestStream();

      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      // Get URL first
      const getUrlButton = screen.getByText('Get WHEP URL');
      await fireEvent.click(getUrlButton);

      // Start connection (will hang)
      const connectButton = screen.getByText('Connect');
      await fireEvent.click(connectButton);

      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      
      // Status indicator should show connecting state
      const connectingIndicator = document.querySelector('.bg-yellow-500');
      expect(connectingIndicator).toBeInTheDocument();
    });

    it('handles connection success', async () => {
      const testStream = createTestStream();

      mockFetch.mockResolvedValueOnce({
        text: () => Promise.resolve('mock-answer-sdp')
      });

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      // Get URL and connect
      const getUrlButton = screen.getByText('Get WHEP URL');
      await fireEvent.click(getUrlButton);

      const connectButton = screen.getByText('Connect');
      await fireEvent.click(connectButton);

      // Simulate successful connection
      mockPeerConnection.connectionState = 'connected';
      if (mockPeerConnection.onconnectionstatechange) {
        mockPeerConnection.onconnectionstatechange(new Event('connectionstatechange'));
      }

      expect(screen.getByText('Disconnect')).toBeInTheDocument();
      expect(screen.getByText('🔴 LIVE')).toBeInTheDocument();
    });

    it('handles connection failure', async () => {
      const testStream = createTestStream();

      mockFetch.mockResolvedValueOnce({
        text: () => Promise.resolve('mock-answer-sdp')
      });

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      // Get URL and connect
      const getUrlButton = screen.getByText('Get WHEP URL');
      await fireEvent.click(getUrlButton);

      const connectButton = screen.getByText('Connect');
      await fireEvent.click(connectButton);

      // Simulate connection failure
      mockPeerConnection.connectionState = 'failed';
      if (mockPeerConnection.onconnectionstatechange) {
        mockPeerConnection.onconnectionstatechange(new Event('connectionstatechange'));
      }

      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText('Connection failed or disconnected')).toBeInTheDocument();
    });

    it('disconnects stream when Disconnect clicked', async () => {
      const testStream = createTestStream();

      mockFetch.mockResolvedValueOnce({
        text: () => Promise.resolve('mock-answer-sdp')
      });

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      // Get URL, connect, and simulate success
      const getUrlButton = screen.getByText('Get WHEP URL');
      await fireEvent.click(getUrlButton);

      const connectButton = screen.getByText('Connect');
      await fireEvent.click(connectButton);

      // Simulate connection success
      mockPeerConnection.connectionState = 'connected';
      if (mockPeerConnection.onconnectionstatechange) {
        mockPeerConnection.onconnectionstatechange(new Event('connectionstatechange'));
      }

      // Now disconnect
      const disconnectButton = screen.getByText('Disconnect');
      await fireEvent.click(disconnectButton);

      expect(mockPeerConnection.close).toHaveBeenCalled();
      expect(screen.getByText('Connect')).toBeInTheDocument();
    });
  });

  describe('Media Stream Handling', () => {
    it('handles incoming media tracks', async () => {
      const testStream = createTestStream();

      mockFetch.mockResolvedValueOnce({
        text: () => Promise.resolve('mock-answer-sdp')
      });

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      // Get URL and connect
      const getUrlButton = screen.getByText('Get WHEP URL');
      await fireEvent.click(getUrlButton);

      const connectButton = screen.getByText('Connect');
      await fireEvent.click(connectButton);

      // Simulate incoming track
      const mockMediaStream = {
        id: 'mock-stream'
      } as MediaStream;

      const trackEvent = {
        track: { kind: 'video' },
        streams: [mockMediaStream]
      } as RTCTrackEvent;

      if (mockPeerConnection.ontrack) {
        mockPeerConnection.ontrack(trackEvent);
      }

      // Should set video element srcObject and update status
      expect(screen.getByText('🔴 LIVE')).toBeInTheDocument();
    });

    it('handles track events without streams gracefully', async () => {
      const testStream = createTestStream();

      mockFetch.mockResolvedValueOnce({
        text: () => Promise.resolve('mock-answer-sdp')
      });

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      // Get URL and connect
      const getUrlButton = screen.getByText('Get WHEP URL');
      await fireEvent.click(getUrlButton);

      const connectButton = screen.getByText('Connect');
      await fireEvent.click(connectButton);

      // Simulate track event without streams
      const trackEvent = {
        track: { kind: 'video' },
        streams: null
      } as any;

      if (mockPeerConnection.ontrack) {
        mockPeerConnection.ontrack(trackEvent);
      }

      // Should not crash or show error
      expect(screen.queryByText('Error:')).not.toBeInTheDocument();
    });
  });

  describe('Utility Functions', () => {
    it('copies WHEP URL to clipboard', async () => {
      const testStream = createTestStream();

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      // Get URL first
      const getUrlButton = screen.getByText('Get WHEP URL');
      await fireEvent.click(getUrlButton);

      // Copy URL
      const copyButton = screen.getByText('📋 Copy URL');
      await fireEvent.click(copyButton);

      expect(mockClipboard.writeText).toHaveBeenCalledWith('https://customer-test.cloudflarestream.com/whep-endpoint');
    });

    it('opens test page in new window', async () => {
      const testStream = createTestStream({
        id: 'test-stream-456'
      });

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      // Get URL first
      const getUrlButton = screen.getByText('Get WHEP URL');
      await fireEvent.click(getUrlButton);

      // Open test page
      const testButton = screen.getByText('🧪 Test');
      await fireEvent.click(testButton);

      expect(mockWindowOpen).toHaveBeenCalledWith('/api/streams/test-stream-456/whep', '_blank');
    });
  });

  describe('OBS Instructions', () => {
    it('shows OBS setup instructions when WHEP URL available', async () => {
      const testStream = createTestStream();

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      // Get URL
      const getUrlButton = screen.getByText('Get WHEP URL');
      await fireEvent.click(getUrlButton);

      expect(screen.getByText('OBS Browser Source Setup')).toBeInTheDocument();
      expect(screen.getByText('To use this stream in OBS:')).toBeInTheDocument();
      expect(screen.getByText('Open OBS Studio')).toBeInTheDocument();
      expect(screen.getByText('Add a new "Browser Source"')).toBeInTheDocument();
    });

    it('includes WHEP URL in OBS instructions', async () => {
      const testStream = createTestStream();

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      // Get URL
      const getUrlButton = screen.getByText('Get WHEP URL');
      await fireEvent.click(getUrlButton);

      // Check that the URL appears in instructions
      const obsInstructions = screen.getByText('OBS Browser Source Setup');
      expect(obsInstructions).toBeInTheDocument();
      
      // The URL should appear in the instructions
      expect(screen.getAllByText('https://customer-test.cloudflarestream.com/whep-endpoint')).toHaveLength(2); // Once in URL display, once in instructions
    });
  });

  describe('Error Handling', () => {
    it('handles fetch network errors', async () => {
      const testStream = createTestStream();

      mockFetch.mockRejectedValue(new Error('Network error'));

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      const getUrlButton = screen.getByText('Get WHEP URL');
      await fireEvent.click(getUrlButton);

      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('handles WHEP connection errors', async () => {
      const testStream = createTestStream();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      // Get URL first
      const getUrlButton = screen.getByText('Get WHEP URL');
      await fireEvent.click(getUrlButton);

      // Try to connect (will fail)
      const connectButton = screen.getByText('Connect');
      await fireEvent.click(connectButton);

      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText(/WHEP request failed/)).toBeInTheDocument();
    });

    it('cleans up on component destroy', () => {
      const testStream = createTestStream();

      const { unmount } = render(WHEPViewer, {
        props: {
          stream: testStream
        }
      });

      unmount();

      // Should not throw errors during cleanup
      expect(true).toBe(true);
    });
  });

  describe('Auto-Connect Behavior', () => {
    it('auto-connects when autoConnect is true and URL is available', async () => {
      const testStream = createTestStream({
        id: 'auto-stream'
      });

      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            success: true,
            whepUrl: 'https://auto-whep-url.com'
          })
        })
        .mockResolvedValueOnce({
          text: () => Promise.resolve('auto-answer-sdp')
        });

      render(WHEPViewer, {
        props: {
          stream: testStream,
          autoConnect: true
        }
      });

      // Wait for auto-connect to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith('/api/streams/auto-stream/whep');
      expect(mockPeerConnection.createOffer).toHaveBeenCalled();
    });

    it('does not auto-connect when autoConnect is false', async () => {
      const testStream = createTestStream();

      render(WHEPViewer, {
        props: {
          stream: testStream,
          autoConnect: false
        }
      });

      // Wait to ensure no auto-connect happens
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).not.toHaveBeenCalled();
      expect(screen.getByText('Get WHEP URL')).toBeInTheDocument();
    });
  });
});
