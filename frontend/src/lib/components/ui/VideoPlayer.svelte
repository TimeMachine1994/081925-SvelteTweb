<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Play, Pause, Volume2, Maximize } from 'lucide-svelte';
  import { videoPlayerActions, getVideoPlayer } from '$lib/stores/videoPlayer';
  import type { VideoPlayerProps } from '$lib/types/homepage';
  
  let {
    src,
    poster,
    autoplay = false,
    muted = false,
    loop = false,
    controls = true,
    variant = 'standard',
    aspectRatio = '16:9',
    className = '',
    playerId = `video-${Math.random().toString(36).substr(2, 9)}`,
    onPlay,
    onPause,
    onTimeUpdate,
    onLoadedMetadata
  }: VideoPlayerProps = $props();
  
  let videoElement: HTMLVideoElement;
  let showControls = $state(false);
  let controlsTimeout: number;
  
  // Get player state from store
  const playerStore = getVideoPlayer(playerId);
  let playerState = $derived($playerStore?.state);
  
  // Format time helper
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Video event handlers
  function handlePlay() {
    videoPlayerActions.updateState(playerId, { isPlaying: true });
    videoPlayerActions.pauseOthers(playerId);
    onPlay?.();
  }
  
  function handlePause() {
    videoPlayerActions.updateState(playerId, { isPlaying: false });
    onPause?.();
  }
  
  function handleTimeUpdate() {
    if (videoElement) {
      const currentTime = videoElement.currentTime;
      videoPlayerActions.updateState(playerId, { currentTime });
      onTimeUpdate?.(currentTime);
    }
  }
  
  function handleLoadedMetadata() {
    if (videoElement) {
      const duration = videoElement.duration;
      videoPlayerActions.updateState(playerId, { 
        duration,
        isLoading: false,
        hasError: false
      });
      onLoadedMetadata?.(duration);
    }
  }
  
  function handleError() {
    videoPlayerActions.updateState(playerId, { 
      hasError: true,
      isLoading: false
    });
  }
  
  function handleLoadStart() {
    videoPlayerActions.updateState(playerId, { isLoading: true });
  }
  
  // Control handlers
  function togglePlayPause() {
    videoPlayerActions.togglePlayPause(playerId);
  }
  
  function handleSeek(event: Event) {
    const target = event.target as HTMLInputElement;
    const percentage = parseFloat(target.value) / 100;
    const time = percentage * (playerState?.duration || 0);
    videoPlayerActions.seek(playerId, time);
  }
  
  function handleVolumeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const volume = parseFloat(target.value) / 100;
    videoPlayerActions.setVolume(playerId, volume);
  }
  
  function handleFullscreen() {
    videoPlayerActions.fullscreen(playerId);
  }
  
  // Mouse/touch handlers for controls
  function showControlsTemporary() {
    showControls = true;
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
      if (!playerState?.isPlaying) return;
      showControls = false;
    }, 3000);
  }
  
  function onMouseEnter() {
    showControlsTemporary();
  }
  
  function onMouseMove() {
    showControlsTemporary();
  }
  
  function onMouseLeave() {
    if (playerState?.isPlaying) {
      showControls = false;
    }
  }
  
  // Lifecycle
  onMount(() => {
    if (videoElement) {
      videoPlayerActions.register(playerId, videoElement);
    }
  });
  
  onDestroy(() => {
    videoPlayerActions.unregister(playerId);
    clearTimeout(controlsTimeout);
  });
  
  // Computed classes
  let containerClasses = $derived(`
    relative overflow-hidden rounded-lg bg-black
    ${aspectRatio === '16:9' ? 'aspect-video' : ''}
    ${aspectRatio === '4:3' ? 'aspect-[4/3]' : ''}
    ${aspectRatio === 'square' ? 'aspect-square' : ''}
    ${variant === 'hero' ? 'shadow-2xl' : ''}
    ${variant === 'demo' ? 'shadow-lg' : ''}
    ${className}
  `.trim());
  
  let videoClasses = $derived(`
    w-full h-full object-cover
    ${variant === 'hero' ? 'scale-110' : ''}
  `.trim());
</script>

