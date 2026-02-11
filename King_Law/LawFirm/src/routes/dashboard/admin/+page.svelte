<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte.ts';
	import { onMount } from 'svelte';
	import { Users, Scale, UserCog, UserCheck, KeyRound, Settings, ChevronRight } from 'lucide-svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';

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
	<div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
		<StatCard label="Total Users" value={loading ? '...' : stats.totalUsers} icon={Users} />
		<StatCard label="Lawyers" value={loading ? '...' : stats.lawyers} icon={Scale} iconClass="text-green-600" />
		<StatCard label="Staff" value={loading ? '...' : stats.staff} icon={UserCog} iconClass="text-purple-600" />
		<StatCard label="Clients" value={loading ? '...' : stats.clients} icon={UserCheck} iconClass="text-blue-600" />
		<StatCard label="Unused Codes" value={loading ? '...' : stats.unusedCodes} icon={KeyRound} iconClass="text-gold" />
	</div>

	<!-- Quick Actions -->
	<h2 class="font-title text-xl mb-4">Quick Actions</h2>
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<a href="/dashboard/admin/users" class="bg-background border border-border rounded-lg p-5 hover:border-gold hover:shadow-md transition-all group flex items-center gap-4">
			<Users class="w-8 h-8 text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
			<div class="flex-1 min-w-0">
				<h3 class="font-semibold">Manage Users</h3>
				<p class="text-xs text-muted-foreground mt-0.5">View and manage all user accounts</p>
			</div>
			<ChevronRight class="w-5 h-5 text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
		</a>
		<a href="/dashboard/admin/staff-codes" class="bg-background border border-border rounded-lg p-5 hover:border-gold hover:shadow-md transition-all group flex items-center gap-4">
			<KeyRound class="w-8 h-8 text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
			<div class="flex-1 min-w-0">
				<h3 class="font-semibold">Staff Codes</h3>
				<p class="text-xs text-muted-foreground mt-0.5">Create and manage registration codes</p>
			</div>
			<ChevronRight class="w-5 h-5 text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
		</a>
		<a href="/dashboard/admin/settings" class="bg-background border border-border rounded-lg p-5 hover:border-gold hover:shadow-md transition-all group flex items-center gap-4">
			<Settings class="w-8 h-8 text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
			<div class="flex-1 min-w-0">
				<h3 class="font-semibold">Settings</h3>
				<p class="text-xs text-muted-foreground mt-0.5">Staff password and system config</p>
			</div>
			<ChevronRight class="w-5 h-5 text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
		</a>
	</div>
</div>
