<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Camera, CameraOff, Mic, MicOff, Play, Square } from 'lucide-svelte';
	import { Button } from '$lib/ui';

	interface Props {
		streamId: string;
		streamTitle: string;
		onStreamStart?: () => void;
		onStreamEnd?: () => void;
	}

	let { streamId, streamTitle, onStreamStart, onStreamEnd }: Props = $props();

	// State management
	let isStreaming = $state(false);
	let isConnecting = $state(false);
	let hasPermission = $state(false);
	let error = $state('');
	let mediaStream = $state<MediaStream | null>(null);
	let peerConnection = $state<RTCPeerConnection | null>(null);
	let videoElement = $state<HTMLVideoElement>();
	let cameraEnabled = $state(true);
	let micEnabled = $state(true);

	// Cleanup on component destroy
	onDestroy(() => {
		cleanup();
	});

	// Effect to update video element when mediaStream or videoElement changes
	$effect(() => {
		if (videoElement && mediaStream && hasPermission) {
			console.log('🔄 [BROWSER_STREAM] Effect: Updating video element with stream');
			videoElement.srcObject = mediaStream;
			videoElement.play().catch((err) => {
				console.error('❌ [BROWSER_STREAM] Effect: Video play error:', err);
			});
		} else {
			console.log('🔄 [BROWSER_STREAM] Effect: Missing requirements:', {
				videoElement: !!videoElement,
				mediaStream: !!mediaStream,
				hasPermission
			});
		}
	});

	async function requestPermissions() {
		console.log('🎥 [BROWSER_STREAM] Requesting camera and microphone permissions...');
		error = '';

		try {
			mediaStream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: 1280 },
					height: { ideal: 720 },
					frameRate: { ideal: 30 }
				},
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true
				}
			});

			console.log('✅ [BROWSER_STREAM] Media permissions granted, stream info:', {
				videoTracks: mediaStream.getVideoTracks().length,
				audioTracks: mediaStream.getAudioTracks().length,
				videoElement: !!videoElement
			});
			hasPermission = true;

			// Show preview with retry mechanism
			if (mediaStream) {
				console.log('📺 [BROWSER_STREAM] Setting up video preview...');

				// Wait for video element to be ready
				setTimeout(() => {
					if (videoElement) {
						videoElement.srcObject = mediaStream;
						videoElement.play().catch((e) => console.error('Play error:', e));
						console.log('✅ [BROWSER_STREAM] Video preview setup complete');
					}
				}, 100);
			} else {
				console.error('❌ [BROWSER_STREAM] No media stream available');
			}
		} catch (err) {
			console.error('❌ [BROWSER_STREAM] Permission denied:', err);
			error =
				'Camera and microphone access is required to stream. Please allow permissions and try again.';
			hasPermission = false;
		}
	}

	async function startStreaming() {
		if (!mediaStream) {
			await requestPermissions();
			if (!mediaStream) return;
		}

		console.log('🚀 [BROWSER_STREAM] Starting WHIP stream for:', streamId);
		isConnecting = true;
		error = '';

		try {
			// 1. Get WHIP URL from our API
			console.log('📡 [BROWSER_STREAM] Getting WHIP URL...');
			const response = await fetch(`/api/streams/${streamId}/whip`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			if (!response.ok) {
				throw new Error(`Failed to get WHIP URL: ${response.statusText}`);
			}

			const { whipUrl, cloudflareInputId } = await response.json();
			console.log('✅ [BROWSER_STREAM] Got WHIP URL:', whipUrl);

			// 2. Create RTCPeerConnection
			peerConnection = new RTCPeerConnection({
				iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }]
			});

			// 3. Add media tracks
			mediaStream.getTracks().forEach((track) => {
				if (peerConnection && mediaStream) {
					peerConnection.addTrack(track, mediaStream);
				}
			});

			// 4. Create offer
			const offer = await peerConnection.createOffer();
			await peerConnection.setLocalDescription(offer);

			console.log('📤 [BROWSER_STREAM] Sending WHIP offer to Cloudflare...');
			console.log('📝 [BROWSER_STREAM] SDP Offer:', offer.sdp);

			// 5. Send WHIP request (pre-authenticated URL)
			const whipResponse = await fetch(whipUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/sdp'
				},
				body: offer.sdp
			});

			console.log(
				'📥 [BROWSER_STREAM] WHIP response status:',
				whipResponse.status,
				whipResponse.statusText
			);

			if (!whipResponse.ok) {
				const errorText = await whipResponse.text();
				console.error('❌ [BROWSER_STREAM] WHIP error response:', errorText);
				throw new Error(
					`WHIP request failed: ${whipResponse.status} ${whipResponse.statusText} - ${errorText}`
				);
			}

			const answerSdp = await whipResponse.text();
			console.log('📥 [BROWSER_STREAM] Received WHIP answer from Cloudflare');

			// 6. Set remote description
			await peerConnection.setRemoteDescription({
				type: 'answer',
				sdp: answerSdp
			});

			// 7. Monitor connection state
			peerConnection.onconnectionstatechange = () => {
				console.log('🔗 [BROWSER_STREAM] Connection state:', peerConnection?.connectionState);

				if (peerConnection?.connectionState === 'connected') {
					console.log('✅ [BROWSER_STREAM] Successfully connected to Cloudflare Stream');
					isStreaming = true;
					isConnecting = false;
					onStreamStart?.();
				} else if (peerConnection?.connectionState === 'failed') {
					console.error('❌ [BROWSER_STREAM] Connection failed');
					error = 'Failed to connect to streaming server. Please try again.';
					cleanup();
				}
			};

			peerConnection.oniceconnectionstatechange = () => {
				console.log(
					'🧊 [BROWSER_STREAM] ICE connection state:',
					peerConnection?.iceConnectionState
				);
			};
		} catch (err) {
			console.error('❌ [BROWSER_STREAM] Error starting stream:', err);
			error = err instanceof Error ? err.message : 'Failed to start streaming';
			isConnecting = false;
			cleanup();
		}
	}

	function stopStreaming() {
		console.log('🛑 [BROWSER_STREAM] Stopping stream...');
		cleanup();
		onStreamEnd?.();
	}

	function cleanup() {
		if (peerConnection) {
			peerConnection.close();
			peerConnection = null;
		}

		if (mediaStream) {
			mediaStream.getTracks().forEach((track) => track.stop());
			mediaStream = null;
		}

		if (videoElement) {
			videoElement.srcObject = null;
		}

		isStreaming = false;
		isConnecting = false;
		hasPermission = false;
	}

	function toggleCamera() {
		if (mediaStream) {
			const videoTrack = mediaStream.getVideoTracks()[0];
			if (videoTrack) {
				videoTrack.enabled = !videoTrack.enabled;
				cameraEnabled = videoTrack.enabled;
			}
		}
	}

	function toggleMicrophone() {
		if (mediaStream) {
			const audioTrack = mediaStream.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = !audioTrack.enabled;
				micEnabled = audioTrack.enabled;
			}
		}
	}
