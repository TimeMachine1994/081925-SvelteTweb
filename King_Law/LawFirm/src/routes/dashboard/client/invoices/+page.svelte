<script lang="ts">
	import { onMount } from 'svelte';
	import { invoicesStore } from '$lib/stores/invoices.svelte.ts';
	import { Receipt, CreditCard, ArrowLeft, Clock, CheckCircle, AlertCircle } from 'lucide-svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	onMount(() => {
		invoicesStore.fetchInvoices();
	});

	function formatCurrency(cents: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(cents / 100);
	}

	function formatDate(timestamp: number | Date): string {
		const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function remainingBalance(invoice: any): number {
		return invoice.amount - (invoice.paidAmount || 0);
	}

	function isOverdue(invoice: any): boolean {
		if (invoice.status === 'paid') return false;
		const dueDate = typeof invoice.dueDate === 'number' ? invoice.dueDate * 1000 : new Date(invoice.dueDate).getTime();
		return dueDate < Date.now();
	}

	let unpaidInvoices = $derived(
		invoicesStore.invoices.filter(i => i.invoice.status !== 'paid')
	);
	let paidInvoices = $derived(
		invoicesStore.invoices.filter(i => i.invoice.status === 'paid')
	);
	let totalOwed = $derived(
		unpaidInvoices.reduce((sum, i) => sum + remainingBalance(i.invoice), 0)
	);
</script>

<svelte:head>
	<title>My Invoices | King Law</title>
</svelte:head>

<div>
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
		<div>
			<a href="/dashboard/client" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gold transition-colors mb-2">
				<ArrowLeft class="w-4 h-4" />
				Back to Dashboard
			</a>
			<h1 class="font-title text-4xl">My Invoices</h1>
		</div>
		{#if totalOwed > 0}
			<div class="bg-king-blue text-white rounded-xl px-6 py-4 text-center sm:text-right">
				<p class="text-white/60 text-xs uppercase tracking-wider mb-1">Total Balance Due</p>
				<p class="text-2xl font-bold text-gold">{formatCurrency(totalOwed)}</p>
			</div>
		{/if}
	</div>

	{#if invoicesStore.loading}
		<div class="flex items-center justify-center py-16">
			<svg class="w-8 h-8 animate-spin text-gold" viewBox="0 0 24 24" fill="none">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
		</div>
	{:else if invoicesStore.error}
		<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
			<p class="text-red-800 dark:text-red-200 font-medium">{invoicesStore.error}</p>
			<button onclick={() => invoicesStore.fetchInvoices()} class="mt-2 text-sm text-gold hover:underline">
				Try again
			</button>
		</div>
	{:else if invoicesStore.invoices.length === 0}
		<EmptyState
			icon={Receipt}
			title="No Invoices"
			description="You don't have any invoices yet. Invoices will appear here when your attorney creates them."
		/>
	{:else}
		<!-- Unpaid / Partial Invoices -->
		{#if unpaidInvoices.length > 0}
			<div class="mb-8">
				<h2 class="font-title text-2xl mb-4 flex items-center gap-2">
					<AlertCircle class="w-5 h-5 text-gold" />
					Outstanding Invoices
				</h2>
				<div class="space-y-4">
					{#each unpaidInvoices as { invoice, case: caseInfo } (invoice.id)}
						<div class="bg-background border border-border rounded-lg p-6 hover:border-gold transition-all">
							<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-3 mb-2">
										<h3 class="font-semibold text-lg truncate">{invoice.description}</h3>
										<Badge variant={invoice.status === 'partial' ? 'partial' : 'unpaid'} />
										{#if isOverdue(invoice)}
											<span class="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Overdue</span>
										{/if}
									</div>
									{#if caseInfo}
										<p class="text-sm text-muted-foreground mb-2">Case: {caseInfo.title}</p>
									{/if}
									<div class="flex flex-wrap gap-x-6 gap-y-1 text-sm">
										<span class="text-muted-foreground">
											<Clock class="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
											Due: {formatDate(invoice.dueDate)}
										</span>
										<span>Total: <strong>{formatCurrency(invoice.amount)}</strong></span>
										{#if invoice.paidAmount > 0}
											<span class="text-green-600">Paid: {formatCurrency(invoice.paidAmount)}</span>
										{/if}
										<span class="text-king-blue font-semibold">
											Remaining: {formatCurrency(remainingBalance(invoice))}
										</span>
									</div>
								</div>
								<div class="flex items-center gap-3 shrink-0">
									<a
										href="/dashboard/client/invoices/{invoice.id}/pay"
										class="inline-flex items-center gap-2 bg-king-blue hover:bg-king-blue-light text-white font-semibold px-6 py-3 rounded-lg transition-all hover:shadow-lg"
									>
										<CreditCard class="w-4 h-4" />
										Pay Bill
									</a>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Paid Invoices -->
		{#if paidInvoices.length > 0}
			<div>
				<h2 class="font-title text-2xl mb-4 flex items-center gap-2">
					<CheckCircle class="w-5 h-5 text-green-600" />
					Paid Invoices
				</h2>
				<div class="space-y-3">
					{#each paidInvoices as { invoice, case: caseInfo } (invoice.id)}
						<div class="bg-background border border-border rounded-lg p-5 opacity-80">
							<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
								<div class="min-w-0">
									<div class="flex items-center gap-3 mb-1">
										<h3 class="font-semibold truncate">{invoice.description}</h3>
										<Badge variant="paid" />
									</div>
									{#if caseInfo}
										<p class="text-sm text-muted-foreground">Case: {caseInfo.title}</p>
									{/if}
								</div>
								<div class="text-right shrink-0">
									<p class="font-semibold">{formatCurrency(invoice.amount)}</p>
									{#if invoice.paidAt}
										<p class="text-xs text-muted-foreground">Paid {formatDate(invoice.paidAt)}</p>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
