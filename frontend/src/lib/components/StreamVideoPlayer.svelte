<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	
	// Props
	let { stream, showTitle = true } = $props();
	
	// State
	let playerContainer: HTMLDivElement;
	let countdown = $state('');
	let countdownInterval: NodeJS.Timeout | null = null;
	
	// Derived state
	let playerState = $derived(() => {
		if (stream.status === 'live') return 'live';
		if (stream.status === 'completed' && stream.recordingReady) return 'recorded';
		if (stream.status === 'completed' && !stream.recordingReady) return 'processing';
		if (stream.status === 'scheduled' && stream.scheduledStartTime) return 'scheduled';
		return 'placeholder';
	});
	
	let hasScheduledTime = $derived(stream.scheduledStartTime && new Date(stream.scheduledStartTime) > new Date());
	
	// Countdown logic for scheduled streams
	function updateCountdown() {
		if (!stream.scheduledStartTime) return;
		
		const now = new Date().getTime();
		const scheduledTime = new Date(stream.scheduledStartTime).getTime();
		const difference = scheduledTime - now;
		
		if (difference > 0) {
			const days = Math.floor(difference / (1000 * 60 * 60 * 24));
			const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((difference % (1000 * 60)) / 1000);
			
			if (days > 0) {
				countdown = `${days}d ${hours}h ${minutes}m ${seconds}s`;
			} else if (hours > 0) {
				countdown = `${hours}h ${minutes}m ${seconds}s`;
			} else {
				countdown = `${minutes}m ${seconds}s`;
			}
		} else {
			countdown = 'Starting soon...';
		}
	}
	
	onMount(() => {
		if (playerState === 'scheduled' && hasScheduledTime) {
			updateCountdown();
			countdownInterval = setInterval(updateCountdown, 1000);
		}
	});
	
	onDestroy(() => {
		if (countdownInterval) {
			clearInterval(countdownInterval);
		}
	});
	
	// Get video URL based on stream state
	function getVideoUrl() {
		if (playerState === 'live') {
			return stream.playbackUrl || `https://cloudflarestream.com/${stream.cloudflareId}/iframe`;
		}
		if (playerState === 'recorded') {
			return stream.recordingUrl || stream.playbackUrl || `https://cloudflarestream.com/${stream.cloudflareId}/iframe`;
		}
		return null;
	}
	
	console.log('🎥 [STREAM_PLAYER] Stream state:', {
		id: stream.id,
		title: stream.title,
		status: stream.status,
		playerState,
		recordingReady: stream.recordingReady,
		hasScheduledTime,
		scheduledStartTime: stream.scheduledStartTime
	});
</script>

