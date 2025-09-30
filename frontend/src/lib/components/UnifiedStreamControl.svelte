<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { streamAPI } from '$lib/api/streamClient';
	import type { Stream } from '$lib/types/stream';
	import { db } from '$lib/firebase';
	import { collection, query, where, orderBy, onSnapshot, type Unsubscribe } from 'firebase/firestore';

	// Props
	let { 
		memorialId = undefined,
		showCreateForm = true,
		showPublicStreams = false
	}: {
		memorialId?: string;
		showCreateForm?: boolean;
		showPublicStreams?: boolean;
	} = $props();

	// State
	let streams = $state<Stream[]>([]);
	let loading = $state(false);
	let error = $state('');
	let selectedStream = $state<Stream | null>(null);
	let streamCredentials = $state<any>(null);
	let localVideoStream = $state<MediaStream | null>(null);
	let isWebcamStreaming = $state(false);
	let isWebcamPreviewing = $state(false);
	let webcamStreamConnection = $state<any>(null);
	let videoPreview: HTMLVideoElement;

	// Create form state
	let showForm = $state(false);
	let newStreamTitle = $state('');
	let newStreamDescription = $state('');

	let unsubscribeRealtime: Unsubscribe | null = null;

	onMount(() => {
		console.log('🎬 [UNIFIED_STREAM] Component mounted with props:', { memorialId, showCreateForm, showPublicStreams });
		loadStreams();
		setupRealtimeListener();
	});
	
	onDestroy(() => {
		if (unsubscribeRealtime) {
			unsubscribeRealtime();
			console.log('🔄 [UNIFIED_STREAM] Unsubscribed from real-time listener');
		}
	});
	
	function setupRealtimeListener() {
		if (!memorialId || !db) {
			console.log('🔄 [UNIFIED_STREAM] Skipping real-time listener - no memorialId or db not available');
			return;
		}
		
		try {
			// Create real-time query for memorial streams
			const streamsQuery = query(
				collection(db, 'streams'),
				where('memorialId', '==', memorialId),
				orderBy('actualStartTime', 'desc')
			);
			
			console.log('🔄 [UNIFIED_STREAM] Setting up real-time listener for memorial:', memorialId);
			
			unsubscribeRealtime = onSnapshot(streamsQuery, (snapshot) => {
				console.log('🔄 [UNIFIED_STREAM] Real-time update received:', {
					totalDocs: snapshot.docs.length,
					memorialId,
					timestamp: new Date().toISOString(),
					docChanges: snapshot.docChanges().map(change => ({
						type: change.type,
						docId: change.doc.id,
						title: change.doc.data().title,
						status: change.doc.data().status
					}))
				});
				
				const previousStreams = [...streams];
				
				// Convert Firestore documents to Stream objects
				const updatedStreams = snapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data(),
					createdAt: doc.data().createdAt?.toDate(),
					updatedAt: doc.data().updatedAt?.toDate(),
					scheduledStartTime: doc.data().scheduledStartTime?.toDate(),
					actualStartTime: doc.data().actualStartTime?.toDate(),
					endTime: doc.data().endTime?.toDate()
				})) as Stream[];
				
				// Organize streams by status (same logic as API)
				const liveStreams = updatedStreams.filter(s => s.status === 'live');
				const scheduledStreams = updatedStreams.filter(s => s.status === 'scheduled');
				const readyStreams = updatedStreams.filter(s => s.status === 'ready');
				const recordedStreams = updatedStreams.filter(s => s.status === 'completed');
				
				// Update streams state with organized data
				streams = [
					...liveStreams,
					...scheduledStreams,
					...readyStreams,
					...recordedStreams
				];
				
				// Check for status changes and notify
				checkForStatusChanges(previousStreams, updatedStreams);
				
			}, (error) => {
				console.error('❌ [UNIFIED_STREAM] Real-time listener error:', error);
				// Fallback to API polling if real-time fails
				console.log('🔄 [UNIFIED_STREAM] Falling back to API loading');
				loadStreams();
			});
			
		} catch (error) {
			console.error('❌ [UNIFIED_STREAM] Error setting up real-time listener:', error);
			// Fallback to API loading
			loadStreams();
		}
	}
	
	function checkForStatusChanges(previousStreams: Stream[], currentStreams: Stream[]) {
		// Check for streams that just went live
		const newLiveStreams = currentStreams.filter(stream => 
			stream.status === 'live' && 
			!previousStreams.find(prev => prev.id === stream.id && prev.status === 'live')
		);
		
		// Check for streams that just ended
		const endedStreams = previousStreams.filter(prevStream => 
			prevStream.status === 'live' && 
			!currentStreams.find(current => current.id === prevStream.id && current.status === 'live')
		);
		
		// Notify about live stream changes
		newLiveStreams.forEach(stream => {
			console.log('🔴 [LIVE_DETECTION] Stream went LIVE:', {
				id: stream.id,
				title: stream.title,
				actualStartTime: stream.actualStartTime
			});
			
			showLiveNotification(stream, 'started');
		});
		
		endedStreams.forEach(stream => {
			console.log('⚫ [LIVE_DETECTION] Stream ENDED:', {
				id: stream.id,
				title: stream.title
			});
			
			showLiveNotification(stream, 'ended');
		});
	}
	
	function showLiveNotification(stream: any, action: 'started' | 'ended') {
		const message = action === 'started' 
			? `🔴 "${stream.title}" is now LIVE!`
			: `⚫ "${stream.title}" has ended`;
			
		console.log(`📢 [NOTIFICATION] ${message}`);
		
		// You can replace this with a toast notification or modal
		if (Notification.permission === 'granted') {
			new Notification('TributeStream Live Update', {
				body: message,
				icon: '/favicon.ico'
			});
		} else if (Notification.permission !== 'denied') {
			Notification.requestPermission().then(permission => {
				if (permission === 'granted') {
					new Notification('TributeStream Live Update', {
						body: message,
						icon: '/favicon.ico'
					});
				}
			});
		}
		
		// Also show browser alert for now (you can remove this later)
		alert(message);
	}

	async function toggleStreamVisibility(stream: Stream) {
		try {
			loading = true;
			const newVisibility = !stream.isVisible;
			
			console.log('🔄 [UNIFIED_STREAM] Toggling stream visibility:', {
				streamId: stream.id,
				currentVisibility: stream.isVisible,
				newVisibility
			});
			
			const response = await fetch(`/api/streams/${stream.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					isVisible: newVisibility
				})
			});
			
			if (response.ok) {
				// Update local state immediately
				streams = streams.map(s => 
					s.id === stream.id 
						? { ...s, isVisible: newVisibility }
						: s
				);
				
				console.log('✅ [UNIFIED_STREAM] Stream visibility updated successfully');
			} else {
				const errorData = await response.json();
				console.error('❌ [UNIFIED_STREAM] Failed to update visibility:', errorData);
				error = errorData.error || 'Failed to update stream visibility';
			}
		} catch (err) {
			console.error('❌ [UNIFIED_STREAM] Error toggling visibility:', err);
			error = 'Failed to update stream visibility';
		} finally {
			loading = false;
		}
	}

	// Reactive statement to connect video stream to preview element
	$effect(() => {
		console.log('🔄 [UNIFIED_STREAM] Effect triggered - videoPreview:', !!videoPreview, 'localVideoStream:', !!localVideoStream);
		if (videoPreview && localVideoStream) {
			console.log('🎥 [UNIFIED_STREAM] Connecting video stream to preview element');
			console.log('🎥 [UNIFIED_STREAM] Stream tracks:', localVideoStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
			videoPreview.srcObject = localVideoStream;
			
			// Force play if needed
			videoPreview.play().catch(e => {
				console.warn('⚠️ [UNIFIED_STREAM] Video play failed (this is often normal):', e.message);
			});
		}
	});

	async function loadStreams() {
		console.log('🔄 [UNIFIED_STREAM] Starting loadStreams()', {
			memorialId,
			showPublicStreams,
			timestamp: new Date().toISOString()
		});
		loading = true;
		error = '';
		
		try {
			if (memorialId) {
				console.log('📺 [UNIFIED_STREAM] Loading memorial-specific streams for:', memorialId);
				// Load memorial-specific streams using new unified API
				const response = await streamAPI.getMemorialStreams(memorialId);
				console.log('✅ [UNIFIED_STREAM] Memorial streams response:', response);
				// For management interface, show all streams regardless of recording status
				streams = [
					...response.liveStreams, 
					...response.scheduledStreams, 
					...(response.readyStreams || []), 
					...response.recordedStreams // All completed streams for management
				];
				console.log('📊 [UNIFIED_STREAM] Streams breakdown:', {
					live: response.liveStreams.length,
					scheduled: response.scheduledStreams.length,
					ready: response.readyStreams?.length || 0,
					completed: response.recordedStreams.length,
					publicReady: response.publicRecordedStreams?.length || 0
				});
				console.log('📊 [UNIFIED_STREAM] Total streams loaded:', streams.length);
				
				// Log each stream for debugging
				streams.forEach((stream, index) => {
					console.log(`📄 [UNIFIED_STREAM] Stream ${index + 1}:`, {
						id: stream.id,
						title: stream.title,
						status: stream.status,
						isVisible: stream.isVisible,
						isPublic: stream.isPublic,
						recordingReady: stream.recordingReady,
						createdBy: stream.createdBy,
						actualStartTime: stream.actualStartTime,
						endTime: stream.endTime
					});
				});
			} else if (showPublicStreams) {
				console.log('🌐 [UNIFIED_STREAM] Loading public streams');
				// Load public streams using new unified API
				const response = await streamAPI.getPublicStreams();
				console.log('✅ [UNIFIED_STREAM] Public streams response:', response);
				streams = response.streams;
				console.log('📊 [UNIFIED_STREAM] Public streams loaded:', streams.length);
			} else {
				console.log('👤 [UNIFIED_STREAM] Loading all user streams');
				// Load all user streams using new unified API
				const response = await streamAPI.listStreams();
				console.log('✅ [UNIFIED_STREAM] User streams response:', response);
				streams = response.streams;
				console.log('📊 [UNIFIED_STREAM] User streams loaded:', streams.length);
			}
			
			console.log('🎯 [UNIFIED_STREAM] Final streams array:', streams.map(s => ({ id: s.id, title: s.title, status: s.status })));
		} catch (err) {
			console.error('❌ [UNIFIED_STREAM] Error loading streams:', err);
			console.error('❌ [UNIFIED_STREAM] Error details:', {
				message: err instanceof Error ? err.message : 'Unknown error',
				stack: err instanceof Error ? err.stack : undefined,
				memorialId,
				showPublicStreams
			});
			error = err instanceof Error ? err.message : 'Failed to load streams';
		} finally {
			loading = false;
			console.log('🏁 [UNIFIED_STREAM] loadStreams() completed');
		}
	}

	async function createStream() {
		console.log('🆕 [UNIFIED_STREAM] Starting createStream()');
		if (!newStreamTitle.trim()) {
			console.log('⚠️ [UNIFIED_STREAM] No title provided, aborting create');
			return;
		}

		console.log('🔄 [UNIFIED_STREAM] Creating stream with data:', {
			title: newStreamTitle.trim(),
			description: newStreamDescription.trim(),
			memorialId,
			isVisible: true,
			isPublic: !memorialId
		});

		loading = true;
		error = '';

		try {
			const streamData = {
				title: newStreamTitle.trim(),
				description: newStreamDescription.trim(),
				memorialId,
				isVisible: true,
				isPublic: !memorialId // Public if not memorial-specific
			};

			console.log('📡 [UNIFIED_STREAM] Calling API to create stream...');
			const newStream = memorialId 
				? await streamAPI.createMemorialStream(memorialId, streamData)
				: await streamAPI.createStream(streamData);

			console.log('✅ [UNIFIED_STREAM] Stream created successfully:', newStream);
			streams = [newStream, ...streams];
			console.log('📊 [UNIFIED_STREAM] Updated streams array length:', streams.length);
			
			// Just select the new stream, don't start it automatically
			selectedStream = newStream;
			console.log('📊 [UNIFIED_STREAM] Stream created and selected, ready for manual start');
			
			// Reset form
			console.log('🔄 [UNIFIED_STREAM] Resetting form');
			newStreamTitle = '';
			newStreamDescription = '';
			showForm = false;
		} catch (err) {
			console.error('❌ [UNIFIED_STREAM] Error creating stream:', err);
			console.error('❌ [UNIFIED_STREAM] Create error details:', {
				message: err instanceof Error ? err.message : 'Unknown error',
				stack: err instanceof Error ? err.stack : undefined,
				streamData: {
					title: newStreamTitle.trim(),
					description: newStreamDescription.trim(),
					memorialId
				}
			});
			error = err instanceof Error ? err.message : 'Failed to create stream';
		} finally {
			loading = false;
			console.log('🏁 [UNIFIED_STREAM] createStream() completed');
		}
	}

	async function startStream(stream: Stream) {
		console.log('▶️ [UNIFIED_STREAM] Starting stream:', { id: stream.id, title: stream.title, status: stream.status });
		loading = true;
		error = '';

		try {
			console.log('📡 [UNIFIED_STREAM] Calling API to start stream...');
			const credentials = await streamAPI.startStream(stream.id);
			console.log('✅ [UNIFIED_STREAM] Stream started, credentials received:', credentials);
			streamCredentials = credentials;
			
			// Update stream status
			console.log('🔄 [UNIFIED_STREAM] Updating stream status to live');
			const updatedStream = { ...stream, status: 'live' as const };
			streams = streams.map(s => s.id === stream.id ? updatedStream : s);
			selectedStream = updatedStream;
			console.log('📊 [UNIFIED_STREAM] Stream status updated:', { id: updatedStream.id, status: updatedStream.status });
		} catch (err) {
			console.error('❌ [UNIFIED_STREAM] Error starting stream:', err);
			console.error('❌ [UNIFIED_STREAM] Start error details:', {
				message: err instanceof Error ? err.message : 'Unknown error',
				stack: err instanceof Error ? err.stack : undefined,
				streamId: stream.id,
				streamTitle: stream.title
			});
			error = err instanceof Error ? err.message : 'Failed to start stream';
		} finally {
			loading = false;
			console.log('🏁 [UNIFIED_STREAM] startStream() completed');
		}
	}

	async function stopStream(stream: Stream) {
		console.log('⏹️ [UNIFIED_STREAM] Stopping stream:', { id: stream.id, title: stream.title, status: stream.status });
		loading = true;
		error = '';

		try {
			console.log('📡 [UNIFIED_STREAM] Calling API to stop stream...');
			const result = await streamAPI.stopStream(stream.id);
			console.log('✅ [UNIFIED_STREAM] Stream stopped, result:', result);
			streamCredentials = null;
			
			// Update stream status
			console.log('🔄 [UNIFIED_STREAM] Updating stream status to completed');
			const updatedStream = { 
				...stream, 
				status: 'completed' as const,
				recordingReady: result.recordingReady 
			};
			streams = streams.map(s => s.id === stream.id ? updatedStream : s);
			selectedStream = updatedStream;
			console.log('📊 [UNIFIED_STREAM] Stream status updated:', { 
				id: updatedStream.id, 
				status: updatedStream.status, 
				recordingReady: updatedStream.recordingReady 
			});
		} catch (err) {
			console.error('❌ [UNIFIED_STREAM] Error stopping stream:', err);
			console.error('❌ [UNIFIED_STREAM] Stop error details:', {
				message: err instanceof Error ? err.message : 'Unknown error',
				stack: err instanceof Error ? err.stack : undefined,
				streamId: stream.id,
				streamTitle: stream.title
			});
			error = err instanceof Error ? err.message : 'Failed to stop stream';
		} finally {
			loading = false;
			console.log('🏁 [UNIFIED_STREAM] stopStream() completed');
		}
	}

	async function syncRecordings(stream: Stream) {
		console.log('🔄 [UNIFIED_STREAM] Syncing recordings for stream:', { id: stream.id, title: stream.title, recordingReady: stream.recordingReady });
		loading = true;
		error = '';

		try {
			console.log('📡 [UNIFIED_STREAM] Calling API to sync recordings...');
			const result = await streamAPI.syncRecordings(stream.id);
			console.log('✅ [UNIFIED_STREAM] Recording sync result:', result);
			
			// Update stream with recording status
			console.log('🔄 [UNIFIED_STREAM] Updating stream with recording data');
			const updatedStream = { 
				...stream, 
				recordingReady: result.recordingReady,
				recordingUrl: result.recordingUrl || stream.recordingUrl
			};
			streams = streams.map(s => s.id === stream.id ? updatedStream : s);
			selectedStream = updatedStream;
			console.log('📊 [UNIFIED_STREAM] Recording status updated:', { 
				id: updatedStream.id, 
				recordingReady: updatedStream.recordingReady,
				recordingUrl: updatedStream.recordingUrl 
			});
		} catch (err) {
			console.error('❌ [UNIFIED_STREAM] Error syncing recordings:', err);
			console.error('❌ [UNIFIED_STREAM] Sync error details:', {
				message: err instanceof Error ? err.message : 'Unknown error',
				stack: err instanceof Error ? err.stack : undefined,
				streamId: stream.id,
				streamTitle: stream.title
			});
			error = err instanceof Error ? err.message : 'Failed to sync recordings';
		} finally {
			loading = false;
			console.log('🏁 [UNIFIED_STREAM] syncRecordings() completed');
		}
	}

	async function startWebcamPreview() {
		console.log('📹 [UNIFIED_STREAM] Starting webcam preview...');
		
		try {
			// Request camera and microphone access
			console.log('🎥 [UNIFIED_STREAM] Requesting media access for preview...');
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { width: 1280, height: 720 },
				audio: true
			});
			
			console.log('✅ [UNIFIED_STREAM] Media access granted, showing preview...');
			
			// Store local video stream for preview
			localVideoStream = stream;
			isWebcamPreviewing = true;
			
			// The reactive $effect will automatically connect the stream to the video element
			
			console.log('🎉 [UNIFIED_STREAM] Webcam preview started successfully!');
			
		} catch (err) {
			console.error('❌ [UNIFIED_STREAM] Error starting webcam preview:', err);
			
			let errorMessage = 'Failed to start webcam preview';
			if (err instanceof Error) {
				if (err.message.includes('Permission denied')) {
					errorMessage = 'Camera/microphone access denied. Please allow access and try again.';
				} else {
					errorMessage = err.message;
				}
			}
			
			alert(`❌ ${errorMessage}`);
		}
	}

	async function goLiveWithWebcam(whipEndpoint: string) {
		console.log('📡 [UNIFIED_STREAM] Going live with webcam stream...');
		
		if (!localVideoStream) {
			console.error('❌ [UNIFIED_STREAM] No video stream available for going live');
			return;
		}
		
		try {
			// Create WebRTC peer connection
			const pc = new RTCPeerConnection({
				iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }]
			});
			
			// Store connection for cleanup
			webcamStreamConnection = { pc, stream: localVideoStream };
			
			// Add tracks to peer connection
			localVideoStream.getTracks().forEach(track => {
				console.log('🎵 [UNIFIED_STREAM] Adding track to live stream:', track.kind);
				pc.addTrack(track, localVideoStream);
			});
			
			// Create offer
			console.log('📡 [UNIFIED_STREAM] Creating WebRTC offer...');
			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);
			
			// Send offer to WHIP endpoint
			console.log('📤 [UNIFIED_STREAM] Sending offer to WHIP endpoint...');
			const response = await fetch(whipEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/sdp'
				},
				body: offer.sdp
			});
			
			if (!response.ok) {
				throw new Error(`WHIP request failed: ${response.status} ${response.statusText}`);
			}
			
			// Set remote description from response
			const answerSdp = await response.text();
			console.log('📥 [UNIFIED_STREAM] Received answer from WHIP endpoint');
			await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
			
			console.log('🎉 [UNIFIED_STREAM] WHIP connection established successfully!');
			
			// Update stream status to live (only if not already live)
			if (selectedStream && selectedStream.status !== 'live') {
				console.log('🔄 [UNIFIED_STREAM] Updating stream status to live...');
				try {
					await streamAPI.startStream(selectedStream.id);
					
					// Update local state
					const updatedStream = { ...selectedStream, status: 'live' as const };
					streams = streams.map(s => s.id === selectedStream.id ? updatedStream : s);
					selectedStream = updatedStream;
					
					console.log('✅ [UNIFIED_STREAM] Stream status updated to live');
				} catch (statusErr) {
					console.error('⚠️ [UNIFIED_STREAM] Could not update stream status:', statusErr);
					// Continue anyway - WHIP connection is established
				}
			}
			
			// Update states
			isWebcamPreviewing = false;
			isWebcamStreaming = true;
			
			console.log('🎉 [UNIFIED_STREAM] Now streaming live!');
			
		} catch (err) {
			console.error('❌ [UNIFIED_STREAM] Error going live with webcam:', err);
			console.error('❌ [UNIFIED_STREAM] WHIP error details:', {
				message: err instanceof Error ? err.message : 'Unknown error',
				stack: err instanceof Error ? err.stack : undefined,
				whipEndpoint
			});
			
			let errorMessage = 'Failed to go live with webcam';
			if (err instanceof Error) {
				if (err.message.includes('WHIP request failed')) {
					errorMessage = 'Failed to connect to streaming server. Please try again.';
				} else {
					errorMessage = err.message;
				}
			}
			
			alert(`❌ ${errorMessage}`);
		}
	}

	function stopWebcamStream() {
		console.log('⏹️ [UNIFIED_STREAM] Stopping webcam stream/preview...');
		
		// Stop all tracks
		if (localVideoStream) {
			localVideoStream.getTracks().forEach(track => {
				console.log('🛑 [UNIFIED_STREAM] Stopping track:', track.kind);
				track.stop();
			});
			localVideoStream = null;
		}
		
		// Clear video preview
		if (videoPreview) {
			videoPreview.srcObject = null;
		}
		
		// Close WebRTC connection
		if (webcamStreamConnection?.pc) {
			webcamStreamConnection.pc.close();
			webcamStreamConnection = null;
		}
		
		// Reset states
		isWebcamStreaming = false;
		isWebcamPreviewing = false;
		
		console.log('✅ [UNIFIED_STREAM] Webcam stream/preview stopped');
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'live': return 'text-red-600 bg-red-100';
			case 'ready': return 'text-green-600 bg-green-100';
			case 'scheduled': return 'text-blue-600 bg-blue-100';
			case 'completed': return 'text-gray-600 bg-gray-100';
			case 'error': return 'text-red-600 bg-red-100';
			default: return 'text-gray-600 bg-gray-100';
		}
	}

	function canStart(stream: Stream): boolean {
		return stream.status === 'ready' || stream.status === 'scheduled';
	}

	function canStop(stream: Stream): boolean {
		return stream.status === 'live';
	}
</script>

<div class="unified-stream-control p-6 bg-white rounded-lg shadow-lg">
	<div class="flex justify-between items-center mb-6">
		<h2 class="text-2xl font-bold text-gray-900">
			{memorialId ? 'Memorial' : showPublicStreams ? 'Public' : 'My'} Streams
		</h2>
		
		{#if showCreateForm}
			<button 
				onclick={() => showForm = !showForm}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
				disabled={loading}
			>
				{showForm ? 'Cancel' : 'Create Stream'}
			</button>
		{/if}
	</div>

	{#if error}
		<div class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
			{error}
		</div>
	{/if}

	{#if showForm}
		<div class="mb-6 p-4 bg-gray-50 rounded-md border">
			<h3 class="text-lg font-semibold mb-4">Create New Stream</h3>
			
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						Stream Title *
					</label>
					<input 
						bind:value={newStreamTitle}
						type="text" 
						placeholder="Enter stream title..."
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={loading}
					/>
				</div>
				
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						Description (optional)
					</label>
					<textarea 
						bind:value={newStreamDescription}
						placeholder="Enter stream description..."
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={loading}
					></textarea>
				</div>
				
				<div class="flex gap-2">
					<button 
						onclick={createStream}
						disabled={loading || !newStreamTitle.trim()}
						class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{loading ? 'Creating...' : 'Create Stream'}
					</button>
					
					<button 
						onclick={() => showForm = false}
						class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
						disabled={loading}
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if loading && streams.length === 0}
		<div class="text-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
			<p class="mt-2 text-gray-600">Loading streams...</p>
		</div>
	{:else if streams.length === 0}
		<div class="text-center py-8 text-gray-500">
			<p>No streams found.</p>
			{#if showCreateForm}
				<p class="mt-2">Create your first stream to get started!</p>
			{/if}
		</div>
	{:else}
		<div class="grid gap-4">
			{#each streams as stream (stream.id)}
				<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
					<div class="flex justify-between items-start mb-3">
						<div class="flex-1">
							<h3 class="text-lg font-semibold text-gray-900">{stream.title}</h3>
							{#if stream.description}
								<p class="text-gray-600 text-sm mt-1">{stream.description}</p>
							{/if}
							{#if stream.memorialName}
								<p class="text-blue-600 text-sm mt-1">Memorial: {stream.memorialName}</p>
							{/if}
						</div>
						
						<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(stream.status)}">
							{stream.status.toUpperCase()}
						</span>
					</div>

					<div class="flex items-center justify-between">
						<div class="flex items-center gap-4 text-sm text-gray-500">
							{#if stream.actualStartTime}
								<span>Started: {new Date(stream.actualStartTime).toLocaleString()}</span>
							{/if}
							{#if stream.recordingReady}
								<span class="text-green-600">✓ Recording Ready</span>
							{:else if stream.status === 'completed'}
								<span class="text-yellow-600">⏳ Processing Recording</span>
							{/if}
						</div>

						<div class="flex gap-2">
							{#if canStart(stream)}
								<button 
									onclick={() => startStream(stream)}
									disabled={loading}
									class="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
								>
									Start Stream
								</button>
							{/if}

							{#if canStop(stream)}
								<button 
									onclick={() => stopStream(stream)}
									disabled={loading}
									class="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
								>
									Stop Stream
								</button>
							{/if}

							{#if stream.status === 'completed' && !stream.recordingReady}
								<button 
									onclick={() => syncRecordings(stream)}
									disabled={loading}
									class="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
								>
									Sync Recording
								</button>
							{/if}

							<!-- Visibility Toggle Button -->
							<button 
								onclick={() => toggleStreamVisibility(stream)}
								disabled={loading}
								class="px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1 {stream.isVisible !== false 
									? 'bg-green-100 text-green-700 hover:bg-green-200' 
									: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
								title={stream.isVisible !== false ? 'Hide from public' : 'Show to public'}
							>
								{#if stream.isVisible !== false}
									<span>👁️</span>
									<span class="hidden sm:inline">Visible</span>
								{:else}
									<span>🙈</span>
									<span class="hidden sm:inline">Hidden</span>
								{/if}
							</button>

							<button 
								onclick={() => selectedStream = selectedStream?.id === stream.id ? null : stream}
								class="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
							>
								{selectedStream?.id === stream.id ? 'Hide' : 'Details'}
							</button>
						</div>
					</div>

					{#if selectedStream?.id === stream.id}
						<div class="mt-4 pt-4 border-t border-gray-200">
							<div class="grid grid-cols-2 gap-4 text-sm">
								<div>
									<strong>Stream ID:</strong> {stream.id}
								</div>
								<div>
									<strong>Created:</strong> {new Date(stream.createdAt).toLocaleString()}
								</div>
								<div>
									<strong>Visibility:</strong> {stream.isVisible ? 'Visible' : 'Hidden'}
								</div>
								<div>
									<strong>Public:</strong> {stream.isPublic ? 'Yes' : 'No'}
								</div>
								{#if stream.cloudflareId}
									<div class="col-span-2">
										<strong>Cloudflare ID:</strong> {stream.cloudflareId}
									</div>
								{/if}
								{#if stream.recordingUrl}
									<div class="col-span-2">
										<strong>Recording URL:</strong> 
										<a href={stream.recordingUrl} target="_blank" class="text-blue-600 hover:underline">
											View Recording
										</a>
									</div>
								{/if}
							</div>

							{#if streamCredentials && selectedStream?.id === stream.id}
								<div class="mt-4 space-y-4">
									<!-- RTMP Streaming (OBS/External Software) -->
									<div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
										<div class="flex items-center justify-between mb-3">
											<h4 class="font-semibold text-blue-900 flex items-center">
												🎥 Professional Streaming (RTMP)
											</h4>
											<span class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">OBS • Streamlabs • XSplit</span>
										</div>
										
										<div class="space-y-3 text-sm">
											{#if streamCredentials.streamUrl}
												<div>
													<label class="block font-medium text-blue-800 mb-1">RTMP Server URL:</label>
													<div class="flex items-center space-x-2">
														<code class="flex-1 bg-white px-3 py-2 rounded border text-xs font-mono">{streamCredentials.streamUrl}</code>
														<button 
															onclick={() => navigator.clipboard.writeText(streamCredentials.streamUrl)}
															class="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
														>
															📋 Copy
														</button>
													</div>
												</div>
											{/if}
											
											{#if streamCredentials.streamKey}
												<div>
													<label class="block font-medium text-blue-800 mb-1">Stream Key:</label>
													<div class="flex items-center space-x-2">
														<code class="flex-1 bg-white px-3 py-2 rounded border text-xs font-mono">{streamCredentials.streamKey}</code>
														<button 
															onclick={() => navigator.clipboard.writeText(streamCredentials.streamKey)}
															class="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
														>
															📋 Copy
														</button>
													</div>
												</div>
											{/if}
										</div>
									</div>

									<!-- WHIP Browser Streaming (Webcam) -->
									{#if streamCredentials.whipEndpoint}
										<div class="p-4 bg-green-50 rounded-lg border border-green-200">
											<div class="flex items-center justify-between mb-3">
												<h4 class="font-semibold text-green-900 flex items-center">
													📱 Browser Streaming (WHIP)
												</h4>
												<span class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Webcam • Phone • Tablet</span>
											</div>
											
											<div class="space-y-3">
												<div class="text-sm text-green-700 mb-3">
													Stream directly from your browser using your device's camera and microphone. No additional software required!
												</div>
												
												<!-- Webcam Preview and Controls -->
												{#if localVideoStream && (isWebcamPreviewing || isWebcamStreaming)}
													<div class="bg-white rounded-lg border-2 {isWebcamStreaming ? 'border-red-300' : 'border-blue-300'} p-3 mb-4">
														<div class="flex items-center justify-between mb-2">
															<h5 class="font-medium {isWebcamStreaming ? 'text-red-800' : 'text-blue-800'}">
																📹 {isWebcamStreaming ? 'Live Stream' : 'Camera Preview'}
															</h5>
															{#if isWebcamStreaming}
																<span class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full animate-pulse">● LIVE</span>
															{:else}
																<span class="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">● PREVIEW</span>
															{/if}
														</div>
														<video 
															bind:this={videoPreview}
															autoplay 
															muted 
															playsinline
															class="w-full max-w-md rounded border bg-black"
															style="aspect-ratio: 16/9;"
															onloadedmetadata={() => console.log('🎥 [UNIFIED_STREAM] Video metadata loaded')}
															onplay={() => console.log('▶️ [UNIFIED_STREAM] Video started playing')}
															onerror={(e) => console.error('❌ [UNIFIED_STREAM] Video error:', e)}
														></video>
														<div class="flex items-center justify-between mt-2">
															<div class="text-xs {isWebcamStreaming ? 'text-red-700' : 'text-blue-700'}">
																{#if isWebcamStreaming}
																	Your stream is live and being broadcast!
																{:else}
																	Preview your camera before going live
																{/if}
															</div>
															<div class="flex space-x-2">
																{#if isWebcamPreviewing && !isWebcamStreaming}
																	<button 
																		onclick={() => goLiveWithWebcam(streamCredentials.whipEndpoint)}
																		class="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
																	>
																		🔴 Go Live
																	</button>
																{/if}
																<button 
																	onclick={stopWebcamStream}
																	class="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
																>
																	⏹️ {isWebcamStreaming ? 'Stop Stream' : 'Stop Preview'}
																</button>
															</div>
														</div>
													</div>
												{:else}
													<div class="flex items-center space-x-3">
														<button 
															onclick={startWebcamPreview}
															disabled={isWebcamStreaming || isWebcamPreviewing}
															class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
														>
															<span>📹</span>
															<span>Start Camera Preview</span>
														</button>
														
														<div class="text-xs text-green-600">
															Preview your camera before going live
														</div>
													</div>
												{/if}
												
												<!-- WHIP Endpoint for advanced users -->
												<details class="text-sm">
													<summary class="cursor-pointer text-green-700 hover:text-green-800 font-medium">
														Advanced: WHIP Endpoint URL
													</summary>
													<div class="mt-2 flex items-center space-x-2">
														<code class="flex-1 bg-white px-3 py-2 rounded border text-xs font-mono break-all">{streamCredentials.whipEndpoint}</code>
														<button 
															onclick={() => navigator.clipboard.writeText(streamCredentials.whipEndpoint)}
															class="px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
														>
															📋 Copy
														</button>
													</div>
												</details>
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<div class="mt-6 flex justify-center">
		<button 
			onclick={loadStreams}
			disabled={loading}
			class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 transition-colors"
		>
			{loading ? 'Refreshing...' : 'Refresh'}
		</button>
	</div>
</div>

<style>
	.unified-stream-control {
		max-width: 1200px;
		margin: 0 auto;
	}
</style>
