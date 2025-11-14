<script lang="ts">
	import type { Stream, StreamArmType } from '$lib/types/stream';
	import { Video, Eye, EyeOff, Archive, StopCircle, Copy, Check, ChevronDown, Calendar, ExternalLink } from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';

	let { stream, canManage, memorialId }: { stream: Stream; canManage: boolean; memorialId: string } = $props();

	let loading = $state(false);
	let copiedWhip = $state(false);
	let copiedRtmp = $state(false);
	let copiedStreamKey = $state(false);
	let selectedArmType = $state<StreamArmType>('mobile_input');
	let showArmDropdown = $state(false);
	let showEditTime = $state(false);
	let editedStartTime = $state('');

	// Live stream detection
	let isStreamingLive = $state(false);
	let liveWatchUrl = $state<string | null>(null);
	let checkingLive = $state(false);
	let liveCheckInterval: NodeJS.Timeout | null = null;

	// Status badge styling
	const statusColor = $derived({
		ready: 'bg-green-100 text-green-800',
		scheduled: 'bg-blue-100 text-blue-800',
		live: 'bg-red-100 text-red-800 animate-pulse',
		completed: 'bg-gray-100 text-gray-800',
		error: 'bg-red-100 text-red-800'
	}[stream.status]);

	const visibilityIcon = $derived({
		public: Eye,
		hidden: EyeOff,
		archived: Archive
	}[stream.visibility || 'public']);

	async function handleStop() {
		if (!confirm('Are you sure you want to stop this stream?')) return;

		loading = true;
		try {
			const response = await fetch(`/api/streams/${stream.id}/stop`, {
				method: 'POST'
			});

			if (response.ok) {
				window.location.reload();
			} else {
				alert('Failed to stop stream');
			}
		} catch (error) {
			console.error('Error stopping stream:', error);
			alert('Failed to stop stream');
		} finally {
			loading = false;
		}
	}

	async function handleVisibilityToggle() {
		const currentVisibility = stream.visibility || 'public';
		const newVisibility =
			currentVisibility === 'public'
				? 'hidden'
				: currentVisibility === 'hidden'
					? 'archived'
					: 'public';

		loading = true;
		try {
			const response = await fetch(`/api/streams/${stream.id}/visibility`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ visibility: newVisibility })
			});

			if (response.ok) {
				window.location.reload();
			} else {
				alert('Failed to update visibility');
			}
		} catch (error) {
			console.error('Error updating visibility:', error);
			alert('Failed to update visibility');
		} finally {
			loading = false;
		}
	}

	async function copyToClipboard(text: string, type: 'whip' | 'rtmp' | 'streamKey') {
		try {
			await navigator.clipboard.writeText(text);
			if (type === 'whip') {
				copiedWhip = true;
				setTimeout(() => (copiedWhip = false), 2000);
			} else if (type === 'rtmp') {
				copiedRtmp = true;
				setTimeout(() => (copiedRtmp = false), 2000);
			} else if (type === 'streamKey') {
				copiedStreamKey = true;
				setTimeout(() => (copiedStreamKey = false), 2000);
			}
		} catch (error) {
			console.error('Failed to copy:', error);
		}
	}

	async function handleArm() {
		console.log('🎯 Arming stream with type:', selectedArmType);
		
		if (!confirm(`Arm this stream for ${selectedArmType.replace(/_/g, ' ')}?`)) {
			console.log('❌ User cancelled arm');
			return;
		}

		loading = true;
		try {
			console.log('📡 Calling arm API:', `/api/streams/${stream.id}/arm`);
			const response = await fetch(`/api/streams/${stream.id}/arm`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ armType: selectedArmType })
			});

			console.log('📥 Response status:', response.status);
			const data = await response.json();
			console.log('📥 Response data:', data);

			if (response.ok) {
				console.log('✅ Stream armed successfully, reloading...');
				window.location.reload();
			} else {
				console.error('❌ Failed to arm stream:', data);
				alert(`Failed to arm stream: ${data.error || data.message || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('❌ Error arming stream:', error);
			alert(`Failed to arm stream: ${error}`);
		} finally {
			loading = false;
		}
	}

	function getArmTypeLabel(armType: StreamArmType): string {
		return {
			mobile_input: 'Mobile Input',
			mobile_streaming: 'Mobile Streaming',
			stream_key: 'Stream Key'
		}[armType];
	}

	function openEditTime() {
		// Format existing time for datetime-local input
		if (stream.scheduledStartTime) {
			const date = new Date(stream.scheduledStartTime);
			// Format as YYYY-MM-DDTHH:MM for datetime-local input
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const hours = String(date.getHours()).padStart(2, '0');
			const minutes = String(date.getMinutes()).padStart(2, '0');
			editedStartTime = `${year}-${month}-${day}T${hours}:${minutes}`;
		}
		showEditTime = true;
	}

	async function handleUpdateTime() {
		if (!editedStartTime) {
			alert('Please select a date and time');
			return;
		}

		loading = true;
		try {
			const response = await fetch(`/api/streams/${stream.id}/schedule`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					scheduledStartTime: new Date(editedStartTime).toISOString()
				})
			});

			if (response.ok) {
				showEditTime = false;
				window.location.reload();
			} else {
				const data = await response.json();
				alert(`Failed to update time: ${data.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error updating time:', error);
			alert('Failed to update time');
		} finally {
			loading = false;
		}
	}

	async function checkIfLive() {
		if (checkingLive) return; // Prevent overlapping checks
		
		checkingLive = true;
		try {
			const response = await fetch(`/api/streams/${stream.id}/check-live`);
			if (response.ok) {
				const data = await response.json();
				isStreamingLive = data.isLive;
				liveWatchUrl = data.watchUrl || null;
				
				if (data.isLive) {
					console.log('🔴 [StreamCard] Stream is LIVE!', stream.id);
				} else {
					console.log('📴 [StreamCard] Stream is NOT live', stream.id);
				}
			}
		} catch (error) {
			console.error('❌ [StreamCard] Error checking if live:', error);
		} finally {
			checkingLive = false;
		}
	}

	function openStream() {
		if (liveWatchUrl) {
			window.open(liveWatchUrl, '_blank');
		}
	}

	// Check if stream is live on mount and periodically
	onMount(() => {
		// Only check if stream is armed with stream key (OBS)
		if (stream.armStatus?.isArmed && stream.armStatus.armType === 'stream_key') {
			checkIfLive(); // Initial check
			
			// Check every 15 seconds
			liveCheckInterval = setInterval(checkIfLive, 15000);
		}
	});

	onDestroy(() => {
		if (liveCheckInterval) {
			clearInterval(liveCheckInterval);
		}
	});
</script>

<div
	class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg transition-all duration-300 hover:shadow-xl"
>
	<!-- Header -->
	<div class="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<div class="flex items-center gap-3">
					<h2 class="text-xl font-semibold text-gray-900">{stream.title}</h2>
					<span class="rounded-full px-3 py-1 text-xs font-medium {statusColor}">
						{stream.status.toUpperCase()}
					</span>
					{#if stream.armStatus?.isArmed}
						<span class="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
							ARMED: {getArmTypeLabel(stream.armStatus.armType!)}
						</span>
					{/if}
				</div>
				{#if stream.description}
					<p class="mt-1 text-sm text-gray-600">{stream.description}</p>
				{/if}
				{#if stream.scheduledStartTime}
					<p class="mt-2 text-xs text-gray-500">
						Scheduled: {new Date(stream.scheduledStartTime).toLocaleString()}
					</p>
				{/if}
				<p class="mt-1 text-xs text-gray-500">
					Created {new Date(stream.createdAt).toLocaleDateString()}
				</p>
			</div>

			{#if canManage}
				<div class="flex items-center gap-2">
					<svelte:component
						this={visibilityIcon}
						class="h-5 w-5 {(stream.visibility || 'public') === 'public'
							? 'text-green-600'
							: 'text-gray-400'}"
					/>
				</div>
			{/if}
		</div>
	</div>

	<!-- Body -->
	<div class="p-6">
		<div class="space-y-4">
			<!-- Arming Controls (Admin Only) -->
			{#if canManage && !stream.armStatus?.isArmed}
				<div class="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
					<h3 class="mb-3 text-sm font-semibold text-purple-900">Arm Stream</h3>
					<div class="flex items-center gap-2">
						<div class="relative flex-1">
							<button
								on:click={() => (showArmDropdown = !showArmDropdown)}
								class="flex w-full items-center justify-between rounded-lg border border-purple-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-purple-50"
							>
								<span>{getArmTypeLabel(selectedArmType)}</span>
								<ChevronDown class="h-4 w-4" />
							</button>
							{#if showArmDropdown}
								<div
									class="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg"
								>
									<button
										on:click={() => {
											selectedArmType = 'mobile_input';
											showArmDropdown = false;
										}}
										class="block w-full px-4 py-2 text-left text-sm hover:bg-purple-50"
									>
										Mobile Input
									</button>
									<button
										on:click={() => {
											selectedArmType = 'mobile_streaming';
											showArmDropdown = false;
										}}
										class="block w-full px-4 py-2 text-left text-sm hover:bg-purple-50"
									>
										Mobile Streaming
									</button>
									<button
										on:click={() => {
											selectedArmType = 'stream_key';
											showArmDropdown = false;
										}}
										class="block w-full px-4 py-2 text-left text-sm hover:bg-purple-50"
									>
										Stream Key
									</button>
								</div>
							{/if}
						</div>
						<button
							on:click={handleArm}
							disabled={loading}
							class="rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
						>
							Arm
						</button>
					</div>
				</div>
			{/if}

			<!-- Stream Credentials (When Armed) -->
			{#if stream.armStatus?.isArmed}
				<!-- WHIP URL (Mobile Input & Mobile Streaming) -->
				{#if (stream.armStatus.armType === 'mobile_input' || stream.armStatus.armType === 'mobile_streaming') && stream.streamCredentials?.whipUrl}
					<div class="rounded-lg bg-blue-50 p-4">
						<h3 class="mb-2 text-sm font-semibold text-blue-900">Browser Streaming URL (WHIP)</h3>
						<div class="flex items-center gap-2">
							<code class="flex-1 truncate rounded bg-white px-3 py-2 text-xs text-blue-800">
								{stream.streamCredentials.whipUrl}
							</code>
							<button
								on:click={() => copyToClipboard(stream.streamCredentials!.whipUrl!, 'whip')}
								class="rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700"
								title="Copy WHIP URL"
							>
								{#if copiedWhip}
									<Check class="h-4 w-4" />
								{:else}
									<Copy class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</div>
				{/if}

				<!-- RTMP Credentials (Stream Key) -->
				{#if stream.armStatus.armType === 'stream_key' && stream.streamCredentials?.rtmpUrl}
					<div class="rounded-lg bg-green-50 p-4">
						<h3 class="mb-3 text-sm font-semibold text-green-900">OBS Streaming Credentials</h3>
						
						<div class="mb-3">
							<label class="mb-1 block text-xs font-medium text-green-800">RTMP URL</label>
							<div class="flex items-center gap-2">
								<code class="flex-1 truncate rounded bg-white px-3 py-2 text-xs text-green-800">
									{stream.streamCredentials.rtmpUrl}
								</code>
								<button
									on:click={() => copyToClipboard(stream.streamCredentials!.rtmpUrl!, 'rtmp')}
									class="rounded-lg bg-green-600 p-2 text-white transition-colors hover:bg-green-700"
									title="Copy RTMP URL"
								>
									{#if copiedRtmp}
										<Check class="h-4 w-4" />
									{:else}
										<Copy class="h-4 w-4" />
									{/if}
								</button>
							</div>
						</div>

						<div>
							<label class="mb-1 block text-xs font-medium text-green-800">Stream Key</label>
							<div class="flex items-center gap-2">
								<code class="flex-1 truncate rounded bg-white px-3 py-2 text-xs text-green-800">
									{stream.streamCredentials.streamKey}
								</code>
								<button
									on:click={() => copyToClipboard(stream.streamCredentials!.streamKey!, 'streamKey')}
									class="rounded-lg bg-green-600 p-2 text-white transition-colors hover:bg-green-700"
									title="Copy Stream Key"
								>
									{#if copiedStreamKey}
										<Check class="h-4 w-4" />
									{:else}
										<Copy class="h-4 w-4" />
									{/if}
								</button>
							</div>
						</div>

						<p class="mt-3 text-xs text-green-700">
							Use these credentials in OBS Studio or any RTMP encoder to start streaming.
						</p>
					</div>
				{/if}
			{/if}

			<!-- Status Info -->
			{#if stream.status === 'live'}
				<div class="rounded-lg bg-red-50 p-4">
					<p class="text-sm text-red-800">
						🔴 <strong>Live Now</strong> - Stream is currently broadcasting
					</p>
				</div>
			{:else if stream.status === 'completed'}
				<div class="rounded-lg bg-green-50 p-4">
					<p class="text-sm text-green-800">
						✅ <strong>Recording Available</strong> - Stream has been saved and is ready for playback
					</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Footer Actions -->
	{#if canManage}
		<div class="border-t border-gray-100 bg-gray-50 px-6 py-4">
			<div class="flex flex-wrap gap-3">
				{#if isStreamingLive && liveWatchUrl}
					<button
						on:click={openStream}
						class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
					>
						<ExternalLink class="h-4 w-4" />
						Open Stream
					</button>
				{/if}

				{#if stream.status === 'live'}
					<button
						on:click={handleStop}
						disabled={loading}
						class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
					>
						<StopCircle class="h-4 w-4" />
						Stop Stream
					</button>
				{/if}

				{#if stream.scheduledStartTime}
					<button
						on:click={openEditTime}
						disabled={loading}
						class="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
					>
						<Calendar class="h-4 w-4" />
						Edit Start Time
					</button>
				{/if}
				{#if (stream.visibility || 'public') !== 'archived'}
					<button
						on:click={handleVisibilityToggle}
						disabled={loading}
						class="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
					>
						<svelte:component this={visibilityIcon} class="h-4 w-4" />
						{(stream.visibility || 'public') === 'public' ? 'Hide' : (stream.visibility || 'public') === 'hidden' ? 'Archive' : 'Show'}
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Edit Start Time Modal -->
{#if showEditTime}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" on:click={() => (showEditTime = false)}>
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" on:click|stopPropagation>
			<h3 class="mb-4 text-lg font-semibold text-gray-900">Edit Start Time</h3>
			
			<div class="mb-4">
				<label for="start-time" class="mb-2 block text-sm font-medium text-gray-700">
					Scheduled Start Time
				</label>
				<input
					id="start-time"
					type="datetime-local"
					bind:value={editedStartTime}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div class="flex gap-3">
				<button
					on:click={handleUpdateTime}
					disabled={loading}
					class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
				>
					{loading ? 'Updating...' : 'Update'}
				</button>
				<button
					on:click={() => (showEditTime = false)}
					disabled={loading}
					class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
