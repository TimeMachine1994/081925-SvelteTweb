<!--
RECEIPTS ADMIN PAGE

View all payment receipts with ability to view details and print/download as PDF
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import { StatCard, EmptyState } from '$lib/components/admin/ui';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let search = $state<string>(data.searchQuery || '');

	// Column configuration
	const columns = [
		{
			id: 'lovedOneName',
			label: 'Memorial',
			field: 'lovedOneName',
			width: 180,
			sortable: true
		},
		{
			id: 'ownerEmail',
			label: 'Customer',
			field: 'ownerEmail',
			width: 200,
			sortable: true,
			formatter: (val: string, row: any) => row.ownerName || val || 'Unknown'
		},
		{
			id: 'amount',
			label: 'Amount',
			field: 'amount',
			width: 100,
			sortable: true,
			formatter: (val: number) => val ? `$${val.toFixed(2)}` : '-'
		},
		{
			id: 'paidAt',
			label: 'Payment Date',
			field: 'paidAt',
			width: 150,
			sortable: true,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				return date.toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				});
			}
		},
		{
			id: 'status',
			label: 'Status',
			field: 'status',
			width: 100,
			formatter: (val: string) => {
				switch (val) {
					case 'paid':
						return 'Paid';
					case 'payment_failed':
						return 'Failed';
					case 'pending_payment':
						return 'Pending';
					default:
						return val || '-';
				}
			}
		},
		{
			id: 'paymentIntentId',
			label: 'Payment ID',
			field: 'paymentIntentId',
			width: 180,
			formatter: (val: string) => val ? `${val.substring(0, 20)}...` : '-'
		}
	];

	function handleRowClick(receipt: any) {
		goto(`/admin/services/receipts/${receipt.memorialId}`);
	}
</script>

<AdminLayout
	title="Payment Receipts"
	subtitle="View and print payment receipts for all completed transactions"
>
	<!-- Search Bar -->
	<form class="mb-4 flex items-center gap-2" method="GET">
		<input
			type="text"
			name="q"
			placeholder="Search by name, email, payment ID..."
			value={search}
			oninput={(event) => {
				const target = event.currentTarget as HTMLInputElement;
				search = target.value;
			}}
			class="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
		/>
		<button
			type="submit"
			class="rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
		>
			Search
		</button>
	</form>

	<!-- Stats Summary -->
	<div class="mb-6 grid grid-cols-2 gap-4">
		<StatCard label="Total Receipts" value={data.receipts.length} icon="receipts" variant="info" />
		<StatCard
			label="Total Revenue"
			value={`$${data.receipts.reduce((sum: number, r: any) => sum + (r.amount || 0), 0).toFixed(2)}`}
			icon="payment"
			variant="success"
		/>
	</div>

	{#if data.receipts.length === 0}
		<EmptyState
			icon="receipts"
			title="No receipts found"
			description="Payment receipts will appear here after customers complete their purchases."
		/>
	{:else}
		<DataGrid
			{columns}
			data={data.receipts}
			selectable={false}
			onRowClick={handleRowClick}
			resourceType="receipt"
		/>
	{/if}
</AdminLayout>

