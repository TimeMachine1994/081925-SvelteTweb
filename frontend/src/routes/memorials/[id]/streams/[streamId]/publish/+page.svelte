<script lang="ts">
	import type { PageData } from './$types';
	import { onMount, onDestroy } from 'svelte';
	import { Video, VideoOff, Mic, MicOff, Radio, X, ArrowLeft, AlertCircle } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	export let data: PageData;

	let videoElement: HTMLVideoElement;
	let localStream: MediaStream | null = null;
	let peerConnection: RTCPeerConnection | null = null;
	let isStreaming = false;
	let isConnecting = false;
	let error = '';
	let videoEnabled = true;
	let audioEnabled = true;
	let connectionState: RTCPeerConnectionState = 'new';

	$: ({ stream, memorial } = data);

	onMount(async () => {
		try {
			// Request camera and microphone access
			localStream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: 1920 },
					height: { ideal: 1080 },
					facingMode: 'user'
				},
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true
				}
			});

			// Display local preview
			if (videoElement) {
				videoElement.srcObject = localStream;
			}
		} catch (err) {
			console.error('Error accessing media devices:', err);
			error = 'Failed to access camera/microphone. Please grant permissions and try again.';
		}
	});

	onDestroy(() => {
		stopStreaming();
	});

	async function startStreaming() {
		if (!localStream) {
			error = 'No media stream available';
			return;
		}

		isConnecting = true;
		error = '';

		try {
			// Create RTCPeerConnection
			peerConnection = new RTCPeerConnection({
				iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }]
			});

			// Add local tracks to peer connection
			localStream.getTracks().forEach((track) => {
				peerConnection!.addTrack(track, localStream!);
			});

			// Monitor connection state
			peerConnection.onconnectionstatechange = () => {
				if (peerConnection) {
					connectionState = peerConnection.connectionState;
					console.log('Connection state:', connectionState);

					if (connectionState === 'connected') {
						isStreaming = true;
						isConnecting = false;
					} else if (connectionState === 'failed' || connectionState === 'disconnected') {
						error = 'Connection failed. Please try again.';
						stopStreaming();
					}
				}
			};

			// Create offer
			const offer = await peerConnection.createOffer();
			await peerConnection.setLocalDescription(offer);

			// Send offer to WHIP endpoint
			const response = await fetch(stream.cloudflare.whipUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/sdp'
				},
				body: offer.sdp
			});

			if (!response.ok) {
				throw new Error(`WHIP request failed: ${response.status}`);
			}

			// Set remote description from WHIP answer
			const answer = await response.text();
			await peerConnection.setRemoteDescription({
				type: 'answer',
				sdp: answer
			});

			console.log('✅ WHIP connection established');
		} catch (err) {
			console.error('Error starting stream:', err);
			error = err instanceof Error ? err.message : 'Failed to start streaming';
			isConnecting = false;
			stopStreaming();
		}
	}

	function stopStreaming() {
		if (peerConnection) {
			peerConnection.close();
			peerConnection = null;
		}

		if (localStream) {
			localStream.getTracks().forEach((track) => track.stop());
			localStream = null;
		}

		isStreaming = false;
		isConnecting = false;
		connectionState = 'closed';
	}

	function toggleVideo() {
		if (localStream) {
			const videoTrack = localStream.getVideoTracks()[0];
			if (videoTrack) {
				videoTrack.enabled = !videoTrack.enabled;
				videoEnabled = videoTrack.enabled;
			}
		}
	}

	function toggleAudio() {
		if (localStream) {
			const audioTrack = localStream.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = !audioTrack.enabled;
				audioEnabled = audioTrack.enabled;
			}
		}
	}

	async function handleEndStream() {
		if (!confirm('Are you sure you want to end this stream?')) return;

		stopStreaming();

		// Navigate back to stream management
		goto(`/memorials/${stream.memorialId}/streams`);
	}
</script>

<svelte:head>
	<title>Go Live - {stream.title}</title>
</svelte:head>

