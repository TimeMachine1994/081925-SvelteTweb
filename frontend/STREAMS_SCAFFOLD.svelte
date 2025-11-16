<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Plus } from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { Stream } from '$lib/types/stream';
	import Button from '$lib/ui/primitives/Button.svelte';

	// TODO: Import your new rebuilt stream components here
	// import NewStreamCard from '$lib/components/...';
	// import StreamCard from '$lib/components/...';
	// import CompletedStreamCard from '$lib/components/...';

	let { data }: { data: PageData } = $props();

	// State
	let streams = $state<Stream[]>([]);
	let loading = $state(false);
	let error = $state('');
	let pollingInterval: NodeJS.Timeout | null = null;

	// Data from server
	const memorial = data.memorial;
	const memorialId = memorial.id;
	const user = data.user;

	// Permission check
	const canCreateStreams = user && (user.role === 'funeral_director' || user.role === 'admin');

	// Load streams on mount
	onMount(async () => {
		await loadStreams();
		
		// Start 10-second polling for live status
		pollingInterval = setInterval(async () => {
			await checkLiveStatus();
		}, 10000);
	});

	// Cleanup polling
	onDestroy(() => {
		if (pollingInterval) {
			clearInterval(pollingInterval);
		}
	});

	// API Functions (keep these - you'll need them)
	async function loadStreams() {
		const isInitialLoad = streams.length === 0;
		
		if (isInitialLoad) {
			loading = true;
		}
		error = '';

		try {
			const response = await fetch(`/api/memorials/${memorialId}/streams`);
			
			if (!response.ok) {
				throw new Error(`Failed to load streams: ${response.statusText}`);
			}

			const result = await response.json();
			streams = result.streams || [];
		} catch (err) {
			console.error('Error loading streams:', err);
			if (isInitialLoad) {
				error = 'Failed to load streams';
			}
		} finally {
			if (isInitialLoad) {
				loading = false;
			}
		}
	}

	async function checkLiveStatus() {
		// Check live streams
		const liveStreamIds = streams
			.filter((stream) => ['scheduled', 'ready', 'live'].includes(stream.status))
			.map((stream) => stream.id);

		// Check completed streams for recordings
		const completedStreamIds = streams
			.filter((stream) => 
				(stream.status === 'completed' || stream.status === 'scheduled') && 
				!stream.recordingReady
			)
			.map((stream) => stream.id);

		let hasUpdates = false;

		// Check live status
		if (liveStreamIds.length > 0) {
			try {
				const response = await fetch('/api/streams/check-live-status', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ streamIds: liveStreamIds })
				});

				if (response.ok) {
					const result = await response.json();
					if (result.summary.updated > 0) {
						hasUpdates = true;
					}
				}
			} catch (err) {
				console.error('Error checking live status:', err);
			}
		}

		// Check recordings
		if (completedStreamIds.length > 0) {
			for (const streamId of completedStreamIds) {
				try {
					const response = await fetch(`/api/streams/${streamId}/recordings`);
					if (response.ok) {
						const result = await response.json();
						if (result.recordingCount > 0) {
							hasUpdates = true;
						}
					}
				} catch (err) {
					console.error('Error checking recordings:', err);
				}
			}
		}

		// Reload if updates found
		if (hasUpdates) {
			await loadStreams();
		}
	}

	async function createStream(title: string, description: string, scheduledStartTime?: string) {
		loading = true;
		error = '';

		try {
			const response = await fetch(`/api/memorials/${memorialId}/streams`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim(),
					scheduledStartTime
				})
			});

			if (!response.ok) {
				throw new Error(`Failed to create stream: ${response.statusText}`);
			}

			await loadStreams();
		} catch (err) {
			console.error('Error creating stream:', err);
			error = 'Failed to create stream';
		} finally {
			loading = false;
		}
	}

	async function toggleVisibility(streamId: string, currentVisibility: boolean) {
		try {
			const response = await fetch(`/api/streams/${streamId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isVisible: !currentVisibility })
			});

			if (!response.ok) {
				throw new Error('Failed to update visibility');
			}

			await loadStreams();
		} catch (err) {
			console.error('Error toggling visibility:', err);
			error = 'Failed to update stream visibility';
		}
	}

	async function deleteStream(streamId: string) {
		if (!confirm('Are you sure you want to delete this stream?')) {
			return;
		}

		try {
			const response = await fetch(`/api/streams/${streamId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to delete stream');
			}

			streams = streams.filter((s) => s.id !== streamId);
		} catch (err) {
			console.error('Error deleting stream:', err);
			error = 'Failed to delete stream';
		}
	}

	async function checkRecordings(streamId: string) {
		try {
			const response = await fetch(`/api/streams/${streamId}/recordings`);
			
			if (!response.ok) {
				throw new Error('Failed to check recordings');
			}

			await loadStreams();
		} catch (err) {
			console.error('Error checking recordings:', err);
			throw err;
		}
	}
</script>

<svelte:head>
	<title>Stream Management - {memorial.lovedOneName}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
	<div class="container mx-auto">
		
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Stream Management</h1>
					<p class="text-gray-600">{memorial.lovedOneName}</p>
				</div>
				
				{#if canCreateStreams}
					<Button variant="role" role="owner" size="md">
						<Plus class="mr-2 h-4 w-4" />
						Create Stream
					</Button>
				{/if}
			</div>
		</div>

		<!-- Error Message -->
		{#if error}
			<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
				<p class="text-red-800">{error}</p>
			</div>
		{/if}

		<!-- Loading State -->
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600"></div>
				<span class="ml-3 text-gray-600">Loading streams...</span>
			</div>
		{/if}

		<!-- Streams Content -->
		{#if !loading}
			{#if streams.length === 0}
				<!-- Empty State -->
				<div class="py-12 text-center">
					<div class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
						<Plus class="h-12 w-12 text-gray-400" />
					</div>
					<h3 class="mb-2 text-xl font-semibold text-gray-900">No streams yet</h3>
					
					{#if canCreateStreams}
						<p class="mb-6 text-gray-600">Create your first livestream to get started</p>
					{:else}
						<p class="mb-6 text-gray-600">
							Streams will appear here when scheduled through the service calculator
						</p>
						<a
							href="/schedule?memorialId={memorialId}"
							class="inline-flex items-center rounded-lg bg-amber-600 px-6 py-3 text-white transition-colors hover:bg-amber-700"
						>
							<Plus class="mr-2 h-4 w-4" />
							Schedule Service
						</a>
					{/if}
				</div>
			{:else}
				<!-- TODO: Replace with your new stream card components -->
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each streams as stream (stream.id)}
						<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
							<h3 class="text-lg font-semibold">{stream.title}</h3>
							<p class="text-sm text-gray-600">Status: {stream.status}</p>
							<p class="text-xs text-gray-500">ID: {stream.id}</p>
							
							<!-- TODO: Replace this with your actual StreamCard or CompletedStreamCard components -->
							<div class="mt-4 space-y-2">
								<button
									class="w-full rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
									onclick={() => toggleVisibility(stream.id, stream.isVisible)}
								>
									{stream.isVisible ? 'Hide' : 'Show'} Stream
								</button>
								
								{#if stream.status === 'completed' && !stream.recordingReady}
									<button
										class="w-full rounded bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600"
										onclick={() => checkRecordings(stream.id)}
									>
										Check for Recording
									</button>
								{/if}
								
								<button
									class="w-full rounded bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
									onclick={() => deleteStream(stream.id)}
								>
									Delete
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}

	</div>
</div>

<style>
	/* Add your custom styles here if needed */
</style>
