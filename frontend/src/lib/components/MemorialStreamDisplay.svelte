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
	}
</style>
