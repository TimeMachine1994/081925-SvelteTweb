<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { casesStore } from '$lib/stores/cases.svelte.ts';
	import { documentsStore } from '$lib/stores/documents.svelte.ts';
	import { messagesStore } from '$lib/stores/messages.svelte.ts';
	import { chatUIStore } from '$lib/stores/chatUI.svelte.ts';
	import CreateCaseModal from '$lib/components/CreateCaseModal.svelte';
	import { FolderOpen, CheckCircle, FileText, DollarSign, UserPlus, Paperclip, ClipboardList, MessageSquare, Search, Briefcase, Receipt, LayoutDashboard, X, Download } from 'lucide-svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';

	let { data }: { data: PageData } = $props();

	// Read tab/status from URL query params
	let activeTab = $state($page.url.searchParams.get('tab') || 'overview');
	let showCreateCaseModal = $state(false);
	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'active' | 'pending' | 'closed'>(($page.url.searchParams.get('status') as any) || 'all');

	function navigateToTab(tab: string, status?: string) {
		const params = new URLSearchParams();
		params.set('tab', tab);
		if (status) params.set('status', status);
		goto(`?${params.toString()}`, { replaceState: true, noScroll: true });
		activeTab = tab;
		if (status) statusFilter = status as any;
	}
	let selectedClientId = $state<string | null>(null);
	let selectedClientForMessages = $state<string | null>(null);
	let hiddenClientIds = $state<Set<string>>(new Set());
	let showAllClientsModal = $state(false);

	// Alerts count for overview badge
	let alertCount = $derived(
		(data.newClients?.filter((c: any) => !hiddenClientIds.has(c.id))?.length || 0) +
		(data.uncategorizedThreads?.length || 0)
	);

	const tabDefs = [
		{ id: 'overview', label: 'Overview', icon: LayoutDashboard },
		{ id: 'cases', label: 'Cases', icon: Briefcase },
		{ id: 'documents', label: 'Documents', icon: FileText },
		{ id: 'invoices', label: 'Invoices', icon: Receipt }
	];

	let tabs = $derived(tabDefs.map(t => {
		if (t.id === 'overview' && alertCount > 0) return { ...t, badge: alertCount };
		if (t.id === 'cases') return { ...t, badge: data.cases.length || undefined };
		return t;
	}));

	let filteredCases = $derived(
		data.cases.filter(({ case: c, client }) => {
			if (statusFilter !== 'all' && c.status !== statusFilter) return false;
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			return (
				c.title.toLowerCase().includes(q) ||
				(c.description?.toLowerCase().includes(q) ?? false) ||
				`${client.firstName} ${client.lastName}`.toLowerCase().includes(q) ||
				client.email.toLowerCase().includes(q)
			);
		})
	);

	// Filter out hidden clients
	let visibleNewClients = $derived(
		data.newClients?.filter((c: any) => !hiddenClientIds.has(c.id)) || []
	);

	function handleCaseCreated(event: CustomEvent) {
		showCreateCaseModal = false;
		selectedClientId = null;
		casesStore.fetchCases();
		// Refresh the page to update the new clients list
		window.location.reload();
	}

	function openCreateCaseForClient(clientId: string) {
		selectedClientId = clientId;
		showCreateCaseModal = true;
	}

	function openCreateCase() {
		selectedClientId = null;
		showCreateCaseModal = true;
	}

	function hideClient(clientId: string) {
		hiddenClientIds = new Set([...hiddenClientIds, clientId]);
	}

	function viewClientMessages(clientId: string, clientName: string) {
		// Open the chat slider and set it to show this client's messages
		chatUIStore.openForClient(clientId, clientName);
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	} 

	function formatCurrency(cents: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(cents / 100);
	}

	function formatDate(date: Date | number): string {
		// Handle Unix timestamps (seconds) by converting to milliseconds
		const timestamp = typeof date === 'number' ? date * 1000 : date;
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div>
	<div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 sm:mb-6">
		<h1 class="font-title text-2xl sm:text-4xl">Lawyer Dashboard</h1>
		<button 
			onclick={openCreateCase}
			class="bg-gold hover:bg-gold-dark text-black font-semibold px-4 py-2 rounded-md transition-colors text-sm w-full sm:w-auto"
		>
			+ New Case
		</button>
	</div>

	<!-- Stats Overview (always visible) -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
		<StatCard label="Total Cases" value={data.stats.totalCases} icon={FolderOpen} onclick={() => navigateToTab('cases')} />
		<StatCard label="Active Cases" value={data.stats.activeCases} icon={CheckCircle} iconClass="text-green-600" onclick={() => navigateToTab('cases', 'active')} />
		<StatCard label="Documents" value={data.stats.totalDocuments} icon={FileText} onclick={() => navigateToTab('documents')} />
		<StatCard label="Total Revenue" value={formatCurrency(data.stats.totalRevenue)} icon={DollarSign} iconClass="text-gold" onclick={() => navigateToTab('invoices')} />
	</div>

	<!-- Tabs -->
	<Tabs {tabs} bind:activeTab />

	<!-- TAB: Overview -->
	{#if activeTab === 'overview'}
		<!-- New Clients Alert -->
		{#if visibleNewClients.length > 0}
			<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-5 mb-6">
				<div class="flex items-start gap-3">
					<UserPlus class="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
					<div class="flex-1">
						<div class="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-0 mb-3">
							<h3 class="font-semibold text-sm sm:text-base">New Client Registrations ({visibleNewClients.length})</h3>
							<button 
								onclick={() => showAllClientsModal = true}
								class="text-xs text-blue-600 hover:underline self-start sm:self-auto"
							>
								See All Clients
							</button>
						</div>
						<div class="space-y-3">
							{#each visibleNewClients as client}
								<div class="bg-background border border-border rounded-lg p-3 sm:p-4">
									<div class="flex justify-between items-start gap-2 mb-2">
										<div class="min-w-0">
											<div class="font-semibold text-sm sm:text-base">{client.firstName} {client.lastName}</div>
											<div class="text-xs sm:text-sm text-muted-foreground truncate">
												{client.email}{#if client.phoneNumber}<span class="hidden sm:inline"> • {client.phoneNumber}</span>{/if}
											</div>
											{#if client.phoneNumber}
												<div class="text-xs text-muted-foreground sm:hidden">{client.phoneNumber}</div>
											{/if}
											<div class="text-xs text-muted-foreground mt-1">Registered: {formatDate(client.createdAt)}</div>
										</div>
										<button 
											onclick={() => hideClient(client.id)}
											class="text-gray-400 dark:text-muted-foreground hover:text-red-500 p-1 shrink-0"
											title="Hide"
										><X class="w-4 h-4" /></button>
									</div>
									<div class="flex gap-2 items-center">
										<button 
											onclick={() => viewClientMessages(client.id, `${client.firstName} ${client.lastName}`)}
											class="text-xs text-blue-600 hover:underline"
										>Messages</button>
										<button 
											onclick={() => openCreateCaseForClient(client.id)}
											class="bg-gold hover:bg-gold-dark text-black px-3 py-1.5 rounded text-xs font-semibold"
										>Create Case</button>
									</div>
									{#if client.files && client.files.length > 0}
										<div class="mt-2 pt-2 border-t border-border">
											<div class="text-xs font-medium mb-1 flex items-center gap-1"><Paperclip class="w-3 h-3" /> Files ({client.files.length})</div>
											<div class="space-y-1">
												{#each client.files as file}
													<div class="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1.5">
														<span class="truncate flex-1">{file.name}</span>
														<span class="text-muted-foreground ml-2">{formatFileSize(file.size)}</span>
														<a href="/api/files/download?key={encodeURIComponent(file.key)}" class="text-gold hover:underline ml-2 inline-flex items-center gap-1"><Download class="w-3 h-3" /></a>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Uncategorized Messages Alert -->
		{#if data.uncategorizedThreads && data.uncategorizedThreads.length > 0}
			<div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 sm:p-5 mb-4 sm:mb-6">
				<div class="flex items-start gap-2 sm:gap-3">
					<MessageSquare class="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 shrink-0 mt-0.5" />
					<div class="flex-1 min-w-0">
						<h3 class="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Uncategorized Messages</h3>
						<div class="space-y-2">
							{#each data.uncategorizedThreads as thread}
								<div class="bg-background border border-border rounded-lg p-2.5 sm:p-3">
									<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-0 mb-1">
										<div class="min-w-0">
											<span class="font-medium text-sm">{thread.client.firstName} {thread.client.lastName}</span>
											<span class="text-xs text-muted-foreground ml-2">{thread.messages.length} msg{thread.messages.length !== 1 ? 's' : ''}</span>
										</div>
										<div class="flex gap-2">
											<button 
												onclick={() => viewClientMessages(thread.client.id, `${thread.client.firstName} ${thread.client.lastName}`)}
												class="text-xs text-blue-600 hover:underline"
											>View</button>
											<button 
												onclick={() => openCreateCaseForClient(thread.client.id)}
												class="text-xs bg-gold hover:bg-gold-dark text-black px-2 py-1 rounded font-semibold"
											>Create Case</button>
										</div>
									</div>
									<p class="text-xs text-muted-foreground italic bg-muted/50 rounded p-2 mt-1 line-clamp-2">
										"{thread.messages[thread.messages.length - 1]?.content?.slice(0, 120)}{(thread.messages[thread.messages.length - 1]?.content?.length || 0) > 120 ? '...' : ''}"
									</p>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Quick summary if no alerts -->
		{#if visibleNewClients.length === 0 && (!data.uncategorizedThreads || data.uncategorizedThreads.length === 0)}
			<div class="bg-background border border-border rounded-lg p-6 sm:p-8 text-center">
				<CheckCircle class="w-8 h-8 sm:w-10 sm:h-10 text-green-500 mx-auto mb-2 sm:mb-3" />
				<h3 class="font-semibold text-base sm:text-lg mb-1">All caught up!</h3>
				<p class="text-xs sm:text-sm text-muted-foreground">No pending client registrations or uncategorized messages.</p>
			</div>
		{/if}

	<!-- TAB: Cases -->
	{:else if activeTab === 'cases'}
		{#if data.cases.length > 0}
			<div class="flex flex-col sm:flex-row gap-3 mb-4">
				<div class="flex-1 relative">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search cases..."
						class="w-full px-4 py-2 pl-10 border border-input rounded-md bg-background text-sm"
					/>
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
				</div>
				<select
					bind:value={statusFilter}
					class="px-3 py-2 border border-input rounded-md bg-background text-sm"
				>
					<option value="all">All Statuses</option>
					<option value="active">Active</option>
					<option value="pending">Pending</option>
					<option value="closed">Closed</option>
				</select>
			</div>

			{#if filteredCases.length > 0}
				<p class="text-xs text-muted-foreground mb-3">
					Showing {filteredCases.length} of {data.cases.length} case{data.cases.length !== 1 ? 's' : ''}
				</p>
				<div class="grid md:grid-cols-2 gap-4">
					{#each filteredCases as { case: caseItem, client }}
						<a
							href="/dashboard/lawyer/case/{caseItem.id}"
							class="bg-background border border-border rounded-lg p-5 hover:border-gold transition-all hover:shadow-lg group"
						>
							<div class="flex justify-between items-start mb-2">
								<h3 class="font-semibold group-hover:text-gold transition-colors">
									{caseItem.title}
								</h3>
								<Badge variant={caseItem.status} />
							</div>
							<div class="text-sm text-muted-foreground mb-2">
								{client.firstName} {client.lastName}
							</div>
							{#if caseItem.description}
								<p class="text-xs text-muted-foreground mb-3 line-clamp-2">{caseItem.description}</p>
							{/if}
							<div class="text-xs text-muted-foreground">Updated: {formatDate(caseItem.updatedAt)}</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="bg-background border border-border rounded-lg p-8 text-center">
					<p class="text-muted-foreground">No cases match your search.</p>
					<button
						onclick={() => { searchQuery = ''; statusFilter = 'all'; }}
						class="text-gold hover:underline text-sm mt-2"
					>Clear filters</button>
				</div>
			{/if}
		{:else}
			<EmptyState
				icon={ClipboardList}
				title="No Cases Yet"
				description="Create your first case to get started."
			/>
		{/if}

	<!-- TAB: Documents -->
	{:else if activeTab === 'documents'}
		{#if data.documents.length > 0}
			<!-- Mobile: Card layout -->
			<div class="space-y-3 sm:hidden">
				{#each data.documents as doc}
					<div class="bg-background border border-border rounded-lg p-3">
						<div class="flex justify-between items-start gap-2 mb-1.5">
							<div class="font-medium text-sm truncate flex-1">{doc.fileName}</div>
							<a href="/api/documents/{doc.id}" class="text-gold hover:underline text-xs inline-flex items-center gap-1 shrink-0"><Download class="w-3.5 h-3.5" /></a>
						</div>
						<div class="text-xs text-muted-foreground space-y-0.5">
							<div>{doc.uploaderFirstName || ''} {doc.uploaderLastName || ''}</div>
							<div class="flex gap-3">
								<span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
								<span>{formatDate(doc.uploadedAt)}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
			<!-- Desktop: Table layout -->
			<div class="bg-background border border-border rounded-lg overflow-hidden hidden sm:block">
				<table class="w-full">
					<thead class="bg-muted">
						<tr>
							<th class="text-left px-4 py-3 text-sm font-semibold">File</th>
							<th class="text-left px-4 py-3 text-sm font-semibold hidden md:table-cell">Client</th>
							<th class="text-left px-4 py-3 text-sm font-semibold hidden lg:table-cell">Case</th>
							<th class="text-left px-4 py-3 text-sm font-semibold">Size</th>
							<th class="text-left px-4 py-3 text-sm font-semibold">Uploaded</th>
							<th class="text-right px-4 py-3 text-sm font-semibold">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.documents as doc}
							<tr class="border-t border-border hover:bg-muted/50 transition-colors">
								<td class="px-4 py-3 font-medium text-sm">{doc.fileName}</td>
								<td class="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
									{doc.uploaderFirstName || ''} {doc.uploaderLastName || ''}
								</td>
								<td class="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{doc.caseTitle || 'N/A'}</td>
								<td class="px-4 py-3 text-sm text-muted-foreground">{(doc.fileSize / 1024).toFixed(1)} KB</td>
								<td class="px-4 py-3 text-sm text-muted-foreground">{formatDate(doc.uploadedAt)}</td>
								<td class="px-4 py-3 text-right">
									<a href="/api/documents/{doc.id}" class="text-gold hover:underline text-sm inline-flex items-center gap-1"><Download class="w-3.5 h-3.5" /> Download</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="mt-3 text-right">
				<a href="/dashboard/lawyer/documents" class="text-sm text-gold hover:underline">View all documents →</a>
			</div>
		{:else}
			<EmptyState icon={FileText} title="No Documents Yet" description="Documents uploaded to cases will appear here." />
		{/if}

	<!-- TAB: Invoices -->
	{:else if activeTab === 'invoices'}
		{#if data.invoices.length > 0}
			<!-- Mobile: Card layout -->
			<div class="space-y-3 sm:hidden">
				{#each data.invoices as invoice}
					<div class="bg-background border border-border rounded-lg p-3">
						<div class="flex justify-between items-start gap-2 mb-1">
							<div class="font-medium text-sm flex-1 min-w-0 truncate">{invoice.description}</div>
							<Badge variant={invoice.status === 'paid' ? 'paid' : invoice.status === 'partial' ? 'partial' : 'unpaid'} />
						</div>
						<div class="text-lg font-bold">{formatCurrency(invoice.amount)}</div>
						<div class="text-xs text-muted-foreground">Due: {formatDate(invoice.dueDate)}</div>
					</div>
				{/each}
			</div>
			<!-- Desktop: Table layout -->
			<div class="bg-background border border-border rounded-lg overflow-hidden hidden sm:block">
				<table class="w-full">
					<thead class="bg-muted">
						<tr>
							<th class="text-left px-4 sm:px-6 py-3 text-sm font-semibold">Description</th>
							<th class="text-left px-4 sm:px-6 py-3 text-sm font-semibold">Amount</th>
							<th class="text-left px-4 sm:px-6 py-3 text-sm font-semibold hidden md:table-cell">Due Date</th>
							<th class="text-left px-4 sm:px-6 py-3 text-sm font-semibold">Status</th>
						</tr>
					</thead>
					<tbody>
						{#each data.invoices as invoice}
							<tr class="border-t border-border hover:bg-muted/50 transition-colors">
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-sm">{invoice.description}</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-sm">{formatCurrency(invoice.amount)}</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-sm text-muted-foreground hidden md:table-cell">{formatDate(invoice.dueDate)}</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4">
									<Badge variant={invoice.status === 'paid' ? 'paid' : invoice.status === 'partial' ? 'partial' : 'unpaid'} />
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<EmptyState icon={Receipt} title="No Invoices Yet" description="Invoices created for cases will appear here." />
		{/if}
	{/if}
</div>

<!-- Create Case Modal -->
<CreateCaseModal 
	bind:open={showCreateCaseModal} 
	initialClientId={selectedClientId}
	on:close={() => { showCreateCaseModal = false; selectedClientId = null; }}
	on:created={handleCaseCreated}
/>

<!-- All Clients Modal -->
{#if showAllClientsModal}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		onclick={() => showAllClientsModal = false}
		role="button"
		tabindex="-1"
	>
		<div
			class="bg-background border border-border rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
		>
			<div class="flex items-center justify-between p-4 sm:p-6 border-b border-border">
				<h2 class="font-title text-xl sm:text-2xl">All Clients ({data.allClients?.length || 0})</h2>
				<button
					onclick={() => showAllClientsModal = false}
					class="p-2 hover:bg-muted rounded-md transition-colors"
					aria-label="Close modal"
				>
					<X class="w-5 h-5" />
				</button>
			</div>
			<div class="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
				{#if data.allClients && data.allClients.length > 0}
					<div class="space-y-3">
						{#each data.allClients as client}
							<div class="bg-muted/30 border border-border rounded-lg p-3 sm:p-4">
								<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
									<div class="min-w-0">
										<div class="font-semibold text-sm sm:text-base">{client.firstName} {client.lastName}</div>
										<div class="text-xs sm:text-sm text-muted-foreground truncate">{client.email}</div>
										<div class="text-xs text-muted-foreground">Registered: {formatDate(client.createdAt)}</div>
									</div>
									<div class="flex gap-2 shrink-0">
										<button 
											onclick={() => { viewClientMessages(client.id, `${client.firstName} ${client.lastName}`); showAllClientsModal = false; }}
											class="text-xs sm:text-sm text-blue-600 hover:underline"
										>
											Messages
										</button>
										<button 
											onclick={() => { openCreateCaseForClient(client.id); showAllClientsModal = false; }}
											class="text-xs sm:text-sm bg-gold hover:bg-gold-dark text-black px-3 py-1 rounded"
										>
											Create Case
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-muted-foreground text-center">No clients registered yet</p>
				{/if}
			</div>
		</div>
	</div>
{/if}
