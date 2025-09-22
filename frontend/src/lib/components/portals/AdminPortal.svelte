<!-- Simplified Admin Portal - Funeral Director Approval & Memorial Management -->
<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';
	import { invalidateAll } from '$app/navigation';

	// Props from parent component
	let { 
		memorials, 
		allUsers, 
		pendingFuneralDirectors = [], 
		approvedFuneralDirectors = [] 
	}: { 
		memorials: Memorial[], 
		allUsers: {uid: string, email: string, displayName: string, role?: string}[], 
		pendingFuneralDirectors?: any[],
		approvedFuneralDirectors?: any[]
	} = $props();

	// Active tab state
	let activeTab = $state<'overview' | 'funeral-directors' | 'memorials' | 'create-memorial' | 'audit-logs'>('overview');

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
			'memorial_created': '🆕',
			'memorial_updated': '✏️',
			'memorial_deleted': '🗑️',
			'memorial_viewed': '👁️',
			'user_login': '🔐',
			'user_logout': '🚪',
			'user_created': '👤',
			'role_changed': '🔄',
			'schedule_updated': '📅',
			'schedule_locked': '🔒',
			'payment_completed': '💳',
			'payment_failed': '❌',
			'livestream_started': '📺',
			'livestream_stopped': '⏹️',
			'livestream_configured': '⚙️',
			'funeral_director_approved': '✅',
			'funeral_director_rejected': '❌',
			'admin_memorial_created': '👑',
			'system_config_changed': '⚙️',
			'api_access_denied': '🚫'
		};
		return emojiMap[action] || '📝';
	}
</script>

