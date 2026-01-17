<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatCurrency(cents: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(cents / 100);
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
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

	<!-- Uncategorized Messages Alert -->
	{#if data.uncategorizedThreads.length > 0}
		<div class="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-6 mb-8">
			<div class="flex items-start">
				<div class="text-3xl mr-4">⚠️</div>
				<div class="flex-1">
					<h3 class="font-semibold text-lg mb-2">Uncategorized Messages</h3>
					<p class="text-sm text-muted-foreground mb-4">
						You have messages from clients without assigned cases. Review and create cases as needed.
					</p>
					<div class="space-y-2">
						{#each data.uncategorizedThreads as thread}
							<div class="bg-background border border-border rounded p-3 flex justify-between items-center">
								<div>
									<div class="font-semibold">
										{thread.client.firstName} {thread.client.lastName}
									</div>
									<div class="text-sm text-muted-foreground">
										{thread.messages.length} message{thread.messages.length !== 1 ? 's' : ''}
									</div>
								</div>
								<div class="flex gap-2">
									<button class="text-sm text-gold hover:underline">View Messages</button>
									<button class="text-sm bg-gold hover:bg-gold-dark text-black px-3 py-1 rounded">
										Create Case
									</button>
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
			<button class="bg-gold hover:bg-gold-dark text-black font-semibold px-4 py-2 rounded-md transition-colors">
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
				<button class="bg-gold hover:bg-gold-dark text-black font-semibold px-6 py-2 rounded-md transition-colors">
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
