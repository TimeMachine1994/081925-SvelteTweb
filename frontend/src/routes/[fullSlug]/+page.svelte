<script lang="ts">
	import type { PageData } from './$types';
	import TailwindVideoPlayer from '$lib/components/TailwindVideoPlayer.svelte';
	import VideoPlayerCard from '$lib/components/VideoPlayerCard.svelte';
	import MultiStreamDisplay from '$lib/components/MultiStreamDisplay.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { db } from '$lib/firebase';
	import { collection, query, where, onSnapshot, type Unsubscribe } from 'firebase/firestore';
	
	let { data }: { data: PageData } = $props();
	
	// Extract data from server load - using SAME interface as memorials/[id]/streams
	let memorial = $derived(data.memorial);
	let streamsData = $derived(data.streamsData); // MemorialStreamsResponse interface
	
	// Real-time streams data (updates when recordings become ready)
	let liveStreamsData = $state(streamsData);
	let unsubscribe: Unsubscribe | null = null;
	
	// Recordings data for multi-stream display
	let recordingsData = $state(streamsData?.recordings || []);
	let recordingsLoading = $state(false);
	
	// Check if we have streams data (IF condition)
	let hasStreams = $derived(liveStreamsData && liveStreamsData.totalStreams > 0);
	
	// Get all streams in display order (live first, then scheduled, then recorded)
	let allStreamsOrdered = $derived(() => {
		console.log('🔄 [MEMORIAL_PAGE] allStreamsOrdered $derived called');
		if (!liveStreamsData) {
			console.log('🚫 [MEMORIAL_PAGE] No liveStreamsData available');
			return [];
		}
		
		console.log('🔍 [MEMORIAL_PAGE] liveStreamsData keys:', Object.keys(liveStreamsData));
		console.log('🔍 [MEMORIAL_PAGE] liveStreamsData:', liveStreamsData);
		
		const ordered = [
			...(liveStreamsData.liveStreams || []),
			...(liveStreamsData.scheduledStreams || []),
			...(liveStreamsData.readyStreams || []),
			...(liveStreamsData.publicRecordedStreams || [])
		];
		
		// Fallback: if no streams in categories but we have allStreams, use that
		if (ordered.length === 0 && liveStreamsData.allStreams && liveStreamsData.allStreams.length > 0) {
			console.log('🔄 [MEMORIAL_PAGE] Using fallback allStreams array:', liveStreamsData.allStreams.length);
			return liveStreamsData.allStreams;
		}
		
		console.log('📋 [MEMORIAL_PAGE] Ordered streams for display:', {
			total: ordered.length,
			live: liveStreamsData.liveStreams?.length || 0,
			scheduled: liveStreamsData.scheduledStreams?.length || 0,
			ready: liveStreamsData.readyStreams?.length || 0,
			publicRecorded: liveStreamsData.publicRecordedStreams?.length || 0,
			streamTitles: ordered.map(s => s.title)
		});
		
		// DEBUG: Show what's actually in liveStreamsData
		console.log('🔍 [MEMORIAL_PAGE] Full liveStreamsData structure:', {
			hasLiveStreams: !!liveStreamsData.liveStreams,
			liveStreamsArray: liveStreamsData.liveStreams,
			hasAllStreams: !!liveStreamsData.allStreams,
			allStreamsLength: liveStreamsData.allStreams?.length,
			allStreamsStatuses: liveStreamsData.allStreams?.map(s => ({ title: s.title, status: s.status }))
		});
		
		return ordered;
	});
	
	// Auto-detection polling for stream status changes
	let statusPollingInterval: NodeJS.Timeout | null = null;
	let lastKnownStatuses = $state(new Map());

	async function pollStreamStatuses() {
		if (!liveStreamsData?.allStreams) return;

		console.log('🔄 [MEMORIAL_PAGE] Polling stream statuses...');
		
		for (const stream of liveStreamsData.allStreams) {
			try {
				const response = await fetch(`/api/streams/${stream.id}/status`);
				if (response.ok) {
					const statusData = await response.json();
					const currentStatus = statusData.status;
					const lastStatus = lastKnownStatuses.get(stream.id);
					
					// Check if status changed
					if (lastStatus && lastStatus !== currentStatus) {
						console.log('🔄 [MEMORIAL_PAGE] Status change detected:', {
							streamId: stream.id,
							title: stream.title,
							from: lastStatus,
							to: currentStatus
						});
						
						// If stream went from live to ending, reload to show processing UI
						if (lastStatus === 'live' && currentStatus === 'ending') {
							console.log('⏳ [MEMORIAL_PAGE] Stream ending, reloading to show processing...');
							window.location.reload();
							return;
						}
						
						// If stream went from ending to completed, reload page to show recording
						if (lastStatus === 'ending' && currentStatus === 'completed') {
							console.log('🎬 [MEMORIAL_PAGE] Recording ready, reloading to show recording...');
							window.location.reload();
							return;
						}
						
						// Legacy: If stream went from live to completed, reload page to show recording
						if (lastStatus === 'live' && currentStatus === 'completed') {
							console.log('🎬 [MEMORIAL_PAGE] Stream ended (legacy), reloading to show recording...');
							window.location.reload();
							return;
						}
						
						// If stream went from ready to live, reload page
						if (lastStatus === 'ready' && currentStatus === 'live') {
							console.log('🔴 [MEMORIAL_PAGE] Stream went live, reloading...');
							window.location.reload();
							return;
						}
					}
					
					// Update last known status
					lastKnownStatuses.set(stream.id, currentStatus);
				}
			} catch (error) {
				console.error('❌ [MEMORIAL_PAGE] Failed to poll status for stream:', stream.id, error);
			}
		}
	}

	// Function to fetch recordings for all streams
	async function fetchRecordings() {
		if (!liveStreamsData?.allStreams || recordingsLoading) return;
		
		recordingsLoading = true;
		console.log('📹 [MEMORIAL_PAGE] Fetching recordings for', liveStreamsData.allStreams.length, 'streams');
		
		try {
			const allRecordings = [];
			
			// Fetch recordings for each stream
			for (const stream of liveStreamsData.allStreams) {
				try {
					const response = await fetch(`/api/streams/${stream.id}/recordings`);
					if (response.ok) {
						const data = await response.json();
						if (data.recordings && data.recordings.length > 0) {
							// Add stream context to each recording
							const recordingsWithContext = data.recordings.map(recording => ({
								...recording,
								streamId: stream.id,
								streamTitle: stream.title
							}));
							allRecordings.push(...recordingsWithContext);
							console.log('📹 [MEMORIAL_PAGE] Found', data.recordings.length, 'recordings for stream:', stream.title);
						}
					}
				} catch (error) {
					console.error('❌ [MEMORIAL_PAGE] Failed to fetch recordings for stream:', stream.id, error);
				}
			}
			
			// Sort recordings by sequence number and created date
			allRecordings.sort((a, b) => {
				if (a.sequenceNumber !== b.sequenceNumber) {
					return a.sequenceNumber - b.sequenceNumber;
				}
				return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			});
			
			recordingsData = allRecordings;
			console.log('✅ [MEMORIAL_PAGE] Total recordings loaded:', allRecordings.length);
			
		} catch (error) {
			console.error('❌ [MEMORIAL_PAGE] Failed to fetch recordings:', error);
		} finally {
			recordingsLoading = false;
		}
	}
	
	// Set up real-time listener for stream updates (especially for recording ready notifications)
	onMount(() => {
		if (memorial?.id) {
			console.log('📡 [MEMORIAL_PAGE] Setting up real-time listener for memorial:', memorial.id);
			
			// If server-side data is available, use it as fallback
			if (streamsData && !liveStreamsData) {
				console.log('🔄 [MEMORIAL_PAGE] Initializing with server-side data');
				liveStreamsData = streamsData;
				// Initialize recordings from server data
				if (streamsData.recordings && streamsData.recordings.length > 0) {
					recordingsData = streamsData.recordings;
					console.log('📹 [MEMORIAL_PAGE] Initialized with', recordingsData.length, 'server-loaded recordings');
				}
			}
			
			// TEMPORARY: Skip real-time listener due to Firebase errors, use server data only
			console.log('⚠️ [MEMORIAL_PAGE] Using server-side data only (real-time listener disabled)');
			
			// Initialize last known statuses
			if (liveStreamsData?.allStreams) {
				liveStreamsData.allStreams.forEach(stream => {
					lastKnownStatuses.set(stream.id, stream.status);
				});
			}
			
			// Set up status polling every 10 seconds
			statusPollingInterval = setInterval(pollStreamStatuses, 10000);
			console.log('⏰ [MEMORIAL_PAGE] Status polling started (every 10 seconds)');
			
			// Fetch recordings for the streams
			fetchRecordings();
			
			return;
			
			try {
				const streamsQuery = query(
					collection(db, 'streams'),
					where('memorialId', '==', memorial.id)
				);
			
			unsubscribe = onSnapshot(streamsQuery, (snapshot) => {
				try {
					console.log('🔄 [MEMORIAL_PAGE] Real-time update received, processing streams...');
				
				const updatedStreams = snapshot.docs.map(doc => {
					try {
						const data = doc.data();
						// Handle missing properties safely with extra defensive checks
						return {
							id: doc.id,
							title: (data && data.title) ? String(data.title) : 'Untitled Stream',
							description: (data && data.description) ? String(data.description) : '',
							memorialId: (data && data.memorialId) ? String(data.memorialId) : '',
							status: (data && data.status) ? String(data.status) : 'unknown',
							isVisible: (data && typeof data.isVisible === 'boolean') ? data.isVisible : true, // Default to true
							isPublic: (data && typeof data.isPublic === 'boolean') ? data.isPublic : false, // Default to false
							recordingReady: (data && typeof data.recordingReady === 'boolean') ? data.recordingReady : false, // Default to false
							cloudflareId: (data && data.cloudflareId) ? String(data.cloudflareId) : null,
							playbackUrl: (data && data.playbackUrl) ? String(data.playbackUrl) : null,
							recordingUrl: (data && data.recordingUrl) ? String(data.recordingUrl) : null,
							// Convert timestamps safely with extra checks
							createdAt: (data && data.createdAt && typeof data.createdAt.toDate === 'function') ? data.createdAt.toDate().toISOString() : null,
							updatedAt: (data && data.updatedAt && typeof data.updatedAt.toDate === 'function') ? data.updatedAt.toDate().toISOString() : null,
							scheduledStartTime: (data && data.scheduledStartTime && typeof data.scheduledStartTime.toDate === 'function') ? data.scheduledStartTime.toDate().toISOString() : null,
							actualStartTime: (data && data.actualStartTime && typeof data.actualStartTime.toDate === 'function') ? data.actualStartTime.toDate().toISOString() : null,
							endTime: (data && data.endTime && typeof data.endTime.toDate === 'function') ? data.endTime.toDate().toISOString() : null
						};
					} catch (docError) {
						console.error('❌ [MEMORIAL_PAGE] Error processing document:', doc.id, docError);
						// Return a safe default object for problematic documents
						return {
							id: doc.id,
							title: 'Error Loading Stream',
							description: '',
							memorialId: memorial?.id || '',
							status: 'error',
							isVisible: false,
							isPublic: false,
							recordingReady: false,
							cloudflareId: null,
							playbackUrl: null,
							recordingUrl: null,
							createdAt: null,
							updatedAt: null,
							scheduledStartTime: null,
							actualStartTime: null,
							endTime: null
						};
					}
				});
				
				console.log('🔍 [MEMORIAL_PAGE] Processed streams from real-time listener:', {
					total: updatedStreams.length,
					streams: updatedStreams.map(s => ({
						id: s.id,
						title: s.title,
						status: s.status,
						isVisible: s.isVisible,
						recordingReady: s.recordingReady
					}))
				});
				
				// Filter for public visibility (streams that are not explicitly hidden)
				const publicStreams = updatedStreams.filter(stream => stream.isVisible === true);
				
				// Organize by status (same logic as server)
				const liveStreams = publicStreams.filter(s => s.status === 'live');
				const scheduledStreams = publicStreams.filter(s => s.status === 'scheduled');
				const readyStreams = publicStreams.filter(s => s.status === 'ready');
				const recordedStreams = publicStreams.filter(s => s.status === 'completed');
				const publicRecordedStreams = recordedStreams.filter(s => s.recordingReady === true && s.isVisible === true);
				
				// Update live data
				liveStreamsData = {
					memorialId: memorial.id,
					liveStreams,
					scheduledStreams,
					readyStreams,
					recordedStreams,
					publicRecordedStreams,
					totalStreams: publicStreams.length,
					allStreams: publicStreams
				};
				
				console.log('✅ [MEMORIAL_PAGE] Real-time data updated:', {
					total: liveStreamsData.totalStreams,
					live: liveStreams.length,
					scheduled: scheduledStreams.length,
					ready: readyStreams.length,
					recorded: recordedStreams.length,
					publicRecorded: publicRecordedStreams.length
				});
				
				} catch (processingError) {
					console.error('❌ [MEMORIAL_PAGE] Error processing real-time update:', processingError);
					// Keep existing data if processing fails
					console.log('🔄 [MEMORIAL_PAGE] Keeping existing streams data due to processing error');
				}
			}, (error) => {
				console.error('❌ [MEMORIAL_PAGE] Real-time listener error:', error);
				console.log('🔄 [MEMORIAL_PAGE] Real-time listener failed, using server-side data only');
				// Fallback: disable real-time updates and use server data
				if (unsubscribe) {
					unsubscribe();
					unsubscribe = null;
				}
			});
			
			} catch (setupError) {
				console.error('❌ [MEMORIAL_PAGE] Error setting up real-time listener:', setupError);
				console.log('🔄 [MEMORIAL_PAGE] Using server-side data only due to setup error');
				// Ensure we have the server data as fallback
				if (streamsData && !liveStreamsData) {
					liveStreamsData = streamsData;
				}
			}
		}
	});
	
	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
		if (statusPollingInterval) {
			clearInterval(statusPollingInterval);
			statusPollingInterval = null;
			console.log('🛑 [MEMORIAL_PAGE] Status polling stopped');
		}
	});
	
	console.log('📺 [MEMORIAL_PAGE_CLIENT] Initial server data:', {
		memorial: memorial?.lovedOneName,
		serverStreamsData: !!streamsData,
		serverTotalStreams: streamsData?.totalStreams || 0,
		serverRecordings: streamsData?.recordings?.length || 0,
		serverStreamCategories: {
			live: streamsData?.liveStreams?.length || 0,
			scheduled: streamsData?.scheduledStreams?.length || 0,
			ready: streamsData?.readyStreams?.length || 0,
			recorded: streamsData?.recordedStreams?.length || 0,
			publicRecorded: streamsData?.publicRecordedStreams?.length || 0
		}
	});
	
	console.log('📺 [MEMORIAL_PAGE_CLIENT] Current live data:', {
		hasLiveStreamsData: !!liveStreamsData,
		liveDataTotalStreams: liveStreamsData?.totalStreams || 0,
		liveDataCategories: {
			live: liveStreamsData?.liveStreams?.length || 0,
			scheduled: liveStreamsData?.scheduledStreams?.length || 0,
			ready: liveStreamsData?.readyStreams?.length || 0,
			recorded: liveStreamsData?.recordedStreams?.length || 0,
			publicRecorded: liveStreamsData?.publicRecordedStreams?.length || 0
		},
		hasStreams,
		allStreamsOrderedLength: allStreamsOrdered.length,
		// DEBUG: Show actual stream data
		actualReadyStreams: liveStreamsData?.readyStreams?.map(s => ({ id: s.id, title: s.title, status: s.status })),
		actualAllStreams: liveStreamsData?.allStreams?.map(s => ({ id: s.id, title: s.title, status: s.status }))
	});
