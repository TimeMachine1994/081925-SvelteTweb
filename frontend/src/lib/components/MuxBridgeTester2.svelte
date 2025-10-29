<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	// State management
	let testStatus: 'idle' | 'running' | 'success' | 'error' = 'idle';
	let currentStep = 0;
	let logs: string[] = [];

	// WHIP streaming
	let peerConnection: RTCPeerConnection | null = null;
	let localStream: MediaStream | null = null;
	let whipResourceUrl = '';
	let cloudflareStreamId = '';
	let cloudflareHlsUrl = '';

	// Bridge session
	let bridgeSessionId = '';
	let muxUploadId = '';
	let muxAssetId = '';
	
	// Monitoring
	let healthCheckInterval: number;
	let assetCheckInterval: number;

	// Stats
	let segmentsUploaded = 0;
	let bytesTransferred = 0;
	let bridgeUptime = 0;

	const steps = [
		'📹 Start WHIP Stream',
		'🔍 Validate Cloudflare HLS',
		'🌉 Start Bridge (Worker)',
		'📊 Monitor Upload Progress',
		'✅ Verify MUX Asset'
	];

	function addLog(message: string) {
		const timestamp = new Date().toLocaleTimeString();
		logs = [`[${timestamp}] ${message}`, ...logs].slice(0, 50);
		console.log(message);
	}

	async function startTest() {
		testStatus = 'running';
		currentStep = 0;
		logs = [];
		addLog('🚀 Starting MUX Bridge Test (Direct Upload Architecture)');

		try {
			// Step 1: Start WHIP Stream
			currentStep = 1;
			await startWhipStream();

			// Step 2: Validate Cloudflare HLS
			currentStep = 2;
			await validateCloudflareHls();

			// Step 3: Start Bridge
			currentStep = 3;
			await startBridge();

			// Step 4: Monitor Upload Progress
			currentStep = 4;
			startMonitoring();

			testStatus = 'success';
			addLog('✅ Test sequence completed - monitoring active');
		} catch (error) {
			testStatus = 'error';
			addLog(`❌ Test failed: ${error.message}`);
		}
	}

	async function startWhipStream() {
		addLog('📹 Starting WHIP stream to Cloudflare...');

		try {
			// Get user media
			localStream = await navigator.mediaDevices.getUserMedia({
				video: { width: 1280, height: 720 },
				audio: true
			});
			addLog('✅ Camera and microphone access granted');

			// Create peer connection
			peerConnection = new RTCPeerConnection({
				iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
				bundlePolicy: 'max-bundle'
			});

			// Add tracks
			localStream.getTracks().forEach(track => {
				peerConnection!.addTrack(track, localStream!);
				addLog(`➕ Added ${track.kind} track`);
			});

			// Create offer
			const offer = await peerConnection.createOffer();
			await peerConnection.setLocalDescription(offer);
			addLog('📤 Created WebRTC offer');

			// Send WHIP request
			const whipResponse = await fetch('/api/whip/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/sdp' },
				body: offer.sdp
			});

			if (!whipResponse.ok) {
				throw new Error(`WHIP request failed: ${whipResponse.status}`);
			}

			const answerSdp = await whipResponse.text();
			whipResourceUrl = whipResponse.headers.get('location') || '';
			cloudflareStreamId = whipResourceUrl.split('/').pop() || '';

			await peerConnection.setRemoteDescription({
				type: 'answer',
				sdp: answerSdp
			});

			addLog(`✅ WHIP stream started: ${cloudflareStreamId}`);

			// Wait for connection
			await new Promise((resolve, reject) => {
				const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
				peerConnection!.oniceconnectionstatechange = () => {
					if (peerConnection!.iceConnectionState === 'connected') {
						clearTimeout(timeout);
						resolve(void 0);
					}
				};
			});

			addLog('🔗 WebRTC connection established');
		} catch (error) {
			throw new Error(`WHIP stream failed: ${error.message}`);
		}
	}

	async function validateCloudflareHls() {
		addLog('🔍 Validating Cloudflare HLS stream...');

		// Get customer code
		const configResponse = await fetch('/api/config/cloudflare');
		const config = await configResponse.json();
		const customerCode = config.customerCode;

		// Build HLS URL
		cloudflareHlsUrl = `https://customer-${customerCode}.cloudflarestream.com/${cloudflareStreamId}/manifest/video.m3u8`;
		addLog(`📺 HLS URL: ${cloudflareHlsUrl}`);

		// Test accessibility
		const hlsResponse = await fetch(cloudflareHlsUrl);
		if (!hlsResponse.ok && hlsResponse.status !== 204) {
			throw new Error(`HLS not accessible: ${hlsResponse.status}`);
		}

		addLog('✅ HLS stream is accessible');
	}

	async function startBridge() {
		addLog('🌉 Starting Cloudflare Worker bridge...');

		const response = await fetch('/api/bridge/start', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				streamId: cloudflareStreamId,
				inputUrl: cloudflareHlsUrl
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Bridge start failed: ${errorText}`);
		}

		const result = await response.json();
		bridgeSessionId = result.bridgeId;
		
		addLog('✅ Bridge started successfully');
		addLog(`🆔 Session ID: ${bridgeSessionId}`);
		addLog('📤 Worker creating MUX Direct Upload...');
	}

	function startMonitoring() {
		addLog('👁️ Starting monitoring...');

		// Check bridge health every 5 seconds
		healthCheckInterval = window.setInterval(async () => {
			try {
				const response = await fetch(`/api/bridge/health/${cloudflareStreamId}`);
				if (!response.ok) return;

				const health = await response.json();
				
				segmentsUploaded = health.segmentCount || 0;
				bytesTransferred = health.bytesTransferred || 0;
				bridgeUptime = health.uptime || 0;
				muxUploadId = health.muxUploadId || muxUploadId;

				if (health.segmentCount > 0) {
					addLog(`📊 Progress: ${segmentsUploaded} segments, ${formatBytes(bytesTransferred)}`);
				}
			} catch (error) {
				console.error('Health check failed:', error);
			}
		}, 5000);

		// Check for MUX asset creation every 10 seconds
		assetCheckInterval = window.setInterval(async () => {
			if (!muxUploadId) return;

			try {
				const response = await fetch(`/api/mux/upload/${muxUploadId}`);
				if (!response.ok) return;

				const upload = await response.json();
				
				if (upload.asset_id && !muxAssetId) {
					muxAssetId = upload.asset_id;
					currentStep = 5;
					addLog(`🎉 MUX Asset Created: ${muxAssetId}`);
					addLog('✅ Recording available for playback!');
				}
			} catch (error) {
				console.error('Asset check failed:', error);
			}
		}, 10000);
	}

	async function stopTest() {
		addLog('🛑 Stopping test...');

		// Stop monitoring
		if (healthCheckInterval) clearInterval(healthCheckInterval);
		if (assetCheckInterval) clearInterval(assetCheckInterval);

		// Stop bridge
		if (cloudflareStreamId) {
			try {
				await fetch(`/api/bridge/stop/${cloudflareStreamId}`, { method: 'DELETE' });
				addLog('✅ Bridge stopped');
			} catch (error) {
				console.error('Failed to stop bridge:', error);
			}
		}

		// Stop WHIP
		if (peerConnection) {
			peerConnection.close();
			peerConnection = null;
		}

		if (localStream) {
			localStream.getTracks().forEach(track => track.stop());
			localStream = null;
		}

		if (whipResourceUrl) {
			try {
				await fetch(whipResourceUrl, { method: 'DELETE' });
				addLog('✅ WHIP stream stopped');
			} catch (error) {
				console.error('Failed to stop WHIP:', error);
			}
		}

		testStatus = 'idle';
		currentStep = 0;
		addLog('✅ Cleanup completed');
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
	}

	onDestroy(() => {
		if (testStatus === 'running' || testStatus === 'success') {
			stopTest();
		}
	});
</script>

<div class="max-w-6xl mx-auto p-6">
	<!-- Header -->
	<div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-6 mb-6">
		<h1 class="text-3xl font-bold mb-2">🌉 MUX Bridge Tester v2</h1>
		<p class="text-blue-100">Phone → Cloudflare (WHIP) → Worker (Direct Upload) → MUX (Asset)</p>
		<div class="mt-3 text-sm bg-white/20 rounded px-3 py-2">
			<strong>Architecture:</strong> Uses Cloudflare Worker to download HLS segments and upload to MUX Direct Upload API
		</div>
	</div>

	<!-- Control Panel -->
	<div class="bg-white rounded-lg shadow-lg p-6 mb-6">
		<div class="flex gap-4 items-center">
			<button
				on:click={startTest}
				disabled={testStatus === 'running' || testStatus === 'success'}
				class="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
			>
				🚀 Start Test
			</button>

			<button
				on:click={stopTest}
				disabled={testStatus !== 'running' && testStatus !== 'success'}
				class="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
			>
				🛑 Stop Test
			</button>

			<div class="flex-1"></div>

			{#if testStatus === 'running' || testStatus === 'success'}
				<div class="flex gap-4 text-sm">
					<div class="text-center">
						<div class="text-gray-500">Segments</div>
						<div class="text-2xl font-bold text-blue-600">{segmentsUploaded}</div>
					</div>
					<div class="text-center">
						<div class="text-gray-500">Data</div>
						<div class="text-2xl font-bold text-purple-600">{formatBytes(bytesTransferred)}</div>
					</div>
					<div class="text-center">
						<div class="text-gray-500">Uptime</div>
						<div class="text-2xl font-bold text-green-600">{bridgeUptime}s</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Progress Steps -->
	<div class="bg-white rounded-lg shadow-lg p-6 mb-6">
		<h2 class="text-xl font-bold mb-4">Test Progress</h2>
		<div class="space-y-3">
			{#each steps as step, index}
				<div class="flex items-center gap-3">
					<div class={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
						currentStep > index ? 'bg-green-500' :
						currentStep === index ? 'bg-blue-500 animate-pulse' :
						'bg-gray-300'
					}`}>
						{index + 1}
					</div>
					<div class={`flex-1 text-lg ${
						currentStep > index ? 'text-green-600 font-semibold' :
						currentStep === index ? 'text-blue-600 font-semibold' :
						'text-gray-400'
					}`}>
						{step}
					</div>
					{#if currentStep > index}
						<span class="text-green-500">✓</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Status Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
		<!-- Cloudflare Status -->
		<div class="bg-white rounded-lg shadow-lg p-6">
			<h3 class="text-lg font-bold mb-3 flex items-center gap-2">
				<span class={cloudflareStreamId ? 'text-green-500' : 'text-gray-400'}>●</span>
				Cloudflare Stream
			</h3>
			{#if cloudflareStreamId}
				<div class="text-sm space-y-2">
					<div><strong>Stream ID:</strong> {cloudflareStreamId.slice(0, 8)}...</div>
					<div><strong>Protocol:</strong> WHIP</div>
					<div><strong>Status:</strong> <span class="text-green-600">Connected</span></div>
				</div>
			{:else}
				<div class="text-gray-400 text-sm">Not started</div>
			{/if}
		</div>

		<!-- Worker Bridge Status -->
		<div class="bg-white rounded-lg shadow-lg p-6">
			<h3 class="text-lg font-bold mb-3 flex items-center gap-2">
				<span class={bridgeSessionId ? 'text-green-500' : 'text-gray-400'}>●</span>
				Worker Bridge
			</h3>
			{#if bridgeSessionId}
				<div class="text-sm space-y-2">
					<div><strong>Session:</strong> Active</div>
					<div><strong>Upload ID:</strong> {muxUploadId ? muxUploadId.slice(0, 8) + '...' : 'Creating...'}</div>
					<div><strong>Status:</strong> <span class="text-green-600">Processing</span></div>
				</div>
			{:else}
				<div class="text-gray-400 text-sm">Not started</div>
			{/if}
		</div>

		<!-- MUX Asset Status -->
		<div class="bg-white rounded-lg shadow-lg p-6">
			<h3 class="text-lg font-bold mb-3 flex items-center gap-2">
				<span class={muxAssetId ? 'text-green-500' : 'text-gray-400'}>●</span>
				MUX Asset
			</h3>
			{#if muxAssetId}
				<div class="text-sm space-y-2">
					<div><strong>Asset ID:</strong> {muxAssetId.slice(0, 8)}...</div>
					<div><strong>Type:</strong> VOD Recording</div>
					<div><strong>Status:</strong> <span class="text-green-600">Ready</span></div>
				</div>
			{:else if muxUploadId}
				<div class="text-yellow-600 text-sm">Processing upload...</div>
			{:else}
				<div class="text-gray-400 text-sm">Not started</div>
			{/if}
		</div>
	</div>

	<!-- Console Logs -->
	<div class="bg-gray-900 rounded-lg shadow-lg p-6">
		<div class="flex justify-between items-center mb-4">
			<h2 class="text-xl font-bold text-white">Console Logs</h2>
			<button
				on:click={() => logs = []}
				class="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
			>
				Clear
			</button>
		</div>
		<div class="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-sm">
			{#each logs as log}
				<div class="text-green-400 mb-1">{log}</div>
			{:else}
				<div class="text-gray-500">No logs yet. Click "Start Test" to begin.</div>
			{/each}
		</div>
	</div>
</div>

<style>
	:global(body) {
		background: linear-gradient(to bottom right, #f3f4f6, #e5e7eb);
		min-height: 100vh;
	}
</style>
