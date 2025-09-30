export class WHIPStreamer {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;

  async startStream(stream: MediaStream, whipEndpoint: string): Promise<void> {
    console.log('🎬 [WHIP] Starting stream to', whipEndpoint);
    this.localStream = stream;
    
    // Create RTCPeerConnection with enhanced STUN/TURN configuration
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Add public TURN servers for better NAT traversal
        { 
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject', 
          credential: 'openrelayproject'
        }
      ],
      iceCandidatePoolSize: 10  // Generate more ICE candidates
    });

    // Add connection state monitoring
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      console.log('🧊 [WHIP] ICE Connection State:', state);
      
      if (state === 'failed' || state === 'disconnected') {
        console.error('❌ [WHIP] ICE Connection failed/disconnected');
      } else if (state === 'connected' || state === 'completed') {
        console.log('✅ [WHIP] ICE Connection established - data should be flowing');
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('🔗 [WHIP] Connection State:', state);
      
      if (state === 'failed') {
        console.error('❌ [WHIP] WebRTC Connection failed');
      } else if (state === 'connected') {
        console.log('✅ [WHIP] WebRTC Connection established');
      }
    };

    // Monitor data channel and stats
    this.peerConnection.onstatsended = () => {
      console.log('📊 [WHIP] Stats available');
    };

    // Add tracks to peer connection with enhanced configuration
    stream.getTracks().forEach(track => {
      console.log('🎵 [WHIP] Adding track:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
      
      // Log track settings
      if (track.kind === 'video') {
        const videoTrack = track as MediaStreamTrack;
        const settings = videoTrack.getSettings();
        console.log('📹 [WHIP] Video track settings:', {
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate,
          facingMode: settings.facingMode
        });
      } else if (track.kind === 'audio') {
        const audioTrack = track as MediaStreamTrack;
        const settings = audioTrack.getSettings();
        console.log('🎤 [WHIP] Audio track settings:', {
          sampleRate: settings.sampleRate,
          channelCount: settings.channelCount,
          echoCancellation: settings.echoCancellation
        });
      }
      
      this.peerConnection!.addTrack(track, stream);
    });

    // Create offer with explicit constraints
    console.log('🤝 [WHIP] Creating offer');
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: false,  // We're only sending, not receiving
      offerToReceiveVideo: false
    });
    
    console.log('📋 [WHIP] SDP Offer created:', {
      type: offer.type,
      sdpLength: offer.sdp?.length,
      hasVideo: offer.sdp?.includes('m=video'),
      hasAudio: offer.sdp?.includes('m=audio'),
      codecs: {
        video: offer.sdp?.match(/a=rtpmap:\d+ ([^\/\s]+)/g)?.filter(c => c.includes('video')) || [],
        audio: offer.sdp?.match(/a=rtpmap:\d+ ([^\/\s]+)/g)?.filter(c => c.includes('audio')) || []
      }
    });
    
    await this.peerConnection.setLocalDescription(offer);

    // Send offer to WHIP endpoint
    console.log('WHIPStreamer: Sending offer to', whipEndpoint);
    const response = await fetch(whipEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp'
      },
      body: offer.sdp
    });

    console.log('WHIPStreamer: Response status', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('WHIPStreamer: Error response', errorText);
      throw new Error(`WHIP request failed: ${response.status} - ${errorText}`);
    }

    // Set remote description from response
    const answerSdp = await response.text();
    console.log('📨 [WHIP] Received SDP answer:', {
      length: answerSdp.length,
      hasVideo: answerSdp.includes('m=video'),
      hasAudio: answerSdp.includes('m=audio'),
      preview: answerSdp.substring(0, 200) + '...'
    });
    
    await this.peerConnection.setRemoteDescription({
      type: 'answer',
      sdp: answerSdp
    });
    
    console.log('✅ [WHIP] Stream started successfully');
    
    // Start monitoring connection stats
    this.startStatsMonitoring();
  }

  private startStatsMonitoring(): void {
    if (!this.peerConnection) return;
    
    let lastVideoBytes = 0;
    let lastAudioBytes = 0;
    let lastTimestamp = Date.now();
    
    const checkStats = async () => {
      if (!this.peerConnection || this.peerConnection.connectionState === 'closed') return;
      
      try {
        const stats = await this.peerConnection.getStats();
        let videoBytesSent = 0;
        let audioBytesSent = 0;
        let packetsLost = 0;
        let videoFrameRate = 0;
        let videoResolution = '';
        
        stats.forEach(report => {
          if (report.type === 'outbound-rtp') {
            if (report.kind === 'video') {
              videoBytesSent = report.bytesSent || 0;
              videoFrameRate = report.framesPerSecond || 0;
            } else if (report.kind === 'audio') {
              audioBytesSent = report.bytesSent || 0;
            }
            packetsLost += report.packetsLost || 0;
          } else if (report.type === 'track' && report.kind === 'video') {
            videoResolution = `${report.frameWidth}x${report.frameHeight}`;
          }
        });
        
        // Calculate bitrate based on bytes sent since last check
        const currentTime = Date.now();
        const timeDiff = (currentTime - lastTimestamp) / 1000; // seconds
        
        let videoBitrate = 0;
        let audioBitrate = 0;
        
        if (timeDiff > 0 && lastTimestamp > 0) {
          const videoBytesDiff = videoBytesSent - lastVideoBytes;
          const audioBytesDiff = audioBytesSent - lastAudioBytes;
          
          videoBitrate = Math.round((videoBytesDiff * 8) / timeDiff); // bits per second
          audioBitrate = Math.round((audioBytesDiff * 8) / timeDiff); // bits per second
        }
        
        // Update last values for next calculation
        lastVideoBytes = videoBytesSent;
        lastAudioBytes = audioBytesSent;
        lastTimestamp = currentTime;
        
        if (videoBytesSent > 0 || audioBytesSent > 0) {
          console.log('📊 [WHIP] Stream Quality:', {
            videoBytes: videoBytesSent,
            audioBytes: audioBytesSent,
            videoBitrate: `${Math.round(videoBitrate / 1000)} kbps`,
            audioBitrate: `${Math.round(audioBitrate / 1000)} kbps`,
            videoFPS: videoFrameRate,
            resolution: videoResolution || 'Unknown'
          });
        } else {
          console.warn('⚠️ [WHIP] No data flowing - check connection');
        }
        
        if (packetsLost > 0) {
          console.warn('📉 [WHIP] Packets lost:', packetsLost);
        }
        
      } catch (error) {
        console.error('❌ [WHIP] Stats error:', error);
      }
    };
    
    // Check stats every 5 seconds
    const statsInterval = setInterval(checkStats, 5000);
    
    // Clean up interval when connection closes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('🔗 [WHIP] Connection State:', state);
      
      if (state === 'failed' || state === 'closed') {
        clearInterval(statsInterval);
        console.error('❌ [WHIP] WebRTC Connection failed/closed');
      } else if (state === 'connected') {
        console.log('✅ [WHIP] WebRTC Connection established');
      }
    };
  }

  stopStream(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }
}
