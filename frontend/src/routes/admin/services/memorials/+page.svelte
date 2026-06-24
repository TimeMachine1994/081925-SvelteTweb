<!--
MEMORIALS ADMIN PAGE

High-density data grid for memorial management
Implements ADMIN_REFACTOR_2_DATA_OPERATIONS.md features
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import BulkActionBar from '$lib/components/admin/BulkActionBar.svelte';
	import FilterBuilder from '$lib/components/admin/FilterBuilder.svelte';
	import { ConfirmDialog } from '$lib/components/admin/ui';
	import { adminToast } from '$lib/stores/adminToast';
	import { can } from '$lib/stores/adminUser';
	import { goto } from '$app/navigation';
	import { applyFilters, type FilterRule } from '$lib/utils/filter-utils';

	let { data } = $props();

	// State
	let selectedMemorials = $state<Set<string>>(new Set());
	let showFilters = $state(false);
	let search = $state<string>(data.searchQuery || '');
	let activeFilters = $state<FilterRule[]>([]);

	// Bulk-delete confirmation state
	let confirmDeleteOpen = $state(false);
	let pendingDeleteIds = $state<string[]>([]);

	// Derived filtered data
	let filteredMemorials = $derived.by(() => {
		return applyFilters(data.memorials, activeFilters);
	});

	async function togglePayment(row: any) {
		const action = row.isPaid ? 'markUnpaid' : 'markPaid';

		const response = await fetch('/api/admin/bulk-actions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action,
				ids: [row.id],
				resourceType: 'memorial'
			})
		});

		if (response.ok) {
			location.reload();
		} else {
			adminToast.error('Failed to update payment status. Please try again.');
		}
	}

	async function toggleVisibility(row: any) {
		const action = row.isPublic ? 'makePrivate' : 'makePublic';

		const response = await fetch('/api/admin/bulk-actions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action,
				ids: [row.id],
				resourceType: 'memorial'
			})
		});

		if (response.ok) {
			location.reload();
		} else {
			adminToast.error('Failed to update visibility. Please try again.');
		}
	}

	// Navigate to user detail page
	function viewUserDetails(row: any) {
		if (row.ownerUid) {
			goto(`/admin/users/memorial-owners/${row.ownerUid}`);
		}
	}

	// Column configuration
	const columns = [
		{
			id: 'lovedOneName',
			label: 'Name',
			field: 'lovedOneName',
			width: 200,
			sortable: true,
			pinnable: true,
			formatter: (val: string, row: any) => row.customTitle || val
		},
		{
			id: 'ownerEmail',
			label: 'Owner',
			field: 'creatorEmail',
			width: 200,
			sortable: true,
			onClick: viewUserDetails,
			formatter: (val: string) => val || 'Unknown'
		},
		{
			id: 'isPaid',
			label: 'Payment',
			field: 'isPaid',
			width: 120,
			formatter: (val: boolean) => (val ? 'Paid' : 'Unpaid'),
			onClick: togglePayment,
			sortable: true
		},
		{
			id: 'isPublic',
			label: 'Visibility',
			field: 'isPublic',
			width: 100,
			formatter: (val: boolean) => (val ? 'Public' : 'Private'),
			onClick: toggleVisibility
		},
		{
			id: 'createdAt',
			label: 'Created',
			field: 'createdAt',
			width: 150,
			sortable: true,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				return date.toLocaleDateString();
			}
		},
		{
			id: 'location',
			label: 'Location',
			field: 'location',
			width: 180
		},
		{
			id: 'serviceDate',
			label: 'Service Date',
			field: 'scheduledStartTime',
			width: 120,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				const datePart = date.toLocaleDateString();
				const timePart = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
				return `${datePart} ${timePart}`;
			}
		}
	];

	// Actions
	async function handleBulkAction(action: string, ids: string[]) {
		// Delete needs explicit confirmation via dialog
		if (action === 'delete') {
			pendingDeleteIds = ids;
			confirmDeleteOpen = true;
			return;
		}

		await runBulkAction(action, ids);
	}

	async function runBulkAction(action: string, ids: string[]) {
		const response = await fetch('/api/admin/bulk-actions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action, ids, resourceType: 'memorial' })
		});

		if (response.ok) {
			const result = await response.json();
			const successCount = result.success?.length || 0;
			const failedCount = result.failed?.length || 0;

			if (failedCount > 0) {
				adminToast.info(`${successCount} succeeded, ${failedCount} failed`);
			} else {
				adminToast.success(`${successCount} ${successCount === 1 ? 'item' : 'items'} updated`);
			}

			location.reload();
		} else {
			adminToast.error('Action failed. Please try again.');
		}
	}

	async function confirmBulkDelete() {
		const ids = pendingDeleteIds;
		confirmDeleteOpen = false;
		pendingDeleteIds = [];
		await runBulkAction('delete', ids);
	}

	function handleRowClick(memorial: any) {
		goto(`/admin/services/memorials/${memorial.id}`);
	}
</script>

<AdminLayout
	title="Memorials"
	subtitle="Manage all memorial pages and services"
	actions={[
		{
			label: 'Filters',
			icon: 'filter',
			onclick: () => (showFilters = !showFilters)
		},
		...$can('memorial', 'create')
			? [
					{
						label: 'Create Memorial',
						icon: 'add',
						variant: 'primary',
						onclick: () => goto('/admin/services/memorials/create')
					}
				]
			: []
	]}
>
	<!-- Search Bar -->
	<form class="mb-4 flex items-center gap-2" method="GET">
		<input
			type="text"
			name="q"
			placeholder="Search by name, slug, owner, location..."
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

	<!-- Bulk Actions Bar -->
	{#if selectedMemorials.size > 0}
		<BulkActionBar
			selectedCount={selectedMemorials.size}
			resourceType="memorial"
			onAction={(action) => handleBulkAction(action, Array.from(selectedMemorials))}
			onClear={() => {
				selectedMemorials.clear();
				selectedMemorials = selectedMemorials;
			}}
		/>
	{/if}

	{#if showFilters}
		<div class="mb-6 rounded-lg border border-slate-200 bg-white p-6">
			<FilterBuilder
				fields={[
					{ id: 'lovedOneName', label: 'Name', type: 'string' },
					{ id: 'creatorEmail', label: 'Owner Email', type: 'string' },
					{ id: 'isPaid', label: 'Payment Status', type: 'boolean' },
					{ id: 'isPublic', label: 'Visibility', type: 'boolean' },
					{ id: 'createdAt', label: 'Created Date', type: 'date' }
				]}
				onFilterChange={(filters) => {
					activeFilters = filters;
				}}
			/>
		</div>
	{/if}

	<DataGrid
		{columns}
		data={filteredMemorials}
		selectable={$can('memorial', 'update')}
		bind:selectedMemorials={selectedMemorials}
		onRowClick={handleRowClick}
		resourceType="memorial"
	/>
</AdminLayout>

<ConfirmDialog
	bind:open={confirmDeleteOpen}
	title="Delete memorials?"
	message={`This will mark ${pendingDeleteIds.length} ${pendingDeleteIds.length === 1 ? 'memorial' : 'memorials'} as deleted and hide them from the admin list.`}
	confirmLabel="Delete"
	variant="danger"
	onConfirm={confirmBulkDelete}
	onCancel={() => {
		confirmDeleteOpen = false;
		pendingDeleteIds = [];
	}}
/>

