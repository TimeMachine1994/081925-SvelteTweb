<script lang="ts">
	import { onMount } from 'svelte';

	let {
		memorialId,
		memorialName = 'Memorial Service',
		showTitle = true
	}: {
		memorialId: string;
		memorialName?: string;
		showTitle?: boolean;
	} = $props();

	// Simple state management using Svelte 5 runes
	let streams = $state<any[]>([]);
	let loading = $state(true);
	let error = $state('');

	console.log('📺 LivestreamControl initialized for memorial:', memorialId);

	onMount(() => {
		loadStreams();
	});

	async function loadStreams() {
		loading = true;
		error = '';
		try {
			// Use unified streams API with memorial filtering
			const response = await fetch(`/api/streams?memorialId=${memorialId}&limit=50`);
			if (response.ok) {
				const data = await response.json();
				// Unified API returns { streams: [...] } format
				streams = data.streams || [];
				console.log('📺 [LIVESTREAM_CONTROL] Loaded streams:', streams.length);
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to load streams';
				console.error('❌ [LIVESTREAM_CONTROL] API error:', errorData);
			}
		} catch (err) {
			error = 'Failed to load streams';
			console.error('❌ [LIVESTREAM_CONTROL] Network error:', err);
		} finally {
			loading = false;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'live': return 'text-red-600 bg-red-100';
			case 'ready': return 'text-blue-600 bg-blue-100';
			case 'scheduled': return 'text-yellow-600 bg-yellow-100';
			case 'completed': return 'text-green-600 bg-green-100';
			default: return 'text-gray-600 bg-gray-100';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'live': return '🔴';
			case 'ready': return '⏸️';
			case 'scheduled': return '📅';
			case 'completed': return '✅';
			default: return '⚪';
		}
	}

	function editStream(stream: any) {
		// Placeholder - does nothing for now
		console.log('Edit stream clicked:', stream.id);
	}
</script>

<div class="livestream-control">
	{#if showTitle}
		<div class="mb-6">
			<h2 class="text-2xl font-bold text-gray-900 mb-2">Livestreams</h2>
			<p class="text-gray-600">Streams for {memorialName}</p>
		</div>
	{/if}

	<!-- Error Display -->
	{#if error}
		<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
			<p class="text-red-800">{error}</p>
			<button 
				class="mt-2 text-sm text-red-600 hover:text-red-800"
				onclick={() => error = ''}
			>
				Dismiss
			</button>
		</div>
	{/if}

	<!-- Simple Stream List -->
	<div class="bg-white rounded-lg shadow-sm border">
		<div class="p-4 border-b">
			<h3 class="text-lg font-medium text-gray-900">Memorial Streams</h3>
		</div>

		{#if loading}
			<div class="p-8 text-center">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
				<p class="text-gray-600">Loading streams...</p>
			</div>
		{:else if streams.length === 0}
			<div class="p-8 text-center">
				<div class="text-6xl mb-4">📹</div>
				<h3 class="text-lg font-semibold mb-2">No streams yet</h3>
				<p class="text-gray-600">No livestreams have been created for this memorial</p>
			</div>
		{:else}
			<div class="divide-y">
				{#each streams as stream}
					<div class="p-4 hover:bg-gray-50">
						<div class="flex justify-between items-start">
							<div class="flex-1">
								<h4 class="font-semibold text-gray-900">{stream.title}</h4>
								{#if stream.description}
									<p class="text-sm text-gray-600 mt-1">{stream.description}</p>
								{/if}
								<div class="flex items-center gap-3 mt-2">
									<span class={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stream.status)}`}>
										{getStatusIcon(stream.status)} {stream.status.toUpperCase()}
									</span>
									{#if stream.actualStartTime}
										<span class="text-xs text-gray-500">
											Started: {new Date(stream.actualStartTime).toLocaleTimeString()}
										</span>
									{/if}
									{#if stream.cloudflareId}
										<span class="text-xs text-gray-500">
											ID: {stream.cloudflareId.substring(0, 8)}...
										</span>
									{/if}
								</div>
							</div>
							<div class="flex gap-2 ml-4">
								<button
									class="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 cursor-not-allowed"
									onclick={() => editStream(stream)}
									disabled
								>
									Edit
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.livestream-control {
		max-width: 1200px;
		margin: 0 auto;
	}
</style>
