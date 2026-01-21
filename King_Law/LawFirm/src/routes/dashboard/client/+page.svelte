<script lang="ts">
	import { onMount } from 'svelte';
	import { casesStore } from '$lib/stores/cases.svelte';
	import { documentsStore } from '$lib/stores/documents.svelte';
	import { invoicesStore } from '$lib/stores/invoices.svelte';
	import { messagesStore } from '$lib/stores/messages.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import DashboardSkeleton from '$lib/components/ui/DashboardSkeleton.svelte';
	import MessageComposer from '$lib/components/MessageComposer.svelte';

	let loading = $state(true);

	let openCases = $derived(casesStore.cases.filter(c => c.case.status === 'open').length);
	let totalUnpaid = $derived(
		invoicesStore.invoices
			.filter(i => i.invoice.status !== 'paid')
			.reduce((sum, i) => sum + (i.invoice.amount - i.invoice.paidAmount), 0)
	);
	let unreadMessages = $derived(messagesStore.unreadCounts?.total || 0);

	onMount(async () => {
		loading = true;
		try {
			await Promise.all([
				casesStore.fetchCases(),
				documentsStore.fetchDocuments(),
				invoicesStore.fetchInvoices(),
				messagesStore.fetchUnreadCounts()
			]);
		} catch (error) {
			console.error('Error loading dashboard:', error);
			toastStore.error('Failed to load dashboard data');
		} finally {
			loading = false;
		}
	});

	function formatCurrency(cents: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(cents / 100);
	}

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<Toast />

{#if loading}
	<DashboardSkeleton />
{:else}
<div>
	<h1 class="font-title text-4xl mb-8">Client Dashboard</h1>

	<!-- Stats Overview -->
	<div class="grid md:grid-cols-4 gap-6 mb-8">
		<div class="bg-background border border-border rounded-lg p-6">
			<div class="text-3xl mb-2">📁</div>
			<div class="text-2xl font-bold">{openCases}</div>
			<div class="text-sm text-muted-foreground">Open Cases</div>
		</div>

		<div class="bg-background border border-border rounded-lg p-6">
			<div class="text-3xl mb-2">💰</div>
			<div class="text-2xl font-bold {totalUnpaid > 0 ? 'text-red-500' : ''}">{formatCurrency(totalUnpaid)}</div>
			<div class="text-sm text-muted-foreground">Unpaid Invoices</div>
		</div>

		<div class="bg-background border border-border rounded-lg p-6">
			<div class="text-3xl mb-2">💬</div>
			<div class="text-2xl font-bold">{unreadMessages}</div>
			<div class="text-sm text-muted-foreground">Unread Messages</div>
		</div>

		<div class="bg-background border border-border rounded-lg p-6">
			<div class="text-3xl mb-2">📄</div>
			<div class="text-2xl font-bold">{documentsStore.documents.length}</div>
			<div class="text-sm text-muted-foreground">Documents</div>
		</div>
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
								class="text-xs px-2 py-1 rounded-full {caseItem.case.status === 'open'
									? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
									: caseItem.case.status === 'archived'
										? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
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
			<div class="bg-background border border-border rounded-lg p-8">
				<div class="text-center mb-6">
					<div class="text-4xl mb-4">👋</div>
					<h3 class="font-semibold text-xl mb-2">Welcome to King Law Firm</h3>
					<p class="text-muted-foreground">
						You don't have any active cases yet. Send us a message to get started, and you can attach any relevant documents.
					</p>
				</div>
				
				<MessageComposer 
					caseId={null}
					placeholder="Tell us about your legal matter..."
					showHistory={true}
					onMessageSent={() => messagesStore.fetchMessages(undefined, true)}
				/>
			</div>
		{/if}
	</div>

	<!-- Recent Documents -->
	<div class="mb-8">
		<div class="flex justify-between items-center mb-4">
			<h2 class="font-title text-2xl">Recent Documents</h2>
		</div>

		{#if documentsStore.documents.length > 0}
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
						{#each documentsStore.documents.slice(0, 5) as item}
							<tr class="border-t border-border hover:bg-muted/50">
								<td class="px-6 py-4">{item.document.fileName}</td>
								<td class="px-6 py-4 text-sm text-muted-foreground">
									{(item.document.fileSize / 1024).toFixed(1)} KB
								</td>
								<td class="px-6 py-4 text-sm text-muted-foreground">
									{formatDate(item.document.uploadedAt)}
								</td>
								<td class="px-6 py-4 text-right">
									<a
										href="/api/documents/{item.document.id}"
										class="text-gold hover:underline text-sm"
									>
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
						{#each invoicesStore.invoices as item}
							<tr class="border-t border-border hover:bg-muted/50">
								<td class="px-6 py-4">{item.invoice.description}</td>
								<td class="px-6 py-4 font-semibold">{formatCurrency(item.invoice.amount)}</td>
								<td class="px-6 py-4 text-sm text-muted-foreground">
									{formatDate(item.invoice.dueDate)}
								</td>
								<td class="px-6 py-4">
									<span
										class="text-xs px-2 py-1 rounded-full {item.invoice.status === 'paid'
											? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
											: item.invoice.status === 'partial'
												? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
												: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}"
									>
										{item.invoice.status}
									</span>
								</td>
								<td class="px-6 py-4 text-right">
									{#if item.invoice.status !== 'paid'}
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
{/if}
