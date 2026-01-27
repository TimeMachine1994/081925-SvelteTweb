<script lang="ts">
	import { onMount } from 'svelte';
	import { casesStore } from '$lib/stores/cases.svelte';
	import { documentsStore } from '$lib/stores/documents.svelte';
	import { invoicesStore } from '$lib/stores/invoices.svelte';
	import { messagesStore } from '$lib/stores/messages.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import CreateCaseModal from '$lib/components/CreateCaseModal.svelte';
	import AssignToCaseModal from '$lib/components/AssignToCaseModal.svelte';
	import InboxMessage from '$lib/components/InboxMessage.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import DashboardSkeleton from '$lib/components/ui/DashboardSkeleton.svelte';
	
	let { data } = $props();

	let showCreateCaseModal = $state(false);
	let showAssignModal = $state(false);
	let selectedMessage = $state<any>(null);
	let uncategorizedMessages = $derived(data.uncategorizedMessages || []);
	let loading = $state(true);
	let searchQuery = $state('');
	let statusFilter = $state('all');

	// Dashboard stats
	let stats = $state({
		totalCases: 0,
		activeCases: 0,
		totalDocuments: 0,
		totalRevenue: 0,
		unreadMessages: 0
	});

	// Filtered cases based on search and status
	let filteredCases = $derived(() => {
		let cases = casesStore.cases;
		
		// Filter by status
		if (statusFilter !== 'all') {
			cases = cases.filter(c => c.case.status === statusFilter);
		}
		
		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			cases = cases.filter(c => 
				c.case.title.toLowerCase().includes(query) ||
				c.client?.firstName?.toLowerCase().includes(query) ||
				c.client?.lastName?.toLowerCase().includes(query) ||
				c.client?.email?.toLowerCase().includes(query)
			);
		}
		
		return cases;
	});

	onMount(async () => {
		loading = true;
		try {
			// Fetch dashboard data
			await Promise.all([
				casesStore.fetchCases(),
				fetchDashboardStats()
			]);
		} catch (error) {
			console.error('Error loading dashboard:', error);
			toastStore.error('Failed to load dashboard data');
		} finally {
			loading = false;
		}
	});

	async function fetchDashboardStats() {
		try {
			const response = await fetch('/api/dashboard/stats');
			if (response.ok) {
				const data = await response.json();
				stats = data;
			}
		} catch (error) {
			console.error('Failed to fetch stats:', error);
		}
	}

	function handleCaseCreated() {
		showCreateCaseModal = false;
		toastStore.success('Case created successfully');
		casesStore.fetchCases();
		fetchDashboardStats();
	}

	function formatCurrency(cents: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(cents / 100);
	}

	function clearSearch() {
		searchQuery = '';
	}

	function handleAssignMessage(e: CustomEvent<any>) {
		selectedMessage = e.detail;
		showAssignModal = true;
	}

	async function handleAssignmentComplete() {
		showAssignModal = false;
		selectedMessage = null;
		toastStore.success('Message assigned to case successfully');
		// Refresh uncategorized messages
		try {
			const response = await fetch('/dashboard/lawyer');
			const html = await response.text();
			// Reload the page data by invalidating
			window.location.reload();
		} catch (error) {
			console.error('Failed to refresh:', error);
		}
	}
</script>

<Toast />

