<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Calendar, Clock, Play, Users } from 'lucide-svelte';
	import type { Stream } from '$lib/types/stream';

	interface Props {
		streams?: Stream[];
		memorialName: string;
	}

	let { streams, memorialName }: Props = $props();

	let currentTime = $state(new Date());
	let timeInterval: NodeJS.Timeout;
	let pollingInterval: NodeJS.Timeout;

	// Derive directly from props to avoid infinite loop
	let safeStreams = $derived(streams || []);

	// Update current time every second for countdown
	onMount(() => {
		timeInterval = setInterval(() => {
			currentTime = new Date();
		}, 1000);
		
		// Poll for stream updates every 5 seconds for faster RTMP detection
		console.log('🎬 [MEMORIAL] Starting polling for stream updates...');
		pollingInterval = setInterval(async () => {
			await checkForUpdates();
		}, 5000);
	});

	onDestroy(() => {
		if (timeInterval) clearInterval(timeInterval);
		if (pollingInterval) clearInterval(pollingInterval);
	});

	// Check for stream updates
	async function checkForUpdates() {
		try {
			console.log('🎬 [MEMORIAL] Checking for stream updates...');
			// Reload the page to get fresh data - simple but effective
			window.location.reload();
		} catch (error) {
			console.error('🎬 [MEMORIAL] Error checking for updates:', error);
		}
	}

	// Categorize streams by status and priority with flexible logic
	let categorizedStreams = $derived.by(() => {
		const now = currentTime.getTime();
		
		// More flexible live stream detection with enhanced debugging
		const liveStreams = safeStreams.filter(s => {
			console.log(`🔍 [STREAM_DEBUG] Checking stream ${s.id}:`, {
				title: s.title,
				status: s.status,
				startedAt: s.startedAt,
				endedAt: s.endedAt,
				isLive: (s as any).isLive,
				cloudflareInputId: s.cloudflareInputId,
				cloudflareStreamId: s.cloudflareStreamId
			});
			
			// Primary: explicit live status
			if (s.status === 'live') {
				console.log(`✅ [STREAM_DEBUG] Stream ${s.id} is LIVE (status: live)`);
				return true;
			}
			
			// Fallback: started but not ended (legacy support)
			if (s.status === 'ready' && s.startedAt && !s.endedAt) {
				console.log(`✅ [STREAM_DEBUG] Stream ${s.id} is LIVE (started but not ended)`);
				return true;
			}
			
			// Legacy: isLive field support
			if (s.status === 'ready' && (s as any).isLive) {
				console.log(`✅ [STREAM_DEBUG] Stream ${s.id} is LIVE (isLive flag)`);
				return true;
			}
			
			console.log(`❌ [STREAM_DEBUG] Stream ${s.id} is NOT live`);
			return false;
		});
		
		// Better scheduled stream logic with fallbacks
		const scheduledStreams = safeStreams.filter(s => {
			if (!s.scheduledStartTime) return false;
			
			try {
				const scheduledTime = new Date(s.scheduledStartTime).getTime();
				if (isNaN(scheduledTime)) return false;
				
				// Must be in the future
				if (scheduledTime <= now) return false;
				
				// Primary: explicit scheduled status
				if (s.status === 'scheduled') return true;
				
				// Fallback: ready status with future scheduled time
				if (s.status === 'ready' && !s.startedAt) return true;
				
				return false;
			} catch {
				return false;
			}
		});
		
		// More flexible recording detection with multiple fallbacks
		const recordedStreams = safeStreams.filter(s => {
			// Check if we have any form of playable content
			const hasPlayableContent = s.recordingPlaybackUrl || 
									  s.cloudflareStreamId || 
									  s.playbackUrl || 
									  s.recordingUrl;
			
			console.log(`🎥 [FILTER] Stream ${s.id}: status=${s.status}, hasContent=${hasPlayableContent}, recordingReady=${s.recordingReady}, cloudflareStreamId=${s.cloudflareStreamId}`);
			
			if (!hasPlayableContent) {
				console.log(`❌ [FILTER] Stream ${s.id} rejected: no playable content`);
				return false;
			}
			
			// Primary: explicit completed status with recording ready
			if (s.status === 'completed' && s.recordingReady) {
				console.log(`✅ [FILTER] Stream ${s.id} accepted: completed + recordingReady`);
				return true;
			}
			
			// Fallback: completed status with any playback URL
			if (s.status === 'completed' && hasPlayableContent) {
				console.log(`✅ [FILTER] Stream ${s.id} accepted: completed + hasPlayableContent`);
				return true;
			}
			
			// Fallback: ended stream with recording
			if (s.endedAt && hasPlayableContent) {
				console.log(`✅ [FILTER] Stream ${s.id} accepted: endedAt + hasPlayableContent`);
				return true;
			}
			
			// Fallback: recording ready flag with content
			if (s.recordingReady && hasPlayableContent) {
				console.log(`✅ [FILTER] Stream ${s.id} accepted: recordingReady + hasPlayableContent`);
				return true;
			}
			
			console.log(`❌ [FILTER] Stream ${s.id} rejected: no conditions matched`);
			return false;
		});

		console.log('🎬 [MEMORIAL] Stream categorization:', {
			total: safeStreams.length,
			live: liveStreams.length,
			scheduled: scheduledStreams.length,
			recorded: recordedStreams.length,
			streams: safeStreams.map(s => ({
				id: s.id,
				title: s.title,
				status: s.status,
				scheduledStartTime: s.scheduledStartTime,
				startedAt: s.startedAt,
				endedAt: s.endedAt,
				recordingReady: s.recordingReady,
				hasPlaybackUrl: !!(s.recordingPlaybackUrl || s.cloudflareStreamId || s.playbackUrl),
				isLive: (s as any).isLive
			}))
		});

		return { liveStreams, scheduledStreams, recordedStreams };
	});

	// Get countdown for scheduled stream
	function getCountdown(scheduledTime: string): { days: number; hours: number; minutes: number; seconds: number; isStarted: boolean } {
		const now = currentTime.getTime();
		const target = new Date(scheduledTime).getTime();
		const diff = target - now;

		if (diff <= 0) {
			return { days: 0, hours: 0, minutes: 0, seconds: 0, isStarted: true };
		}

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);

		return { days, hours, minutes, seconds, isStarted: false };
	}

	// Format date for display
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	// Generate player URL with live stream support
	function getStreamPlayerUrl(stream: Stream): string {
		console.log('🎬 [MEMORIAL] Getting player URL for stream:', {
			id: stream.id,
			title: stream.title,
			status: stream.status,
			cloudflareStreamId: stream.cloudflareStreamId,
			cloudflareInputId: stream.cloudflareInputId,
			recordingPlaybackUrl: stream.recordingPlaybackUrl,
			playbackUrl: stream.playbackUrl,
			recordingUrl: stream.recordingUrl
		});
		
		// For LIVE streams, prioritize live playback URLs
		if (stream.status === 'live') {
			// Priority 1: Cloudflare Stream ID for live streams
			if (stream.cloudflareStreamId) {
				const url = `https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/${stream.cloudflareStreamId}/iframe`;
				console.log('🎬 [MEMORIAL] Using Cloudflare iframe URL for LIVE stream:', url);
				return url;
			}
			
			// Priority 2: Use Input ID for live streams (Cloudflare Live Input)
			if (stream.cloudflareInputId) {
				const url = `https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/${stream.cloudflareInputId}/iframe`;
				console.log('🎬 [MEMORIAL] Using Cloudflare Input iframe URL for LIVE stream:', url);
				return url;
			}
			
			// Priority 3: Live playback URL if available
			if (stream.playbackUrl) {
				console.log('🎬 [MEMORIAL] Using playback URL for LIVE stream:', stream.playbackUrl);
				return stream.playbackUrl;
			}
		}
		
		// For RECORDED/COMPLETED streams
		if (stream.status === 'completed') {
			// Priority 1: Cloudflare Stream ID (for recordings) - USE IFRAME, NOT MANIFEST
			if (stream.cloudflareStreamId) {
				const url = `https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/${stream.cloudflareStreamId}/iframe`;
				console.log('🎬 [MEMORIAL] Using Cloudflare iframe URL for recording:', url);
				return url;
			}
			
			// Priority 2: Recording playback URL (only if no cloudflareStreamId)
			if (stream.recordingPlaybackUrl && !stream.recordingPlaybackUrl.includes('.m3u8')) {
				console.log('🎬 [MEMORIAL] Using recording playback URL:', stream.recordingPlaybackUrl);
				return stream.recordingPlaybackUrl;
			}
			
			// Priority 3: Legacy recording URL
			if (stream.recordingUrl) {
				console.log('🎬 [MEMORIAL] Using legacy recording URL:', stream.recordingUrl);
				return stream.recordingUrl;
			}
		}
		
		// Fallback for any status: try all available URLs
		if (stream.cloudflareStreamId) {
			const url = `https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/${stream.cloudflareStreamId}/iframe`;
			console.log('🎬 [MEMORIAL] Using Cloudflare iframe URL (fallback):', url);
			return url;
		}
		
		if (stream.cloudflareInputId) {
			const url = `https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/${stream.cloudflareInputId}/iframe`;
			console.log('🎬 [MEMORIAL] Using Cloudflare Input iframe URL (fallback):', url);
			return url;
		}
		
		if (stream.playbackUrl) {
			console.log('🎬 [MEMORIAL] Using playback URL (fallback):', stream.playbackUrl);
			return stream.playbackUrl;
		}
		
		console.log('🎬 [MEMORIAL] No playback URL found for stream');
		return '';
	}
