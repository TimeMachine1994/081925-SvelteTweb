<!-- Simplified Admin Portal - Funeral Director Approval & Memorial Management -->
<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/minimal-modern';

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
		'overview' | 'funeral-directors' | 'memorials' | 'memorial-owners' | 'create-memorial' | 'audit-logs'
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
	let isTogglingStatus = $state(false);

	// Memorial selection state
	let selectedMemorials = $state<Set<string>>(new Set());
	let selectAll = $state(false);

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
	 * Toggle memorial completion status for selected memorials
	 */
	async function toggleMemorialStatus(isComplete: boolean) {
		if (selectedMemorials.size === 0) {
			alert('Please select memorials to update');
			return;
		}

		const memorialIds = Array.from(selectedMemorials);
		const statusText = isComplete ? 'completed' : 'scheduled';
		
		if (!confirm(`Mark ${memorialIds.length} memorial(s) as ${statusText}?`)) {
			return;
		}

		isTogglingStatus = true;

		try {
			const response = await fetch('/api/admin/toggle-memorial-status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ memorialIds, isComplete })
			});

			const result = await response.json();

			if (response.ok) {
				console.log(`✅ [ADMIN] Successfully marked ${result.updatedCount} memorials as ${statusText}`);
				await invalidateAll(); // Refresh data
				selectedMemorials.clear();
				selectAll = false;
				alert(`Successfully marked ${result.updatedCount} memorial(s) as ${statusText}!`);
			} else {
				console.error(`❌ [ADMIN] Failed to toggle memorial status:`, result.error);
				alert(`Failed to update memorials: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error toggling memorial status:', error);
			alert('Network error occurred while updating memorials');
		} finally {
			isTogglingStatus = false;
		}
	}

	/**
	 * Handle select all checkbox
	 */
	function handleSelectAll() {
		if (selectAll) {
			// Select all visible memorials
			const visibleMemorials = activeTab === 'overview' 
				? memorials.filter(m => !m.isComplete) 
				: memorials;
			selectedMemorials = new Set(visibleMemorials.map(m => m.id).filter(id => id !== undefined) as string[]);
		} else {
			selectedMemorials.clear();
		}
	}

	/**
	 * Handle individual memorial selection
	 */
	function handleMemorialSelect(memorialId: string, event: Event) {
		const target = event.target as HTMLInputElement;
		const checked = target.checked;
		
		if (checked) {
			selectedMemorials.add(memorialId);
		} else {
			selectedMemorials.delete(memorialId);
			selectAll = false;
		}
		selectedMemorials = selectedMemorials; // Trigger reactivity
	}

	// Computed values
	const scheduledMemorials = $derived(memorials.filter(m => !m.isComplete));
	const completedMemorials = $derived(memorials.filter(m => m.isComplete));

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

	/**
	 * Delete a memorial
	 */
	async function deleteMemorial(memorialId: string, memorialName: string) {
		if (!confirm(`Are you sure you want to delete the memorial for "${memorialName}"? This action cannot be undone.`)) {
			return;
		}

		console.log('🗑️ [ADMIN] Deleting memorial:', memorialId);

		try {
			const response = await fetch(`/api/admin/delete-memorial`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ memorialId })
			});

			const result = await response.json();

			if (response.ok) {
				console.log('✅ [ADMIN] Memorial deleted successfully');
				await invalidateAll();
				alert('Memorial deleted successfully');
			} else {
				console.error('❌ [ADMIN] Failed to delete memorial:', result.error);
				alert(`Failed to delete memorial: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error deleting memorial:', error);
			alert('Network error occurred while deleting memorial');
		}
	}

	/**
	 * Delete a user
	 */
	async function deleteUser(userId: string, userEmail: string) {
		if (!confirm(`Are you sure you want to delete the user "${userEmail}"? This action cannot be undone.`)) {
			return;
		}

		console.log('🗑️ [ADMIN] Deleting user:', userId);

		try {
			const response = await fetch(`/api/admin/delete-user`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId })
			});

			const result = await response.json();

			if (response.ok) {
				console.log('✅ [ADMIN] User deleted successfully');
				await invalidateAll();
				alert('User deleted successfully');
			} else {
				console.error('❌ [ADMIN] Failed to delete user:', result.error);
				alert(`Failed to delete user: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN] Error deleting user:', error);
			alert('Network error occurred while deleting user');
		}
	}
</script>

<!-- Simplified Admin Dashboard with Tabs -->
<div class="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
	<!-- Tab Navigation -->
	<div class="mb-6 flex flex-wrap gap-2 border-b border-white/20 pb-4">
		<button
			onclick={() => (activeTab = 'overview')}
			class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 {activeTab === 'overview' 
				? 'bg-white text-gray-900 shadow-lg' 
				: 'bg-white/10 text-white hover:bg-white/20'}"
		>
			📊 Overview
		</button>
		<button
			onclick={() => (activeTab = 'funeral-directors')}
			class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 {activeTab === 'funeral-directors' 
				? 'bg-white text-gray-900 shadow-lg' 
				: 'bg-white/10 text-white hover:bg-white/20'}"
		>
			🏥 Funeral Directors
		</button>
		<button
			onclick={() => (activeTab = 'memorials')}
			class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 {activeTab === 'memorials' 
				? 'bg-white text-gray-900 shadow-lg' 
				: 'bg-white/10 text-white hover:bg-white/20'}"
		>
			💝 Memorials
		</button>
		<button
			onclick={() => (activeTab = 'memorial-owners')}
			class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 {activeTab === 'memorial-owners' 
				? 'bg-white text-gray-900 shadow-lg' 
				: 'bg-white/10 text-white hover:bg-white/20'}"
		>
			👥 Memorial Owners
		</button>
		<button
			onclick={() => (activeTab = 'create-memorial')}
			class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 {activeTab === 'create-memorial' 
				? 'bg-white text-gray-900 shadow-lg' 
				: 'bg-white/10 text-white hover:bg-white/20'}"
		>
			➕ Create Memorial
		</button>
		<button
			onclick={() => {
				activeTab = 'audit-logs';
				loadAuditLogs();
			}}
			class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 {activeTab === 'audit-logs' 
				? 'bg-white text-gray-900 shadow-lg' 
				: 'bg-white/10 text-white hover:bg-white/20'}"
		>
			🔍 Audit Logs
		</button>
	</div>

	<!-- Overview Tab -->
	{#if activeTab === 'overview'}
		<div class="space-y-6">
			<h2 class="mb-4 text-2xl font-bold text-white">System Overview</h2>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<div class="rounded-xl border border-white/10 bg-white/5 p-4">
					<div class="text-sm text-white/70">Scheduled Memorials</div>
					<div class="text-2xl font-bold text-amber-400">{scheduledMemorials.length}</div>
				</div>
				<div class="rounded-xl border border-white/10 bg-white/5 p-4">
					<div class="text-sm text-white/70">Completed Memorials</div>
					<div class="text-2xl font-bold text-green-400">{completedMemorials.length}</div>
				</div>
				<div class="rounded-xl border border-white/10 bg-white/5 p-4">
					<div class="text-sm text-white/70">Pending Approvals</div>
					<div class="text-2xl font-bold text-amber-400">{pendingFuneralDirectors.length}</div>
				</div>
				<div class="rounded-xl border border-white/10 bg-white/5 p-4">
					<div class="text-sm text-white/70">Total Users</div>
					<div class="text-2xl font-bold text-white">{allUsers.length}</div>
				</div>
			</div>

			<!-- Scheduled Memorials Section -->
			<div class="rounded-xl border border-white/10 bg-white/5 p-4">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-white">📅 Scheduled Memorials ({scheduledMemorials.length})</h3>
					{#if scheduledMemorials.length > 0}
						<div class="flex items-center gap-3">
							<label class="flex items-center gap-2 text-sm text-white/70">
								<input
									type="checkbox"
									bind:checked={selectAll}
									onchange={handleSelectAll}
									class="rounded border-white/20 bg-white/10 text-blue-500"
								/>
								Select All
							</label>
							{#if selectedMemorials.size > 0}
								<div class="flex gap-2">
									<Button
										onclick={() => toggleMemorialStatus(true)}
										disabled={isTogglingStatus}
										variant="primary"
										rounded="lg"
									>
										{isTogglingStatus ? 'Updating...' : `✅ Mark Complete (${selectedMemorials.size})`}
									</Button>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				{#if scheduledMemorials.length > 0}
					<div class="overflow-hidden rounded-lg border border-white/10">
						<div class="overflow-x-auto">
							<table class="w-full">
								<thead class="bg-white/10">
									<tr>
										<th class="px-3 py-2 text-left font-semibold text-white w-12">Select</th>
										<th class="px-3 py-2 text-left font-semibold text-white">Loved One</th>
										<th class="px-3 py-2 text-left font-semibold text-white">Creator</th>
										<th class="px-3 py-2 text-left font-semibold text-white">Created</th>
										<th class="px-3 py-2 text-left font-semibold text-white">Actions</th>
									</tr>
								</thead>
								<tbody>
									{#each scheduledMemorials as memorial}
										<tr class="border-b border-white/10 hover:bg-white/5">
											<td class="px-3 py-2">
												<input
													type="checkbox"
													checked={selectedMemorials.has(memorial.id || '')}
													onchange={(e) => handleMemorialSelect(memorial.id || '', e)}
													class="rounded border-white/20 bg-white/10 text-blue-500"
												/>
											</td>
											<td class="px-3 py-2 text-white font-medium">{memorial.lovedOneName}</td>
											<td class="px-3 py-2 text-sm text-white/70">{memorial.creatorEmail}</td>
											<td class="px-3 py-2 text-sm text-white/70">
												{memorial.createdAt ? new Date(memorial.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
											</td>
											<td class="px-3 py-2">
												<div class="flex gap-2">
													<a
														href="/{memorial.fullSlug}"
														class="text-sm text-blue-400 hover:text-blue-300">View</a
													>
													<a
														href="/memorials/{memorial.id}/streams"
														class="text-sm text-green-400 hover:text-green-300">Streams</a
													>
													<button
														onclick={() => toggleMemorialStatus(true)}
														class="text-sm text-amber-400 hover:text-amber-300"
													>
														Complete
													</button>
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{:else}
					<div class="text-center py-8 text-white/70">
						<p>No scheduled memorials found</p>
						<p class="text-sm mt-2">All memorials have been completed</p>
					</div>
				{/if}
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
			<div class="flex items-center justify-between">
				<h2 class="text-2xl font-bold text-white">Memorial Management</h2>
				{#if memorials.length > 0}
					<div class="flex items-center gap-3">
						<label class="flex items-center gap-2 text-sm text-white/70">
							<input
								type="checkbox"
								bind:checked={selectAll}
								onchange={handleSelectAll}
								class="rounded border-white/20 bg-white/10 text-blue-500"
							/>
							Select All
						</label>
						{#if selectedMemorials.size > 0}
							<div class="flex gap-2">
								<Button
									onclick={() => toggleMemorialStatus(true)}
									disabled={isTogglingStatus}
									variant="primary"
									rounded="lg"
								>
									{isTogglingStatus ? 'Updating...' : `✅ Mark Complete (${selectedMemorials.size})`}
								</Button>
								<Button
									onclick={() => toggleMemorialStatus(false)}
									disabled={isTogglingStatus}
									variant="secondary"
									rounded="lg"
								>
									{isTogglingStatus ? 'Updating...' : `📅 Mark Scheduled (${selectedMemorials.size})`}
								</Button>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<div class="overflow-hidden rounded-xl border border-white/10 bg-white/5">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-white/10">
							<tr>
								<th class="px-4 py-3 text-left font-semibold text-white w-12">Select</th>
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
										<td class="px-4 py-3">
											<input
												type="checkbox"
												checked={selectedMemorials.has(memorial.id || '')}
												onchange={(e) => handleMemorialSelect(memorial.id || '', e)}
												class="rounded border-white/20 bg-white/10 text-blue-500"
											/>
										</td>
										<td class="px-4 py-3 text-white">{memorial.lovedOneName}</td>
										<td class="px-4 py-3 text-sm text-white/70">{memorial.creatorEmail}</td>
										<td class="px-4 py-3">
											<div class="flex flex-col gap-1">
												{#if memorial.isComplete}
													<span class="rounded bg-green-500 px-2 py-1 text-xs text-white w-fit">✅ Completed</span>
												{:else}
													<span class="rounded bg-amber-500 px-2 py-1 text-xs text-white w-fit">📅 Scheduled</span>
												{/if}
												{#if memorial.isPublic}
													<span class="rounded bg-blue-500 px-2 py-1 text-xs text-white w-fit">Public</span>
												{:else}
													<span class="rounded bg-gray-500 px-2 py-1 text-xs text-white w-fit">Private</span>
												{/if}
											</div>
										</td>
										<td class="px-4 py-3">
											<div class="flex gap-2">
												<a
													href="/{memorial.fullSlug}"
													class="text-sm text-blue-400 hover:text-blue-300">View</a
												>
												<a
													href="/memorials/{memorial.id}/streams"
													class="text-sm text-green-400 hover:text-green-300">Streams</a
												>
												<a
													href="/schedule?memorialId={memorial.id}"
													class="text-sm text-purple-400 hover:text-purple-300">Schedule</a
												>
												<button
													onclick={() => toggleMemorialStatus(!memorial.isComplete)}
													class="text-sm {memorial.isComplete ? 'text-amber-400 hover:text-amber-300' : 'text-green-400 hover:text-green-300'}"
												>
													{memorial.isComplete ? 'Mark Scheduled' : 'Mark Complete'}
												</button>
												<button
													onclick={() => deleteMemorial(memorial.id || '', memorial.lovedOneName)}
													class="text-sm text-red-400 hover:text-red-300"
												>
													Delete
												</button>
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

	<!-- Memorial Owners Tab -->
	{#if activeTab === 'memorial-owners'}
		<div class="space-y-6">
			<h2 class="mb-4 text-2xl font-bold text-white">Memorial Owners</h2>
			<p class="text-white/70 mb-6">Manage families and individuals who own memorial pages</p>

			<div class="overflow-hidden rounded-xl border border-white/10 bg-white/5">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-white/10">
							<tr>
								<th class="px-4 py-3 text-left font-semibold text-white">Owner Name</th>
								<th class="px-4 py-3 text-left font-semibold text-white">Email</th>
								<th class="px-4 py-3 text-left font-semibold text-white">Memorials</th>
								<th class="px-4 py-3 text-left font-semibold text-white">Joined</th>
								<th class="px-4 py-3 text-left font-semibold text-white">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#if allUsers && allUsers.length > 0}
								{#each allUsers.filter(user => user.role === 'owner' || !user.role) as owner}
									{@const ownerMemorials = memorials.filter(m => m.creatorEmail === owner.email)}
									<tr class="border-b border-white/10 hover:bg-white/5">
										<td class="px-4 py-3 text-white">
											{owner.displayName || 'Unknown'}
										</td>
										<td class="px-4 py-3 text-sm text-white/70">
											{owner.email}
										</td>
										<td class="px-4 py-3">
											<div class="flex flex-col gap-1">
												<span class="text-white font-medium">{ownerMemorials.length} memorial{ownerMemorials.length !== 1 ? 's' : ''}</span>
												{#if ownerMemorials.length > 0}
													<div class="text-xs text-white/60">
														{ownerMemorials.slice(0, 2).map(m => m.lovedOneName).join(', ')}
														{#if ownerMemorials.length > 2}
															<span class="text-white/40">+{ownerMemorials.length - 2} more</span>
														{/if}
													</div>
												{/if}
											</div>
										</td>
										<td class="px-4 py-3 text-sm text-white/70">
											{owner.createdAt ? new Date(owner.createdAt).toLocaleDateString() : 'Unknown'}
										</td>
										<td class="px-4 py-3">
											<div class="flex gap-2">
												<button
													class="text-sm text-blue-400 hover:text-blue-300"
													onclick={() => {
														// Navigate to user's first memorial if they have one
														if (ownerMemorials.length > 0) {
															window.open(`/${ownerMemorials[0].fullSlug}`, '_blank');
														}
													}}
													disabled={ownerMemorials.length === 0}
												>
													View Memorial{ownerMemorials.length > 1 ? 's' : ''}
												</button>
												<button
													class="text-sm text-green-400 hover:text-green-300"
													onclick={() => {
														// Copy email to clipboard
														navigator.clipboard.writeText(owner.email);
														alert('Email copied to clipboard!');
													}}
												>
													Contact
												</button>
												<button
													onclick={() => deleteUser(owner.uid, owner.email)}
													class="text-sm text-red-400 hover:text-red-300"
												>
													Delete
												</button>
											</div>
										</td>
									</tr>
								{/each}
							{:else}
								<tr>
									<td colspan="5" class="px-4 py-8 text-center text-white/70">No memorial owners found</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Memorial Owners Summary Stats -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="rounded-xl border border-white/10 bg-white/5 p-6">
					<h3 class="text-lg font-semibold text-white mb-2">Total Owners</h3>
					<p class="text-3xl font-bold text-blue-400">
						{allUsers.filter(user => user.role === 'owner' || !user.role).length}
					</p>
					<p class="text-sm text-white/60 mt-1">Families & individuals</p>
				</div>
				
				<div class="rounded-xl border border-white/10 bg-white/5 p-6">
					<h3 class="text-lg font-semibold text-white mb-2">Active Owners</h3>
					<p class="text-3xl font-bold text-green-400">
						{allUsers.filter(user => (user.role === 'owner' || !user.role) && 
							memorials.some(m => m.creatorEmail === user.email)).length}
					</p>
					<p class="text-sm text-white/60 mt-1">With memorials</p>
				</div>
				
				<div class="rounded-xl border border-white/10 bg-white/5 p-6">
					<h3 class="text-lg font-semibold text-white mb-2">Avg. Memorials</h3>
					<p class="text-3xl font-bold text-purple-400">
						{allUsers.filter(user => user.role === 'owner' || !user.role).length > 0 
							? (memorials.length / allUsers.filter(user => user.role === 'owner' || !user.role).length).toFixed(1)
							: '0.0'}
					</p>
					<p class="text-sm text-white/60 mt-1">Per owner</p>
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
