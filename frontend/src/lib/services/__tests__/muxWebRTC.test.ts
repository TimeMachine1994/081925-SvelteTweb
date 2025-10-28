import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MuxWebRTCService, createMuxWebRTCService, type MuxConnectionState } from '../muxWebRTC';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock RTCPeerConnection
const mockPeerConnection = {
	addTrack: vi.fn(),
	createOffer: vi.fn(),
	setLocalDescription: vi.fn(),
	setRemoteDescription: vi.fn(),
	close: vi.fn(),
	connectionState: 'new',
	iceConnectionState: 'new',
	iceGatheringState: 'new',
	onconnectionstatechange: null,
	oniceconnectionstatechange: null,
	onicegatheringstatechange: null,
	ondatachannel: null
};

// Mock MediaStreamTrack
const mockVideoTrack = {
	kind: 'video',
	id: 'video-track-1',
	enabled: true,
	stop: vi.fn()
};

const mockAudioTrack = {
	kind: 'audio',
	id: 'audio-track-1',
	enabled: true,
	stop: vi.fn()
};

// Mock MediaStream
const mockMediaStream = {
	getTracks: vi.fn(() => [mockVideoTrack, mockAudioTrack]),
	getVideoTracks: vi.fn(() => [mockVideoTrack]),
	getAudioTracks: vi.fn(() => [mockAudioTrack])
};

// Mock RTCPeerConnection constructor
global.RTCPeerConnection = vi.fn(() => mockPeerConnection) as any;

