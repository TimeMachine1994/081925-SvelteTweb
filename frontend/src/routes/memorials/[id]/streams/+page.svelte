<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { Plus, Play, Eye } from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { Stream } from '$lib/types/stream';
	import { StreamCard } from '$lib/ui';
	import CompletedStreamCard from '$lib/components/CompletedStreamCard.svelte';
	import Button from '$lib/ui/primitives/Button.svelte';

	let { data }: { data: PageData } = $props();

	let streams = $state<Stream[]>([]);
	let loading = $state(false);
	let error = $state('');
	let showCreateModal = $state(false);
	let newStreamTitle = $state('');
	let newStreamDescription = $state('');
	let newStreamDate = $state('');
	let newStreamTime = $state('');
	let copiedStreamKey = $state<string | null>(null);
	let copiedRtmpUrl = $state<string | null>(null);
	let pollingInterval: NodeJS.Timeout | null = null;

	const memorial = data.memorial;
	const memorialId = memorial.id;

	// Load streams on mount and start polling
	onMount(async () => {
		console.log('🚀 [INIT] Component mounted, starting initialization...');
		await loadStreams();

		// Poll for live status updates every 10 seconds (more efficient)
		console.log('⏰ [INIT] Starting polling interval (10 seconds)...');
		pollingInterval = setInterval(async () => {
			console.log('⏰ [POLLING] Polling interval triggered');
			await checkLiveStatus();
		}, 10000);

		console.log('🚀 [INIT] Initialization completed');
	});

	// Clean up polling on unmount
	onDestroy(() => {
		if (pollingInterval) {
			clearInterval(pollingInterval);
		}
	});

	async function loadStreams() {
		// Don't show loading spinner during background polling
		const isInitialLoad = streams.length === 0;
		console.log('📥 [LOAD] Loading streams...', { isInitialLoad, memorialId });

		if (isInitialLoad) {
			loading = true;
		}
		error = '';

		try {
			const response = await fetch(`/api/memorials/${memorialId}/streams`);
			console.log('📥 [LOAD] API response status:', response.status);

			if (!response.ok) {
				throw new Error(`Failed to load streams: ${response.statusText}`);
			}

			const result = await response.json();
			console.log('📥 [LOAD] API response data:', result);

			const newStreams = (result.streams || []) as Stream[];
			console.log('📥 [LOAD] Loaded streams:', newStreams.length);

			// Log each stream's recording status
			newStreams.forEach((stream, index) => {
				console.log(`📥 [LOAD] Stream ${index + 1} (${stream.id}):`, {
					title: stream.title,
					status: stream.status,
					recordingReady: stream.recordingReady,
					recordingPlaybackUrl: stream.recordingPlaybackUrl,
					recordingCount: stream.recordingCount,
					cloudflareStreamId: stream.cloudflareStreamId
				});
			});

			streams = newStreams;
			console.log('📥 [LOAD] Streams updated in state');
		} catch (err) {
			console.error('❌ [LOAD] Error loading streams:', err);
			if (isInitialLoad) {
				error = 'Failed to load streams';
			}
		} finally {
			if (isInitialLoad) {
				loading = false;
			}
			console.log('📥 [LOAD] Load streams completed');
		}
	}

	async function checkLiveStatus() {
		console.log('🔍 [POLLING] Starting live status check...');

		// Check streams that could potentially be live
		const liveStreamIds = streams
			.filter((stream) => ['scheduled', 'ready', 'live'].includes(stream.status))
			.map((stream) => stream.id);

		// Check completed streams AND scheduled streams that might have recordings
		const completedStreamIds = streams
			.filter(
				(stream) =>
					(stream.status === 'completed' || stream.status === 'scheduled') && !stream.recordingReady
			)
			.map((stream) => stream.id);

		console.log('🔍 [POLLING] Stream analysis:', {
			totalStreams: streams.length,
			liveStreamIds,
			completedStreamIds,
			streamsNeedingRecordingCheck: completedStreamIds.length
		});

		// Log detailed stream info
		streams.forEach((stream) => {
			console.log(`📊 [POLLING] Stream ${stream.id}:`, {
				title: stream.title,
				status: stream.status,
				recordingReady: stream.recordingReady,
				recordingPlaybackUrl: stream.recordingPlaybackUrl,
				recordingCount: stream.recordingCount
			});
		});

		let hasUpdates = false;

		// Check live status
		if (liveStreamIds.length > 0) {
			try {
				const response = await fetch('/api/streams/check-live-status', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ streamIds: liveStreamIds })
				});

				if (response.ok) {
					const result = await response.json();
					console.log('🔍 Live status check:', result.summary);

					if (result.summary.updated > 0) {
						hasUpdates = true;
					}
				}
			} catch (err) {
				console.error('Error checking live status:', err);
			}
		}

		// Check recordings for completed streams
		if (completedStreamIds.length > 0) {
			console.log(
				'🎥 [POLLING] Checking recordings for',
				completedStreamIds.length,
				'streams:',
				completedStreamIds
			);

			for (const streamId of completedStreamIds) {
				try {
					console.log(`🎥 [POLLING] Calling recordings API for stream: ${streamId}`);
					const response = await fetch(`/api/streams/${streamId}/recordings`);

					if (response.ok) {
						const result = await response.json();
						console.log(`🎥 [POLLING] Recordings API response for ${streamId}:`, {
							success: result.success,
							recordingCount: result.recordingCount,
							readyRecordings: result.readyRecordings,
							hasLatestRecording: !!result.latestRecording,
							latestRecordingReady: result.latestRecording?.isReady
						});

						if (result.recordingCount > 0) {
							console.log(
								`✅ [POLLING] Found ${result.recordingCount} recordings for stream: ${streamId}`
							);
							hasUpdates = true;
						} else {
							console.log(`⚠️ [POLLING] No recordings found for stream: ${streamId}`);
						}
					} else {
						console.error(
							`❌ [POLLING] Recordings API failed for ${streamId}:`,
							response.status,
							response.statusText
						);
					}
				} catch (err) {
					console.error(`❌ [POLLING] Error checking recordings for stream ${streamId}:`, err);
				}
			}
		} else {
			console.log('🎥 [POLLING] No streams need recording checks');
		}

		// Only reload if we detected changes
		if (hasUpdates) {
			console.log('🔄 [POLLING] Changes detected, reloading streams...');
			await loadStreams();
			console.log('🔄 [POLLING] Streams reloaded successfully');
		} else {
			console.log('🔄 [POLLING] No changes detected, skipping reload');
		}

		console.log('🔍 [POLLING] Live status check completed');
	}

	async function createStream() {
		if (!newStreamTitle.trim()) return;

		loading = true;
		error = '';

		try {
			// Combine date and time into scheduledStartTime if both are provided
			let scheduledStartTime = null;
			if (newStreamDate && newStreamTime) {
				scheduledStartTime = new Date(`${newStreamDate}T${newStreamTime}`).toISOString();
			}

			const response = await fetch(`/api/memorials/${memorialId}/streams`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: newStreamTitle.trim(),
					description: newStreamDescription.trim(),
					scheduledStartTime
				})
			});

			if (!response.ok) {
				throw new Error(`Failed to create stream: ${response.statusText}`);
			}

			const result = await response.json();
			streams = [...streams, result.stream as Stream];

			// Reset form
			newStreamTitle = '';
			newStreamDescription = '';
			newStreamDate = '';
			newStreamTime = '';
			showCreateModal = false;
		} catch (err) {
			console.error('Error creating stream:', err);
			error = 'Failed to create stream';
		} finally {
			loading = false;
		}
	}

	async function copyToClipboard(text: string, type: 'key' | 'url', streamId: string) {
		try {
			await navigator.clipboard.writeText(text);
			if (type === 'key') {
				copiedStreamKey = streamId;
				setTimeout(() => (copiedStreamKey = null), 2000);
			} else {
				copiedRtmpUrl = streamId;
				setTimeout(() => (copiedRtmpUrl = null), 2000);
			}
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	async function toggleVisibility(streamId: string, currentVisibility: boolean) {
		loading = true;
		error = '';

		try {
			const response = await fetch(`/api/streams/${streamId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					isVisible: !currentVisibility
				})
			});

			if (!response.ok) {
				throw new Error(`Failed to update stream visibility: ${response.statusText}`);
			}

			await loadStreams(); // Refresh streams
		} catch (err) {
			console.error('Error updating stream visibility:', err);
			error = 'Failed to update stream visibility';
		} finally {
			loading = false;
		}
	}

	async function checkRecordings(streamId: string) {
		try {
			console.log('🎥 Checking recordings for stream:', streamId);
			const response = await fetch(`/api/streams/${streamId}/recordings`);

			if (!response.ok) {
				throw new Error(`Failed to check recordings: ${response.statusText}`);
			}

			const result = await response.json();
			console.log('✅ Recording check result:', result);

			// Reload streams to show updated recording status
			await loadStreams();

			return result;
		} catch (err) {
			console.error('Error checking recordings:', err);
			throw err;
		}
	}

	async function deleteStream(streamId: string) {
		if (!confirm('Are you sure you want to delete this stream? This action cannot be undone.')) {
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await fetch(`/api/streams/${streamId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error(`Failed to delete stream: ${response.statusText}`);
			}

			streams = streams.filter((s) => s.id !== streamId);
		} catch (err) {
			console.error('Error deleting stream:', err);
			error = 'Failed to delete stream';
		} finally {
			loading = false;
		}
	}

	function openCreateModal() {
		showCreateModal = true;
	}

	function closeCreateModal() {
		showCreateModal = false;
		newStreamTitle = '';
		newStreamDescription = '';
		newStreamDate = '';
		newStreamTime = '';
	}
</script>

<svelte:head>
	<title>Stream Management - {memorial.lovedOneName}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
	<div class="container mx-auto px-4 py-8">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="mb-2 text-3xl font-bold text-gray-900">Stream Management</h1>
					<p class="text-gray-600">
						Manage livestreams for <span class="font-semibold">{memorial.lovedOneName}</span>
					</p>
				</div>

				<div class="flex items-center gap-4">
					<a
						href="/{memorial.fullSlug}"
						target="_blank"
						class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
					>
						<Eye class="mr-2 h-4 w-4" />
						View Memorial
					</a>

					<Button
						variant="role"
						role="owner"
						size="md"
						rounded="lg"
						onclick={openCreateModal}
					>
						<Plus class="mr-2 h-4 w-4" />
						Create Stream
					</Button>
				</div>
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

		<!-- Streams Grid -->
		{#if !loading}
			{#if streams.length === 0}
				<!-- Empty State -->
				<div class="py-12 text-center">
					<div
						class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100"
					>
						<Play class="h-12 w-12 text-gray-400" />
					</div>
					<h3 class="mb-2 text-xl font-semibold text-gray-900">No streams yet</h3>
					<p class="mb-6 text-gray-600">Create your first livestream to get started</p>
					<Button
						variant="role"
						role="owner"
						size="md"
						rounded="lg"
						onclick={openCreateModal}
					>
						<Plus class="mr-2 h-4 w-4" />
						Create First Stream
					</Button>
				</div>
			{:else}
				<!-- Streams Grid -->
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each streams as stream (stream.id)}
						{#if stream.status === 'completed'}
							{@const _ = console.log(
								`🎬 [RENDER] Rendering CompletedStreamCard for stream ${stream.id}:`,
								{
									title: stream.title,
									status: stream.status,
									recordingReady: stream.recordingReady,
									recordingPlaybackUrl: stream.recordingPlaybackUrl,
									recordingCount: stream.recordingCount
								}
							)}
							<CompletedStreamCard
								{stream}
								onVisibilityToggle={toggleVisibility}
								onCheckRecordings={checkRecordings}
								canManage={true}
							/>
						{:else}
							{@const _ = console.log(`🎬 [RENDER] Rendering StreamCard for stream ${stream.id}:`, {
								title: stream.title,
								status: stream.status
							})}
							<StreamCard
								{stream}
								onToggleVisibility={toggleVisibility}
								onDelete={deleteStream}
								onCopy={copyToClipboard}
								{copiedStreamKey}
								{copiedRtmpUrl}
							/>
						{/if}
					{/each}
				</div>
			{/if}
		{/if}
	</div>

	<!-- Create Stream Modal -->
	{#if showCreateModal}
		<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
			<div class="w-full max-w-md rounded-xl bg-white shadow-xl">
				<div class="p-6">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">Create New Stream</h2>

					<form
						onsubmit={(e) => {
							e.preventDefault();
							createStream();
						}}
					>
						<div class="mb-4">
							<label for="streamTitle" class="mb-2 block text-sm font-medium text-gray-700">
								Stream Title *
							</label>
							<input
								id="streamTitle"
								type="text"
								bind:value={newStreamTitle}
								placeholder="e.g., Memorial Service"
								class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
								required
							/>
						</div>

						<div class="mb-4">
							<label for="streamDescription" class="mb-2 block text-sm font-medium text-gray-700">
								Description
							</label>
							<textarea
								id="streamDescription"
								bind:value={newStreamDescription}
								placeholder="Optional description for this stream"
								rows="3"
								class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
							></textarea>
						</div>

						<!-- Scheduling Section -->
						<div class="mb-4">
							<h3 class="mb-3 text-sm font-medium text-gray-700">Schedule Stream (Optional)</h3>
							<div class="grid grid-cols-2 gap-3">
								<div>
									<label for="streamDate" class="mb-1 block text-xs font-medium text-gray-600">
										Date
									</label>
									<input
										id="streamDate"
										type="date"
										bind:value={newStreamDate}
										class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500"
									/>
								</div>
								<div>
									<label for="streamTime" class="mb-1 block text-xs font-medium text-gray-600">
										Time
									</label>
									<input
										id="streamTime"
										type="time"
										bind:value={newStreamTime}
										class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500"
									/>
								</div>
							</div>
							<p class="mt-1 text-xs text-gray-500">Leave empty to create an unscheduled stream</p>
						</div>

						<div class="flex items-center justify-end gap-3">
							<Button
								type="button"
								variant="secondary"
								size="md"
								onclick={closeCreateModal}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="role"
								role="owner"
								size="md"
								disabled={!newStreamTitle.trim() || loading}
								loading={loading}
							>
								{loading ? 'Creating...' : 'Create Stream'}
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{/if}
</div>
