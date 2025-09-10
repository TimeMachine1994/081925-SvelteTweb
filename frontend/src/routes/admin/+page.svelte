<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// State management for simplified admin interface
	let activeTab = $state('pending-directors');
	let isProcessing = $state(false);

	onMount(() => {
		console.log('🏛️ [ADMIN PAGE] Simplified admin dashboard mounted');
		console.log('📊 [ADMIN PAGE] Data loaded:', {
			pendingDirectors: data.pendingFuneralDirectors?.length || 0,
			recentMemorials: data.recentMemorials?.length || 0,
			stats: data.stats
		});
	});

	/**
	 * APPROVE FUNERAL DIRECTOR
	 * Uses existing API endpoint following established patterns
	 */
	async function approveFuneralDirector(directorId: string, companyName: string) {
		console.log('✅ [ADMIN ACTION] Starting approval for director:', { directorId, companyName });
		
		if (isProcessing) {
			console.log('⏳ [ADMIN ACTION] Already processing, ignoring duplicate request');
			return;
		}

		isProcessing = true;

		try {
			console.log('🔄 [ADMIN ACTION] Calling approval API...');
			
			const response = await fetch('/api/admin/approve-funeral-director', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ directorId })
			});

			const result = await response.json();

			if (response.ok) {
				console.log('🎉 [ADMIN ACTION] Director approved successfully:', result);
				
				// Remove from pending list (optimistic update)
				data.pendingFuneralDirectors = data.pendingFuneralDirectors.filter(d => d.id !== directorId);
				data.stats.pendingApprovals = data.pendingFuneralDirectors.length;
				
				alert(`✅ ${companyName} has been approved successfully!`);
			} else {
				console.error('❌ [ADMIN ACTION] Approval failed:', result);
				alert(`❌ Failed to approve ${companyName}: ${result.error}`);
			}
		} catch (error) {
			console.error('💥 [ADMIN ACTION] Network error during approval:', error);
			alert(`❌ Network error occurred while approving ${companyName}`);
		} finally {
			isProcessing = false;
		}
	}

	/**
	 * REJECT FUNERAL DIRECTOR
	 * Uses existing API endpoint following established patterns
	 */
	async function rejectFuneralDirector(directorId: string, companyName: string) {
		console.log('❌ [ADMIN ACTION] Starting rejection for director:', { directorId, companyName });
		
		if (isProcessing) {
			console.log('⏳ [ADMIN ACTION] Already processing, ignoring duplicate request');
			return;
		}

		const reason = prompt(`Provide a reason for rejecting ${companyName}:`);
		if (!reason) {
			console.log('🚫 [ADMIN ACTION] Rejection cancelled - no reason provided');
			return;
		}

		isProcessing = true;

		try {
			console.log('🔄 [ADMIN ACTION] Calling rejection API...');
			
			const response = await fetch('/api/admin/reject-funeral-director', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ directorId, reason })
			});

			const result = await response.json();

			if (response.ok) {
				console.log('✅ [ADMIN ACTION] Director rejected successfully:', result);
				
				// Remove from pending list (optimistic update)
				data.pendingFuneralDirectors = data.pendingFuneralDirectors.filter(d => d.id !== directorId);
				data.stats.pendingApprovals = data.pendingFuneralDirectors.length;
				
				alert(`❌ ${companyName} has been rejected.`);
			} else {
				console.error('❌ [ADMIN ACTION] Rejection failed:', result);
				alert(`❌ Failed to reject ${companyName}: ${result.error}`);
			}
		} catch (error) {
			console.error('💥 [ADMIN ACTION] Network error during rejection:', error);
			alert(`❌ Network error occurred while rejecting ${companyName}`);
		} finally {
			isProcessing = false;
		}
	}

	/**
	 * CREATE NEW MEMORIAL
	 * Uses existing memorial creation pattern from flow analysis
	 */
	async function createMemorial() {
		console.log('💝 [ADMIN ACTION] Starting memorial creation');
		
		if (isProcessing) {
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

		isProcessing = true;

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
			isProcessing = false;
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
				<p class="text-2xl font-bold text-blue-600">{data.stats.totalMemorials}</p>
			</div>
			<div class="bg-white p-6 rounded-lg shadow-sm border">
				<h3 class="text-sm font-medium text-gray-500 mb-2">Funeral Directors</h3>
				<p class="text-2xl font-bold text-green-600">{data.stats.totalFuneralDirectors}</p>
			</div>
			<div class="bg-white p-6 rounded-lg shadow-sm border">
				<h3 class="text-sm font-medium text-gray-500 mb-2">Pending Approvals</h3>
				<p class="text-2xl font-bold text-orange-600">{data.stats.pendingApprovals}</p>
			</div>
			<div class="bg-white p-6 rounded-lg shadow-sm border">
				<h3 class="text-sm font-medium text-gray-500 mb-2">Recent Memorials</h3>
				<p class="text-2xl font-bold text-purple-600">{data.stats.recentMemorials}</p>
			</div>
		</div>

		<!-- NAVIGATION TABS -->
		<div class="mb-6">
			<nav class="flex space-x-8">
				<button 
					onclick={() => activeTab = 'pending-directors'}
					class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'pending-directors' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
				>
					Pending Directors ({data.pendingFuneralDirectors.length})
				</button>
				<button 
					onclick={() => activeTab = 'recent-memorials'}
					class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'recent-memorials' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
				>
					Recent Memorials ({data.recentMemorials.length})
				</button>
				<button 
					onclick={() => activeTab = 'create-memorial'}
					class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'create-memorial' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
				>
					Create Memorial
				</button>
			</nav>
		</div>

		<!-- TAB CONTENT -->
		<div class="bg-white rounded-lg shadow-sm border">
			
			<!-- PENDING FUNERAL DIRECTORS TAB -->
			{#if activeTab === 'pending-directors'}
				<div class="p-6">
					<h2 class="text-xl font-semibold mb-4">Pending Funeral Director Approvals</h2>
					
					{#if data.pendingFuneralDirectors.length === 0}
						<div class="text-center py-8 text-gray-500">
							<p>🎉 No pending approvals! All caught up.</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each data.pendingFuneralDirectors as director}
								<div class="border rounded-lg p-4 hover:bg-gray-50">
									<div class="flex justify-between items-start">
										<div class="flex-1">
											<h3 class="font-semibold text-lg">{director.companyName}</h3>
											<p class="text-gray-600 mb-2">{director.contactPerson} • {director.email}</p>
											<div class="text-sm text-gray-500 space-y-1">
												<p><strong>Phone:</strong> {director.phone || 'Not provided'}</p>
												<p><strong>License:</strong> {director.licenseNumber || 'Not provided'}</p>
												<p><strong>Applied:</strong> {formatDate(director.createdAt)}</p>
												<p><strong>Documents:</strong> 
													{director.documents.businessLicense ? '✅' : '❌'} Business License
													{director.documents.funeralLicense ? '✅' : '❌'} Funeral License
													{director.documents.insurance ? '✅' : '❌'} Insurance
												</p>
											</div>
										</div>
										<div class="flex space-x-2 ml-4">
											<button 
												onclick={() => approveFuneralDirector(director.id, director.companyName)}
												disabled={isProcessing}
												class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{isProcessing ? 'Processing...' : 'Approve'}
											</button>
											<button 
												onclick={() => rejectFuneralDirector(director.id, director.companyName)}
												disabled={isProcessing}
												class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{isProcessing ? 'Processing...' : 'Reject'}
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

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
												class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
							disabled={isProcessing}
							class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
						>
							{isProcessing ? 'Creating Memorial...' : 'Create New Memorial'}
						</button>
						
						<div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<h4 class="font-medium text-blue-900 mb-2">What happens when you create a memorial:</h4>
							<ul class="text-sm text-blue-800 space-y-1">
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
								<path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
							</svg>
						</div>
					</div>
				</div>

				<div class="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-white/70 text-sm font-medium">Active Streams</p>
							<p class="text-3xl font-bold text-white">{stats.activeStreams}</p>
						</div>
						<div class="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl flex items-center justify-center">
							<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path>
							</svg>
						</div>
					</div>
				</div>

				<div class="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-white/70 text-sm font-medium">Recent Memorials</p>
							<p class="text-3xl font-bold text-white">{stats.recentMemorials}</p>
						</div>
						<div class="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
							<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
							</svg>
						</div>
					</div>
				</div>
			</div>

			<!-- Admin Portal Component -->
			<AdminPortal {memorials} {allUsers} {pendingFuneralDirectors} {approvedFuneralDirectors} />
		</div>
	</div>
{/if}

<style>
	@keyframes blob {
		0% { transform: translate(0px, 0px) scale(1); }
		33% { transform: translate(30px, -50px) scale(1.1); }
		66% { transform: translate(-20px, 20px) scale(0.9); }
		100% { transform: translate(0px, 0px) scale(1); }
	}
	.animate-blob {
		animation: blob 7s infinite;
	}
	.animation-delay-2000 {
		animation-delay: 2s;
	}
	.animation-delay-4000 {
		animation-delay: 4s;
	}
</style>
