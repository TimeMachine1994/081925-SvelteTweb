<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	
	let { data } = $props();
	
	// State
	let daily: any = null;
	let isConnected = $state(false);
	let hasPermissions = $state(false);
	let errorMessage = $state<string | null>(null);
	let cameraLabel = $state('Camera');
	let localVideoEl: HTMLVideoElement;
	let isMuted = $state(false);
	let isVideoOff = $state(false);
	
	onMount(async () => {
		// Get camera label from URL params
		const urlParams = new URLSearchParams(window.location.search);
		cameraLabel = urlParams.get('label') || 'Camera';
		const token = urlParams.get('t');
		
		if (!data.roomUrl) {
			errorMessage = 'Invalid room configuration';
			return;
		}

		try {
			// Request camera/mic permissions first
			await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
			hasPermissions = true;
			
			// Dynamically import Daily
			const DailyIframe = (await import('@daily-co/daily-js')).default;
			
			// Create call object
			daily = DailyIframe.createCallObject({
				subscribeToTracksAutomatically: false, // We don't need to see others
			});
			
			// Join the room
			await daily.join({
				url: data.roomUrl,
				token: token || undefined,
				userName: cameraLabel,
				startVideoOff: false,
				startAudioOff: false,
			});
			
			isConnected = true;
			
			// Show local video preview
			const localParticipant = daily.participants().local;
			if (localParticipant?.tracks?.video?.persistentTrack) {
				const stream = new MediaStream([localParticipant.tracks.video.persistentTrack]);
				localVideoEl.srcObject = stream;
			}
			
			// Update video when track changes
			daily.on('track-started', (event: any) => {
				if (event.participant?.local && event.track?.kind === 'video') {
					const stream = new MediaStream([event.track]);
					localVideoEl.srcObject = stream;
				}
			});
			
		} catch (err: any) {
			console.error('Camera setup error:', err);
			if (err.name === 'NotAllowedError') {
				errorMessage = 'Camera/microphone permission denied. Please allow access and refresh.';
			} else {
				errorMessage = err.message || 'Failed to connect';
			}
		}
	});
	
	onDestroy(() => {
		if (daily) {
			daily.leave();
			daily.destroy();
		}
	});
	
	function toggleCamera() {
		if (daily) {
			const newState = !daily.localVideo();
			daily.setLocalVideo(newState);
			isVideoOff = !newState;
		}
	}
	
	function toggleMic() {
		if (daily) {
			const newState = !daily.localAudio();
			daily.setLocalAudio(newState);
			isMuted = !newState;
		}
	}
</script>

<svelte:head>
	<title>{cameraLabel} - Tributestream Camera</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
</svelte:head>

<div class="min-h-screen bg-black text-white flex flex-col">
	
	<!-- Video Preview (Full Screen) -->
	<div class="flex-1 relative">
		<video 
			bind:this={localVideoEl}
			autoplay 
			muted 
			playsinline
			class="absolute inset-0 w-full h-full object-cover"
		></video>
		
		<!-- Status Overlay -->
		<div class="absolute top-4 left-4 right-4 flex justify-between items-start">
			<!-- Connection Status -->
			<div class="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
				<div class="flex items-center gap-2">
					<span class="w-3 h-3 rounded-full {isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}"></span>
					<span class="text-sm font-medium">
						{#if isConnected}
							Connected
						{:else if hasPermissions}
							Connecting...
						{:else}
							Waiting for permissions
						{/if}
					</span>
				</div>
			</div>
			
			<!-- Camera Label -->
			<div class="bg-red-600 rounded-lg px-3 py-2">
				<span class="text-sm font-bold">{cameraLabel}</span>
			</div>
		</div>
		
		<!-- Error Message -->
		{#if errorMessage}
			<div class="absolute inset-0 flex items-center justify-center bg-black/80">
				<div class="text-center p-6 max-w-sm">
					<div class="text-4xl mb-4">📵</div>
					<p class="text-red-400 font-medium mb-2">Connection Error</p>
					<p class="text-gray-400 text-sm">{errorMessage}</p>
					<button 
						class="mt-4 px-4 py-2 bg-white text-black rounded-lg font-medium"
						onclick={() => window.location.reload()}
					>
						Try Again
					</button>
				</div>
			</div>
		{/if}
		
		<!-- Permissions Prompt -->
		{#if !hasPermissions && !errorMessage}
			<div class="absolute inset-0 flex items-center justify-center bg-black/80">
				<div class="text-center p-6 max-w-sm">
					<div class="text-6xl mb-4">📷</div>
					<p class="text-xl font-medium mb-2">Camera Access Needed</p>
					<p class="text-gray-400 text-sm">Please allow camera and microphone access to stream.</p>
				</div>
			</div>
		{/if}
	</div>
	
	<!-- Bottom Controls -->
	<div class="bg-gray-900 border-t border-gray-800 p-4 safe-area-bottom">
		<div class="flex justify-center gap-6">
			<!-- Mic Toggle -->
			<button 
				class="w-16 h-16 rounded-full flex items-center justify-center transition-colors
					{!isMuted ? 'bg-gray-700' : 'bg-red-600'}"
				onclick={toggleMic}
				disabled={!isConnected}
			>
				{#if !isMuted}
					<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
					</svg>
				{:else}
					<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
					</svg>
				{/if}
			</button>
			
			<!-- Camera Toggle -->
			<button 
				class="w-16 h-16 rounded-full flex items-center justify-center transition-colors
					{!isVideoOff ? 'bg-gray-700' : 'bg-red-600'}"
				onclick={toggleCamera}
				disabled={!isConnected}
			>
				{#if !isVideoOff}
					<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
					</svg>
				{:else}
					<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
					</svg>
				{/if}
			</button>
		</div>
		
		<!-- Instructions -->
		<p class="text-center text-gray-500 text-xs mt-3">
			Keep this page open • Your video is being sent to the switcher
		</p>
	</div>
</div>

<style>
	.safe-area-bottom {
		padding-bottom: max(1rem, env(safe-area-inset-bottom));
	}
</style>
