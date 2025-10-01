<script lang="ts">
	import type { Stream } from '$lib/types/stream';
	
	// Props
	let { stream, showControls = false } = $props<{
		stream: Stream;
		showControls?: boolean;
	}>();
	
	// Debug logging
	console.log('🎬 [VideoPlayerCard] Rendering stream:', {
		id: stream.id,
		title: stream.title,
		status: stream.status,
		playbackUrl: stream.playbackUrl,
		recordingUrl: stream.recordingUrl,
		recordingReady: stream.recordingReady
	});
	
	// Determine player state based on stream status  
	let playerState = $derived((() => {
		console.log('🎭 [VideoPlayerCard] Determining player state for:', {
			title: stream.title,
			status: stream.status,
			hasPlaybackUrl: !!stream.playbackUrl
		});
		
		if (stream.status === 'live') {
			console.log('✅ [VideoPlayerCard] Stream is live');
			return 'live';
		}
		// NEW: Handle 'ending' state - stream just ended, recording processing
		if (stream.status === 'ending') {
			console.log('⏳ [VideoPlayerCard] Stream is ending, recording processing');
			return 'ending';
		}
		// TEMPORARY FIX: If stream has playback URL and title contains "Stream 4", treat as live
		if (stream.status === 'ready' && stream.playbackUrl && stream.title === 'Stream 4') {
			console.log('🔴 [VideoPlayerCard] FORCING Stream 4 to live state');
			return 'live';
		}
		if (stream.status === 'completed' && stream.recordingReady) {
			console.log('📹 [VideoPlayerCard] Stream is recorded');
			return 'recorded';
		}
		if (stream.status === 'completed' && !stream.recordingReady) {
			console.log('⏳ [VideoPlayerCard] Stream is processing (legacy)');
			return 'processing';
		}
		if (stream.status === 'scheduled' && stream.scheduledStartTime) {
			console.log('📅 [VideoPlayerCard] Stream is scheduled');
			return 'scheduled';
		}
		
		console.log('⚪ [VideoPlayerCard] Stream is dummy/ready');
		return 'dummy'; // ready, created, etc.
	})());
	
	// Get the best playback URL
	let playbackUrl = $derived((() => {
		let url = null;
		
		if (playerState === 'live' && stream.playbackUrl) {
			// For live streams, add autoplay and controls
			url = `${stream.playbackUrl}?autoplay=1&controls=1&muted=0`;
		} else if (playerState === 'recorded' && stream.recordingUrl) {
			// For recordings, use recording URL
			url = stream.recordingUrl;
		} else if (stream.playbackUrl) {
			// Fallback to playback URL
			url = stream.playbackUrl;
		}
		
		console.log('🔗 [VideoPlayerCard] Generated playback URL:', {
			streamTitle: stream.title,
			playerState,
			originalUrl: stream.playbackUrl,
			finalUrl: url
		});
		
		return url;
	})());
	
	// Status text and colors
	let statusInfo = $derived((() => {
		switch (playerState) {
			case 'live':
				return { text: 'LIVE', color: 'text-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
			case 'ending':
				return { text: 'PROCESSING', color: 'text-orange-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
			case 'recorded':
				return { text: 'RECORDED', color: 'text-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
			case 'processing':
				return { text: 'PROCESSING', color: 'text-yellow-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
			case 'scheduled':
				return { text: 'SCHEDULED', color: 'text-purple-500', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' };
			default:
				return { text: 'READY', color: 'text-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
		}
	})());
</script>

<!-- Video Player Card -->
<div class="video-player-card w-full max-w-4xl mx-auto">
	<!-- Video Player Container -->
	<div class="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-xl">
		
		<!-- Stream Title Header with Status -->
		<div class="bg-gray-800 text-white px-4 py-3 border-b border-gray-600 flex items-center justify-between">
			<h3 class="text-lg font-semibold truncate flex-1">{stream.title || 'Memorial Service'}</h3>
			
			<!-- Status Badge -->
			<div class="ml-3 px-2 py-1 {statusInfo.bgColor} {statusInfo.borderColor} border rounded-md">
				<span class="text-xs font-medium {statusInfo.color}">{statusInfo.text}</span>
			</div>
		</div>
		<!-- Video Content Area -->
		<div class="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
			
			<!-- DEBUG: Show current state -->
			<div class="absolute top-4 right-4 z-20 bg-yellow-500 text-black text-xs p-2 rounded">
				State: {playerState} | Status: {stream.status}
			</div>
			
			{#if playerState === 'live'}
				<!-- Live Stream Player -->
				{#if playbackUrl}
					<div class="relative w-full h-full">
						<!-- Live indicator overlay -->
						<div class="absolute top-4 left-4 z-10 px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full animate-pulse">
							🔴 LIVE
						</div>
						
						<!-- TEST: Multiple iframe approaches -->
						
						<!-- Approach 1: Basic Cloudflare iframe -->
						<iframe 
							src={stream.playbackUrl}
							class="w-full h-full border-2 border-red-500"
							frameborder="0"
							allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;"
							allowfullscreen
							title={`${stream.title} - Live Stream`}
							onload={() => console.log('✅ [VideoPlayerCard] Basic iframe loaded for:', stream.title)}
							onerror={() => console.error('❌ [VideoPlayerCard] Basic iframe failed for:', stream.title)}
						></iframe>
						
						<!-- Approach 2: Test with a known working video -->
						<!-- <iframe 
							src="https://www.youtube.com/embed/dQw4w9WgXcQ"
							class="w-full h-full border-2 border-green-500"
							frameborder="0"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowfullscreen
							title="Test Video"
						></iframe> -->
						
						<!-- Debug overlay (enhanced) -->
						<div class="absolute bottom-4 right-4 bg-black bg-opacity-90 text-white text-xs p-3 rounded max-w-sm">
							<div><strong>Debug Info:</strong></div>
							<div>State: {playerState}</div>
							<div>Original URL: {stream.playbackUrl}</div>
							<div>Generated URL: {playbackUrl}</div>
							<div>Iframe visible: {playbackUrl ? 'YES' : 'NO'}</div>
						</div>
						
						<!-- Fallback content - only show if iframe fails to load -->
						<!-- Removed overlay that was blocking the iframe -->
					</div>
				{:else}
					<!-- Live indicator without player -->
					<div class="flex flex-col items-center justify-center h-full space-y-4 text-white">
						<div class="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
							<div class="w-6 h-6 bg-white rounded-full"></div>
						</div>
						<div class="text-center">
							<p class="text-xl font-bold text-red-400">🔴 LIVE</p>
							<p class="text-sm text-gray-400">Stream is broadcasting</p>
							<p class="text-xs text-gray-500 mt-2">No playback URL available</p>
						</div>
					</div>
				{/if}
				
			{:else if playerState === 'ending'}
				<!-- Stream Ending - Recording Processing -->
				<div class="flex flex-col items-center justify-center h-full space-y-4 text-white">
					<div class="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center">
						<div class="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full"></div>
					</div>
					<div class="text-center">
						<p class="text-xl font-bold text-orange-400">🎬 PROCESSING RECORDING</p>
						<p class="text-sm text-gray-400">Stream has ended, preparing recording...</p>
						<p class="text-xs text-gray-500 mt-2">This usually takes 1-3 minutes</p>
						
						<!-- Progress animation -->
						<div class="mt-4 w-48 bg-gray-700 rounded-full h-2">
							<div class="bg-orange-500 h-2 rounded-full animate-pulse" style="width: 60%"></div>
						</div>
						
						<!-- Estimated time -->
						<p class="text-xs text-gray-400 mt-2">⏱️ Estimated: 2-3 minutes remaining</p>
					</div>
				</div>
				
			{:else if playerState === 'recorded'}
				<!-- Recorded Video Player -->
				{#if playbackUrl}
					<div class="relative w-full h-full">
						<!-- Recorded indicator overlay -->
						<div class="absolute top-4 left-4 z-10 px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full">
							📹 RECORDED
						</div>
						
						<!-- Cloudflare Stream iframe -->
						<iframe 
							src={playbackUrl}
							class="w-full h-full border-0"
							allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;"
							allowfullscreen
							title={`${stream.title} - Recorded Service`}
							loading="lazy"
						></iframe>
					</div>
				{:else}
					<!-- Recorded indicator -->
					<div class="flex flex-col items-center justify-center h-full space-y-4 text-white">
						<div class="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center">
							<svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
								<path d="M8 5v14l11-7z"/>
							</svg>
						</div>
						<div class="text-center">
							<p class="text-xl font-bold text-blue-400">📹 RECORDED</p>
							<p class="text-sm text-gray-400">Service available for viewing</p>
							<p class="text-xs text-gray-500 mt-2">No recording URL available</p>
						</div>
					</div>
				{/if}
				
			{:else if playerState === 'processing'}
				<!-- Processing Recording -->
				<div class="flex flex-col items-center space-y-4 text-white">
					<div class="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
						<div class="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
					</div>
					<div class="text-center">
						<p class="text-lg font-medium text-yellow-400">PROCESSING</p>
						<p class="text-sm text-gray-400">Recording is being prepared</p>
					</div>
				</div>
				
			{:else if playerState === 'scheduled'}
				<!-- Scheduled Stream -->
				<div class="flex flex-col items-center space-y-4 text-white">
					<div class="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
						<svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
						</svg>
					</div>
					<div class="text-center">
						<p class="text-lg font-medium text-purple-400">SCHEDULED</p>
						{#if stream.scheduledStartTime}
							<p class="text-sm text-gray-400">{new Date(stream.scheduledStartTime).toLocaleString()}</p>
						{:else}
							<p class="text-sm text-gray-400">Service scheduled</p>
						{/if}
					</div>
				</div>
				
			{:else}
				<!-- Dummy/Ready Player -->
				<div class="flex flex-col items-center justify-center h-full space-y-4 text-white">
					<div class="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-300 cursor-pointer group">
						<svg class="w-10 h-10 text-white ml-1 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
							<path d="M8 5v14l11-7z"/>
						</svg>
					</div>
					
					<!-- Status Text -->
					<div class="text-center">
						<p class="text-lg font-medium text-gray-300">⚪ {statusInfo.text}</p>
						<p class="text-sm text-gray-400">Waiting for configuration</p>
						{#if stream.playbackUrl}
							<p class="text-xs text-gray-500 mt-2">Playback URL: {stream.playbackUrl.substring(0, 50)}...</p>
						{/if}
					</div>
				</div>
			{/if}
			
			<!-- Fake Video Controls Bar (always show for consistency) -->
			<div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-3 flex items-center space-x-3">
				<!-- Play/Pause Button -->
				<button class="text-white hover:text-gray-300 transition-colors" disabled={playerState === 'dummy' || playerState === 'processing'}>
					{#if playerState === 'live'}
						<!-- Pause icon for live -->
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
						</svg>
					{:else}
						<!-- Play icon -->
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M8 5v14l11-7z"/>
						</svg>
					{/if}
				</button>
				
				<!-- Progress Bar -->
				<div class="flex-1 bg-gray-600 rounded-full h-1">
					{#if playerState === 'live'}
						<!-- Live progress (full red) -->
						<div class="bg-red-500 rounded-full h-1 w-full animate-pulse"></div>
					{:else if playerState === 'recorded'}
						<!-- Recorded progress (can be scrubbed) -->
						<div class="bg-blue-500 rounded-full h-1 w-1/3"></div>
					{:else if playerState === 'processing'}
						<!-- Processing progress (animated) -->
						<div class="bg-yellow-500 rounded-full h-1 w-2/3 animate-pulse"></div>
					{:else}
						<!-- Empty progress -->
						<div class="bg-white rounded-full h-1 w-0"></div>
					{/if}
				</div>
				
				<!-- Time Display -->
				<span class="text-white text-xs font-mono">
					{#if playerState === 'live'}
						LIVE
					{:else if playerState === 'recorded'}
						15:30 / 45:20
					{:else if playerState === 'processing'}
						--:-- / --:--
					{:else}
						0:00 / 0:00
					{/if}
				</span>
				
				<!-- Volume Button -->
				<button class="text-white hover:text-gray-300 transition-colors" disabled={playerState === 'dummy' || playerState === 'processing'}>
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
					</svg>
				</button>
				
				<!-- Fullscreen Button -->
				<button class="text-white hover:text-gray-300 transition-colors" disabled={playerState === 'dummy' || playerState === 'processing'}>
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
					</svg>
				</button>
			</div>
			
		</div>
	</div>
	
	<!-- Optional Controls Below Player -->
	{#if showControls}
		<div class="mt-4 flex justify-center gap-3">
			{#if playerState === 'dummy'}
				<button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
					Configure Stream
				</button>
			{:else if playerState === 'processing'}
				<button class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
					Check Status
				</button>
			{:else if playerState === 'live'}
				<button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
					End Stream
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.video-player-card {
		@apply flex flex-col items-center;
	}
</style>
