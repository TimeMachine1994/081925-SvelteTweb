<script lang="ts">
  import { onMount } from 'svelte';
  import type { MVPTwoStream } from '../../lib/types/streamTypes.js';
  import MVPTwoStatusIndicator from '../shared/MVPTwoStatusIndicator.svelte';

  export let stream: MVPTwoStream;
  export let autoplay: boolean = false;
  export let showControls: boolean = true;

  let videoElement: HTMLVideoElement;
  let hlsLoaded = false;
  let hlsError = false;

  $: isLive = stream.status === 'live';
  $: hasRecording = stream.recordingReady && stream.recordingPlaybackUrl;
  $: hasVideoId = !!stream.videoId;
  
  // Smart playback URL selection
  $: playbackUrl = (() => {
    if (isLive) {
      // For live streams, use iframe embed (HLS manifest often not ready)
      return null;
    } else if (stream.status === 'completed') {
      // For completed streams, use recorded URL or video ID based URL
      return stream.recordingPlaybackUrl || 
             (hasVideoId ? `https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/${stream.videoId}/manifest/video.m3u8` : null);
    }
    return stream.playbackUrl;
  })();
  
  // For live streams, use iframe embed (reliable for live content)
  $: iframeUrl = isLive && stream.cloudflareStreamId ? 
    `https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/${stream.cloudflareStreamId}/iframe` : null;
  
  $: streamType = isLive ? 'live' : 'recorded';
  $: canPlay = !!playbackUrl || !!iframeUrl;
  $: shouldUseIframe = isLive;

  onMount(async () => {
    // Wait for next tick to ensure videoElement is bound
    setTimeout(() => {
      if (playbackUrl && videoElement) {
        loadHLS();
      }
    }, 0);
  });

  async function loadHLS() {
    if (!playbackUrl || !videoElement) {
      console.log('🎥 [PLAYER DEBUG] Cannot load HLS - missing playbackUrl or videoElement:', {
        playbackUrl: !!playbackUrl,
        videoElement: !!videoElement,
        streamId: stream.id,
        streamTitle: stream.title
      });
      return;
    }

    console.log('🎥 [PLAYER DEBUG] Loading HLS for stream:', {
      streamId: stream.id,
      streamTitle: stream.title,
      playbackUrl,
      streamType,
      isLive,
      hasRecording,
      hasVideoId,
      canPlay,
      originalPlaybackUrl: stream.playbackUrl,
      recordingPlaybackUrl: stream.recordingPlaybackUrl,
      videoId: stream.videoId
    });

    try {
      // Try to load HLS.js dynamically
      const Hls = (await import('hls.js')).default;
      console.log('🎥 [PLAYER DEBUG] HLS.js loaded, checking support...');
      
      if (Hls.isSupported()) {
        console.log('🎥 [PLAYER DEBUG] HLS.js is supported, creating instance...');
        const hls = new Hls({
          debug: true,
          enableWorker: false
        });
        
        // Add event listeners for debugging
        hls.on(Hls.Events.MANIFEST_LOADING, () => {
          console.log('🎥 [HLS DEBUG] Manifest loading:', playbackUrl);
        });
        
        hls.on(Hls.Events.MANIFEST_LOADED, (event, data) => {
          console.log('🎥 [HLS DEBUG] Manifest loaded successfully:', data);
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('🚨 [HLS ERROR]:', data);
          if (data.fatal) {
            console.log('🎬 [PLAYER] Fatal HLS error, falling back to iframe for live stream');
            hlsError = true;
          }
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            console.error('🚨 [HLS NETWORK ERROR] - Likely CORS issue or manifest not ready:', data);
          }
        });
        
        hls.loadSource(playbackUrl);
        hls.attachMedia(videoElement);
        hlsLoaded = true;
        console.log('🎥 [PLAYER DEBUG] HLS setup complete');
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        console.log('🎥 [PLAYER DEBUG] Using native HLS support (Safari)');
        videoElement.src = playbackUrl;
        hlsLoaded = true;
      } else {
        console.warn('🎥 [PLAYER DEBUG] HLS not supported, falling back to direct video');
        videoElement.src = playbackUrl;
      }
    } catch (error) {
      console.error('🚨 [PLAYER ERROR] Failed to load HLS:', error);
      console.log('🎥 [PLAYER DEBUG] Falling back to direct video src');
      videoElement.src = playbackUrl;
    }
  }

  // Reactive statement to reload HLS when playback URL changes
  $: if (playbackUrl && videoElement && !hlsLoaded) {
    loadHLS();
  }
