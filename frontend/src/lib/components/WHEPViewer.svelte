<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Stream } from '$lib/types/stream';

	interface Props {
		stream: Stream;
		autoConnect?: boolean;
	}

	let { stream, autoConnect = false }: Props = $props();

	// Component state
	let whepUrl = $state<string | null>(null);
	let isLoading = $state(false);
	let isConnected = $state(false);
	let error = $state<string | null>(null);
	let peerConnection: RTCPeerConnection | null = null;
	let videoElement: HTMLVideoElement | undefined = $state();

	// Connection status
	let connectionStatus = $state<'disconnected' | 'connecting' | 'connected' | 'error'>(
		'disconnected'
	);

	onMount(async () => {
		if (autoConnect) {
			await fetchWHEPUrl();
			if (whepUrl) {
				await connectStream();
			}
		}
	});

	onDestroy(() => {
		disconnectStream();
	});

	async function fetchWHEPUrl() {
		if (!stream.id) return;

		isLoading = true;
		error = null;

		try {
			const response = await fetch(`/api/streams/${stream.id}/whep`);
			const data = await response.json();

			if (data.success) {
				whepUrl = data.whepUrl;
				console.log('✅ [WHEP] Got playback URL:', whepUrl);
			} else {
				throw new Error(data.error || 'Failed to get WHEP URL');
			}
		} catch (err) {
			console.error('❌ [WHEP] Error fetching URL:', err);
			error = err instanceof Error ? err.message : 'Failed to get WHEP URL';
		} finally {
			isLoading = false;
		}
	}

	async function connectStream() {
		if (!whepUrl || !videoElement) return;

		connectionStatus = 'connecting';
		error = null;

		try {
			// Create RTCPeerConnection with Cloudflare STUN servers
			peerConnection = new RTCPeerConnection({
				iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }]
			});

			// Handle incoming media stream
			peerConnection.ontrack = (event) => {
				console.log('📺 [WHEP] Received track:', event.track.kind);
				if (event.streams && event.streams[0] && videoElement) {
					videoElement.srcObject = event.streams[0];
					connectionStatus = 'connected';
					isConnected = true;
				}
			};

			// Handle connection state changes
			peerConnection.onconnectionstatechange = () => {
				console.log('🔗 [WHEP] Connection state:', peerConnection?.connectionState);

				if (peerConnection?.connectionState === 'connected') {
					connectionStatus = 'connected';
					isConnected = true;
				} else if (
					peerConnection?.connectionState === 'failed' ||
					peerConnection?.connectionState === 'disconnected'
				) {
					connectionStatus = 'error';
					error = 'Connection failed or disconnected';
					isConnected = false;
				}
			};

			// Add transceivers for receiving video and audio
			peerConnection.addTransceiver('video', { direction: 'recvonly' });
			peerConnection.addTransceiver('audio', { direction: 'recvonly' });

			// Create offer
			const offer = await peerConnection.createOffer();
			await peerConnection.setLocalDescription(offer);

			console.log('📤 [WHEP] Sending offer to:', whepUrl);

			// Send offer to WHEP endpoint
			const response = await fetch(whepUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/sdp'
				},
				body: offer.sdp
			});

			if (!response.ok) {
				throw new Error(`WHEP request failed: ${response.status} ${response.statusText}`);
			}

			// Set remote description from response
			const answerSdp = await response.text();
			await peerConnection.setRemoteDescription({
				type: 'answer',
				sdp: answerSdp
			});

			console.log('✅ [WHEP] Connection established, waiting for media...');
		} catch (err) {
			console.error('❌ [WHEP] Connection error:', err);
			error = err instanceof Error ? err.message : 'Connection failed';
			connectionStatus = 'error';
			disconnectStream();
		}
	}

	function disconnectStream() {
		if (peerConnection) {
			peerConnection.close();
			peerConnection = null;
		}

		if (videoElement) {
			videoElement.srcObject = null;
		}

		connectionStatus = 'disconnected';
		isConnected = false;
	}

	async function toggleConnection() {
		if (isConnected) {
			disconnectStream();
		} else {
			if (!whepUrl) {
				await fetchWHEPUrl();
			}
			if (whepUrl) {
				await connectStream();
			}
		}
	}

	function copyWHEPUrl() {
		if (whepUrl) {
			navigator.clipboard.writeText(whepUrl);
		}
	}

	function openTestPage() {
		if (stream.id) {
			window.open(`/api/streams/${stream.id}/whep`, '_blank');
		}
	}

	// Status indicator styling
	const statusStyles = {
		disconnected: 'bg-gray-500',
		connecting: 'bg-yellow-500 animate-pulse',
		connected: 'bg-green-500',
		error: 'bg-red-500'
	};