<div 
  class={containerClasses}
  onmouseenter={onMouseEnter}
  onmousemove={onMouseMove}
  onmouseleave={onMouseLeave}
>
  <!-- Video Element -->
  <video
    bind:this={videoElement}
    class={videoClasses}
    {src}
    {poster}
    {autoplay}
    {muted}
    {loop}
    preload="metadata"
    onplay={handlePlay}
    onpause={handlePause}
    ontimeupdate={handleTimeUpdate}
    onloadedmetadata={handleLoadedMetadata}
    onerror={handleError}
    onloadstart={handleLoadStart}
  >
    <track kind="captions" src="" srclang="en" label="English captions" default>
    Your browser does not support the video tag.
  </video>
  
  <!-- Loading State -->
  {#if playerState?.isLoading}
    <div class="absolute inset-0 flex items-center justify-center bg-black/50">
      <div class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  {/if}
  
  <!-- Error State -->
  {#if playerState?.hasError}
    <div class="absolute inset-0 flex items-center justify-center bg-black/75">
      <div class="text-white text-center">
        <p class="text-lg font-semibold mb-2">Video Error</p>
        <p class="text-sm opacity-75">Unable to load video</p>
      </div>
    </div>
  {/if}
  
  <!-- Play Button Overlay (when paused) -->
  {#if !playerState?.isPlaying && !playerState?.isLoading && !playerState?.hasError}
    <div class="absolute inset-0 flex items-center justify-center">
      <button
        onclick={togglePlayPause}
        class="w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
        aria-label="Play video"
      >
        <Play class="w-6 h-6 text-black ml-0.5" />
      </button>
    </div>
  {/if}
  
  <!-- Pause Button Overlay (when playing and hovering) -->
  {#if playerState?.isPlaying && showControls && controls}
    <div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/20">
      <button
        onclick={togglePlayPause}
        class="w-16 h-16 rounded-full bg-[#D5BA7F]/90 hover:bg-[#D5BA7F] flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
        aria-label="Pause video"
      >
        <Pause class="w-6 h-6 text-black" />
      </button>
    </div>
  {/if}
  
  <!-- Control Bar -->
  {#if controls && (showControls || !playerState?.isPlaying)}
    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 hover:opacity-100 transition-opacity duration-300">
      <div class="flex items-center gap-2 text-white text-sm">
        <!-- Play/Pause Button -->
        <button
          onclick={togglePlayPause}
          class="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          aria-label={playerState?.isPlaying ? 'Pause' : 'Play'}
        >
          {#if playerState?.isPlaying}
            <Pause class="w-3 h-3" />
          {:else}
            <Play class="w-3 h-3 ml-0.5" />
          {/if}
        </button>
        
        <!-- Time Display -->
        <span class="text-xs font-medium">
          {formatTime(playerState?.currentTime || 0)} / {formatTime(playerState?.duration || 0)}
        </span>
        
        <!-- Progress Bar -->
        <div class="flex-1 mx-2">
          <input
            type="range"
            min="0"
            max="100"
            value={playerState?.duration ? (playerState.currentTime / playerState.duration) * 100 : 0}
            onchange={handleSeek}
            class="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
        
        <!-- Volume Control -->
        <div class="flex items-center gap-1">
          <Volume2 class="w-4 h-4" />
          <input
            type="range"
            min="0"
            max="100"
            value={(playerState?.volume || 1) * 100}
            onchange={handleVolumeChange}
            class="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
        
        <!-- Fullscreen Button -->
        <button
          onclick={handleFullscreen}
          class="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          aria-label="Fullscreen"
        >
          <Maximize class="w-3 h-3" />
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom slider styling */
  :global(.slider) {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }
  
  :global(.slider::-webkit-slider-track) {
    background: rgba(255, 255, 255, 0.2);
    height: 4px;
    border-radius: 2px;
  }
  
  :global(.slider::-webkit-slider-thumb) {
    -webkit-appearance: none;
    appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #D5BA7F;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  :global(.slider::-moz-range-track) {
    background: rgba(255, 255, 255, 0.2);
    height: 4px;
    border-radius: 2px;
    border: none;
  }
  
  :global(.slider::-moz-range-thumb) {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #D5BA7F;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    -moz-appearance: none;
  }
</style>
