<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	
	let { 
		memorial,
		liveStreams = [],
		scheduledStreams = [],
		completedStreams = []
	}: {
		memorial: any;
		liveStreams?: any[];
		scheduledStreams?: any[];
		completedStreams?: any[];
	} = $props();

	// Reactive streams that can be updated by polling
	let currentLiveStreams = $state([...liveStreams]);
	let currentScheduledStreams = $state([...scheduledStreams]);
	let currentCompletedStreams = $state([...completedStreams]);
	
	// Sync with prop changes
	$effect(() => {
		console.log('📺 Props changed, syncing streams:', {
			liveStreams: liveStreams.length,
			scheduledStreams: scheduledStreams.length,
			completedStreams: completedStreams.length
		});
		console.log('📺 Prop streams details:', {
			live: liveStreams.map(s => ({ id: s.id, title: s.title, status: s.status, isVisible: s.isVisible })),
			scheduled: scheduledStreams.map(s => ({ id: s.id, title: s.title, status: s.status, isVisible: s.isVisible })),
			completed: completedStreams.map(s => ({ id: s.id, title: s.title, status: s.status, isVisible: s.isVisible, recordingReady: s.recordingReady }))
		});
		currentLiveStreams = [...liveStreams];
		currentScheduledStreams = [...scheduledStreams];
		currentCompletedStreams = [...completedStreams];
	});
	
	// Polling state
	let pollingInterval: NodeJS.Timeout | null = null;
	let isPolling = $state(false);
	let lastUpdateTime = $state(new Date());

	// Check if we have any streams at all
	const hasAnyStreams = $derived(
		currentLiveStreams.length > 0 || currentScheduledStreams.length > 0 || currentCompletedStreams.length > 0
	);

	// Debug effect to log stream data
	$effect(() => {
		console.log('📺 MemorialStreamDisplay - Current streams:', {
			memorial: memorial?.lovedOneName,
			memorialId: memorial?.id,
			live: currentLiveStreams.length,
			scheduled: currentScheduledStreams.length,
			completed: currentCompletedStreams.length,
			hasAnyStreams,
			liveStreamsData: currentLiveStreams.map(s => ({ id: s.id, title: s.title, status: s.status })),
			scheduledStreamsData: currentScheduledStreams.map(s => ({ id: s.id, title: s.title, status: s.status })),
			completedStreamsData: currentCompletedStreams.map(s => ({ id: s.id, title: s.title, status: s.status }))
		});
	});

	// Format date/time for display
	function formatDateTime(dateTimeString: string) {
		if (!dateTimeString) return 'Time TBD';
		const date = new Date(dateTimeString);
		return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	// Format duration for display
	function formatDuration(seconds: number) {
		if (!seconds) return '';
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	}

	// Polling function to check for stream updates
	async function checkForStreamUpdates() {
		if (!memorial?.id) return;
		
		try {
			isPolling = true;
			console.log('📺 Polling for stream updates...');
			
			// Use the same endpoint that loads the page data
			const response = await fetch(`/api/memorials/${memorial.id}/streams`);
			
			if (response.ok) {
				const data = await response.json();
				console.log('📺 Polling response:', data);
				
				// Extract streams by status from the unified API response
				// For public viewing, use publicRecordedStreams (visible + ready recordings)
				const newLiveStreams = data.liveStreams || [];
				const newScheduledStreams = data.scheduledStreams || [];
				const newCompletedStreams = data.publicRecordedStreams || data.recordedStreams || [];
				
				console.log('📺 Polling stream breakdown:', {
					live: newLiveStreams.length,
					scheduled: newScheduledStreams.length,
					completed: newCompletedStreams.length,
					allRecorded: (data.recordedStreams || []).length,
					publicRecorded: (data.publicRecordedStreams || []).length
				});
				
				// Check if there are any changes
				const hasChanges = 
					newLiveStreams.length !== currentLiveStreams.length ||
					newScheduledStreams.length !== currentScheduledStreams.length ||
					newCompletedStreams.length !== currentCompletedStreams.length ||
					JSON.stringify(newLiveStreams) !== JSON.stringify(currentLiveStreams);

				if (hasChanges) {
					console.log('📺 Stream status changed, updating display:', {
						before: {
							live: currentLiveStreams.length,
							scheduled: currentScheduledStreams.length,
							completed: currentCompletedStreams.length
						},
						after: {
							live: newLiveStreams.length,
							scheduled: newScheduledStreams.length,
							completed: newCompletedStreams.length
						}
					});

					// Update streams
					currentLiveStreams = newLiveStreams;
					currentScheduledStreams = newScheduledStreams;
					currentCompletedStreams = newCompletedStreams;
					lastUpdateTime = new Date();
				} else {
					console.log('📺 No stream changes detected');
				}
			} else {
				console.warn('📺 Failed to poll stream updates:', response.status);
			}
		} catch (error) {
			console.error('Failed to check stream updates:', error);
		} finally {
			isPolling = false;
		}
	}

	// Start polling for updates
	function startPolling() {
		if (pollingInterval) return; // Already polling
		
		console.log('📺 Starting stream status polling for memorial:', memorial.id);
		
		// Poll every 10 seconds
		pollingInterval = setInterval(checkForStreamUpdates, 10000);
		
		// Also check immediately
		checkForStreamUpdates();
	}

	// Stop polling
	function stopPolling() {
		if (pollingInterval) {
			console.log('📺 Stopping stream status polling');
			clearInterval(pollingInterval);
			pollingInterval = null;
		}
	}

	// Real-time Firestore listeners
	let firestoreUnsubscribes: (() => void)[] = [];

	// Start real-time listeners for stream changes
	function startRealtimeListeners() {
		if (!memorial?.id) return;
		
		console.log('🔥 Starting Firestore real-time listeners for memorial:', memorial.id);
		
		// Import Firestore client-side
		import('firebase/firestore').then(({ onSnapshot, collection, query, where, orderBy }) => {
			import('$lib/firebase').then(({ db }) => {
				// Listen to unified streams collection
				// Note: Using isVisible != false to match server-side logic (includes null and true)
				const unifiedStreamsQuery = query(
					collection(db, 'streams'),
					where('memorialId', '==', memorial.id),
					where('isVisible', '!=', false),
					orderBy('isVisible'), // Required for != queries
					orderBy('createdAt', 'desc')
				);
				
				const unsubscribeUnified = onSnapshot(unifiedStreamsQuery, (snapshot) => {
					console.log('🔥 Unified streams real-time update:', snapshot.size, 'streams');
					const updatedStreams = snapshot.docs.map(doc => ({
						id: doc.id,
						...doc.data()
					}));
					
					console.log('🔥 Real-time streams visibility check:', updatedStreams.map(s => ({
						id: s.id,
						title: s.title,
						status: s.status,
						isVisible: s.isVisible,
						recordingReady: s.recordingReady
					})));
					
					// Update reactive state
					updateStreamsFromFirestore(updatedStreams, 'unified');
				});
				
				firestoreUnsubscribes.push(unsubscribeUnified);
			});
		});
	}

	// Update streams from Firestore real-time updates
	function updateStreamsFromFirestore(streams: any[], source: 'unified' | 'mvp_two') {
		console.log(`🔥 Processing ${source} streams update:`, streams.length);
		
		// Separate by status - for public viewing, only show completed streams with recordings
		const liveStreams = streams.filter(stream => stream.status === 'live');
		const scheduledStreams = streams.filter(stream => 
			stream.status === 'scheduled' || stream.status === 'ready'
		);
		const completedStreams = streams.filter(stream => 
			stream.status === 'completed' && stream.recordingReady && stream.isVisible !== false
		);
		
		console.log('🔥 Stream filtering results:', {
			total: streams.length,
			live: liveStreams.length,
			scheduled: scheduledStreams.length,
			completed: completedStreams.length,
			completedBreakdown: {
				allCompleted: streams.filter(s => s.status === 'completed').length,
				withRecordings: streams.filter(s => s.status === 'completed' && s.recordingReady).length,
				visible: streams.filter(s => s.status === 'completed' && s.isVisible !== false).length,
				final: completedStreams.length
			}
		});
		
		// Update the reactive state directly
		currentLiveStreams = liveStreams;
		currentScheduledStreams = scheduledStreams;
		currentCompletedStreams = completedStreams;
		
		lastUpdateTime = new Date();
		console.log('🔥 Streams updated via Firestore real-time:', {
			live: currentLiveStreams.length,
			scheduled: currentScheduledStreams.length,
			completed: currentCompletedStreams.length
		});
	}

	// Stop real-time listeners
	function stopRealtimeListeners() {
		console.log('🔥 Stopping Firestore real-time listeners...');
		firestoreUnsubscribes.forEach(unsubscribe => unsubscribe());
		firestoreUnsubscribes = [];
	}

	// Manual refresh function
	async function manualRefresh() {
		console.log('📺 Manual refresh triggered');
		await checkForStreamUpdates();
	}

	// Fix stream playback URLs and CORS configuration
	async function fixStreamPlayback(streamId: string) {
		console.log('🔧 Fixing stream playback for:', streamId);
		
		try {
			// Fix playback URL using unified API
			const playbackResponse = await fetch(`/api/streams/${streamId}/fix-playback-url`, {
				method: 'POST'
			});
			
			if (playbackResponse.ok) {
				const playbackData = await playbackResponse.json();
				console.log('✅ [UNIFIED] Playback URL fixed:', playbackData);
			} else {
				const errorData = await playbackResponse.json();
				console.warn('⚠️ [UNIFIED] Failed to fix playback URL:', errorData);
			}

			// Configure CORS using unified API
			const corsResponse = await fetch(`/api/streams/${streamId}/configure-cors`, {
				method: 'POST'
			});
			
			if (corsResponse.ok) {
				const corsData = await corsResponse.json();
				console.log('✅ [UNIFIED] CORS configured:', corsData);
			} else {
				const errorData = await corsResponse.json();
				console.warn('⚠️ [UNIFIED] Failed to configure CORS:', errorData);
			}

			// Refresh stream data after fixes
			await checkForStreamUpdates();
			
		} catch (error) {
			console.error('❌ Error fixing stream playback:', error);
		}
	}

	// Auto-fix live streams when detected
	$effect(() => {
		// Auto-fix any live streams that don't have proper playback URLs
		currentLiveStreams.forEach(stream => {
			if (!stream.playbackUrl || stream.playbackUrl.includes('placeholder')) {
				console.log('🔧 Auto-fixing live stream playback:', stream.id);
				fixStreamPlayback(stream.id);
			}
		});
	});

	// Initialize on mount
	onMount(() => {
		console.log('🎬 MemorialStreamDisplay mounted, starting real-time listeners');
		
		// TEMPORARILY DISABLED: Start real-time Firestore listeners for instant updates
		// startRealtimeListeners();
		
		// Start polling as fallback (reduced frequency since we have real-time)
		if (currentScheduledStreams.length > 0 || !hasAnyStreams) {
			startPolling();
		}
		
		console.log('⚠️ Real-time listeners DISABLED for debugging - using polling only');
	});

	// Cleanup on destroy
	onDestroy(() => {
		console.log('🎬 MemorialStreamDisplay unmounting, cleaning up listeners');
		stopPolling();
		stopRealtimeListeners();
	});

	// Watch for changes in stream status to adjust polling
	$effect(() => {
		// If we have live streams, we might want to continue polling to detect when they end
		// If we only have completed streams, we can stop polling
		// If we have scheduled streams, we definitely want to poll
		
		const shouldPoll = currentScheduledStreams.length > 0 || 
						  currentLiveStreams.length > 0 || 
						  !hasAnyStreams;
		
		if (shouldPoll && !pollingInterval) {
			startPolling();
		} else if (!shouldPoll && pollingInterval) {
			stopPolling();
		}
	});
</script>

<div class="memorial-stream-container">
	{#if !hasAnyStreams}
		<!-- No streams - show placeholder -->
		<div class="placeholder-section">
			<h2 class="section-title">Celebration of Life for {memorial.lovedOneName}</h2>
			<div class="video-placeholder">
				<div class="play-icon">
					<svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M8 5V19L19 12L8 5Z" fill="white"/>
					</svg>
				</div>
				<p class="placeholder-text">No livestream scheduled at this time</p>
			</div>
		</div>
	{:else}
		<!-- We have streams - display based on priority -->
		
		<!-- Refresh indicator and manual refresh button -->
		<div class="stream-status-bar">
			<div class="status-info">
				{#if isPolling}
					<div class="polling-indicator">
						<div class="pulse-dot small"></div>
						<span>Checking for updates...</span>
					</div>
				{:else}
					<span class="last-update">Last updated: {lastUpdateTime.toLocaleTimeString()}</span>
				{/if}
			</div>
			<div class="button-group">
				<button 
					class="refresh-button" 
					onclick={manualRefresh}
					disabled={isPolling}
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class:spinning={isPolling}>
						<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M3 21v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					Refresh
				</button>
				
				{#if currentLiveStreams.length > 0}
					<button 
						class="fix-button" 
						onclick={() => currentLiveStreams.forEach(stream => fixStreamPlayback(stream.id))}
						disabled={isPolling}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" stroke-width="2"/>
						</svg>
						Fix Video
					</button>
				{/if}
			</div>
		</div>

		<!-- LIVE STREAMS - Show if any exist -->
		{#if currentLiveStreams.length > 0}
			<div class="live-section">
				<div class="section-header">
					<h2 class="section-title">🔴 Live Memorial Service</h2>
					<div class="live-indicator">
						<div class="pulse-dot"></div>
						<span>LIVE NOW</span>
					</div>
				</div>
				
				{#each currentLiveStreams as stream}
					<div class="stream-card live-stream">
						<div class="stream-info">
							<h3 class="stream-title">{stream.title}</h3>
							{#if stream.description}
								<p class="stream-description">{stream.description}</p>
							{/if}
						</div>
						
						<!-- Cloudflare Stream Player -->
						<div class="video-container">
							{#if stream.playbackUrl}
								<iframe
									src={stream.playbackUrl}
									allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
									allowfullscreen="true"
									class="stream-player"
									onload={() => console.log('📺 Live stream iframe loaded:', stream.playbackUrl)}
									onerror={() => console.error('❌ Live stream iframe error:', stream.playbackUrl)}
								></iframe>
								<!-- Debug info -->
								<div class="debug-info">
									<small>Stream ID: {stream.id}</small>
									<small>Cloudflare ID: {stream.cloudflareId || 'Not set'}</small>
									<small>Status: {stream.status}</small>
									<small>URL: {stream.playbackUrl}</small>
								</div>
							{:else}
								<div class="loading-player">
									<div class="spinner"></div>
									<p>Loading live stream...</p>
									<div class="debug-info">
										<small>Stream ID: {stream.id}</small>
										<small>Status: {stream.status}</small>
										<small>No playback URL available</small>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- SCHEDULED STREAMS - Show if any exist -->
		{#if currentScheduledStreams.length > 0}
			<!-- SCHEDULED STREAMS - Show in video frame with overlay -->
			<div class="scheduled-section">
				<h2 class="section-title">📅 Upcoming Memorial Service</h2>
				
				{#each currentScheduledStreams as stream}
					<div class="stream-card scheduled-stream">
						<div class="stream-info">
							<h3 class="stream-title">{stream.title}</h3>
							{#if stream.description}
								<p class="stream-description">{stream.description}</p>
							{/if}
						</div>
						
						<!-- Video frame with centered schedule overlay -->
						<div class="video-container">
							<div class="scheduled-overlay">
								<div class="schedule-content">
									<div class="calendar-icon">
										<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="white" stroke-width="2"/>
											<line x1="16" y1="2" x2="16" y2="6" stroke="white" stroke-width="2"/>
											<line x1="8" y1="2" x2="8" y2="6" stroke="white" stroke-width="2"/>
											<line x1="3" y1="10" x2="21" y2="10" stroke="white" stroke-width="2"/>
										</svg>
									</div>
									<h4 class="schedule-title">Service Scheduled</h4>
									<div class="schedule-time-display">
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
											<polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2"/>
										</svg>
										<span>{formatDateTime(stream.scheduledDateTime)}</span>
									</div>
									<p class="schedule-message">The livestream will begin at the scheduled time</p>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- STREAMS WITH MULTIPLE RECORDINGS -->
		{#if currentLiveStreams.length > 0 || currentCompletedStreams.length > 0}
			{#each [...currentLiveStreams, ...currentCompletedStreams] as stream}
				<div class="stream-container">
					<div class="stream-header">
						<h3 class="stream-title">{stream.title}</h3>
						{#if stream.description}
							<p class="stream-description">{stream.description}</p>
						{/if}
						<div class="stream-status">
							{#if stream.status === 'live'}
								<span class="status-badge live">🔴 LIVE</span>
							{:else if stream.status === 'ready'}
								<span class="status-badge ready">⚪ Ready to Stream</span>
							{:else}
								<span class="status-badge completed">⚫ Completed</span>
							{/if}
						</div>
					</div>

					<!-- LIVE PLAYER (if currently live) -->
					{#if stream.status === 'live' && stream.playbackUrl}
						<div class="recording-session live-session">
							<div class="session-header">
								<h4>🔴 Live Now</h4>
								<span class="live-indicator">
									<div class="pulse-dot"></div>
									BROADCASTING
								</span>
							</div>
							<div class="video-container">
								<iframe
									src={stream.playbackUrl}
									allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
									allowfullscreen="true"
									class="stream-player"
								></iframe>
							</div>
						</div>
					{/if}

					<!-- RECORDING SESSIONS -->
					{#if stream.recordingSessions && stream.recordingSessions.length > 0}
						<div class="recordings-list">
							<h4 class="recordings-title">📹 Recorded Sessions ({stream.recordingSessions.length})</h4>
							{#each stream.recordingSessions as session, index}
								<div class="recording-session" class:processing={!session.recordingReady}>
									<div class="session-header">
										<div class="session-info">
											<h5>Session {index + 1}</h5>
											<span class="session-date">
												{formatDateTime(session.startTime)}
												{#if session.endTime}
													- {formatDateTime(session.endTime)}
												{/if}
											</span>
											{#if session.duration}
												<span class="session-duration">
													({formatDuration(session.duration)})
												</span>
											{/if}
										</div>
										<div class="session-status">
											{#if session.recordingReady}
												<span class="status-badge ready">✅ Ready</span>
											{:else}
												<span class="status-badge processing">⏳ Processing</span>
											{/if}
										</div>
									</div>

									<!-- VIDEO PLAYER -->
									<div class="video-container">
										{#if session.recordingReady && (session.recordingUrl || session.playbackUrl)}
											<iframe
												src={session.recordingUrl || session.playbackUrl}
												allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
												allowfullscreen="true"
												class="stream-player"
											></iframe>
										{:else}
											<div class="loading-player">
												<div class="spinner"></div>
												<p>
													{#if session.recordingReady}
														Loading recording...
													{:else}
														Processing recording...
													{/if}
												</p>
												<small>Session ID: {session.sessionId}</small>
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{:else if stream.status !== 'live'}
						<!-- LEGACY SINGLE RECORDING SUPPORT -->
						{#if stream.recordingReady && stream.recordingPlaybackUrl}
							<div class="recording-session">
								<div class="session-header">
									<h4>📹 Recording</h4>
									<span class="status-badge ready">✅ Ready</span>
								</div>
								<div class="video-container">
									<iframe
										src={stream.recordingPlaybackUrl}
										allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
										allowfullscreen="true"
										class="stream-player"
									></iframe>
								</div>
							</div>
						{:else if stream.status === 'ready'}
							<div class="no-recordings">
								<p>🎬 Ready to start streaming</p>
								<small>Recordings will appear here after each streaming session</small>
							</div>
						{/if}
					{/if}
				</div>
			{/each}
		{/if}
	{/if}
</div>

<style>
	.memorial-stream-container {
		background-color: black;
		padding: 2rem;
		min-height: 400px;
	}

	.stream-container {
		margin-bottom: 3rem;
		border: 1px solid #333;
		border-radius: 12px;
		overflow: hidden;
		background: #111;
	}

	.stream-header {
		padding: 1.5rem;
		background: #1a1a1a;
		border-bottom: 1px solid #333;
	}

	.stream-status {
		margin-top: 0.5rem;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: bold;
	}

	.status-badge.live {
		background: #ff4444;
		color: white;
	}

	.status-badge.ready {
		background: #44ff44;
		color: black;
	}

	.status-badge.completed {
		background: #666;
		color: white;
	}

	.status-badge.processing {
		background: #ffaa44;
		color: black;
	}

	.recordings-list {
		padding: 1rem;
	}

	.recordings-title {
		color: white;
		font-size: 1.2rem;
		margin-bottom: 1rem;
		border-bottom: 1px solid #333;
		padding-bottom: 0.5rem;
	}

	.recording-session {
		margin-bottom: 2rem;
		border: 1px solid #333;
		border-radius: 8px;
		overflow: hidden;
		background: #0a0a0a;
	}

	.recording-session.live-session {
		border-color: #ff4444;
		box-shadow: 0 0 20px rgba(255, 68, 68, 0.3);
	}

	.recording-session.processing {
		border-color: #ffaa44;
		opacity: 0.8;
	}

	.session-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #1a1a1a;
		border-bottom: 1px solid #333;
	}

	.session-info h5 {
		color: white;
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
	}

	.session-date, .session-duration {
		color: #ccc;
		font-size: 0.8rem;
		display: block;
	}

	.no-recordings {
		padding: 2rem;
		text-align: center;
		color: #666;
	}

	.no-recordings p {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
	}

	.no-recordings small {
		font-size: 0.9rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.section-title {
		color: white;
		font-family: 'Fanwood', serif;
		font-style: italic;
		font-size: 2.5rem;
		margin: 0 0 1.5rem 0;
		text-align: center;
	}

	.live-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #ff4444;
		font-weight: bold;
		font-size: 1rem;
	}

	.pulse-dot {
		width: 12px;
		height: 12px;
		background-color: #ff4444;
		border-radius: 50%;
		animation: pulse 2s infinite;
	}

	.pulse-dot.small {
		width: 8px;
		height: 8px;
		background-color: #4444ff;
	}
	.stream-status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		margin-bottom: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.status-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #cccccc;
		font-size: 0.85rem;
	}

	.polling-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #4444ff;
	}

	.last-update {
		color: #aaaaaa;
	}

	.button-group {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.refresh-button, .fix-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: 1px solid;
		border-radius: 6px;
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.refresh-button {
		background: rgba(68, 68, 255, 0.2);
		border-color: #4444ff;
		color: #4444ff;
	}

	.refresh-button:hover:not(:disabled) {
		background: rgba(68, 68, 255, 0.3);
		transform: translateY(-1px);
	}

	.fix-button {
		background: rgba(255, 165, 0, 0.2);
		border-color: #ffa500;
		color: #ffa500;
	}

	.fix-button:hover:not(:disabled) {
		background: rgba(255, 165, 0, 0.3);
		transform: translateY(-1px);
	}

	.refresh-button:disabled, .fix-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.refresh-button svg.spinning {
		animation: spin 1s linear infinite;
	}

	@keyframes pulse {
		0% { transform: scale(0.95); opacity: 1; }
		70% { transform: scale(1); opacity: 0.7; }
		100% { transform: scale(0.95); opacity: 1; }
	}

	.stream-card {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.live-stream {
		border-color: #ff4444;
		box-shadow: 0 0 20px rgba(255, 68, 68, 0.3);
	}

	.stream-info {
		margin-bottom: 1rem;
	}

	.stream-title {
		color: white;
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.stream-description {
		color: #cccccc;
		font-size: 1rem;
		margin: 0 0 1rem 0;
		line-height: 1.5;
	}

	.schedule-info, .recording-info {
		display: flex;
		gap: 1rem;
		align-items: center;
		color: #aaaaaa;
		font-size: 0.9rem;
	}

	.schedule-time {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.video-container {
		position: relative;
		width: 33vw; /* 1/3 of viewport width */
		height: 33vh; /* 1/3 of viewport height */
		background: #000;
		border-radius: 8px;
		overflow: hidden;
		margin: 0 auto; /* Center the video */
	}

	.stream-player {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: none;
		border-radius: 8px;
	}

	.video-placeholder {
		width: 100%;
		aspect-ratio: 16/9;
		background-color: #333;
		border: 2px solid #555;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 1rem;
		border-radius: 8px;
	}

	.video-placeholder.scheduled {
		border-color: #4444ff;
		background-color: rgba(68, 68, 255, 0.1);
	}

	.scheduled-overlay {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
	}

	.schedule-content {
		text-align: center;
		color: white;
		padding: 2rem;
	}

	.schedule-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 1rem 0;
		color: white;
	}

	.schedule-time-display {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 1.1rem;
		font-weight: 500;
		margin: 1rem 0;
		color: #4444ff;
	}

	.schedule-message {
		font-size: 1rem;
		color: #cccccc;
		margin: 1rem 0 0 0;
		line-height: 1.4;
	}

	.play-icon, .calendar-icon {
		opacity: 0.8;
		transition: opacity 0.3s ease;
	}

	.placeholder-text, .scheduled-text {
		color: #cccccc;
		font-size: 1rem;
		margin: 0;
		text-align: center;
	}

	.loading-player {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		color: white;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: white;
		animation: spin 1s ease-in-out infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.recording-date, .recording-duration {
		color: #aaaaaa;
		font-size: 0.85rem;
	}

	.debug-info {
		position: absolute;
		bottom: 8px;
		left: 8px;
		background: rgba(0, 0, 0, 0.8);
		padding: 4px 8px;
		border-radius: 4px;
		font-family: monospace;
		font-size: 10px;
		color: #ccc;
		line-height: 1.2;
		max-width: calc(100% - 16px);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.debug-info small {
		display: block;
		margin: 0;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.memorial-stream-container {
			padding: 1rem;
		}
		.section-title {
			font-size: 2rem;
		}
		
		.stream-card {
			padding: 1rem;
		}
		
		.stream-title {
			font-size: 1.25rem;
		}

		.video-container {
			width: 90vw; /* Larger on mobile */
			height: 50vh; /* Taller on mobile for better viewing */
		}
	}

	@media (max-width: 480px) {
		.video-container {
			width: 95vw; /* Almost full width on very small screens */
			height: 40vh; /* Adjust height for small screens */
		}
	}
</style>
