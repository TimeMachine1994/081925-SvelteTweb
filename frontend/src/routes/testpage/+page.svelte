<script lang="ts">
	let output = '';
	let streamId = '';
	let uploadUrl = '';
	let workerUrl = 'https://mux-bridge-worker.austinbryanfilm.workers.dev';

	function log(message: string) {
		const time = new Date().toLocaleTimeString();
		output += `[${time}] ${message}\n`;
	}

	async function testWorkerConnection() {
		output = '';
		log('🔍 Testing Cloudflare Worker connection...');
		log(`Worker URL: ${workerUrl}`);

		try {
			const response = await fetch(workerUrl);
			log(`✅ Worker responds: ${response.status}`);
			const text = await response.text();
			log(`Response: ${text}`);
		} catch (error) {
			log(`❌ Worker connection failed: ${error.message}`);
		}
	}

	async function testDirectWorkerUpload() {
		output = '';
		log('🧪 Testing MUX Direct Upload creation via Worker...');

		try {
			// Call Worker directly to create upload
			const response = await fetch(`${workerUrl}/test-upload`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			log(`Response status: ${response.status}`);
			const data = await response.json();
			log(`Response data: ${JSON.stringify(data, null, 2)}`);

			if (data.uploadUrl) {
				uploadUrl = data.uploadUrl;
				log(`✅ Upload URL created: ${uploadUrl.slice(0, 50)}...`);
			}
		} catch (error) {
			log(`❌ Test failed: ${error.message}`);
		}
	}

	async function startMinimalTest() {
		output = '';
		log('🚀 Starting minimal bridge test...');
		
		if (!streamId) {
			log('❌ Please enter a Cloudflare Stream ID');
			return;
		}

		const hlsUrl = `https://customer-dyz4fsbg86xy3krn.cloudflarestream.com/${streamId}/manifest/video.m3u8`;
		log(`📥 HLS URL: ${hlsUrl}`);

		try {
			// Test 1: Check HLS accessibility
			log('\n1️⃣ Testing HLS accessibility...');
			const hlsResponse = await fetch(hlsUrl);
			log(`HLS Status: ${hlsResponse.status}`);
			
			if (hlsResponse.status === 204 || hlsResponse.ok) {
				log('✅ HLS is accessible');
			} else {
				log('❌ HLS not accessible');
				return;
			}

			// Test 2: Start bridge via Vercel API
			log('\n2️⃣ Starting bridge via Vercel API...');
			const bridgeResponse = await fetch('/api/bridge/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					streamId: streamId,
					inputUrl: hlsUrl
				})
			});

			log(`Bridge API Status: ${bridgeResponse.status}`);
			const bridgeData = await bridgeResponse.json();
			log(`Bridge Response: ${JSON.stringify(bridgeData, null, 2)}`);

			if (bridgeResponse.ok) {
				log('✅ Bridge started via Vercel API');

				// Test 3: Check Worker directly
				log('\n3️⃣ Checking Worker status directly...');
				const workerResponse = await fetch(`${workerUrl}/bridge/status/${streamId}`);
				log(`Worker Status: ${workerResponse.status}`);
				
				if (workerResponse.ok) {
					const workerData = await workerResponse.json();
					log(`Worker Data: ${JSON.stringify(workerData, null, 2)}`);
				} else {
					const errorText = await workerResponse.text();
					log(`Worker Error: ${errorText}`);
				}
			} else {
				log('❌ Bridge start failed via Vercel API');
			}

		} catch (error) {
			log(`❌ Test error: ${error.message}`);
			log(`Stack: ${error.stack}`);
		}
	}

	async function checkWorkerLogs() {
		output = '';
		log('📊 Checking Worker status...');

		try {
			const response = await fetch(`${workerUrl}/bridge/status/${streamId}`);
			log(`Status: ${response.status}`);
			
			if (response.ok) {
				const data = await response.json();
				log(`Worker Status:\n${JSON.stringify(data, null, 2)}`);
			} else {
				const text = await response.text();
				log(`Error: ${text}`);
			}
		} catch (error) {
			log(`❌ Failed: ${error.message}`);
		}
	}

	async function testMuxCredentials() {
		output = '';
		log('🔑 Testing MUX API credentials...');

		try {
			const response = await fetch('/api/mux/test-credentials');
			log(`Status: ${response.status}`);
			const data = await response.json();
			log(`Result: ${JSON.stringify(data, null, 2)}`);
		} catch (error) {
			log(`❌ Failed: ${error.message}`);
		}
	}
</script>

<div class="min-h-screen bg-gray-100 p-8">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<h1 class="text-3xl font-bold mb-2">🔧 Bridge Debug Page</h1>
			<p class="text-gray-600">Minimal testing interface to diagnose Worker issues</p>
		</div>

		<!-- Quick Tests -->
		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<h2 class="text-xl font-bold mb-4">Quick Tests</h2>
			<div class="space-y-3">
				<button
					on:click={testWorkerConnection}
					class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
				>
					1. Test Worker Connection
				</button>

				<button
					on:click={testDirectWorkerUpload}
					class="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
				>
					2. Test Direct Upload Creation
				</button>

				<button
					on:click={testMuxCredentials}
					class="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
				>
					3. Test MUX Credentials
				</button>
			</div>
		</div>

		<!-- Full Bridge Test -->
		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<h2 class="text-xl font-bold mb-4">Full Bridge Test</h2>
			
			<div class="mb-4">
				<label for="streamId" class="block text-sm font-medium mb-2">Cloudflare Stream ID</label>
				<input
					id="streamId"
					bind:value={streamId}
					type="text"
					placeholder="Enter stream ID from WHIP..."
					class="w-full px-3 py-2 border rounded"
				/>
				<p class="text-xs text-gray-500 mt-1">Get this from the WHIP response URL</p>
			</div>

			<div class="space-y-3">
				<button
					on:click={startMinimalTest}
					disabled={!streamId}
					class="w-full px-4 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-300 font-semibold"
				>
					▶️ Start Full Bridge Test
				</button>

				<button
					on:click={checkWorkerLogs}
					disabled={!streamId}
					class="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300"
				>
					📊 Check Worker Status
				</button>
			</div>
		</div>

		<!-- Output Console -->
		<div class="bg-gray-900 rounded-lg shadow p-6">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-xl font-bold text-white">Console Output</h2>
				<button
					on:click={() => output = ''}
					class="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
				>
					Clear
				</button>
			</div>
			<pre class="bg-black rounded p-4 text-green-400 font-mono text-sm h-96 overflow-auto whitespace-pre-wrap">{output || 'Click a test button to see output...'}</pre>
		</div>

		<!-- Instructions -->
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
			<h3 class="font-bold text-yellow-900 mb-2">📋 Testing Instructions:</h3>
			<ol class="list-decimal list-inside space-y-2 text-sm text-yellow-800">
				<li>First, click "Test Worker Connection" to verify the Worker is accessible</li>
				<li>Click "Test Direct Upload Creation" to verify MUX credentials work</li>
				<li>Start a WHIP stream (use /test/bridge or mobile app)</li>
				<li>Copy the Stream ID from the WHIP response</li>
				<li>Paste it above and click "Start Full Bridge Test"</li>
				<li>Watch the console for detailed output</li>
			</ol>
		</div>
	</div>
</div>
