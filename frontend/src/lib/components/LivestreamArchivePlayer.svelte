<script lang="ts">
	import { onMount } from 'svelte';
	import { Play, Calendar, Clock, Users, RefreshCw } from 'lucide-svelte';
	import type { LivestreamArchiveEntry } from '$lib/types/memorial';

	let {
		archiveEntries = [],
		memorialId = ''
	}: {
		archiveEntries: LivestreamArchiveEntry[];
		memorialId?: string;
	} = $props();

	let isCheckingRecordings = $state(false);
	let checkInterval: NodeJS.Timeout | null = null;

	console.log('📺 LivestreamArchivePlayer initialized with', archiveEntries.length, 'entries');
	console.log('📺 Archive entries:', archiveEntries.map(e => ({
		id: e.id,
		title: e.title,
		cloudflareId: e.cloudflareId,
		recordingReady: e.recordingReady,
		playbackUrl: e.playbackUrl,
		recordingPlaybackUrl: e.recordingPlaybackUrl
	})));

	// Auto-check for recordings on mount and periodically
	onMount(() => {
		const hasProcessingRecordings = archiveEntries.some(e => !e.recordingReady && e.cloudflareId);
		
		if (hasProcessingRecordings && memorialId) {
			console.log('🔄 Auto-checking recordings on mount...');
			checkRecordingStatus();
			
			// Check every 30 seconds for processing recordings
			checkInterval = setInterval(() => {
				const stillProcessing = archiveEntries.some(e => !e.recordingReady && e.cloudflareId);
				if (stillProcessing) {
					console.log('🔄 Auto-checking recordings (periodic)...');
					checkRecordingStatus();
				} else {
					// Stop checking when all recordings are ready
					if (checkInterval) {
						clearInterval(checkInterval);
						checkInterval = null;
					}
				}
			}, 30000); // Check every 30 seconds
		}

		return () => {
			if (checkInterval) {
				clearInterval(checkInterval);
			}
		};
	});

	async function checkRecordingStatus() {
		if (!memorialId || isCheckingRecordings) return;
		
		isCheckingRecordings = true;
		console.log('🔄 Checking recording status for memorial:', memorialId);
		
		try {
			const response = await fetch(`/api/memorials/${memorialId}/livestream/archive/check-recordings`, {
				method: 'POST'
			});
			
			if (response.ok) {
				const result = await response.json();
				console.log('✅ Recording check result:', result);
				
				if (result.updated > 0) {
					// Refresh the page to get updated data
					window.location.reload();
				}
			} else {
				console.error('❌ Failed to check recordings:', response.status);
			}
		} catch (error) {
			console.error('❌ Error checking recordings:', error);
		} finally {
			isCheckingRecordings = false;
		}
	}

	function formatDate(timestamp: any): string {
		if (!timestamp) return 'Unknown';
		const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
		return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
			hour: '2-digit', 
			minute: '2-digit' 
		});
	}

	function formatDuration(seconds?: number): string {
		if (!seconds) return 'Unknown';
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	}

	// Filter to only show visible and ready recordings
	let visibleEntries = $derived(archiveEntries.filter(entry => 
		entry.isVisible && entry.recordingReady && entry.playbackUrl
	));
	
	// Filter to show processing recordings
	let processingEntries = $derived(archiveEntries.filter(entry => 
		entry.isVisible && !entry.recordingReady
	));
</script>

