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
	 *
	 * Seek-lock: viewers must not be able to scrub backward/forward while the
	 * premiere is "live". The scrubber, seek-forward/backward buttons, and
	 * Picture-in-Picture button are hidden via Mux Player's CSS custom
	 * properties, and keyboard seek hotkeys are disabled (`nohotkeys`). As a
	 * defense-in-depth backstop — since those only hide the obvious
	 * affordances (e.g. iOS Safari's native fullscreen chrome bypasses our
	 * CSS, and OS media-session lock-screen scrubbers aren't stylable at
	 * all) — an `onseeking` handler snaps playback back to the correct live
	 * offset the instant any seek is detected, regardless of how it was
	 * triggered. Pausing is allowed, but resuming snaps forward to the
	 * current live position rather than continuing from where it was paused.
	 *
	 * iOS Safari: `playsinline` keeps playback inline instead of handing off
	 * to the OS's native fullscreen player on play (which would show a real,
	 * unstyleable scrubber). The Fullscreen button itself is additionally
	 * hidden when the Fullscreen API isn't available at all — true on iPhone
	 * Safari, which only offers `webkitEnterFullscreen` — since entering
	 * fullscreen there falls back to that same native, unstyleable chrome.
	 * Desktop, Android, and iPad keep the Fullscreen API (and therefore our
	 * Media Chrome controls, with the scrubber still hidden) in fullscreen.
	 */
	import '@mux/mux-player';
	import { elapsedPremiereSeconds } from '$lib/utils/premiere';

	interface Props {
		playbackId: string;
		scheduledStartTime: string;
		duration?: number;
		title?: string;
		currentTime: Date;
		/**
		 * Returns the current time, corrected for client/server clock skew
		 * (see `$lib/utils/serverClock.ts`). Defaults to the viewer's raw
		 * device clock if not provided.
		 */
		getNow?: () => Date;
	}

	let {
		playbackId,
		scheduledStartTime,
		duration,
		title,
		currentTime,
		getNow = () => new Date()
	}: Props = $props();

	let joined = $state(false);
	let playerEl: any = $state(null);
	let resyncInterval: ReturnType<typeof setInterval> | null = null;
	// True on browsers with no real Fullscreen API (i.e. iPhone Safari) —
	// only there does the Fullscreen button need to be hidden entirely.
	let hideFullscreenButton = $state(false);

	$effect(() => {
		if (typeof document !== 'undefined') {
			hideFullscreenButton = document.fullscreenEnabled === false;
		}
	});

	const RESYNC_INTERVAL_MS = 15000;
	const RESYNC_DRIFT_THRESHOLD_S = 4;
	// Tighter threshold for the resume-snap check — any noticeable pause
	// should snap forward, not just large drift from buffering.
	const RESUME_DRIFT_THRESHOLD_S = 2;

	function elapsedSeconds(now: Date): number {
		return elapsedPremiereSeconds(scheduledStartTime, now, duration);
	}

	function snapToLive(reason: string) {
		if (!playerEl || typeof playerEl.currentTime !== 'number') return;
		const expected = elapsedSeconds(getNow());
		console.log(`🎬 [PREMIERE PLAYER] Snapping to live position (${reason}):`, expected);
		try {
			playerEl.currentTime = expected;
		} catch (err) {
			console.error('❌ [PREMIERE PLAYER] Failed to snap to live position:', err);
		}
	}

	function handleLoadedMetadata() {
		if (!playerEl) return;
		const offset = elapsedSeconds(getNow());
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

	// Fires the instant currentTime is changed by ANY means (scrubber,
	// keyboard, OS media-session controls, PiP, iOS native-fullscreen
	// chrome, etc.) — the real backstop behind the hidden/disabled UI.
	function handleSeeking() {
		snapToLive('seek detected');
	}

	// Whenever playback (re)starts — including resuming after a pause —
	// snap forward if we've drifted so a viewer can't "catch up" from
	// wherever they paused.
	function handlePlay() {
		if (!playerEl || typeof playerEl.currentTime !== 'number') return;
		const expected = elapsedSeconds(getNow());
		const drift = Math.abs(playerEl.currentTime - expected);
		if (drift > RESUME_DRIFT_THRESHOLD_S) {
			snapToLive('resume drift');
		}
	}

	function resync() {
		if (!playerEl || typeof playerEl.currentTime !== 'number') return;
		const expected = elapsedSeconds(getNow());
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
			class="premiere-locked"
			class:hide-fullscreen={hideFullscreenButton}
			playback-id={playbackId}
			metadata-video-title={title}
			metadata-viewer-user-id="anonymous"
			stream-type="on-demand"
			muted={false}
			controls
			nohotkeys
			playsinline
			onloadedmetadata={handleLoadedMetadata}
			onseeking={handleSeeking}
			onplay={handlePlay}
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

	/* Seek-lock: hide the scrubber, seek-forward/backward buttons, and
	   Picture-in-Picture button (PiP has its own native scrubber we can't
	   style). Play/pause, mute/volume, and fullscreen stay available. This
	   is UI-level only — the real enforcement is the onseeking/onplay
	   handlers in the script above, since a determined viewer can still
	   trigger a seek via keyboard, OS media-session controls, or (on iOS)
	   native fullscreen chrome that bypasses this CSS entirely. */
	mux-player.premiere-locked {
		--time-range: none;
		--seek-backward-button: none;
		--seek-forward-button: none;
		--pip-button: none;
	}

	/* iPhone Safari has no real Fullscreen API — entering "fullscreen" there
	   falls back to native, unstyleable chrome with a real scrubber. Hide the
	   button entirely rather than let it open that. */
	mux-player.premiere-locked.hide-fullscreen {
		--fullscreen-button: none;
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
