/**
 * Mux WebRTC Integration Service
 * 
 * Handles WebRTC connections to Mux for browser streaming with guaranteed recording
 * Replaces direct WHIP connections to Cloudflare for critical memorial streams
 */

export interface MuxBridgeResponse {
	success: boolean;
	bridgeId: string;
	webrtcUrl: string;
	rtmpUrl: string;
	streamKey: string;
	status: string;
	message?: string;
}

export interface MuxConnectionState {
	status: 'disconnected' | 'connecting' | 'connected' | 'failed';
	bridgeId?: string;
	error?: string;
	connectedAt?: string;
}

export class MuxWebRTCService {
	private peerConnection: RTCPeerConnection | null = null;
	private streamId: string | null = null;
	private bridgeId: string | null = null;
	private connectionState: MuxConnectionState = { status: 'disconnected' };
	private onStateChange?: (state: MuxConnectionState) => void;

	constructor(onStateChange?: (state: MuxConnectionState) => void) {
		this.onStateChange = onStateChange;
	}

	/**
	 * Start Mux bridge and get WebRTC connection details
	 */
	async startBridge(streamId: string): Promise<MuxBridgeResponse> {
		console.log('🎬 [MUX_WEBRTC] Starting bridge for stream:', streamId);
		this.streamId = streamId;
		this.updateConnectionState({ status: 'connecting' });

		try {
			const response = await fetch(`/api/streams/${streamId}/bridge/start`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					priority: 'high', // Critical recording
					recordingSettings: {
						quality: '720p',
						bitrate: 2000,
						backup: true
					}
				})
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ [MUX_WEBRTC] Bridge start failed:', response.status, errorText);
				
				// Provide user-friendly error messages
				if (response.status === 500 && errorText.includes('not configured')) {
					throw new Error('Mux integration not configured. Please contact support.');
				} else if (response.status === 403) {
					throw new Error('You do not have permission to start streaming for this memorial.');
				} else if (response.status === 404) {
					throw new Error('Stream not found. Please refresh the page and try again.');
				} else {
					throw new Error(`Bridge start failed: ${response.status} - ${errorText}`);
				}
			}

			const bridgeResponse: MuxBridgeResponse = await response.json();
			
			if (!bridgeResponse.success) {
				throw new Error(`Bridge start failed: ${bridgeResponse.message || 'Unknown error'}`);
			}

			this.bridgeId = bridgeResponse.bridgeId;
			console.log('✅ [MUX_WEBRTC] Bridge started successfully:', this.bridgeId);
			
