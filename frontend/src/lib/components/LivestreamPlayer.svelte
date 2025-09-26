<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Users, Wifi, WifiOff, AlertCircle, Calendar, Clock, MapPin, Video } from 'lucide-svelte';
	import type { Memorial } from '$lib/types/memorial';
	import LivestreamArchivePlayer from './LivestreamArchivePlayer.svelte';

	let { 
		memorial,
		scheduledServices = [],
		archiveEntries: passedArchiveEntries = []
	}: { 
		memorial: Memorial;
		scheduledServices?: any[];
		archiveEntries?: any[];
	} = $props();
	
	let isLive = $state(false);
	let viewerCount = $state(0);
	let streamTitle = $state('');
	let hasError = $state(false);
	let recordingReady = $state(false);
	let showRecordingNotification = $state(false);
	let archiveEntries = $state(passedArchiveEntries.length > 0 ? passedArchiveEntries : (memorial.livestreamArchive || []));
	let pollInterval: NodeJS.Timeout | null = null;

	console.log('📺 LivestreamPlayer initialized for memorial:', memorial.id);
	console.log('🎯 Scheduled services:', scheduledServices.length);
	console.log('📼 Archive entries passed:', passedArchiveEntries.length);
	console.log('📼 Archive entries from memorial:', memorial.livestreamArchive?.length || 0);
	console.log('📼 Final archive entries:', archiveEntries.length);

	// Filter services by status
	let liveServices = $derived(scheduledServices.filter(s => s.status === 'live' && s.isVisible !== false));
	let completedServices = $derived(scheduledServices.filter(s => s.status === 'completed' && s.isVisible !== false));

	onMount(() => {
		loadStreamStatus();
		loadArchiveEntries();
		// Poll for status updates every 30 seconds
		pollInterval = setInterval(() => {
			loadStreamStatus();
			loadArchiveEntries();
		}, 30000);
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
				
				// Use actuallyLive from Cloudflare status if available, fallback to isActive
				isLive = livestream.actuallyLive !== undefined ? livestream.actuallyLive : (livestream.isActive || false);
				viewerCount = livestream.currentSession?.viewerCount || livestream.cloudflareStatus?.connectionCount || 0;
				streamTitle = livestream.currentSession?.title || '';
				
				console.log('🎯 Updated player state:', { 
					isLive, 
					viewerCount, 
					streamTitle,
					dbSaysActive: livestream.isActive,
					cloudflareSaysLive: livestream.actuallyLive,
					statusMatch: livestream.debugging?.statusMatch
				});
				
				// Also check Cloudflare Stream Live Input status if we have a cloudflareId
				if (memorial.livestream?.cloudflareId) {
					try {
						console.log('🌩️ Checking Cloudflare Stream status for ID:', memorial.livestream.cloudflareId);
						const statusResponse = await fetch(`/api/memorials/${memorial.id}/livestream/status`);
						const statusResult = await statusResponse.json();
						console.log('🌩️ Cloudflare Stream status:', statusResult);
						
						// Check if recording became available
						const wasRecordingReady = recordingReady;
						recordingReady = statusResult.status?.recordingStatus?.isReady || false;
						
						// Show notification if recording just became available
						if (!wasRecordingReady && recordingReady && !isLive) {
							console.log('🎬 Recording is now available for playback!');
							showRecordingNotification = true;
							// Auto-hide notification after 10 seconds
							setTimeout(() => {
								showRecordingNotification = false;
							}, 10000);
						}
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

	async function loadArchiveEntries() {
		try {
			console.log('📊 Loading archive entries for memorial:', memorial.id);
			const response = await fetch(`/api/memorials/${memorial.id}/livestream/archive`);
			const result = await response.json();
			
			if (response.ok && result.success) {
				archiveEntries = result.archive || [];
				console.log('📊 Archive entries loaded:', archiveEntries.length);
			} else {
				console.warn('⚠️ Failed to load archive entries:', result.error);
			}
		} catch (error) {
			console.error('💥 Error loading archive entries:', error);
		}
	}

	function formatDateTime(time: any) {
		if (!time?.date || time.isUnknown) return 'Time TBD';
		const date = new Date(time.date);
		const timeStr = time.time ? ` at ${time.time}` : '';
		return date.toLocaleDateString() + timeStr;
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'live': return 'bg-red-500';
			case 'scheduled': return 'bg-blue-500';
			case 'completed': return 'bg-green-500';
			default: return 'bg-gray-500';
		}
	}
</script>

<!-- Recording Available Notification -->
{#if showRecordingNotification}
	<div class="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 animate-pulse">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-2 text-green-600">
				<div class="w-2 h-2 bg-green-600 rounded-full"></div>
				<span class="text-sm font-medium">Recording Available!</span>
				<span class="text-sm text-gray-600">The livestream recording is now ready to watch</span>
			</div>
			<button 
				onclick={() => showRecordingNotification = false}
				class="text-green-600 hover:text-green-800 text-sm"
			>
				Dismiss
			</button>
		</div>
	</div>
{/if}

<!-- Live Services Section -->
{#if liveServices.length > 0}
	<div class="mb-8">
		<div class="text-center mb-6">
			<h2 class="text-2xl font-bold text-gray-900 mb-2">🔴 Live Memorial Services</h2>
			<p class="text-gray-600">
				{liveServices.length} service{liveServices.length !== 1 ? 's' : ''} currently streaming
			</p>
		</div>

		<div class="space-y-8">
			{#each liveServices as service}
				<div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
					<!-- Service Header -->
					<div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-lg font-semibold text-gray-900 flex items-center">
									<div class="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
									{service.title}
								</h3>
								<div class="flex items-center space-x-4 text-sm text-gray-600 mt-2">
									<div class="flex items-center space-x-1">
										<Calendar class="w-4 h-4" />
										<span>{formatDateTime(service.time)}</span>
									</div>
									<div class="flex items-center space-x-1">
										<MapPin class="w-4 h-4" />
										<span>{service.location?.name || 'Location TBD'}</span>
									</div>
									<div class="flex items-center space-x-1">
										<Video class="w-4 h-4" />
										<span>{service.hours} hours</span>
									</div>
								</div>
							</div>
							<div class="flex items-center space-x-1 text-red-600">
								<Users class="w-4 h-4" />
								<span class="text-sm">{service.viewerCount || 0} viewers</span>
							</div>
						</div>
					</div>

					<!-- Cloudflare Stream Player -->
					<div class="aspect-video bg-black">
						{#if service.cloudflareId}
							<iframe
								src="https://customer-{memorial.cloudflareCustomerCode || 'default'}.cloudflarestream.com/{service.cloudflareId}/iframe"
								style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"
								allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
								allowfullscreen="true"
								title="Live Stream: {service.title}"
							></iframe>
						{:else}
							<div class="flex items-center justify-center h-full text-white">
								<div class="text-center">
									<WifiOff class="w-12 h-12 mx-auto mb-4 text-gray-400" />
									<p class="text-gray-400">Stream starting soon...</p>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- Completed Services Section (Recordings) -->
{#if completedServices.length > 0}
	<div class="mb-8">
		<div class="text-center mb-6">
			<h2 class="text-2xl font-bold text-gray-900 mb-2">📹 Recorded Memorial Services</h2>
			<p class="text-gray-600">
				{completedServices.length} service{completedServices.length !== 1 ? 's' : ''} available for replay
			</p>
		</div>

		<div class="space-y-8">
			{#each completedServices as service}
				<div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
					<!-- Service Header -->
					<div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-lg font-semibold text-gray-900 flex items-center">
									<div class="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
									{service.title}
								</h3>
								<div class="flex items-center space-x-4 text-sm text-gray-600 mt-2">
									<div class="flex items-center space-x-1">
										<Calendar class="w-4 h-4" />
										<span>{formatDateTime(service.time)}</span>
									</div>
									<div class="flex items-center space-x-1">
										<MapPin class="w-4 h-4" />
										<span>{service.location?.name || 'Location TBD'}</span>
									</div>
									<div class="flex items-center space-x-1">
										<Video class="w-4 h-4" />
										<span>{service.hours} hours</span>
									</div>
								</div>
							</div>
							<div class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
								Recorded
							</div>
						</div>
					</div>

					<!-- Recording Player -->
					<div class="aspect-video bg-black relative">
						{#if service.recordingPlaybackUrl || service.cloudflareId}
							{#if service.recordingPlaybackUrl}
								<!-- Use recording URL if available -->
								<iframe
									src="{service.recordingPlaybackUrl}"
									style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"
									allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
									allowfullscreen="true"
									title="Recording: {service.title}"
								></iframe>
							{:else if service.cloudflareId}
								<!-- Fallback to Cloudflare player -->
								<iframe
									src="https://customer-{memorial.cloudflareCustomerCode || 'default'}.cloudflarestream.com/{service.cloudflareId}/iframe"
									style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"
									allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
									allowfullscreen="true"
									title="Recording: {service.title}"
								></iframe>
							{/if}
						{:else}
							<div class="flex items-center justify-center h-full text-white">
								<div class="text-center">
									<AlertCircle class="w-12 h-12 mx-auto mb-4 text-gray-400" />
									<p class="text-gray-400">Recording processing...</p>
									<p class="text-sm text-gray-500 mt-2">This recording will be available shortly</p>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- Legacy Video Player (for backward compatibility) -->
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
				<div class="mb-1"><strong>Live (UI):</strong> {isLive ? 'Yes' : 'No'}</div>
				<div class="mb-1"><strong>Recording Ready:</strong> {recordingReady ? 'Yes' : 'No'}</div>
				<div class="mb-1"><strong>Error:</strong> {hasError ? 'Yes' : 'No'}</div>
				<div class="mb-1"><strong>DB Status:</strong> {memorial.livestream?.status || 'Unknown'}</div>
				<div class="mb-1"><strong>DB Active:</strong> {memorial.livestream?.isActive ? 'Yes' : 'No'}</div>
				<div class="mb-1"><strong>CF Live:</strong> {memorial.livestream?.actuallyLive ? 'Yes' : 'No'}</div>
				<div class="mb-1"><strong>Viewers:</strong> {viewerCount}</div>
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
				<Calendar class="w-12 h-12 mx-auto mb-4 text-gray-400" />
				<h3 class="text-lg font-medium mb-2">Memorial Service</h3>
				{#if memorial.services?.main?.time && !memorial.services.main.time.isUnknown}
					<p class="text-gray-300 mb-2">Service begins at:</p>
					<p class="text-xl font-semibold text-white">
						{formatDateTime(memorial.services.main.time)}
					</p>
					{#if memorial.services?.main?.location?.name}
						<p class="text-gray-400 mt-2 flex items-center justify-center">
							<MapPin class="w-4 h-4 mr-1" />
							{memorial.services.main.location.name}
						</p>
					{/if}
				{:else}
					<p class="text-gray-400">Service details will be announced</p>
				{/if}
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

<!-- Archive Players for Completed Streams -->
{#if archiveEntries && archiveEntries.length > 0}
	<div class="mt-8">
		<LivestreamArchivePlayer {archiveEntries} memorialId={memorial.id} />
	</div>
{:else if memorial.livestream?.status === 'completed' || memorial.livestream?.status === 'stopped'}
	<!-- Show processing message if stream ended but no archive yet -->
	<div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg px-6 py-4">
		<div class="flex items-center justify-center space-x-2 text-blue-600">
			<div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
			<span class="text-sm font-medium">Processing recording...</span>
		</div>
		<p class="text-xs text-blue-500 mt-1 text-center">Your recording will appear here automatically when ready</p>
	</div>
{/if}
