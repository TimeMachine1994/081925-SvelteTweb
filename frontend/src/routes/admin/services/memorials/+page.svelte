<!--
MEMORIALS ADMIN PAGE

High-density data grid for memorial management
Implements ADMIN_REFACTOR_2_DATA_OPERATIONS.md features
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import FilterBuilder from '$lib/components/admin/FilterBuilder.svelte';
	import { can } from '$lib/stores/adminUser';
	import { goto } from '$app/navigation';

	let { data } = $props();

	// State
	let selectedMemorials = $state<Set<string>>(new Set());
	let showFilters = $state(false);

	// Column configuration
	const columns = [
		{
			id: 'lovedOneName',
			label: 'Name',
			field: 'lovedOneName',
			width: 200,
			sortable: true,
			pinnable: true
		},
		{
			id: 'ownerEmail',
			label: 'Owner',
			field: 'creatorEmail',
			width: 200,
			sortable: true
		},
		{
			id: 'isPaid',
			label: 'Payment',
			field: 'isPaid',
			width: 120,
			formatter: (val: boolean) => (val ? '✅ Paid' : '❌ Unpaid'),
			sortable: true
		},
		{
			id: 'isPublic',
			label: 'Visibility',
			field: 'isPublic',
			width: 100,
			formatter: (val: boolean) => (val ? '🌐 Public' : '🔒 Private')
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
				return date.toLocaleDateString();
			}
		}
	];

	// Actions
	async function handleBulkAction(action: string, ids: string[]) {
		console.log('Bulk action:', action, ids);
		
		// Confirm delete action
		if (action === 'delete') {
			const count = ids.length;
			const memorial = count === 1 ? 'memorial' : 'memorials';
			const confirmMessage = `Are you sure you want to delete ${count} ${memorial}?\n\nThis will mark them as deleted and they will be hidden from the admin list.`;
			
			if (!confirm(confirmMessage)) {
				return;
			}
		}
		
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
				alert(`Action completed with errors:\n✅ ${successCount} succeeded\n❌ ${failedCount} failed`);
			}
			
			// Reload data
			location.reload();
		} else {
			alert('Action failed. Please try again.');
		}
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
			icon: '🔍',
			onclick: () => (showFilters = !showFilters)
		},
		...$can('memorial', 'create')
			? [
					{
						label: 'Create Memorial',
						icon: '➕',
						variant: 'primary',
						onclick: () => goto('/admin/services/memorials/create')
					}
				]
			: []
	]}
>
	{#if showFilters}
		<div class="filters-panel">
			<FilterBuilder
				fields={[
					{ id: 'lovedOneName', label: 'Name', type: 'string' },
					{ id: 'creatorEmail', label: 'Owner Email', type: 'string' },
					{ id: 'isPaid', label: 'Payment Status', type: 'boolean' },
					{ id: 'isPublic', label: 'Visibility', type: 'boolean' },
					{ id: 'createdAt', label: 'Created Date', type: 'date' }
				]}
				onFilterChange={(filters) => console.log('Filters:', filters)}
			/>
		</div>
	{/if}

	<DataGrid
		{columns}
		data={data.memorials}
		selectable={$can('memorial', 'update')}
		selectedMemorials={selectedMemorials}
		onBulkAction={handleBulkAction}
		onRowClick={handleRowClick}
		resourceType="memorial"
	/>
</AdminLayout>

<style>
	.filters-panel {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}
</style>
