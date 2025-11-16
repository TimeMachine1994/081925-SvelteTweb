<!--
SCHEDULE EDIT REQUESTS ADMIN PAGE

Review and approve memorial schedule change requests
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import { can } from '$lib/stores/adminUser';
	import { goto } from '$app/navigation';

	let { data } = $props();

	// State
	let selectedRequests = $state<Set<string>>(new Set());

	// Column configuration
	const columns = [
		{
			id: 'memorialName',
			label: 'Memorial',
			field: 'memorialName',
			width: 200,
			sortable: true
		},
		{
			id: 'requestedBy',
			label: 'Requested By',
			field: 'requestedByEmail',
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
					pending: '🕒 Pending',
					approved: '✅ Approved',
					denied: '❌ Denied',
					completed: '✔️ Completed'
				};
				return statusMap[val] || val;
			},
			sortable: true
		},
		{
			id: 'createdAt',
			label: 'Requested',
			field: 'createdAt',
			width: 150,
			sortable: true,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				return date.toLocaleString();
			}
		},
		{
			id: 'reviewedBy',
			label: 'Reviewed By',
			field: 'reviewedByEmail',
			width: 180,
			formatter: (val: string) => val || '-'
		},
		{
			id: 'reviewedAt',
			label: 'Reviewed',
			field: 'reviewedAt',
			width: 150,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				return date.toLocaleString();
			}
		}
	];

	function handleRowClick(request: any) {
		goto(`/admin/services/schedule-requests/${request.id}`);
	}

	async function handleBulkAction(action: string, ids: string[]) {
		console.log('Bulk action on schedule requests:', action, ids);
	}
</script>

<AdminLayout
	title="Schedule Edit Requests"
	subtitle="Review and approve memorial schedule changes"
	actions={[
		{
			label: 'Pending Only',
			icon: '🕒',
			variant: 'primary',
			onclick: () => goto('/admin/services/schedule-requests?status=pending')
		}
	]}
>
	<div class="stats-bar">
		<div class="stat">
			<span class="stat-label">Pending</span>
			<span class="stat-value pending">{data.stats.pending}</span>
		</div>
		<div class="stat">
			<span class="stat-label">Approved</span>
			<span class="stat-value approved">{data.stats.approved}</span>
		</div>
		<div class="stat">
			<span class="stat-label">Denied</span>
			<span class="stat-value denied">{data.stats.denied}</span>
		</div>
		<div class="stat">
			<span class="stat-label">Total</span>
			<span class="stat-value">{data.requests.length}</span>
		</div>
	</div>

	<DataGrid
		{columns}
		data={data.requests}
		selectable={false}
		onRowClick={handleRowClick}
		resourceType="schedule_request"
	/>
</AdminLayout>

<style>
	.stats-bar {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1.5rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		text-align: center;
	}

	.stat-label {
		font-size: 0.8125rem;
		color: #718096;
		font-weight: 500;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: #2d3748;
	}

	.stat-value.pending {
		color: #d69e2e;
	}

	.stat-value.approved {
		color: #38a169;
	}

	.stat-value.denied {
		color: #e53e3e;
	}
</style>
