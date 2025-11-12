<!--
DEMO SESSIONS ADMIN PAGE

Manage and monitor demo mode sessions
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import FilterBuilder from '$lib/components/admin/FilterBuilder.svelte';
	import { can } from '$lib/stores/adminUser';

	let { data } = $props();

	// State
	let selectedSessions = $state<Set<string>>(new Set());
	let showFilters = $state(false);

	// Column configuration
	const columns = [
		{
			id: 'id',
			label: 'Session ID',
			field: 'id',
			width: 150,
			formatter: (val: string) => val.substring(0, 12) + '...'
		},
		{
			id: 'status',
			label: 'Status',
			field: 'status',
			width: 120,
			formatter: (val: string) => {
				const statusMap: Record<string, string> = {
					active: '✅ Active',
					expired: '⏰ Expired',
					terminated: '🛑 Terminated'
				};
				return statusMap[val] || val;
			},
			sortable: true
		},
		{
			id: 'currentRole',
			label: 'Current Role',
			field: 'currentRole',
			width: 150,
			formatter: (val: string) => {
				const roleMap: Record<string, string> = {
					admin: '👑 Admin',
					funeral_director: '🏥 Funeral Director',
					owner: '💝 Owner',
					viewer: '👁️ Viewer'
				};
				return roleMap[val] || val;
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
			label: 'Started',
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
			id: 'expiresAt',
			label: 'Expires',
			field: 'expiresAt',
			width: 150,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				const now = new Date();
				const diff = date.getTime() - now.getTime();
				const hours = Math.floor(diff / (1000 * 60 * 60));
				const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
				if (diff < 0) return 'Expired';
				return `${hours}h ${minutes}m`;
			}
		},
		{
			id: 'lastActivity',
			label: 'Last Activity',
			field: 'lastRoleSwitch',
			width: 150,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				const now = new Date();
				const diff = now.getTime() - date.getTime();
				const minutes = Math.floor(diff / (1000 * 60));
				if (minutes < 1) return 'Just now';
				if (minutes < 60) return `${minutes}m ago`;
				const hours = Math.floor(minutes / 60);
				return `${hours}h ago`;
			}
		}
	];

	// Actions
	async function handleBulkAction(action: string, ids: string[]) {
		if (action === 'terminate') {
			if (confirm(`Terminate ${ids.length} demo session(s)?`)) {
				console.log('Terminating sessions:', ids);
			}
		}
	}

	function handleRowClick(session: any) {
		console.log('Session details:', session);
	}
</script>

<AdminLayout
	title="Demo Sessions"
	subtitle="Monitor active demo mode sessions"
	actions={[
		{
			label: 'Filters',
			icon: '🔍',
			onclick: () => (showFilters = !showFilters)
		},
		{
			label: 'Cleanup Expired',
			icon: '🧹',
			onclick: () => console.log('Cleanup expired sessions')
		}
	]}
>
	{#if showFilters}
		<div class="filters-panel">
			<FilterBuilder
				fields={[
					{
						id: 'status',
						label: 'Status',
						type: 'enum',
						options: [
							{ value: 'active', label: 'Active' },
							{ value: 'expired', label: 'Expired' },
							{ value: 'terminated', label: 'Terminated' }
						]
					},
					{
						id: 'currentRole',
						label: 'Current Role',
						type: 'enum',
						options: [
							{ value: 'admin', label: 'Admin' },
							{ value: 'funeral_director', label: 'Funeral Director' },
							{ value: 'owner', label: 'Owner' },
							{ value: 'viewer', label: 'Viewer' }
						]
					},
					{ id: 'createdAt', label: 'Start Date', type: 'date' }
				]}
				onFilterChange={(filters) => console.log('Filters:', filters)}
			/>
		</div>
	{/if}

	<div class="stats-bar">
		<div class="stat">
			<span class="stat-label">Active</span>
			<span class="stat-value active">{data.stats.active}</span>
		</div>
		<div class="stat">
			<span class="stat-label">Expired</span>
			<span class="stat-value expired">{data.stats.expired}</span>
		</div>
		<div class="stat">
			<span class="stat-label">Total Sessions</span>
			<span class="stat-value">{data.sessions.length}</span>
		</div>
	</div>

	<div class="info-banner">
		<span class="info-icon">ℹ️</span>
		<p>
			Demo sessions automatically expire after 2 hours. All demo data (memorials, streams,
			users) is deleted when a session expires.
		</p>
	</div>

	<DataGrid
		{columns}
		data={data.sessions}
		selectable={$can('demo_session', 'delete')}
		selectedMemorials={selectedSessions}
		onBulkAction={handleBulkAction}
		resourceType="demo_session"
	/>
	<!-- onRowClick disabled - will show modal with session details when implemented -->
</AdminLayout>

<style>
	.filters-panel {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

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

	.stat-value.active {
		color: #38a169;
	}

	.stat-value.expired {
		color: #e53e3e;
	}

	.info-banner {
		background: #ebf8ff;
		border: 1px solid #90cdf4;
		border-radius: 0.5rem;
		padding: 1rem 1.5rem;
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.info-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.info-banner p {
		margin: 0;
		font-size: 0.875rem;
		color: #2c5282;
		line-height: 1.5;
	}
</style>
