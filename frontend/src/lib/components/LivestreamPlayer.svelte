<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Users, Wifi, WifiOff, AlertCircle } from 'lucide-svelte';
	import type { Memorial } from '$lib/types/memorial';

	let { memorial }: { memorial: Memorial } = $props();
	
	let isLive = $state(false);
	let viewerCount = $state(0);
	let streamTitle = $state('');
	let hasError = $state(false);
	let pollInterval: NodeJS.Timeout | null = null;

	console.log('📺 LivestreamPlayer initialized for memorial:', memorial.id);

	onMount(() => {
		loadStreamStatus();
		// Poll for status updates every 30 seconds
		pollInterval = setInterval(loadStreamStatus, 30000);
	});

	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
			console.log('🧹 LivestreamPlayer cleanup - stopped polling');
		}
	});

	async function loadStreamStatus() {
		try {
			console.log('🔄 Loading stream status for memorial:', memorial.id);
			const response = await fetch(`/api/memorials/${memorial.id}/livestream`);
			const result = await response.json();

			if (response.ok && result.success) {
				const livestream = result.livestream;
				isLive = livestream.isActive || false;
				viewerCount = livestream.currentSession?.viewerCount || 0;
				streamTitle = livestream.currentSession?.title || '';
				hasError = false;
				
				console.log('✅ Stream status loaded:', {
					isLive,
					viewerCount,
					streamTitle,
					sessionId: livestream.currentSession?.id
				});
			} else {
				console.error('❌ Failed to load stream status:', result.error);
				hasError = true;
			}
		} catch (error) {
			console.error('💥 Error loading stream status:', error);
			hasError = true;
		}
	}
</script>

<!-- Status Bar -->
{#if isLive}
	<div class="bg-red-50 border border-red-200 rounded-t-lg px-4 py-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-2">
				<div class="flex items-center space-x-1 text-red-600">
					<div class="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
					<Wifi class="w-4 h-4" />
					<span class="text-sm font-medium">LIVE</span>
				</div>
				{#if streamTitle}
					<span class="text-sm text-gray-600">• {streamTitle}</span>
				{/if}
			</div>
			{#if viewerCount > 0}
				<div class="flex items-center space-x-1 text-red-600">
					<Users class="w-4 h-4" />
					<span class="text-sm">{viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}</span>
				</div>
			{/if}
		</div>
	</div>
{:else if hasError}
	<div class="bg-orange-50 border border-orange-200 rounded-t-lg px-4 py-3">
		<div class="flex items-center space-x-2 text-orange-600">
			<AlertCircle class="w-4 h-4" />
			<span class="text-sm">Unable to load stream status</span>
		</div>
	</div>
{/if}

<!-- Video Player -->
<div class="video-container bg-gray-900 {isLive || hasError ? 'rounded-b-lg' : 'rounded-lg'}">
	{#if memorial.livestream?.playbackUrl}
		<iframe
			src={memorial.livestream.playbackUrl}
			title="Memorial livestream - {memorial.lovedOneName}"
			class="w-full h-full border-0 {isLive || hasError ? 'rounded-b-lg' : 'rounded-lg'}"
			allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
			allowfullscreen
		></iframe>
	{:else}
		<div class="flex items-center justify-center text-white p-12 {isLive || hasError ? 'rounded-b-lg' : 'rounded-lg'}">
			<div class="text-center">
				<WifiOff class="w-12 h-12 mx-auto mb-4 text-gray-400" />
				<h3 class="text-lg font-medium mb-2">Stream Offline</h3>
				<p class="text-gray-400">The livestream is not currently active</p>
			</div>
		</div>
	{/if}
</div>
