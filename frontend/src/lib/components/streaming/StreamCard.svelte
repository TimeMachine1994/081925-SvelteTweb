<script lang="ts">
	import type { LiveStream } from '$lib/types/stream-v2';
	import { Video, Eye, EyeOff, Archive, StopCircle, Copy, Check } from 'lucide-svelte';
	import { onMount } from 'svelte';

	export let stream: LiveStream;
	export let canManage: boolean;
	export let memorialId: string;

	let loading = false;
	let copiedWhip = false;
	let copiedMux = false;

	// Status badge styling
	$: statusColor = {
		ready: 'bg-green-100 text-green-800',
		live: 'bg-red-100 text-red-800 animate-pulse',
		completed: 'bg-gray-100 text-gray-800',
		error: 'bg-red-100 text-red-800'
	}[stream.status];

	$: visibilityIcon = {
		public: Eye,
		hidden: EyeOff,
		archived: Archive
	}[stream.visibility];

	async function handleStop() {
		if (!confirm('Are you sure you want to stop this stream?')) return;

		loading = true;
		try {
			const response = await fetch(`/api/live-streams/${stream.id}/stop`, {
				method: 'POST'
			});

			if (response.ok) {
				window.location.reload();
			} else {
				alert('Failed to stop stream');
			}
		} catch (error) {
			console.error('Error stopping stream:', error);
			alert('Failed to stop stream');
		} finally {
			loading = false;
		}
	}

	async function handleVisibilityToggle() {
		const newVisibility =
			stream.visibility === 'public'
				? 'hidden'
				: stream.visibility === 'hidden'
					? 'archived'
					: 'public';

		loading = true;
		try {
			const response = await fetch(`/api/live-streams/${stream.id}/visibility`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ visibility: newVisibility })
			});

			if (response.ok) {
				window.location.reload();
			} else {
				alert('Failed to update visibility');
			}
		} catch (error) {
			console.error('Error updating visibility:', error);
			alert('Failed to update visibility');
		} finally {
			loading = false;
		}
	}

	async function copyToClipboard(text: string, type: 'whip' | 'mux') {
		try {
			await navigator.clipboard.writeText(text);
			if (type === 'whip') {
				copiedWhip = true;
				setTimeout(() => (copiedWhip = false), 2000);
			} else {
				copiedMux = true;
				setTimeout(() => (copiedMux = false), 2000);
			}
		} catch (error) {
			console.error('Failed to copy:', error);
		}
	}
</script>

<div
	class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg transition-all duration-300 hover:shadow-xl"
>
	<!-- Header -->
	<div class="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<div class="flex items-center gap-3">
					<h2 class="text-xl font-semibold text-gray-900">{stream.title}</h2>
					<span class="rounded-full px-3 py-1 text-xs font-medium {statusColor}">
						{stream.status.toUpperCase()}
					</span>
				</div>
				{#if stream.description}
					<p class="mt-1 text-sm text-gray-600">{stream.description}</p>
				{/if}
				<p class="mt-2 text-xs text-gray-500">
					Created {new Date(stream.createdAt).toLocaleDateString()}
				</p>
			</div>

			{#if canManage}
				<div class="flex items-center gap-2">
					<svelte:component
						this={visibilityIcon}
						class="h-5 w-5 {stream.visibility === 'public'
							? 'text-green-600'
							: 'text-gray-400'}"
					/>
				</div>
			{/if}
		</div>
	</div>

	<!-- Body -->
	<div class="p-6">
		<div class="space-y-4">
			<!-- WHIP URL (for broadcaster) -->
			{#if canManage && stream.status === 'ready'}
				<div class="rounded-lg bg-blue-50 p-4">
					<h3 class="mb-2 text-sm font-semibold text-blue-900">Browser Streaming URL (WHIP)</h3>
					<div class="flex items-center gap-2">
						<code class="flex-1 truncate rounded bg-white px-3 py-2 text-xs text-blue-800">
							{stream.cloudflare.whipUrl}
						</code>
						<button
							on:click={() => copyToClipboard(stream.cloudflare.whipUrl, 'whip')}
							class="rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700"
							title="Copy WHIP URL"
						>
							{#if copiedWhip}
								<Check class="h-4 w-4" />
							{:else}
								<Copy class="h-4 w-4" />
							{/if}
						</button>
					</div>
					<p class="mt-2 text-xs text-blue-700">
						Use this URL in a WHIP-compatible client or our publisher page to start streaming.
					</p>
				</div>
			{/if}

			<!-- Mux Playback (for viewers) -->
			{#if stream.mux.playbackId}
				<div class="rounded-lg bg-green-50 p-4">
					<h3 class="mb-2 text-sm font-semibold text-green-900">
						Viewer Playback {stream.status === 'completed' ? '(Recording)' : '(Live)'}
					</h3>
					<div class="flex items-center gap-2">
						<code class="flex-1 truncate rounded bg-white px-3 py-2 text-xs text-green-800">
							https://stream.mux.com/{stream.mux.playbackId}.m3u8
						</code>
						<button
							on:click={() =>
								copyToClipboard(`https://stream.mux.com/${stream.mux.playbackId}.m3u8`, 'mux')}
							class="rounded-lg bg-green-600 p-2 text-white transition-colors hover:bg-green-700"
							title="Copy playback URL"
						>
							{#if copiedMux}
								<Check class="h-4 w-4" />
							{:else}
								<Copy class="h-4 w-4" />
							{/if}
						</button>
					</div>
				</div>
			{/if}

			<!-- Status Info -->
			{#if stream.status === 'live'}
				<div class="rounded-lg bg-red-50 p-4">
					<p class="text-sm text-red-800">
						🔴 <strong>Live Now</strong> - Stream is currently broadcasting
					</p>
				</div>
			{:else if stream.status === 'completed' && stream.mux.assetId}
				<div class="rounded-lg bg-green-50 p-4">
					<p class="text-sm text-green-800">
						✅ <strong>Recording Available</strong> - Stream has been saved and is ready for playback
					</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Footer Actions -->
	{#if canManage}
		<div class="border-t border-gray-100 bg-gray-50 px-6 py-4">
			<div class="flex flex-wrap gap-3">
				{#if stream.status === 'ready'}
					<a
						href="/memorials/{memorialId}/streams/{stream.id}/publish"
						class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
					>
						<Video class="h-4 w-4" />
						Go Live
					</a>
				{/if}

				{#if stream.status === 'live'}
					<button
						on:click={handleStop}
						disabled={loading}
						class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
					>
						<StopCircle class="h-4 w-4" />
						Stop Stream
					</button>
				{/if}

				{#if stream.visibility !== 'archived'}
					<button
						on:click={handleVisibilityToggle}
						disabled={loading}
						class="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
					>
						<svelte:component this={visibilityIcon} class="h-4 w-4" />
						{stream.visibility === 'public' ? 'Hide' : stream.visibility === 'hidden' ? 'Archive' : 'Show'}
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
