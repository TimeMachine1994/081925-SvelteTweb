<!--
ADMIN USERS PAGE

Manage admin user accounts and roles
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import FilterBuilder from '$lib/components/admin/FilterBuilder.svelte';
	import { can } from '$lib/stores/adminUser';
	import { goto } from '$app/navigation';

	let { data } = $props();

	// State
	let selectedAdmins = $state<Set<string>>(new Set());
	let showFilters = $state(false);

	// Column configuration
	const columns = [
		{
			id: 'displayName',
			label: 'Name',
			field: 'displayName',
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
			id: 'adminRole',
			label: 'Admin Role',
			field: 'adminRole',
			width: 180,
			formatter: (val: string) => {
				const roleMap: Record<string, string> = {
					super_admin: '👑 Super Admin',
					content_admin: '📝 Content Admin',
					financial_admin: '💰 Financial Admin',
					customer_support: '🎧 Support',
					readonly_admin: '👁️ Read-Only'
				};
				return roleMap[val] || val;
			},
			sortable: true
		},
		{
			id: 'status',
			label: 'Status',
			field: 'suspended',
			width: 100,
			formatter: (val: boolean) => (val ? '🚫 Suspended' : '✅ Active'),
			sortable: true
		},
		{
			id: 'createdAt',
			label: 'Added',
			field: 'createdAt',
			width: 120,
			sortable: true,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				return date.toLocaleDateString();
			}
		},
		{
			id: 'lastLoginAt',
			label: 'Last Login',
			field: 'lastLoginAt',
			width: 120,
			formatter: (val: string) => {
				if (!val) return 'Never';
				const date = new Date(val);
				return date.toLocaleDateString();
			}
		}
	];

	// Actions
	async function handleBulkAction(action: string, ids: string[]) {
		console.log('Bulk action on admins:', action, ids);
	}

	function handleRowClick(admin: any) {
		goto(`/admin/users/admin-users/${admin.id}`);
	}
</script>

<AdminLayout
	title="Admin Users"
	subtitle="Manage administrator accounts and permissions"
	actions={[
		{
			label: 'Filters',
			icon: '🔍',
			onclick: () => (showFilters = !showFilters)
		},
		...$can('admin_user', 'create')
			? [
					{
						label: 'Add Admin',
						icon: '➕',
						variant: 'primary',
						onclick: () => goto('/admin/users/admin-users/create')
					}
				]
			: []
	]}
>
	{#if showFilters}
		<div class="filters-panel">
			<FilterBuilder
				fields={[
					{ id: 'displayName', label: 'Name', type: 'string' },
					{ id: 'email', label: 'Email', type: 'string' },
					{
						id: 'adminRole',
						label: 'Admin Role',
						type: 'enum',
						options: [
							{ value: 'super_admin', label: 'Super Admin' },
							{ value: 'content_admin', label: 'Content Admin' },
							{ value: 'financial_admin', label: 'Financial Admin' },
							{ value: 'customer_support', label: 'Customer Support' },
							{ value: 'readonly_admin', label: 'Read-Only' }
						]
					},
					{ id: 'suspended', label: 'Suspended', type: 'boolean' }
				]}
				onFilterChange={(filters) => console.log('Filters:', filters)}
			/>
		</div>
	{/if}

	<div class="role-info">
		<div class="info-banner">
			<span class="info-icon">ℹ️</span>
			<div class="info-content">
				<p><strong>Admin Role Levels:</strong></p>
				<ul>
					<li><strong>Super Admin:</strong> Full system access</li>
					<li><strong>Content Admin:</strong> Content and user management</li>
					<li><strong>Financial Admin:</strong> Payment and financial operations</li>
					<li><strong>Customer Support:</strong> Limited editing and support tasks</li>
					<li><strong>Read-Only:</strong> View-only access for reporting</li>
				</ul>
			</div>
		</div>
	</div>

	<DataGrid
		{columns}
		data={data.admins}
		selectable={$can('admin_user', 'update')}
		selectedMemorials={selectedAdmins}
		onBulkAction={handleBulkAction}
		resourceType="admin_user"
	/>
	<!-- onRowClick disabled until detail pages are created -->
</AdminLayout>

<style>
	.filters-panel {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.role-info {
		margin-bottom: 1.5rem;
	}

	.info-banner {
		background: #fef5e7;
		border: 1px solid #f9e79f;
		border-radius: 0.5rem;
		padding: 1rem 1.5rem;
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}

	.info-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.info-content {
		flex: 1;
	}

	.info-content p {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		color: #7d6608;
	}

	.info-content ul {
		margin: 0;
		padding-left: 1.5rem;
		font-size: 0.8125rem;
		color: #7d6608;
	}

	.info-content li {
		margin: 0.25rem 0;
	}
</style>
