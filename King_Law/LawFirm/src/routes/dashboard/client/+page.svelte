<script lang="ts">
	import { onMount } from 'svelte';
	import { casesStore } from '$lib/stores/cases.svelte.ts';
	import { documentsStore } from '$lib/stores/documents.svelte.ts';
	import { messagesStore } from '$lib/stores/messages.svelte.ts';
	import { invoicesStore } from '$lib/stores/invoices.svelte.ts';
	import { FolderOpen, DollarSign, MessageSquare, FileText, ClipboardList, Briefcase, Receipt } from 'lucide-svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';

	let activeCases = $derived(casesStore.cases.filter(c => c.case.status === 'active').length);
	let documentsCount = $derived(documentsStore.documents.length);
	// Use unreadCounts.total which correctly counts only messages where user is recipient
	let unreadMessages = $derived(messagesStore.unreadCounts.total);

	let activeTab = $state('cases');

	const tabs = [
		{ id: 'cases', label: 'My Cases', icon: Briefcase, badge: undefined as string | number | undefined },
		{ id: 'invoices', label: 'Invoices', icon: Receipt }
	];

	// Dynamically set case count badge
	let dynamicTabs = $derived(tabs.map(t => 
		t.id === 'cases' ? { ...t, badge: casesStore.cases.length || undefined } : t
	));

	onMount(() => {
		// Fetch unread counts on mount
		messagesStore.fetchUnreadCounts();
	});

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
	<h1 class="font-title text-2xl sm:text-4xl mb-4 sm:mb-8">Client Dashboard</h1>

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
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
		<StatCard label="Active Cases" value={activeCases} icon={FolderOpen} onclick={() => activeTab = 'cases'} />
		<StatCard label="Unpaid Invoices" value={formatCurrency(invoicesStore.invoices.filter(i => i.invoice.status !== 'paid').reduce((sum, i) => sum + (i.invoice.amount - (i.invoice.paidAmount || 0)), 0))} icon={DollarSign} iconClass="text-gold" href="/dashboard/client/invoices" />
		<StatCard label="Unread Messages" value={unreadMessages} icon={MessageSquare} />
		<StatCard label="Documents" value={documentsCount} icon={FileText} href="/dashboard/client/documents" />
	</div>

	<!-- Tabs: Cases / Invoices -->
	<Tabs tabs={dynamicTabs} bind:activeTab />

	{#if activeTab === 'cases'}
		{#if casesStore.cases.length > 0}
			<div class="grid sm:grid-cols-2 gap-3 sm:gap-4">
				{#each casesStore.cases as caseItem}
					<a
						href="/dashboard/client/case/{caseItem.case.id}"
						class="bg-background border border-border rounded-lg p-4 sm:p-6 hover:border-gold transition-all hover:shadow-lg group"
					>
						<div class="flex justify-between items-start gap-2 mb-2">
							<h3 class="font-semibold text-base sm:text-lg group-hover:text-gold transition-colors">
								{caseItem.case.title}
							</h3>
							<Badge variant={caseItem.case.status} />
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
			<EmptyState
				icon={ClipboardList}
				title="No Active Cases"
				description="You don't have any cases yet. Contact us to get started."
				actionLabel="Contact Us"
				actionHref="/contact"
			/>
		{/if}
	{:else if activeTab === 'invoices'}
		{#if invoicesStore.invoices.length > 0}
			<!-- Mobile: Card layout -->
			<div class="space-y-3 sm:hidden">
				{#each invoicesStore.invoices as { invoice }}
					<div class="bg-background border border-border rounded-lg p-4">
						<div class="flex justify-between items-start mb-2">
							<div class="font-semibold text-sm flex-1 min-w-0 mr-2">{invoice.description}</div>
							<Badge variant={invoice.status === 'paid' ? 'paid' : invoice.status === 'partial' ? 'partial' : 'unpaid'} />
						</div>
						<div class="flex justify-between items-center">
							<div>
								<div class="text-lg font-bold">{formatCurrency(invoice.amount)}</div>
								<div class="text-xs text-muted-foreground">Due: {formatDate(invoice.dueDate)}</div>
							</div>
							{#if invoice.status !== 'paid'}
								<a href="/dashboard/client/invoices/{invoice.id}/pay" class="bg-gold hover:bg-gold-dark text-black px-3 py-1.5 rounded text-xs font-semibold">Pay Now</a>
							{/if}
						</div>
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
							<th class="text-right px-4 sm:px-6 py-3 text-sm font-semibold">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each invoicesStore.invoices as { invoice }}
							<tr class="border-t border-border hover:bg-muted/50">
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-sm">{invoice.description}</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-sm">{formatCurrency(invoice.amount)}</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-sm text-muted-foreground hidden md:table-cell">
									{formatDate(invoice.dueDate)}
								</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4">
									<Badge variant={invoice.status === 'paid' ? 'paid' : invoice.status === 'partial' ? 'partial' : 'unpaid'} />
								</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-right">
									{#if invoice.status !== 'paid'}
										<a href="/dashboard/client/invoices/{invoice.id}/pay" class="text-gold hover:underline text-sm">Pay Now</a>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<EmptyState icon={Receipt} title="No Invoices" description="No invoices have been created yet." />
		{/if}
	{/if}
</div>
