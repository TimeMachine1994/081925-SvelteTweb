<script lang="ts">
	import { onMount } from 'svelte';
	import { Play, Square, Users, Eye, Settings, AlertCircle } from 'lucide-svelte';

	let {
		memorialId,
		memorialName = 'Memorial Service',
		showTitle = true
	}: {
		memorialId: string;
		memorialName?: string;
		showTitle?: boolean;
	} = $props();

	let livestreamStatus = $state({
		isActive: false,
		startedAt: null,
		streamUrl: null,
		playbackUrl: null,
		currentSession: null,
		permissions: {
			canStart: false,
			canStop: false,
			canModerate: false
		}
	});

	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let streamTitle = $state(memorialName);
	let streamDescription = $state('');
	let showStartDialog = $state(false);

	console.log('📺 LivestreamControl initialized for memorial:', memorialId);

	onMount(() => {
		loadLivestreamStatus();
		// Poll for status updates every 30 seconds
		const interval = setInterval(loadLivestreamStatus, 30000);
		return () => clearInterval(interval);
	});

	async function loadLivestreamStatus() {
		try {
			const response = await fetch(`/api/memorials/${memorialId}/livestream`);
			const result = await response.json();

			if (response.ok && result.success) {
				livestreamStatus = result.livestream;
				console.log('📊 Livestream status loaded:', livestreamStatus);
			} else {
				console.error('❌ Failed to load livestream status:', result.error);
			}
		} catch (err) {
			console.error('💥 Error loading livestream status:', err);
		}
	}

	async function startLivestream() {
		if (!streamTitle.trim()) {
			error = 'Please enter a stream title';
			return;
		}

		isLoading = true;
		error = null;

		try {
			const response = await fetch(`/api/memorials/${memorialId}/livestream`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					streamTitle: streamTitle.trim(),
					streamDescription: streamDescription.trim()
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				console.log('✅ Livestream started successfully:', result);
				showStartDialog = false;
				await loadLivestreamStatus();
			} else {
				error = result.error || 'Failed to start livestream';
				console.error('❌ Failed to start livestream:', result);
			}
		} catch (err) {
			error = 'Network error. Please try again.';
			console.error('💥 Error starting livestream:', err);
		} finally {
			isLoading = false;
		}
	}

	async function stopLivestream() {
		if (!confirm('Are you sure you want to stop the livestream? This action cannot be undone.')) {
			return;
		}

		isLoading = true;
		error = null;

		try {
			const response = await fetch(`/api/memorials/${memorialId}/livestream`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (response.ok && result.success) {
				console.log('✅ Livestream stopped successfully');
				await loadLivestreamStatus();
			} else {
				error = result.error || 'Failed to stop livestream';
				console.error('❌ Failed to stop livestream:', result);
			}
		} catch (err) {
			error = 'Network error. Please try again.';
			console.error('💥 Error stopping livestream:', err);
		} finally {
			isLoading = false;
		}
	}

	function openStartDialog() {
		streamTitle = memorialName;
		streamDescription = '';
		error = null;
		showStartDialog = true;
	}

	function closeStartDialog() {
		showStartDialog = false;
		error = null;
	}

	function copyStreamUrl() {
		if (livestreamStatus.playbackUrl) {
			navigator.clipboard.writeText(livestreamStatus.playbackUrl);
			// Could show a toast notification here
		}
	}
</script>

<div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
	{#if showTitle}
		<div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
			<div class="flex items-center space-x-3">
				<div class="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
					{#if livestreamStatus.isActive}
						<div class="w-3 h-3 bg-white rounded-full animate-pulse"></div>
					{:else}
						<Play class="w-5 h-5 text-white" />
					{/if}
				</div>
				<div>
					<h3 class="text-lg font-semibold text-gray-900">Livestream Control</h3>
					<p class="text-sm text-gray-600">
						{#if livestreamStatus.isActive}
							<span class="text-red-600 font-medium">● LIVE</span> - Stream is active
						{:else}
							Stream is offline
						{/if}
					</p>
				</div>
			</div>
		</div>
	{/if}

	<div class="p-6">
		{#if error}
			<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
				<AlertCircle class="w-5 h-5 text-red-500" />
				<span class="text-red-700 text-sm">{error}</span>
			</div>
		{/if}

		{#if livestreamStatus.isActive}
			<!-- Active Stream Status -->
			<div class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="bg-green-50 border border-green-200 rounded-lg p-4">
						<div class="flex items-center space-x-2 mb-2">
							<div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
							<span class="text-green-800 font-medium text-sm">LIVE NOW</span>
						</div>
						<p class="text-green-700 text-sm">
							Started: {livestreamStatus.startedAt ? new Date(livestreamStatus.startedAt).toLocaleString() : 'Unknown'}
						</p>
					</div>

					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<div class="flex items-center space-x-2 mb-2">
							<Users class="w-4 h-4 text-blue-600" />
							<span class="text-blue-800 font-medium text-sm">Viewers</span>
						</div>
						<p class="text-blue-700 text-sm">
							Current: {livestreamStatus.currentSession?.viewerCount || 0}
						</p>
					</div>
				</div>

				{#if livestreamStatus.playbackUrl}
					<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
						<div class="flex items-center justify-between mb-2">
							<span class="text-gray-800 font-medium text-sm">Stream URL</span>
							<button 
								onclick={copyStreamUrl}
								class="text-blue-600 hover:text-blue-700 text-sm font-medium"
							>
								Copy Link
							</button>
						</div>
						<p class="text-gray-600 text-xs font-mono bg-white p-2 rounded border break-all">
							{livestreamStatus.playbackUrl}
						</p>
					</div>
				{/if}

				{#if livestreamStatus.permissions.canStop}
					<div class="flex space-x-3">
						<button
							onclick={stopLivestream}
							disabled={isLoading}
							class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
						>
							{#if isLoading}
								<div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
								<span>Stopping...</span>
							{:else}
								<Square class="w-4 h-4" />
								<span>Stop Stream</span>
							{/if}
						</button>

						{#if livestreamStatus.permissions.canModerate}
							<button class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2">
								<Settings class="w-4 h-4" />
								<span>Settings</span>
							</button>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<!-- Offline State -->
			<div class="text-center py-8">
				<div class="text-gray-400 text-5xl mb-4">📺</div>
				<h4 class="text-lg font-medium text-gray-900 mb-2">Stream Offline</h4>
				<p class="text-gray-600 mb-6">Ready to start your memorial livestream</p>

				{#if livestreamStatus.permissions.canStart}
					<button
						onclick={openStartDialog}
						disabled={isLoading}
						class="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto transition-all duration-300 hover:scale-105"
					>
						{#if isLoading}
							<div class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
							<span>Starting...</span>
						{:else}
							<Play class="w-5 h-5" />
							<span>Start Livestream</span>
						{/if}
					</button>
				{:else}
					<div class="text-sm text-gray-500">
						You don't have permission to start livestreams for this memorial
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Start Stream Dialog -->
{#if showStartDialog}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl shadow-2xl max-w-md w-full">
			<div class="px-6 py-4 border-b border-gray-200">
				<h3 class="text-lg font-semibold text-gray-900">Start Livestream</h3>
				<p class="text-sm text-gray-600">Configure your memorial livestream</p>
			</div>

			<div class="p-6 space-y-4">
				<div>
					<label for="streamTitle" class="block text-sm font-medium text-gray-700 mb-2">
						Stream Title *
					</label>
					<input
						id="streamTitle"
						type="text"
						bind:value={streamTitle}
						placeholder="Enter stream title"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
					/>
				</div>

				<div>
					<label for="streamDescription" class="block text-sm font-medium text-gray-700 mb-2">
						Description (Optional)
					</label>
					<textarea
						id="streamDescription"
						bind:value={streamDescription}
						placeholder="Enter stream description"
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
					></textarea>
				</div>

				{#if error}
					<div class="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
						<AlertCircle class="w-4 h-4 text-red-500" />
						<span class="text-red-700 text-sm">{error}</span>
					</div>
				{/if}
			</div>

			<div class="px-6 py-4 border-t border-gray-200 flex space-x-3">
				<button
					onclick={closeStartDialog}
					disabled={isLoading}
					class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					Cancel
				</button>
				<button
					onclick={startLivestream}
					disabled={isLoading || !streamTitle.trim()}
					class="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
				>
					{#if isLoading}
						<div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
						<span>Starting...</span>
					{:else}
						<Play class="w-4 h-4" />
						<span>Start Stream</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
