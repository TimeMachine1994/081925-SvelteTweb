<script lang="ts">
	import { onMount } from 'svelte';
	import { Eye, EyeOff, Play, Clock, Users, Calendar } from 'lucide-svelte';
	import type { LivestreamArchiveEntry } from '$lib/types/memorial';

	let {
		memorialId,
		memorialName = 'Memorial Service'
	}: {
		memorialId: string;
		memorialName?: string;
	} = $props();

	let archiveEntries = $state<LivestreamArchiveEntry[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	console.log('📺 LivestreamArchive initialized for memorial:', memorialId);

	onMount(() => {
		loadArchiveEntries();
	});

	async function loadArchiveEntries() {
		try {
			isLoading = true;
			const response = await fetch(`/api/memorials/${memorialId}/livestream/archive`);
			const result = await response.json();

			if (response.ok && result.success) {
				archiveEntries = result.archive || [];
				console.log('📊 Archive entries loaded:', archiveEntries);
			} else {
				console.error('❌ Failed to load archive entries:', result.error);
				error = result.error || 'Failed to load archive';
			}
		} catch (err) {
			console.error('💥 Error loading archive entries:', err);
			error = 'Network error loading archive';
		} finally {
			isLoading = false;
		}
	}

	async function toggleVisibility(entryId: string, currentVisibility: boolean) {
		try {
			const response = await fetch(`/api/memorials/${memorialId}/livestream/archive/${entryId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					isVisible: !currentVisibility
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				// Update local state
				archiveEntries = archiveEntries.map(entry => 
					entry.id === entryId 
						? { ...entry, isVisible: !currentVisibility }
						: entry
				);
				console.log('✅ Visibility updated for entry:', entryId);
			} else {
				console.error('❌ Failed to update visibility:', result.error);
				error = result.error || 'Failed to update visibility';
			}
		} catch (err) {
			console.error('💥 Error updating visibility:', err);
			error = 'Network error updating visibility';
		}
	}

	function formatDate(timestamp: any): string {
		if (!timestamp) return 'Unknown';
		const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
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
</script>

<div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
	<div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-3">
				<div class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
					<Play class="w-5 h-5 text-white" />
				</div>
				<div>
					<h3 class="text-lg font-semibold text-gray-900">Livestream Archive</h3>
					<p class="text-sm text-gray-600">
						{archiveEntries.length} recorded stream{archiveEntries.length !== 1 ? 's' : ''}
					</p>
				</div>
			</div>
		</div>
	</div>

	<div class="p-6">
		{#if error}
			<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
				<span class="text-red-700 text-sm">{error}</span>
			</div>
		{/if}

		{#if isLoading}
			<div class="flex items-center justify-center py-8">
				<div class="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
				<span class="ml-3 text-gray-600">Loading archive...</span>
			</div>
		{:else if archiveEntries.length === 0}
			<div class="text-center py-8">
				<div class="text-gray-400 text-5xl mb-4">📹</div>
				<h4 class="text-lg font-medium text-gray-900 mb-2">No Archived Streams</h4>
				<p class="text-gray-600">Completed livestreams will appear here for management</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each archiveEntries as entry (entry.id)}
					<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center space-x-2 mb-2">
									<h4 class="font-medium text-gray-900">{entry.title}</h4>
									{#if entry.recordingReady}
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
											Ready
										</span>
									{:else}
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
											Processing
										</span>
									{/if}
								</div>

								{#if entry.description}
									<p class="text-sm text-gray-600 mb-3">{entry.description}</p>
								{/if}

								<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
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
									<div class="flex items-center space-x-1">
										<span class="text-xs">by {entry.startedByName || 'Unknown'}</span>
									</div>
								</div>
							</div>

							<div class="flex items-center space-x-2 ml-4">
								<button
									onclick={() => toggleVisibility(entry.id, entry.isVisible)}
									class="flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors {entry.isVisible 
										? 'bg-green-100 text-green-700 hover:bg-green-200' 
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
									title={entry.isVisible ? 'Hide from memorial page' : 'Show on memorial page'}
								>
									{#if entry.isVisible}
										<Eye class="w-4 h-4" />
										<span>Visible</span>
									{:else}
										<EyeOff class="w-4 h-4" />
										<span>Hidden</span>
									{/if}
								</button>

								{#if entry.recordingReady && entry.playbackUrl}
									<a
										href={entry.playbackUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors"
									>
										<Play class="w-4 h-4" />
										<span>Preview</span>
									</a>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
