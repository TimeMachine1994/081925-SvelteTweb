<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import MVPTwoButton from '../shared/MVPTwoButton.svelte';
  import { WHIPStreamer } from '../../lib/whip.js';
  
  export let whipEndpoint: string = '';
  export let canStartStream: boolean = false;
  
  const dispatch = createEventDispatcher();
  let whipStreamer = new WHIPStreamer();
  
  let videoElement: HTMLVideoElement;
  let localStream: MediaStream | null = null;
  let cameraConnected = false;
  let connectingCamera = false;
  let cameraError = '';
  let streaming = false;
  let startingStream = false;
  
  // Reactive statement to set video source when element becomes available
  $: if (videoElement && localStream && cameraConnected) {
    videoElement.srcObject = localStream;
    videoElement.play().catch(err => console.error('Video play error:', err));
  }
  
  async function connectCamera() {
    connectingCamera = true;
    cameraError = '';
    
    try {
      console.log('Requesting camera access...');
      localStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280, max: 1280 },
          height: { ideal: 720, max: 720 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000
        }
      });
      
      console.log('Camera access granted, stream:', localStream);
      cameraConnected = true;
      dispatch('cameraConnected');
    } catch (err) {
      console.error('Camera error:', err);
      cameraError = err instanceof Error ? err.message : 'Failed to access camera';
      
      // Reset state on error
      cameraConnected = false;
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
      }
    } finally {
      connectingCamera = false;
    }
  }
  
  function disconnectCamera() {
    if (streaming) {
      stopStream();
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    cameraConnected = false;
    dispatch('cameraDisconnected');
  }

  async function startStream() {
    if (!localStream || !whipEndpoint) return;
    
    startingStream = true;
    cameraError = ''; // Clear previous errors
    
    try {
      console.log('Starting WHIP stream to:', whipEndpoint);
      await whipStreamer.startStream(localStream, whipEndpoint);
      console.log('WHIP stream started successfully');
      streaming = true;
      dispatch('streamStarted');
    } catch (err) {
      console.error('WHIP streaming error:', err);
      cameraError = `Failed to start stream: ${err.message}`;
      streaming = false; // Ensure streaming is false on error
    } finally {
      startingStream = false;
    }
  }

  async function stopStream() {
    console.log('🛑 [CAMERA PREVIEW] Stopping stream...');
    
    // Stop the WHIP connection locally
    whipStreamer.stopStream();
    streaming = false;
    
    // Extract stream ID from whipEndpoint (works for both old and new formats)
    let streamId;
    if (whipEndpoint.includes('/api/streams/')) {
      // New unified format: /api/streams/[id]/whip
      streamId = whipEndpoint.split('/').slice(-2, -1)[0];
    } else {
      // Legacy format: /api/livestreamMVPTwo/streams/[id]/whip
      streamId = whipEndpoint.split('/').slice(-2, -1)[0];
    }
    
    if (streamId) {
      try {
        console.log('📡 [CAMERA PREVIEW] Calling unified stop API for stream:', streamId);
        
        // Call the unified stop API endpoint to update Firestore
        const response = await fetch(`/api/streams/${streamId}/stop`, {
          method: 'POST'
        });
        
        if (response.ok) {
          console.log('✅ [CAMERA PREVIEW] Stream stopped successfully via API');
        } else {
          console.error('❌ [CAMERA PREVIEW] Failed to stop stream via API:', response.status);
        }
      } catch (error) {
        console.error('❌ [CAMERA PREVIEW] Error calling stop API:', error);
      }
    } else {
      console.warn('⚠️ [CAMERA PREVIEW] Could not extract stream ID from whipEndpoint:', whipEndpoint);
    }
    
    dispatch('streamStopped');
  }
</script>

<div class="relative aspect-video bg-black rounded-lg overflow-hidden">
  {#if cameraConnected}
    <video bind:this={videoElement} autoplay muted playsinline class="w-full h-full object-cover">
      <track kind="captions" />
    </video>
    <div class="absolute top-3 left-3">
      {#if streaming}
        <span class="bg-red-600 text-white px-2 py-1 rounded text-xs animate-pulse">🔴 LIVE</span>
      {:else}
        <span class="bg-green-600 text-white px-2 py-1 rounded text-xs">🎥 CAMERA</span>
      {/if}
    </div>
    <div class="absolute bottom-3 right-3 flex gap-2">
      {#if !streaming && canStartStream}
        <MVPTwoButton size="sm" onclick={startStream} loading={startingStream}>
          {startingStream ? 'Starting...' : 'Go Live'}
        </MVPTwoButton>
      {:else if streaming}
        <MVPTwoButton size="sm" variant="danger" onclick={stopStream}>
          Stop
        </MVPTwoButton>
      {/if}
      <MVPTwoButton size="sm" variant="secondary" onclick={disconnectCamera}>
        Disconnect
      </MVPTwoButton>
    </div>
  {:else}
    <div class="flex items-center justify-center h-full text-white">
      <div class="text-center">
        <div class="text-4xl mb-3">📹</div>
        <h3 class="text-lg font-semibold mb-3">Connect Your Camera</h3>
        
        {#if cameraError}
          <div class="mb-4 p-3 bg-red-600 bg-opacity-20 border border-red-400 rounded text-red-200 text-sm">
            <p class="font-medium">Camera Error:</p>
            <p>{cameraError}</p>
          </div>
        {/if}
        
        <MVPTwoButton onclick={connectCamera} loading={connectingCamera}>
          {connectingCamera ? 'Connecting...' : 'Connect Camera'}
        </MVPTwoButton>
        
        {#if cameraError}
          <p class="text-xs text-gray-400 mt-2">
            Make sure to allow camera permissions when prompted
          </p>
        {/if}
      </div>
    </div>
  {/if}
</div>
