<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte.ts';
	import { onMount } from 'svelte';
	import { Briefcase, CheckCircle, ShieldCheck, Info, ClipboardList } from 'lucide-svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	let loading = $state(true);
	let assignedCases = $state<any[]>([]);
	let error = $state('');

	onMount(async () => {
		try {
			const response = await fetch('/api/staff/cases');
			if (response.ok) {
				const data = await response.json();
				assignedCases = data.cases || [];
			} else {
				error = 'Failed to load assigned cases';
			}
		} catch (e) {
			error = 'Failed to load assigned cases';
		}
		loading = false;
	});

	const activeCases = $derived(assignedCases.filter(c => c.status === 'active'));
</script>

<div>
	<div class="mb-8">
		<h1 class="text-3xl font-title">Welcome, {authStore.user?.firstName}!</h1>
		<p class="text-muted-foreground mt-1">Staff Dashboard</p>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
		<StatCard label="Assigned Cases" value={assignedCases.length} icon={Briefcase} />
		<StatCard label="Active Cases" value={activeCases.length} icon={CheckCircle} iconClass="text-green-600" />
		<StatCard label="Your Role" value="Staff" icon={ShieldCheck} iconClass="text-purple-600" />
	</div>

	<!-- Info Banner -->
	<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8 flex items-start gap-3">
		<Info class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
		<div>
			<h3 class="font-medium text-blue-800 dark:text-blue-200 text-sm">Read-Only Access</h3>
			<p class="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
				You can view case details, documents, and messages for assigned cases. Contact an attorney to make changes.
			</p>
		</div>
	</div>

	<!-- Assigned Cases -->
	<h2 class="font-title text-xl mb-4">Assigned Cases</h2>

	{#if loading}
		<div class="bg-background border border-border rounded-lg p-8 text-center text-muted-foreground">
			<div class="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
			Loading cases...
		</div>
	{:else if error}
		<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
			<p class="text-red-800 dark:text-red-200 font-medium">{error}</p>
			<button onclick={() => window.location.reload()} class="mt-2 text-sm text-gold hover:underline">Try again</button>
		</div>
	{:else if assignedCases.length === 0}
		<EmptyState icon={ClipboardList} title="No Cases Assigned" description="No cases have been assigned to you yet." />
	{:else}
		<div class="bg-background border border-border rounded-lg divide-y divide-border overflow-hidden">
			{#each assignedCases as caseItem}
				<a href="/dashboard/staff/cases/{caseItem.id}" class="flex justify-between items-start p-4 hover:bg-muted/50 transition-colors">
					<div class="min-w-0 flex-1">
						<h3 class="font-medium">{caseItem.title}</h3>
						<p class="text-sm text-muted-foreground mt-0.5 line-clamp-1">{caseItem.description || 'No description'}</p>
					</div>
					<Badge variant={caseItem.status} class="ml-3 shrink-0" />
				</a>
			{/each}
		</div>
	{/if}
</div>