<div class="min-h-screen bg-gray-900">
	<!-- Header -->
	<div class="border-b border-gray-800 bg-gray-950">
		<div class="mx-auto max-w-7xl px-4 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<a
						href="/memorials/{stream.memorialId}/streams"
						class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
					>
						<ArrowLeft class="h-5 w-5" />
					</a>
					<div>
						<h1 class="text-xl font-bold text-white">{stream.title}</h1>
						<p class="text-sm text-gray-400">{memorial.lovedOneName}</p>
					</div>
				</div>

				{#if isStreaming}
					<div class="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2">
						<Radio class="h-4 w-4 animate-pulse text-white" />
						<span class="text-sm font-medium text-white">LIVE</span>
					</div>
				{:else if isConnecting}
					<div class="flex items-center gap-2 rounded-full bg-yellow-600 px-4 py-2">
						<div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
						<span class="text-sm font-medium text-white">Connecting...</span>
					</div>
				{:else}
					<div class="rounded-full bg-gray-700 px-4 py-2">
						<span class="text-sm font-medium text-gray-300">Ready</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="mx-auto max-w-7xl p-4">
		<div class="grid gap-6 lg:grid-cols-3">
			<!-- Video Preview -->
			<div class="lg:col-span-2">
				<div class="overflow-hidden rounded-xl bg-black shadow-2xl">
					<div class="relative aspect-video">
						<!-- Video Element -->
						<!-- svelte-ignore a11y-media-has-caption -->
						<video
							bind:this={videoElement}
							autoplay
							muted
							playsinline
							class="h-full w-full object-cover {!videoEnabled ? 'opacity-0' : ''}"
						/>

						<!-- Video Off Overlay -->
						{#if !videoEnabled}
							<div
								class="absolute inset-0 flex items-center justify-center bg-gray-900"
							>
								<VideoOff class="h-16 w-16 text-gray-600" />
							</div>
						{/if}

						<!-- Connection Status Overlay -->
						<div class="absolute bottom-4 left-4 right-4 flex items-center justify-between">
							<div class="rounded-lg bg-black bg-opacity-70 px-3 py-2 backdrop-blur-sm">
								<p class="text-sm text-white">
									{connectionState === 'connected'
										? '🟢 Connected'
										: connectionState === 'connecting'
											? '🟡 Connecting...'
											: connectionState === 'new'
												? '⚪ Ready'
												: '🔴 Disconnected'}
								</p>
							</div>
						</div>
					</div>

					<!-- Controls -->
					<div class="border-t border-gray-800 bg-gray-950 p-4">
						<div class="flex items-center justify-center gap-4">
							<!-- Toggle Video -->
							<button
								on:click={toggleVideo}
								disabled={!localStream}
								class="rounded-full p-4 transition-colors {videoEnabled
									? 'bg-gray-700 hover:bg-gray-600'
									: 'bg-red-600 hover:bg-red-700'} disabled:opacity-50"
							>
								{#if videoEnabled}
									<Video class="h-6 w-6 text-white" />
								{:else}
									<VideoOff class="h-6 w-6 text-white" />
								{/if}
							</button>

							<!-- Toggle Audio -->
							<button
								on:click={toggleAudio}
								disabled={!localStream}
								class="rounded-full p-4 transition-colors {audioEnabled
									? 'bg-gray-700 hover:bg-gray-600'
									: 'bg-red-600 hover:bg-red-700'} disabled:opacity-50"
							>
								{#if audioEnabled}
									<Mic class="h-6 w-6 text-white" />
								{:else}
									<MicOff class="h-6 w-6 text-white" />
								{/if}
							</button>

							<!-- Start/Stop Stream -->
							{#if !isStreaming && !isConnecting}
								<button
									on:click={startStreaming}
									disabled={!localStream || !!error}
									class="rounded-full bg-red-600 px-8 py-4 font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
								>
									Go Live
								</button>
							{:else if isStreaming}
								<button
									on:click={handleEndStream}
									class="rounded-full bg-red-600 px-8 py-4 font-bold text-white transition-colors hover:bg-red-700"
								>
									End Stream
								</button>
							{/if}
						</div>
					</div>
				</div>

				<!-- Error Display -->
				{#if error}
					<div class="mt-4 rounded-lg bg-red-900 bg-opacity-50 p-4">
						<div class="flex items-start gap-3">
							<AlertCircle class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
							<div>
								<p class="font-medium text-red-200">Error</p>
								<p class="text-sm text-red-300">{error}</p>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Info Panel -->
			<div class="space-y-6">
				<!-- Stream Info -->
				<div class="rounded-xl bg-gray-800 p-6">
					<h2 class="mb-4 text-lg font-semibold text-white">Stream Information</h2>
					<div class="space-y-3 text-sm">
						<div>
							<p class="text-gray-400">Memorial</p>
							<p class="font-medium text-white">{memorial.lovedOneName}</p>
						</div>
						<div>
							<p class="text-gray-400">Stream Title</p>
							<p class="font-medium text-white">{stream.title}</p>
						</div>
						{#if stream.description}
							<div>
								<p class="text-gray-400">Description</p>
								<p class="text-white">{stream.description}</p>
							</div>
						{/if}
						<div>
							<p class="text-gray-400">Status</p>
							<p class="font-medium text-white capitalize">{stream.status}</p>
						</div>
					</div>
				</div>

				<!-- Instructions -->
				<div class="rounded-xl bg-blue-900 bg-opacity-30 p-6">
					<h2 class="mb-4 text-lg font-semibold text-blue-200">How to Stream</h2>
					<ol class="space-y-2 text-sm text-blue-100">
						<li>1. Allow camera and microphone access</li>
						<li>2. Check your preview and adjust settings</li>
						<li>3. Click "Go Live" to start broadcasting</li>
						<li>4. Stream will automatically record to Mux</li>
						<li>5. Click "End Stream" when finished</li>
					</ol>
				</div>

				<!-- Technical Info -->
				<div class="rounded-xl bg-gray-800 p-6">
					<h2 class="mb-4 text-lg font-semibold text-white">Technical Details</h2>
					<div class="space-y-2 text-xs">
						<div class="flex justify-between">
							<span class="text-gray-400">Protocol</span>
							<span class="font-mono text-white">WHIP</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-400">Recording</span>
							<span class="text-green-400">Automatic (Mux)</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-400">Simulcast</span>
							<span class="text-green-400">Enabled</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-400">Connection</span>
							<span class="capitalize text-white">{connectionState}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
