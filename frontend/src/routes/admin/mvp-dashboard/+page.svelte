<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Card, Badge } from '$lib/components/minimal-modern';

	// Props from server
	let { data } = $props();

	// Tab state
	let activeTab = $state<'overview' | 'memorials' | 'users' | 'purchases' | 'streams'>('overview');

	// Data states
	let stats = $state(data.stats || {
		memorials: 0,
		users: 0,
		purchases: 0,
		activeStreams: 0
	});

	let memorials = $state<any[]>([]);
	let users = $state<any[]>([]);
	let purchases = $state<any[]>([]);
	let streams = $state<any[]>([]);

	// Loading states
	let loading = $state(false);
	let tabLoading = $state(false);

	onMount(() => {
		console.log('🏛️ [ADMIN MVP] Dashboard mounted with data:', data);
	});

	function switchTab(tab: typeof activeTab) {
		activeTab = tab;
		loadTabData(tab);
	}

	async function loadTabData(tab: string) {
		if (tab === 'overview') return; // Overview uses server-loaded stats
		
		tabLoading = true;
		try {
			console.log(`📊 [ADMIN MVP] Loading data for ${tab} tab`);
			
			switch (tab) {
				case 'memorials':
					await loadMemorials();
					break;
				case 'users':
					await loadUsers();
					break;
				case 'purchases':
					await loadPurchases();
					break;
				case 'streams':
					await loadStreams();
					break;
			}
		} catch (error) {
			console.error(`❌ [ADMIN MVP] Error loading ${tab} data:`, error);
		} finally {
			tabLoading = false;
		}
	}

	async function loadMemorials() {
		const response = await fetch('/api/admin/mvp/memorials');
		if (response.ok) {
			const data = await response.json();
			memorials = data.memorials || [];
		}
	}

	async function loadUsers() {
		const response = await fetch('/api/admin/mvp/users');
		if (response.ok) {
			const data = await response.json();
			users = data.users || [];
		}
	}

	async function loadPurchases() {
		// TODO: Implement purchases API
		console.log('📊 [ADMIN MVP] Purchases API not yet implemented');
		purchases = [];
	}

	async function loadStreams() {
		// TODO: Implement streams API
		console.log('📊 [ADMIN MVP] Streams API not yet implemented');
		streams = [];
	}

	// CRUD Operations
	async function createItem(type: string) {
		console.log(`➕ [ADMIN MVP] Creating new ${type}`);
		
		if (type === 'memorial') {
			await createMemorial();
		} else if (type === 'user') {
			await createUser();
		}
	}

	async function createMemorial() {
		const lovedOneName = prompt('Enter loved one\'s name:');
		const creatorEmail = prompt('Enter creator email:');
		
		if (!lovedOneName || !creatorEmail) return;

		try {
			const response = await fetch('/api/admin/mvp/memorials', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lovedOneName, creatorEmail })
			});

			if (response.ok) {
				console.log('✅ [ADMIN MVP] Memorial created successfully');
				await loadMemorials(); // Refresh list
			} else {
				const error = await response.json();
				alert(`Error creating memorial: ${error.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN MVP] Error creating memorial:', error);
			alert('Failed to create memorial');
		}
	}

	async function createUser() {
		const email = prompt('Enter user email:');
		const displayName = prompt('Enter user name:');
		const role = prompt('Enter user role (owner/viewer/funeral_director):') || 'viewer';
		
		if (!email || !displayName) return;

		try {
			const response = await fetch('/api/admin/mvp/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, displayName, role })
			});

			if (response.ok) {
				console.log('✅ [ADMIN MVP] User created successfully');
				await loadUsers(); // Refresh list
			} else {
				const error = await response.json();
				alert(`Error creating user: ${error.error}`);
			}
		} catch (error) {
			console.error('❌ [ADMIN MVP] Error creating user:', error);
			alert('Failed to create user');
		}
	}

	async function editItem(type: string, id: string) {
		console.log(`✏️ [ADMIN MVP] Editing ${type} with id: ${id}`);
		// TODO: Implement edit modals
	}

	async function deleteItem(type: string, id: string) {
		if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
		
		try {
			let endpoint = '';
			if (type === 'memorial') endpoint = '/api/admin/mvp/memorials';
			if (type === 'user') endpoint = '/api/admin/mvp/users';
			
			const response = await fetch(`${endpoint}?id=${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				console.log(`✅ [ADMIN MVP] ${type} deleted successfully`);
				// Refresh the appropriate list
				if (type === 'memorial') await loadMemorials();
				if (type === 'user') await loadUsers();
			} else {
				const error = await response.json();
				alert(`Error deleting ${type}: ${error.error}`);
			}
		} catch (error) {
			console.error(`❌ [ADMIN MVP] Error deleting ${type}:`, error);
			alert(`Failed to delete ${type}`);
		}
	}