</script>

<!-- Live Streams Section -->
{#if categorizedStreams.liveStreams.length > 0}
	<div class="stream-section live-section">
		<h2 class="section-title live-title">
			🔴 Live Memorial Services
		</h2>
		{#each categorizedStreams.liveStreams as stream (stream.id)}
			{@const streamUrl = getStreamPlayerUrl(stream)}
			<div class="stream-card live-card">
				<div class="stream-header">
					<h3 class="stream-title">{stream.title}</h3>
					<div class="live-indicator">
						<span class="live-dot"></span>
						LIVE
					</div>
				</div>
				
				{#if stream.description}
					<p class="stream-description">{stream.description}</p>
				{/if}

				<div class="video-container">
					{#if streamUrl}
						<iframe
							src={streamUrl}
							class="stream-player"
							allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
							allowfullscreen
							title="Live Stream: {stream.title}"
						></iframe>
					{:else}
						<div class="stream-placeholder">
							<Play class="placeholder-icon" />
							<p>Stream starting soon...</p>
							<p class="debug-info">Debug: No playback URL found</p>
						</div>
					{/if}
				</div>

				{#if stream.viewerCount !== undefined}
					<div class="stream-info">
						<Users class="info-icon" />
						<span>{stream.viewerCount} viewers</span>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<!-- Scheduled Streams Section -->
{#if categorizedStreams.scheduledStreams.length > 0}
	<div class="stream-section scheduled-section">
		<h2 class="section-title scheduled-title">
			📅 Upcoming Memorial Services
		</h2>
		{#each categorizedStreams.scheduledStreams as stream (stream.id)}
			{@const countdown = getCountdown(stream.scheduledStartTime!)}
			<div class="stream-card scheduled-card">
				<div class="stream-header">
					<h3 class="stream-title">{stream.title}</h3>
					<div class="scheduled-indicator">
						<Calendar class="indicator-icon" />
						SCHEDULED
					</div>
				</div>
				
				{#if stream.description}
					<p class="stream-description">{stream.description}</p>
				{/if}

				<div class="countdown-container">
					<div class="countdown-display">
						{#if countdown.days > 0}
							<div class="countdown-unit">
								<span class="countdown-number">{countdown.days}</span>
								<span class="countdown-label">Days</span>
							</div>
						{/if}
						<div class="countdown-unit">
							<span class="countdown-number">{countdown.hours.toString().padStart(2, '0')}</span>
							<span class="countdown-label">Hours</span>
						</div>
						<div class="countdown-unit">
							<span class="countdown-number">{countdown.minutes.toString().padStart(2, '0')}</span>
							<span class="countdown-label">Minutes</span>
						</div>
						<div class="countdown-unit">
							<span class="countdown-number">{countdown.seconds.toString().padStart(2, '0')}</span>
							<span class="countdown-label">Seconds</span>
						</div>
					</div>
					<p class="scheduled-time">
						<Clock class="time-icon" />
						{formatDate(stream.scheduledStartTime!)}
					</p>
				</div>
			</div>
		{/each}
	</div>
{/if}

<!-- Recorded Streams Section -->
{#if categorizedStreams.recordedStreams.length > 0}
	{@const _ = console.log(`🎬 [RENDER] Rendering ${categorizedStreams.recordedStreams.length} recorded streams`)}
	<div class="stream-section recorded-section">
		<h2 class="section-title recorded-title">
			🎥 Recorded Memorial Services
		</h2>
		{#each categorizedStreams.recordedStreams as stream (stream.id)}
			<div class="stream-card recorded-card">
				<div class="stream-header">
					<h3 class="stream-title">{stream.title}</h3>
					<div class="recorded-indicator">
						RECORDED
					</div>
				</div>
				
				{#if stream.description}
					<p class="stream-description">{stream.description}</p>
				{/if}

				<div class="video-container">
					{#if getStreamPlayerUrl(stream)}
						{@const playerUrl = getStreamPlayerUrl(stream)}
						{@const _ = console.log(`🎬 [RECORDED] Player URL for ${stream.id}:`, playerUrl)}
						<iframe
							src={playerUrl}
							class="stream-player"
							allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
							allowfullscreen
							title="Recorded Stream: {stream.title}"
						></iframe>
					{:else}
						<div class="stream-placeholder">
							<Play class="placeholder-icon" />
							<p>Recording not available</p>
						</div>
					{/if}
				</div>

				{#if stream.endedAt}
					<div class="stream-info">
						<Calendar class="info-icon" />
						<span>Recorded on {formatDate(stream.endedAt)}</span>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<!-- No Streams Message -->
{#if safeStreams.length === 0}
	<div class="no-streams">
		<div class="no-streams-icon">
			<Play class="placeholder-icon" />
		</div>
		<h3>No Memorial Services</h3>
		<p>Memorial services will appear here when scheduled.</p>
	</div>
{/if}

<style>
	.stream-section {
		margin-bottom: 3rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.live-title {
		color: #dc2626;
	}

	.scheduled-title {
		color: #2563eb;
	}

	.recorded-title {
		color: #6b7280;
	}

	.stream-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.live-card {
		border-left: 4px solid #dc2626;
	}

	.scheduled-card {
		border-left: 4px solid #2563eb;
	}

	.recorded-card {
		border-left: 4px solid #6b7280;
	}

	.stream-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.stream-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
	}

	.live-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #dc2626;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.live-dot {
		width: 8px;
		height: 8px;
		background: white;
		border-radius: 50%;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	.scheduled-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #2563eb;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.recorded-indicator {
		background: #6b7280;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.indicator-icon {
		width: 12px;
		height: 12px;
	}

	.stream-description {
		color: #6b7280;
		margin-bottom: 1rem;
		line-height: 1.5;
	}

	.video-container {
		margin-bottom: 1rem;
	}

	.stream-player {
		width: 100%;
		height: 400px;
		border: none;
		border-radius: 8px;
	}

	.stream-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 300px;
		background: #f9fafb;
		border: 2px dashed #d1d5db;
		border-radius: 8px;
		color: #6b7280;
	}

	.placeholder-icon {
		width: 48px;
		height: 48px;
		margin-bottom: 1rem;
	}

	.countdown-container {
		text-align: center;
		padding: 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 12px;
		color: white;
		margin-bottom: 1rem;
	}

	.countdown-display {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 1rem;
	}

	.countdown-unit {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.countdown-number {
		font-size: 2.5rem;
		font-weight: 700;
		line-height: 1;
	}

	.countdown-label {
		font-size: 0.875rem;
		opacity: 0.9;
		margin-top: 0.25rem;
	}

	.scheduled-time {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 1.1rem;
		margin: 0;
		opacity: 0.95;
	}

	.time-icon {
		width: 16px;
		height: 16px;
	}

	.stream-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.info-icon {
		width: 16px;
		height: 16px;
	}

	.no-streams {
		text-align: center;
		padding: 4rem 2rem;
		color: #6b7280;
	}

	.no-streams-icon {
		margin-bottom: 1rem;
	}

	.no-streams h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #374151;
	}

	.debug-info {
		font-size: 0.8rem;
		color: #ef4444;
		margin-top: 0.5rem;
		font-family: monospace;
	}

	@media (max-width: 768px) {
		.stream-card {
			padding: 1rem;
		}

		.stream-header {
			flex-direction: column;
			gap: 1rem;
		}

		.countdown-display {
			gap: 1rem;
		}

		.countdown-number {
			font-size: 2rem;
		}

		.stream-player {
			height: 250px;
		}
	}
</style>
