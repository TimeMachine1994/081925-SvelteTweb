<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toastStore } from '$lib/stores/toast.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';

	const clientId = $page.params.id;

	let loading = $state(true);
	let client = $state<any>(null);
	let cases = $state<any[]>([]);
	let documents = $state<any[]>([]);
	let invoices = $state<any[]>([]);
	let error = $state<string | null>(null);

	onMount(async () => {
		await loadClientData();
	});

	async function loadClientData() {
		loading = true;
		error = null;
		
		try {
			const [clientRes, casesRes, docsRes, invoicesRes] = await Promise.all([
				fetch(`/api/users/${clientId}`),
				fetch(`/api/cases?clientId=${clientId}`),
				fetch(`/api/documents?clientId=${clientId}`),
				fetch(`/api/invoices?clientId=${clientId}`)
			]);

			if (!clientRes.ok) {
				throw new Error('Client not found');
			}

			const clientData = await clientRes.json();
			client = clientData.user;

			if (casesRes.ok) {
				const casesData = await casesRes.json();
				cases = casesData.cases || [];
			}

			if (docsRes.ok) {
				const docsData = await docsRes.json();
				documents = docsData.documents || [];
			}

			if (invoicesRes.ok) {
				const invoicesData = await invoicesRes.json();
				invoices = invoicesData.invoices || [];
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load client data';
			toastStore.error(error);
		} finally {
			loading = false;
		}
	}

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

	let totalOutstanding = $derived(
		invoices
			.filter(i => i.invoice.status !== 'paid')
			.reduce((sum, i) => sum + (i.invoice.amount - i.invoice.paidAmount), 0)
	);

	let totalPaid = $derived(
		invoices
			.filter(i => i.invoice.status === 'paid')
			.reduce((sum, i) => sum + i.invoice.amount, 0)
	);
</script>

<Toast />

<div class="space-y-8">
	<!-- Back Link -->
	<div>
		<a href="/dashboard/lawyer" class="text-gold hover:underline text-sm">← Back to Dashboard</a>
	</div>

	{#if loading}
		<!-- Loading Skeleton -->
		<div class="space-y-6">
			<div class="bg-background border border-border rounded-lg p-6">
				<div class="flex items-center gap-4">
					<Skeleton class="w-16 h-16 rounded-full" />
					<div class="space-y-2">
						<Skeleton class="h-8 w-48" />
						<Skeleton class="h-4 w-64" />
					</div>
				</div>
			</div>
			<div class="grid md:grid-cols-3 gap-4">
				{#each Array(3) as _}
					<Skeleton class="h-24" />
				{/each}
			</div>
		</div>
	{:else if error}
		<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
			<h2 class="text-xl font-bold text-red-800 dark:text-red-200">{error}</h2>
			<button onclick={() => goto('/dashboard/lawyer')} class="mt-4 text-gold hover:underline">
				Return to Dashboard
			</button>
		</div>
	{:else if client}
		<!-- Client Header -->
		<div class="bg-background border border-border rounded-lg p-6 shadow-sm">
			<div class="flex items-start justify-between">
				<div class="flex items-center gap-4">
					<div class="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center text-2xl font-bold text-gold">
						{client.firstName?.[0]}{client.lastName?.[0]}
					</div>
					<div>
						<h1 class="font-title text-3xl">{client.firstName} {client.lastName}</h1>
						<p class="text-muted-foreground">{client.email}</p>
						{#if client.phoneNumber}
							<p class="text-sm text-muted-foreground">{client.phoneNumber}</p>
						{/if}
					</div>
				</div>
				<div class="text-right text-sm text-muted-foreground">
					<p>Client since</p>
					<p class="font-medium text-foreground">{formatDate(client.createdAt)}</p>
				</div>
			</div>
		</div>

		<!-- Stats Cards -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div class="bg-background border border-border rounded-lg p-4 shadow-sm">
				<div class="text-2xl font-bold">{cases.length}</div>
				<div class="text-sm text-muted-foreground">Total Cases</div>
			</div>
			<div class="bg-background border border-border rounded-lg p-4 shadow-sm">
				<div class="text-2xl font-bold text-green-600">
					{cases.filter(c => c.case.status === 'active').length}
				</div>
				<div class="text-sm text-muted-foreground">Active Cases</div>
			</div>
			<div class="bg-background border border-border rounded-lg p-4 shadow-sm">
				<div class="text-2xl font-bold text-gold">{formatCurrency(totalPaid)}</div>
				<div class="text-sm text-muted-foreground">Total Paid</div>
			</div>
			<div class="bg-background border border-border rounded-lg p-4 shadow-sm">
				<div class="text-2xl font-bold {totalOutstanding > 0 ? 'text-red-500' : ''}">{formatCurrency(totalOutstanding)}</div>
				<div class="text-sm text-muted-foreground">Outstanding</div>
			</div>
		</div>

		<!-- Cases Section -->
		<div>
			<h2 class="font-title text-2xl mb-4">Cases</h2>
			{#if cases.length > 0}
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each cases as caseItem}
						<a
							href="/dashboard/lawyer/case/{caseItem.case.id}"
							class="bg-background border border-border rounded-lg p-4 shadow-sm hover:shadow-md hover:border-gold/50 transition-all block"
						>
							<div class="flex justify-between items-start mb-2">
								<h3 class="font-semibold truncate flex-1 mr-2">{caseItem.case.title}</h3>
								<span
									class="text-xs px-2 py-1 rounded-full border shrink-0 {caseItem.case.status === 'active'
										? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
										: caseItem.case.status === 'pending'
											? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
											: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'}"
								>
									{caseItem.case.status}
								</span>
							</div>
							<p class="text-xs text-muted-foreground">
								Updated: {formatDate(caseItem.case.updatedAt)}
							</p>
						</a>
					{/each}
				</div>
			{:else}
				<div class="bg-background border border-border rounded-lg p-8 text-center shadow-sm">
					<p class="text-muted-foreground">No cases for this client</p>
				</div>
			{/if}
		</div>

		<!-- Recent Documents -->
		<div>
			<h2 class="font-title text-2xl mb-4">Recent Documents</h2>
			{#if documents.length > 0}
				<div class="bg-background border border-border rounded-lg overflow-hidden shadow-sm">
					<table class="w-full">
						<thead class="bg-muted border-b border-border">
							<tr>
								<th class="text-left px-4 py-3 text-sm font-semibold">File Name</th>
								<th class="text-left px-4 py-3 text-sm font-semibold">Case</th>
								<th class="text-left px-4 py-3 text-sm font-semibold">Date</th>
								<th class="text-right px-4 py-3 text-sm font-semibold">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each documents.slice(0, 5) as doc}
								<tr class="hover:bg-muted/50 transition-colors">
									<td class="px-4 py-3 text-sm">{doc.document.fileName}</td>
									<td class="px-4 py-3 text-sm text-muted-foreground">
										{doc.case?.title || 'N/A'}
									</td>
									<td class="px-4 py-3 text-sm text-muted-foreground">
										{formatDate(doc.document.uploadedAt)}
									</td>
									<td class="px-4 py-3 text-right">
										<a 
											href="/api/documents/{doc.document.id}" 
											class="text-gold hover:underline text-sm font-medium"
											target="_blank"
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
				<div class="bg-background border border-border rounded-lg p-8 text-center shadow-sm">
					<p class="text-muted-foreground">No documents uploaded</p>
				</div>
			{/if}
		</div>

		<!-- Recent Invoices -->
		<div>
			<h2 class="font-title text-2xl mb-4">Invoices</h2>
			{#if invoices.length > 0}
				<div class="space-y-3">
					{#each invoices.slice(0, 5) as item}
						<div class="bg-background border border-border rounded-lg p-4 shadow-sm">
							<div class="flex justify-between items-start">
								<div>
									<h3 class="font-semibold">{item.invoice.description}</h3>
									<p class="text-sm text-muted-foreground">
										{item.case?.title || 'N/A'} • Due: {formatDate(item.invoice.dueDate)}
									</p>
								</div>
								<div class="text-right">
									<div class="text-lg font-bold">{formatCurrency(item.invoice.amount)}</div>
									<span
										class="text-xs px-2 py-1 rounded-full border {item.invoice.status === 'paid'
											? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
											: item.invoice.status === 'partial'
												? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
												: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}"
									>
										{item.invoice.status}
									</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="bg-background border border-border rounded-lg p-8 text-center shadow-sm">
					<p class="text-muted-foreground">No invoices created</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
