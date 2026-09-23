<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import CountdownVideoPlayer from './CountdownVideoPlayer.svelte';
	import MuxVideoPlayer from './streaming/MuxVideoPlayer.svelte';
	import PremierePlayer from './streaming/PremierePlayer.svelte';
	import { selectDisplayRecordings, type Mp4Status } from '$lib/utils/recording-selection';
	import { hasPremiereAired, isRecordedStream as isRecordedStreamShared } from '$lib/utils/premiere';
	import { createServerClock } from '$lib/utils/serverClock';
	
	console.log('🎬 [MEMORIAL STREAM DISPLAY] Component loaded - Mux integration active');
	
	interface Stream {
		id: string;
		title: string;
		description?: string;
		status: string;
		memorialId?: string;
		scheduledStartTime?: string;
		// 'rtmp' (default, OBS/hardware broadcast) or 'upload' (premiere: a
		// pre-recorded file that plays back synced for everyone at start time).
		sourceType?: 'rtmp' | 'upload';
		cloudflareInputId?: string;
		cloudflareStreamId?: string;
		playbackUrl?: string;
		embedUrl?: string;
		isVisible?: boolean;
		recordingReady?: boolean;
		createdAt: string;
		updatedAt: string;
		createdBy: string;
		streamCredentials?: {
			cloudflareInputId?: string;
			whepUrl?: string;
			rtmpUrl?: string;
			streamKey?: string;
		};
		// NEW: Real-time live status fields
		liveWatchUrl?: string | null;
		liveVideoUid?: string;
		hlsUrl?: string;
		dashUrl?: string;
		liveStartedAt?: string;
		liveEndedAt?: string;
		
		// Mux streaming platform data (FIX-C)
		mux?: {
			liveStreamId: string;
			playbackId: string;
			rtmpUrl: string;
			streamKey: string;
			streamingStatus?: 'idle' | 'active' | 'disconnected';
			assetId?: string;
			vodPlaybackId?: string;
			recordingReady?: boolean;
			duration?: number;
			mp4Status?: Mp4Status;
			recordings?: { assetId: string; vodPlaybackId: string; duration?: number; createdAt: string; mp4Status?: Mp4Status }[];
			publishedRecordings?: string[];
		};
		
		// Note: chat is no longer per-stream — see MemorialChatWidget, which
		// renders once per memorial regardless of stream state.
		
		// Per-stream embed (above/below/replace video)
		embed?: {
			code: string;
			title?: string;
			position: 'above' | 'below' | 'replace';
			createdAt: string;
			createdBy: string;
		};
	}
	
	interface Props {
		streams: Stream[];
		memorialName: string;
	}
	
	let { streams, memorialName }: Props = $props();
	
	// Real-time stream updates - this will be updated by Firestore listeners
	let liveStreams = $state<Stream[]>(streams || []);
	
	// Current time for countdown — corrected against the server's clock so
	// viewers with an inaccurate device clock still see a synced premiere
	// (see $lib/utils/serverClock.ts). Falls back to the uncorrected local
	// clock until the first sync completes, and forever if it fails.
	const serverClock = createServerClock();
	let currentTime = $state(serverClock.now());
	
	// Download state tracking
	let downloadingStreamId = $state<string | null>(null);
	let downloadProgress = $state(0); // 0-100, only meaningful when content-length is known

	// Mux generates the downloadable MP4 asynchronously *after* the recording
	// is playable — `mp4Status` (set by the mux webhook, see
	// /api/webhooks/mux) tracks that separately so we don't attempt (and
	// fail) a download before the file actually exists.
	function getMp4Status(stream: Stream, recording?: RecordingItem): Mp4Status | undefined {
		return recording?.mp4Status ?? stream.mux?.mp4Status;
	}

	// In-flight/complete polls, keyed by assetId — plain (non-reactive) state
	// just to avoid starting duplicate polling loops.
	const mp4PollAttempts: Record<string, number> = {};
	const MAX_MP4_POLL_ATTEMPTS = 10;
	const MP4_POLL_INTERVAL_MS = 20_000;
	let destroyed = false;

	async function checkMp4Status(streamId: string, assetId: string): Promise<Mp4Status | null> {
		try {
			const res = await fetch(`/api/streams/${streamId}/mp4-status?assetId=${encodeURIComponent(assetId)}`);
			if (!res.ok) return null;
			const data = await res.json();
			return (data?.mp4Status as Mp4Status) ?? null;
		} catch (error) {
			console.error('❌ [MP4 STATUS] Check failed:', error);
			return null;
		}
	}

	// Applies a resolved mp4Status directly to local state for immediate UI
	// feedback. The Mux webhook (or this same check) also persists it to
	// Firestore, so the existing real-time listener will confirm the same
	// value shortly after — this is just so the button doesn't wait on that.
	function applyMp4StatusLocally(streamId: string, assetId: string, status: Mp4Status) {
		liveStreams = liveStreams.map((s) => {
			if (s.id !== streamId || !s.mux) return s;
			const recordings = s.mux.recordings?.map((r) =>
				r.assetId === assetId ? { ...r, mp4Status: status } : r
			);
			return {
				...s,
				mux: {
					...s.mux,
					recordings,
					...(s.mux.assetId === assetId ? { mp4Status: status } : {})
				}
			};
		});
	}

	async function pollMp4Status(streamId: string, assetId: string) {
		if (destroyed) return;
		const attempts = (mp4PollAttempts[assetId] ?? 0) + 1;
		mp4PollAttempts[assetId] = attempts;

		const status = await checkMp4Status(streamId, assetId);
		if (destroyed) return;
		if (status) applyMp4StatusLocally(streamId, assetId, status);

		if (status === 'ready' || status === 'errored' || attempts >= MAX_MP4_POLL_ATTEMPTS) {
			delete mp4PollAttempts[assetId];
			return;
		}

		setTimeout(() => pollMp4Status(streamId, assetId), MP4_POLL_INTERVAL_MS);
	}

	// Kicks off a status check (+ polling until resolved) for a recording
	// whose mp4Status is missing/unresolved — either the webhook hasn't
	// caught up yet, or this recording predates mp4Status tracking entirely.
	function ensureMp4StatusChecked(streamId: string, assetId: string) {
		if (assetId in mp4PollAttempts) return; // already checking/polling
		mp4PollAttempts[assetId] = 0;
		pollMp4Status(streamId, assetId);
	}

	// Proactively resolve MP4 readiness for every displayed recording that
	// doesn't already have a definitive status, so the button reflects
	// reality without requiring the viewer to click it first.
	$effect(() => {
		for (const stream of recordedStreams) {
			for (const recording of getDisplayRecordings(stream)) {
				const status = getMp4Status(stream, recording);
				if (status !== 'ready' && status !== 'errored' && recording.assetId) {
					ensureMp4StatusChecked(stream.id, recording.assetId);
				}
			}
		}
	});

	/**
	 * Handle video download - streams file (with progress) and triggers save dialog
	 */
	async function handleDownload(stream: Stream, recording?: RecordingItem) {
		const playbackId = recording?.vodPlaybackId || stream.mux?.vodPlaybackId;
		const assetId = recording?.assetId || stream.mux?.assetId;
		if (!playbackId || downloadingStreamId) return;

		// Don't attempt the download until Mux has actually confirmed the MP4
		// exists — kick off (or rely on) the status check/poll instead.
		if (getMp4Status(stream, recording) !== 'ready') {
			if (assetId) ensureMp4StatusChecked(stream.id, assetId);
			return;
		}

		const url = `https://stream.mux.com/${playbackId}/high.mp4`;
		const filename = `${stream.title || 'recording'}-${playbackId}.mp4`;
		
		downloadingStreamId = stream.id;
		downloadProgress = 0;
		// Ensure the spinner paints before the heavy network work begins
		await tick();
		
		try {
			console.log('📥 [DOWNLOAD] Starting download for:', filename);
			
			const response = await fetch(url);
			if (!response.ok) throw new Error(`Download failed: ${response.status}`);
			
			const total = Number(response.headers.get('content-length')) || 0;
			const reader = response.body?.getReader();
			let blob: Blob;
			
			if (reader) {
				const chunks: Uint8Array[] = [];
				let received = 0;
				for (;;) {
					const { done, value } = await reader.read();
					if (done) break;
					if (value) {
						chunks.push(value);
						received += value.length;
						if (total) downloadProgress = Math.round((received / total) * 100);
					}
				}
				blob = new Blob(chunks as BlobPart[]);
			} else {
				// Fallback when the response body isn't a readable stream
				blob = await response.blob();
			}
			
			const blobUrl = URL.createObjectURL(blob);
			
			// Create temporary link and trigger download
			const link = document.createElement('a');
			link.href = blobUrl;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			// Cleanup
			URL.revokeObjectURL(blobUrl);
			console.log('✅ [DOWNLOAD] Download completed:', filename);
		} catch (error) {
			console.error('❌ [DOWNLOAD] Failed:', error);
			alert('Download failed due to a network error. Please try again in a moment.');
		} finally {
			downloadingStreamId = null;
			downloadProgress = 0;
		}
	}
	
	// Firestore unsubscribe functions
	let firestoreUnsubscribes: (() => void)[] = [];
	
	// Update time every second for countdown
	onMount(() => {
		// Sync once up front, then periodically re-sync in case of long
		// sessions or throttled background tabs drifting the estimate.
		serverClock.sync();
		const clockSyncInterval = setInterval(() => serverClock.sync(), 5 * 60 * 1000);

		const timeInterval = setInterval(() => {
			currentTime = serverClock.now();
		}, 1000);
		
		// Setup Firestore real-time listeners for all streams
		if (browser && liveStreams.length > 0) {
			setupFirestoreListeners();
		}
		
		return () => {
			clearInterval(timeInterval);
			clearInterval(clockSyncInterval);
			// Cleanup Firestore listeners
			firestoreUnsubscribes.forEach(unsub => unsub());
			// Stop any in-flight MP4 status polling
			destroyed = true;
		};
	});
	
	/**
	 * Setup real-time Firestore listeners for all streams
	 * This allows instant UI updates when webhooks change stream status
	 */
	async function setupFirestoreListeners() {
		try {
			// Dynamically import Firestore to avoid SSR issues
			const { db } = await import('$lib/firebase');
			const { doc, onSnapshot } = await import('firebase/firestore');
			
			liveStreams.forEach((stream, index) => {
				const streamDocRef = doc(db, 'streams', stream.id);
				
				// Subscribe to real-time updates
				const unsubscribe = onSnapshot(
					streamDocRef,
					(snapshot) => {
						if (snapshot.exists()) {
							const updatedData = snapshot.data();
							
							console.log('🔄 [REALTIME] Stream updated:', stream.id, {
								status: updatedData.status,
								liveWatchUrl: updatedData.liveWatchUrl,
								scheduledStartTime: updatedData.scheduledStartTime,
								isVisible: updatedData.isVisible,
								hasCloudflareId: !!(updatedData.streamCredentials?.cloudflareInputId || updatedData.cloudflareInputId)
							});
							
							// Update the stream in our local state
							liveStreams = liveStreams.map((s, i) => 
								i === index ? { ...s, ...updatedData, id: stream.id } : s
							);
						}
					},
					(error) => {
						console.error('❌ [REALTIME] Firestore listener error for stream', stream.id, error);
					}
				);
				
				firestoreUnsubscribes.push(unsubscribe);
			});
			
			console.log('✅ [REALTIME] Firestore listeners setup for', liveStreams.length, 'streams');
		
		// Log initial stream states
		liveStreams.forEach(s => {
			console.log('📊 [INITIAL STATE]', s.id, {
				status: s.status,
				scheduledStartTime: s.scheduledStartTime,
				isVisible: s.isVisible,
				hasCloudflareId: !!(s.streamCredentials?.cloudflareInputId || s.cloudflareInputId),
				cloudflareInputId: s.streamCredentials?.cloudflareInputId || s.cloudflareInputId
			});
		});
		} catch (error) {
			console.error('❌ [REALTIME] Failed to setup Firestore listeners:', error);
		}
	}
	
	/**
	 * Whether an upload/premiere stream's scheduled runtime has fully elapsed
	 * (i.e. it has finished "airing" and should now appear as a normal
	 * recording). Only meaningful for `sourceType === 'upload'` streams —
	 * requires both a scheduled start time and a known asset duration.
	 *
	 * Delegates to the shared, unit-tested helper in `$lib/utils/premiere`.
	 */
	function uploadHasAired(s: Stream, now: Date): boolean {
		if (s.sourceType !== 'upload') return false;
		return hasPremiereAired(s.scheduledStartTime, s.mux?.duration, now);
	}

	/**
	 * Whether a stream should be treated as "recorded" (its own bucket).
	 * - RTMP streams: driven by status/recordingReady, same as always.
	 * - Upload/premiere streams: only once its scheduled runtime has fully
	 *   elapsed — NOT just because the underlying Mux asset finished
	 *   processing (that can happen long before the scheduled premiere time).
	 *
	 * Delegates to the shared, unit-tested helper in `$lib/utils/premiere`.
	 */
	function isRecordedStream(s: Stream, now: Date): boolean {
		return isRecordedStreamShared(s, now);
	}

	// Categorize streams based on REAL-TIME status from liveStreams
	// Live stream detection (respects scheduled times):
	// 1. Status is explicitly 'live' (set by webhook when broadcast starts), OR
	// 2. Mux streamingStatus is 'active' (immediate Mux webhook update), OR
	// 3. Stream is 'scheduled'/'ready' AND past scheduled start time (fallback if webhook delayed)
	// For upload/premiere streams: only "live" once the uploaded asset is
	// actually ready AND its runtime hasn't fully elapsed yet (see uploadHasAired).
	let categorizedLiveStreams = $derived(
		liveStreams.filter(s => {
			if (s.isVisible === false) return false;

			if (s.sourceType === 'upload') {
				if (!s.scheduledStartTime || !s.mux?.vodPlaybackId) return false;
				const scheduledTime = new Date(s.scheduledStartTime).getTime();
				const now = currentTime.getTime();
				return now >= scheduledTime && !uploadHasAired(s, currentTime);
			}
			
			// Explicitly marked as live by webhook
			if (s.status === 'live') return true;
			
			// Mux platform: Check if streamingStatus is active (FIX: ensures Mux streams show as live)
			if (s.mux?.streamingStatus === 'active') return true;
			
			// Fallback: If scheduled/ready BUT past the scheduled start time,
			// treat as live (handles cases where webhook is delayed)
			// This only applies if there IS a scheduled time
			if ((s.status === 'scheduled' || s.status === 'ready') && s.scheduledStartTime) {
				const scheduledTime = new Date(s.scheduledStartTime).getTime();
				const now = currentTime.getTime();
				
				// Only show as live if we're past the scheduled time
				if (now >= scheduledTime) return true;
			}
			
			return false;
		})
	);
	
	// Scheduled streams: Show if FUTURE scheduled time OR status is 'ready'/'scheduled' without recording
	// AND not already showing as live. For upload/premiere streams past their
	// start time but not yet processed (or missing a duration), staying in
	// this bucket keeps them visible with the existing countdown UI instead of
	// disappearing entirely.
	let scheduledStreams = $derived(
		liveStreams.filter(s => {
			if (s.isVisible === false) return false;
			
			// If already in live streams, don't show in scheduled
			const isInLiveStreams = categorizedLiveStreams.some(live => live.id === s.id);
			if (isInLiveStreams) return false;
			
			// If already recorded, don't show in scheduled
			if (isRecordedStream(s, currentTime)) return false;
			
			// Show if future scheduled time
			if (s.scheduledStartTime) {
				const scheduledTime = new Date(s.scheduledStartTime).getTime();
				const now = currentTime.getTime();
				
				if (s.sourceType === 'upload') {
					// Past start time but the video isn't ready/live yet (still
					// processing) — keep showing it here instead of dropping it.
					return true;
				}
				
				// Only show as scheduled if it's in the FUTURE
				if (scheduledTime > now && (s.status === 'scheduled' || s.status === 'ready')) {
					return true;
				}
			}
			
			// FALLBACK: Show 'ready' or 'scheduled' streams that have no scheduled time
			// This catches streams created without a scheduled time that haven't gone live yet
			if ((s.status === 'ready' || s.status === 'scheduled') && !s.scheduledStartTime) {
				return true;
			}
			
			return false;
		})
	);
	
	let recordedStreams = $derived(
		liveStreams.filter(s => {
			if (s.isVisible === false) return false;
			
			// Exclude streams that are currently showing as live (mutual exclusion)
			const isInLiveStreams = categorizedLiveStreams.some(live => live.id === s.id);
			if (isInLiveStreams) return false;
			
			const isRecording = isRecordedStream(s, currentTime);
			
			// Debug logging for recording detection
			if (s.mux?.vodPlaybackId || s.status === 'completed' || s.status === 'ended') {
				console.log('📼 [RECORDING CHECK]', s.id, {
					isRecording,
					status: s.status,
					sourceType: s.sourceType,
					isVisible: s.isVisible,
					isInLiveStreams,
					recordingReady: s.recordingReady,
					muxRecordingReady: s.mux?.recordingReady,
					muxVodPlaybackId: s.mux?.vodPlaybackId
				});
			}
			return isRecording;
		})
	);
	
	// Get playback URL for a stream - prioritize live watch URL
	function getPlaybackUrl(stream: Stream): string | null {
		// Priority 1: Live watch URL from webhook (for active broadcasts)
		if (stream.liveWatchUrl) {
			return stream.liveWatchUrl;
		}
		
		// Priority 2: Recording playback URLs
		if (stream.playbackUrl) return stream.playbackUrl;
		if (stream.embedUrl) return stream.embedUrl;
		
		// Priority 3: Construct iframe URL from Cloudflare IDs
		// For live/scheduled streams, use the cloudflareInputId to show live feed
		if (stream.streamCredentials?.cloudflareInputId) {
			return `https://iframe.cloudflarestream.com/${stream.streamCredentials.cloudflareInputId}`;
		}
		
		// Legacy: Try cloudflareInputId
		if (stream.cloudflareInputId) {
			return `https://iframe.cloudflarestream.com/${stream.cloudflareInputId}`;
		}
		
		// Legacy: Try cloudflareStreamId
		if (stream.cloudflareStreamId) {
			return `https://iframe.cloudflarestream.com/${stream.cloudflareStreamId}`;
		}
		
		return null;
	}
	
	// Resolve which recordings to actually display for a recorded stream.
	// Honors admin-curated `publishedRecordings` (ordered); otherwise falls back
	// to the latest recording (preserves prior behavior).
	type RecordingItem = { assetId: string; vodPlaybackId: string; duration?: number; createdAt: string; mp4Status?: Mp4Status };
	function getDisplayRecordings(stream: Stream): RecordingItem[] {
		return selectDisplayRecordings(stream.mux) as RecordingItem[];
	}

	// Determine if we should show any streams section
	let hasVisibleStreams = $derived(
		categorizedLiveStreams.length > 0 || scheduledStreams.length > 0 || recordedStreams.length > 0
	);
