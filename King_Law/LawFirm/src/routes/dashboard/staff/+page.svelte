<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte.ts';
	import { casesStore } from '$lib/stores/cases.svelte.ts';
	import { onMount } from 'svelte';

	let loading = $state(true);

	onMount(async () => {
		await casesStore.fetchCases();
		loading = false;
	});

	const assignedCases = $derived(casesStore.cases || []);
	const activeCases = $derived(assignedCases.filter(c => c.status === 'active'));
</script>

<div>
	<div class="mb-8">
		<h1 class="text-3xl font-title">Welcome, {authStore.user?.firstName}!</h1>
		<p class="text-muted-foreground mt-1">Staff Dashboard - Read-only access to assigned cases</p>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
		<div class="bg-card border border-border rounded-lg p-6">
			<h3 class="text-sm font-medium text-muted-foreground">Assigned Cases</h3>
			<p class="text-3xl font-bold mt-2">{assignedCases.length}</p>
		</div>
		<div class="bg-card border border-border rounded-lg p-6">
			<h3 class="text-sm font-medium text-muted-foreground">Active Cases</h3>
			<p class="text-3xl font-bold mt-2">{activeCases.length}</p>
		</div>
		<div class="bg-card border border-border rounded-lg p-6">
			<h3 class="text-sm font-medium text-muted-foreground">Your Role</h3>
			<p class="text-3xl font-bold mt-2 capitalize">Staff</p>
		</div>
	</div>

	<!-- Info Banner -->
	<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
		<h3 class="font-medium text-blue-800 dark:text-blue-200">Read-Only Access</h3>
		<p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
			As a staff member, you can view case details, documents, and messages for cases assigned to you. 
			Contact an attorney if you need to make changes.
		</p>
	</div>

	<!-- Recent Cases -->
	<div class="bg-card border border-border rounded-lg">
		<div class="px-6 py-4 border-b border-border">
			<h2 class="text-lg font-semibold">Assigned Cases</h2>
		</div>
		
		{#if loading}
			<div class="p-6 text-center text-muted-foreground">Loading cases...</div>
		{:else if assignedCases.length === 0}
			<div class="p-6 text-center text-muted-foreground">
				No cases assigned to you yet.
			</div>
		{:else}
			<div class="divide-y divide-border">
				{#each assignedCases as caseItem}
					<a href="/dashboard/staff/cases/{caseItem.id}" class="block p-4 hover:bg-muted/50 transition-colors">
						<div class="flex justify-between items-start">
							<div>
								<h3 class="font-medium">{caseItem.title}</h3>
								<p class="text-sm text-muted-foreground mt-1">{caseItem.description || 'No description'}</p>
							</div>
							<span class="px-2 py-1 text-xs rounded capitalize {
								caseItem.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
								caseItem.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
								'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
							}">
								{caseItem.status}
							</span>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