{#if visibleEntries.length > 0 || processingEntries.length > 0}
	<div class="space-y-8">
		<div class="text-center">
			<h2 class="text-2xl font-bold text-gray-900 mb-2">Memorial Service Recordings</h2>
			{#if visibleEntries.length > 0}
				<p class="text-gray-600 mb-4">
					{visibleEntries.length} recorded service{visibleEntries.length !== 1 ? 's' : ''} available
				</p>
			{/if}
			
			{#if processingEntries.length > 0}
				<div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
					<div class="flex items-center justify-center space-x-2 text-blue-600">
						<RefreshCw class="w-4 h-4 animate-spin" />
						<span class="text-sm font-medium">
							{processingEntries.length} recording{processingEntries.length !== 1 ? 's' : ''} processing...
						</span>
					</div>
					<p class="text-xs text-blue-500 mt-1">Recordings will appear automatically when ready</p>
				</div>
			{/if}
		</div>

		{#each visibleEntries as entry, index (entry.id)}
			{@const embedUrl = `https://cloudflarestream.com/${entry.cloudflareId}/iframe`}
			<div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
				<!-- Header -->
				<div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-lg font-semibold text-gray-900">{entry.title}</h3>
							{#if entry.description}
								<p class="text-sm text-gray-600 mt-1">{entry.description}</p>
							{/if}
						</div>
						<div class="flex items-center space-x-4 text-sm text-gray-500">
							<div class="flex items-center space-x-1">
								<Calendar class="w-4 h-4" />
								<span>{formatDate(entry.startedAt)}</span>
							</div>
							{#if entry.duration}
								<div class="flex items-center space-x-1">
									<Clock class="w-4 h-4" />
									<span>{formatDuration(entry.duration)}</span>
								</div>
							{/if}
							{#if entry.viewerCount}
								<div class="flex items-center space-x-1">
									<Users class="w-4 h-4" />
									<span>{entry.viewerCount} viewers</span>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Video Player -->
				<div class="video-container bg-gray-900">
					
					<iframe
						src={embedUrl}
						title="Memorial service recording - {entry.title}"
						class="w-full h-full border-0"
						allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
						allowfullscreen
						onload={() => console.log('✅ Archive player loaded:', entry.id)}
						onerror={(e) => console.error('❌ Archive player failed:', e, entry.id)}
					></iframe>

					<!-- Debug overlay for development -->
					<div class="absolute top-2 left-2 bg-black/75 text-white text-xs p-2 rounded opacity-50 hover:opacity-100 transition-opacity">
						<div><strong>Stream ID:</strong> {entry.id}</div>
						<div><strong>Cloudflare ID:</strong> {entry.cloudflareId}</div>
						<div><strong>Recording:</strong> {entry.recordingReady ? 'Ready' : 'Processing'}</div>
						<div><strong>Started by:</strong> {entry.startedByName || 'Unknown'}</div>
					</div>
				</div>

				<!-- Footer with additional info -->
				{#if entry.startedByName}
					<div class="px-6 py-3 bg-gray-50 border-t border-gray-200">
						<p class="text-sm text-gray-600">
							Streamed by {entry.startedByName} on {formatDate(entry.startedAt)}
						</p>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{:else if processingEntries.length > 0}
	<!-- Processing recordings message -->
	<div class="text-center py-12">
		<div class="text-blue-400 text-6xl mb-4">⏳</div>
		<h3 class="text-xl font-medium text-gray-900 mb-2">Recordings Processing</h3>
		<p class="text-gray-600 mb-4">
			{processingEntries.length} memorial service recording{processingEntries.length !== 1 ? 's are' : ' is'} being processed and will be available shortly
		</p>
		
		<!-- Processing entries list -->
		<div class="max-w-md mx-auto space-y-3">
			{#each processingEntries as entry}
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h4 class="font-medium text-gray-900">{entry.title}</h4>
					<p class="text-sm text-gray-600">Started {formatDate(entry.startedAt)}</p>
					<div class="flex items-center justify-center mt-2 text-blue-600">
						<RefreshCw class="w-4 h-4 animate-spin mr-2" />
						<span class="text-sm">Processing recording...</span>
					</div>
				</div>
			{/each}
		</div>
		
		{#if memorialId}
			<button
				onclick={checkRecordingStatus}
				disabled={isCheckingRecordings}
				class="mt-6 inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				<RefreshCw class="w-4 h-4 {isCheckingRecordings ? 'animate-spin' : ''}" />
				<span>{isCheckingRecordings ? 'Checking...' : 'Check Recording Status'}</span>
			</button>
		{/if}
	</div>
{:else}
	<!-- No visible recordings message -->
	<div class="text-center py-12">
		<div class="text-gray-400 text-6xl mb-4">📹</div>
		<h3 class="text-xl font-medium text-gray-900 mb-2">No Recordings Available</h3>
		<p class="text-gray-600">
			Memorial service recordings will appear here when available
		</p>
	</div>
{/if}

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
