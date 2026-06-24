<!--
FUNERAL DIRECTORS ADMIN PAGE

Manage funeral home partners
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import FilterBuilder from '$lib/components/admin/FilterBuilder.svelte';
	import { can } from '$lib/stores/adminUser';
	import { goto } from '$app/navigation';
	import { applyFilters, type FilterRule } from '$lib/utils/filter-utils';

	let { data } = $props();

	// State
	let selectedDirectors = $state<Set<string>>(new Set());
	let showFilters = $state(false);
	let activeFilters = $state<FilterRule[]>([]);

	// Derived filtered data
	let filteredDirectors = $derived.by(() => {
		return applyFilters(data.funeralDirectors, activeFilters);
	});

	// Column configuration
	const columns = [
		{
			id: 'companyName',
			label: 'Funeral Home',
			field: 'companyName',
			width: 250,
			sortable: true
		},
		{
			id: 'contactPerson',
			label: 'Contact',
			field: 'contactPerson',
			width: 200,
			sortable: true
		},
		{
			id: 'email',
			label: 'Email',
			field: 'email',
			width: 250,
			sortable: true
		},
		{
			id: 'phone',
			label: 'Phone',
			field: 'phone',
			width: 150
		},
		{
			id: 'status',
			label: 'Status',
			field: 'status',
			width: 120,
			formatter: (val: string) => {
				const statusMap: Record<string, string> = {
					approved: 'Active',
					suspended: 'Suspended',
					inactive: 'Inactive'
				};
				return statusMap[val] || 'Active';
			},
			sortable: true
		},
		{
			id: 'memorialsCreated',
			label: 'Memorials',
			field: 'memorialsCreated',
			width: 100,
			align: 'center' as const,
			sortable: true
		},
		{
			id: 'createdAt',
			label: 'Registered',
			field: 'createdAt',
			width: 120,
			sortable: true,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				return date.toLocaleDateString();
			}
		}
	];

	function handleRowClick(director: any) {
		goto(`/admin/users/funeral-directors/${director.id}`);
	}
</script>

<AdminLayout
	title="Funeral Directors"
	subtitle="Manage funeral home partners and their accounts"
	actions={[
		{
			label: 'Filters',
			icon: 'filter',
			onclick: () => (showFilters = !showFilters)
		}
	]}
>
	{#if showFilters}
		<div class="mb-6 rounded-lg border border-slate-200 bg-white p-6">
			<FilterBuilder
				fields={[
					{ id: 'companyName', label: 'Funeral Home', type: 'string' },
					{ id: 'contactPerson', label: 'Contact Name', type: 'string' },
					{ id: 'email', label: 'Email', type: 'string' },
					{
						id: 'status',
						label: 'Status',
						type: 'enum',
						options: [
							{ value: 'approved', label: 'Active' },
							{ value: 'suspended', label: 'Suspended' },
							{ value: 'inactive', label: 'Inactive' }
						]
					},
					{ id: 'createdAt', label: 'Registration Date', type: 'date' }
				]}
				onFilterChange={(filters) => {
					activeFilters = filters;
				}}
			/>
		</div>
	{/if}

	<DataGrid
		{columns}
		data={filteredDirectors}
		selectable={$can('funeral_director', 'update')}
		bind:selectedMemorials={selectedDirectors}
		onRowClick={handleRowClick}
		resourceType="funeral_director"
	/>
	<!-- onRowClick disabled until detail pages are created -->
</AdminLayout>
