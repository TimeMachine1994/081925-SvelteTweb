<script lang="ts">
	import { Calendar, Users, Settings, Trash2, Copy, Check, Key, Radio, Eye, EyeOff, Circle, Camera } from 'lucide-svelte';
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

	let { 
		stream, 
		onToggleVisibility, 
		onDelete, 
		onCopy, 
		copiedStreamKey, 
		copiedRtmpUrl 
	} = $props<Props>();

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
			case 'live': return 'text-red-600 bg-red-100';
			case 'ready': return 'text-green-600 bg-green-100';
			case 'scheduled': return 'text-blue-600 bg-blue-100';
			case 'completed': return 'text-gray-600 bg-gray-100';
			default: return 'text-gray-600 bg-gray-100';
		}
	}

	function getStatusText(status: string) {
		switch (status) {
			case 'live': return 'LIVE';
			case 'ready': return 'Ready';
			case 'scheduled': return 'Scheduled';
			case 'completed': return 'Completed';
			default: return 'Unknown';
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
			setTimeout(() => copiedEmbedUrl = false, 2000);
		}
	}

	// Auto-fetch embed URL when stream goes live
	$effect(() => {
		console.log('🔄 [STREAM_CARD] Effect triggered - stream status:', stream.status, 'embedUrl:', !!embedUrl);
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

<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
	<!-- Stream Header -->
	<div class="p-6 border-b border-gray-100">
		<div class="flex items-start justify-between mb-3">
			<div class="flex items-center gap-2">
				{#if stream.status === 'live'}
					<div class="relative flex items-center">
						<Radio class="w-5 h-5 text-red-600 animate-pulse" />
						<span class="absolute inset-0 w-5 h-5 bg-red-600 rounded-full opacity-20 animate-ping"></span>
					</div>
				{:else if stream.status === 'ready'}
					<div class="flex items-center">
						<Circle class="w-5 h-5 text-gray-400" />
					</div>
				{/if}
				<h3 class="text-lg font-semibold text-gray-900 truncate">
					{stream.title}
				</h3>
			</div>
			<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(stream.status)}">
				{getStatusText(stream.status)}
			</span>
		</div>

		{#if stream.description}
			<p class="text-sm text-gray-600 mb-3">
				{stream.description}
			</p>
		{/if}

		<!-- Stream Info -->
		<div class="space-y-2 text-sm text-gray-500">
			{#if stream.scheduledStartTime}
				<div class="flex items-center">
					<Calendar class="w-4 h-4 mr-2" />
					{new Date(stream.scheduledStartTime).toLocaleDateString()}
				</div>
			{/if}
			
			{#if stream.viewerCount !== undefined}
				<div class="flex items-center">
					<Users class="w-4 h-4 mr-2" />
					{stream.viewerCount} viewers
				</div>
			{/if}
		</div>
	</div>

	<!-- Stream Credentials -->
	<div class="p-4 bg-gray-50 border-t border-gray-100">
		<!-- RTMP URL -->
		{#if stream.rtmpUrl}
			<div class="mb-3">
				<label class="block text-xs font-medium text-gray-600 mb-1">RTMP URL</label>
				<div class="flex items-center gap-2">
					<input
						type="text"
						value={stream.rtmpUrl}
						readonly
						class="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg font-mono text-gray-700"
					/>
					<button
						onclick={() => stream.rtmpUrl && onCopy(stream.rtmpUrl, 'url', stream.id)}
						class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
						title="Copy RTMP URL"
					>
						{#if copiedRtmpUrl === stream.id}
							<Check class="w-4 h-4 text-green-600" />
						{:else}
							<Copy class="w-4 h-4" />
						{/if}
					</button>
				</div>
			</div>
		{/if}

		<!-- Stream Key -->
		{#if stream.streamKey}
			<div class="mb-3">
				<label class="block text-xs font-medium text-gray-600 mb-1">
					<Key class="w-3 h-3 inline mr-1" />
					Stream Key
				</label>
				<div class="flex items-center gap-2">
					<input
						type="password"
						value={stream.streamKey}
						readonly
						class="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg font-mono text-gray-700"
					/>
					<button
						onclick={() => stream.streamKey && onCopy(stream.streamKey, 'key', stream.id)}
						class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
						title="Copy Stream Key"
					>
						{#if copiedStreamKey === stream.id}
							<Check class="w-4 h-4 text-green-600" />
						{:else}
							<Copy class="w-4 h-4" />
						{/if}
					</button>
				</div>
			</div>
		{/if}

		<!-- Stream Embed URL (only when live) -->
		{#if stream.status === 'live'}
			<div class="mb-3">
				<label class="block text-xs font-medium text-gray-600 mb-1">
					<Radio class="w-3 h-3 inline mr-1 text-blue-600" />
					Stream Embed URL
				</label>
				<div class="flex items-center gap-2">
					{#if embedUrl}
						<input
							type="text"
							value={embedUrl}
							readonly
							class="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg font-mono text-gray-700"
						/>
						<button
							onclick={copyEmbedUrl}
							class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
							title="Copy Stream Embed URL"
						>
							{#if copiedEmbedUrl}
								<Check class="w-4 h-4 text-green-600" />
							{:else}
								<Copy class="w-4 h-4" />
							{/if}
						</button>
					{:else}
						<div class="flex-1 px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg text-gray-500 italic">
							{loadingEmbedUrl ? 'Generating URL...' : 'Click to generate embed URL'}
						</div>
						<button
							onclick={fetchEmbedUrl}
							disabled={loadingEmbedUrl}
							class="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
							title="Generate Stream Embed URL"
						>
							<Radio class="w-4 h-4" />
						</button>
					{/if}
				</div>
				<p class="text-xs text-gray-500 mt-1">
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
					class="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
					title="Stream from Browser"
				>
					<Camera class="w-4 h-4" />
				</button>
			{/if}
			
			<!-- DEBUG: Manual Embed URL Test -->
			<button
				onclick={fetchEmbedUrl}
				class="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors"
				title="DEBUG: Test Embed URL"
			>
				<Radio class="w-4 h-4" />
			</button>
			
			<!-- Visibility Toggle -->
			<button
				onclick={() => onToggleVisibility(stream.id, stream.isVisible)}
				class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
				title={stream.isVisible ? 'Hide from public' : 'Show to public'}
			>
				{#if stream.isVisible}
					<Eye class="w-4 h-4" />
				{:else}
					<EyeOff class="w-4 h-4" />
				{/if}
			</button>

			<!-- Settings -->
			<button
				class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
				title="Stream settings"
			>
				<Settings class="w-4 h-4" />
			</button>

			<!-- Delete -->
			<button
				onclick={() => onDelete(stream.id)}
				class="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
				title="Delete stream"
			>
				<Trash2 class="w-4 h-4" />
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
