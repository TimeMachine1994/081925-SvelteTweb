<script lang="ts">
	import { onMount } from 'svelte';
	import CountdownVideoPlayer from './CountdownVideoPlayer.svelte';
	
	interface Stream {
		id: string;
		title: string;
		description?: string;
		status: string;
		scheduledStartTime?: string;
		cloudflareInputId?: string;
		cloudflareStreamId?: string;
		playbackUrl?: string;
		embedUrl?: string;
		isVisible?: boolean;
		recordingReady?: boolean;
		createdAt: string;
	}
	
	interface Props {
		streams: Stream[];
		memorialName: string;
	}
	
	let { streams, memorialName }: Props = $props();
	
	// Current time for countdown
	let currentTime = $state(new Date());
	
	// Update time every second for countdown
	onMount(() => {
		const interval = setInterval(() => {
			currentTime = new Date();
		}, 1000);
		
		return () => clearInterval(interval);
	});
	
	// Categorize streams
	let liveStreams = $derived(
		streams.filter(s => s.status === 'live' && s.isVisible !== false)
	);
	
	let scheduledStreams = $derived(
		streams.filter(s => {
			if (s.isVisible === false) return false;
			if (s.status === 'scheduled') return true;
			
			// Also treat 'ready' status with future scheduledStartTime as scheduled
			if (s.status === 'ready' && s.scheduledStartTime) {
				const scheduledTime = new Date(s.scheduledStartTime).getTime();
				return scheduledTime > currentTime.getTime();
			}
			
			return false;
		})
	);
	
	let recordedStreams = $derived(
		streams.filter(s => 
			s.isVisible !== false && 
			(s.status === 'completed' || s.recordingReady === true)
		)
	);
	
	// Get playback URL for a stream
	function getPlaybackUrl(stream: Stream): string | null {
		// Try different URL sources in order of preference
		if (stream.playbackUrl) return stream.playbackUrl;
		if (stream.embedUrl) return stream.embedUrl;
		if (stream.cloudflareStreamId) {
			return `https://customer-${stream.cloudflareStreamId}.cloudflarestream.com/iframe`;
		}
		if (stream.cloudflareInputId) {
			return `https://customer-${stream.cloudflareInputId}.cloudflarestream.com/iframe`;
		}
		return null;
	}
	
	// Determine if we should show any streams section
	let hasVisibleStreams = $derived(
		liveStreams.length > 0 || scheduledStreams.length > 0 || recordedStreams.length > 0
	);
</script>

