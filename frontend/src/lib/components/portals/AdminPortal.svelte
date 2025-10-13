<!-- Simplified Admin Portal - Funeral Director Approval & Memorial Management -->
<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/ui';

	// Props from parent component
	let {
		memorials,
		allUsers,
		pendingFuneralDirectors = [],
		approvedFuneralDirectors = []
	}: {
		memorials: Memorial[];
		allUsers: { uid: string; email: string; displayName: string; role?: string }[];
		pendingFuneralDirectors?: any[];
		approvedFuneralDirectors?: any[];
	} = $props();

	// Active tab state
	let activeTab = $state<
		'overview' | 'funeral-directors' | 'memorials' | 'create-memorial' | 'audit-logs'
	>('overview');

	// Memorial creation form state
	let newMemorialForm = $state({
		lovedOneName: '',
		creatorEmail: '',
		creatorName: '',
		isPublic: true,
		content: '',
		serviceDate: '',
		serviceTime: '',
		location: ''
	});

	// Loading states
	let isApproving = $state(false);
	let isCreatingMemorial = $state(false);

	// Audit logs state
	let auditLogs = $state<any[]>([]);
	let auditLoading = $state(false);
	let auditFilters = $state({
		action: '',
		userEmail: '',
		resourceType: '',
		dateFrom: '',
		dateTo: '',
		limit: 50
	});

	/**
	 * Approve a funeral director - updates their status and permissions
	 * @param directorId - The funeral director's user ID
	 */
	async function approveFuneralDirector(directorId: string) {
		console.log('🏥 [ADMIN] Starting funeral director approval process for:', directorId);
		isApproving = true;

		try {
			const response = await fetch('/api/admin/approve-funeral-director', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ directorId })
			});

			const result = await response.json();
			console.log('🏥 [ADMIN] Approval response:', result);

			if (response.ok) {
				console.log('✅ [ADMIN] Funeral director approved successfully');
				await invalidateAll(); // Refresh data
				alert('Funeral director approved successfully!');
			} else {
				console.error('❌ [ADMIN] Failed to approve funeral director:', result.error);
				alert(`Failed to approve: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error approving funeral director:', error);
			alert('Network error occurred while approving');
		} finally {
			isApproving = false;
		}
	}

	/**
	 * Reject a funeral director application
	 * @param directorId - The funeral director's user ID
	 */
	async function rejectFuneralDirector(directorId: string) {
		if (!confirm('Are you sure you want to reject this funeral director application?')) {
			return;
		}

		console.log('🚫 [ADMIN] Rejecting funeral director:', directorId);

		try {
			const response = await fetch('/api/admin/reject-funeral-director', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ directorId })
			});

			if (response.ok) {
				console.log('✅ [ADMIN] Funeral director rejected');
				await invalidateAll();
				alert('Funeral director application rejected');
			} else {
				const result = await response.json();
				alert(`Failed to reject: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error rejecting funeral director:', error);
			alert('Network error occurred');
		}
	}

	/**
	 * Create a new memorial as admin
	 */
	async function createMemorial(event: Event) {
		event.preventDefault();
		console.log('📝 [ADMIN] Creating new memorial:', newMemorialForm);

		// Validate required fields
		if (!newMemorialForm.lovedOneName || !newMemorialForm.creatorEmail) {
			alert('Please fill in the loved one name and creator email');
			return;
		}

		isCreatingMemorial = true;

		try {
			const response = await fetch('/api/admin/create-memorial', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newMemorialForm)
			});

			const result = await response.json();
			console.log('📝 [ADMIN] Memorial creation response:', result);

			if (response.ok) {
				console.log('✅ [ADMIN] Memorial created successfully:', result.memorialId);
				// Reset form
				newMemorialForm = {
					lovedOneName: '',
					creatorEmail: '',
					creatorName: '',
					isPublic: true,
					content: '',
					serviceDate: '',
					serviceTime: '',
					location: ''
				};
				await invalidateAll();
				alert(`Memorial created successfully! ID: ${result.memorialId}`);
				activeTab = 'memorials'; // Switch to memorials tab
			} else {
				console.error('❌ [ADMIN] Failed to create memorial:', result.error);
				alert(`Failed to create memorial: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error creating memorial:', error);
			alert('Network error occurred while creating memorial');
		} finally {
			isCreatingMemorial = false;
		}
	}

	/**
	 * Load audit logs with current filters
	 */
	async function loadAuditLogs() {
		console.log('🔍 [ADMIN] Loading audit logs...');
		auditLoading = true;

		try {
			const params = new URLSearchParams();
			if (auditFilters.action) params.set('action', auditFilters.action);
			if (auditFilters.userEmail) params.set('userEmail', auditFilters.userEmail);
			if (auditFilters.resourceType) params.set('resourceType', auditFilters.resourceType);
			if (auditFilters.dateFrom) params.set('dateFrom', auditFilters.dateFrom);
			if (auditFilters.dateTo) params.set('dateTo', auditFilters.dateTo);
			params.set('limit', auditFilters.limit.toString());

			const response = await fetch(`/api/admin/audit-logs?${params}`);
			const result = await response.json();

			if (response.ok) {
				auditLogs = result.logs || [];
				console.log('✅ [ADMIN] Loaded audit logs:', auditLogs.length);
			} else {
				console.error('❌ [ADMIN] Failed to load audit logs:', result.error);
				alert(`Failed to load audit logs: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error loading audit logs:', error);
			alert('Network error occurred while loading audit logs');
		} finally {
			auditLoading = false;
		}
	}

	/**
	 * Format timestamp for display
	 */
	function formatTimestamp(timestamp: any): string {
		if (!timestamp) return 'Unknown';
		const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
		return date.toLocaleString();
	}

	/**
	 * Get action emoji for display
	 */
	function getActionEmoji(action: string): string {
		const emojiMap: Record<string, string> = {
			memorial_created: '🆕',
			memorial_updated: '✏️',
			memorial_deleted: '🗑️',
			memorial_viewed: '👁️',
			user_login: '🔐',
			user_logout: '🚪',
			user_created: '👤',
			role_changed: '🔄',
			schedule_updated: '📅',
			schedule_locked: '🔒',
			payment_completed: '💳',
			payment_failed: '❌',
			funeral_director_approved: '✅',
			funeral_director_rejected: '❌',
			admin_memorial_created: '👑',
			system_config_changed: '⚙️',
			api_access_denied: '🚫'
		};
		return emojiMap[action] || '📝';
	}