</script>

{#if hasVisibleStreams}
	<div class="memorial-streams">
		<!-- Live Streams -->
		{#if categorizedLiveStreams.length > 0}
			<div class="stream-section live-section">
				<h2 class="stream-section-title">
					<span class="live-indicator"></span>
					Live Now
				</h2>
				{#each categorizedLiveStreams as stream (stream.id)}
					<div class="stream-item">
						{#if stream.sourceType === 'upload' && stream.mux?.vodPlaybackId}
							<!-- PREMIERE (upload & schedule) - synced VOD playback, feels live -->
							<div class="mux-stream-container">
								<div class="video-column">
									<PremierePlayer
										playbackId={stream.mux.vodPlaybackId}
										scheduledStartTime={stream.scheduledStartTime ?? ''}
										duration={stream.mux.duration}
										title={stream.title}
										{currentTime}
										getNow={() => serverClock.now()}
									/>
								</div>
							</div>
						{:else if stream.mux?.playbackId}
							<!-- MUX PLATFORM - New integrated player. Chat is now memorial-wide (see MemorialChatWidget), not per-stream. -->
							<div class="mux-stream-container">
								<div class="video-column">
									{#if stream.embed && stream.embed.position === 'replace'}
										<!-- Per-stream embed - REPLACE video (keeps chat) -->
										<div class="stream-embed-container embed-replace">
											{#if stream.embed.title}
												<h4 class="stream-embed-title">{stream.embed.title}</h4>
											{/if}
											<div class="stream-embed-content">
												{@html stream.embed.code}
											</div>
										</div>
									{:else}
										<!-- Per-stream embed - ABOVE video -->
										{#if stream.embed && stream.embed.position === 'above'}
											<div class="stream-embed-container embed-above">
												{#if stream.embed.title}
													<h4 class="stream-embed-title">{stream.embed.title}</h4>
												{/if}
												<div class="stream-embed-content">
													{@html stream.embed.code}
												</div>
											</div>
										{/if}
										
										<MuxVideoPlayer stream={stream} autoplay={true} showTitle={true} />
										
										<!-- Per-stream embed - BELOW video -->
										{#if stream.embed && stream.embed.position === 'below'}
											<div class="stream-embed-container embed-below">
												{#if stream.embed.title}
													<h4 class="stream-embed-title">{stream.embed.title}</h4>
												{/if}
												<div class="stream-embed-content">
													{@html stream.embed.code}
												</div>
											</div>
										{/if}
									{/if}
								</div>
							</div>
						{:else}
							<!-- LEGACY CLOUDFLARE - Fallback iframe player -->
							<h3 class="stream-title">{stream.title}</h3>
							{#if stream.description}
								<p class="stream-description">{stream.description}</p>
							{/if}
							{#if getPlaybackUrl(stream)}
								<div class="stream-player">
									<iframe
										src={getPlaybackUrl(stream)}
										allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
										allowfullscreen={true}
										title={stream.title}
									></iframe>
								</div>
							{:else}
								<div class="stream-placeholder">
									<p>Stream is live. Please refresh the page if video doesn't appear.</p>
								</div>
							{/if}
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
					{@const displayRecordings = getDisplayRecordings(stream)}
					<div class="stream-item">
						{#if stream.mux?.recordingReady && (stream.mux?.recordings?.length || stream.mux?.vodPlaybackId)}
							<!-- MUX PLATFORM - Recorded video player with archived chat -->
							<div class="mux-stream-container">
								<div class="video-column">
									{#if stream.embed && stream.embed.position === 'replace'}
										<!-- Per-stream embed - REPLACE video (keeps chat) -->
										<div class="stream-embed-container embed-replace">
											{#if stream.embed.title}
												<h4 class="stream-embed-title">{stream.embed.title}</h4>
											{/if}
											<div class="stream-embed-content">
												{@html stream.embed.code}
											</div>
										</div>
									{:else}
										<!-- Per-stream embed - ABOVE video -->
										{#if stream.embed && stream.embed.position === 'above'}
											<div class="stream-embed-container embed-above">
												{#if stream.embed.title}
													<h4 class="stream-embed-title">{stream.embed.title}</h4>
												{/if}
												<div class="stream-embed-content">
													{@html stream.embed.code}
												</div>
											</div>
										{/if}
										
										{#each displayRecordings as recording, i (recording.vodPlaybackId)}
											<MuxVideoPlayer stream={stream} autoplay={false} showTitle={i === 0} forcedVodPlaybackId={recording.vodPlaybackId} />
										{/each}
										
										<!-- Download Buttons -->
										{#if displayRecordings.length}
											<div class="download-button-container">
												{#each displayRecordings as recording, i}
													{@const mp4Status = getMp4Status(stream, recording)}
													<button 
														type="button"
														class="download-master-button"
														class:download-master-button--pending={mp4Status !== 'ready'}
														disabled={downloadingStreamId === stream.id || mp4Status === 'errored'}
														title={mp4Status === 'errored' ? 'Download unavailable for this recording' : mp4Status !== 'ready' ? 'Preparing download — check back soon' : undefined}
														onclick={() => handleDownload(stream, recording)}
													>
														{#if downloadingStreamId === stream.id}
															<svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
																<circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
															</svg>
															{downloadProgress > 0 ? `Downloading... ${downloadProgress}%` : 'Downloading...'}
														{:else if mp4Status === 'errored'}
															Download unavailable
														{:else if mp4Status !== 'ready'}
															<svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
																<circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
															</svg>
															Preparing download... check back soon
														{:else}
															<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
																<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
																<polyline points="7 10 12 15 17 10"/>
																<line x1="12" y1="15" x2="12" y2="3"/>
															</svg>
															{displayRecordings.length > 1 ? `Download Part ${i + 1}` : 'Download Recording'}
														{/if}
													</button>
												{/each}
											</div>
										{:else if stream.mux?.vodPlaybackId}
											{@const mp4Status = getMp4Status(stream)}
											<div class="download-button-container">
												<button 
													type="button"
													class="download-master-button"
													class:download-master-button--pending={mp4Status !== 'ready'}
													disabled={downloadingStreamId === stream.id || mp4Status === 'errored'}
													title={mp4Status === 'errored' ? 'Download unavailable for this recording' : mp4Status !== 'ready' ? 'Preparing download — check back soon' : undefined}
													onclick={() => handleDownload(stream)}
												>
													{#if downloadingStreamId === stream.id}
														<svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
															<circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
														</svg>
														{downloadProgress > 0 ? `Downloading... ${downloadProgress}%` : 'Downloading...'}
													{:else if mp4Status === 'errored'}
														Download unavailable
													{:else if mp4Status !== 'ready'}
														<svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
															<circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
														</svg>
														Preparing download... check back soon
													{:else}
														<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
															<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
															<polyline points="7 10 12 15 17 10"/>
															<line x1="12" y1="15" x2="12" y2="3"/>
														</svg>
														Download Master
													{/if}
												</button>
											</div>
										{/if}
										
										<!-- Per-stream embed - BELOW video -->
										{#if stream.embed && stream.embed.position === 'below'}
											<div class="stream-embed-container embed-below">
												{#if stream.embed.title}
													<h4 class="stream-embed-title">{stream.embed.title}</h4>
												{/if}
												<div class="stream-embed-content">
													{@html stream.embed.code}
												</div>
											</div>
										{/if}
									{/if}
								</div>
							</div>
						{:else if stream.status === 'ended' && !stream.mux?.recordingReady}
							<!-- Stream ended but recording still processing -->
							<div class="mux-stream-container">
								<div class="video-column">
									<div class="recording-processing">
										<div class="processing-content">
											<div class="processing-spinner"></div>
											<h3 class="stream-title">{stream.title}</h3>
											<p class="processing-message">The service has ended. Recording is being processed...</p>
											<p class="processing-submessage">This usually takes a few minutes. The page will update automatically.</p>
										</div>
									</div>
								</div>
							</div>
						{:else}
							<!-- LEGACY CLOUDFLARE - Fallback iframe player -->
							<h3 class="stream-title">{stream.title}</h3>
							{#if stream.description}
								<p class="stream-description">{stream.description}</p>
							{/if}
							{#if getPlaybackUrl(stream)}
								<div class="stream-player">
									<iframe
										src={getPlaybackUrl(stream)}
										allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
										allowfullscreen={true}
										title={stream.title}
									></iframe>
								</div>
							{:else}
								<div class="stream-placeholder">
									<p>Recording is being processed. Please check back later.</p>
								</div>
							{/if}
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
		box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
	}
	
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
			transform: scale(1);
			box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
		}
		50% {
			opacity: 0.8;
			transform: scale(1.1);
			box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
		}
	}
	
	.stream-item {
		margin-bottom: 2rem;
		transition: all 0.5s ease-in-out;
	}
	
	/* Smooth entry animation for live streams */
	.live-section .stream-item {
		animation: fadeInScale 0.8s ease-out;
	}
	
	@keyframes fadeInScale {
		0% {
			opacity: 0;
			transform: scale(0.95) translateY(10px);
		}
		50% {
			opacity: 1;
			transform: scale(1.02) translateY(0);
		}
		100% {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}
	
	/* Smooth fade for scheduled streams that disappear */
	.scheduled-section .stream-item {
		animation: fadeIn 0.5s ease-in;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
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
	
	/* Embed Container - Clean and normal styling */
	.embed-container {
		position: relative;
		width: 100%;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		background: #000;
		border-radius: 8px;
		overflow: hidden;
	}
	
	.embed-container :global(iframe) {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: none;
	}
	
	.embed-container :global(video) {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
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
	
	/* Recording Processing State */
	.recording-processing {
		position: relative;
		width: 100%;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%);
		border-radius: 8px;
		overflow: hidden;
	}
	
	.processing-content {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
	}
	
	.processing-spinner {
		width: 48px;
		height: 48px;
		border: 3px solid rgba(213, 186, 127, 0.2);
		border-top-color: #D5BA7F;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1.5rem;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.processing-message {
		font-size: 1.1rem;
		color: #e0e0e0;
		margin: 0.75rem 0 0.5rem;
	}
	
	.processing-submessage {
		font-size: 0.9rem;
		color: #a0a0a0;
		margin: 0;
		font-style: italic;
	}
	
	/* Mux Stream Container - video only; chat is memorial-wide (MemorialChatWidget), not per-stream */
	.mux-stream-container {
		display: grid;
		grid-template-columns: 1fr;
		max-width: 800px;
		margin: 1rem auto 0;
	}
	
	.video-column {
		min-width: 0; /* Prevent grid overflow */
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
		
		.mux-stream-container {
			gap: 1rem;
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
	
	/* Download Master Button - Centered below video */
	.download-button-container {
		display: flex;
		justify-content: center;
		padding: 1rem 0;
	}

	.download-master-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #D5BA7F 0%, #c4a96e 100%);
		color: #1a1a1a;
		font-weight: 600;
		font-size: 0.95rem;
		border-radius: 8px;
		text-decoration: none;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(213, 186, 127, 0.3);
	}

	.download-master-button:hover {
		background: linear-gradient(135deg, #e5ca8f 0%, #d4b97e 100%);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(213, 186, 127, 0.4);
	}

	.download-master-button svg {
		flex-shrink: 0;
	}

	.download-master-button:disabled {
		opacity: 0.7;
		cursor: wait;
	}

	.download-master-button--pending {
		background: linear-gradient(135deg, #d9d9d9 0%, #c4c4c4 100%);
		cursor: progress;
	}

	.download-master-button--pending:hover {
		background: linear-gradient(135deg, #d9d9d9 0%, #c4c4c4 100%);
		transform: none;
		box-shadow: none;
	}

	.download-master-button .spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	@media (max-width: 768px) {
		.download-master-button {
			padding: 0.625rem 1.25rem;
			font-size: 0.875rem;
		}
	}

	/* Per-stream Embed Styles */
	.stream-embed-container {
		margin: 1rem 0;
		border-radius: 8px;
		overflow: hidden;
		background: #1a1a1a;
		border: 1px solid #3a3a3a;
	}

	.stream-embed-container.embed-above {
		margin-bottom: 1rem;
		margin-top: 0;
	}

	.stream-embed-container.embed-below {
		margin-top: 1rem;
		margin-bottom: 0;
	}

	.stream-embed-container.embed-replace {
		margin: 0;
		min-height: 400px;
	}

	.stream-embed-title {
		margin: 0;
		padding: 0.75rem 1rem;
		font-size: 0.95rem;
		font-weight: 600;
		color: #D5BA7F;
		background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
		border-bottom: 1px solid #3a3a3a;
	}

	.stream-embed-content {
		position: relative;
		width: 100%;
		background: #000;
	}

	.stream-embed-content :global(iframe) {
		width: 100%;
		aspect-ratio: 16 / 9;
		border: none;
		display: block;
	}

	@media (max-width: 768px) {
		.stream-embed-container {
			margin: 0.75rem 0;
		}

		.stream-embed-title {
			font-size: 0.875rem;
			padding: 0.625rem 0.875rem;
		}
	}
</style>
