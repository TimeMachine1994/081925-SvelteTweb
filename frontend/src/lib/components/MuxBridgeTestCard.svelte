<script lang="ts">
	import { onDestroy } from 'svelte';

	// State management
	let testPhase = $state<'idle' | 'connecting' | 'streaming' | 'recording' | 'complete' | 'error'>('idle');
	let cloudflareStreamId = $state<string>('');
	let muxStreamId = $state<string>('');
	let bridgeStatus = $state<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
	let recordingDuration = $state<string>('00:00');
	let logs = $state<string[]>([]);
	let monitoringInterval: NodeJS.Timeout | null = null;
	let healthInterval: NodeJS.Timeout | null = null;

	// Test results
	let testResults = $state({
		cloudflareConnection: false,
		bridgeConnection: false,
		muxIngestion: false,
		recordingActive: false,
		playbackAvailable: false
	});

	// Cleanup intervals on component destroy
	onDestroy(() => {
		if (monitoringInterval) clearInterval(monitoringInterval);
		if (healthInterval) clearInterval(healthInterval);
	});

	// Logging function
	function addLog(message: string, data?: any) {
		const timestamp = new Date().toLocaleTimeString();
		const logEntry = `[${timestamp}] ${message}`;

		if (data) {
			console.log(logEntry, data);
			logs = [...logs, `${logEntry}\n${JSON.stringify(data, null, 2)}`];
		} else {
			console.log(logEntry);
			logs = [...logs, logEntry];
		}

		// Keep only last 100 log entries
		if (logs.length > 100) {
			logs = logs.slice(-100);
		}
	}

	// Step 1: Validate Cloudflare Stream
	async function validateCloudflareStream(streamId: string) {
		addLog('🔍 [CF-VALIDATE] Starting Cloudflare stream validation...');
		addLog(`📋 [CF-VALIDATE] Stream ID: ${streamId}`);

		try {
			// Check if stream exists and is live
			const response = await fetch(`/api/streams/${streamId}/status`);
			addLog(`📡 [CF-VALIDATE] API Response Status: ${response.status}`);

			if (!response.ok) {
				throw new Error(`Cloudflare API error: ${response.statusText}`);
			}

			const streamData = await response.json();
			addLog(`📊 [CF-VALIDATE] Stream Data:`, streamData);

			if (streamData.status !== 'live') {
				throw new Error(`Stream not live. Current status: ${streamData.status}`);
			}

			// Get HLS URL for bridge connection
			const hlsUrl = `https://customer-${streamData.customerCode}.cloudflarestream.com/${streamId}/manifest/video.m3u8`;
			addLog(`🎥 [CF-VALIDATE] HLS URL Generated: ${hlsUrl}`);

			// Test HLS accessibility
			const hlsResponse = await fetch(hlsUrl, { method: 'HEAD' });
			addLog(`🎥 [CF-VALIDATE] HLS Accessibility Test: ${hlsResponse.status}`);

			if (hlsResponse.ok) {
				addLog('✅ [CF-VALIDATE] Cloudflare stream validation successful');
				testResults.cloudflareConnection = true;
				return { success: true, hlsUrl, streamData };
			} else {
				throw new Error(`HLS not accessible: ${hlsResponse.status}`);
			}
		} catch (error) {
			addLog(`❌ [CF-VALIDATE] Cloudflare validation failed: ${error.message}`);
			testResults.cloudflareConnection = false;
			return { success: false, error: error.message };
		}
	}

	// Step 2: Create MUX Live Stream
	async function createMuxLiveStream() {
		addLog('🎬 [MUX-CREATE] Creating MUX live stream...');

		try {
			const response = await fetch('/api/mux/create-live-stream', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					playback_policy: ['public'],
					new_asset_settings: {
						playback_policy: ['public']
					}
				})
			});

			addLog(`📡 [MUX-CREATE] MUX API Response Status: ${response.status}`);

			if (!response.ok) {
				const errorData = await response.text();
				addLog(`❌ [MUX-CREATE] MUX API Error Response: ${errorData}`);
				throw new Error(`MUX API error: ${response.statusText}`);
			}

			const muxData = await response.json();
			addLog(`📊 [MUX-CREATE] MUX Stream Data:`, muxData);

			const streamId = muxData.data.id;
			const rtmpUrl = muxData.data.stream_key;
			const playbackIds = muxData.data.playback_ids;

			addLog(`🆔 [MUX-CREATE] MUX Stream ID: ${streamId}`);
			addLog(`🔑 [MUX-CREATE] RTMP Stream Key: ${rtmpUrl}`);
			addLog(`📺 [MUX-CREATE] Playback IDs: ${JSON.stringify(playbackIds)}`);

			muxStreamId = streamId;

			addLog('✅ [MUX-CREATE] MUX live stream created successfully');
			return { success: true, streamId, rtmpUrl, playbackIds };
		} catch (error) {
			addLog(`❌ [MUX-CREATE] MUX stream creation failed: ${error.message}`);
			return { success: false, error: error.message };
		}
	}

	// Step 3: Start Bridge Connection
	async function startBridgeConnection(cloudflareHlsUrl: string, muxRtmpUrl: string) {
		addLog('🌉 [BRIDGE] Starting bridge server connection...');
		addLog(`📥 [BRIDGE] Input (Cloudflare HLS): ${cloudflareHlsUrl}`);
		addLog(`📤 [BRIDGE] Output (MUX RTMP): ${muxRtmpUrl}`);

		bridgeStatus = 'connecting';

		try {
			const response = await fetch('/api/bridge/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					inputUrl: cloudflareHlsUrl,
					outputUrl: muxRtmpUrl,
					streamId: cloudflareStreamId
				})
			});

			addLog(`📡 [BRIDGE] Bridge API Response Status: ${response.status}`);

			if (!response.ok) {
				const errorData = await response.text();
				addLog(`❌ [BRIDGE] Bridge API Error: ${errorData}`);
				throw new Error(`Bridge API error: ${response.statusText}`);
			}

			const bridgeData = await response.json();
			addLog(`📊 [BRIDGE] Bridge Response:`, bridgeData);

			if (bridgeData.success) {
				bridgeStatus = 'connected';
				testResults.bridgeConnection = true;
				addLog('✅ [BRIDGE] Bridge connection established successfully');

				// Start monitoring bridge health
				startBridgeMonitoring();

				return { success: true, bridgeData };
			} else {
				throw new Error(bridgeData.error || 'Bridge connection failed');
			}
		} catch (error) {
			bridgeStatus = 'error';
			testResults.bridgeConnection = false;
			addLog(`❌ [BRIDGE] Bridge connection failed: ${error.message}`);
			return { success: false, error: error.message };
		}
	}

	// Step 4: Monitor MUX Ingestion
	async function monitorMuxIngestion() {
		addLog('👁️ [MUX-MONITOR] Starting MUX ingestion monitoring...');

		monitoringInterval = setInterval(async () => {
			try {
				addLog(`🔍 [MUX-MONITOR] Checking MUX stream status: ${muxStreamId}`);

				const response = await fetch(`/api/mux/stream-status/${muxStreamId}`);
				addLog(`📡 [MUX-MONITOR] MUX Status API Response: ${response.status}`);

				if (!response.ok) {
					addLog(`⚠️ [MUX-MONITOR] MUX API error: ${response.statusText}`);
					return;
				}

				const statusData = await response.json();
				addLog(`📊 [MUX-MONITOR] MUX Status:`, statusData);

				const streamStatus = statusData.data.status;
				const isActive = statusData.data.recent_asset_ids?.length > 0;

				addLog(`📈 [MUX-MONITOR] Stream Status: ${streamStatus}`);
				addLog(`🎥 [MUX-MONITOR] Active Recording: ${isActive}`);

				if (streamStatus === 'active') {
					testResults.muxIngestion = true;
					addLog('✅ [MUX-MONITOR] MUX ingestion confirmed - stream is active');
				}

				if (isActive) {
					testResults.recordingActive = true;
					addLog('✅ [MUX-MONITOR] Recording confirmed - asset being created');

					// Check for playback availability
					await checkMuxPlayback(statusData.data.recent_asset_ids[0]);
				}
			} catch (error) {
				addLog(`❌ [MUX-MONITOR] Monitoring error: ${error.message}`);
			}
		}, 5000); // Check every 5 seconds

		return monitoringInterval;
	}

	// Step 5: Check MUX Playback
	async function checkMuxPlayback(assetId: string) {
		addLog(`🎬 [MUX-PLAYBACK] Checking playback for asset: ${assetId}`);

		try {
			const response = await fetch(`/api/mux/asset-status/${assetId}`);
			addLog(`📡 [MUX-PLAYBACK] Asset API Response: ${response.status}`);

			if (!response.ok) {
				addLog(`⚠️ [MUX-PLAYBACK] Asset API error: ${response.statusText}`);
				return;
			}

			const assetData = await response.json();
			addLog(`📊 [MUX-PLAYBACK] Asset Data:`, assetData);

			const assetStatus = assetData.data.status;
			const playbackIds = assetData.data.playback_ids;
			const duration = assetData.data.duration;

			addLog(`📈 [MUX-PLAYBACK] Asset Status: ${assetStatus}`);
			addLog(`⏱️ [MUX-PLAYBACK] Duration: ${duration} seconds`);
			addLog(`📺 [MUX-PLAYBACK] Playback IDs: ${JSON.stringify(playbackIds)}`);

			if (assetStatus === 'ready' && playbackIds?.length > 0) {
				const playbackUrl = `https://stream.mux.com/${playbackIds[0].id}.m3u8`;
				addLog(`🎥 [MUX-PLAYBACK] Playback URL: ${playbackUrl}`);

				testResults.playbackAvailable = true;
				addLog('✅ [MUX-PLAYBACK] Recording playback is available');

				return { success: true, playbackUrl, duration };
			} else {
				addLog(`⏳ [MUX-PLAYBACK] Asset not ready yet. Status: ${assetStatus}`);
				return { success: false, status: assetStatus };
			}
		} catch (error) {
			addLog(`❌ [MUX-PLAYBACK] Playback check failed: ${error.message}`);
			return { success: false, error: error.message };
		}
	}

	// Step 6: Bridge Health Monitoring
	async function startBridgeMonitoring() {
		addLog('💓 [BRIDGE-HEALTH] Starting bridge health monitoring...');

		healthInterval = setInterval(async () => {
			try {
				addLog('🔍 [BRIDGE-HEALTH] Checking bridge server health...');

				const response = await fetch(`/api/bridge/health/${cloudflareStreamId}`);
				addLog(`📡 [BRIDGE-HEALTH] Health API Response: ${response.status}`);

				if (!response.ok) {
					addLog(`⚠️ [BRIDGE-HEALTH] Health check failed: ${response.statusText}`);
					bridgeStatus = 'error';
					return;
				}

				const healthData = await response.json();
				addLog(`📊 [BRIDGE-HEALTH] Health Data:`, healthData);

				const isHealthy = healthData.status === 'healthy';
				const inputConnected = healthData.input?.connected || false;
				const outputConnected = healthData.output?.connected || false;
				const bytesTransferred = healthData.stats?.bytesTransferred || 0;

				addLog(`💚 [BRIDGE-HEALTH] Overall Health: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
				addLog(`📥 [BRIDGE-HEALTH] Input Connected: ${inputConnected}`);
				addLog(`📤 [BRIDGE-HEALTH] Output Connected: ${outputConnected}`);
				addLog(`📊 [BRIDGE-HEALTH] Bytes Transferred: ${bytesTransferred}`);

				if (isHealthy && inputConnected && outputConnected) {
					bridgeStatus = 'connected';
					addLog('✅ [BRIDGE-HEALTH] Bridge is healthy and transferring data');
				} else {
					bridgeStatus = 'error';
					addLog('❌ [BRIDGE-HEALTH] Bridge health issues detected');
				}
			} catch (error) {
				addLog(`❌ [BRIDGE-HEALTH] Health monitoring error: ${error.message}`);
				bridgeStatus = 'error';
			}
		}, 10000); // Check every 10 seconds

		return healthInterval;
	}

	// Main test runner
	async function runFullBridgeTest() {
		addLog('🚀 [TEST-RUNNER] Starting comprehensive bridge test...');
		addLog('📋 [TEST-RUNNER] Test sequence: CF Validation → MUX Creation → Bridge Connection → Recording Verification');

		testPhase = 'connecting';

		try {
			// Step 1: Validate Cloudflare stream
			addLog('📍 [TEST-RUNNER] Step 1/4: Validating Cloudflare stream...');
			const cfValidation = await validateCloudflareStream(cloudflareStreamId);

			if (!cfValidation.success) {
				throw new Error(`Cloudflare validation failed: ${cfValidation.error}`);
			}

			// Step 2: Create MUX live stream
			addLog('📍 [TEST-RUNNER] Step 2/4: Creating MUX live stream...');
			const muxCreation = await createMuxLiveStream();

			if (!muxCreation.success) {
				throw new Error(`MUX creation failed: ${muxCreation.error}`);
			}

			// Step 3: Start bridge connection
			addLog('📍 [TEST-RUNNER] Step 3/4: Starting bridge connection...');
			testPhase = 'streaming';
			const bridgeConnection = await startBridgeConnection(cfValidation.hlsUrl, muxCreation.rtmpUrl);

			if (!bridgeConnection.success) {
				throw new Error(`Bridge connection failed: ${bridgeConnection.error}`);
			}

			// Step 4: Monitor recording
			addLog('📍 [TEST-RUNNER] Step 4/4: Monitoring MUX recording...');
			testPhase = 'recording';
			await monitorMuxIngestion();

			addLog('✅ [TEST-RUNNER] All test phases initiated successfully');
			addLog('👁️ [TEST-RUNNER] Monitoring active - check logs for real-time updates');

			testPhase = 'complete';
			return { success: true };
		} catch (error) {
			addLog(`❌ [TEST-RUNNER] Test failed: ${error.message}`);
			testPhase = 'error';
			return { success: false, error: error.message };
		}
	}

	// Cleanup function
	async function stopBridgeTest() {
		addLog('🛑 [CLEANUP] Stopping bridge test and cleaning up resources...');

		try {
			// Clear intervals
			if (monitoringInterval) {
				clearInterval(monitoringInterval);
				monitoringInterval = null;
			}
			if (healthInterval) {
				clearInterval(healthInterval);
				healthInterval = null;
			}

			// Stop bridge server
			if (bridgeStatus === 'connected') {
				addLog('🌉 [CLEANUP] Stopping bridge server...');
				await fetch(`/api/bridge/stop/${cloudflareStreamId}`, { method: 'POST' });
				bridgeStatus = 'disconnected';
			}

			// Delete MUX stream
			if (muxStreamId) {
				addLog('🎬 [CLEANUP] Deleting MUX live stream...');
				await fetch(`/api/mux/delete-stream/${muxStreamId}`, { method: 'DELETE' });
				muxStreamId = '';
			}

			// Reset state
			testPhase = 'idle';
			testResults = {
				cloudflareConnection: false,
				bridgeConnection: false,
				muxIngestion: false,
				recordingActive: false,
				playbackAvailable: false
			};

			addLog('✅ [CLEANUP] Cleanup completed successfully');
		} catch (error) {
			addLog(`❌ [CLEANUP] Cleanup error: ${error.message}`);
		}
	}

	// Clear logs function
	function clearLogs() {
		logs = [];
		addLog('🧹 [SYSTEM] Console logs cleared');
	}
</script>

<div class="mux-bridge-test-card bg-white rounded-lg shadow-lg p-6 mb-8">
	<!-- Header -->
	<div class="mb-6">
		<h2 class="text-2xl font-bold text-gray-900 mb-2">🌉 MUX Bridge Test Component</h2>
		<p class="text-gray-600">Test Phone → Cloudflare → Bridge → MUX recording pipeline</p>
	</div>

	<!-- Test Controls -->
	<div class="mb-6">
		<div class="flex gap-4 mb-4">
			<input
				bind:value={cloudflareStreamId}
				placeholder="Enter Cloudflare Stream ID"
				class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			/>
			<button
				onclick={runFullBridgeTest}
				disabled={!cloudflareStreamId || testPhase !== 'idle'}
				class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{testPhase === 'idle' ? 'Start Test' : 'Testing...'}
			</button>
			<button
				onclick={stopBridgeTest}
				disabled={testPhase === 'idle'}
				class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				Stop Test
			</button>
		</div>
	</div>

	<!-- Test Phase Indicator -->
	<div class="mb-6">
		<div class="flex items-center gap-2 mb-2">
			<span class="text-sm font-medium text-gray-700">Test Phase:</span>
			<span
				class="px-3 py-1 rounded-full text-sm font-medium"
				class:bg-gray-100={testPhase === 'idle'}
				class:text-gray-700={testPhase === 'idle'}
				class:bg-yellow-100={testPhase === 'connecting'}
				class:text-yellow-800={testPhase === 'connecting'}
				class:bg-blue-100={testPhase === 'streaming'}
				class:text-blue-800={testPhase === 'streaming'}
				class:bg-purple-100={testPhase === 'recording'}
				class:text-purple-800={testPhase === 'recording'}
				class:bg-green-100={testPhase === 'complete'}
				class:text-green-800={testPhase === 'complete'}
				class:bg-red-100={testPhase === 'error'}
				class:text-red-800={testPhase === 'error'}
			>
				{testPhase.toUpperCase()}
			</span>
		</div>
	</div>

	<!-- Status Dashboard -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
		<!-- Cloudflare Status -->
		<div class="bg-gray-50 p-4 rounded-lg">
			<h3 class="font-semibold mb-2 flex items-center gap-2">
				📱 <span>Cloudflare Stream</span>
			</h3>
			<div class="text-sm space-y-1">
				<div class="flex items-center gap-2">
					<span class={testResults.cloudflareConnection ? 'text-green-600' : 'text-gray-400'}>
						{testResults.cloudflareConnection ? '✅' : '⭕'}
					</span>
					<span>Connection</span>
				</div>
				{#if cloudflareStreamId}
					<div class="text-xs text-gray-500 mt-2">
						ID: {cloudflareStreamId.slice(0, 8)}...
					</div>
				{/if}
			</div>
		</div>

		<!-- Bridge Status -->
		<div class="bg-gray-50 p-4 rounded-lg">
			<h3 class="font-semibold mb-2 flex items-center gap-2">
				🌉 <span>Bridge Server</span>
			</h3>
			<div class="text-sm space-y-1">
				<div class="flex items-center gap-2">
					<span
						class={bridgeStatus === 'connected'
							? 'text-green-600'
							: bridgeStatus === 'connecting'
								? 'text-yellow-600'
								: bridgeStatus === 'error'
									? 'text-red-600'
									: 'text-gray-400'}
					>
						{bridgeStatus === 'connected'
							? '✅'
							: bridgeStatus === 'connecting'
								? '🟡'
								: bridgeStatus === 'error'
									? '❌'
									: '⭕'}
					</span>
					<span class="capitalize">{bridgeStatus}</span>
				</div>
				<div class="flex items-center gap-2">
					<span class={testResults.bridgeConnection ? 'text-green-600' : 'text-gray-400'}>
						{testResults.bridgeConnection ? '✅' : '⭕'}
					</span>
					<span>Data Transfer</span>
				</div>
			</div>
		</div>

		<!-- MUX Status -->
		<div class="bg-gray-50 p-4 rounded-lg">
			<h3 class="font-semibold mb-2 flex items-center gap-2">
				📹 <span>MUX Recording</span>
			</h3>
			<div class="text-sm space-y-1">
				<div class="flex items-center gap-2">
					<span class={testResults.muxIngestion ? 'text-green-600' : 'text-gray-400'}>
						{testResults.muxIngestion ? '✅' : '⭕'}
					</span>
					<span>Ingestion</span>
				</div>
				<div class="flex items-center gap-2">
					<span class={testResults.recordingActive ? 'text-green-600' : 'text-gray-400'}>
						{testResults.recordingActive ? '✅' : '⭕'}
					</span>
					<span>Recording</span>
				</div>
				<div class="flex items-center gap-2">
					<span class={testResults.playbackAvailable ? 'text-green-600' : 'text-gray-400'}>
						{testResults.playbackAvailable ? '✅' : '⭕'}
					</span>
					<span>Playback</span>
				</div>
				{#if muxStreamId}
					<div class="text-xs text-gray-500 mt-2">
						ID: {muxStreamId.slice(0, 8)}...
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Console Logs -->
	<div class="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
		<div class="flex items-center justify-between mb-2">
			<div class="text-white font-bold">🖥️ Console Output:</div>
			<button
				onclick={clearLogs}
				class="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors"
			>
				Clear
			</button>
		</div>
		<div class="h-64 overflow-y-auto space-y-1">
			{#each logs as log}
				<div class="whitespace-pre-wrap break-words">{log}</div>
			{:else}
				<div class="text-gray-500 italic">No logs yet. Start a test to see output...</div>
			{/each}
		</div>
	</div>
</div>