</script>

<div class="bg-white rounded-lg shadow-md overflow-hidden">
  <!-- Video Player -->
  <div class="relative aspect-video bg-black">
    {#if canPlay}
      {#if shouldUseIframe && iframeUrl}
        <!-- Live stream iframe embed (primary for live or HLS fallback) -->
        <iframe
          src={iframeUrl}
          class="w-full h-full border-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowfullscreen
          title="Live Stream: {stream.title}"
        ></iframe>
      {:else if playbackUrl}
        <!-- HLS video player (recorded or live if working) -->
        <video
          bind:this={videoElement}
          controls={showControls}
          {autoplay}
          class="w-full h-full"
          poster={stream.thumbnailUrl}
        >
          <track kind="captions" />
        </video>
      {/if}
      
      <!-- Debug overlay (only in development) -->
      {#if typeof window !== 'undefined' && window.location.hostname === 'localhost'}
        <div class="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          <div>Type: {streamType}</div>
          <div>Method: {shouldUseIframe ? 'iframe' : 'HLS'}</div>
          <div>URL: {(playbackUrl || iframeUrl) ? 'Available' : 'Missing'}</div>
          {#if stream.videoId}
            <div>Video ID: {stream.videoId.slice(0, 8)}...</div>
          {/if}
          {#if stream.cloudflareStreamId}
            <div>CF ID: {stream.cloudflareStreamId.slice(0, 8)}...</div>
          {/if}
        </div>
      {/if}
    {:else}
      <!-- Placeholder for scheduled/unavailable streams -->
      <div class="flex items-center justify-center h-full text-white bg-gradient-to-br from-gray-800 to-gray-900">
        <div class="text-center p-8">
          {#if stream.status === 'scheduled'}
            <div class="text-6xl mb-4">⏰</div>
            <h3 class="text-xl font-semibold mb-2">Stream Scheduled</h3>
            <p class="text-gray-300">This memorial service will begin soon</p>
            {#if stream.scheduledStartTime}
              <p class="text-sm text-gray-400 mt-2">
                Scheduled: {new Date(stream.scheduledStartTime).toLocaleString()}
              </p>
            {/if}
          {:else if stream.status === 'completed' && !hasRecording && !hasVideoId}
            <div class="text-6xl mb-4">📼</div>
            <h3 class="text-xl font-semibold mb-2">Recording Processing</h3>
            <p class="text-gray-300">The recording will be available shortly</p>
          {:else if !playbackUrl}
            <div class="text-6xl mb-4">⚠️</div>
            <h3 class="text-xl font-semibold mb-2">Playback Issue</h3>
            <p class="text-gray-300">Unable to load video stream</p>
            <p class="text-xs text-gray-400 mt-2">Please try refreshing the page</p>
          {:else}
            <div class="text-6xl mb-4">📹</div>
            <h3 class="text-xl font-semibold mb-2">Stream Unavailable</h3>
            <p class="text-gray-300">This stream is not currently available</p>
          {/if}
        </div>
      </div>
    {/if}
    
    <!-- Live indicator -->
    {#if isLive}
      <div class="absolute top-4 left-4">
        <MVPTwoStatusIndicator status="live" size="sm" />
      </div>
    {/if}
  </div>

  <!-- Stream Info -->
  <div class="p-4">
    <h3 class="text-lg font-semibold mb-2">{stream.title}</h3>
    {#if stream.description}
      <p class="text-gray-600 mb-2">{stream.description}</p>
    {/if}
    
    <div class="flex items-center justify-between text-sm text-gray-500">
      <MVPTwoStatusIndicator status={stream.status} size="sm" />
      {#if stream.viewerCount}
        <span>{stream.viewerCount} viewers</span>
      {/if}
    </div>
  </div>
</div>
