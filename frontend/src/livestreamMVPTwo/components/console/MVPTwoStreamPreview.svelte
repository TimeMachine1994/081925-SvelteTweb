<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import MVPTwoButton from '../shared/MVPTwoButton.svelte';
  import type { MVPTwoStream } from '../../lib/types/streamTypes.js';
  
  export let stream: MVPTwoStream;
  
  const dispatch = createEventDispatcher();
  
  let videoElement: HTMLVideoElement;
  let localStream: MediaStream | null = null;
  let cameraConnected = false;
  let connectingCamera = false;
  let cameraError = '';
  
  $: isLive = stream.status === 'live';
  $: hasPlaybackUrl = stream.playbackUrl || stream.recordingPlaybackUrl;
  $: previewUrl = isLive ? stream.playbackUrl : stream.recordingPlaybackUrl;
  
  async function connectCamera() {
    connectingCamera = true;
    cameraError = '';
    
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      if (videoElement) {
        videoElement.srcObject = localStream;
      }
      
      cameraConnected = true;
      dispatch('cameraConnected', { stream: localStream });
    } catch (err) {
      console.error('Error accessing camera:', err);
      cameraError = 'Failed to access camera. Please check permissions.';
    } finally {
      connectingCamera = false;
    }
  }
  
  function disconnectCamera() {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    cameraConnected = false;
    dispatch('cameraDisconnected');
  }
</script>

<div class="relative aspect-video bg-black rounded-lg overflow-hidden">
  {#if hasPlaybackUrl && isLive}
    <!-- Live Preview -->
    <video
      src={previewUrl}
      autoplay
      muted
      class="w-full h-full object-cover"
    >
      <track kind="captions" />
    </video>
    
    <!-- Live Indicator -->
    <div class="absolute top-3 left-3">
      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white">
        <span class="w-2 h-2 bg-white rounded-full mr-1.5 animate-pulse"></span>
        LIVE
      </span>
    </div>
    
    <!-- Viewer Count (Mock) -->
    <div class="absolute top-3 right-3">
      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black bg-opacity-50 text-white">
        👁️ {stream.viewerCount || 0}
      </span>
    </div>
  {:else}
    <!-- Preview Placeholder -->
    <div class="flex items-center justify-center h-full text-white bg-gradient-to-br from-gray-700 to-gray-900">
      <div class="text-center">
        {#if stream.status === 'scheduled'}
          <div class="text-4xl mb-3">📹</div>
          <h3 class="text-lg font-semibold mb-2">Ready to Stream</h3>
          <p class="text-gray-300 text-sm">Your stream will appear here when you start broadcasting</p>
        {:else if stream.status === 'completed'}
          <div class="text-4xl mb-3">📼</div>
          <h3 class="text-lg font-semibold mb-2">Stream Ended</h3>
          <p class="text-gray-300 text-sm">Recording is being processed</p>
        {:else}
          <div class="text-4xl mb-3">⏸️</div>
          <h3 class="text-lg font-semibold mb-2">Stream Offline</h3>
          <p class="text-gray-300 text-sm">Start your streaming software to see preview</p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Preview Controls -->
<div class="mt-4 flex justify-between items-center text-sm text-gray-600">
  <div class="flex items-center gap-4">
    <span>Quality: {isLive ? 'Auto' : 'N/A'}</span>
    <span>Latency: {isLive ? '~3s' : 'N/A'}</span>
  </div>
  <div class="flex items-center gap-2">
    {#if isLive}
      <span class="w-2 h-2 bg-green-500 rounded-full"></span>
      <span>Connected</span>
    {:else}
      <span class="w-2 h-2 bg-gray-400 rounded-full"></span>
      <span>Disconnected</span>
    {/if}
  </div>
</div>