describe('MuxWebRTCService', () => {
	let service: MuxWebRTCService;
	let stateChangeCallback: vi.Mock;

	beforeEach(() => {
		vi.clearAllMocks();
		stateChangeCallback = vi.fn();
		service = new MuxWebRTCService(stateChangeCallback);
		
		// Reset mock peer connection state
		mockPeerConnection.connectionState = 'new';
		mockPeerConnection.onconnectionstatechange = null;
	});

	afterEach(async () => {
		await service.cleanup();
	});

	describe('Bridge Management', () => {
		it('should start bridge and return connection details', async () => {
			const mockBridgeResponse = {
				success: true,
				bridgeId: 'bridge-123',
				webrtcUrl: 'https://global-live.mux.com/webrtc/test-key',
				rtmpUrl: 'rtmps://global-live.mux.com:443/live',
				streamKey: 'test-stream-key',
				status: 'ready',
				message: 'Bridge ready'
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockBridgeResponse)
			});

			const result = await service.startBridge('test-stream-123');

			expect(mockFetch).toHaveBeenCalledWith('/api/streams/test-stream-123/bridge/start', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					priority: 'high',
					recordingSettings: {
						quality: '720p',
						bitrate: 2000,
						backup: true
					}
				})
			});

			expect(result).toEqual(mockBridgeResponse);
			expect(stateChangeCallback).toHaveBeenCalledWith({
				status: 'connecting'
			});
		});

		it('should handle bridge start API failures', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				text: () => Promise.resolve('Internal Server Error')
			});

			await expect(service.startBridge('test-stream-123')).rejects.toThrow(
				'Bridge start failed: 500 - Internal Server Error'
			);

			expect(stateChangeCallback).toHaveBeenCalledWith({
				status: 'failed',
				error: 'Bridge start failed: 500 - Internal Server Error'
			});
		});

		it('should handle bridge start success=false response', async () => {
			const mockResponse = {
				success: false,
				message: 'Mux credentials not configured'
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			await expect(service.startBridge('test-stream-123')).rejects.toThrow(
				'Bridge start failed: Mux credentials not configured'
			);
		});

		it('should stop bridge and clean up resources', async () => {
			// First start a bridge
			const mockBridgeResponse = {
				success: true,
				bridgeId: 'bridge-123',
				webrtcUrl: 'https://global-live.mux.com/webrtc/test-key',
				rtmpUrl: 'rtmps://global-live.mux.com:443/live',
				streamKey: 'test-stream-key',
				status: 'ready'
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockBridgeResponse)
			});

			await service.startBridge('test-stream-123');

			// Mock stop bridge API
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ success: true })
			});

			await service.stopBridge();

			expect(mockFetch).toHaveBeenCalledWith('/api/streams/test-stream-123/bridge/stop', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			expect(mockPeerConnection.close).toHaveBeenCalled();
			expect(stateChangeCallback).toHaveBeenCalledWith({
				status: 'disconnected'
			});
		});
	});

	describe('WebRTC Connection', () => {
		it('should establish WebRTC connection to Mux', async () => {
			const webrtcUrl = 'https://global-live.mux.com/webrtc/test-key';
			const mockOffer = {
				type: 'offer' as RTCSdpType,
				sdp: 'mock-offer-sdp'
			};
			const mockAnswerSdp = 'mock-answer-sdp';

			mockPeerConnection.createOffer.mockResolvedValue(mockOffer);
			mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);
			mockPeerConnection.setRemoteDescription.mockResolvedValue(undefined);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve(mockAnswerSdp)
			});

			const result = await service.connectToMux(webrtcUrl, mockMediaStream as any);

			expect(RTCPeerConnection).toHaveBeenCalledWith({
				iceServers: [
					{ urls: 'stun:stun.mux.com:3478' },
					{ urls: 'stun:stun.cloudflare.com:3478' }
				],
				iceCandidatePoolSize: 10
			});

			expect(mockPeerConnection.addTrack).toHaveBeenCalledTimes(2);
			expect(mockPeerConnection.addTrack).toHaveBeenCalledWith(mockVideoTrack, mockMediaStream);
			expect(mockPeerConnection.addTrack).toHaveBeenCalledWith(mockAudioTrack, mockMediaStream);

			expect(mockPeerConnection.createOffer).toHaveBeenCalledWith({
				offerToReceiveAudio: false,
				offerToReceiveVideo: false
			});

			expect(mockFetch).toHaveBeenCalledWith(webrtcUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/sdp'
				},
				body: mockOffer.sdp
			});

			expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalledWith({
				type: 'answer',
				sdp: mockAnswerSdp
			});

			expect(result).toBe(mockPeerConnection);
		});

		it('should handle WebRTC connection failures', async () => {
			const webrtcUrl = 'https://global-live.mux.com/webrtc/test-key';
			
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				text: () => Promise.resolve('Bad Request')
			});

			mockPeerConnection.createOffer.mockResolvedValue({
				type: 'offer' as RTCSdpType,
				sdp: 'mock-offer-sdp'
			});

			await expect(service.connectToMux(webrtcUrl, mockMediaStream as any)).rejects.toThrow(
				'Mux WebRTC connection failed: 400 - Bad Request'
			);

			expect(stateChangeCallback).toHaveBeenCalledWith({
				status: 'failed',
				error: 'Mux WebRTC connection failed: 400 - Bad Request'
			});
		});
	});

	describe('Connection State Monitoring', () => {
		it('should monitor connection state changes', async () => {
			const webrtcUrl = 'https://global-live.mux.com/webrtc/test-key';
			
			mockPeerConnection.createOffer.mockResolvedValue({
				type: 'offer' as RTCSdpType,
				sdp: 'mock-offer-sdp'
			});

			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve('mock-answer-sdp')
			});

			await service.connectToMux(webrtcUrl, mockMediaStream as any);

			// Simulate connection state change to connected
			mockPeerConnection.connectionState = 'connected';
			if (mockPeerConnection.onconnectionstatechange) {
				mockPeerConnection.onconnectionstatechange(new Event('connectionstatechange'));
			}

			expect(stateChangeCallback).toHaveBeenCalledWith({
				status: 'connected',
				bridgeId: undefined,
				connectedAt: expect.any(String)
			});

			// Simulate connection failure
			mockPeerConnection.connectionState = 'failed';
			if (mockPeerConnection.onconnectionstatechange) {
				mockPeerConnection.onconnectionstatechange(new Event('connectionstatechange'));
			}

			expect(stateChangeCallback).toHaveBeenCalledWith({
				status: 'failed',
				error: 'WebRTC connection lost'
			});
		});

		it('should return current connection state', () => {
			const initialState = service.getConnectionState();
			expect(initialState).toEqual({ status: 'disconnected' });
		});
	});

	describe('Resource Cleanup', () => {
		it('should clean up all resources on cleanup', async () => {
			// Start a bridge first
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({
					success: true,
					bridgeId: 'bridge-123',
					webrtcUrl: 'https://global-live.mux.com/webrtc/test-key',
					rtmpUrl: 'rtmps://global-live.mux.com:443/live',
					streamKey: 'test-stream-key',
					status: 'ready'
				})
			});

			await service.startBridge('test-stream-123');

			// Mock stop bridge API
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ success: true })
			});

			await service.cleanup();

			expect(mockPeerConnection.close).toHaveBeenCalled();
			expect(stateChangeCallback).toHaveBeenCalledWith({
				status: 'disconnected'
			});
		});

		it('should handle cleanup errors gracefully', async () => {
			// Start a bridge first
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({
					success: true,
					bridgeId: 'bridge-123',
					webrtcUrl: 'https://global-live.mux.com/webrtc/test-key',
					rtmpUrl: 'rtmps://global-live.mux.com:443/live',
					streamKey: 'test-stream-key',
					status: 'ready'
				})
			});

			await service.startBridge('test-stream-123');

			// Mock stop bridge API failure
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500
			});

			// Should not throw
			await expect(service.cleanup()).resolves.toBeUndefined();

			// Should still update state to disconnected
			expect(stateChangeCallback).toHaveBeenCalledWith({
				status: 'disconnected'
			});
		});
	});

	describe('Factory Function', () => {
		it('should create service instance with callback', () => {
			const callback = vi.fn();
			const newService = createMuxWebRTCService(callback);
			
			expect(newService).toBeInstanceOf(MuxWebRTCService);
			expect(newService.getConnectionState()).toEqual({ status: 'disconnected' });
		});

		it('should create service instance without callback', () => {
			const newService = createMuxWebRTCService();
			
			expect(newService).toBeInstanceOf(MuxWebRTCService);
			expect(newService.getConnectionState()).toEqual({ status: 'disconnected' });
		});
	});
});
