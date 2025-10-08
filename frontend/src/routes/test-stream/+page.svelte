<script lang="ts">
	import { onMount } from 'svelte';
	
	let streamId = $state('');
	let testResults = $state<any>({});
	let testing = $state(false);
	let logs = $state<string[]>([]);

	function addLog(message: string) {
		logs = [...logs, `${new Date().toLocaleTimeString()}: ${message}`];
		console.log(message);
	}

	async function testStream() {
		if (!streamId.trim()) {
			addLog('❌ Please enter a stream ID');
			return;
		}

		testing = true;
		testResults = {};
		logs = [];
		
		addLog('🧪 Starting stream tests...');

		// Test 1: Check if stream exists in database
		try {
			addLog('📋 Test 1: Checking stream in database...');
			const streamResponse = await fetch(`/api/streams/${streamId}`);
			const streamData = await streamResponse.json();
			
			if (streamData.success) {
				testResults.streamExists = true;
				testResults.streamData = streamData.stream;
				addLog(`✅ Stream found: ${streamData.stream.title} (Status: ${streamData.stream.status})`);
			} else {
				testResults.streamExists = false;
				addLog(`❌ Stream not found: ${streamData.error}`);
			}
		} catch (error) {
			testResults.streamExists = false;
			addLog(`❌ Error checking stream: ${error}`);
		}

		// Test 2: Test HLS API endpoint
		try {
			addLog('📺 Test 2: Testing HLS API endpoint...');
			const hlsResponse = await fetch(`/api/streams/${streamId}/hls`);
			const hlsData = await hlsResponse.json();
			
			if (hlsData.success) {
				testResults.hlsApi = true;
				testResults.hlsUrl = hlsData.hlsUrl;
				addLog(`✅ HLS API working: ${hlsData.hlsUrl}`);
			} else {
				testResults.hlsApi = false;
				addLog(`❌ HLS API failed: ${hlsData.error}`);
			}
		} catch (error) {
			testResults.hlsApi = false;
			addLog(`❌ Error testing HLS API: ${error}`);
		}

		// Test 3: Test direct HLS URL
		if (testResults.hlsUrl) {
			try {
				addLog('🔗 Test 3: Testing direct HLS URL...');
				const directResponse = await fetch(testResults.hlsUrl, { method: 'HEAD' });
				
				if (directResponse.ok) {
					testResults.hlsUrlAccessible = true;
					addLog(`✅ Direct HLS URL accessible (${directResponse.status})`);
				} else {
					testResults.hlsUrlAccessible = false;
					addLog(`❌ Direct HLS URL failed (${directResponse.status})`);
				}
			} catch (error) {
				testResults.hlsUrlAccessible = false;
				addLog(`❌ Error testing direct HLS URL: ${error}`);
			}
		}

		// Test 4: Test embedding page
		try {
			addLog('🌐 Test 4: Testing HLS embedding page...');
			const embedResponse = await fetch(`/hls/${streamId}`, { method: 'HEAD' });
			
			if (embedResponse.ok) {
				testResults.embedPageAccessible = true;
				addLog(`✅ HLS embedding page accessible (${embedResponse.status})`);
			} else {
				testResults.embedPageAccessible = false;
				addLog(`❌ HLS embedding page failed (${embedResponse.status})`);
			}
		} catch (error) {
			testResults.embedPageAccessible = false;
			addLog(`❌ Error testing embedding page: ${error}`);
		}

		// Test 5: Test WHEP API endpoint
		try {
			addLog('🎯 Test 5: Testing WHEP API endpoint...');
			const whepResponse = await fetch(`/api/streams/${streamId}/whep`);
			const whepData = await whepResponse.json();
			
			if (whepData.success) {
				testResults.whepApi = true;
				testResults.whepUrl = whepData.whepUrl;
				addLog(`✅ WHEP API working: ${whepData.whepUrl}`);
			} else {
				testResults.whepApi = false;
				addLog(`❌ WHEP API failed: ${whepData.error}`);
			}
		} catch (error) {
			testResults.whepApi = false;
			addLog(`❌ Error testing WHEP API: ${error}`);
		}

		testing = false;
		addLog('🏁 Tests completed!');
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		addLog(`📋 Copied to clipboard: ${text}`);
	}
</script>

