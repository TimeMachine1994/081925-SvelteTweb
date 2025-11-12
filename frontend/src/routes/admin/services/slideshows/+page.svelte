<!--
SLIDESHOWS ADMIN PAGE

Manage memorial slideshows across all memorials
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import FilterBuilder from '$lib/components/admin/FilterBuilder.svelte';
	import { can } from '$lib/stores/adminUser';
	import { goto } from '$app/navigation';

	let { data } = $props();

	// State
	let selectedSlideshows = $state<Set<string>>(new Set());
	let showFilters = $state(false);

	// Column configuration
	const columns = [
		{
			id: 'title',
			label: 'Title',
			field: 'title',
			width: 250,
			sortable: true
		},
		{
			id: 'memorialName',
			label: 'Memorial',
			field: 'memorialName',
			width: 200,
			sortable: true
		},
		{
			id: 'photoCount',
			label: 'Photos',
			field: 'photoCount',
			width: 100,
			align: 'center' as const,
			sortable: true
		},
		{
			id: 'status',
			label: 'Status',
			field: 'status',
			width: 120,
			formatter: (val: string) => {
				const statusMap: Record<string, string> = {
					draft: '📝 Draft',
					generating: '⏳ Generating',
					ready: '✅ Ready',
					failed: '❌ Failed'
				};
				return statusMap[val] || val;
			},
			sortable: true
		},
		{
			id: 'duration',
			label: 'Duration',
			field: 'duration',
			width: 100,
			formatter: (val: number) => {
				if (!val) return '-';
				return `${val}s`;
			}
		},
		{
			id: 'createdBy',
			label: 'Created By',
			field: 'createdByEmail',
			width: 200
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
		}
	];

	// Actions
	async function handleBulkAction(action: string, ids: string[]) {
		console.log('Bulk action on slideshows:', action, ids);
	}

	function handleRowClick(slideshow: any) {
		// Navigate to memorial page with slideshow
		goto(`/${slideshow.memorialSlug}#slideshow-${slideshow.id}`);
	}
</script>

<AdminLayout
	title="Slideshows"
	subtitle="Manage photo slideshows across all memorials"
	actions={[
		{
			label: 'Filters',
			icon: '🔍',
			onclick: () => (showFilters = !showFilters)
		}
	]}
>
	{#if showFilters}
		<div class="filters-panel">
			<FilterBuilder
				fields={[
					{ id: 'title', label: 'Title', type: 'string' },
					{ id: 'memorialName', label: 'Memorial', type: 'string' },
					{
						id: 'status',
						label: 'Status',
						type: 'enum',
						options: [
							{ value: 'draft', label: 'Draft' },
							{ value: 'generating', label: 'Generating' },
							{ value: 'ready', label: 'Ready' },
							{ value: 'failed', label: 'Failed' }
						]
					},
					{ id: 'createdAt', label: 'Created Date', type: 'date' }
				]}
				onFilterChange={(filters) => console.log('Filters:', filters)}
			/>
		</div>
	{/if}

	<DataGrid
		{columns}
		data={data.slideshows}
		selectable={false}
		onRowClick={handleRowClick}
		resourceType="slideshow"
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