</script>

<div class="whep-viewer space-y-4 rounded-lg bg-gray-800 p-4">
	<div class="flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold text-white">
			<div class="h-3 w-3 rounded-full {statusStyles[connectionStatus]}"></div>
			WHEP Viewer - {stream.title}
		</h3>

		<div class="flex gap-2">
			{#if !whepUrl}
				<button
					onclick={fetchWHEPUrl}
					disabled={isLoading}
					class="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{isLoading ? 'Loading...' : 'Get WHEP URL'}
				</button>
			{:else}
				<button
					onclick={copyWHEPUrl}
					class="rounded bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700"
					title="Copy WHEP URL"
				>
					📋 Copy URL
				</button>

				<button
					onclick={openTestPage}
					class="rounded bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700"
					title="Open test page"
				>
					🧪 Test
				</button>

				<button
					onclick={toggleConnection}
					disabled={connectionStatus === 'connecting'}
					class="rounded px-3 py-1 text-sm text-white {isConnected
						? 'bg-red-600 hover:bg-red-700'
						: 'bg-green-600 hover:bg-green-700'} disabled:opacity-50"
				>
					{connectionStatus === 'connecting'
						? 'Connecting...'
						: isConnected
							? 'Disconnect'
							: 'Connect'}
				</button>
			{/if}
		</div>
	</div>

	{#if error}
		<div class="rounded border border-red-700 bg-red-900 px-3 py-2 text-red-100">
			<strong>Error:</strong>
			{error}
		</div>
	{/if}

	{#if whepUrl}
		<div class="rounded bg-gray-700 p-3">
			<div class="mb-2 text-sm text-gray-300">WHEP Playback URL:</div>
			<code class="text-xs break-all text-green-400">{whepUrl}</code>
		</div>
	{/if}

	<!-- Video Player -->
	<div class="relative overflow-hidden rounded-lg bg-black" style="aspect-ratio: 16/9;">
		<video
			bind:this={videoElement}
			autoplay
			muted
			controls
			class="h-full w-full object-contain"
			poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225'%3E%3Crect width='400' height='225' fill='%23000'/%3E%3Ctext x='200' y='112.5' text-anchor='middle' fill='%23666' font-family='Arial' font-size='16'%3E{connectionStatus ===
			'disconnected'
				? 'Click Connect to start'
				: connectionStatus === 'connecting'
					? 'Connecting...'
					: 'No video signal'}%3C/text%3E%3C/svg%3E"
		></video>

		{#if connectionStatus === 'connected'}
			<div
				class="absolute top-2 left-2 rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white"
			>
				🔴 LIVE
			</div>
		{/if}
	</div>

	<!-- OBS Instructions -->
	{#if whepUrl}
		<details class="rounded bg-gray-700 p-3">
			<summary class="cursor-pointer font-medium text-white">OBS Browser Source Setup</summary>
			<div class="mt-3 space-y-2 text-sm text-gray-300">
				<p><strong>To use this stream in OBS:</strong></p>
				<ol class="ml-4 list-inside list-decimal space-y-1">
					<li>Open OBS Studio</li>
					<li>Add a new "Browser Source"</li>
					<li>
						Set URL to: <code class="rounded bg-gray-800 px-1 text-green-400">{whepUrl}</code>
					</li>
					<li>Set Width: 1920, Height: 1080</li>
					<li>Enable "Shutdown source when not visible"</li>
					<li>Enable "Refresh browser when scene becomes active"</li>
				</ol>
				<p class="text-yellow-400">
					<strong>Note:</strong> The stream must be live for OBS to receive video.
				</p>
			</div>
		</details>
	{/if}
</div>

<style>
	.whep-viewer {
		min-width: 400px;
	}

	video {
		background: #000;
	}

	details[open] summary {
		margin-bottom: 0.75rem;
	}
</style>