<div class="max-w-4xl mx-auto p-6">
	<h1 class="text-3xl font-bold mb-6">🧪 Stream Testing Tool</h1>
	
	<div class="bg-white rounded-lg shadow p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Test Stream URLs</h2>
		
		<div class="flex gap-4 mb-4">
			<input
				bind:value={streamId}
				placeholder="Enter Stream ID"
				class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			/>
			<button
				onclick={testStream}
				disabled={testing}
				class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{testing ? '🔄 Testing...' : '🧪 Run Tests'}
			</button>
		</div>

		{#if Object.keys(testResults).length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				<!-- Stream Status -->
				<div class="p-4 rounded-lg {testResults.streamExists ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
					<h3 class="font-semibold mb-2">📋 Stream Database</h3>
					<p class="text-sm">
						{testResults.streamExists ? '✅ Found' : '❌ Not Found'}
					</p>
					{#if testResults.streamData}
						<p class="text-xs text-gray-600 mt-1">
							Status: {testResults.streamData.status} | Title: {testResults.streamData.title}
						</p>
					{/if}
				</div>

				<!-- HLS API -->
				<div class="p-4 rounded-lg {testResults.hlsApi ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
					<h3 class="font-semibold mb-2">📺 HLS API</h3>
					<p class="text-sm">
						{testResults.hlsApi ? '✅ Working' : '❌ Failed'}
					</p>
					{#if testResults.hlsUrl}
						<button 
							onclick={() => copyToClipboard(testResults.hlsUrl)}
							class="text-xs text-blue-600 hover:text-blue-800 mt-1"
						>
							📋 Copy HLS URL
						</button>
					{/if}
				</div>

				<!-- Direct HLS -->
				<div class="p-4 rounded-lg {testResults.hlsUrlAccessible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
					<h3 class="font-semibold mb-2">🔗 Direct HLS URL</h3>
					<p class="text-sm">
						{testResults.hlsUrlAccessible ? '✅ Accessible' : '❌ Not Accessible'}
					</p>
				</div>

				<!-- Embedding Page -->
				<div class="p-4 rounded-lg {testResults.embedPageAccessible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
					<h3 class="font-semibold mb-2">🌐 Embedding Page</h3>
					<p class="text-sm">
						{testResults.embedPageAccessible ? '✅ Accessible' : '❌ Not Accessible'}
					</p>
					{#if testResults.embedPageAccessible}
						<button 
							onclick={() => copyToClipboard(`${window.location.origin}/hls/${streamId}`)}
							class="text-xs text-blue-600 hover:text-blue-800 mt-1"
						>
							📋 Copy Embed URL
						</button>
					{/if}
				</div>

				<!-- WHEP API -->
				<div class="p-4 rounded-lg {testResults.whepApi ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
					<h3 class="font-semibold mb-2">🎯 WHEP API</h3>
					<p class="text-sm">
						{testResults.whepApi ? '✅ Working' : '❌ Failed'}
					</p>
					{#if testResults.whepUrl}
						<button 
							onclick={() => copyToClipboard(testResults.whepUrl)}
							class="text-xs text-blue-600 hover:text-blue-800 mt-1"
						>
							📋 Copy WHEP URL
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- OBS Instructions -->
	{#if testResults.hlsUrl || testResults.embedPageAccessible}
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
			<h2 class="text-xl font-semibold mb-4">🎬 OBS Setup Instructions</h2>
			
			{#if testResults.hlsUrl}
				<div class="mb-4">
					<h3 class="font-semibold text-green-700 mb-2">✅ Option 1: Media Source (Recommended)</h3>
					<ol class="list-decimal list-inside text-sm space-y-1 ml-4">
						<li>Add → Media Source</li>
						<li>Uncheck "Local File"</li>
						<li>Input: <code class="bg-gray-100 px-2 py-1 rounded text-xs">{testResults.hlsUrl}</code></li>
						<li>Check "Restart playback when source becomes active"</li>
					</ol>
				</div>
			{/if}

			{#if testResults.embedPageAccessible}
				<div class="mb-4">
					<h3 class="font-semibold text-blue-700 mb-2">✅ Option 2: Browser Source</h3>
					<ol class="list-decimal list-inside text-sm space-y-1 ml-4">
						<li>Add → Browser Source</li>
						<li>URL: <code class="bg-gray-100 px-2 py-1 rounded text-xs">{window.location.origin}/hls/{streamId}</code></li>
						<li>Width: 1920, Height: 1080</li>
						<li>Check "Control audio via OBS"</li>
					</ol>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Logs -->
	{#if logs.length > 0}
		<div class="bg-gray-50 rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-4">📝 Test Logs</h2>
			<div class="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
				{#each logs as log}
					<div>{log}</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	code {
		word-break: break-all;
	}
</style>
