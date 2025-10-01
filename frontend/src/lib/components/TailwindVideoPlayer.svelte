<script lang="ts">
	// Props
	let { stream, showTitle = true } = $props();
	
	// Derived state for player mode
	let playerState = $derived(() => {
		if (stream.status === 'live') return 'live';
		if (stream.status === 'completed' && stream.recordingReady) return 'recorded';
		if (stream.status === 'completed' && !stream.recordingReady) return 'processing';
		if (stream.status === 'scheduled' && stream.scheduledStartTime) return 'scheduled';
		return 'dummy'; // Default state for created/unscheduled streams
	});
	
	console.log('🎥 [TAILWIND_PLAYER] Stream state:', {
		id: stream.id,
		title: stream.title,
		status: stream.status,
		playerState
	});
</script>

<!-- Video Player Container: 1/3 viewport width and height -->
<div class="w-[33vw] h-[33vh] mx-auto bg-black rounded-lg overflow-hidden shadow-lg">
	
	{#if showTitle}
		<!-- Stream Title Above Player -->
		<div class="bg-gray-800 text-white px-4 py-2">
			<h3 class="text-lg font-semibold truncate">{stream.title || 'Memorial Service'}</h3>
		</div>
	{/if}
	
	<!-- Video Content Area -->
	<div class="relative w-full h-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
		
		{#if playerState === 'dummy'}
			<!-- DUMMY STATE: Fake video player with play button -->
			<div class="flex flex-col items-center justify-center text-white space-y-4">
				<!-- Large Play Button -->
				<div class="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all cursor-pointer">
					<svg class="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
						<path d="M8 5v14l11-7z"/>
					</svg>
				</div>
				
				<!-- Status Text -->
				<div class="text-center">
					<p class="text-sm text-gray-300">Stream Ready</p>
					<p class="text-xs text-gray-400">Click to start when ready</p>
				</div>
			</div>
			
		{:else if playerState === 'live'}
			<!-- LIVE STATE: Actual video iframe -->
			<iframe 
				src={stream.playbackUrl || `https://cloudflarestream.com/${stream.cloudflareId}/iframe`}
				class="w-full h-full"
				allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
				allowfullscreen
				title={stream.title || 'Live Stream'}
			></iframe>
			
		{:else if playerState === 'recorded'}
			<!-- RECORDED STATE: Recorded video iframe -->
			<iframe 
				src={stream.recordingUrl || stream.playbackUrl || `https://cloudflarestream.com/${stream.cloudflareId}/iframe`}
				class="w-full h-full"
				allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
				allowfullscreen
				title={stream.title || 'Recorded Stream'}
			></iframe>
			
		{:else if playerState === 'processing'}
			<!-- PROCESSING STATE: Loading spinner -->
			<div class="flex flex-col items-center justify-center text-white space-y-4">
				<div class="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
				<div class="text-center">
					<p class="text-sm text-gray-300">Processing Recording</p>
					<p class="text-xs text-gray-400">This usually takes 1-5 minutes</p>
				</div>
			</div>
			
		{:else if playerState === 'scheduled'}
			<!-- SCHEDULED STATE: Countdown timer -->
			<div class="flex flex-col items-center justify-center text-white space-y-4">
				<div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
					<svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
					</svg>
				</div>
				<div class="text-center">
					<p class="text-sm text-gray-300">Scheduled Stream</p>
					<p class="text-xs text-gray-400">Starts at scheduled time</p>
				</div>
			</div>
		{/if}
		
	</div>
</div>
