<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users, Eye, Share2, Settings } from 'lucide-svelte';

  let { data } = $props();
  let memorialId = $page.params.memorialId;
  let streamKey = $page.url.searchParams.get('key');
  
  let isStreaming = $state(false);
  let isVideoEnabled = $state(true);
  let isAudioEnabled = $state(true);
  let viewerCount = $state(0);
  let streamDuration = $state(0);
  let memorial: any = $state(null);
  let error = $state('');
  let loading = $state(true);

  // WebRTC and streaming variables
  let localVideo: HTMLVideoElement;
  let localStream: MediaStream | null = null;
  let peerConnection: RTCPeerConnection | null = null;
  let streamInterval: ReturnType<typeof setInterval>;

  onMount(async () => {
    try {
      // Load memorial data
      const response = await fetch(`/api/memorials/${memorialId}`);
      if (response.ok) {
        memorial = await response.json();
      }

      // Initialize mobile streaming
      await initializeMobileStream();
      
    } catch (err) {
      error = 'Failed to initialize mobile stream';
      console.error('Mobile stream error:', err);
    } finally {
      loading = false;
    }
  });

  async function initializeMobileStream() {
    try {
      // Request camera and microphone permissions
      localStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', // Front camera by default
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      if (localVideo) {
        localVideo.srcObject = localStream;
      }

      // Set up WebRTC peer connection for Cloudflare Stream
      await setupWebRTCConnection();

    } catch (err) {
      error = 'Failed to access camera/microphone. Please grant permissions and try again.';
      console.error('Media access error:', err);
    }
  }

  async function setupWebRTCConnection() {
    try {
      // Create RTCPeerConnection
      peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.cloudflare.com:3478' },
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });

      // Add local stream to peer connection
      if (localStream) {
        localStream.getTracks().forEach(track => {
          peerConnection?.addTrack(track, localStream!);
        });
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to Cloudflare Stream
          console.log('ICE candidate:', event.candidate);
        }
      };

      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection?.connectionState);
        if (peerConnection?.connectionState === 'connected') {
          isStreaming = true;
          startStreamTimer();
        } else if (peerConnection?.connectionState === 'disconnected') {
          isStreaming = false;
          stopStreamTimer();
        }
      };

    } catch (err) {
      console.error('WebRTC setup error:', err);
    }
  }

  async function startStream() {
    if (!streamKey || !localStream) {
      error = 'Stream not properly initialized';
      return;
    }

    try {
      // Create offer for Cloudflare Stream
      const offer = await peerConnection?.createOffer();
      await peerConnection?.setLocalDescription(offer);

      // In a real implementation, you would send this offer to Cloudflare Stream
      // For now, we'll simulate starting the stream
      isStreaming = true;
      startStreamTimer();

      // Update memorial status
      await fetch(`/api/memorials/${memorialId}/stream/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isLive: true, 
          streamKey,
          platform: 'mobile'
        })
      });

    } catch (err) {
      error = 'Failed to start stream';
      console.error('Stream start error:', err);
    }
  }

  async function stopStream() {
    try {
      isStreaming = false;
      stopStreamTimer();

      // Close peer connection
      peerConnection?.close();
      
      // Stop local stream
      localStream?.getTracks().forEach(track => track.stop());

      // Update memorial status
      await fetch(`/api/memorials/${memorialId}/stream/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isLive: false, 
          streamKey,
          platform: 'mobile'
        })
      });

      // Redirect back to dashboard
      goto('/funeral-director/dashboard');

    } catch (err) {
      console.error('Stream stop error:', err);
    }
  }

  function toggleVideo() {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        isVideoEnabled = videoTrack.enabled;
      }
    }
  }

  function toggleAudio() {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        isAudioEnabled = audioTrack.enabled;
      }
    }
  }

  async function switchCamera() {
    try {
      const videoTrack = localStream?.getVideoTracks()[0];
      if (videoTrack) {
        const constraints = videoTrack.getConstraints();
        const currentFacingMode = constraints.facingMode;
        const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

        // Stop current video track
        videoTrack.stop();

        // Get new video stream
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: newFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        const newVideoTrack = newStream.getVideoTracks()[0];
        
        // Replace video track in local stream
        localStream?.removeTrack(videoTrack);
        localStream?.addTrack(newVideoTrack);

        // Update video element
        if (localVideo) {
          localVideo.srcObject = localStream;
        }

        // Replace track in peer connection
        const sender = peerConnection?.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }
    } catch (err) {
      console.error('Camera switch error:', err);
    }
  }

  function startStreamTimer() {
    streamInterval = setInterval(() => {
      streamDuration += 1;
    }, 1000);
  }

  function stopStreamTimer() {
    if (streamInterval) {
      clearInterval(streamInterval);
    }
  }

  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  async function shareStream() {
    if (navigator.share && memorial) {
      try {
        await navigator.share({
          title: `${memorial.lovedOneName || memorial.title} - Memorial Service`,
          text: 'Join us for this memorial service livestream',
          url: `${window.location.origin}/tributes/${memorial.slug || memorialId}`
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      const url = `${window.location.origin}/tributes/${memorial.slug || memorialId}`;
      navigator.clipboard.writeText(url);
      alert('Stream link copied to clipboard!');
    }
  }
</script>

<svelte:head>
  <title>Mobile Livestream - {memorial?.lovedOneName || 'Memorial Service'}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
</svelte:head>

<div class="min-h-screen bg-black text-white overflow-hidden">
  {#if loading}
    <div class="flex items-center justify-center h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p class="text-lg">Initializing mobile stream...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center h-screen p-4">
      <div class="text-center">
        <div class="text-red-400 text-6xl mb-4">⚠️</div>
        <h2 class="text-xl font-bold mb-2">Stream Error</h2>
        <p class="text-gray-300 mb-4">{error}</p>
        <button
          onclick={() => goto('/funeral-director/dashboard')}
          class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  {:else}
    <!-- Video Preview -->
    <div class="relative h-screen">
      <video
        bind:this={localVideo}
        autoplay
        muted
        playsinline
        class="w-full h-full object-cover"
      ></video>

      <!-- Stream Status Overlay -->
      <div class="absolute top-4 left-4 right-4 flex justify-between items-start">
        <div class="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 rounded-full {isStreaming ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}"></div>
            <span class="text-sm font-medium">
              {isStreaming ? 'LIVE' : 'READY'}
            </span>
            {#if isStreaming}
              <span class="text-xs text-gray-300">
                {formatDuration(streamDuration)}
              </span>
            {/if}
          </div>
          {#if memorial}
            <p class="text-xs text-gray-300 mt-1">
              {memorial.lovedOneName || memorial.title}
            </p>
          {/if}
        </div>

        <div class="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
          <div class="flex items-center space-x-2">
            <Eye class="w-4 h-4" />
            <span class="text-sm">{viewerCount}</span>
          </div>
        </div>
      </div>

      <!-- Control Panel -->
      <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
        <div class="flex justify-center items-center space-x-6 mb-4">
          <!-- Video Toggle -->
          <button
            onclick={toggleVideo}
            class="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 {isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}"
          >
            {#if isVideoEnabled}
              <Video class="w-6 h-6" />
            {:else}
              <VideoOff class="w-6 h-6" />
            {/if}
          </button>

          <!-- Main Stream Button -->
          <button
            onclick={isStreaming ? stopStream : startStream}
            class="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 {isStreaming ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} shadow-lg"
          >
            {#if isStreaming}
              <PhoneOff class="w-8 h-8" />
            {:else}
              <Phone class="w-8 h-8" />
            {/if}
          </button>

          <!-- Audio Toggle -->
          <button
            onclick={toggleAudio}
            class="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 {isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}"
          >
            {#if isAudioEnabled}
              <Mic class="w-6 h-6" />
            {:else}
              <MicOff class="w-6 h-6" />
            {/if}
          </button>
        </div>

        <!-- Secondary Controls -->
        <div class="flex justify-center items-center space-x-4">
          <button
            onclick={switchCamera}
            class="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all duration-200"
            title="Switch Camera"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onclick={shareStream}
            class="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-all duration-200"
            title="Share Stream"
          >
            <Share2 class="w-5 h-5" />
          </button>

          <button
            onclick={() => goto('/funeral-director/dashboard')}
            class="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all duration-200"
            title="Back to Dashboard"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>

        <!-- Stream Instructions -->
        {#if !isStreaming}
          <div class="text-center mt-4">
            <p class="text-sm text-gray-300">
              Tap the green button to start streaming
            </p>
            <p class="text-xs text-gray-400 mt-1">
              Make sure you have a stable internet connection
            </p>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  /* Prevent zoom on mobile */
  :global(body) {
    touch-action: manipulation;
  }
  
  /* Hide scrollbars */
  :global(html, body) {
    overflow: hidden;
  }
</style>
