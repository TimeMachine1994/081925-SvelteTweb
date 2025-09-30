<script lang="ts">
	import { onMount } from 'svelte';
	import { streamAPI } from '$lib/api/streamClient';
	import type { Stream } from '$lib/types/stream';

	// State
	let streams: Stream[] = $state([]);
	let loading = $state(false);
	let error = $state('');
	
	// Create form state
	let showCreateForm = $state(false);
	let createLoading = $state(false);
	let formData = $state({
		title: '',
		description: '',
		scheduledStartTime: '',
		isPublic: true,
		isVisible: true
	});

	// Filter state
	let statusFilter = $state('all');
	let searchQuery = $state('');

	onMount(() => {
		loadStreams();
	});

	async function loadStreams() {
		loading = true;
		error = '';
		
		try {
			const response = await streamAPI.listStreams();
			streams = response.streams;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load streams';
			console.error('Error loading streams:', err);
		} finally {
			loading = false;
		}
	}

	async function createStream() {
		if (!formData.title.trim()) {
			error = 'Title is required';
			return;
		}

		createLoading = true;
		error = '';

		try {
			const streamData = {
				title: formData.title.trim(),
				description: formData.description.trim(),
				scheduledStartTime: formData.scheduledStartTime || undefined,
				isPublic: formData.isPublic,
				isVisible: formData.isVisible
			};

			const newStream = await streamAPI.createStream(streamData);
			streams = [newStream, ...streams];
			
			// Reset form
			formData = {
				title: '',
				description: '',
				scheduledStartTime: '',
				isPublic: true,
				isVisible: true
			};
			showCreateForm = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create stream';
			console.error('Error creating stream:', err);
		} finally {
			createLoading = false;
		}
	}

	async function startStream(stream: Stream) {
		loading = true;
		error = '';

		try {
			await streamAPI.startStream(stream.id);
			await loadStreams(); // Refresh to get updated status
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to start stream';
			console.error('Error starting stream:', err);
		} finally {
			loading = false;
		}
	}

	async function stopStream(stream: Stream) {
		loading = true;
		error = '';

		try {
			await streamAPI.stopStream(stream.id);
			await loadStreams(); // Refresh to get updated status
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to stop stream';
			console.error('Error stopping stream:', err);
		} finally {
			loading = false;
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'live': return 'bg-red-100 text-red-800 border-red-200';
			case 'ready': return 'bg-green-100 text-green-800 border-green-200';
			case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
			case 'error': return 'bg-red-100 text-red-800 border-red-200';
			default: return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	}

	function formatDate(date: Date | string | null): string {
		if (!date) return 'Not set';
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleString();
	}

	function canStart(stream: Stream): boolean {
		return stream.status === 'ready' || stream.status === 'scheduled';
	}

	function canStop(stream: Stream): boolean {
		return stream.status === 'live';
	}

	// Computed filtered streams
	const filteredStreams = $derived(streams.filter(stream => {
		const matchesStatus = statusFilter === 'all' || stream.status === statusFilter;
		const matchesSearch = !searchQuery || 
			stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			stream.description?.toLowerCase().includes(searchQuery.toLowerCase());
		
		return matchesStatus && matchesSearch;
	}));

	// Get current date/time for scheduling input
	function getCurrentDateTime(): string {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}
</script>

<svelte:head>
	<title>Livestream Management - TributeStream</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Livestream Management</h1>
					<p class="text-gray-600 mt-1">Create, schedule, and manage your livestreams</p>
				</div>
				
				<button 
					onclick={() => showCreateForm = !showCreateForm}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
					disabled={loading || createLoading}
				>
					<span class="text-xl">+</span>
					<span>{showCreateForm ? 'Cancel' : 'Create Stream'}</span>
				</button>
			</div>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{#if error}
			<div class="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
				<div class="flex">
					<div class="text-red-400 mr-3">⚠️</div>
					<div>
						<h3 class="text-sm font-medium text-red-800">Error</h3>
						<p class="mt-1 text-sm text-red-700">{error}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Create Stream Form -->
		{#if showCreateForm}
			<div class="mb-8 bg-white rounded-lg shadow-sm border p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">Create New Stream</h2>
				
				<form onsubmit|preventDefault={createStream} class="space-y-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Stream Title *
							</label>
							<input 
								bind:value={formData.title}
								type="text" 
								placeholder="Enter stream title..."
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								disabled={createLoading}
								required
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Schedule Start Time (optional)
							</label>
							<input 
								bind:value={formData.scheduledStartTime}
								type="datetime-local" 
								min={getCurrentDateTime()}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								disabled={createLoading}
							/>
						</div>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Description (optional)
						</label>
						<textarea 
							bind:value={formData.description}
							placeholder="Enter stream description..."
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							disabled={createLoading}
						></textarea>
					</div>
					
					<div class="flex items-center space-x-6">
						<label class="flex items-center">
							<input 
								bind:checked={formData.isPublic}
								type="checkbox" 
								class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								disabled={createLoading}
							/>
							<span class="ml-2 text-sm text-gray-700">Public (anyone can view)</span>
						</label>
						
						<label class="flex items-center">
							<input 
								bind:checked={formData.isVisible}
								type="checkbox" 
								class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								disabled={createLoading}
							/>
							<span class="ml-2 text-sm text-gray-700">Visible (show in listings)</span>
						</label>
					</div>
					
					<div class="flex items-center space-x-4">
						<button 
							type="submit"
							disabled={createLoading || !formData.title.trim()}
							class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{createLoading ? 'Creating...' : 'Create Stream'}
						</button>
						
						<button 
							type="button"
							onclick={() => showCreateForm = false}
							class="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
							disabled={createLoading}
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		{/if}

		<!-- Filters -->
		<div class="mb-6 bg-white rounded-lg shadow-sm border p-4">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
				<div class="flex items-center space-x-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
						<select 
							bind:value={statusFilter}
							class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="all">All Statuses</option>
							<option value="scheduled">Scheduled</option>
							<option value="ready">Ready</option>
							<option value="live">Live</option>
							<option value="completed">Completed</option>
						</select>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
						<input 
							bind:value={searchQuery}
							type="text" 
							placeholder="Search streams..."
							class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>
				
				<button 
					onclick={loadStreams}
					disabled={loading}
					class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 transition-colors"
				>
					{loading ? 'Refreshing...' : 'Refresh'}
				</button>
			</div>
		</div>

		<!-- Streams List -->
		{#if loading && streams.length === 0}
			<div class="bg-white rounded-lg shadow-sm border p-8">
				<div class="text-center">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p class="text-gray-600">Loading streams...</p>
				</div>
			</div>
		{:else if filteredStreams.length === 0}
			<div class="bg-white rounded-lg shadow-sm border p-8">
				<div class="text-center">
					<div class="text-6xl mb-4">📺</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">No Streams Found</h3>
					<p class="text-gray-600 mb-6">
						{streams.length === 0 
							? "You haven't created any streams yet. Create your first stream to get started!"
							: "No streams match your current filters. Try adjusting your search criteria."
						}
					</p>
					{#if streams.length === 0}
						<button 
							onclick={() => showCreateForm = true}
							class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
						>
							Create Your First Stream
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<div class="grid gap-6">
				{#each filteredStreams as stream (stream.id)}
					<div class="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
						<div class="flex items-start justify-between mb-4">
							<div class="flex-1">
								<div class="flex items-center space-x-3 mb-2">
									<h3 class="text-xl font-semibold text-gray-900">{stream.title}</h3>
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border {getStatusColor(stream.status)}">
										{#if stream.status === 'live'}
											<span class="w-2 h-2 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
										{/if}
										{stream.status.toUpperCase()}
									</span>
								</div>
								
								{#if stream.description}
									<p class="text-gray-600 mb-3">{stream.description}</p>
								{/if}

								<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-500">
									{#if stream.scheduledStartTime}
										<div>
											<span class="font-medium">Scheduled:</span>
											<span class="block">{formatDate(stream.scheduledStartTime)}</span>
										</div>
									{/if}
									
									{#if stream.actualStartTime}
										<div>
											<span class="font-medium">Started:</span>
											<span class="block">{formatDate(stream.actualStartTime)}</span>
										</div>
									{/if}
									
									{#if stream.endTime}
										<div>
											<span class="font-medium">Ended:</span>
											<span class="block">{formatDate(stream.endTime)}</span>
										</div>
									{/if}
									
									<div>
										<span class="font-medium">Created:</span>
										<span class="block">{formatDate(stream.createdAt)}</span>
									</div>
								</div>
							</div>
						</div>

						<div class="flex items-center justify-between pt-4 border-t border-gray-100">
							<div class="flex items-center space-x-4 text-sm">
								<span class="flex items-center">
									<span class="w-2 h-2 rounded-full mr-2 {stream.isPublic ? 'bg-green-500' : 'bg-gray-400'}"></span>
									{stream.isPublic ? 'Public' : 'Private'}
								</span>
								
								<span class="flex items-center">
									<span class="w-2 h-2 rounded-full mr-2 {stream.isVisible ? 'bg-blue-500' : 'bg-gray-400'}"></span>
									{stream.isVisible ? 'Visible' : 'Hidden'}
								</span>
								
								{#if stream.recordingReady}
									<span class="flex items-center text-green-600">
										<span class="w-2 h-2 rounded-full mr-2 bg-green-500"></span>
										Recording Ready
									</span>
								{/if}
							</div>

							<div class="flex items-center space-x-3">
								{#if canStart(stream)}
									<button 
										onclick={() => startStream(stream)}
										disabled={loading}
										class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
									>
										Start Stream
									</button>
								{/if}

								{#if canStop(stream)}
									<button 
										onclick={() => stopStream(stream)}
										disabled={loading}
										class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
									>
										Stop Stream
									</button>
								{/if}

								{#if stream.memorialSlug}
									<a 
										href="/{stream.memorialSlug}"
										class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
									>
										View Memorial
									</a>
								{:else}
									<span class="px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed">
										No Memorial Page
									</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Getting Started Guide -->
		<div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
			<h3 class="text-lg font-semibold text-blue-900 mb-4">📚 Getting Started with Livestreaming</h3>
			
			<div class="grid md:grid-cols-2 gap-6 text-sm">
				<div>
					<h4 class="font-semibold text-blue-800 mb-2">🎯 Quick Start</h4>
					<ol class="space-y-1 text-blue-700 list-decimal list-inside">
						<li>Click "Create Stream" to make a new livestream</li>
						<li>Fill in the title and optional description</li>
						<li>Choose to schedule it or start immediately</li>
						<li>Click "Start Stream" when ready to go live</li>
						<li>Use the provided credentials in your streaming software</li>
					</ol>
				</div>
				
				<div>
					<h4 class="font-semibold text-blue-800 mb-2">⏰ Scheduling Streams</h4>
					<ul class="space-y-1 text-blue-700 list-disc list-inside">
						<li>Set a future date/time when creating the stream</li>
						<li>Scheduled streams show as "Scheduled" status</li>
						<li>You can start them early if needed</li>
						<li>Perfect for memorial services and events</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>
