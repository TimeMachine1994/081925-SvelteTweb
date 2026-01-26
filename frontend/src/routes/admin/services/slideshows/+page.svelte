<!--
SLIDESHOWS ADMIN PAGE

Manage memorial slideshows across all memorials
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import BulkActionBar from '$lib/components/admin/BulkActionBar.svelte';
	import FilterBuilder from '$lib/components/admin/FilterBuilder.svelte';
	import { can } from '$lib/stores/adminUser';
	import { applyFilters, type FilterRule } from '$lib/utils/filter-utils';
	import { goto } from '$app/navigation';

	let { data } = $props();

	// State
	let selectedSlideshows = $state<Set<string>>(new Set());
	let showFilters = $state(false);
	let search = $state<string>(data.searchQuery || '');
	let activeFilters = $state<FilterRule[]>([]);

	// Derived filtered data
	let filteredSlideshows = $derived.by(() => {
		return applyFilters(data.slideshows, activeFilters);
	});

	// Column configuration
	const columns = [
		{
			id: 'memorialName',
			label: 'Memorial',
			field: 'memorialName',
			width: 250,
			sortable: true
		},
		{
			id: 'photoCount',
			label: 'Photos',
			field: 'photoCount',
			width: 100,
			align: 'center' as const,
			sortable: true,
			formatter: (val: number) => {
				return val === 1 ? '1 photo' : `${val} photos`;
			}
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
					processing: '⏳ Processing',
					ready: '✅ Ready',
					failed: '❌ Failed',
					unpublished: '🔒 Unpublished'
				};
				return statusMap[val] || val;
			},
			sortable: true
		},
		{
			id: 'duration',
			label: 'Duration',
			field: 'duration',
			width: 120,
			formatter: (val: number) => {
				return 'Connected';
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
		
		// Confirm delete action
		if (action === 'delete') {
			const count = ids.length;
			const slideshow = count === 1 ? 'slideshow' : 'slideshows';
			const confirmMessage = `Are you sure you want to delete ${count} ${slideshow}?\n\nThis will mark them as deleted.`;
			
			if (!confirm(confirmMessage)) {
				return;
			}
		}
		
		const response = await fetch('/api/admin/bulk-actions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action, ids, resourceType: 'slideshow' })
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
	<!-- Search Bar -->
	<form class="search-bar" method="GET">
		<input
			type="text"
			name="q"
			placeholder="Search by memorial, creator, status..."
			value={search}
			oninput={(event) => {
				const target = event.currentTarget as HTMLInputElement;
				search = target.value;
			}}
		/>
		<button type="submit">Search</button>
	</form>

	<!-- Bulk Actions Bar -->
	{#if selectedSlideshows.size > 0}
		<BulkActionBar
			selectedCount={selectedSlideshows.size}
			resourceType="slideshow"
			onAction={(action) => handleBulkAction(action, Array.from(selectedSlideshows))}
			onClear={() => {
				selectedSlideshows.clear();
				selectedSlideshows = selectedSlideshows;
			}}
		/>
	{/if}

	{#if showFilters}
		<div class="filters-panel">
			<FilterBuilder
				fields={[
					{ id: 'memorialName', label: 'Memorial', type: 'string' },
					{
						id: 'status',
						label: 'Status',
						type: 'enum',
						options: [
							{ value: 'draft', label: 'Draft' },
							{ value: 'generating', label: 'Generating' },
							{ value: 'processing', label: 'Processing' },
							{ value: 'ready', label: 'Ready' },
							{ value: 'failed', label: 'Failed' },
							{ value: 'unpublished', label: 'Unpublished' }
						]
					},
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
		data={filteredSlideshows}
		selectable={$can('memorial', 'update')}
		bind:selectedMemorials={selectedSlideshows}
		resourceType="slideshow"
	/><!-- onRowClick disabled - clicking will be re-enabled when detail pages exist -->
</AdminLayout>

<style>
	.search-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.search-bar input[type='text'] {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		border: 1px solid #e2e8f0;
		font-size: 0.9375rem;
	}

	.search-bar button[type='submit'] {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		border: 1px solid #cbd5e0;
		background: #edf2f7;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: background 0.15s ease, border-color 0.15s ease;
	}

	.search-bar button[type='submit']:hover {
		background: #e2e8f0;
		border-color: #a0aec0;
	}

	.filters-panel {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}
</style>
