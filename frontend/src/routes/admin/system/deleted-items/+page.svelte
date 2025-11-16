<!--
DELETED ITEMS PAGE

Recovery system for soft-deleted items
30-day retention before permanent deletion
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import FilterBuilder from '$lib/components/admin/FilterBuilder.svelte';
	import RestoreConfirmationModal from '$lib/components/admin/RestoreConfirmationModal.svelte';
	import PermanentDeleteModal from '$lib/components/admin/PermanentDeleteModal.svelte';
	import { can } from '$lib/stores/adminUser';

	let { data } = $props();

	// State
	let selectedItems = $state<Set<string>>(new Set());
	let showFilters = $state(false);
	let showRestoreModal = $state(false);
	let showPermanentDeleteModal = $state(false);
	let isProcessing = $state(false);
	let processingMessage = $state('');

	// Column configuration
	const columns = [
		{
			id: 'resourceType',
			label: 'Type',
			field: 'resourceType',
			width: 120,
			formatter: (val: string) => {
				const typeMap: Record<string, string> = {
					memorial: '💝 Memorial',
					stream: '📹 Stream',
					user: '👤 User',
					slideshow: '🎬 Slideshow',
					blog_post: '📝 Blog Post'
				};
				return typeMap[val] || val;
			},
			sortable: true
		},
		{
			id: 'name',
			label: 'Name',
			field: 'name',
			width: 300,
			sortable: true
		},
		{
			id: 'deletedBy',
			label: 'Deleted By',
			field: 'deletedByEmail',
			width: 200
		},
		{
			id: 'deletedAt',
			label: 'Deleted',
			field: 'deletedAt',
			width: 150,
			sortable: true,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				return date.toLocaleDateString();
			}
		},
		{
			id: 'daysUntilPermanent',
			label: 'Days Until Permanent',
			field: 'daysUntilPermanent',
			width: 180,
			align: 'center' as const,
			formatter: (val: number) => {
				if (val < 0) return '❌ Expired';
				if (val <= 7) return `⚠️ ${val} days`;
				return `${val} days`;
			},
			sortable: true
		}
	];

	// Get selected items with details for modal display
	let selectedItemsDetails = $derived(
		data.items.filter(item => selectedItems.has(item.id)).map(item => ({
			id: `${item.collectionName}:${item.id}`,
			name: item.name,
			resourceType: item.resourceType
		}))
	);

	// Actions
	async function handleBulkAction(action: string, ids: string[]) {
		if (action === 'restore') {
			showRestoreModal = true;
		} else if (action === 'permanent_delete') {
			showPermanentDeleteModal = true;
		}
	}

	async function confirmRestore() {
		showRestoreModal = false;
		isProcessing = true;
		processingMessage = `Restoring ${selectedItemsDetails.length} item(s)...`;

		try {
			const response = await fetch('/api/admin/restore-deleted', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids: selectedItemsDetails.map(i => i.id) })
			});

			const result = await response.json();

			if (response.ok) {
				if (result.failed.length > 0) {
					alert(`Restored ${result.success.length} items, but ${result.failed.length} failed. Check console for details.`);
					console.error('Failed restorations:', result.failed);
				}
				location.reload();
			} else {
				alert(`Failed to restore items: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error restoring items:', error);
			alert('An error occurred while restoring items.');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
	}

	async function confirmPermanentDelete() {
		showPermanentDeleteModal = false;
		isProcessing = true;
		processingMessage = `Permanently deleting ${selectedItemsDetails.length} item(s)...`;

		try {
			const response = await fetch('/api/admin/permanent-delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids: selectedItemsDetails.map(i => i.id) })
			});

			const result = await response.json();

			if (response.ok) {
				if (result.failed.length > 0) {
					alert(`Deleted ${result.success.length} items, but ${result.failed.length} failed. Check console for details.`);
					console.error('Failed deletions:', result.failed);
				}
				location.reload();
			} else {
				alert(`Failed to delete items: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error deleting items:', error);
			alert('An error occurred while deleting items.');
		} finally {
			isProcessing = false;
			processingMessage = '';
		}
	}

	function handleRowClick(item: any) {
		console.log('Deleted item details:', item);
	}
</script>

<AdminLayout
	title="Deleted Items"
	subtitle="Recover or permanently delete soft-deleted items"
	actions={[
		{
			label: 'Filters',
			icon: '🔍',
			onclick: () => (showFilters = !showFilters)
		},
		{
			label: 'Cleanup Expired',
			icon: '🧹',
			onclick: () => console.log('Cleanup items past 30 days')
		}
	]}
