<script lang="ts">
	import {
		Calendar,
		Users,
		Settings,
		Trash2,
		Copy,
		Check,
		Key,
		Radio,
		Eye,
		EyeOff,
		Circle,
		Camera
	} from 'lucide-svelte';
	import type { Stream } from '$lib/types/stream';
	import BrowserStreamer from './BrowserStreamer.svelte';

	type Props = {
		stream: Stream;
		onToggleVisibility: (streamId: string, currentVisibility: boolean) => Promise<void>;
		onDelete: (streamId: string) => Promise<void>;
		onCopy: (text: string, type: 'key' | 'url', streamId: string) => Promise<void>;
		copiedStreamKey: string | null;
		copiedRtmpUrl: string | null;
	};

	let { stream, onToggleVisibility, onDelete, onCopy, copiedStreamKey, copiedRtmpUrl } =
		$props<Props>();

	// Embed URL state
	let copiedEmbedUrl = $state(false);
	let embedUrl = $state<string | null>(null);
	let loadingEmbedUrl = $state(false);

	// WHIP streaming state
	let showBrowserStreamer = $state(false);

	function toggleBrowserStreamer() {
		showBrowserStreamer = !showBrowserStreamer;
	}

	function handleStreamStart() {
		console.log('🎬 [STREAM_CARD] Browser stream started for:', stream.id);
		// The polling system will automatically detect the stream is live
	}

	function handleStreamEnd() {
		console.log('🎬 [STREAM_CARD] Browser stream ended for:', stream.id);
		showBrowserStreamer = false;
		// The polling system will automatically detect the stream ended
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'live':
				return 'text-red-600 bg-red-100';
			case 'ready':
				return 'text-green-600 bg-green-100';
			case 'scheduled':
				return 'text-blue-600 bg-blue-100';
			case 'completed':
				return 'text-gray-600 bg-gray-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	}

	function getStatusText(status: string) {
		switch (status) {
			case 'live':
				return 'LIVE';
			case 'ready':
				return 'Ready';
			case 'scheduled':
				return 'Scheduled';
			case 'completed':
				return 'Completed';
			default:
				return 'Unknown';
		}
	}

	async function fetchEmbedUrl() {
		if (!stream.id || loadingEmbedUrl) return;

		console.log('🔄 [STREAM_CARD] Fetching embed URL for stream:', stream.id);
		loadingEmbedUrl = true;
		try {
			const response = await fetch(`/api/streams/${stream.id}/embed`);
			console.log('📡 [STREAM_CARD] Embed API response status:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ [STREAM_CARD] API error:', response.status, errorText);
				return;
			}

			const data = await response.json();
			console.log('📋 [STREAM_CARD] Embed API response:', data);

			if (data.success) {
				embedUrl = data.embedUrl;
				console.log('✅ [STREAM_CARD] Embed URL set:', embedUrl);
			} else {
				console.error('❌ [STREAM_CARD] Failed to get embed URL:', data.error);
			}
		} catch (error) {
			console.error('❌ [STREAM_CARD] Error fetching embed URL:', error);
		} finally {
			loadingEmbedUrl = false;
		}
	}

	async function copyEmbedUrl() {
		if (!embedUrl) {
			await fetchEmbedUrl();
		}

		if (embedUrl) {
			await navigator.clipboard.writeText(embedUrl);
			copiedEmbedUrl = true;
			setTimeout(() => (copiedEmbedUrl = false), 2000);
		}
	}

	// Auto-fetch embed URL when stream goes live
	$effect(() => {
		console.log(
			'🔄 [STREAM_CARD] Effect triggered - stream status:',
			stream.status,
			'embedUrl:',
			!!embedUrl
		);
		if (stream.status === 'live') {
			if (!embedUrl) {
				console.log('🚀 [STREAM_CARD] Auto-fetching embed URL for live stream');
				fetchEmbedUrl();
			} else {
				console.log('✅ [STREAM_CARD] Embed URL already exists:', embedUrl);
			}
		}
	});
</script>

<div
	class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