</script>

<svelte:head>
	<title>{memorial?.lovedOneName ? `${memorial.lovedOneName} Memorial` : 'Memorial'}</title>
</svelte:head>

<!-- Memorial Header -->
<div class="memorial-header">
	<h1>{memorial?.lovedOneName || 'Memorial'}</h1>
	{#if memorial?.description}
		<p class="memorial-description">{memorial.description}</p>
	{/if}
	{#if memorial?.isPublic === false}
		<div class="private-notice">
			<p>🔒 This memorial is private and not publicly accessible.</p>
		</div>
	{/if}
</div>

<!-- Multi-Stream Display (Live Streams + Recordings) -->
{#if liveStreamsData?.totalStreams > 0 || recordingsData.length > 0}
	{@const liveStreams = [
		...(liveStreamsData.liveStreams || []),
		...(liveStreamsData.readyStreams || []) // Include ready streams as they might be forced to live
	]}
	
	<MultiStreamDisplay 
		{liveStreams}
		recordings={recordingsData}
		memorialId={memorial?.id}
		showControls={false}
	/>
	
	<!-- DEBUG: Show recordings loading state -->
	{#if recordingsLoading}
		<div class="mt-4 text-center">
			<p class="text-sm text-gray-600">🔄 Loading recordings...</p>
		</div>
	{/if}
	
	<!-- DEBUG: Show raw data -->
	<div class="mt-8 bg-yellow-50 border border-yellow-200 rounded p-4">
		<h3 class="font-bold text-yellow-800">DEBUG: Multi-Stream Data</h3>
		<p>Live streams: {liveStreams.length}</p>
		<p>Recordings: {recordingsData.length}</p>
		<p>Total server streams: {liveStreamsData?.totalStreams || 0}</p>
		{#if liveStreams.length > 0}
			<div class="mt-2">
				<strong>Live Streams:</strong>
				{#each liveStreams as stream}
					<div class="ml-4">• {stream.title} ({stream.status})</div>
				{/each}
			</div>
		{/if}
		{#if recordingsData.length > 0}
			<div class="mt-2">
				<strong>Recordings:</strong>
				{#each recordingsData as recording}
					<div class="ml-4">• {recording.title} (#{recording.sequenceNumber})</div>
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<!-- Show message only when there really is no data -->
	<div class="no-streams text-center py-8">
		<p class="text-gray-600">No memorial services are currently available.</p>
		{#if memorial?.isPublic === false}
			<p class="private-note text-yellow-600 mt-2">This memorial is private.</p>
		{/if}
	</div>
{/if}


<style>
	.memorial-header {
		text-align: center;
		padding: 2rem 0;
		border-bottom: 1px solid #eee;
		margin-bottom: 2rem;
	}
	
	.memorial-header h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		color: #333;
	}
	
	.memorial-description {
		font-size: 1.1rem;
		color: #666;
		max-width: 600px;
		margin: 0 auto;
	}
	
	.private-notice {
		background: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 6px;
		padding: 1rem;
		margin: 1rem auto;
		max-width: 600px;
		text-align: center;
	}
	
	.private-notice p {
		margin: 0;
		color: #856404;
		font-weight: 500;
	}
	
	.streams-section {
		margin-bottom: 3rem;
	}
	
	.streams-section h2 {
		font-size: 1.8rem;
		margin-bottom: 1rem;
		color: #333;
	}
	
	.streams-summary {
		font-size: 1rem;
		color: #666;
		margin-bottom: 2rem;
		text-align: center;
	}
	
	
	.stream-status-summary {
		background: #f8f9fa;
		border-radius: 12px;
		padding: 1.5rem;
		margin-top: 2rem;
	}
	
	.status-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
		justify-items: center;
	}
	
	.status-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		border-radius: 8px;
		background: #fff;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		min-width: 100px;
	}
	
	.status-count {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	
	.status-label {
		font-size: 0.9rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	
	.status-item.live {
		border-left: 4px solid #dc3545;
	}
	
	.status-item.live .status-count {
		color: #dc3545;
	}
	
	.status-item.scheduled {
		border-left: 4px solid #ffc107;
	}
	
	.status-item.scheduled .status-count {
		color: #ffc107;
	}
	
	.status-item.ready {
		border-left: 4px solid #17a2b8;
	}
	
	.status-item.ready .status-count {
		color: #17a2b8;
	}
	
	.status-item.recorded {
		border-left: 4px solid #28a745;
	}
	
	.status-item.recorded .status-count {
		color: #28a745;
	}
	
	.stream-category {
		margin-bottom: 2rem;
	}
	
	.stream-category h3 {
		font-size: 1.3rem;
		margin-bottom: 1rem;
		color: #555;
	}
	
	.stream-list {
		list-style: none;
		padding: 0;
	}
	
	.stream-item.recorded {
		border-left: 4px solid #28a745;
		background: #f8fff9;
	}
	.stream-title {
		font-weight: 600;
		font-size: 1.1rem;
		color: #333;
	}
	
	.stream-status {
		font-size: 0.8rem;
		font-weight: 600;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		width: fit-content;
	}
	
	.stream-item.live .stream-status {
		background: #dc3545;
		color: white;
	}
	
	.stream-item.recorded .stream-status {
		background: #28a745;
		color: white;
	}
	
	.stream-time {
		font-size: 0.9rem;
		color: #666;
	}
	
	.stream-description {
		font-size: 0.9rem;
		color: #666;
		margin: 0;
		font-style: italic;
	}
	
	.no-streams {
		text-align: center;
		padding: 2rem;
		color: #666;
		font-style: italic;
	}
	
	.private-note {
		color: #856404;
		font-weight: 500;
		margin-top: 0.5rem;
	}
	
	.memorial-info {
		background: #f8f9fa;
		padding: 2rem;
		border-radius: 8px;
		margin-top: 2rem;
	}
	
	.memorial-info h2 {
		margin-bottom: 1.5rem;
		color: #333;
	}
	
	.service-details, .additional-services {
		margin-bottom: 1.5rem;
	}
	
	.service-details h3, .additional-services h3 {
		margin-bottom: 1rem;
		color: #555;
	}
	
	.additional-service {
		background: white;
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 0.5rem;
		border: 1px solid #e9ecef;
	}
	
	.additional-service p {
		margin: 0.25rem 0;
	}
	
	@media (max-width: 768px) {
		.memorial-header h1 {
			font-size: 2rem;
		}
		
		.stream-item {
			padding: 0.75rem;
		}
		
		.memorial-info {
			padding: 1.5rem;
		}
	}
</style>