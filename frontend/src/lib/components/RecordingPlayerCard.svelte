<script lang="ts">
	// Props
	let { recording } = $props<{
		recording: {
			id: string;
			cloudflareVideoId: string;
			recordingUrl: string;
			playbackUrl: string;
			duration: number;
			createdAt: Date | string;
			title: string;
			sequenceNumber: number;
			recordingReady: boolean;
		};
	}>();

	// Debug logging
	console.log('📹 [RecordingPlayerCard] Rendering recording:', {
		id: recording.id,
		title: recording.title,
		duration: recording.duration,
		sequenceNumber: recording.sequenceNumber,
		playbackUrl: recording.playbackUrl
	});

	// Format duration
	let formattedDuration = $derived(() => {
		if (!recording.duration) return 'Unknown';
		const minutes = Math.floor(recording.duration / 60);
		const seconds = Math.floor(recording.duration % 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	});

	// Format created date
	let formattedDate = $derived(() => {
		const date = new Date(recording.createdAt);
		return date.toLocaleString();
	});
</script>

<!-- Recording Player Card -->
<div class="recording-player-card w-full max-w-4xl mx-auto mb-6">
	<!-- Recording Player Container -->
	<div class="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-xl">
		
		<!-- Recording Title Header with Metadata -->
		<div class="bg-gray-800 text-white px-4 py-3 border-b border-gray-600 flex items-center justify-between">
			<div class="flex-1">
				<h3 class="text-lg font-semibold truncate">{recording.title}</h3>
				<div class="flex items-center gap-4 mt-1 text-sm text-gray-300">
					<span>📹 Recording #{recording.sequenceNumber}</span>
					<span>⏱️ {formattedDuration}</span>
					<span>📅 {formattedDate}</span>
				</div>
			</div>
			
			<!-- Status Badge -->
			<div class="ml-3 px-2 py-1 bg-blue-50 border-blue-200 border rounded-md">
				<span class="text-xs font-medium text-blue-500">RECORDED</span>
			</div>
		</div>
		
		<!-- Video Content Area -->
		<div class="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
			
			<!-- Recorded indicator overlay -->
			<div class="absolute top-4 left-4 z-10 px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full">
				📹 RECORDED
			</div>
			
			<!-- Cloudflare Stream iframe -->
			<iframe 
				src={recording.playbackUrl}
				class="w-full h-full border-0"
				allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;"
				allowfullscreen
				title={recording.title}
				loading="lazy"
				onload={() => console.log('✅ [RecordingPlayerCard] Iframe loaded for:', recording.title)}
				onerror={() => console.error('❌ [RecordingPlayerCard] Iframe failed for:', recording.title)}
			></iframe>
			
			<!-- Debug overlay (temporary) -->
			<div class="absolute bottom-4 right-4 bg-black bg-opacity-90 text-white text-xs p-3 rounded max-w-sm">
				<div><strong>Recording Info:</strong></div>
				<div>ID: {recording.id}</div>
				<div>Sequence: #{recording.sequenceNumber}</div>
				<div>Duration: {formattedDuration}</div>
				<div>Cloudflare ID: {recording.cloudflareVideoId}</div>
			</div>
		</div>
	</div>
</div>

<style>
	.recording-player-card {
		@apply flex flex-col items-center;
	}
</style>
