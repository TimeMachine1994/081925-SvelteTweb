<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, Video, MapPin, Calendar, Users, Radio } from 'lucide-svelte';
	
	export let data;
	
	let creating = false;
	let errorMessage = '';
	
	async function startStream(memorialId: string, memorialName: string) {
		if (creating) return;
		
		const confirmed = confirm(`Start livestream for ${memorialName}?`);
		if (!confirmed) return;
		
		creating = true;
		errorMessage = '';
		
		try {
			const response = await fetch('/api/funeral-director/stream/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ memorialId })
			});
			
			const result = await response.json();
			
			if (!response.ok) {
				throw new Error(result.message || 'Failed to create stream');
			}
			
			goto(`/funeral-director/stream/${result.streamId}`);
		} catch (error: any) {
			console.error('Error creating stream:', error);
			errorMessage = error.message || 'Failed to create stream';
		} finally {
			creating = false;
		}
	}
	
	function formatDate(dateStr: string | null): string {
		if (!dateStr) return 'Date TBD';
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { 
			weekday: 'short',
			month: 'short', 
			day: 'numeric',
			year: 'numeric'
		});
	}
	
	function formatTime(timeStr: string | null): string {
		if (!timeStr) return 'Time TBD';
		return timeStr;
	}
	
	function isToday(dateStr: string | null): boolean {
		if (!dateStr) return false;
		const date = new Date(dateStr);
		const today = new Date();
		return date.toDateString() === today.toDateString();
	}
</script>

<svelte:head>
	<title>Livestream Manager - Funeral Director</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50">
	<div class="max-w-7xl mx-auto px-4 py-8">
		<!-- Header -->
		<div class="mb-8">
			<a 
				href="/funeral-director/dashboard"
				class="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-4"
			>
				<ArrowLeft class="w-4 h-4" />
				Back to Dashboard
			</a>
			
			<div class="flex items-center gap-3 mb-2">
				<div class="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
					<Video class="w-6 h-6 text-white" />
				</div>
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Livestream Manager</h1>
					<p class="text-gray-600">Select a memorial to start streaming</p>
				</div>
			</div>
		</div>

		{#if errorMessage}
			<div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6">
				<p class="font-medium">Error: {errorMessage}</p>
			</div>
		{/if}

		{#if data.memorials.length === 0}
			<div class="bg-white rounded-2xl shadow-lg p-12 text-center">
				<Video class="w-16 h-16 text-gray-400 mx-auto mb-4" />
				<h2 class="text-2xl font-bold text-gray-900 mb-2">No Memorials Found</h2>
				<p class="text-gray-600 mb-6">
					You don't have any memorials to stream to yet.
				</p>
				<a 
					href="/register/funeral-director"
					class="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all"
				>
					Create Memorial
				</a>
			</div>
		{:else}
			<!-- Memorials Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each data.memorials as memorial}
					<div class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
						<!-- Status Badge -->
						{#if memorial.hasActiveStream}
							<div class="bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-2">
								<span class="relative flex h-3 w-3">
									<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
									<span class="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
								</span>
								<span class="font-bold text-sm">LIVE NOW</span>
							</div>
						{:else if memorial.upcomingService && isToday(memorial.services.main.time.date)}
							<div class="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 flex items-center justify-center gap-2">
								<Calendar class="w-4 h-4" />
								<span class="font-bold text-sm">UPCOMING TODAY</span>
							</div>
						{:else if memorial.upcomingService}
							<div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 flex items-center justify-center gap-2">
								<Calendar class="w-4 h-4" />
								<span class="font-bold text-sm">UPCOMING SERVICE</span>
							</div>
						{/if}

						<!-- Content -->
						<div class="p-6">
							<h3 class="text-xl font-bold text-gray-900 mb-3">
								In Memory of {memorial.lovedOneName}
							</h3>

							<!-- Service Details -->
							<div class="space-y-2 mb-6">
								<div class="flex items-start gap-2 text-sm text-gray-600">
									<Calendar class="w-4 h-4 mt-0.5 flex-shrink-0" />
									<div>
										<div class="font-medium">{formatDate(memorial.services.main.time.date)}</div>
										<div>{formatTime(memorial.services.main.time.time)}</div>
									</div>
								</div>
								
								<div class="flex items-start gap-2 text-sm text-gray-600">
									<MapPin class="w-4 h-4 mt-0.5 flex-shrink-0" />
									<div>
										<div class="font-medium">{memorial.services.main.location.name}</div>
										{#if memorial.services.main.location.address}
											<div class="text-xs">{memorial.services.main.location.address}</div>
										{/if}
									</div>
								</div>
							</div>

							<!-- Action Button -->
							{#if memorial.hasActiveStream}
								<a
									href="/funeral-director/stream/{memorial.activeStreamId}"
									class="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-red-600 hover:to-red-700 transition-all"
								>
									<Radio class="w-5 h-5" />
									View Stream Controls
								</a>
							{:else}
								<button
									onclick={() => startStream(memorial.id, memorial.lovedOneName)}
									disabled={creating}
									class="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
								>
									<Video class="w-5 h-5" />
									{creating ? 'Starting...' : 'Start Livestream'}
								</button>
							{/if}

							<!-- View Memorial Link -->
							<a
								href="/{memorial.fullSlug}"
								target="_blank"
								class="block text-center text-sm text-amber-600 hover:text-amber-700 mt-3"
							>
								View Memorial Page →
							</a>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
