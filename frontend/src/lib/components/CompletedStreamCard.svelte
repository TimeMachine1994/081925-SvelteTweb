<script lang="ts">
	import { Play, Clock, Eye, EyeOff, RefreshCw, Download } from 'lucide-svelte';
	import type { Stream } from '$lib/types/stream';

	interface Props {
		stream: Stream;
		onVisibilityToggle?: (streamId: string, isVisible: boolean) => Promise<void>;
		onCheckRecordings?: (streamId: string) => Promise<void>;
		canManage?: boolean;
	}

	let { stream, onVisibilityToggle, onCheckRecordings, canManage = false }: Props = $props();

	let checkingRecordings = $state(false);

	// Format duration from seconds to MM:SS or HH:MM:SS
	function formatDuration(seconds: number | undefined): string {
		if (!seconds) return '0:00';
		
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);
		
		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}

	// Format file size
	function formatFileSize(bytes: number | undefined): string {
		if (!bytes) return '';
		
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
	}

	async function handleCheckRecordings() {
		if (!onCheckRecordings) return;
		
		checkingRecordings = true;
		try {
			await onCheckRecordings(stream.id);
		} finally {
			checkingRecordings = false;
		}
	}

	async function handleVisibilityToggle() {
		if (!onVisibilityToggle) return;
		await onVisibilityToggle(stream.id, !stream.isVisible);
	}

	// Determine the recording status - simplified approach
	let recordingStatus = $state('checking');
	
	$effect(() => {
		console.log(`🎬 [CARD] Recording status check for stream ${stream.id}:`, {
			title: stream.title,
			recordingReady: stream.recordingReady,
			recordingPlaybackUrl: stream.recordingPlaybackUrl,
			recordingCount: stream.recordingCount,
			cloudflareStreamId: stream.cloudflareStreamId
		});
		
		if (stream.recordingReady && stream.recordingPlaybackUrl) {
			console.log(`🎬 [CARD] Stream ${stream.id} status: READY (has recording)`);
			recordingStatus = 'ready';
		} else if (stream.recordingCount && stream.recordingCount > 0) {
			console.log(`🎬 [CARD] Stream ${stream.id} status: PROCESSING (${stream.recordingCount} recordings found)`);
			recordingStatus = 'processing';
		} else {
			console.log(`🎬 [CARD] Stream ${stream.id} status: CHECKING (no recordings yet)`);
			recordingStatus = 'checking';
		}
		
		console.log(`🎬 [CARD] Final status for stream ${stream.id}: ${recordingStatus}`);
	});
</script>

