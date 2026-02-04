<script lang="ts">
	import type { PageData } from './$types';
	import { casesStore } from '$lib/stores/cases.svelte.ts';
	import { documentsStore } from '$lib/stores/documents.svelte.ts';
	import { messagesStore } from '$lib/stores/messages.svelte.ts';
	import CreateCaseModal from '$lib/components/CreateCaseModal.svelte';

	let { data }: { data: PageData } = $props();

	let showCreateCaseModal = $state(false);
	let selectedClientId = $state<string | null>(null);
	let selectedClientForMessages = $state<string | null>(null);

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
	<h1 class="font-title text-4xl mb-8">Lawyer Dashboard</h1>

	<!-- Stats Overview -->
	<div class="grid md:grid-cols-4 gap-6 mb-8">
		<div class="bg-background border border-border rounded-lg p-6">
			<div class="text-3xl mb-2">📁</div>
			<div class="text-2xl font-bold">{data.stats.totalCases}</div>
			<div class="text-sm text-muted-foreground">Total Cases</div>
		</div>

		<div class="bg-background border border-border rounded-lg p-6">
			<div class="text-3xl mb-2">✅</div>
			<div class="text-2xl font-bold">{data.stats.activeCases}</div>
			<div class="text-sm text-muted-foreground">Active Cases</div>
		</div>

		<div class="bg-background border border-border rounded-lg p-6">
			<div class="text-3xl mb-2">📄</div>
			<div class="text-2xl font-bold">{data.stats.totalDocuments}</div>
			<div class="text-sm text-muted-foreground">Documents</div>
		</div>

		<div class="bg-background border border-border rounded-lg p-6">
			<div class="text-3xl mb-2">💰</div>
			<div class="text-2xl font-bold">{formatCurrency(data.stats.totalRevenue)}</div>
			<div class="text-sm text-muted-foreground">Total Revenue</div>
		</div>
	</div>

	<!-- New Clients Alert (clients without cases) -->
	{#if data.newClients && data.newClients.length > 0}
		<div class="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-6 mb-8">
			<div class="flex items-start">
				<div class="text-3xl mr-4">👤</div>
				<div class="flex-1">
					<h3 class="font-semibold text-lg mb-2">New Client Registrations</h3>
					<p class="text-sm text-muted-foreground mb-4">
						These clients have registered but don't have a case yet. Review their information and create cases as needed.
					</p>
					<div class="space-y-4">
						{#each data.newClients as client}
							<div class="bg-background border border-border rounded-lg p-4">
								<div class="flex justify-between items-start mb-3">
									<div>
										<div class="font-semibold text-lg">
											{client.firstName} {client.lastName}
										</div>
										<div class="text-sm text-muted-foreground">
											{client.email}
											{#if client.phoneNumber}
												• {client.phoneNumber}
											{/if}
										</div>
										<div class="text-xs text-muted-foreground mt-1">
											Registered: {formatDate(client.createdAt)}
										</div>
									</div>
									<button 
										onclick={() => openCreateCaseForClient(client.id)}
										class="bg-gold hover:bg-gold-dark text-black px-4 py-2 rounded font-semibold text-sm"
									>
										Create Case
									</button>
								</div>
								
								{#if client.files && client.files.length > 0}
									<div class="mt-3 pt-3 border-t border-border">
										<div class="text-sm font-medium mb-2">📎 Uploaded Files ({client.files.length})</div>
										<div class="space-y-1">
											{#each client.files as file}
												<div class="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-2">
													<span class="truncate flex-1">{file.name}</span>
													<span class="text-muted-foreground ml-2">{formatFileSize(file.size)}</span>
													<a 
														href="/api/files/download?key={encodeURIComponent(file.key)}"
														class="text-gold hover:underline ml-3"
													>
														Download
													</a>
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
		<div class="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-6 mb-8">
			<div class="flex items-start">
				<div class="text-3xl mr-4">💬</div>
				<div class="flex-1">
					<h3 class="font-semibold text-lg mb-2">Uncategorized Messages</h3>
					<p class="text-sm text-muted-foreground mb-4">
						You have messages from clients without assigned cases. Review and create cases as needed.
					</p>
					<div class="space-y-2">
						{#each data.uncategorizedThreads as thread}
							<div class="bg-background border border-border rounded p-3">
								<div class="flex justify-between items-center mb-2">
									<div>
										<div class="font-semibold">
											{thread.client.firstName} {thread.client.lastName}
										</div>
										<div class="text-sm text-muted-foreground">
											{thread.messages.length} message{thread.messages.length !== 1 ? 's' : ''}
										</div>
									</div>
									<button 
										onclick={() => openCreateCaseForClient(thread.client.id)}
										class="text-sm bg-gold hover:bg-gold-dark text-black px-3 py-1 rounded"
									>
										Create Case
									</button>
								</div>
								<!-- Show latest message preview -->
								<div class="text-sm text-muted-foreground bg-muted/50 rounded p-2 mt-2">
									<span class="italic">"{thread.messages[thread.messages.length - 1]?.content?.slice(0, 100)}{thread.messages[thread.messages.length - 1]?.content?.length > 100 ? '...' : ''}"</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Cases Section -->
	<div class="mb-8">
		<div class="flex justify-between items-center mb-4">
			<h2 class="font-title text-2xl">Cases</h2>
			<button 
				onclick={openCreateCase}
				class="bg-gold hover:bg-gold-dark text-black font-semibold px-4 py-2 rounded-md transition-colors"
			>
				New Case
			</button>
		</div>

		{#if data.cases.length > 0}
			<div class="grid md:grid-cols-2 gap-4">
				{#each data.cases as { case: caseItem, client }}
					<a
						href="/dashboard/lawyer/case/{caseItem.id}"
						class="bg-background border border-border rounded-lg p-6 hover:border-gold transition-all hover:shadow-lg group"
					>
						<div class="flex justify-between items-start mb-2">
							<h3 class="font-semibold text-lg group-hover:text-gold transition-colors">
								{caseItem.title}
							</h3>
							<span
								class="text-xs px-2 py-1 rounded-full {caseItem.status === 'active'
									? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
									: caseItem.status === 'pending'
										? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
										: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'}"
							>
								{caseItem.status}
							</span>
						</div>
						<div class="text-sm text-muted-foreground mb-2">
							Client: {client.firstName} {client.lastName}
						</div>
						{#if caseItem.description}
							<p class="text-sm text-muted-foreground mb-4 line-clamp-2">
								{caseItem.description}
							</p>
						{/if}
						<div class="text-xs text-muted-foreground">
							Updated: {formatDate(caseItem.updatedAt)}
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="bg-background border border-border rounded-lg p-8 text-center">
				<div class="text-4xl mb-4">📋</div>
				<h3 class="font-semibold text-lg mb-2">No Cases Yet</h3>
				<p class="text-muted-foreground mb-4">Create your first case to get started.</p>
				<button 
					onclick={openCreateCase}
					class="bg-gold hover:bg-gold-dark text-black font-semibold px-6 py-2 rounded-md transition-colors"
				>
					Create Case
				</button>
			</div>
		{/if}
	</div>

	<!-- Recent Documents -->
	<div class="mb-8">
		<div class="flex justify-between items-center mb-4">
			<h2 class="font-title text-2xl">Recent Documents</h2>
		</div>

		{#if data.documents.length > 0}
			<div class="bg-background border border-border rounded-lg overflow-hidden">
				<table class="w-full">
					<thead class="bg-muted">
						<tr>
							<th class="text-left px-6 py-3 text-sm font-semibold">File Name</th>
							<th class="text-left px-6 py-3 text-sm font-semibold">Size</th>
							<th class="text-left px-6 py-3 text-sm font-semibold">Uploaded</th>
							<th class="text-right px-6 py-3 text-sm font-semibold">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.documents as doc}
							<tr class="border-t border-border hover:bg-muted/50">
								<td class="px-6 py-4">{doc.fileName}</td>
								<td class="px-6 py-4 text-sm text-muted-foreground">
									{(doc.fileSize / 1024).toFixed(1)} KB
								</td>
								<td class="px-6 py-4 text-sm text-muted-foreground">
									{formatDate(doc.uploadedAt)}
								</td>
								<td class="px-6 py-4 text-right">
									<a href="/api/documents/{doc.id}" class="text-gold hover:underline text-sm">
										Download
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="bg-background border border-border rounded-lg p-8 text-center">
				<p class="text-muted-foreground">No documents uploaded yet</p>
			</div>
		{/if}
	</div>

	<!-- Recent Invoices -->
	<div>
		<div class="flex justify-between items-center mb-4">
			<h2 class="font-title text-2xl">Recent Invoices</h2>
			<button class="bg-gold hover:bg-gold-dark text-black font-semibold px-4 py-2 rounded-md transition-colors">
				Create Invoice
			</button>
		</div>

		{#if data.invoices.length > 0}
			<div class="bg-background border border-border rounded-lg overflow-hidden">
				<table class="w-full">
					<thead class="bg-muted">
						<tr>
							<th class="text-left px-6 py-3 text-sm font-semibold">Description</th>
							<th class="text-left px-6 py-3 text-sm font-semibold">Amount</th>
							<th class="text-left px-6 py-3 text-sm font-semibold">Due Date</th>
							<th class="text-left px-6 py-3 text-sm font-semibold">Status</th>
						</tr>
					</thead>
					<tbody>
						{#each data.invoices as invoice}
							<tr class="border-t border-border hover:bg-muted/50">
								<td class="px-6 py-4">{invoice.description}</td>
								<td class="px-6 py-4 font-semibold">{formatCurrency(invoice.amount)}</td>
								<td class="px-6 py-4 text-sm text-muted-foreground">
									{formatDate(invoice.dueDate)}
								</td>
								<td class="px-6 py-4">
									<span
										class="text-xs px-2 py-1 rounded-full {invoice.status === 'paid'
											? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
											: invoice.status === 'partial'
												? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
												: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}"
									>
										{invoice.status}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="bg-background border border-border rounded-lg p-8 text-center">
				<p class="text-muted-foreground">No invoices yet</p>
			</div>
		{/if}
	</div>
</div>

<!-- Create Case Modal -->
<CreateCaseModal 
	bind:open={showCreateCaseModal} 
	initialClientId={selectedClientId}
	on:close={() => { showCreateCaseModal = false; selectedClientId = null; }}
	on:created={handleCaseCreated}
/>