>
	{#if showFilters}
		<div class="filters-panel">
			<FilterBuilder
				fields={[
					{
						id: 'resourceType',
						label: 'Type',
						type: 'enum',
						options: [
							{ value: 'memorial', label: 'Memorial' },
							{ value: 'stream', label: 'Stream' },
							{ value: 'user', label: 'User' },
							{ value: 'slideshow', label: 'Slideshow' },
							{ value: 'blog_post', label: 'Blog Post' }
						]
					},
					{ id: 'name', label: 'Name', type: 'string' },
					{ id: 'deletedByEmail', label: 'Deleted By', type: 'string' },
					{ id: 'deletedAt', label: 'Deleted Date', type: 'date' }
				]}
				onFilterChange={(filters) => console.log('Filters:', filters)}
			/>
		</div>
	{/if}

	<div class="warning-banner">
		<span class="warning-icon">⚠️</span>
		<div class="warning-content">
			<p><strong>Soft Delete Retention Policy:</strong></p>
			<ul>
				<li>Items are kept for <strong>30 days</strong> after deletion</li>
				<li>Items can be <strong>restored</strong> during this period</li>
				<li>After 30 days, items are <strong>permanently deleted</strong> automatically</li>
				<li>Permanent deletion <strong>cannot be undone</strong></li>
			</ul>
		</div>
	</div>

	<div class="stats-bar">
		<div class="stat">
			<span class="stat-label">Total Deleted</span>
			<span class="stat-value">{data.items.length}</span>
		</div>
		<div class="stat">
			<span class="stat-label">Expiring Soon</span>
			<span class="stat-value warning">{data.stats.expiringSoon}</span>
		</div>
		<div class="stat">
			<span class="stat-label">Memorials</span>
			<span class="stat-value">{data.stats.memorials}</span>
		</div>
		<div class="stat">
			<span class="stat-label">Streams</span>
			<span class="stat-value">{data.stats.streams}</span>
		</div>
	</div>

	<DataGrid
		{columns}
		data={data.items}
		selectable={$can('deleted_item', 'update')}
		selectedMemorials={selectedItems}
		onBulkAction={handleBulkAction}
		resourceType="deleted_item"
	/>
	<!-- onRowClick disabled - will show modal with full item details when implemented -->

	{#if selectedItems.size > 0}
		<div class="action-buttons">
			<button class="restore-btn" onclick={() => handleBulkAction('restore', Array.from(selectedItems))}>
				🔄 Restore Selected ({selectedItems.size})
			</button>
			<button
				class="permanent-delete-btn"
				onclick={() => handleBulkAction('permanent_delete', Array.from(selectedItems))}
			>
				🗑️ Permanently Delete ({selectedItems.size})
			</button>
		</div>
	{/if}

	<!-- Restore Confirmation Modal -->
	{#if showRestoreModal}
		<RestoreConfirmationModal
			items={selectedItemsDetails}
			onConfirm={confirmRestore}
			onCancel={() => showRestoreModal = false}
		/>
	{/if}

	<!-- Permanent Delete Modal -->
	{#if showPermanentDeleteModal}
		<PermanentDeleteModal
			items={selectedItemsDetails}
			onConfirm={confirmPermanentDelete}
			onCancel={() => showPermanentDeleteModal = false}
		/>
	{/if}

	<!-- Processing Overlay -->
	{#if isProcessing}
		<div class="processing-overlay">
			<div class="processing-content">
				<div class="spinner"></div>
				<p>{processingMessage}</p>
			</div>
		</div>
	{/if}
</AdminLayout>

<style>
	.filters-panel {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.warning-banner {
		background: #fef5e7;
		border: 1px solid #f9e79f;
		border-radius: 0.5rem;
		padding: 1rem 1.5rem;
		margin-bottom: 1.5rem;
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}

	.warning-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.warning-content {
		flex: 1;
	}

	.warning-content p {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		color: #7d6608;
		font-weight: 600;
	}

	.warning-content ul {
		margin: 0;
		padding-left: 1.5rem;
		font-size: 0.8125rem;
		color: #7d6608;
	}

	.warning-content li {
		margin: 0.25rem 0;
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

	.stat-value.warning {
		color: #d69e2e;
	}

	.action-buttons {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		display: flex;
		gap: 1rem;
		z-index: 100;
	}

	.restore-btn,
	.permanent-delete-btn {
		padding: 1rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transition: all 0.2s;
	}

	.restore-btn {
		background: #48bb78;
		color: white;
	}

	.restore-btn:hover {
		background: #38a169;
		transform: translateY(-2px);
		box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
	}

	.restore-btn:active {
		transform: translateY(0);
	}

	.permanent-delete-btn {
		background: #e53e3e;
		color: white;
	}

	.permanent-delete-btn:hover {
		background: #c53030;
		transform: translateY(-2px);
		box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
	}

	.permanent-delete-btn:active {
		transform: translateY(0);
	}

	/* Processing overlay */
	.processing-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
	}

	.processing-content {
		background: white;
		padding: 2rem;
		border-radius: 0.75rem;
		text-align: center;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e2e8f0;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.processing-content p {
		margin: 0;
		color: #475569;
		font-weight: 500;
	}
</style>