<div class="completed-stream-card">
	<!-- Header -->
	<div class="stream-header">
		<div class="stream-info">
			<h3 class="stream-title">{stream.title}</h3>
			<div class="stream-meta">
				<span class="status-badge completed">
					<Clock size={14} />
					Completed
				</span>
				{#if stream.endedAt}
					<span class="timestamp">
						Ended {new Date(stream.endedAt).toLocaleString()}
					</span>
				{/if}
			</div>
		</div>

		{#if canManage}
			<div class="stream-controls">
				<!-- Visibility Toggle -->
				<button
					class="visibility-btn {stream.isVisible ? 'visible' : 'hidden'}"
					onclick={handleVisibilityToggle}
					title={stream.isVisible ? 'Hide from public' : 'Show to public'}
				>
					{#if stream.isVisible}
						<Eye size={16} />
						<span class="desktop-only">Visible</span>
					{:else}
						<EyeOff size={16} />
						<span class="desktop-only">Hidden</span>
					{/if}
				</button>

				<!-- Manual Check Recordings Button (only if not auto-polling) -->
				{#if recordingStatus === 'checking'}
					<button
						class="check-recordings-btn"
						onclick={handleCheckRecordings}
						disabled={checkingRecordings}
						title="Check for recordings now"
					>
						<RefreshCw size={16} class={checkingRecordings ? 'spinning' : ''} />
						<span class="desktop-only">Check Now</span>
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Recording Status & Playback -->
	<div class="recording-section">
		{#if recordingStatus === 'ready'}
			<!-- Ready for Playback -->
			<div class="recording-ready">
				<div class="recording-info">
					<div class="recording-meta">
						<span class="status-badge ready">
							<Play size={14} />
							Recording Ready
						</span>
						{#if stream.recordingDuration}
							<span class="duration">{formatDuration(stream.recordingDuration)}</span>
						{/if}
						{#if stream.recordingSize}
							<span class="file-size">{formatFileSize(stream.recordingSize)}</span>
						{/if}
					</div>
					
					{#if stream.recordingProcessedAt}
						<div class="processed-time">
							Processed {new Date(stream.recordingProcessedAt).toLocaleString()}
						</div>
					{/if}
				</div>

				<!-- Video Player -->
				{#if stream.recordingPlaybackUrl}
					{@const _ = console.log(`🎬 [VIDEO] Player decision for ${stream.id}:`, {
						cloudflareStreamId: stream.cloudflareStreamId,
						recordingPlaybackUrl: stream.recordingPlaybackUrl,
						isHLS: stream.recordingPlaybackUrl.includes('.m3u8'),
						hasCloudflareId: !!stream.cloudflareStreamId
					})}
					<div class="video-player">
						{#if stream.cloudflareStreamId}
							<!-- Cloudflare Stream Iframe (Preferred) -->
							<iframe
								src="https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/{stream.cloudflareStreamId}/iframe"
								class="recording-iframe"
								allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
								allowfullscreen
								title="Recorded Service - {stream.title}"
							></iframe>
						{:else if stream.recordingPlaybackUrl.includes('.m3u8')}
							<!-- HLS Video (Fallback) -->
							<div class="hls-fallback">
								<p>Direct video playback not supported. Please use the Cloudflare Stream player.</p>
								<a href="{stream.recordingPlaybackUrl}" target="_blank" class="play-external-btn">
									<Play size={16} />
									Open in New Tab
								</a>
							</div>
						{:else}
							<!-- Generic Video -->
							<video
								controls
								preload="metadata"
								poster={stream.recordingThumbnail}
								class="recording-video"
							>
								<source src={stream.recordingPlaybackUrl} />
								Your browser does not support this video format.
							</video>
						{/if}
					</div>
				{/if}
			</div>

		{:else if recordingStatus === 'processing'}
			<!-- Processing -->
			<div class="recording-processing">
				<div class="processing-indicator">
					<RefreshCw size={20} class="spinning" />
					<div class="processing-text">
						<h4>Processing Recording</h4>
						<p>Your recording is being processed and will be available shortly.</p>
						{#if stream.recordingCount}
							<p class="recording-count">{stream.recordingCount} recording(s) found</p>
						{/if}
						<p class="auto-check-note">Automatically checking every 10 seconds...</p>
					</div>
				</div>
			</div>

		{:else}
			<!-- Checking/No Recording -->
			<div class="recording-checking">
				<div class="checking-indicator">
					<Clock size={20} />
					<div class="checking-text">
						<h4>Checking for Recording</h4>
						<p>We're automatically checking for recordings every 10 seconds.</p>
						<p class="auto-check-note">This usually takes 1-3 minutes after the stream ends.</p>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Stream Description -->
	{#if stream.description}
		<div class="stream-description">
			<p>{stream.description}</p>
		</div>
	{/if}
</div>

<style>
	.completed-stream-card {
		background: white;
		border-radius: 12px;
		border: 1px solid #e5e7eb;
		overflow: hidden;
		transition: all 0.2s ease;
	}

	.completed-stream-card:hover {
		border-color: #d1d5db;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	}

	.stream-header {
		padding: 1.5rem;
		border-bottom: 1px solid #f3f4f6;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.stream-info {
		flex: 1;
		min-width: 0;
	}

	.stream-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.5rem 0;
		word-wrap: break-word;
	}

	.stream-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.status-badge.completed {
		background: #f3f4f6;
		color: #6b7280;
	}

	.status-badge.ready {
		background: #dcfce7;
		color: #166534;
	}

	.timestamp {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.stream-controls {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.visibility-btn, .check-recordings-btn, .check-again-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		border: 1px solid #d1d5db;
		background: white;
		color: #374151;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.visibility-btn:hover, .check-recordings-btn:hover, .check-again-btn:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	.visibility-btn.visible {
		background: #dcfce7;
		border-color: #bbf7d0;
		color: #166534;
	}

	.visibility-btn.hidden {
		background: #f3f4f6;
		border-color: #d1d5db;
		color: #6b7280;
	}

	.recording-section {
		padding: 1.5rem;
	}

	.recording-ready .recording-info {
		margin-bottom: 1rem;
	}

	.recording-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}

	.duration, .file-size {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.processed-time {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.video-player {
		border-radius: 8px;
		overflow: hidden;
		background: #000;
	}

	.recording-video, .recording-iframe {
		width: 100%;
		height: 300px;
		border: none;
	}

	.hls-fallback {
		padding: 2rem;
		text-align: center;
		background: #f9fafb;
		border-radius: 8px;
	}

	.hls-fallback p {
		margin: 0 0 1rem 0;
		color: #6b7280;
	}

	.play-external-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #3b82f6;
		color: white;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 500;
		transition: background-color 0.2s ease;
	}

	.play-external-btn:hover {
		background: #2563eb;
	}

	.recording-processing, .recording-checking {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 2rem;
		background: #f9fafb;
		border-radius: 8px;
	}

	.processing-indicator, .checking-indicator {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.processing-text h4, .checking-text h4 {
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
	}

	.processing-text p, .checking-text p {
		margin: 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.recording-count {
		color: #059669 !important;
		font-weight: 500 !important;
	}

	.auto-check-note {
		color: #9ca3af !important;
		font-size: 0.75rem !important;
		font-style: italic;
		margin-top: 0.25rem !important;
	}

	.stream-description {
		padding: 0 1.5rem 1.5rem;
		color: #6b7280;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.spinning {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	@media (max-width: 640px) {
		.stream-header {
			flex-direction: column;
			align-items: stretch;
		}

		.stream-controls {
			justify-content: flex-end;
		}

		.desktop-only {
			display: none;
		}

		.recording-processing, .recording-checking {
			flex-direction: column;
			align-items: stretch;
			text-align: center;
		}
	}
</style>
