<script lang="ts">
	import { Video, Copy, Check, Info, Smartphone, Eye } from 'lucide-svelte';

	let { data } = $props();
	const { memorial } = data;
	
	// Debug logging for memorial data
	console.log('🏛️ Memorial data loaded:', JSON.stringify(memorial, null, 2));
	console.log('🎥 Livestream data:', JSON.stringify(memorial.livestream, null, 2));
	console.log('🔗 Playback URLs available:', {
		playbackUrl: memorial.livestream?.playbackUrl,
		alternativePlaybackUrl: memorial.livestream?.alternativePlaybackUrl,
		directPlaybackUrl: memorial.livestream?.directPlaybackUrl,
		hls: memorial.livestream?.playback?.hls
	});

	let streamKeyCopied = $state(false);
	let serverUrlCopied = $state(false);
	let whipUrl = $state('');
	let localStream = $state<MediaStream | null>(null);
	let pc = $state<RTCPeerConnection | null>(null);
	let isStreaming = $state(false);
	let isLoading = $state(false);
	let videoElement = $state<HTMLVideoElement | null>(null);
	let videoDevices = $state<MediaDeviceInfo[]>([]);
	let selectedVideoDeviceId = $state('');

	$effect(() => {
		if (videoElement && localStream) {
			console.log('EFFECT: Attaching MediaStream to video element.');
			videoElement.srcObject = localStream;
			videoElement.play().catch(e => console.error('Error trying to play video:', e));
		} else {
			console.log('EFFECT: videoElement or localStream not ready.', { videoElement, localStream });
		}
	});

	function copyToClipboard(text: string, type: 'key' | 'url') {
		if (type === 'key') {
			streamKeyCopied = true;
			setTimeout(() => (streamKeyCopied = false), 2000);
		} else {
			serverUrlCopied = true;
			setTimeout(() => (serverUrlCopied = false), 2000);
		}
		navigator.clipboard.writeText(text);
	}

	const rtmpsUrl = memorial.livestream?.rtmps?.url || memorial.livestream?.streamUrl || 'rtmps://live.cloudflare.com:443/live/';
	const streamKey = memorial.livestream?.streamKey || '';
	const serverUrl = rtmpsUrl.replace('{STREAM_KEY}', '');
	
	// Debug RTMPS configuration
	console.log('📡 RTMPS Configuration:', {
		rtmpsUrl,
		streamKey: streamKey ? 'SET' : 'MISSING',
		serverUrl,
		originalStreamUrl: memorial.livestream?.streamUrl
	});

	async function getVideoDevices() {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			videoDevices = devices.filter(d => d.kind === 'videoinput');
			if (videoDevices.length > 0 && !selectedVideoDeviceId) {
				selectedVideoDeviceId = videoDevices[0].deviceId;
			}
		} catch (error) {
			console.error('Error enumerating video devices:', error);
		}
	}

	async function getWhipUrlAndStartCamera(deviceId: string) {
		if (isLoading) return;
		isLoading = true;

		try {
			// Stop any existing stream before starting a new one
			stopStreaming(false); // Keep UI state, just stop tracks

			// Get camera permissions and stream
			console.log(`📹 Requesting camera with deviceId: ${deviceId}`);
			const constraints: MediaStreamConstraints = {
				audio: true,
				video: deviceId ? { deviceId: { exact: deviceId } } : true
			};
			console.log('📹 Media constraints:', JSON.stringify(constraints, null, 2));
			localStream = await navigator.mediaDevices.getUserMedia(constraints);
			console.log('✅ MediaStream acquired:', localStream);
			console.log('📹 Stream tracks:', localStream.getTracks().map(track => ({
				kind: track.kind,
				label: track.label,
				enabled: track.enabled,
				readyState: track.readyState
			})));
			const videoTracks = localStream.getVideoTracks();
			console.log('✅ Video Tracks:', videoTracks);
			if (videoTracks.length > 0) {
				console.log('  - Track 0 Settings:', videoTracks[0].getSettings());
			}

			// Assign stream to video element for preview
			if (videoElement && localStream) {
				videoElement.srcObject = localStream;
				console.log('📺 Stream assigned to video element');
			}

			// Populate device list if not already done
			if (videoDevices.length === 0) {
				await getVideoDevices();
			}

			// Fetch the WHIP URL from our API
			console.log('🌐 Fetching WHIP URL from API...');
			const response = await fetch(`/api/memorials/${memorial.id}/livestream/whip`, {
				method: 'POST',
			});

			console.log('🌐 WHIP API Response status:', response.status);
			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ WHIP API Error:', errorText);
				throw new Error('Failed to get WHIP URL from server.');
			}

			const whipData = await response.json();
			console.log('🌐 WHIP API Response data:', JSON.stringify(whipData, null, 2));
			const { whipEndpoint } = whipData;
			whipUrl = whipEndpoint;
			console.log('🌐 WHIP URL set to:', whipUrl);

		} catch (error) {
			console.error('Error preparing mobile stream:', error);
			alert('Could not access camera or get stream URL. Please check permissions and try again.');
			stopStreaming(); // Clean up
		} finally {
			isLoading = false;
		}
	}

	async function startBroadcast() {
		if (!whipUrl || !localStream) return;
		isLoading = true;

		pc = new RTCPeerConnection();
		pc.oniceconnectionstatechange = () => {
			console.log('🧊 ICE Connection State changed:', pc?.iceConnectionState);
			if (pc?.iceConnectionState === 'connected') {
				console.log('✅ WebRTC connection established!');
				isStreaming = true;
				isLoading = false;
			}
			if (pc?.iceConnectionState === 'failed' || pc?.iceConnectionState === 'disconnected') {
				console.log('❌ WebRTC connection failed/disconnected');
				stopStreaming();
			}
		};
		
		pc.onconnectionstatechange = () => {
			console.log('🔗 Connection State changed:', pc?.connectionState);
		};
		
		pc.onicegatheringstatechange = () => {
			console.log('🧊 ICE Gathering State changed:', pc?.iceGatheringState);
		};

		console.log('📡 Adding tracks to peer connection...');
		localStream.getTracks().forEach(track => {
			console.log('➕ Adding track:', track.kind, track.label);
			pc!.addTrack(track, localStream!);
		});

		console.log('📝 Creating WebRTC offer...');
		const offer = await pc.createOffer();
		console.log('📝 Offer created:', offer.type, offer.sdp?.substring(0, 100) + '...');
		await pc.setLocalDescription(offer);
		console.log('📝 Local description set');

		try {
			console.log('🌐 Sending WHIP request to:', whipUrl);
			console.log('📝 SDP Offer length:', pc.localDescription?.sdp?.length);
			const response = await fetch(whipUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/sdp' },
				body: pc.localDescription?.sdp,
			});

			console.log('🌐 WHIP Response status:', response.status);
			console.log('🌐 WHIP Response headers:', Object.fromEntries(response.headers.entries()));
			
			if (!response.ok || response.status !== 201) {
				const errorBody = await response.text();
				console.error('❌ WHIP Error body:', errorBody);
				throw new Error(`WHIP connection failed: ${response.status} - ${errorBody}`);
			}

			const answerSdp = await response.text();
			console.log('📝 SDP Answer received, length:', answerSdp.length);
			console.log('📝 SDP Answer preview:', answerSdp.substring(0, 200) + '...');
			await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
			console.log('📝 Remote description set successfully');

		} catch (error) {
			console.error('💥 Error during WHIP negotiation:', error);
			console.error('💥 Error details:', {
				message: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
				whipUrl,
				peerConnectionState: pc?.connectionState,
				iceConnectionState: pc?.iceConnectionState
			});
			alert('Failed to connect to the streaming server. Check console for details.');
			stopStreaming();
			isLoading = false;
		}
	}

	async function stopStreaming(resetUi: boolean = true) {
		console.log('Stopping stream...');
		pc?.close();
		pc = null;
		localStream?.getTracks().forEach(track => track.stop());
		localStream = null;
		if (resetUi) {
			whipUrl = '';
			isStreaming = false;
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Start Stream - {memorial.lovedOneName}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="mb-12">
			<div class="flex justify-between items-center mb-4">
				<a href="/profile" class="text-blue-400 hover:text-blue-300 transition-colors">&larr; Back to Profile</a>
				<a href={`/tributes/${memorial.fullSlug}`} target="_blank" class="px-4 py-2 rounded-xl bg-green-600 text-white font-medium hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center">
					<Eye class="w-4 h-4 mr-2" />
					View Memorial
				</a>
			</div>
			<h1 class="text-4xl font-bold mt-2">Livestream Control Center</h1>
			<p class="text-lg text-gray-400">{memorial.lovedOneName}</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Left Column: Stream Preview -->
			<div class="lg:col-span-2 bg-black rounded-2xl shadow-2xl overflow-hidden border border-blue-500/30">
				{#if memorial.livestream?.playback?.hls}
					<iframe
            title="Livestream Video Player"
            src={memorial.livestream.playback.hls}
            class="w-full h-full aspect-video"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowfullscreen
          ></iframe>
				{:else}
					<div class="w-full h-full aspect-video flex items-center justify-center bg-gray-800">
						<div class="text-center">
							<Video class="w-16 h-16 mx-auto text-gray-600 mb-4" />
							<h3 class="text-xl font-semibold">Stream Offline</h3>
							<p class="text-gray-400">Start streaming from your software to see the preview.</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Right Column: Stream Credentials -->
			<div class="bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/10">
				<h2 class="text-2xl font-bold mb-6 flex items-center">
					<Info class="w-6 h-6 mr-3 text-blue-400" />
					Stream Setup
				</h2>

				<div class="space-y-6">
					<!-- Server URL -->
					<div>
						<label for="server-url" class="block text-sm font-medium text-gray-400 mb-2">Server URL</label>
            <div class="flex items-center bg-gray-900 rounded-lg">
              <input id="server-url" type="text" readonly value={serverUrl} class="w-full bg-transparent p-3 focus:outline-none" />
							<button
								onclick={() => copyToClipboard(serverUrl, 'url')}
								class="p-3 text-gray-400 hover:text-white transition-colors"
							>
								{#if serverUrlCopied}
									<Check class="w-5 h-5 text-green-400" />
								{:else}
									<Copy class="w-5 h-5" />
								{/if}
							</button>
						</div>
					</div>

					<!-- Stream Key -->
					<div>
						<label for="stream-key" class="block text-sm font-medium text-gray-400 mb-2">Stream Key</label>
            <div class="flex items-center bg-gray-900 rounded-lg">
              <input id="stream-key" type="password" readonly value={streamKey} class="w-full bg-transparent p-3 focus:outline-none" />
							<button
								onclick={() => copyToClipboard(streamKey, 'key')}
								class="p-3 text-gray-400 hover:text-white transition-colors"
							>
								{#if streamKeyCopied}
									<Check class="w-5 h-5 text-green-400" />
								{:else}
									<Copy class="w-5 h-5" />
								{/if}
							</button>
						</div>
					</div>
				</div>

				<div class="mt-8 p-4 bg-blue-900/50 rounded-lg border border-blue-500/30">
					<p class="text-sm text-blue-300">
						Copy these credentials into your streaming software (e.g., OBS, Streamlabs) to start the broadcast.
					</p>
				</div>

				<div class="my-8 border-t border-white/10"></div>

				<div>
					<h3 class="text-xl font-bold mb-4 flex items-center">
						<Smartphone class="w-5 h-5 mr-3 text-green-400" />
						Go Live from this Device
					</h3>

					{#if !whipUrl}
						<p class="text-gray-400 mb-4 text-sm">
							No extra software needed. Stream directly from your browser.
						</p>
						<button
							onclick={() => getWhipUrlAndStartCamera(selectedVideoDeviceId)}
							disabled={isLoading}
							class="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
						>
							{#if isLoading}
								<span class="animate-pulse">Starting Camera...</span>
							{:else}
								<Video class="w-5 h-5 mr-2" />
								Enable Camera & Go Live
							{/if}
						</button>
					{:else}
						<div class="space-y-4">
							<div class="bg-black rounded-lg overflow-hidden aspect-video border border-white/10 relative group">
								<video 
									bind:this={videoElement} 
									class="w-full h-full" 
									autoplay 
									muted 
									playsinline
									onplaying={() => console.log('EVENT: Video element is now playing.')}
								></video>
								<div class="absolute top-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
									<select bind:value={selectedVideoDeviceId} onchange={() => getWhipUrlAndStartCamera(selectedVideoDeviceId)} class="w-full bg-black/50 text-white border border-white/20 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
										{#each videoDevices as device}
											<option value={device.deviceId}>{device.label}</option>
										{/each}
									</select>
								</div>
							</div>
							<div class="grid grid-cols-2 gap-4">
								{#if !isStreaming}
									<button
										onclick={startBroadcast}
										disabled={isLoading}
										class="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
									>
										{#if isLoading}
											<span class="animate-pulse">Connecting...</span>
										{:else}
											<span class="w-3 h-3 mr-2 bg-white rounded-full"></span>
											START BROADCAST
										{/if}
									</button>
								{:else}
									<div class="w-full bg-red-800/50 text-red-300 font-bold py-3 px-4 rounded-lg flex items-center justify-center">
										<span class="w-3 h-3 mr-2 bg-red-500 rounded-full animate-pulse"></span>
										LIVE
									</div>
								{/if}
								<button
									onclick={() => stopStreaming(true)}
									class="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
								>
									Stop
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