{#if hasVisibleStreams}
	<div class="memorial-streams">
		<!-- Live Streams -->
		{#if liveStreams.length > 0}
			<div class="stream-section live-section">
				<h2 class="stream-section-title">
					<span class="live-indicator"></span>
					Live Now
				</h2>
				{#each liveStreams as stream (stream.id)}
					<div class="stream-item">
						<h3 class="stream-title">{stream.title}</h3>
						{#if stream.description}
							<p class="stream-description">{stream.description}</p>
						{/if}
						{#if getPlaybackUrl(stream)}
							<div class="stream-player">
								<iframe
									src={getPlaybackUrl(stream)}
									allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
									allowfullscreen="true"
									title={stream.title}
								></iframe>
							</div>
						{:else}
							<div class="stream-placeholder">
								<p>Stream is live. Please refresh the page if video doesn't appear.</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
		
		<!-- Scheduled Streams -->
		{#if scheduledStreams.length > 0}
			<div class="stream-section scheduled-section">
				<h2 class="stream-section-title">Upcoming Service</h2>
				{#each scheduledStreams as stream (stream.id)}
					<div class="stream-item">
						{#if stream.scheduledStartTime}
							<CountdownVideoPlayer
								scheduledStartTime={stream.scheduledStartTime}
								streamTitle={stream.title}
								streamDescription={stream.description}
								theme="memorial"
								{currentTime}
							/>
						{:else}
							<div class="stream-info-card">
								<h3 class="stream-title">{stream.title}</h3>
								{#if stream.description}
									<p class="stream-description">{stream.description}</p>
								{/if}
								<p class="stream-status">Service scheduled - time to be announced</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
		
		<!-- Recorded Streams -->
		{#if recordedStreams.length > 0}
			<div class="stream-section recorded-section">
				<h2 class="stream-section-title">Service Recording</h2>
				{#each recordedStreams as stream (stream.id)}
					<div class="stream-item">
						<h3 class="stream-title">{stream.title}</h3>
						{#if stream.description}
							<p class="stream-description">{stream.description}</p>
						{/if}
						{#if getPlaybackUrl(stream)}
							<div class="stream-player">
								<iframe
									src={getPlaybackUrl(stream)}
									allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
									allowfullscreen="true"
									title={stream.title}
								></iframe>
							</div>
						{:else}
							<div class="stream-placeholder">
								<p>Recording is being processed. Please check back later.</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<!-- Stock Placeholder Player for New Memorials -->
	<div class="memorial-streams">
		<div class="stream-section no-stream-section">
			<h2 class="stream-section-title">Memorial Service</h2>
			<div class="stream-item">
				<div class="stock-player">
					<div class="video-container">
						<!-- Video Screen -->
						<div class="video-screen">
							<!-- Background gradient -->
							<div class="placeholder-bg"></div>
							
							<!-- Message Overlay - Similar to scheduled video layer -->
							<div class="placeholder-overlay">
								<div class="placeholder-content">
									<div class="placeholder-icon">
										<!-- Calendar/Clock icon instead of dollar sign -->
										<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
											<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
											<line x1="16" y1="2" x2="16" y2="6"></line>
											<line x1="8" y1="2" x2="8" y2="6"></line>
											<line x1="3" y1="10" x2="21" y2="10"></line>
											<circle cx="12" cy="15" r="2"></circle>
										</svg>
									</div>
									<div class="placeholder-label">LIVESTREAM UPCOMING</div>
									<h3 class="placeholder-title">Video Coming Soon</h3>
									<p class="placeholder-description">
										The memorial service will be livestreamed here. This page will go live automatically when the service begins.
									</p>
								</div>
							</div>
						</div>
						
						<!-- Fake Video Controls -->
						<div class="video-controls">
							<div class="control-bar">
								<!-- Play Button (Disabled) -->
								<button class="play-button" disabled aria-label="No stream available">
									<svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
										<polygon points="5,3 19,12 5,21"></polygon>
									</svg>
								</button>
								
								<!-- Progress Bar (Empty) -->
								<div class="progress-container">
									<div class="progress-bar">
										<div class="progress-fill" style="width: 0%"></div>
									</div>
								</div>
								
								<!-- Time Display -->
								<span class="time-display">--:--</span>
								
								<!-- Volume Button (Disabled) -->
								<button class="volume-button" disabled aria-label="Volume control unavailable">
									<svg class="volume-icon" viewBox="0 0 24 24" fill="currentColor">
										<polygon points="11,5 6,9 2,9 2,15 6,15 11,19"></polygon>
										<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
									</svg>
								</button>
								
								<!-- Fullscreen Button (Disabled) -->
								<button class="fullscreen-button" disabled aria-label="Fullscreen unavailable">
									<svg class="fullscreen-icon" viewBox="0 0 24 24" fill="currentColor">
										<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
									</svg>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.memorial-streams {
		width: 100%;
		max-width: 1000px;
		margin: 0 auto;
	}
	
	.stream-section {
		margin-bottom: 3rem;
	}
	
	.stream-section-title {
		font-family: 'Fanwood Text', serif;
		font-size: 1.8rem;
		font-weight: 300;
		font-style: italic;
		color: #e0e0e0;
		text-align: center;
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}
	
	.live-indicator {
		width: 12px;
		height: 12px;
		background: #ef4444;
		border-radius: 50%;
		animation: pulse 2s ease-in-out infinite;
	}
	
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.6;
			transform: scale(1.1);
		}
	}
	
	.stream-item {
		margin-bottom: 2rem;
	}
	
	.stream-title {
		font-size: 1.3rem;
		font-weight: 400;
		color: #e0e0e0;
		margin-bottom: 0.5rem;
		text-align: center;
	}
	
	.stream-description {
		font-size: 1rem;
		color: #a0a0a0;
		margin-bottom: 1rem;
		text-align: center;
		font-style: italic;
	}
	
	.stream-player {
		position: relative;
		width: 100%;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		background: #000;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
	}
	
	.stream-player iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: none;
	}
	
	.stream-placeholder {
		padding: 3rem 2rem;
		background: rgba(255, 255, 255, 0.05);
		border: 2px dashed rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		text-align: center;
		color: #a0a0a0;
	}
	
	.stream-info-card {
		padding: 2rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		text-align: center;
	}
	
	.stream-status {
		color: #D5BA7F;
		font-style: italic;
		margin-top: 1rem;
	}
	
	/* Stock Player Styles - Match scheduled video layer */
	.stock-player {
		width: 100%;
	}
	
	.video-container {
		position: relative;
		width: 100%;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		background: #000;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
	}
	
	.video-screen {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
	
	.placeholder-bg {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
	}
	
	.placeholder-overlay {
		position: absolute;
		inset: 0;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.placeholder-content {
		text-align: center;
		padding: 2rem;
		max-width: 500px;
	}
	
	.placeholder-icon {
		color: #D5BA7F;
		margin: 0 auto 1.5rem;
		opacity: 0.9;
	}
	
	.placeholder-icon svg {
		display: block;
		margin: 0 auto;
	}
	
	.placeholder-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: rgba(0, 0, 0, 0.6);
		margin-bottom: 0.5rem;
		font-weight: 600;
	}
	
	.placeholder-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 0.75rem;
	}
	
	.placeholder-description {
		font-size: 0.95rem;
		color: rgba(0, 0, 0, 0.7);
		line-height: 1.6;
	}
	
	.video-controls {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
		padding: 1rem;
	}
	
	.control-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	.play-button,
	.volume-button,
	.fullscreen-button {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.4);
		cursor: not-allowed;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.play-icon,
	.volume-icon,
	.fullscreen-icon {
		width: 20px;
		height: 20px;
	}
	
	.progress-container {
		flex: 1;
	}
	
	.progress-bar {
		width: 100%;
		height: 4px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 2px;
		overflow: hidden;
	}
	
	.progress-fill {
		height: 100%;
		background: rgba(255, 255, 255, 0.3);
	}
	
	.time-display {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.4);
		font-family: monospace;
		min-width: 45px;
	}
	
	/* Responsive Design */
	@media (max-width: 768px) {
		.stream-section {
			margin-bottom: 2rem;
		}
		
		.stream-section-title {
			font-size: 1.5rem;
		}
		
		.stream-title {
			font-size: 1.1rem;
		}
		
		.stream-description {
			font-size: 0.9rem;
		}
		
		.placeholder-content {
			padding: 1.5rem;
		}
		
		.placeholder-icon svg {
			width: 48px;
			height: 48px;
		}
		
		.placeholder-title {
			font-size: 1.25rem;
		}
		
		.placeholder-description {
			font-size: 0.875rem;
		}
	}
</style>
