<script lang="ts">
	import type { PageData } from './$types';
	import BrowserStreamer from '$lib/components/BrowserStreamer.svelte';
	import { Copy, Check, ExternalLink } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let isStreaming = $state(false);
	let copiedHls = $state(false);

	// Generate HLS playback URL for OBS
	const hlsUrl = `https://customer-${data.stream.cloudflareInputId.split('-')[0]}.cloudflarestream.com/${data.stream.cloudflareInputId}/manifest/video.m3u8`;

	async function copyHlsUrl() {
		try {
			await navigator.clipboard.writeText(hlsUrl);
			copiedHls = true;
			setTimeout(() => (copiedHls = false), 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
			alert('Failed to copy URL. Please copy manually.');
		}
	}

	function handleStreamStart() {
		isStreaming = true;
		console.log('🔴 [MOBILE] Stream started');
	}

	function handleStreamStop() {
		isStreaming = false;
		console.log('⏹️ [MOBILE] Stream stopped');
	}
</script>

<svelte:head>
	<title>Mobile Stream - {data.stream.title} | TributeStream</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

<div class="mobile-stream-page">
	<div class="container">
		<!-- Header -->
		<div class="header">
			<div class="header-content">
				<h1>📱 Mobile Camera</h1>
				{#if data.memorial}
					<p class="memorial-info">
						Streaming for <strong>{data.memorial.lovedOneName}</strong>
					</p>
				{/if}
				<p class="stream-title">{data.stream.title}</p>
			</div>
		</div>

		<!-- Streaming Component -->
		<div class="streamer-section">
			<BrowserStreamer
				streamId={data.stream.id}
				whipUrl={data.stream.whipUrl}
				onStreamStart={handleStreamStart}
				onStreamStop={handleStreamStop}
			/>
		</div>

		<!-- OBS Integration Instructions -->
		<div class="obs-section">
			<div class="obs-header">
				<h2>📹 Add to OBS</h2>
				{#if isStreaming}
					<span class="badge badge-live">LIVE</span>
				{:else}
					<span class="badge badge-idle">NOT STREAMING</span>
				{/if}
			</div>

			<p class="obs-description">
				Copy this URL and add it as a <strong>Media Source</strong> in OBS Studio to display this camera feed.
			</p>

			<div class="url-box">
				<label for="hls-url" class="url-label">HLS Playback URL</label>
				<div class="url-input-group">
					<input
						id="hls-url"
						type="text"
						readonly
						value={hlsUrl}
						class="url-input"
						onclick={(e) => e.currentTarget.select()}
					/>
					<button
						class="copy-btn"
						onclick={copyHlsUrl}
						title="Copy HLS URL"
					>
						{#if copiedHls}
							<Check class="icon" />
							Copied!
						{:else}
							<Copy class="icon" />
							Copy
						{/if}
					</button>
				</div>
			</div>

			<!-- OBS Instructions -->
			<details class="obs-instructions">
				<summary>📖 How to add to OBS</summary>
				<ol>
					<li>Open OBS Studio on your computer</li>
					<li>Click <strong>+</strong> in the Sources panel</li>
					<li>Select <strong>Media Source</strong></li>
					<li>Name it (e.g., "Mobile Camera")</li>
					<li>Paste the HLS URL above into the <strong>Input</strong> field</li>
					<li>Check <strong>"Restart playback when source becomes active"</strong></li>
					<li>Click OK</li>
					<li>Your phone camera will appear in OBS! 📱→🖥️</li>
				</ol>
			</details>

			{#if data.memorial?.fullSlug}
				<div class="memorial-link">
					<a
						href="/{data.memorial.fullSlug}"
						target="_blank"
						class="link-btn"
					>
						<ExternalLink class="icon" />
						View Memorial Page
					</a>
				</div>
			{/if}
		</div>

		<!-- Tips -->
		<div class="tips-section">
			<h3>💡 Tips</h3>
			<ul>
				<li><strong>Keep your phone plugged in</strong> - Streaming drains battery quickly</li>
				<li><strong>Use WiFi if possible</strong> - More stable than cellular</li>
				<li><strong>Keep the app open</strong> - Don't minimize or switch tabs</li>
				<li><strong>Landscape mode</strong> - Rotate phone sideways for better composition</li>
				<li><strong>Test first</strong> - Start streaming and check OBS before the service</li>
			</ul>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		background: #f5f5f5;
	}

	.mobile-stream-page {
		min-height: 100vh;
		padding: 1rem;
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
	}

	.header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 2rem;
		border-radius: 12px;
		margin-bottom: 1.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.header-content h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
	}

	.memorial-info {
		margin: 0.5rem 0;
		opacity: 0.95;
		font-size: 1rem;
	}

	.stream-title {
		margin: 0.25rem 0 0 0;
		opacity: 0.9;
		font-size: 0.9rem;
	}

	.streamer-section {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		margin-bottom: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.obs-section {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		margin-bottom: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.obs-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.obs-header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.badge-live {
		background: #dc3545;
		color: white;
		animation: pulse 2s ease-in-out infinite;
	}

	.badge-idle {
		background: #6c757d;
		color: white;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	.obs-description {
		color: #666;
		margin-bottom: 1rem;
		line-height: 1.5;
	}

	.url-box {
		margin-bottom: 1rem;
	}

	.url-label {
		display: block;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #333;
	}

	.url-input-group {
		display: flex;
		gap: 0.5rem;
	}

	.url-input {
		flex: 1;
		padding: 0.75rem;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
		background: #f8f9fa;
	}

	.url-input:focus {
		outline: none;
		border-color: #667eea;
	}

	.copy-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.copy-btn:hover {
		background: #5568d3;
		transform: translateY(-1px);
	}

	.copy-btn:active {
		transform: translateY(0);
	}

	.icon {
		width: 1rem;
		height: 1rem;
	}

	.obs-instructions {
		margin-top: 1.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		padding: 1rem;
	}

	.obs-instructions summary {
		cursor: pointer;
		font-weight: 600;
		color: #667eea;
		user-select: none;
	}

	.obs-instructions summary:hover {
		color: #5568d3;
	}

	.obs-instructions ol {
		margin: 1rem 0 0 0;
		padding-left: 1.5rem;
	}

	.obs-instructions li {
		margin: 0.5rem 0;
		line-height: 1.5;
	}

	.memorial-link {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e0e0e0;
	}

	.link-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #D5BA7F;
		color: white;
		text-decoration: none;
		border-radius: 6px;
		font-weight: 600;
		transition: all 0.2s;
	}

	.link-btn:hover {
		background: #C5AA6F;
		transform: translateY(-1px);
	}

	.tips-section {
		background: #fffbf5;
		border: 2px solid #D5BA7F;
		padding: 1.5rem;
		border-radius: 12px;
	}

	.tips-section h3 {
		margin: 0 0 1rem 0;
		color: #8B7355;
	}

	.tips-section ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.tips-section li {
		margin: 0.75rem 0;
		color: #5a4a3a;
		line-height: 1.5;
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.mobile-stream-page {
			padding: 0.5rem;
		}

		.header-content h1 {
			font-size: 1.5rem;
		}

		.url-input-group {
			flex-direction: column;
		}

		.copy-btn {
			justify-content: center;
		}
	}
</style>
