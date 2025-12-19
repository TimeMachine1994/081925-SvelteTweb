<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Video, Radio, Users, Clock, CheckCircle, AlertCircle, StopCircle, RotateCw } from 'lucide-svelte';
	
	export let data;
	
	let videoElement: HTMLVideoElement;
	let localStream: MediaStream | null = null;
	let peerConnection: RTCPeerConnection | null = null;
	let connectionState = 'disconnected';
	let isStreaming = false;
	let duration = 0;
	let durationInterval: any;
	let statusInterval: any;
	let errorMessage = '';
	let facingMode: 'user' | 'environment' = 'environment';
	let isMuted = false;
	
	$: streamStatus = data.stream.status;
	$: viewerCount = data.stream.viewerCount;
	
	onMount(() => {
		if (streamStatus === 'pending') {
			initializeStream();
		} else if (streamStatus === 'live') {
			duration = Math.floor((Date.now() - new Date(data.stream.startedAt!).getTime()) / 1000);
			startDurationCounter();
			startStatusPolling();
		}
	});
	
	onDestroy(() => {
		cleanup();
	});
	
	async function initializeStream() {
		try {
			errorMessage = '';
			connectionState = 'requesting-permissions';
			
			localStream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: 1280 },
					height: { ideal: 720 },
					facingMode: facingMode
				},
				audio: true
			});
			
			if (videoElement) {
				videoElement.srcObject = localStream;
			}
			
			connectionState = 'connecting';
			await connectToWHIP();
			
		} catch (error: any) {
			console.error('Error initializing stream:', error);
			errorMessage = error.name === 'NotAllowedError' 
				? 'Camera permission denied. Please allow camera access and refresh.'
				: 'Failed to access camera. ' + error.message;
			connectionState = 'error';
		}
	}
	
	async function connectToWHIP() {
		try {
			const whipUrl = data.stream.config.cloudflare.whipUrl;
			
			peerConnection = new RTCPeerConnection({
				iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
			});
			
			if (localStream) {
				localStream.getTracks().forEach(track => {
					peerConnection!.addTrack(track, localStream!);
				});
			}
			
			peerConnection.onconnectionstatechange = () => {
				const state = peerConnection!.connectionState;
				console.log('Connection state:', state);
				connectionState = state;
				
				if (state === 'connected') {
					isStreaming = true;
					updateStreamStatus('live');
					startDurationCounter();
					startStatusPolling();
				} else if (state === 'failed' || state === 'closed') {
					errorMessage = 'Connection lost. Please refresh and try again.';
				}
			};
			
			const offer = await peerConnection.createOffer();
			await peerConnection.setLocalDescription(offer);
			
			const response = await fetch(whipUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/sdp'
				},
				body: offer.sdp
			});
			
			if (!response.ok) {
				throw new Error('Failed to connect to streaming server');
			}
			
			const answer = await response.text();
			await peerConnection.setRemoteDescription({
				type: 'answer',
				sdp: answer
			});
			
		} catch (error: any) {
			console.error('Error connecting to WHIP:', error);
			errorMessage = 'Failed to connect to streaming server: ' + error.message;
			connectionState = 'error';
		}
	}
	
	async function updateStreamStatus(status: 'live' | 'ended') {
		try {
			await fetch(`/api/funeral-director/stream/${data.stream.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status })
			});
		} catch (error) {
			console.error('Error updating stream status:', error);
		}
	}
	
	function startDurationCounter() {
		durationInterval = setInterval(() => {
			duration++;
		}, 1000);
	}
	
	function startStatusPolling() {
		statusInterval = setInterval(async () => {
			try {
				const response = await fetch(`/api/funeral-director/stream/${data.stream.id}`);
				const result = await response.json();
				viewerCount = result.stream.stats.viewerCount;
			} catch (error) {
				console.error('Error polling status:', error);
			}
		}, 5000);
	}
	
	async function endStream() {
		const confirmed = confirm(
			`End livestream for ${data.memorial.lovedOneName}?\n\n` +
			`Duration: ${formatDuration(duration)}\n` +
			`The recording will be automatically saved.`
		);
		
		if (!confirmed) return;
		
		try {
			cleanup();
			
			const response = await fetch(`/api/funeral-director/stream/${data.stream.id}/end`, {
				method: 'POST'
			});
			
			const result = await response.json();
			
			if (response.ok) {
				alert(`Stream ended successfully!\n\nDuration: ${formatDuration(duration)}\nPeak viewers: ${data.stream.peakViewerCount}`);
				goto('/funeral-director/stream');
			} else {
				throw new Error(result.message || 'Failed to end stream');
			}
		} catch (error: any) {
			errorMessage = 'Failed to end stream: ' + error.message;
		}
	}
	
	function cleanup() {
		if (durationInterval) clearInterval(durationInterval);
		if (statusInterval) clearInterval(statusInterval);
		
		if (localStream) {
			localStream.getTracks().forEach(track => track.stop());
			localStream = null;
		}
		
		if (peerConnection) {
			peerConnection.close();
			peerConnection = null;
		}
	}
	
	async function toggleCamera() {
		facingMode = facingMode === 'user' ? 'environment' : 'user';
		
		if (localStream && peerConnection) {
			const videoTrack = localStream.getVideoTracks()[0];
			if (videoTrack) {
				videoTrack.stop();
			}
			
			const newStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode },
				audio: false
			});
			
			const newVideoTrack = newStream.getVideoTracks()[0];
			const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
			if (sender) {
				await sender.replaceTrack(newVideoTrack);
			}
			
			localStream.removeTrack(videoTrack);
			localStream.addTrack(newVideoTrack);
			
			if (videoElement) {
				videoElement.srcObject = localStream;
			}
		}
	}
	
	function toggleMute() {
		if (localStream) {
			const audioTrack = localStream.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = !audioTrack.enabled;
				isMuted = !audioTrack.enabled;
			}
		}
	}
	
	function formatDuration(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		
		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}
	
	function getConnectionStatusColor(): string {
		switch (connectionState) {
			case 'connected': return 'text-green-600';
			case 'connecting': return 'text-yellow-600';
			case 'requesting-permissions': return 'text-blue-600';
			case 'error': return 'text-red-600';
			default: return 'text-gray-600';
		}
	}
	
	function getConnectionStatusText(): string {
		switch (connectionState) {
			case 'connected': return 'Connected';
			case 'connecting': return 'Connecting...';
			case 'requesting-permissions': return 'Requesting permissions...';
			case 'error': return 'Connection error';
			default: return 'Disconnected';
		}
	}
</script>

<svelte:head>
	<title>Livestream - {data.memorial.lovedOneName}</title>
</svelte:head>

<div class="min-h-screen bg-gray-900">
	<!-- Header -->
	<div class="bg-gray-800 border-b border-gray-700 px-4 py-3">
		<div class="max-w-7xl mx-auto flex items-center justify-between">
			<a 
				href="/funeral-director/stream"
				class="text-gray-400 hover:text-white flex items-center gap-2"
			>
				<ArrowLeft class="w-4 h-4" />
				<span class="hidden sm:inline">Back</span>
			</a>
			
			<div class="flex items-center gap-4">
				{#if isStreaming}
					<div class="flex items-center gap-2 text-red-500">
						<span class="relative flex h-3 w-3">
							<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
							<span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
						</span>
						<span class="font-bold text-sm">LIVE</span>
					</div>
				{/if}
				
				<div class="text-white font-mono text-sm">
					{formatDuration(duration)}
				</div>
				
				<div class="flex items-center gap-1 text-white text-sm">
					<Users class="w-4 h-4" />
					<span>{viewerCount}</span>
				</div>
			</div>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-4 py-6">
		{#if errorMessage}
			<div class="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-xl mb-6 flex items-start gap-3">
				<AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5" />
				<p>{errorMessage}</p>
			</div>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Video Preview -->
			<div class="lg:col-span-2">
				<div class="bg-black rounded-2xl overflow-hidden aspect-video relative">
					<video
						bind:this={videoElement}
						autoplay
						playsinline
						muted
						class="w-full h-full object-cover"
					>
						<track kind="captions" />
					</video>
					
					{#if !isStreaming && connectionState !== 'error'}
						<div class="absolute inset-0 flex items-center justify-center bg-black/50">
							<div class="text-center text-white">
								<Video class="w-16 h-16 mx-auto mb-4 opacity-50" />
								<p class="text-lg font-medium">{getConnectionStatusText()}</p>
							</div>
						</div>
					{/if}
				</div>

				<!-- Controls -->
				<div class="mt-4 flex flex-wrap gap-3">
					<button
						onclick={toggleMute}
						disabled={!isStreaming}
						class="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all"
					>
						{isMuted ? '🔇 Unmute' : '🔊 Mute'}
					</button>
					
					<button
						onclick={toggleCamera}
						disabled={!isStreaming}
						class="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all"
					>
						<div class="flex items-center justify-center gap-2">
							<RotateCw class="w-5 h-5" />
							Flip Camera
						</div>
					</button>
					
					<button
						onclick={endStream}
						disabled={!isStreaming}
						class="w-full lg:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all"
					>
						<div class="flex items-center justify-center gap-2">
							<StopCircle class="w-5 h-5" />
							End Livestream
						</div>
					</button>
				</div>
			</div>

			<!-- Stream Info -->
			<div class="space-y-6">
				<!-- Memorial Info -->
				<div class="bg-gray-800 rounded-2xl p-6">
					<h2 class="text-lg font-bold text-white mb-4">Memorial Information</h2>
					<div class="space-y-3">
						<div>
							<div class="text-gray-400 text-sm">In Memory of</div>
							<div class="text-white font-bold text-lg">{data.memorial.lovedOneName}</div>
						</div>
						<div>
							<div class="text-gray-400 text-sm">Location</div>
							<div class="text-white">{data.memorial.services.main.location.name}</div>
						</div>
					</div>
				</div>

				<!-- Connection Status -->
				<div class="bg-gray-800 rounded-2xl p-6">
					<h2 class="text-lg font-bold text-white mb-4">Connection Status</h2>
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-gray-400">Status</span>
							<span class="{getConnectionStatusColor()} font-medium">
								{getConnectionStatusText()}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-400">Recording</span>
							<span class="text-green-500 font-medium flex items-center gap-1">
								<CheckCircle class="w-4 h-4" />
								Active
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-400">Method</span>
							<span class="text-white">Phone Direct</span>
						</div>
					</div>
				</div>

				<!-- Stats -->
				<div class="bg-gray-800 rounded-2xl p-6">
					<h2 class="text-lg font-bold text-white mb-4">Stream Statistics</h2>
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-gray-400 flex items-center gap-2">
								<Clock class="w-4 h-4" />
								Duration
							</span>
							<span class="text-white font-mono">{formatDuration(duration)}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-400 flex items-center gap-2">
								<Users class="w-4 h-4" />
								Current Viewers
							</span>
							<span class="text-white">{viewerCount}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-400">Peak Viewers</span>
							<span class="text-white">{data.stream.peakViewerCount}</span>
						</div>
					</div>
				</div>

				<!-- View Memorial -->
				<a
					href="/{data.memorial.fullSlug}"
					target="_blank"
					class="block bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-medium text-center transition-all"
				>
					View Memorial Page →
				</a>
			</div>
		</div>
	</div>
</div>
