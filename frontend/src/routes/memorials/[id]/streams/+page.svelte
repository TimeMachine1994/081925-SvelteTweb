<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import UnifiedStreamControl from '$lib/components/UnifiedStreamControl.svelte';

	// Get data from server-side load function
	let { data } = $props();
	
	// Get memorial ID from URL params
	const memorialId = $page.params.id;
	
	// Use server-side loaded data
	let memorial = $state(data.memorial);
	let loading = $state(false);
	let error = $state('');

	onMount(() => {
		console.log('🎬 [MEMORIAL_STREAMS] Page mounted with memorial:', {
			id: memorial?.id,
			lovedOneName: memorial?.lovedOneName,
			slug: memorial?.slug,
			livestreamEnabled: memorial?.livestreamEnabled,
			ownerUid: memorial?.ownerUid,
			funeralDirectorUid: memorial?.funeralDirectorUid,
			timestamp: new Date().toISOString()
		});
		console.log('📺 [MEMORIAL_STREAMS] Memorial ID from params:', memorialId);
		console.log('🔧 [MEMORIAL_STREAMS] Component props:', {
			showCreateForm: true,
			showPublicStreams: false
		});
		
		if (!memorial) {
			error = 'Memorial not found';
			console.error('❌ [MEMORIAL_STREAMS] No memorial data provided');
		} else {
			console.log('✅ [MEMORIAL_STREAMS] Memorial data loaded successfully, initializing UnifiedStreamControl');
		}
	});
</script>

<svelte:head>
	<title>{memorial?.lovedOneName ? `${memorial.lovedOneName} - Stream Management` : 'Stream Management'}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="flex items-center justify-between">
				<div>
					<nav class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
						<a href="/dashboard" class="hover:text-gray-700">Dashboard</a>
						<span>›</span>
						<a href="/memorials/{memorialId}" class="hover:text-gray-700">Memorial</a>
						<span>›</span>
						<span class="text-gray-900">Stream Management</span>
					</nav>
					
					{#if memorial}
						<h1 class="text-3xl font-bold text-gray-900">
							{memorial.lovedOneName} - Stream Management
						</h1>
						<p class="text-gray-600 mt-1">
							Manage livestreams for this memorial service
						</p>
					{:else if loading}
						<div class="animate-pulse">
							<div class="h-8 bg-gray-200 rounded w-64 mb-2"></div>
							<div class="h-4 bg-gray-200 rounded w-48"></div>
						</div>
					{:else}
						<h1 class="text-3xl font-bold text-gray-900">Stream Management</h1>
					{/if}
				</div>
				
				<div class="flex items-center space-x-3">
					{#if memorial}
						<a 
							href="/{memorial.slug}" 
							target="_blank"
							class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
						>
							View Memorial Page
						</a>
					{/if}
					
					<a 
						href="/dashboard" 
						class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
					>
						Back to Dashboard
					</a>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{#if error}
			<div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
				<div class="flex">
					<div class="ml-3">
						<h3 class="text-sm font-medium text-red-800">Error</h3>
						<p class="mt-1 text-sm text-red-700">{error}</p>
					</div>
				</div>
			</div>
		{/if}

		{#if memorial}
			<!-- Memorial Info Card -->
			<div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<h2 class="text-xl font-semibold text-gray-900 mb-2">
							{memorial.lovedOneName}
						</h2>
						
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
							{#if memorial.serviceDate}
								<div>
									<span class="font-medium">Service Date:</span>
									{new Date(memorial.serviceDate).toLocaleDateString()}
								</div>
							{/if}
							
							{#if memorial.serviceTime}
								<div>
									<span class="font-medium">Service Time:</span>
									{memorial.serviceTime}
								</div>
							{/if}
							
							{#if memorial.location}
								<div>
									<span class="font-medium">Location:</span>
									{memorial.location}
								</div>
							{/if}
						</div>
					</div>
					
					<div class="flex items-center space-x-2">
						<span class="px-2 py-1 text-xs font-medium rounded-full {memorial.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
							{memorial.isPublic ? 'Public' : 'Private'}
						</span>
						
						{#if memorial.livestreamEnabled}
							<span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
								Livestream Enabled
							</span>
						{/if}
					</div>
				</div>
			</div>

			<!-- Stream Management -->
			<div class="bg-white rounded-lg shadow-sm border">
				<div class="p-6 border-b border-gray-200">
					<h2 class="text-lg font-semibold text-gray-900">Livestream Management</h2>
					<p class="text-gray-600 text-sm mt-1">
						Create and manage livestreams for this memorial service. Streams can be started immediately or scheduled for later.
					</p>
				</div>
				
				<div class="p-6">
					<UnifiedStreamControl memorialId={memorialId} showCreateForm={true} />
				</div>
			</div>

			<!-- Help Section -->
			<div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
				<h3 class="text-lg font-semibold text-blue-900 mb-3">Getting Started with Livestreaming</h3>
				
				<div class="grid md:grid-cols-2 gap-6 text-sm">
					<div>
						<h4 class="font-semibold text-blue-800 mb-2">📱 Mobile Streaming (WHIP)</h4>
						<ul class="space-y-1 text-blue-700">
							<li>• Stream directly from your browser</li>
							<li>• No additional software needed</li>
							<li>• Perfect for quick, impromptu streams</li>
							<li>• Works on phones, tablets, and computers</li>
						</ul>
					</div>
					
					<div>
						<h4 class="font-semibold text-blue-800 mb-2">🎥 Professional Streaming (RTMP)</h4>
						<ul class="space-y-1 text-blue-700">
							<li>• Use OBS, Streamlabs, or similar software</li>
							<li>• Higher quality and more control</li>
							<li>• Multiple camera angles and scenes</li>
							<li>• Professional broadcasting features</li>
						</ul>
					</div>
				</div>
				
				<div class="mt-4 p-3 bg-blue-100 rounded border-l-4 border-blue-400">
					<p class="text-blue-800 text-sm">
						<strong>💡 Tip:</strong> All streams are automatically recorded and will be available for viewing after the service ends. 
						You can control the visibility of each recording individually.
					</p>
				</div>
			</div>
		{:else if loading}
			<div class="bg-white rounded-lg shadow-sm border p-8">
				<div class="animate-pulse space-y-4">
					<div class="h-4 bg-gray-200 rounded w-3/4"></div>
					<div class="h-4 bg-gray-200 rounded w-1/2"></div>
					<div class="h-32 bg-gray-200 rounded"></div>
				</div>
			</div>
		{/if}
	</div>
</div>
