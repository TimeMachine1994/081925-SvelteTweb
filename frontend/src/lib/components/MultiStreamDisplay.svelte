<script lang="ts">
	import VideoPlayerCard from './VideoPlayerCard.svelte';
	import RecordingPlayerCard from './RecordingPlayerCard.svelte';
	
	// Props
	let { 
		liveStreams = [], 
		recordings = [],
		memorialId = null,
		showControls = false 
	} = $props<{
		liveStreams?: any[];
		recordings?: any[];
		memorialId?: string | null;
		showControls?: boolean;
	}>();

	// Debug logging
	console.log('🎬 [MultiStreamDisplay] Rendering:', {
		liveStreams: liveStreams.length,
		recordings: recordings.length,
		memorialId
	});

	// Auto-refresh recordings every 30 seconds to check for new ones
	let recordingsRefreshInterval: NodeJS.Timeout | null = null;
	let isRefreshing = $state(false);

	async function refreshRecordings() {
		if (!memorialId || isRefreshing) return;
		
		isRefreshing = true;
		console.log('🔄 [MultiStreamDisplay] Refreshing recordings for all streams...');
		
		try {
			let newRecordingsFound = false;
			
			// Check all streams for new recordings, not just live ones
			const allStreams = [...liveStreams];
			
			// If no live streams, we need to get all streams from the memorial
			if (allStreams.length === 0) {
				console.log('⚠️ [MultiStreamDisplay] No live streams, fetching all memorial streams...');
				const streamsResponse = await fetch(`/api/memorials/${memorialId}/streams`);
				if (streamsResponse.ok) {
					const streamsData = await streamsResponse.json();
					allStreams.push(...(streamsData.allStreams || []));
				}
			}

			for (const stream of allStreams) {
				if (!stream?.id) continue;
				
				try {
					const response = await fetch(`/api/streams/${stream.id}/recordings`, {
						method: 'POST'
					});

					if (response.ok) {
						const result = await response.json();
						console.log('✅ [MultiStreamDisplay] Recordings refreshed for', stream.title, ':', {
							totalRecordings: result.totalRecordings,
							newRecordingsAdded: result.newRecordingsAdded
						});

						// Track if any new recordings were found
						if (result.newRecordingsAdded > 0) {
							newRecordingsFound = true;
						}
					}
				} catch (streamError) {
					console.error('❌ [MultiStreamDisplay] Failed to refresh recordings for stream:', stream.id, streamError);
				}
			}

			// If new recordings were added, reload the page to show them
			if (newRecordingsFound) {
				console.log('🎉 [MultiStreamDisplay] New recordings detected, reloading page...');
				window.location.reload();
			}
		} catch (error) {
			console.error('❌ [MultiStreamDisplay] Failed to refresh recordings:', error);
		} finally {
			isRefreshing = false;
		}
	}

	// Set up auto-refresh when component mounts
	$effect(() => {
		if (memorialId && liveStreams.length > 0) {
			console.log('⏰ [MultiStreamDisplay] Setting up auto-refresh for recordings');
			recordingsRefreshInterval = setInterval(refreshRecordings, 30000); // 30 seconds
			
			return () => {
				if (recordingsRefreshInterval) {
					clearInterval(recordingsRefreshInterval);
					recordingsRefreshInterval = null;
				}
			};
		}
	});
</script>

<!-- Multi-Stream Display Container -->
<div class="multi-stream-display w-full">
	
	<!-- Header with Stream Count -->
	<div class="mb-6 text-center">
		<h2 class="text-2xl font-bold text-gray-800 mb-2">Memorial Service</h2>
		<div class="flex items-center justify-center gap-4 text-sm text-gray-600">
			{#if liveStreams.length > 0}
				<span class="px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">
					🔴 {liveStreams.length} Live Stream{liveStreams.length > 1 ? 's' : ''}
				</span>
			{/if}
			{#if recordings.length > 0}
				<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
					📹 {recordings.length} Recording{recordings.length > 1 ? 's' : ''}
				</span>
			{/if}
			{#if isRefreshing}
				<span class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">
					🔄 Checking for new recordings...
				</span>
			{/if}
		</div>
	</div>

	<!-- Live Streams Section -->
	{#if liveStreams.length > 0}
		<div class="live-streams-section mb-8">
			<h3 class="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
				🔴 Live Stream{liveStreams.length > 1 ? 's' : ''}
				<span class="animate-pulse text-red-500">●</span>
			</h3>
			
			<div class="flex flex-col gap-6">
				{#each liveStreams as stream (stream.id)}
					<VideoPlayerCard {stream} {showControls} />
				{/each}
			</div>
		</div>
	{/if}

	<!-- Recordings Section -->
	{#if recordings.length > 0}
		<div class="recordings-section">
			<h3 class="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
				📹 Service Recordings
				<span class="text-sm font-normal text-gray-600">
					({recordings.length} segment{recordings.length > 1 ? 's' : ''})
				</span>
			</h3>
			
			<div class="flex flex-col gap-6">
				{#each recordings as recording (recording.id)}
					<RecordingPlayerCard {recording} />
				{/each}
			</div>
		</div>
	{/if}

	<!-- Empty State -->
	{#if liveStreams.length === 0 && recordings.length === 0}
		<div class="empty-state text-center py-12">
			<div class="text-gray-400 mb-4">
				<svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
				</svg>
			</div>
			<h3 class="text-lg font-medium text-gray-600 mb-2">No streams available</h3>
			<p class="text-gray-500">The memorial service will appear here when it begins.</p>
		</div>
	{/if}

	<!-- Manual Refresh Button (for testing) -->
	{#if memorialId}
		<div class="mt-8 text-center">
			<button 
				class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
				onclick={refreshRecordings}
				disabled={isRefreshing}
			>
				{isRefreshing ? '🔄 Checking...' : '🔄 Check for New Recordings'}
			</button>
		</div>
	{/if}
</div>

<style>
	.multi-stream-display {
		@apply max-w-6xl mx-auto px-4;
	}
</style>
