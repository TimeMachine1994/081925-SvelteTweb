<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte.ts';
	import { onMount } from 'svelte';

	let stats = $state({
		totalUsers: 0,
		lawyers: 0,
		staff: 0,
		clients: 0,
		unusedCodes: 0
	});
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			const response = await fetch('/api/admin/stats');
			if (response.ok) {
				stats = await response.json();
			} else {
				error = 'Failed to load dashboard stats';
			}
		} catch (err) {
			error = 'Failed to connect to the server';
			console.error('Failed to load stats:', err);
		} finally {
			loading = false;
		}
	});
</script>

<div>
	<div class="mb-8">
		<h1 class="text-3xl font-title">Admin Dashboard</h1>
		<p class="text-muted-foreground mt-1">System overview and management</p>
	</div>

	{#if error}
		<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 text-center">
			<p class="text-red-800 dark:text-red-200 font-medium">{error}</p>
			<button onclick={() => window.location.reload()} class="mt-2 text-sm text-gold hover:underline">
				Try again
			</button>
		</div>
	{/if}

	<!-- Stats -->
	<div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
		<div class="bg-card border border-border rounded-lg p-6">
			<h3 class="text-sm font-medium text-muted-foreground">Total Users</h3>
			<p class="text-3xl font-bold mt-2">{loading ? '...' : stats.totalUsers}</p>
		</div>
		<div class="bg-card border border-border rounded-lg p-6">
			<h3 class="text-sm font-medium text-muted-foreground">Lawyers</h3>
			<p class="text-3xl font-bold mt-2">{loading ? '...' : stats.lawyers}</p>
		</div>
		<div class="bg-card border border-border rounded-lg p-6">
			<h3 class="text-sm font-medium text-muted-foreground">Staff</h3>
			<p class="text-3xl font-bold mt-2">{loading ? '...' : stats.staff}</p>
		</div>
		<div class="bg-card border border-border rounded-lg p-6">
			<h3 class="text-sm font-medium text-muted-foreground">Clients</h3>
			<p class="text-3xl font-bold mt-2">{loading ? '...' : stats.clients}</p>
		</div>
		<div class="bg-card border border-border rounded-lg p-6">
			<h3 class="text-sm font-medium text-muted-foreground">Unused Codes</h3>
			<p class="text-3xl font-bold mt-2">{loading ? '...' : stats.unusedCodes}</p>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<a href="/dashboard/admin/users" class="bg-card border border-border rounded-lg p-6 hover:border-gold transition-colors">
			<h3 class="font-semibold text-lg">Manage Users</h3>
			<p class="text-sm text-muted-foreground mt-1">View and manage all user accounts</p>
		</a>
		<a href="/dashboard/admin/staff-codes" class="bg-card border border-border rounded-lg p-6 hover:border-gold transition-colors">
			<h3 class="font-semibold text-lg">Staff Codes</h3>
			<p class="text-sm text-muted-foreground mt-1">Create and manage employee registration codes</p>
		</a>
		<a href="/dashboard/admin/settings" class="bg-card border border-border rounded-lg p-6 hover:border-gold transition-colors">
			<h3 class="font-semibold text-lg">Settings</h3>
			<p class="text-sm text-muted-foreground mt-1">Configure staff sign-up password and system settings</p>
		</a>
	</div>
</div>
