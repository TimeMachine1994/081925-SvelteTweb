<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// State management for simplified admin interface
	let activeTab = $state('recent-memorials');
	let processingId = $state<string | null>(null);

	onMount(() => {
		console.log('🏛️ [ADMIN PAGE] Simplified admin dashboard mounted');
		console.log('📊 [ADMIN PAGE] Data loaded:', {
			recentMemorials: data.recentMemorials?.length || 0,
			stats: data.stats
		});
	});

	/**
	 * CREATE NEW MEMORIAL
	 * Uses existing memorial creation pattern from flow analysis
	 */
	async function createMemorial() {
		console.log('💝 [ADMIN ACTION] Starting memorial creation');
		
		if (processingId) {
			console.log('⏳ [ADMIN ACTION] Already processing, ignoring duplicate request');
			return;
		}

		// Simple form data collection
		const lovedOneName = prompt('Enter the loved one\'s name:');
		if (!lovedOneName) {
			console.log('🚫 [ADMIN ACTION] Memorial creation cancelled - no name provided');
			return;
		}

		const creatorEmail = prompt('Enter the memorial owner\'s email:');
		if (!creatorEmail) {
			console.log('🚫 [ADMIN ACTION] Memorial creation cancelled - no email provided');
			return;
		}

		processingId = 'create-memorial';

		try {
			console.log('🔄 [ADMIN ACTION] Creating memorial via API...', { lovedOneName, creatorEmail });
			
			const response = await fetch('/api/admin/create-memorial', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					lovedOneName, 
					creatorEmail,
					createdBy: 'admin'
				})
			});

			const result = await response.json();

			if (response.ok) {
				console.log('🎉 [ADMIN ACTION] Memorial created successfully:', result);
				
				// Update stats (optimistic update)
				data.stats.totalMemorials += 1;
				
				alert(`✅ Memorial for ${lovedOneName} created successfully!\nSlug: ${result.slug}\nOwner will receive login credentials via email.`);
			} else {
				console.error('❌ [ADMIN ACTION] Memorial creation failed:', result);
				alert(`❌ Failed to create memorial: ${result.error}`);
			}
		} catch (error) {
			console.error('💥 [ADMIN ACTION] Network error during memorial creation:', error);
			alert('❌ Network error occurred while creating memorial');
		} finally {
			processingId = null;
		}
	}

	/**
	 * FORMAT DATE FOR DISPLAY
	 * Following established timestamp handling patterns
	 */
	function formatDate(isoString: string | null): string {
		if (!isoString) return 'Unknown';
		try {
			return new Date(isoString).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return 'Invalid Date';
		}
	}
</script>

<svelte:head>
	<title>Admin Dashboard - TributeStream</title>
	<meta name="description" content="TributeStream Admin Dashboard - Simplified Interface" />
</svelte:head>

<!-- SIMPLIFIED ADMIN DASHBOARD -->
<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
	<div class="container mx-auto px-4 py-8">
		
		<!-- HEADER -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
			<p class="text-gray-600">Welcome back, {data.adminUser.email}</p>
			
			{#if data.error}
				<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
					<p class="text-red-800">⚠️ {data.error}</p>
				</div>
			{/if}
		</div>

		<!-- STATS OVERVIEW -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
			<div class="bg-white p-6 rounded-lg shadow-sm border">
				<h3 class="text-sm font-medium text-gray-500 mb-2">Total Memorials</h3>
				<p class="text-2xl font-bold text-yellow-600">{data.stats.totalMemorials}</p>
			</div>
			<div class="bg-white p-6 rounded-lg shadow-sm border">
				<h3 class="text-sm font-medium text-gray-500 mb-2">Funeral Directors</h3>
				<p class="text-2xl font-bold text-green-600">{data.stats.totalFuneralDirectors}</p>
			</div>
			<div class="bg-white p-6 rounded-lg shadow-sm border">
				<h3 class="text-sm font-medium text-gray-500 mb-2">Recent Memorials</h3>
				<p class="text-2xl font-bold text-amber-600">{data.stats.recentMemorials}</p>
			</div>
		</div>

		<!-- NAVIGATION TABS -->
		<div class="mb-6">
			<nav class="flex space-x-8">
				<button 
					onclick={() => activeTab = 'recent-memorials'}
					class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'recent-memorials' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
				>
					Recent Memorials ({data.recentMemorials.length})
				</button>
				<button 
					onclick={() => activeTab = 'create-memorial'}
					class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'create-memorial' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
				>
					Create Memorial
				</button>
			</nav>
		</div>

		<!-- TAB CONTENT -->
		<div class="bg-white rounded-lg shadow-sm border">
			

			<!-- RECENT MEMORIALS TAB -->
			{#if activeTab === 'recent-memorials'}
				<div class="p-6">
					<h2 class="text-xl font-semibold mb-4">Recent Memorials</h2>
					
					{#if data.recentMemorials.length === 0}
						<div class="text-center py-8 text-gray-500">
							<p>No recent memorials found.</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each data.recentMemorials as memorial}
								<div class="border rounded-lg p-4 hover:bg-gray-50">
									<div class="flex justify-between items-start">
										<div class="flex-1">
											<h3 class="font-semibold text-lg">{memorial.lovedOneName}</h3>
											<p class="text-gray-600 mb-2">Created by: {memorial.creatorEmail}</p>
											<div class="text-sm text-gray-500 space-y-1">
												<p><strong>Slug:</strong> {memorial.slug}</p>
												<p><strong>Created:</strong> {formatDate(memorial.createdAt)}</p>
												<p><strong>Payment Status:</strong> 
													<span class="px-2 py-1 rounded text-xs {memorial.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : memorial.paymentStatus === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}">
														{memorial.paymentStatus}
													</span>
												</p>
												<p><strong>Livestream:</strong> {memorial.hasLivestream ? '🔴 Active' : '⚫ Inactive'}</p>
											</div>
										</div>
										<div class="ml-4">
											<a 
												href="/tributes/{memorial.fullSlug}" 
												target="_blank"
												class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
											>
												View Memorial
											</a>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- CREATE MEMORIAL TAB -->
			{#if activeTab === 'create-memorial'}
				<div class="p-6">
					<h2 class="text-xl font-semibold mb-4">Create New Memorial</h2>
					<div class="max-w-md">
						<p class="text-gray-600 mb-6">Create a new memorial for a family. The system will automatically generate login credentials and send them via email.</p>
						
						<button 
							onclick={createMemorial}
							disabled={!!processingId}
							class="w-full px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
						>
							{processingId ? 'Processing...' : 'Create New Memorial'}
						</button>
						
						<div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
							<h4 class="font-medium text-yellow-900 mb-2">What happens when you create a memorial:</h4>
							<ul class="text-sm text-yellow-800 space-y-1">
								<li>• Creates Firebase Auth user account</li>
								<li>• Generates memorial with unique slug</li>
								<li>• Sends login credentials via email</li>
								<li>• Owner can immediately access their memorial</li>
								<li>• Follows same flow as public registration</li>
							</ul>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

