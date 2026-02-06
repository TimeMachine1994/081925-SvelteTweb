<script lang="ts">
	import { casesStore } from '$lib/stores/cases.svelte.ts';
	import { documentsStore } from '$lib/stores/documents.svelte.ts';
	import { messagesStore } from '$lib/stores/messages.svelte.ts';
	import { invoicesStore } from '$lib/stores/invoices.svelte.ts';

	let activeCases = $derived(casesStore.cases.filter(c => c.case.status === 'active').length);
	let documentsCount = $derived(documentsStore.documents.length);
	let unreadMessages = $derived(messagesStore.messages.filter(m => !m.message.readAt).length);

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
	<h1 class="font-title text-4xl mb-8">Client Dashboard</h1>

	{#if casesStore.error || messagesStore.error || documentsStore.error || invoicesStore.error}
		<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 text-center">
			<p class="text-red-800 dark:text-red-200 font-medium">
				{casesStore.error || messagesStore.error || documentsStore.error || invoicesStore.error}
			</p>
			<button onclick={() => window.location.reload()} class="mt-2 text-sm text-gold hover:underline">
				Try again
			</button>
		</div>
	{/if}

	<!-- Stats Overview -->
	<div class="grid md:grid-cols-4 gap-6 mb-8">
		<div class="bg-background border border-border rounded-lg p-6">
			<div class="text-3xl mb-2">📁</div>
			<div class="text-2xl font-bold">{activeCases}</div>
			<div class="text-sm text-muted-foreground">Active Cases</div>
		</div>

		<div class="bg-background border border-border rounded-lg p-6">
			<div class="text-3xl mb-2">💰</div>
			<div class="text-2xl font-bold">{formatCurrency(0)}</div>
			<div class="text-sm text-muted-foreground">Unpaid Invoices</div>
		</div>

		<div class="bg-background border border-border rounded-lg p-6">
			<div class="text-3xl mb-2">💬</div>
			<div class="text-2xl font-bold {unreadMessages > 0 ? 'text-red-500' : ''}">{unreadMessages}</div>
			<div class="text-sm text-muted-foreground">Unread Messages</div>
		</div>

		<a
			href="/dashboard/client/documents"
			class="bg-background border border-border rounded-lg p-6 hover:border-gold hover:shadow-md transition-all block"
		>
			<div class="text-3xl mb-2">📄</div>
			<div class="text-2xl font-bold">{documentsCount}</div>
			<div class="text-sm text-muted-foreground">Documents</div>
		</a>
	</div>

	<!-- Your Cases -->
	<div class="mb-8">
		<div class="flex justify-between items-center mb-4">
			<h2 class="font-title text-2xl">Your Cases</h2>
		</div>

		{#if casesStore.cases.length > 0}
			<div class="grid md:grid-cols-2 gap-4">
				{#each casesStore.cases as caseItem}
					<a
						href="/dashboard/client/case/{caseItem.case.id}"
						class="bg-background border border-border rounded-lg p-6 hover:border-gold transition-all hover:shadow-lg group"
					>
						<div class="flex justify-between items-start mb-2">
							<h3 class="font-semibold text-lg group-hover:text-gold transition-colors">
								{caseItem.case.title}
							</h3>
							<span
								class="text-xs px-2 py-1 rounded-full {caseItem.case.status === 'active'
									? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
									: caseItem.case.status === 'pending'
										? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
										: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'}"
							>
								{caseItem.case.status}
							</span>
						</div>
						{#if caseItem.case.description}
							<p class="text-sm text-muted-foreground mb-4 line-clamp-2">
								{caseItem.case.description}
							</p>
						{/if}
						<div class="text-xs text-muted-foreground">
							Updated: {formatDate(caseItem.case.updatedAt)}
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="bg-background border border-border rounded-lg p-8 text-center">
				<div class="text-4xl mb-4">📋</div>
				<h3 class="font-semibold text-lg mb-2">No Active Cases</h3>
				<p class="text-muted-foreground mb-4">
					You don't have any cases yet. Contact us to get started.
				</p>
				<a
					href="/contact"
					class="inline-block bg-gold hover:bg-gold-dark text-black font-semibold px-6 py-2 rounded-md transition-colors"
				>
					Contact Us
				</a>
			</div>
		{/if}
	</div>

	<!-- Invoices -->
	<div>
		<div class="flex justify-between items-center mb-4">
			<h2 class="font-title text-2xl">Invoices</h2>
		</div>

		{#if invoicesStore.invoices.length > 0}
			<div class="bg-background border border-border rounded-lg overflow-hidden">
				<table class="w-full">
					<thead class="bg-muted">
						<tr>
							<th class="text-left px-6 py-3 text-sm font-semibold">Description</th>
							<th class="text-left px-6 py-3 text-sm font-semibold">Amount</th>
							<th class="text-left px-6 py-3 text-sm font-semibold">Due Date</th>
							<th class="text-left px-6 py-3 text-sm font-semibold">Status</th>
							<th class="text-right px-6 py-3 text-sm font-semibold">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each invoicesStore.invoices as { invoice }}
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
								<td class="px-6 py-4 text-right">
									{#if invoice.status !== 'paid'}
										<button class="text-gold hover:underline text-sm">Pay Now</button>
									{/if}
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
