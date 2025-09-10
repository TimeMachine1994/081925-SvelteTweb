<script lang="ts">
	import { Video, Copy, Check, Info } from 'lucide-svelte';

	let { data } = $props();
	const { memorial } = data;

	let streamKeyCopied = $state(false);
	let serverUrlCopied = $state(false);

	function copyToClipboard(text: string, type: 'key' | 'url') {
		if (type === 'key') {
			streamKeyCopied = true;
			setTimeout(() => (streamKeyCopied = false), 2000);
		} else {
			serverUrlCopied = true;
			setTimeout(() => (serverUrlCopied = false), 2000);
		}
		nnavigator.clipboard.writeText(text);
	}

	const rtmpsUrl = memorial.livestream?.rtmps?.url || 'rtmps://live.cloudflare.com:443/live/';
	const streamKey = memorial.livestream?.streamKey || '';
	const serverUrl = rtmpsUrl.replace('{STREAM_KEY}', '');
</script>

<svelte:head>
	<title>Start Stream - {memorial.lovedOneName}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="mb-12">
			<a href="/profile" class="text-blue-400 hover:text-blue-300 transition-colors">&larr; Back to Profile</a>
			<h1 class="text-4xl font-bold mt-4">Livestream Control Center</h1>
			<p class="text-lg text-gray-400">{memorial.lovedOneName}</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Left Column: Stream Preview -->
			<div class="lg:col-span-2 bg-black rounded-2xl shadow-2xl overflow-hidden border border-blue-500/30">
				{#if memorial.livestream?.playback?.hls}
					<iframe
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
						<label class="block text-sm font-medium text-gray-400 mb-2">Server URL</label>
						<div class="flex items-center bg-gray-900 rounded-lg">
							<input type="text" readonly value={serverUrl} class="w-full bg-transparent p-3 focus:outline-none" />
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
						<label class="block text-sm font-medium text-gray-400 mb-2">Stream Key</label>
						<div class="flex items-center bg-gray-900 rounded-lg">
							<input type="password" readonly value={streamKey} class="w-full bg-transparent p-3 focus:outline-none" />
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
			</div>
		</div>
	</div>
</div>
