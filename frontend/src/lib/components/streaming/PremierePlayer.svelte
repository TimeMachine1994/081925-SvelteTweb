<script lang="ts">
	/**
	 * Premiere Player
	 *
	 * Plays back an already-processed Mux on-demand asset (from an
	 * "Upload & Schedule" premiere stream) seeked to the same elapsed offset
	 * for every viewer, so a video that's technically pre-recorded still feels
	 * like a shared live event.
	 *
	 * Browsers block autoplay-with-sound, so playback starts on a user click
	 * ("Join the Service") rather than automatically at zero-hour — that click
	 * satisfies the autoplay policy and lets us start already-in-progress.
	 *
	 * Periodically re-syncs playback position in case of buffering, a paused
	 * tab being throttled in the background, etc.
	 */
	import '@mux/mux-player';

	interface Props {
		playbackId: string;
		scheduledStartTime: string;
		duration?: number;
		title?: string;
		currentTime: Date;
	}

	let { playbackId, scheduledStartTime, duration, title, currentTime }: Props = $props();

	let joined = $state(false);
	let playerEl: any = $state(null);
	let resyncInterval: ReturnType<typeof setInterval> | null = null;

	const RESYNC_INTERVAL_MS = 15000;
	const RESYNC_DRIFT_THRESHOLD_S = 4;

	function elapsedSeconds(now: Date): number {
		const startMs = new Date(scheduledStartTime).getTime();
		const elapsed = (now.getTime() - startMs) / 1000;
		const max = duration ?? Number.POSITIVE_INFINITY;
		return Math.min(Math.max(elapsed, 0), max);
	}

	function handleLoadedMetadata() {
		if (!playerEl) return;
		const offset = elapsedSeconds(new Date());
		console.log('🎬 [PREMIERE PLAYER] Seeking to elapsed offset:', offset);
		try {
			playerEl.currentTime = offset;
			playerEl.play?.().catch((err: unknown) => {
				console.warn('⚠️ [PREMIERE PLAYER] Autoplay after seek was blocked:', err);
			});
		} catch (err) {
			console.error('❌ [PREMIERE PLAYER] Failed to seek on load:', err);
		}
	}

	function resync() {
		if (!playerEl || typeof playerEl.currentTime !== 'number') return;
		const expected = elapsedSeconds(new Date());
		const drift = Math.abs(playerEl.currentTime - expected);
		if (drift > RESYNC_DRIFT_THRESHOLD_S) {
			console.log('🎬 [PREMIERE PLAYER] Drift detected, resyncing:', {
				actual: playerEl.currentTime,
				expected,
				drift
			});
			playerEl.currentTime = expected;
		}
	}

	function join() {
		joined = true;
	}

	$effect(() => {
		if (!joined) return;
		resyncInterval = setInterval(resync, RESYNC_INTERVAL_MS);
		return () => {
			if (resyncInterval) clearInterval(resyncInterval);
		};
	});
</script>

<div class="premiere-player-wrapper">
	{#if title}
		<div class="stream-header">
			<h3>{title}</h3>
			<span class="live-badge">🔴 LIVE</span>
		</div>
	{/if}

	{#if !joined}
		<button type="button" class="join-button" onclick={join}>
			<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
				<polygon points="5,3 19,12 5,21" />
			</svg>
			<span>Join the Service</span>
		</button>
	{:else}
		<mux-player
			bind:this={playerEl}
			playback-id={playbackId}
			metadata-video-title={title}
			metadata-viewer-user-id="anonymous"
			stream-type="on-demand"
			muted={false}
			controls
			onloadedmetadata={handleLoadedMetadata}
		></mux-player>
	{/if}
</div>

<style>
	.premiere-player-wrapper {
		width: 100%;
		background: #000;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.stream-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.8);
		color: white;
	}

	.stream-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.live-badge {
		background: #ef4444;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-weight: 600;
	}

	mux-player {
		width: 100%;
		aspect-ratio: 16 / 9;
		--media-object-fit: contain;
		--media-object-position: center;
	}

	.join-button {
		width: 100%;
		aspect-ratio: 16 / 9;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
		border: none;
		color: white;
		cursor: pointer;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.join-button:hover {
		background: linear-gradient(135deg, #27303f 0%, #171f2b 100%);
	}

	.join-button svg {
		color: #ef4444;
	}
</style>