			return bridgeResponse;
		} catch (error) {
			console.error('❌ [MUX_WEBRTC] Bridge start error:', error);
			this.updateConnectionState({ 
				status: 'failed', 
				error: error instanceof Error ? error.message : 'Unknown error' 
			});
			throw error;
		}
	}

	/**
	 * Connect to Mux WebRTC endpoint with media stream
	 */
	async connectToMux(webrtcUrl: string, mediaStream: MediaStream): Promise<RTCPeerConnection> {
		console.log('🔗 [MUX_WEBRTC] Connecting to Mux WebRTC:', webrtcUrl);

		try {
			// Create RTCPeerConnection with Mux-optimized configuration
			this.peerConnection = new RTCPeerConnection({
				iceServers: [
					{ urls: 'stun:stun.mux.com:3478' },
					{ urls: 'stun:stun.cloudflare.com:3478' } // Fallback
				],
				iceCandidatePoolSize: 10
			});

			// Add media tracks to peer connection
			mediaStream.getTracks().forEach((track) => {
				if (this.peerConnection && mediaStream) {
					console.log('📡 [MUX_WEBRTC] Adding track:', track.kind);
					this.peerConnection.addTrack(track, mediaStream);
				}
			});

			// Set up connection monitoring
			this.monitorConnection(this.peerConnection);

			// Create and send offer to Mux
			const offer = await this.peerConnection.createOffer({
				offerToReceiveAudio: false,
				offerToReceiveVideo: false
			});
			
			await this.peerConnection.setLocalDescription(offer);
			console.log('📤 [MUX_WEBRTC] Sending offer to Mux...');

			// Send offer to Mux WebRTC endpoint
			const response = await fetch(webrtcUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/sdp'
				},
				body: offer.sdp
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Mux WebRTC connection failed: ${response.status} - ${errorText}`);
			}

			const answerSdp = await response.text();
			console.log('📥 [MUX_WEBRTC] Received answer from Mux');

			// Set remote description
			await this.peerConnection.setRemoteDescription({
				type: 'answer',
				sdp: answerSdp
			});

			console.log('✅ [MUX_WEBRTC] WebRTC connection established');
			return this.peerConnection;

		} catch (error) {
			console.error('❌ [MUX_WEBRTC] Connection error:', error);
			this.updateConnectionState({ 
				status: 'failed', 
				error: error instanceof Error ? error.message : 'Connection failed' 
			});
			throw error;
		}
	}

	/**
	 * Stop Mux bridge and clean up resources
	 */
	async stopBridge(): Promise<void> {
		console.log('🛑 [MUX_WEBRTC] Stopping bridge...');

		try {
			// Close peer connection
			if (this.peerConnection) {
				this.peerConnection.close();
				this.peerConnection = null;
			}

			// Stop bridge on server
			if (this.streamId) {
				const response = await fetch(`/api/streams/${this.streamId}/bridge/stop`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					}
				});

				if (!response.ok) {
					console.warn('⚠️ [MUX_WEBRTC] Bridge stop warning:', response.status);
					// Don't throw - cleanup should continue
				} else {
					console.log('✅ [MUX_WEBRTC] Bridge stopped successfully');
				}
			}

			// Reset state
			this.streamId = null;
			this.bridgeId = null;
			this.updateConnectionState({ status: 'disconnected' });

		} catch (error) {
			console.error('❌ [MUX_WEBRTC] Stop error:', error);
			// Still update state to disconnected
			this.updateConnectionState({ status: 'disconnected' });
		}
	}

	/**
	 * Monitor WebRTC connection state changes
	 */
	monitorConnection(peerConnection: RTCPeerConnection): void {
		peerConnection.onconnectionstatechange = () => {
			const state = peerConnection.connectionState;
			console.log('🔗 [MUX_WEBRTC] Connection state:', state);

			switch (state) {
				case 'connected':
					this.updateConnectionState({ 
						status: 'connected', 
						bridgeId: this.bridgeId || undefined,
						connectedAt: new Date().toISOString()
					});
					break;
				case 'disconnected':
				case 'failed':
					this.updateConnectionState({ 
						status: 'failed', 
						error: 'WebRTC connection lost' 
					});
					break;
				case 'connecting':
					this.updateConnectionState({ status: 'connecting' });
					break;
			}
		};

		peerConnection.oniceconnectionstatechange = () => {
			console.log('🧊 [MUX_WEBRTC] ICE connection state:', peerConnection.iceConnectionState);
		};

		peerConnection.onicegatheringstatechange = () => {
			console.log('🧊 [MUX_WEBRTC] ICE gathering state:', peerConnection.iceGatheringState);
		};

		// Log data channel events if any
		peerConnection.ondatachannel = (event) => {
			console.log('📡 [MUX_WEBRTC] Data channel:', event.channel.label);
		};
	}

	/**
	 * Get current connection state
	 */
	getConnectionState(): MuxConnectionState {
		return { ...this.connectionState };
	}

	/**
	 * Update connection state and notify listeners
	 */
	private updateConnectionState(newState: Partial<MuxConnectionState>): void {
		this.connectionState = { ...this.connectionState, ...newState };
		console.log('📊 [MUX_WEBRTC] State updated:', this.connectionState);
		
		if (this.onStateChange) {
			this.onStateChange(this.connectionState);
		}
	}

	/**
	 * Clean up all resources (call on component unmount)
	 */
	async cleanup(): Promise<void> {
		console.log('🧹 [MUX_WEBRTC] Cleaning up resources...');
		await this.stopBridge();
	}
}

/**
 * Factory function to create MuxWebRTC service instance
 */
export function createMuxWebRTCService(onStateChange?: (state: MuxConnectionState) => void): MuxWebRTCService {
	return new MuxWebRTCService(onStateChange);
}
