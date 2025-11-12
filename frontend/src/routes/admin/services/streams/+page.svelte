<!--
STREAMS ADMIN PAGE

Manage all livestreams across memorials
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import FilterBuilder from '$lib/components/admin/FilterBuilder.svelte';
	import { can } from '$lib/stores/adminUser';
	import { goto } from '$app/navigation';

	let { data } = $props();

	// State
	let selectedStreams = $state<Set<string>>(new Set());
	let showFilters = $state(false);

	// Column configuration
	const columns = [
		{
			id: 'title',
			label: 'Stream Title',
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
			id: 'status',
			label: 'Status',
			field: 'status',
			width: 120,
			formatter: (val: string) => {
				const statusMap: Record<string, string> = {
					live: '🔴 Live',
					scheduled: '🕒 Scheduled',
					ended: '✅ Ended',
					idle: '⚪ Idle'
				};
				return statusMap[val] || val;
			}
		},
		{
			id: 'isVisible',
			label: 'Visibility',
			field: 'isVisible',
			width: 100,
			formatter: (val: boolean) => (val ? '👁️ Visible' : '🚫 Hidden')
		},
		{
			id: 'scheduledTime',
			label: 'Scheduled',
			field: 'scheduledStartTime',
			width: 150,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				return date.toLocaleString();
			}
		},
		{
			id: 'duration',
			label: 'Duration',
			field: 'duration',
			width: 100,
			formatter: (val: number) => {
				if (!val) return '-';
				const hours = Math.floor(val / 3600);
				const minutes = Math.floor((val % 3600) / 60);
				return `${hours}h ${minutes}m`;
			}
		},
		{
			id: 'recordingStatus',
			label: 'Recording',
			field: 'recordingStatus',
			width: 120,
			formatter: (val: string) => {
				const statusMap: Record<string, string> = {
					ready: '✅ Ready',
					processing: '⏳ Processing',
					failed: '❌ Failed',
					none: '-'
				};
				return statusMap[val] || val;
			}
		}
	];

	// Actions
	async function handleBulkAction(action: string, ids: string[]) {
		const response = await fetch('/api/admin/bulk-actions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action, ids, resourceType: 'stream' })
		});

		if (response.ok) {
			location.reload();
		}
	}

	function handleRowClick(stream: any) {
		goto(`/admin/services/streams/${stream.id}`);
	}
</script>

<AdminLayout
	title="Livestreams"
	subtitle="Manage all memorial livestreams and recordings"
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
					{ id: 'status', label: 'Status', type: 'enum', options: [
						{ value: 'live', label: 'Live' },
						{ value: 'scheduled', label: 'Scheduled' },
						{ value: 'ended', label: 'Ended' },
						{ value: 'idle', label: 'Idle' }
					]},
					{ id: 'isVisible', label: 'Visibility', type: 'boolean' },
					{ id: 'scheduledStartTime', label: 'Scheduled Date', type: 'date' }
				]}
				onFilterChange={(filters) => console.log('Filters:', filters)}
			/>
		</div>
	{/if}

	<DataGrid
		{columns}
		data={data.streams}
		selectable={$can('stream', 'update')}
		selectedMemorials={selectedStreams}
		onRowClick={handleRowClick}
		onBulkAction={handleBulkAction}
		resourceType="stream"
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