<div class="stream-player" class:live={playerState === 'live'} class:recorded={playerState === 'recorded'}>
	{#if showTitle}
		<div class="stream-header">
			<h3 class="stream-title">{stream.title || 'Memorial Service'}</h3>
			<div class="stream-status">
				{#if playerState === 'live'}
					<span class="status-badge live">🔴 LIVE</span>
				{:else if playerState === 'recorded'}
					<span class="status-badge recorded">📺 RECORDED</span>
				{:else if playerState === 'processing'}
					<span class="status-badge processing">⏳ PROCESSING</span>
				{:else if playerState === 'scheduled'}
					<span class="status-badge scheduled">📅 SCHEDULED</span>
				{:else}
					<span class="status-badge placeholder">⏸️ UNAVAILABLE</span>
				{/if}
			</div>
		</div>
	{/if}
	
	<div class="video-container" bind:this={playerContainer}>
		{#if playerState === 'live' || playerState === 'recorded'}
			<!-- ACTUAL VIDEO PLAYER -->
			<div class="video-player">
				<iframe
					src={getVideoUrl()}
					allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
					allowfullscreen
					title={stream.title || 'Memorial Service'}
					class="video-iframe"
				></iframe>
			</div>
		{:else if playerState === 'scheduled' && hasScheduledTime}
			<!-- SCHEDULED STATE: Show countdown -->
			<div class="fake-player scheduled-player">
				<div class="scheduled-content">
					<div class="schedule-icon">📅</div>
					<h4>Service Scheduled</h4>
					<div class="scheduled-time">
						{new Date(stream.scheduledStartTime).toLocaleString()}
					</div>
					<div class="countdown-timer">
						<div class="countdown-label">Starts in:</div>
						<div class="countdown-display">{countdown}</div>
					</div>
					{#if stream.description}
						<p class="stream-description">{stream.description}</p>
					{/if}
				</div>
			</div>
		{:else if playerState === 'processing'}
			<!-- PROCESSING STATE: Recording being processed -->
			<div class="fake-player processing-player">
				<div class="processing-content">
					<div class="processing-icon">
						<div class="spinner"></div>
					</div>
					<h4>Recording Processing</h4>
					<p>Your recording is being processed and will appear here shortly.</p>
					<div class="processing-details">
						<small>This usually takes 1-5 minutes after the stream ends.</small>
					</div>
				</div>
			</div>
		{:else}
			<!-- PLACEHOLDER STATE: Fake play button -->
			<div class="fake-player placeholder-player">
				<div class="placeholder-content">
					<div class="fake-play-button">
						<svg width="60" height="60" viewBox="0 0 60 60" fill="none">
							<circle cx="30" cy="30" r="30" fill="rgba(255,255,255,0.9)"/>
							<polygon points="24,18 24,42 42,30" fill="#333"/>
						</svg>
					</div>
					<h4>Service Not Available</h4>
					<p>This service is not currently available for viewing.</p>
					{#if stream.description}
						<p class="stream-description">{stream.description}</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
	
	<!-- Stream metadata -->
	<div class="stream-metadata">
		{#if stream.actualStartTime}
			<div class="metadata-item">
				<strong>Started:</strong> {new Date(stream.actualStartTime).toLocaleString()}
			</div>
		{/if}
		{#if stream.endTime}
			<div class="metadata-item">
				<strong>Ended:</strong> {new Date(stream.endTime).toLocaleString()}
			</div>
		{/if}
		{#if stream.recordingDuration}
			<div class="metadata-item">
				<strong>Duration:</strong> {Math.floor(stream.recordingDuration / 60)} minutes
			</div>
		{/if}
	</div>
</div>

<style>
	.stream-player {
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
		overflow: hidden;
		margin-bottom: 2rem;
		transition: all 0.3s ease;
	}
	
	.stream-player:hover {
		box-shadow: 0 6px 20px rgba(0,0,0,0.15);
	}
	
	.stream-player.live {
		border: 2px solid #dc3545;
		box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
	}
	
	.stream-player.recorded {
		border: 2px solid #28a745;
	}
	
	.stream-header {
		padding: 1rem 1.5rem;
		background: #f8f9fa;
		border-bottom: 1px solid #e9ecef;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.stream-title {
		margin: 0;
		font-size: 1.2rem;
		color: #333;
		font-weight: 600;
	}
	
	.stream-status {
		display: flex;
		align-items: center;
	}
	
	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	
	.status-badge.live {
		background: #dc3545;
		color: white;
		animation: pulse 2s infinite;
	}
	
	.status-badge.recorded {
		background: #28a745;
		color: white;
	}
	
	.status-badge.processing {
		background: #ffc107;
		color: #333;
	}
	
	.status-badge.scheduled {
		background: #17a2b8;
		color: white;
	}
	
	.status-badge.placeholder {
		background: #6c757d;
		color: white;
	}
	
	@keyframes pulse {
		0% { opacity: 1; }
		50% { opacity: 0.7; }
		100% { opacity: 1; }
	}
	
	.video-container {
		position: relative;
		width: 100%;
		aspect-ratio: 16/9;
		background: #000;
	}
	
	.video-player {
		width: 100%;
		height: 100%;
	}
	
	.video-iframe {
		width: 100%;
		height: 100%;
		border: none;
	}
	
	.fake-player {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 2rem;
	}
	
	.scheduled-player {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}
	
	.processing-player {
		background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
		color: #333;
	}
	
	.placeholder-player {
		background: linear-gradient(135deg, #ddd6fe 0%, #c7d2fe 100%);
		color: #4c1d95;
	}
	
	.scheduled-content, .processing-content, .placeholder-content {
		max-width: 400px;
	}
	
	.schedule-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}
	
	.scheduled-content h4, .processing-content h4, .placeholder-content h4 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
		font-weight: 600;
	}
	
	.scheduled-time {
		font-size: 1.1rem;
		margin-bottom: 1.5rem;
		font-weight: 500;
	}
	
	.countdown-timer {
		background: rgba(255,255,255,0.2);
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
	}
	
	.countdown-label {
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
		opacity: 0.9;
	}
	
	.countdown-display {
		font-size: 1.8rem;
		font-weight: 700;
		font-family: 'Monaco', 'Menlo', monospace;
	}
	
	.processing-icon {
		margin-bottom: 1rem;
	}
	
	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(0,0,0,0.1);
		border-left: 4px solid #333;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	.fake-play-button {
		margin-bottom: 1rem;
		cursor: pointer;
		transition: transform 0.2s ease;
	}
	
	.fake-play-button:hover {
		transform: scale(1.1);
	}
	
	.stream-description {
		font-style: italic;
		opacity: 0.8;
		margin-top: 1rem;
	}
	
	.processing-details {
		margin-top: 1rem;
		opacity: 0.7;
	}
	
	.stream-metadata {
		padding: 1rem 1.5rem;
		background: #f8f9fa;
		border-top: 1px solid #e9ecef;
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.9rem;
	}
	
	.metadata-item {
		color: #666;
	}
	
	@media (max-width: 768px) {
		.stream-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
		
		.stream-metadata {
			flex-direction: column;
			gap: 0.5rem;
		}
		
		.countdown-display {
			font-size: 1.4rem;
		}
	}
</style>
