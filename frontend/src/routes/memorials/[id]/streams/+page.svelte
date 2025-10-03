<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Plus, Play, Square, Eye, EyeOff, Calendar, MapPin, Clock, Users, Settings, Trash2 } from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { Stream } from '$lib/types/stream';

	let { data }: { data: PageData } = $props();

	let streams = $state<Stream[]>([]);
	let loading = $state(false);
	let error = $state('');
	let showCreateModal = $state(false);
	let newStreamTitle = $state('');
	let newStreamDescription = $state('');
	let newStreamDate = $state('');
	let newStreamTime = $state('');

	const memorial = data.memorial;
	const memorialId = memorial.id;

	// Load streams on mount
	onMount(async () => {
		await loadStreams();
	});

	async function loadStreams() {
		loading = true;
		error = '';
		
		try {
			const response = await fetch(`/api/memorials/${memorialId}/streams`);
			if (!response.ok) {
				throw new Error(`Failed to load streams: ${response.statusText}`);
			}
			
			const result = await response.json();
			streams = (result.streams || []) as Stream[];
		} catch (err) {
			console.error('Error loading streams:', err);
			error = 'Failed to load streams';
		} finally {
			loading = false;
		}
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

	async function startStream(streamId: string) {
		loading = true;
		error = '';
		
		try {
			const response = await fetch(`/api/streams/${streamId}/start`, {
				method: 'POST'
			});

			if (!response.ok) {
				throw new Error(`Failed to start stream: ${response.statusText}`);
			}

			await loadStreams(); // Refresh streams
		} catch (err) {
			console.error('Error starting stream:', err);
			error = 'Failed to start stream';
		} finally {
			loading = false;
		}
	}

	async function stopStream(streamId: string) {
		loading = true;
		error = '';
		
		try {
			const response = await fetch(`/api/streams/${streamId}/stop`, {
				method: 'POST'
			});

			if (!response.ok) {
				throw new Error(`Failed to stop stream: ${response.statusText}`);
			}

			await loadStreams(); // Refresh streams
		} catch (err) {
			console.error('Error stopping stream:', err);
			error = 'Failed to stop stream';
		} finally {
			loading = false;
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

			streams = streams.filter(s => s.id !== streamId);
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
					<h1 class="text-3xl font-bold text-gray-900 mb-2">
						Stream Management
					</h1>
					<p class="text-gray-600">
						Manage livestreams for <span class="font-semibold">{memorial.lovedOneName}</span>
					</p>
				</div>
				
				<div class="flex items-center gap-4">
					<a 
						href="/{memorial.fullSlug}" 
						target="_blank"
						class="inline-flex items-center px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
					>
						<Eye class="w-4 h-4 mr-2" />
						View Memorial
					</a>
					
					<button 
						onclick={openCreateModal}
						class="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
					>
						<Plus class="w-4 h-4 mr-2" />
						Create Stream
					</button>
				</div>
			</div>
		</div>

		<!-- Error Message -->
		{#if error}
			<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
				<p class="text-red-800">{error}</p>
			</div>
		{/if}

		<!-- Loading State -->
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
				<span class="ml-3 text-gray-600">Loading streams...</span>
			</div>
		{/if}

		<!-- Streams Grid -->
		{#if !loading}
			{#if streams.length === 0}
				<!-- Empty State -->
				<div class="text-center py-12">
					<div class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
						<Play class="w-12 h-12 text-gray-400" />
					</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-2">No streams yet</h3>
					<p class="text-gray-600 mb-6">Create your first livestream to get started</p>
					<button 
						onclick={openCreateModal}
						class="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
					>
						<Plus class="w-4 h-4 mr-2" />
						Create First Stream
					</button>
				</div>
			{:else}
				<!-- Streams Grid -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each streams as stream (stream.id)}
						<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
							<!-- Stream Header -->
							<div class="p-6 border-b border-gray-100">
								<div class="flex items-start justify-between mb-3">
									<h3 class="text-lg font-semibold text-gray-900 truncate">
										{stream.title}
									</h3>
									<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(stream.status)}">
										{getStatusText(stream.status)}
									</span>
								</div>
								
								{#if stream.description}
									<p class="text-gray-600 text-sm mb-4 line-clamp-2">
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

							<!-- Stream Actions -->
							<div class="p-4 bg-gray-50">
								<div class="flex items-center justify-between">
									<!-- Control Buttons -->
									<div class="flex items-center gap-2">
										{#if stream.status === 'ready' || stream.status === 'scheduled'}
											<button
												onclick={() => startStream(stream.id)}
												class="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
											>
												<Play class="w-4 h-4 mr-1" />
												Start
											</button>
										{:else if stream.status === 'live'}
											<button
												onclick={() => stopStream(stream.id)}
												class="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
											>
												<Square class="w-4 h-4 mr-1" />
												Stop
											</button>
										{/if}
									</div>

									<!-- Utility Buttons -->
									<div class="flex items-center gap-1">
										<!-- Visibility Toggle -->
										<button
											onclick={() => toggleVisibility(stream.id, stream.isVisible)}
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
											onclick={() => deleteStream(stream.id)}
											class="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
											title="Delete stream"
										>
											<Trash2 class="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Create Stream Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-xl shadow-xl max-w-md w-full">
			<div class="p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Create New Stream</h2>
				
				<form onsubmit={(e) => { e.preventDefault(); createStream(); }}>
					<div class="mb-4">
						<label for="streamTitle" class="block text-sm font-medium text-gray-700 mb-2">
							Stream Title *
						</label>
						<input
							id="streamTitle"
							type="text"
							bind:value={newStreamTitle}
							placeholder="e.g., Memorial Service"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							required
						/>
					</div>
					
					<div class="mb-4">
						<label for="streamDescription" class="block text-sm font-medium text-gray-700 mb-2">
							Description
						</label>
						<textarea
							id="streamDescription"
							bind:value={newStreamDescription}
							placeholder="Optional description for this stream"
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
						></textarea>
					</div>
					
					<!-- Scheduling Section -->
					<div class="mb-4">
						<h3 class="text-sm font-medium text-gray-700 mb-3">Schedule Stream (Optional)</h3>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label for="streamDate" class="block text-xs font-medium text-gray-600 mb-1">
									Date
								</label>
								<input
									id="streamDate"
									type="date"
									bind:value={newStreamDate}
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
								/>
							</div>
							<div>
								<label for="streamTime" class="block text-xs font-medium text-gray-600 mb-1">
									Time
								</label>
								<input
									id="streamTime"
									type="time"
									bind:value={newStreamTime}
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
								/>
							</div>
						</div>
						<p class="text-xs text-gray-500 mt-1">Leave empty to create an unscheduled stream</p>
					</div>
					
					<div class="flex items-center justify-end gap-3">
						<button
							type="button"
							onclick={closeCreateModal}
							class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!newStreamTitle.trim() || loading}
							class="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? 'Creating...' : 'Create Stream'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
