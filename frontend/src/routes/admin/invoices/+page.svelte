<script lang="ts">
	import { onMount } from 'svelte';
	import { FileText, Plus, CheckCircle, Clock, XCircle, ExternalLink } from 'lucide-svelte';

	interface Invoice {
		id: string;
		customerEmail: string;
		customerName?: string;
		total: number;
		status: 'pending' | 'paid' | 'expired' | 'cancelled';
		createdAt: string;
		paidAt?: string;
	}

	let invoices = $state<Invoice[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let statusFilter = $state<string>('');

	onMount(async () => {
		await loadInvoices();
	});

	async function loadInvoices() {
		isLoading = true;
		error = null;

		try {
			const params = new URLSearchParams();
			if (statusFilter) params.set('status', statusFilter);

			const response = await fetch(`/api/admin/invoices?${params}`);
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to load invoices');
			}

			invoices = result.invoices;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load invoices';
		} finally {
			isLoading = false;
		}
	}

	function formatCurrency(cents: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(cents / 100);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'paid':
				return CheckCircle;
			case 'pending':
				return Clock;
			default:
				return XCircle;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'paid':
				return 'text-green-600 bg-green-50';
			case 'pending':
				return 'text-amber-600 bg-amber-50';
			default:
				return 'text-slate-500 bg-slate-100';
		}
	}

	$effect(() => {
		if (statusFilter !== undefined) {
			loadInvoices();
		}
	});
</script>

<svelte:head>
	<title>Invoices - Admin - Tributestream</title>
</svelte:head>

<div class="p-6">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-slate-800">Invoices</h1>
			<p class="text-slate-500">Manage customer invoices</p>
		</div>
		<a
			href="/admin/invoices/create"
			class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
		>
			<Plus class="h-5 w-5" />
			Create Invoice
		</a>
	</div>

	<!-- Filters -->
	<div class="mb-6">
		<select
			bind:value={statusFilter}
			class="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
		>
			<option value="">All Statuses</option>
			<option value="pending">Pending</option>
			<option value="paid">Paid</option>
			<option value="expired">Expired</option>
			<option value="cancelled">Cancelled</option>
		</select>
	</div>

	<!-- Error State -->
	{#if error}
		<div class="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
			<p class="text-red-800">{error}</p>
		</div>
	{/if}

	<!-- Loading State -->
	{#if isLoading}
		<div class="text-center py-12">
			<div class="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
			<p class="mt-4 text-slate-600">Loading invoices...</p>
		</div>
	{:else if invoices.length === 0}
		<!-- Empty State -->
		<div class="text-center py-12 bg-white rounded-xl shadow">
			<FileText class="h-12 w-12 mx-auto text-slate-300 mb-4" />
			<h3 class="text-lg font-medium text-slate-800 mb-2">No invoices yet</h3>
			<p class="text-slate-500 mb-4">Create your first invoice to get started</p>
			<a
				href="/admin/invoices/create"
				class="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
			>
				<Plus class="h-5 w-5" />
				Create Invoice
			</a>
		</div>
	{:else}
		<!-- Invoice List -->
		<div class="bg-white rounded-xl shadow overflow-hidden">
			<table class="w-full">
				<thead class="bg-slate-50 border-b border-slate-200">
					<tr>
						<th class="text-left px-6 py-3 text-sm font-medium text-slate-600">Invoice</th>
						<th class="text-left px-6 py-3 text-sm font-medium text-slate-600">Customer</th>
						<th class="text-left px-6 py-3 text-sm font-medium text-slate-600">Amount</th>
						<th class="text-left px-6 py-3 text-sm font-medium text-slate-600">Status</th>
						<th class="text-left px-6 py-3 text-sm font-medium text-slate-600">Date</th>
						<th class="text-right px-6 py-3 text-sm font-medium text-slate-600">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each invoices as invoice}
						<tr class="hover:bg-slate-50">
							<td class="px-6 py-4">
								<span class="font-mono text-sm text-slate-800">{invoice.id}</span>
							</td>
							<td class="px-6 py-4">
								<div>
									{#if invoice.customerName}
										<p class="font-medium text-slate-800">{invoice.customerName}</p>
									{/if}
									<p class="text-sm text-slate-500">{invoice.customerEmail}</p>
								</div>
							</td>
							<td class="px-6 py-4">
								<span class="font-semibold text-slate-800">{formatCurrency(invoice.total)}</span>
							</td>
							<td class="px-6 py-4">
								<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm {getStatusColor(invoice.status)}">
									<svelte:component this={getStatusIcon(invoice.status)} class="h-4 w-4" />
									{invoice.status}
								</span>
							</td>
							<td class="px-6 py-4 text-sm text-slate-600">
								{formatDate(invoice.createdAt)}
							</td>
							<td class="px-6 py-4 text-right">
								<a
									href="/pay/{invoice.id}"
									target="_blank"
									class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
								>
									View
									<ExternalLink class="h-4 w-4" />
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