<!-- Simplified Admin Dashboard with Tabs -->
<div class="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-2xl">
	<!-- Tab Navigation -->
	<div class="flex space-x-4 mb-6 border-b border-white/20 pb-4">
		<button 
			onclick={() => activeTab = 'overview'}
			class="px-4 py-2 rounded-lg transition-all duration-200 {activeTab === 'overview' ? 'bg-amber-500 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}"
		>
			📊 Overview
		</button>
		<button 
			onclick={() => activeTab = 'funeral-directors'}
			class="px-4 py-2 rounded-lg transition-all duration-200 {activeTab === 'funeral-directors' ? 'bg-amber-500 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}"
		>
			🏥 Funeral Directors
		</button>
		<button 
			onclick={() => activeTab = 'memorials'}
			class="px-4 py-2 rounded-lg transition-all duration-200 {activeTab === 'memorials' ? 'bg-amber-500 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}"
		>
			💝 Memorials
		</button>
		<button 
			onclick={() => activeTab = 'create-memorial'}
			class="px-4 py-2 rounded-lg transition-all duration-200 {activeTab === 'create-memorial' ? 'bg-amber-500 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}"
		>
			➕ Create Memorial
		</button>
		<button 
			onclick={() => { activeTab = 'audit-logs'; loadAuditLogs(); }}
			class="px-4 py-2 rounded-lg transition-all duration-200 {activeTab === 'audit-logs' ? 'bg-amber-500 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}"
		>
			🔍 Audit Logs
		</button>
	</div>

	<!-- Overview Tab -->
	{#if activeTab === 'overview'}
		<div class="space-y-6">
			<h2 class="text-2xl font-bold text-white mb-4">System Overview</h2>
			
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<div class="bg-white/5 rounded-xl p-4 border border-white/10">
					<div class="text-white/70 text-sm">Total Memorials</div>
					<div class="text-2xl font-bold text-white">{memorials.length}</div>
				</div>
				<div class="bg-white/5 rounded-xl p-4 border border-white/10">
					<div class="text-white/70 text-sm">Total Users</div>
					<div class="text-2xl font-bold text-white">{allUsers.length}</div>
				</div>
				<div class="bg-white/5 rounded-xl p-4 border border-white/10">
					<div class="text-white/70 text-sm">Pending Approvals</div>
					<div class="text-2xl font-bold text-amber-400">{pendingFuneralDirectors.length}</div>
				</div>
				<div class="bg-white/5 rounded-xl p-4 border border-white/10">
					<div class="text-white/70 text-sm">Approved Directors</div>
					<div class="text-2xl font-bold text-green-400">{approvedFuneralDirectors.length}</div>
				</div>
			</div>

			<div class="bg-white/5 rounded-xl p-4 border border-white/10">
				<h3 class="text-lg font-semibold text-white mb-3">Quick Actions</h3>
				<div class="flex flex-wrap gap-3">
					<button 
						onclick={() => activeTab = 'funeral-directors'}
						class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
					>
						Review Pending Directors ({pendingFuneralDirectors.length})
					</button>
					<button 
						onclick={() => activeTab = 'create-memorial'}
						class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
					>
						Create New Memorial
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Funeral Directors Tab -->
	{#if activeTab === 'funeral-directors'}
		<div class="space-y-6">
			<h2 class="text-2xl font-bold text-white mb-4">Funeral Director Management</h2>
			
			<!-- Pending Approvals -->
			{#if pendingFuneralDirectors.length > 0}
				<div class="bg-white/5 rounded-xl p-4 border border-white/10">
					<h3 class="text-lg font-semibold text-amber-400 mb-4">⏳ Pending Approvals ({pendingFuneralDirectors.length})</h3>
					<div class="space-y-3">
						{#each pendingFuneralDirectors as director}
							<div class="bg-white/5 rounded-lg p-4 border border-white/10">
								<div class="flex justify-between items-start">
									<div class="flex-1">
										<h4 class="text-white font-semibold">{director.companyName}</h4>
										<p class="text-white/70 text-sm">Contact: {director.contactPerson}</p>
										<p class="text-white/70 text-sm">Email: {director.email}</p>
										<p class="text-white/70 text-sm">License: {director.licenseNumber}</p>
										<p class="text-white/70 text-sm">Business Type: {director.businessType}</p>
									</div>
									<div class="flex gap-2">
										<button 
											onclick={() => approveFuneralDirector(director.id)}
											disabled={isApproving}
											class="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg transition-colors text-sm"
										>
											{isApproving ? 'Approving...' : '✅ Approve'}
										</button>
										<button 
											onclick={() => rejectFuneralDirector(director.id)}
											class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
										>
											❌ Reject
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
					<p class="text-white/70">No pending funeral director applications</p>
				</div>
			{/if}

			<!-- Approved Directors -->
			{#if approvedFuneralDirectors.length > 0}
				<div class="bg-white/5 rounded-xl p-4 border border-white/10">
					<h3 class="text-lg font-semibold text-green-400 mb-4">✅ Approved Directors ({approvedFuneralDirectors.length})</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
						{#each approvedFuneralDirectors as director}
							<div class="bg-white/5 rounded-lg p-3 border border-white/10">
								<h4 class="text-white font-semibold text-sm">{director.companyName}</h4>
								<p class="text-white/70 text-xs">{director.contactPerson}</p>
								<p class="text-white/70 text-xs">{director.email}</p>
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
			<h2 class="text-2xl font-bold text-white mb-4">Memorial Management</h2>
			
			<div class="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-white/10">
							<tr>
								<th class="px-4 py-3 text-left text-white font-semibold">Loved One</th>
								<th class="px-4 py-3 text-left text-white font-semibold">Creator</th>
								<th class="px-4 py-3 text-left text-white font-semibold">Status</th>
								<th class="px-4 py-3 text-left text-white font-semibold">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#if memorials && memorials.length > 0}
								{#each memorials as memorial}
									<tr class="border-b border-white/10 hover:bg-white/5">
										<td class="px-4 py-3 text-white">{memorial.lovedOneName}</td>
										<td class="px-4 py-3 text-white/70 text-sm">{memorial.creatorEmail}</td>
										<td class="px-4 py-3">
											{#if memorial.livestream}
												<span class="px-2 py-1 bg-green-500 text-white text-xs rounded">Live</span>
											{:else}
												<span class="px-2 py-1 bg-gray-500 text-white text-xs rounded">Inactive</span>
											{/if}
										</td>
										<td class="px-4 py-3">
											<div class="flex gap-2">
												<a href="/{memorial.fullSlug}" class="text-blue-400 hover:text-blue-300 text-sm">View</a>
												<a href="/schedule?memorialId={memorial.id}" class="text-purple-400 hover:text-purple-300 text-sm">Schedule</a>
											</div>
										</td>
									</tr>
								{/each}
							{:else}
								<tr>
									<td colspan="4" class="px-4 py-8 text-center text-white/70">No memorials found</td>
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
			<h2 class="text-2xl font-bold text-white mb-4">Create New Memorial</h2>
			
			<div class="bg-white/5 rounded-xl p-6 border border-white/10">
				<form onsubmit={createMemorial} class="space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label class="block text-white font-semibold mb-2">Loved One's Name *</label>
							<input 
								type="text" 
								bind:value={newMemorialForm.lovedOneName}
								class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-amber-400"
								placeholder="Enter the loved one's name"
								required
							/>
						</div>
						<div>
							<label class="block text-white font-semibold mb-2">Creator Email *</label>
							<input 
								type="email" 
								bind:value={newMemorialForm.creatorEmail}
								class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-amber-400"
								placeholder="Family contact email"
								required
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label class="block text-white font-semibold mb-2">Creator Name</label>
							<input 
								type="text" 
								bind:value={newMemorialForm.creatorName}
								class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-amber-400"
								placeholder="Family contact name"
							/>
						</div>
						<div>
							<label class="block text-white font-semibold mb-2">Location</label>
							<input 
								type="text" 
								bind:value={newMemorialForm.location}
								class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-amber-400"
								placeholder="Service location"
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label class="block text-white font-semibold mb-2">Service Date</label>
							<input 
								type="date" 
								bind:value={newMemorialForm.serviceDate}
								class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-400"
							/>
						</div>
						<div>
							<label class="block text-white font-semibold mb-2">Service Time</label>
							<input 
								type="time" 
								bind:value={newMemorialForm.serviceTime}
								class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-400"
							/>
						</div>
					</div>

					<div>
						<label class="block text-white font-semibold mb-2">Memorial Description</label>
						<textarea 
							bind:value={newMemorialForm.content}
							class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-amber-400 h-24 resize-none"
							placeholder="Brief description or obituary text"
						></textarea>
					</div>

					<div class="flex items-center gap-3">
						<input 
							type="checkbox" 
							bind:checked={newMemorialForm.isPublic}
							id="isPublic"
							class="w-4 h-4 text-amber-400 bg-white/10 border-white/20 rounded focus:ring-amber-400"
						/>
						<label for="isPublic" class="text-white">Make memorial publicly visible</label>
					</div>

					<div class="flex gap-4 pt-4">
						<button 
							type="submit"
							disabled={isCreatingMemorial}
							class="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold rounded-lg transition-colors"
						>
							{isCreatingMemorial ? 'Creating...' : '✨ Create Memorial'}
						</button>
						<button 
							type="button"
							onclick={() => activeTab = 'overview'}
							class="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Audit Logs Tab -->
	{#if activeTab === 'audit-logs'}
		<div class="space-y-6">
			<h2 class="text-2xl font-bold text-white mb-4">🔍 Audit Logs</h2>
			
			<!-- Filters -->
			<div class="bg-white/5 rounded-xl p-4 border border-white/10">
				<h3 class="text-lg font-semibold text-white mb-4">Filters</h3>
				<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
					<div>
						<label class="block text-white/70 text-sm mb-1">Action</label>
						<select 
							bind:value={auditFilters.action}
							class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-amber-400"
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
						<label class="block text-white/70 text-sm mb-1">User Email</label>
						<input 
							type="email"
							bind:value={auditFilters.userEmail}
							placeholder="Filter by user"
							class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/50 focus:outline-none focus:border-amber-400"
						/>
					</div>
					<div>
						<label class="block text-white/70 text-sm mb-1">Resource Type</label>
						<select 
							bind:value={auditFilters.resourceType}
							class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-amber-400"
						>
							<option value="">All Types</option>
							<option value="memorial">Memorial</option>
							<option value="user">User</option>
							<option value="schedule">Schedule</option>
							<option value="payment">Payment</option>
							<option value="livestream">Livestream</option>
						</select>
					</div>
					<div>
						<label class="block text-white/70 text-sm mb-1">Date From</label>
						<input 
							type="date"
							bind:value={auditFilters.dateFrom}
							class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-amber-400"
						/>
					</div>
					<div>
						<label class="block text-white/70 text-sm mb-1">Date To</label>
						<input 
							type="date"
							bind:value={auditFilters.dateTo}
							class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-amber-400"
						/>
					</div>
					<div>
						<label class="block text-white/70 text-sm mb-1">Limit</label>
						<select 
							bind:value={auditFilters.limit}
							class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-amber-400"
						>
							<option value={25}>25</option>
							<option value={50}>50</option>
							<option value={100}>100</option>
							<option value={250}>250</option>
						</select>
					</div>
				</div>
				<div class="flex gap-2 mt-4">
					<button 
						onclick={loadAuditLogs}
						disabled={auditLoading}
						class="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold rounded-lg transition-colors"
					>
						{auditLoading ? 'Loading...' : '🔍 Search'}
					</button>
					<button 
						onclick={() => {
							auditFilters.action = '';
							auditFilters.userEmail = '';
							auditFilters.resourceType = '';
							auditFilters.dateFrom = '';
							auditFilters.dateTo = '';
							auditFilters.limit = 50;
							loadAuditLogs();
						}}
						class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
					>
						🔄 Clear Filters
					</button>
				</div>
			</div>

			<!-- Audit Logs Table -->
			<div class="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
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
									<th class="px-4 py-3 text-left text-white font-semibold">Timestamp</th>
									<th class="px-4 py-3 text-left text-white font-semibold">Action</th>
									<th class="px-4 py-3 text-left text-white font-semibold">User</th>
									<th class="px-4 py-3 text-left text-white font-semibold">Resource</th>
									<th class="px-4 py-3 text-left text-white font-semibold">Details</th>
									<th class="px-4 py-3 text-left text-white font-semibold">IP Address</th>
								</tr>
							</thead>
							<tbody>
								{#each auditLogs as log, index}
									<tr class="border-t border-white/10 {index % 2 === 0 ? 'bg-white/5' : ''}">
										<td class="px-4 py-3 text-white/90 text-sm">
											{formatTimestamp(log.timestamp)}
										</td>
										<td class="px-4 py-3 text-white/90">
											<span class="inline-flex items-center gap-2">
												{getActionEmoji(log.action)}
												<span class="text-sm">{log.action}</span>
											</span>
										</td>
										<td class="px-4 py-3 text-white/90 text-sm">
											<div>
												<div class="font-medium">{log.userEmail || 'Unknown'}</div>
												{#if log.userRole}
													<div class="text-xs text-white/60">{log.userRole}</div>
												{/if}
											</div>
										</td>
										<td class="px-4 py-3 text-white/90 text-sm">
											{#if log.resourceType && log.resourceId}
												<div>
													<div class="font-medium">{log.resourceType}</div>
													<div class="text-xs text-white/60 font-mono">{log.resourceId}</div>
												</div>
											{:else}
												<span class="text-white/50">-</span>
											{/if}
										</td>
										<td class="px-4 py-3 text-white/90 text-sm max-w-xs">
											{#if log.details}
												<div class="truncate" title={JSON.stringify(log.details, null, 2)}>
													{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
												</div>
											{:else}
												<span class="text-white/50">-</span>
											{/if}
										</td>
										<td class="px-4 py-3 text-white/90 text-sm font-mono">
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
				<div class="bg-white/5 rounded-xl p-4 border border-white/10">
					<h3 class="text-lg font-semibold text-white mb-2">Summary</h3>
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
						<div>
							<div class="text-white/70">Total Events</div>
							<div class="text-white font-semibold text-lg">{auditLogs.length}</div>
						</div>
						<div>
							<div class="text-white/70">Unique Users</div>
							<div class="text-white font-semibold text-lg">
								{new Set(auditLogs.map(log => log.userEmail).filter(Boolean)).size}
							</div>
						</div>
						<div>
							<div class="text-white/70">Access Denied</div>
							<div class="text-white font-semibold text-lg">
								{auditLogs.filter(log => log.action === 'api_access_denied').length}
							</div>
						</div>
						<div>
							<div class="text-white/70">Date Range</div>
							<div class="text-white font-semibold text-sm">
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