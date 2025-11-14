<script lang="ts">
	import type { PageData } from './$types';
	import BrowserStreamer from '$lib/components/BrowserStreamer.svelte';
	import { Copy, Check, ExternalLink } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let isStreaming = $state(false);
	let copiedWhep = $state(false);
	let copiedIframe = $state(false);

	// Cloudflare Stream URLs for OBS
	// WHEP URL - WebRTC playback for live streams (BEST for live)
	const whepUrl = data.stream.whepUrl || `https://customer-${data.stream.cloudflareInputId?.split('-')[0]}.cloudflarestream.com/${data.stream.cloudflareInputId}/webrtc/play`;
	
	// Iframe URL - For recorded playback (may not work during live streaming)
	const iframeUrl = `https://iframe.cloudflarestream.com/${data.stream.cloudflareInputId}`;

	async function copyWhepUrl() {
		try {
			await navigator.clipboard.writeText(whepUrl);
			copiedWhep = true;
			setTimeout(() => (copiedWhep = false), 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
			alert('Failed to copy URL. Please copy manually.');
		}
	}

	async function copyIframeUrl() {
		try {
			await navigator.clipboard.writeText(iframeUrl);
			copiedIframe = true;
			setTimeout(() => (copiedIframe = false), 2000);
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
				Copy this URL and use it with <strong>VLC Media Source</strong> or a <strong>WebRTC-capable player</strong> in OBS.
			</p>

			<!-- Recommended: WHEP URL for live streaming -->
			<div class="url-box recommended">
				<div class="url-header">
					<label for="whep-url" class="url-label">✅ WebRTC Playback URL (For Live Streaming)</label>
					<span class="badge-small">LIVE</span>
				</div>
				<div class="url-input-group">
					<input
						id="whep-url"
						type="text"
						readonly
						value={whepUrl}
						class="url-input"
						onclick={(e) => e.currentTarget.select()}
					/>
					<button
						class="copy-btn copy-btn-primary"
						onclick={copyWhepUrl}
						title="Copy WHEP URL"
					>
						{#if copiedWhep}
							<Check class="icon" />
							Copied!
						{:else}
							<Copy class="icon" />
							Copy
						{/if}
					</button>
				</div>
				<p class="url-hint">⚠️ <strong>Note:</strong> OBS doesn't natively support WHEP. You'll need to use VLC Media Source or wait for the recording to be ready for iframe playback.</p>
			</div>

			<!-- Alternative: Iframe URL (for recorded playback) -->
			<div class="url-box">
				<label for="iframe-url" class="url-label">Browser Source URL (After Recording)</label>
				<div class="url-input-group">
					<input
						id="iframe-url"
						type="text"
						readonly
						value={iframeUrl}
						class="url-input"
						onclick={(e) => e.currentTarget.select()}
					/>
					<button
						class="copy-btn"
						onclick={copyIframeUrl}
						title="Copy Iframe URL"
					>
						{#if copiedIframe}
							<Check class="icon" />
							Copied!
						{:else}
							<Copy class="icon" />
							Copy
						{/if}
					</button>
				</div>
				<p class="url-hint">This URL works in <strong>Browser Source</strong> but only after the stream is recorded (not during live streaming)</p>
			</div>

			<!-- OBS Instructions -->
			<details class="obs-instructions">
				<summary>⚠️ Important: OBS Limitations for Live Streaming</summary>
				
				<div class="warning-box">
					<p><strong>⚠️ Known Issue:</strong> Cloudflare Live Inputs don't provide immediate OBS-compatible playback URLs during live streaming.</p>
					
					<p><strong>The Problem:</strong></p>
					<ul>
						<li>WHEP URL requires WebRTC support (OBS doesn't have this natively)</li>
						<li>Iframe/HLS URLs only work AFTER the stream is recorded</li>
						<li>There's no real-time playback URL that OBS can use directly</li>
					</ul>

					<p><strong>Workarounds:</strong></p>
					<ol>
						<li><strong>Wait for Recording:</strong> After streaming ends, the iframe URL will work in Browser Source</li>
						<li><strong>Use WHEPClient Plugin:</strong> Install an OBS plugin that supports WHEP protocol</li>
						<li><strong>Use Different Tool:</strong> Consider using a tool that supports WebRTC playback (like VLC or browser-based solutions)</li>
					</ol>

					<p><strong>Best Solution:</strong> For now, mobile camera streaming is best used for <em>recording</em> rather than real-time OBS mixing. The recording will be available via the iframe URL once streaming completes.</p>
				</div>
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
		margin-bottom: 1.5rem;
		padding: 1rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background: #fafafa;
	}

	.url-box.recommended {
		border-color: #667eea;
		background: #f0f4ff;
	}

	.url-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.url-label {
		display: block;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #333;
	}

	.badge-small {
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		font-size: 0.65rem;
		font-weight: 600;
		background: #28a745;
		color: white;
		text-transform: uppercase;
	}

	.url-hint {
		margin-top: 0.5rem;
		font-size: 0.8rem;
		color: #666;
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

	.copy-btn-primary {
		background: #28a745;
	}

	.copy-btn-primary:hover {
		background: #218838;
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

	.warning-box {
		padding: 1.5rem;
		background: #fff3cd;
		border: 2px solid #ffc107;
		border-radius: 8px;
		color: #856404;
	}

	.warning-box p {
		margin: 0 0 1rem 0;
	}

	.warning-box p:last-child {
		margin-bottom: 0;
	}

	.warning-box ul,
	.warning-box ol {
		margin: 0.5rem 0 1rem 1.5rem;
		padding: 0;
	}

	.warning-box li {
		margin: 0.25rem 0;
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