>
	<!-- Stream Header -->
	<div class="border-b border-gray-100 p-6">
		<div class="mb-3 flex items-start justify-between">
			<div class="flex items-center gap-2">
				{#if stream.status === 'live'}
					<div class="relative flex items-center">
						<Radio class="h-5 w-5 animate-pulse text-red-600" />
						<span class="absolute inset-0 h-5 w-5 animate-ping rounded-full bg-red-600 opacity-20"
						></span>
					</div>
				{:else if stream.status === 'ready'}
					<div class="flex items-center">
						<Circle class="h-5 w-5 text-gray-400" />
					</div>
				{/if}
				<h3 class="truncate text-lg font-semibold text-gray-900">
					{stream.title}
				</h3>
			</div>
			<span class="rounded-full px-2 py-1 text-xs font-medium {getStatusColor(stream.status)}">
				{getStatusText(stream.status)}
			</span>
		</div>

		{#if stream.description}
			<p class="mb-3 text-sm text-gray-600">
				{stream.description}
			</p>
		{/if}

		<!-- Stream Info -->
		<div class="space-y-2 text-sm text-gray-500">
			{#if stream.scheduledStartTime}
				<div class="flex items-center">
					<Calendar class="mr-2 h-4 w-4" />
					{new Date(stream.scheduledStartTime).toLocaleDateString()}
				</div>
			{/if}

			{#if stream.viewerCount !== undefined}
				<div class="flex items-center">
					<Users class="mr-2 h-4 w-4" />
					{stream.viewerCount} viewers
				</div>
			{/if}
		</div>
	</div>

	<!-- Stream Credentials -->
	<div class="border-t border-gray-100 bg-gray-50 p-4">
		<!-- RTMP URL -->
		{#if stream.rtmpUrl}
			<div class="mb-3">
				<label class="mb-1 block text-xs font-medium text-gray-600">RTMP URL</label>
				<div class="flex items-center gap-2">
					<input
						type="text"
						value={stream.rtmpUrl}
						readonly
						class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-700"
					/>
					<button
						onclick={() => stream.rtmpUrl && onCopy(stream.rtmpUrl, 'url', stream.id)}
						class="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
						title="Copy RTMP URL"
					>
						{#if copiedRtmpUrl === stream.id}
							<Check class="h-4 w-4 text-green-600" />
						{:else}
							<Copy class="h-4 w-4" />
						{/if}
					</button>
				</div>
			</div>
		{/if}

		<!-- Stream Key -->
		{#if stream.streamKey}
			<div class="mb-3">
				<label class="mb-1 block text-xs font-medium text-gray-600">
					<Key class="mr-1 inline h-3 w-3" />
					Stream Key
				</label>
				<div class="flex items-center gap-2">
					<input
						type="password"
						value={stream.streamKey}
						readonly
						class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-700"
					/>
					<button
						onclick={() => stream.streamKey && onCopy(stream.streamKey, 'key', stream.id)}
						class="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
						title="Copy Stream Key"
					>
						{#if copiedStreamKey === stream.id}
							<Check class="h-4 w-4 text-green-600" />
						{:else}
							<Copy class="h-4 w-4" />
						{/if}
					</button>
				</div>
			</div>
		{/if}

		<!-- Stream Embed URL (only when live) -->
		{#if stream.status === 'live'}
			<div class="mb-3">
				<label class="mb-1 block text-xs font-medium text-gray-600">
					<Radio class="mr-1 inline h-3 w-3 text-blue-600" />
					Stream Embed URL
				</label>
				<div class="flex items-center gap-2">
					{#if embedUrl}
						<input
							type="text"
							value={embedUrl}
							readonly
							class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-700"
						/>
						<button
							onclick={copyEmbedUrl}
							class="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
							title="Copy Stream Embed URL"
						>
							{#if copiedEmbedUrl}
								<Check class="h-4 w-4 text-green-600" />
							{:else}
								<Copy class="h-4 w-4" />
							{/if}
						</button>
					{:else}
						<div
							class="flex-1 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500 italic"
						>
							{loadingEmbedUrl ? 'Generating URL...' : 'Click to generate embed URL'}
						</div>
						<button
							onclick={fetchEmbedUrl}
							disabled={loadingEmbedUrl}
							class="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-900 disabled:opacity-50"
							title="Generate Stream Embed URL"
						>
							<Radio class="h-4 w-4" />
						</button>
					{/if}
				</div>
				<p class="mt-1 text-xs text-gray-500">
					Cloudflare Stream embed script URL. Use as iframe src or script src for embedding.
				</p>
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="flex items-center justify-end gap-1">
			<!-- WHIP Browser Streaming (only for ready/scheduled streams) -->
			{#if stream.status === 'ready' || stream.status === 'scheduled'}
				<button
					onclick={toggleBrowserStreamer}
					class="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-900"
					title="Stream from Browser"
				>
					<Camera class="h-4 w-4" />
				</button>
			{/if}

			<!-- DEBUG: Manual Embed URL Test -->
			<button
				onclick={fetchEmbedUrl}
				class="rounded-lg p-2 text-purple-600 transition-colors hover:bg-purple-50 hover:text-purple-900"
				title="DEBUG: Test Embed URL"
			>
				<Radio class="h-4 w-4" />
			</button>

			<!-- Visibility Toggle -->
			<button
				onclick={() => onToggleVisibility(stream.id, stream.isVisible)}
				class="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
				title={stream.isVisible ? 'Hide from public' : 'Show to public'}
			>
				{#if stream.isVisible}
					<Eye class="h-4 w-4" />
				{:else}
					<EyeOff class="h-4 w-4" />
				{/if}
			</button>

			<!-- Settings -->
			<button
				class="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
				title="Stream settings"
			>
				<Settings class="h-4 w-4" />
			</button>

			<!-- Delete -->
			<button
				onclick={() => onDelete(stream.id)}
				class="rounded-lg p-2 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
				title="Delete stream"
			>
				<Trash2 class="h-4 w-4" />
			</button>
		</div>
	</div>

	<!-- Browser Streamer Component -->
	{#if showBrowserStreamer}
		<div class="border-t border-gray-100 p-6">
			<BrowserStreamer
				streamId={stream.id}
				streamTitle={stream.title}
				onStreamStart={handleStreamStart}
				onStreamEnd={handleStreamEnd}
			/>
		</div>
	{/if}
</div>