</script>

<div class="browser-streamer">
	<div class="stream-header">
		<h3>📹 Browser Streaming</h3>
		<p class="stream-title">{streamTitle}</p>
	</div>

	{#if error}
		<div class="error-message">
			<AlertCircle size={20} />
			<span>{error}</span>
		</div>
	{/if}

	{#if !hasPermission && !isStreaming}
		<div class="permission-request">
			<div class="permission-content">
				<Camera size={48} class="permission-icon" />
				<h4>Camera & Microphone Access Required</h4>
				<p>To stream from your browser, we need access to your camera and microphone.</p>
				<Button onclick={requestPermissions} variant="primary" size="lg" rounded="lg">
					Allow Camera & Microphone
				</Button>
			</div>
		</div>
	{:else}
		<div class="video-container">
			<video
				bind:this={videoElement}
				autoplay
				muted
				playsinline
				class="preview-video"
				onloadedmetadata={() => console.log('📺 [BROWSER_STREAM] Video metadata loaded')}
				oncanplay={() => console.log('📺 [BROWSER_STREAM] Video can play')}
				onerror={(e) => console.error('❌ [BROWSER_STREAM] Video error:', e)}
			></video>

			<!-- Debug overlay -->
			{#if hasPermission && !mediaStream}
				<div class="video-overlay">
					<p>No video stream available</p>
				</div>
			{:else if hasPermission && mediaStream && mediaStream.getVideoTracks().length === 0}
				<div class="video-overlay">
					<p>No video tracks found</p>
				</div>
			{/if}

			{#if hasPermission}
				<div class="video-controls">
					<button
						onclick={toggleCamera}
						class="control-btn {cameraEnabled ? 'enabled' : 'disabled'}"
						title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
					>
						{#if cameraEnabled}
							<Camera size={20} />
						{:else}
							<CameraOff size={20} />
						{/if}
					</button>

					<button
						onclick={toggleMicrophone}
						class="control-btn {micEnabled ? 'enabled' : 'disabled'}"
						title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
					>
						{#if micEnabled}
							<Mic size={20} />
						{:else}
							<MicOff size={20} />
						{/if}
					</button>
				</div>
			{/if}
		</div>

		<div class="stream-actions">
			{#if !isStreaming && !isConnecting}
				<Button onclick={startStreaming} variant="primary" size="lg" disabled={!hasPermission} rounded="lg">
					<Play size={20} />
					Start Streaming
				</Button>
			{:else if isConnecting}
				<Button variant="primary" size="lg" disabled loading rounded="lg">
					Connecting...
				</Button>
			{:else}
				<Button onclick={stopStreaming} variant="danger" size="lg" rounded="lg">
					<Square size={20} />
					Stop Streaming
				</Button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.browser-streamer {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid #e5e7eb;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.stream-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.stream-header h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
	}

	.stream-title {
		margin: 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		color: #dc2626;
		margin-bottom: 1rem;
	}

	.permission-request {
		text-align: center;
		padding: 2rem;
		background: #f9fafb;
		border-radius: 8px;
		border: 2px dashed #d1d5db;
	}

	.permission-content {
		max-width: 300px;
		margin: 0 auto;
	}

	.permission-icon {
		color: #6b7280;
		margin-bottom: 1rem;
	}

	.permission-content h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #1f2937;
	}

	.permission-content p {
		margin: 0 0 1.5rem 0;
		color: #6b7280;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.permission-btn {
		background: #3b82f6;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.permission-btn:hover {
		background: #2563eb;
	}

	.video-container {
		position: relative;
		margin-bottom: 1.5rem;
		border-radius: 8px;
		overflow: hidden;
		background: #000;
	}

	.preview-video {
		width: 100%;
		height: 300px;
		object-fit: cover;
		display: block;
	}

	.video-overlay {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 1rem;
		border-radius: 8px;
		text-align: center;
		pointer-events: none;
	}

	.video-overlay p {
		margin: 0;
		font-size: 0.875rem;
	}

	.video-controls {
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		display: flex;
		gap: 0.5rem;
	}

	.control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.control-btn.enabled {
		background: rgba(255, 255, 255, 0.9);
		color: #1f2937;
	}

	.control-btn.disabled {
		background: rgba(239, 68, 68, 0.9);
		color: white;
	}

	.control-btn:hover {
		transform: scale(1.05);
	}

	.stream-actions {
		display: flex;
		justify-content: center;
	}

	.start-btn,
	.stop-btn,
	.connecting-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 2rem;
		border-radius: 8px;
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 1rem;
	}

	.start-btn {
		background: #10b981;
		color: white;
	}

	.start-btn:hover:not(:disabled) {
		background: #059669;
	}

	.start-btn:disabled {
		background: #d1d5db;
		color: #9ca3af;
		cursor: not-allowed;
	}

	.stop-btn {
		background: #ef4444;
		color: white;
	}

	.stop-btn:hover {
		background: #dc2626;
	}

	.connecting-btn {
		background: #f59e0b;
		color: white;
		cursor: not-allowed;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 640px) {
		.browser-streamer {
			padding: 1rem;
		}

		.preview-video {
			height: 200px;
		}

		.start-btn,
		.stop-btn,
		.connecting-btn {
			padding: 0.75rem 1.5rem;
			font-size: 0.875rem;
		}
	}
</style>