</script>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="mx-auto max-w-7xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900">🏛️ TributeStream Admin Dashboard</h1>
			<p class="text-gray-600">Manage memorials, users, purchases, and streams</p>
		</div>

		<!-- Tab Navigation -->
		<div class="mb-6 border-b border-gray-200">
			<nav class="-mb-px flex space-x-8">
				<button
					onclick={() => switchTab('overview')}
					class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors
						{activeTab === 'overview'
							? 'border-yellow-500 text-yellow-600'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
				>
					📊 Overview
				</button>
				<button
					onclick={() => switchTab('memorials')}
					class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors
						{activeTab === 'memorials'
							? 'border-yellow-500 text-yellow-600'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
				>
					💝 Memorials
				</button>
				<button
					onclick={() => switchTab('users')}
					class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors
						{activeTab === 'users'
							? 'border-yellow-500 text-yellow-600'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
				>
					👥 Users
				</button>
				<button
					onclick={() => switchTab('purchases')}
					class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors
						{activeTab === 'purchases'
							? 'border-yellow-500 text-yellow-600'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
				>
					💰 Purchases
				</button>
				<button
					onclick={() => switchTab('streams')}
					class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors
						{activeTab === 'streams'
							? 'border-yellow-500 text-yellow-600'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
				>
					🎥 Streams
				</button>
			</nav>
		</div>

		<!-- Tab Content -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200">
			<!-- Overview Tab -->
			{#if activeTab === 'overview'}
				<div class="p-6">
					<h2 class="text-xl font-semibold mb-6 text-gray-900">System Overview</h2>
					
					<!-- Metrics Cards -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
						<Card theme="minimal" class="bg-blue-50 border-blue-200">
							<div class="text-center">
								<div class="text-3xl font-bold text-blue-600 mb-2">{stats.memorials}</div>
								<div class="text-sm text-gray-600">Total Memorials</div>
							</div>
						</Card>
						
						<Card theme="minimal" class="bg-green-50 border-green-200">
							<div class="text-center">
								<div class="text-3xl font-bold text-green-600 mb-2">{stats.users}</div>
								<div class="text-sm text-gray-600">Total Users</div>
							</div>
						</Card>
						
						<Card theme="minimal" class="bg-yellow-50 border-yellow-200">
							<div class="text-center">
								<div class="text-3xl font-bold text-yellow-600 mb-2">{stats.purchases}</div>
								<div class="text-sm text-gray-600">Total Purchases</div>
							</div>
						</Card>
						
						<Card theme="minimal" class="bg-red-50 border-red-200">
							<div class="text-center">
								<div class="text-3xl font-bold text-red-600 mb-2">{stats.activeStreams}</div>
								<div class="text-sm text-gray-600">Active Streams</div>
							</div>
						</Card>
					</div>

					<!-- Quick Actions -->
					<Card theme="minimal" title="Quick Actions">
						<div class="flex flex-wrap gap-4">
							<Button theme="minimal" onclick={() => switchTab('memorials')}>
								Create Memorial
							</Button>
							<Button theme="minimal" onclick={() => switchTab('users')}>
								Manage Users
							</Button>
							<Button theme="minimal" onclick={() => switchTab('streams')}>
								Monitor Streams
							</Button>
						</div>
					</Card>
				</div>
			{/if}

			<!-- Memorials Tab -->
			{#if activeTab === 'memorials'}
				<div class="p-6">
					<div class="flex justify-between items-center mb-6">
						<h2 class="text-xl font-semibold text-gray-900">Memorial Management</h2>
						<Button theme="minimal" onclick={() => createItem('memorial')}>
							Create Memorial
						</Button>
					</div>
					
					{#if tabLoading}
						<div class="text-center py-8">
							<div class="text-gray-500">Loading memorials...</div>
						</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Name
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Creator
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Status
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Created
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200">
									{#if memorials.length === 0}
										<tr>
											<td colspan="5" class="px-6 py-8 text-center text-gray-500">
												No memorials found. Click "Create Memorial" to add one.
											</td>
										</tr>
									{:else}
										{#each memorials as memorial}
											<tr class="hover:bg-gray-50">
												<td class="px-6 py-4 whitespace-nowrap">
													<div class="text-sm font-medium text-gray-900">{memorial.lovedOneName}</div>
													<div class="text-sm text-gray-500">{memorial.fullSlug}</div>
												</td>
												<td class="px-6 py-4 whitespace-nowrap">
													<div class="text-sm text-gray-900">{memorial.creatorEmail}</div>
													{#if memorial.creatorName}
														<div class="text-sm text-gray-500">{memorial.creatorName}</div>
													{/if}
												</td>
												<td class="px-6 py-4 whitespace-nowrap">
													{#if memorial.isPublic}
														<Badge theme="minimal" class="bg-green-100 text-green-800">Public</Badge>
													{:else}
														<Badge theme="minimal" class="bg-gray-100 text-gray-800">Private</Badge>
													{/if}
												</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
													{memorial.createdAt ? new Date(memorial.createdAt).toLocaleDateString() : 'Unknown'}
												</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
													<div class="flex space-x-2">
														<button
															onclick={() => editItem('memorial', memorial.id)}
															class="text-indigo-600 hover:text-indigo-900"
														>
															Edit
														</button>
														<button
															onclick={() => deleteItem('memorial', memorial.id)}
															class="text-red-600 hover:text-red-900"
														>
															Delete
														</button>
													</div>
												</td>
											</tr>
										{/each}
									{/if}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Users Tab -->
			{#if activeTab === 'users'}
				<div class="p-6">
					<div class="flex justify-between items-center mb-6">
						<h2 class="text-xl font-semibold text-gray-900">User Management</h2>
						<Button theme="minimal" onclick={() => createItem('user')}>
							Create User
						</Button>
					</div>
					
					{#if tabLoading}
						<div class="text-center py-8">
							<div class="text-gray-500">Loading users...</div>
						</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Email
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Name
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Role
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Registered
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200">
									{#if users.length === 0}
										<tr>
											<td colspan="5" class="px-6 py-8 text-center text-gray-500">
												No users found. Click "Create User" to add one.
											</td>
										</tr>
									{:else}
										{#each users as user}
											<tr class="hover:bg-gray-50">
												<td class="px-6 py-4 whitespace-nowrap">
													<div class="text-sm font-medium text-gray-900">{user.email}</div>
												</td>
												<td class="px-6 py-4 whitespace-nowrap">
													<div class="text-sm text-gray-900">{user.displayName || 'No name'}</div>
												</td>
												<td class="px-6 py-4 whitespace-nowrap">
													<Badge theme="minimal" class="
														{user.role === 'admin' ? 'bg-red-100 text-red-800' : 
														 user.role === 'owner' ? 'bg-blue-100 text-blue-800' :
														 user.role === 'funeral_director' ? 'bg-purple-100 text-purple-800' :
														 'bg-gray-100 text-gray-800'}
													">
														{user.role || 'viewer'}
													</Badge>
												</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
													{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
												</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
													<div class="flex space-x-2">
														<button
															onclick={() => editItem('user', user.id)}
															class="text-indigo-600 hover:text-indigo-900"
														>
															Edit
														</button>
														<button
															onclick={() => deleteItem('user', user.id)}
															class="text-red-600 hover:text-red-900"
														>
															Delete
														</button>
													</div>
												</td>
											</tr>
										{/each}
									{/if}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Purchases Tab -->
			{#if activeTab === 'purchases'}
				<div class="p-6">
					<h2 class="text-xl font-semibold mb-6 text-gray-900">Purchase Management</h2>
					
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Customer
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Package
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Amount
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Date
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								<tr>
									<td colspan="6" class="px-6 py-8 text-center text-gray-500">
										No purchases found. Loading purchase data...
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			<!-- Streams Tab -->
			{#if activeTab === 'streams'}
				<div class="p-6">
					<h2 class="text-xl font-semibold mb-6 text-gray-900">Stream Monitoring</h2>
					
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Memorial
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Start Time
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Viewers
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								<tr>
									<td colspan="5" class="px-6 py-8 text-center text-gray-500">
										No active streams. Loading stream data...
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
