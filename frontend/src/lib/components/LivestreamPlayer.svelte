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
	console.log('🎥 Memorial livestream data:', JSON.stringify(memorial.livestream, null, 2));
	console.log('🔗 Available playback URLs:', {
		playbackUrl: memorial.livestream?.playbackUrl,
		alternativePlaybackUrl: memorial.livestream?.alternativePlaybackUrl,
		directPlaybackUrl: memorial.livestream?.directPlaybackUrl,
		isActive: memorial.livestream?.isActive
	});

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
			
			console.log('📊 Stream status response:', result);
			
			if (response.ok && result.success) {
				const livestream = result.livestream;
				console.log('✅ Livestream data loaded:', livestream);
				
				isLive = livestream.isActive || false;
				viewerCount = livestream.currentSession?.viewerCount || 0;
				streamTitle = livestream.currentSession?.title || '';
				
				console.log('🎯 Updated player state:', { isLive, viewerCount, streamTitle });
				
				// Also check Cloudflare Stream Live Input status if we have a cloudflareId
				if (memorial.livestream?.cloudflareId) {
					try {
						console.log('🌩️ Checking Cloudflare Stream status for ID:', memorial.livestream.cloudflareId);
						const statusResponse = await fetch(`/api/memorials/${memorial.id}/livestream/status`);
						const statusResult = await statusResponse.json();
						console.log('🌩️ Cloudflare Stream status:', statusResult);
					} catch (statusError) {
						console.warn('⚠️ Could not fetch Cloudflare status:', statusError);
					}
				}
			} else {
				console.warn('⚠️ Failed to load stream status:', result.error);
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
	{#if memorial.livestream?.playbackUrl || memorial.livestream?.alternativePlaybackUrl || memorial.livestream?.directPlaybackUrl || memorial.livestream?.cloudflareId}
		{@const primaryUrl = memorial.livestream?.playbackUrl}
		{@const fallbackUrl = memorial.livestream?.alternativePlaybackUrl}
		{@const directUrl = memorial.livestream?.directPlaybackUrl}
		{@const cloudflareId = memorial.livestream?.cloudflareId}
		
		// For live streams, try different URL formats
		{@const liveStreamUrl = cloudflareId ? `https://cloudflarestream.com/${cloudflareId}/iframe` : null}
		{@const embedUrl = cloudflareId ? `https://embed.cloudflarestream.com/${cloudflareId}/iframe` : null}
		{@const watchUrl = cloudflareId ? `https://watch.cloudflarestream.com/${cloudflareId}` : null}
		
		{@const selectedUrl = liveStreamUrl || embedUrl || primaryUrl || fallbackUrl || directUrl}
		
		{#if selectedUrl}
			{console.log('🎬 Attempting to load iframe with URL:', selectedUrl)}
			{console.log('🎬 URL breakdown:', {
				primaryUrl,
				fallbackUrl,
				directUrl,
				liveStreamUrl,
				embedUrl,
				watchUrl,
				selectedUrl,
				cloudflareId
			})}
			{console.log('🎬 Live stream status:', {
				isActive: memorial.livestream?.isActive,
				status: memorial.livestream?.status,
				startedAt: memorial.livestream?.startedAt
			})}
			
			<!-- Try multiple iframe formats for better compatibility -->
			{#if liveStreamUrl}
				<iframe
					src={liveStreamUrl}
					title="Memorial livestream - {memorial.lovedOneName}"
					class="w-full h-full border-0 {isLive || hasError ? 'rounded-b-lg' : 'rounded-lg'}"
					allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
					allowfullscreen
					onload={() => console.log('✅ Primary iframe loaded successfully:', liveStreamUrl)}
					onerror={(e) => {
						console.error('❌ Primary iframe failed, trying fallback:', e);
						// You could implement fallback logic here
					}}
				></iframe>
			{:else}
				<iframe
					src={selectedUrl}
					title="Memorial livestream - {memorial.lovedOneName}"
					class="w-full h-full border-0 {isLive || hasError ? 'rounded-b-lg' : 'rounded-lg'}"
					allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
					allowfullscreen
					onload={() => console.log('✅ Fallback iframe loaded successfully:', selectedUrl)}
					onerror={(e) => console.error('❌ Fallback iframe failed to load:', e, 'URL was:', selectedUrl)}
				></iframe>
			{/if}
			
			<!-- Debug info overlay (only visible in dev) -->
			<div class="absolute top-2 left-2 bg-black/75 text-white text-xs p-2 rounded opacity-50 hover:opacity-100 transition-opacity max-w-md">
				<div class="mb-1"><strong>Active URL:</strong> {selectedUrl}</div>
				<div class="mb-1"><strong>Cloudflare ID:</strong> {cloudflareId || 'None'}</div>
				<div class="mb-1"><strong>Live:</strong> {isLive ? 'Yes' : 'No'}</div>
				<div class="mb-1"><strong>Error:</strong> {hasError ? 'Yes' : 'No'}</div>
				<div class="mb-1"><strong>Status:</strong> {memorial.livestream?.status || 'Unknown'}</div>
				{#if liveStreamUrl && liveStreamUrl !== selectedUrl}
					<div class="text-yellow-300"><strong>Fallback:</strong> {liveStreamUrl}</div>
				{/if}
			</div>
		{:else}
			<div class="flex items-center justify-center text-white p-12 {isLive || hasError ? 'rounded-b-lg' : 'rounded-lg'}">
				<div class="text-center">
					<WifiOff class="w-12 h-12 mx-auto mb-4 text-gray-400" />
					<h3 class="text-lg font-medium mb-2">Stream Configuration Error</h3>
					<p class="text-gray-400">No valid playback URL could be determined</p>
					<div class="mt-4 text-xs text-gray-500">
						Debug: All playback URLs are null/undefined
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="flex items-center justify-center text-white p-12 {isLive || hasError ? 'rounded-b-lg' : 'rounded-lg'}">
			<div class="text-center">
				<WifiOff class="w-12 h-12 mx-auto mb-4 text-gray-400" />
				<h3 class="text-lg font-medium mb-2">Stream Offline</h3>
				<p class="text-gray-400">The livestream is not currently active</p>
				<div class="mt-4 text-xs text-gray-500">
					Debug: No playback URLs available in memorial.livestream
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.video-container {
		position: relative;
		padding-top: 56.25%; /* 16:9 aspect ratio */
	}
	
	.video-container iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>