{#if loading}
	<DashboardSkeleton />
{:else}
<div class="space-y-8">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<h1 class="font-title text-4xl">Lawyer Dashboard</h1>
		<button
			onclick={() => (showCreateCaseModal = true)}
			class="bg-gold hover:bg-gold-dark text-black font-semibold px-6 py-3 rounded-md transition-colors shadow-md"
		>
			+ New Case
		</button>
	</div>

	<!-- New Client Inquiries Section -->
	{#if uncategorizedMessages.length > 0}
		<div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="font-title text-xl flex items-center gap-2">
					<span class="text-2xl">📬</span>
					New Client Inquiries
					<span class="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
						{uncategorizedMessages.length}
					</span>
				</h2>
			</div>
			<p class="text-sm text-muted-foreground mb-4">
				These messages are from clients without an assigned case. Assign them to create or link to a case.
			</p>
			<div class="space-y-3">
				{#each uncategorizedMessages as msg}
					<InboxMessage message={msg} on:assign={handleAssignMessage} />
				{/each}
			</div>
		</div>
	{/if}

	<!-- Stats Cards -->
	<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
		<div class="bg-background border border-border rounded-lg p-4 shadow-sm">
			<div class="text-2xl font-bold">{stats.totalCases}</div>
			<div class="text-sm text-muted-foreground">Total Cases</div>
		</div>
		<div class="bg-background border border-border rounded-lg p-4 shadow-sm">
			<div class="text-2xl font-bold text-green-600">{stats.activeCases}</div>
			<div class="text-sm text-muted-foreground">Active Cases</div>
		</div>
		<a
			href="/dashboard/lawyer/documents"
			class="bg-background border border-border rounded-lg p-4 shadow-sm hover:border-gold hover:shadow-md transition-all block"
		>
			<div class="text-2xl font-bold">{stats.totalDocuments}</div>
			<div class="text-sm text-muted-foreground">Documents</div>
		</a>
		<div class="bg-background border border-border rounded-lg p-4 shadow-sm">
			<div class="text-2xl font-bold text-gold">{formatCurrency(stats.totalRevenue)}</div>
			<div class="text-sm text-muted-foreground">Revenue</div>
		</div>
		<div class="bg-background border border-border rounded-lg p-4 shadow-sm">
			<div class="text-2xl font-bold {stats.unreadMessages > 0 ? 'text-red-500' : ''}">{stats.unreadMessages}</div>
			<div class="text-sm text-muted-foreground">Unread Messages</div>
		</div>
	</div>

	<!-- Cases Section -->
	<div>
		<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
			<h2 class="font-title text-2xl">Cases</h2>
			
			<!-- Search and Filter -->
			<div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
				<!-- Search Input -->
				<div class="relative flex-1 sm:w-64">
					<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search cases or clients..."
						class="w-full pl-10 pr-8 py-2 border border-input rounded-md bg-background"
					/>
					{#if searchQuery}
						<button
							onclick={clearSearch}
							aria-label="Clear search"
							class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					{/if}
				</div>
				
				<!-- Status Filter -->
				<select
					bind:value={statusFilter}
					class="px-3 py-2 border border-input rounded-md bg-background"
				>
					<option value="all">All Status</option>
					<option value="open">Open</option>
					<option value="closed">Closed</option>
					<option value="archived">Archived</option>
				</select>
			</div>
		</div>

		{#if filteredCases().length > 0}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each filteredCases() as caseItem}
					<a
						href="/dashboard/lawyer/case/{caseItem.case.id}"
						class="bg-background border border-border rounded-lg p-4 shadow-sm hover:shadow-md hover:border-gold/50 transition-all block"
					>
						<div class="flex justify-between items-start mb-2">
							<h3 class="font-semibold truncate flex-1 mr-2">{caseItem.case.title}</h3>
							<span
								class="text-xs px-2 py-1 rounded-full border shrink-0 {caseItem.case.status === 'open'
									? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
									: caseItem.case.status === 'archived'
										? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
										: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'}"
							>
								{caseItem.case.status}
							</span>
						</div>
						{#if caseItem.client}
							<button 
								type="button"
								onclick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/dashboard/lawyer/client/${caseItem.client.id}`; }}
								class="text-sm text-muted-foreground hover:text-gold transition-colors text-left"
							>
								{caseItem.client.firstName} {caseItem.client.lastName}
							</button>
							<p class="text-xs text-muted-foreground">{caseItem.client.email}</p>
						{/if}
						<p class="text-xs text-muted-foreground mt-2">
							Updated: {new Date(caseItem.case.updatedAt).toLocaleDateString()}
						</p>
					</a>
				{/each}
			</div>
		{:else if searchQuery || statusFilter !== 'all'}
			<div class="bg-background border border-border rounded-lg p-12 text-center">
				<p class="text-muted-foreground mb-4">No cases match your search</p>
				<button
					onclick={() => { searchQuery = ''; statusFilter = 'all'; }}
					class="text-gold hover:underline"
				>
					Clear filters
				</button>
			</div>
		{:else}
			<div class="bg-background border border-border rounded-lg p-12 text-center">
				<p class="text-muted-foreground mb-4">No cases yet</p>
				<button
					onclick={() => (showCreateCaseModal = true)}
					class="text-gold hover:underline"
				>
					Create your first case
				</button>
			</div>
		{/if}
	</div>
</div>
{/if}

<!-- Modals -->
<CreateCaseModal 
	open={showCreateCaseModal} 
	onclose={() => showCreateCaseModal = false}
	oncreated={handleCaseCreated}
/>

<AssignToCaseModal
	open={showAssignModal}
	message={selectedMessage}
	onclose={() => { showAssignModal = false; selectedMessage = null; }}
	onassigned={handleAssignmentComplete}
/>

