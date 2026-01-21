<script lang="ts">
	import { onMount } from 'svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';

	type ClientWithStats = {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		phoneNumber: string | null;
		createdAt: string;
		caseCount: number;
		activeCaseCount: number;
	};

	let loading = $state(true);
	let clients = $state<ClientWithStats[]>([]);
	let searchQuery = $state('');
	let error = $state<string | null>(null);

	let filteredClients = $derived(() => {
		if (!searchQuery.trim()) return clients;
		const query = searchQuery.toLowerCase();
		return clients.filter(c =>
			`${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(query)
		);
	});

	onMount(async () => {
		await loadClients();
	});

	async function loadClients() {
		loading = true;
		error = null;
		try {
			const response = await fetch('/api/clients');
			if (!response.ok) throw new Error('Failed to load clients');
			const data = await response.json();
			clients = data.clients || [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load clients';
			toastStore.error(error);
		} finally {
			loading = false;
		}
	}

	function formatDate(date: string): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<Toast />

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<h1 class="font-title text-4xl">Clients</h1>
		
		<!-- Search -->
		<div class="relative w-full sm:w-64">
			<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search clients..."
				class="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background"
			/>
		</div>
	</div>

	{#if loading}
		<!-- Loading Skeleton -->
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="bg-background border border-border rounded-lg p-4 shadow-sm">
					<div class="flex items-center gap-3 mb-3">
						<Skeleton class="w-12 h-12 rounded-full" />
						<div class="space-y-2 flex-1">
							<Skeleton class="h-5 w-32" />
							<Skeleton class="h-4 w-48" />
						</div>
					</div>
					<Skeleton class="h-4 w-24" />
				</div>
			{/each}
		</div>
	{:else if error}
		<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
			<p class="text-red-600 dark:text-red-400">{error}</p>
			<button onclick={loadClients} class="mt-4 text-gold hover:underline">Try Again</button>
		</div>
	{:else if filteredClients().length > 0}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each filteredClients() as client}
				<a
					href="/dashboard/lawyer/client/{client.id}"
					class="bg-background border border-border rounded-lg p-4 shadow-sm hover:shadow-md hover:border-gold/50 transition-all block"
				>
					<div class="flex items-center gap-3 mb-3">
						<div class="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center text-lg font-bold text-gold shrink-0">
							{client.firstName?.[0]}{client.lastName?.[0]}
						</div>
						<div class="min-w-0 flex-1">
							<h3 class="font-semibold truncate">{client.firstName} {client.lastName}</h3>
							<p class="text-sm text-muted-foreground truncate">{client.email}</p>
						</div>
					</div>
					
					<div class="flex justify-between items-center text-sm">
						<div class="flex gap-4">
							<span class="text-muted-foreground">
								<span class="font-medium text-foreground">{client.caseCount}</span> cases
							</span>
							{#if client.activeCaseCount > 0}
								<span class="text-green-600 dark:text-green-400">
									{client.activeCaseCount} active
								</span>
							{/if}
						</div>
					</div>
					
					<p class="text-xs text-muted-foreground mt-2">
						Client since {formatDate(client.createdAt)}
					</p>
				</a>
			{/each}
		</div>
	{:else if searchQuery}
		<div class="bg-background border border-border rounded-lg p-12 text-center">
			<p class="text-muted-foreground mb-4">No clients match your search</p>
			<button onclick={() => searchQuery = ''} class="text-gold hover:underline">
				Clear search
			</button>
		</div>
	{:else}
		<div class="bg-background border border-border rounded-lg p-12 text-center">
			<p class="text-muted-foreground">No clients yet</p>
		</div>
	{/if}
</div>
