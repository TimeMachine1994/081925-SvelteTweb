<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { AdminDashboardStats, UserManagementData, FuneralDirectorApplication } from '$lib/types/admin';

	let stats: AdminDashboardStats | null = null;
	let users: UserManagementData[] = [];
	let applications: FuneralDirectorApplication[] = [];
	let loading = true;
	let activeTab = 'dashboard';

	onMount(async () => {
		await loadDashboardData();
	});

	async function loadDashboardData() {
		try {
			loading = true;
			const [statsRes, usersRes, appsRes] = await Promise.all([
				fetch('/api/admin/stats'),
				fetch('/api/admin/users'),
				fetch('/api/admin/applications')
			]);

			if (statsRes.ok) stats = await statsRes.json();
			if (usersRes.ok) users = await usersRes.json();
			if (appsRes.ok) applications = await appsRes.json();
		} catch (error) {
			console.error('Error loading admin data:', error);
		} finally {
			loading = false;
		}
	}

	async function approveApplication(applicationId: string) {
		try {
			const response = await fetch(`/api/admin/applications/${applicationId}/approve`, {
				method: 'POST'
			});
			
			if (response.ok) {
				await loadDashboardData();
			}
		} catch (error) {
			console.error('Error approving application:', error);
		}
	}

	async function rejectApplication(applicationId: string, reason: string) {
		try {
			const response = await fetch(`/api/admin/applications/${applicationId}/reject`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reason })
			});
			
			if (response.ok) {
				await loadDashboardData();
			}
		} catch (error) {
			console.error('Error rejecting application:', error);
		}
	}

	async function suspendUser(uid: string, reason: string) {
		try {
			const response = await fetch(`/api/admin/users/${uid}/suspend`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reason })
			});
			
			if (response.ok) {
				await loadDashboardData();
			}
		} catch (error) {
			console.error('Error suspending user:', error);
		}
	}

	async function activateUser(uid: string) {
		try {
			const response = await fetch(`/api/admin/users/${uid}/activate`, {
				method: 'POST'
			});
			
			if (response.ok) {
				await loadDashboardData();
			}
		} catch (error) {
			console.error('Error activating user:', error);
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
	<!-- Animated Background -->
	<div class="fixed inset-0 overflow-hidden pointer-events-none">
		<div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
		<div class="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
		<div class="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
	</div>

	<div class="relative z-10 container mx-auto px-4 py-8">
		<!-- Header -->
		<div class="mb-8">
			<div class="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-2xl">
				<div class="flex items-center gap-4">
					<div class="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
						<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
						</svg>
					</div>
					<div>
						<h1 class="text-3xl font-bold text-white mb-2">Admin Portal</h1>
						<p class="text-white/70">System administration and user management</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Navigation Tabs -->
		<div class="mb-8">
			<div class="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-2 shadow-xl">
				<div class="flex gap-2">
					<button 
						class="flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 {activeTab === 'dashboard' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}"
						on:click={() => activeTab = 'dashboard'}
					>
						Dashboard
					</button>
					<button 
						class="flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 {activeTab === 'users' ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}"
						on:click={() => activeTab = 'users'}
					>
						User Management
					</button>
					<button 
						class="flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 {activeTab === 'applications' ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}"
						on:click={() => activeTab = 'applications'}
					>
						Applications ({applications.length})
					</button>
				</div>
			</div>
		</div>

		{#if loading}
			<div class="flex justify-center items-center py-20">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
			</div>
		{:else}
			<!-- Dashboard Tab -->
			{#if activeTab === 'dashboard'}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
					<!-- Stats Cards -->
					{#if stats}
						<div class="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
							<div class="flex items-center justify-between">
								<div>
									<p class="text-white/70 text-sm font-medium">Total Users</p>
									<p class="text-3xl font-bold text-white">{stats.totalUsers}</p>
								</div>
								<div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
									<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
									</svg>
								</div>
							</div>
							<p class="text-green-400 text-sm mt-2">+{stats.newUsersThisWeek} this week</p>
						</div>

						<div class="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
							<div class="flex items-center justify-between">
								<div>
									<p class="text-white/70 text-sm font-medium">Total Memorials</p>
									<p class="text-3xl font-bold text-white">{stats.totalMemorials}</p>
								</div>
								<div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
									<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
									</svg>
								</div>
							</div>
							<p class="text-green-400 text-sm mt-2">+{stats.newMemorialsThisWeek} this week</p>
						</div>

						<div class="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
							<div class="flex items-center justify-between">
								<div>
									<p class="text-white/70 text-sm font-medium">Pending Applications</p>
									<p class="text-3xl font-bold text-white">{stats.pendingApplications}</p>
								</div>
								<div class="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
									<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
									</svg>
								</div>
							</div>
							<p class="text-amber-400 text-sm mt-2">Requires attention</p>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Users Tab -->
			{#if activeTab === 'users'}
				<div class="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-xl overflow-hidden">
					<div class="p-6 border-b border-white/20">
						<h2 class="text-xl font-bold text-white">User Management</h2>
						<p class="text-white/70 mt-1">Manage user accounts and permissions</p>
					</div>
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead class="bg-white/5">
								<tr>
									<th class="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">User</th>
									<th class="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Role</th>
									<th class="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Status</th>
									<th class="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Memorials</th>
									<th class="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-white/10">
								{#each users as user}
									<tr class="hover:bg-white/5 transition-colors duration-200">
										<td class="px-6 py-4">
											<div>
												<div class="text-sm font-medium text-white">{user.displayName || user.email}</div>
												<div class="text-sm text-white/70">{user.email}</div>
											</div>
										</td>
										<td class="px-6 py-4">
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
												{user.role === 'admin' ? 'bg-red-100 text-red-800' : 
												 user.role === 'owner' ? 'bg-amber-100 text-amber-800' :
												 user.role === 'funeral_director' ? 'bg-purple-100 text-purple-800' :
												 user.role === 'family_member' ? 'bg-blue-100 text-blue-800' :
												 'bg-gray-100 text-gray-800'}">
												{user.role}
											</span>
										</td>
										<td class="px-6 py-4">
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
												{user.suspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
												{user.suspended ? 'Suspended' : 'Active'}
											</span>
										</td>
										<td class="px-6 py-4 text-sm text-white">{user.memorialCount || 0}</td>
										<td class="px-6 py-4">
											<div class="flex gap-2">
												{#if user.suspended}
													<button 
														class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors duration-200"
														on:click={() => activateUser(user.uid)}
													>
														Activate
													</button>
												{:else}
													<button 
														class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors duration-200"
														on:click={() => suspendUser(user.uid, 'Admin action')}
													>
														Suspend
													</button>
												{/if}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			<!-- Applications Tab -->
			{#if activeTab === 'applications'}
				<div class="space-y-6">
					{#each applications as application}
						<div class="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl">
							<div class="flex justify-between items-start mb-4">
								<div>
									<h3 class="text-lg font-semibold text-white">{application.businessName}</h3>
									<p class="text-white/70">{application.userEmail}</p>
									<p class="text-sm text-white/50 mt-1">Applied: {new Date(application.createdAt).toLocaleDateString()}</p>
								</div>
								<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
									Pending Review
								</span>
							</div>
							
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
								<div>
									<p class="text-sm text-white/70">License Number</p>
									<p class="text-white font-medium">{application.licenseNumber}</p>
								</div>
								<div>
									<p class="text-sm text-white/70">Phone</p>
									<p class="text-white font-medium">{application.phoneNumber}</p>
								</div>
								<div class="md:col-span-2">
									<p class="text-sm text-white/70">Address</p>
									<p class="text-white font-medium">{application.address}</p>
								</div>
							</div>

							<div class="flex gap-3">
								<button 
									class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
									on:click={() => approveApplication(application.id)}
								>
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
									</svg>
									Approve
								</button>
								<button 
									class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
									on:click={() => rejectApplication(application.id, 'Application rejected by admin')}
								>
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
									</svg>
									Reject
								</button>
							</div>
						</div>
					{/each}

					{#if applications.length === 0}
						<div class="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-12 text-center shadow-xl">
							<svg class="w-12 h-12 text-white/50 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
							</svg>
							<h3 class="text-lg font-medium text-white mb-2">No Pending Applications</h3>
							<p class="text-white/70">All funeral director applications have been processed.</p>
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</div>

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