</script>

<!-- Simplified Admin Dashboard with Tabs -->
<div class="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
	<!-- Tab Navigation -->
	<div class="mb-6 flex space-x-4 border-b border-white/20 pb-4">
		<Button
			onclick={() => (activeTab = 'overview')}
			variant={activeTab === 'overview' ? 'role' : 'ghost'}
			role={activeTab === 'overview' ? 'admin' : undefined}
			size="md"
			rounded="lg"
		>
			📊 Overview
		</Button>
		<Button
			onclick={() => (activeTab = 'funeral-directors')}
			variant={activeTab === 'funeral-directors' ? 'role' : 'ghost'}
			role={activeTab === 'funeral-directors' ? 'admin' : undefined}
			size="md"
			rounded="lg"
		>
			🏥 Funeral Directors
		</Button>
		<Button
			onclick={() => (activeTab = 'memorials')}
			variant={activeTab === 'memorials' ? 'role' : 'ghost'}
			role={activeTab === 'memorials' ? 'admin' : undefined}
			size="md"
			rounded="lg"
		>
			💝 Memorials
		</Button>
		<Button
			onclick={() => (activeTab = 'create-memorial')}
			variant={activeTab === 'create-memorial' ? 'role' : 'ghost'}
			role={activeTab === 'create-memorial' ? 'admin' : undefined}
			size="md"
			rounded="lg"
		>
			➕ Create Memorial
		</Button>
		<Button
			onclick={() => {
				activeTab = 'audit-logs';
				loadAuditLogs();
			}}
			variant={activeTab === 'audit-logs' ? 'role' : 'ghost'}
			role={activeTab === 'audit-logs' ? 'admin' : undefined}
			size="md"
			rounded="lg"
		>
			🔍 Audit Logs
		</Button>
	</div>

	<!-- Overview Tab -->
	{#if activeTab === 'overview'}
		<div class="space-y-6">
			<h2 class="mb-4 text-2xl font-bold text-white">System Overview</h2>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<div class="rounded-xl border border-white/10 bg-white/5 p-4">
					<div class="text-sm text-white/70">Total Memorials</div>
					<div class="text-2xl font-bold text-white">{memorials.length}</div>
				</div>
				<div class="rounded-xl border border-white/10 bg-white/5 p-4">
					<div class="text-sm text-white/70">Total Users</div>
					<div class="text-2xl font-bold text-white">{allUsers.length}</div>
				</div>
				<div class="rounded-xl border border-white/10 bg-white/5 p-4">
					<div class="text-sm text-white/70">Pending Approvals</div>
					<div class="text-2xl font-bold text-amber-400">{pendingFuneralDirectors.length}</div>
				</div>
				<div class="rounded-xl border border-white/10 bg-white/5 p-4">
					<div class="text-sm text-white/70">Approved Directors</div>
					<div class="text-2xl font-bold text-green-400">{approvedFuneralDirectors.length}</div>
				</div>
			</div>

			<div class="rounded-xl border border-white/10 bg-white/5 p-4">
				<h3 class="mb-3 text-lg font-semibold text-white">Quick Actions</h3>
				<div class="flex flex-wrap gap-3">
					<Button
						onclick={() => (activeTab = 'funeral-directors')}
						variant="role"
						role="admin"
						size="md"
						rounded="lg"
					>
						Review Pending Directors ({pendingFuneralDirectors.length})
					</Button>
					<Button
						onclick={() => (activeTab = 'create-memorial')}
						variant="secondary"
						size="md"
						rounded="lg"
					>
						Create New Memorial
					</Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Funeral Directors Tab -->
	{#if activeTab === 'funeral-directors'}
		<div class="space-y-6">
			<h2 class="mb-4 text-2xl font-bold text-white">Funeral Director Management</h2>

			<!-- Pending Approvals -->
			{#if pendingFuneralDirectors.length > 0}
				<div class="rounded-xl border border-white/10 bg-white/5 p-4">
					<h3 class="mb-4 text-lg font-semibold text-amber-400">
						⏳ Pending Approvals ({pendingFuneralDirectors.length})
					</h3>
					<div class="space-y-3">
						{#each pendingFuneralDirectors as director}
							<div class="rounded-lg border border-white/10 bg-white/5 p-4">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<h4 class="font-semibold text-white">{director.companyName}</h4>
										<p class="text-sm text-white/70">Contact: {director.contactPerson}</p>
										<p class="text-sm text-white/70">Email: {director.email}</p>
										<p class="text-sm text-white/70">License: {director.licenseNumber}</p>
										<p class="text-sm text-white/70">Business Type: {director.businessType}</p>
									</div>
									<div class="flex gap-2">
										<Button
											onclick={() => approveFuneralDirector(director.id)}
											disabled={isApproving}
											loading={isApproving}
											variant="primary"
											size="sm"
											rounded="lg"
										>
											{isApproving ? 'Approving...' : '✅ Approve'}
										</Button>
										<Button
											onclick={() => rejectFuneralDirector(director.id)}
											variant="danger"
											size="sm"
											rounded="lg"
										>
											❌ Reject
										</Button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
					<p class="text-white/70">No pending funeral director applications</p>
				</div>
			{/if}

			<!-- Approved Directors -->
			{#if approvedFuneralDirectors.length > 0}
				<div class="rounded-xl border border-white/10 bg-white/5 p-4">
					<h3 class="mb-4 text-lg font-semibold text-green-400">
						✅ Approved Directors ({approvedFuneralDirectors.length})
					</h3>
					<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
						{#each approvedFuneralDirectors as director}
							<div class="rounded-lg border border-white/10 bg-white/5 p-3">
								<h4 class="text-sm font-semibold text-white">{director.companyName}</h4>
								<p class="text-xs text-white/70">{director.contactPerson}</p>
								<p class="text-xs text-white/70">{director.email}</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Memorials Tab -->
	{#if activeTab === 'memorials'}
		<div class="space-y-6">
			<h2 class="mb-4 text-2xl font-bold text-white">Memorial Management</h2>

			<div class="overflow-hidden rounded-xl border border-white/10 bg-white/5">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-white/10">
							<tr>
								<th class="px-4 py-3 text-left font-semibold text-white">Loved One</th>
								<th class="px-4 py-3 text-left font-semibold text-white">Creator</th>
								<th class="px-4 py-3 text-left font-semibold text-white">Status</th>
								<th class="px-4 py-3 text-left font-semibold text-white">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#if memorials && memorials.length > 0}
								{#each memorials as memorial}
									<tr class="border-b border-white/10 hover:bg-white/5">
										<td class="px-4 py-3 text-white">{memorial.lovedOneName}</td>
										<td class="px-4 py-3 text-sm text-white/70">{memorial.creatorEmail}</td>
										<td class="px-4 py-3">
											{#if memorial.isPublic}
												<span class="rounded bg-green-500 px-2 py-1 text-xs text-white">Public</span
												>
											{:else}
												<span class="rounded bg-gray-500 px-2 py-1 text-xs text-white">Private</span
												>
											{/if}
										</td>
										<td class="px-4 py-3">
											<div class="flex gap-2">
												<a
													href="/{memorial.fullSlug}"
													class="text-sm text-blue-400 hover:text-blue-300">View</a
												>
												<a
													href="/schedule?memorialId={memorial.id}"
													class="text-sm text-purple-400 hover:text-purple-300">Schedule</a
												>
											</div>
										</td>
									</tr>
								{/each}
							{:else}
								<tr>
									<td colspan="4" class="px-4 py-8 text-center text-white/70">No memorials found</td
									>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}

	<!-- Create Memorial Tab -->
	{#if activeTab === 'create-memorial'}
		<div class="space-y-6">
			<h2 class="mb-4 text-2xl font-bold text-white">Create New Memorial</h2>

			<div class="rounded-xl border border-white/10 bg-white/5 p-6">
				<form onsubmit={createMemorial} class="space-y-4">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label class="mb-2 block font-semibold text-white">Loved One's Name *</label>
							<input
								type="text"
								bind:value={newMemorialForm.lovedOneName}
								class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-amber-400 focus:outline-none"
								placeholder="Enter the loved one's name"
								required
							/>
						</div>
						<div>
							<label class="mb-2 block font-semibold text-white">Creator Email *</label>
							<input
								type="email"
								bind:value={newMemorialForm.creatorEmail}
								class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-amber-400 focus:outline-none"
								placeholder="Family contact email"
								required
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label class="mb-2 block font-semibold text-white">Creator Name</label>
							<input
								type="text"
								bind:value={newMemorialForm.creatorName}
								class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-amber-400 focus:outline-none"
								placeholder="Family contact name"
							/>
						</div>
						<div>
							<label class="mb-2 block font-semibold text-white">Location</label>
							<input
								type="text"
								bind:value={newMemorialForm.location}
								class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-amber-400 focus:outline-none"
								placeholder="Service location"
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label class="mb-2 block font-semibold text-white">Service Date</label>
							<input
								type="date"
								bind:value={newMemorialForm.serviceDate}
								class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white focus:border-amber-400 focus:outline-none"
							/>
						</div>
						<div>
							<label class="mb-2 block font-semibold text-white">Service Time</label>
							<input
								type="time"
								bind:value={newMemorialForm.serviceTime}
								class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white focus:border-amber-400 focus:outline-none"
							/>
						</div>
					</div>

					<div>
						<label class="mb-2 block font-semibold text-white">Memorial Description</label>
						<textarea
							bind:value={newMemorialForm.content}
							class="h-24 w-full resize-none rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-amber-400 focus:outline-none"
							placeholder="Brief description or obituary text"
						></textarea>
					</div>

					<div class="flex items-center gap-3">
						<input
							type="checkbox"
							bind:checked={newMemorialForm.isPublic}
							id="isPublic"
							class="h-4 w-4 rounded border-white/20 bg-white/10 text-amber-400 focus:ring-amber-400"
						/>
						<label for="isPublic" class="text-white">Make memorial publicly visible</label>
					</div>

					<div class="flex gap-4 pt-4">
						<Button
							type="submit"
							disabled={isCreatingMemorial}
							loading={isCreatingMemorial}
							variant="role"
							role="admin"
							size="lg"
							rounded="lg"
						>
							{isCreatingMemorial ? 'Creating...' : '✨ Create Memorial'}
						</Button>
						<Button
							variant="secondary"
							size="lg"
							onclick={() => (activeTab = 'overview')}
							rounded="lg"
						>
							Cancel
						</Button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Audit Logs Tab -->
	{#if activeTab === 'audit-logs'}
		<div class="space-y-6">
			<h2 class="mb-4 text-2xl font-bold text-white">🔍 Audit Logs</h2>

			<!-- Filters -->
			<div class="rounded-xl border border-white/10 bg-white/5 p-4">
				<h3 class="mb-4 text-lg font-semibold text-white">Filters</h3>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
					<div>
						<label class="mb-1 block text-sm text-white/70">Action</label>
						<select
							bind:value={auditFilters.action}
							class="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
						>
							<option value="">All Actions</option>
							<option value="memorial_created">Memorial Created</option>
							<option value="memorial_updated">Memorial Updated</option>
							<option value="memorial_deleted">Memorial Deleted</option>
							<option value="memorial_viewed">Memorial Viewed</option>
							<option value="user_login">User Login</option>
							<option value="user_logout">User Logout</option>
							<option value="funeral_director_approved">Director Approved</option>
							<option value="api_access_denied">Access Denied</option>
						</select>
					</div>
					<div>
						<label class="mb-1 block text-sm text-white/70">User Email</label>
						<input
							type="email"
							bind:value={auditFilters.userEmail}
							placeholder="Filter by user"
							class="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-amber-400 focus:outline-none"
						/>
					</div>
					<div>
						<label class="mb-1 block text-sm text-white/70">Resource Type</label>
						<select
							bind:value={auditFilters.resourceType}
							class="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
						>
							<option value="">All Types</option>
							<option value="memorial">Memorial</option>
							<option value="user">User</option>
							<option value="schedule">Schedule</option>
							<option value="payment">Payment</option>
						</select>
					</div>
					<div>
						<label class="mb-1 block text-sm text-white/70">Date From</label>
						<input
							type="date"
							bind:value={auditFilters.dateFrom}
							class="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
						/>
					</div>
					<div>
						<label class="mb-1 block text-sm text-white/70">Date To</label>
						<input
							type="date"
							bind:value={auditFilters.dateTo}
							class="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
						/>
					</div>
					<div>
						<label class="mb-1 block text-sm text-white/70">Limit</label>
						<select
							bind:value={auditFilters.limit}
							class="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
						>
							<option value={25}>25</option>
							<option value={50}>50</option>
							<option value={100}>100</option>
							<option value={250}>250</option>
						</select>
					</div>
				</div>
				<div class="mt-4 flex gap-2">
					<Button
						onclick={loadAuditLogs}
						disabled={auditLoading}
						loading={auditLoading}
						variant="role"
						role="admin"
						size="md"
						rounded="lg"
					>
						{auditLoading ? 'Loading...' : '🔍 Search'}
					</Button>
					<Button
						onclick={() => {
							auditFilters.action = '';
							auditFilters.userEmail = '';
							auditFilters.startDate = '';
							auditFilters.endDate = '';
							auditLogs = [];
						}}
						variant="secondary"
						size="md"
						rounded="lg"
					>
						🔄 Clear Filters
					</Button>
				</div>
			</div>

			<!-- Audit Logs Table -->
			<div class="overflow-hidden rounded-xl border border-white/10 bg-white/5">
				{#if auditLoading}
					<div class="p-8 text-center">
						<div class="text-white/70">Loading audit logs...</div>
					</div>
				{:else if auditLogs.length === 0}
					<div class="p-8 text-center">
						<div class="text-white/70">No audit logs found matching your criteria.</div>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead class="bg-white/10">
								<tr>
									<th class="px-4 py-3 text-left font-semibold text-white">Timestamp</th>
									<th class="px-4 py-3 text-left font-semibold text-white">Action</th>
									<th class="px-4 py-3 text-left font-semibold text-white">User</th>
									<th class="px-4 py-3 text-left font-semibold text-white">Resource</th>
									<th class="px-4 py-3 text-left font-semibold text-white">Details</th>
									<th class="px-4 py-3 text-left font-semibold text-white">IP Address</th>
								</tr>
							</thead>
							<tbody>
								{#each auditLogs as log, index}
									<tr class="border-t border-white/10 {index % 2 === 0 ? 'bg-white/5' : ''}">
										<td class="px-4 py-3 text-sm text-white/90">
											{formatTimestamp(log.timestamp)}
										</td>
										<td class="px-4 py-3 text-white/90">
											<span class="inline-flex items-center gap-2">
												{getActionEmoji(log.action)}
												<span class="text-sm">{log.action}</span>
											</span>
										</td>
										<td class="px-4 py-3 text-sm text-white/90">
											<div>
												<div class="font-medium">{log.userEmail || 'Unknown'}</div>
												{#if log.userRole}
													<div class="text-xs text-white/60">{log.userRole}</div>
												{/if}
											</div>
										</td>
										<td class="px-4 py-3 text-sm text-white/90">
											{#if log.resourceType && log.resourceId}
												<div>
													<div class="font-medium">{log.resourceType}</div>
													<div class="font-mono text-xs text-white/60">{log.resourceId}</div>
												</div>
											{:else}
												<span class="text-white/50">-</span>
											{/if}
										</td>
										<td class="max-w-xs px-4 py-3 text-sm text-white/90">
											{#if log.details}
												<div class="truncate" title={JSON.stringify(log.details, null, 2)}>
													{typeof log.details === 'string'
														? log.details
														: JSON.stringify(log.details)}
												</div>
											{:else}
												<span class="text-white/50">-</span>
											{/if}
										</td>
										<td class="px-4 py-3 font-mono text-sm text-white/90">
											{log.ipAddress || '-'}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			<!-- Summary Stats -->
			{#if auditLogs.length > 0}
				<div class="rounded-xl border border-white/10 bg-white/5 p-4">
					<h3 class="mb-2 text-lg font-semibold text-white">Summary</h3>
					<div class="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
						<div>
							<div class="text-white/70">Total Events</div>
							<div class="text-lg font-semibold text-white">{auditLogs.length}</div>
						</div>
						<div>
							<div class="text-white/70">Unique Users</div>
							<div class="text-lg font-semibold text-white">
								{new Set(auditLogs.map((log) => log.userEmail).filter(Boolean)).size}
							</div>
						</div>
						<div>
							<div class="text-white/70">Access Denied</div>
							<div class="text-lg font-semibold text-white">
								{auditLogs.filter((log) => log.action === 'api_access_denied').length}
							</div>
						</div>
						<div>
							<div class="text-white/70">Date Range</div>
							<div class="text-sm font-semibold text-white">
								{#if auditLogs.length > 0}
									{formatTimestamp(auditLogs[auditLogs.length - 1].timestamp).split(',')[0]} -
									{formatTimestamp(auditLogs[0].timestamp).split(',')[0]}
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
