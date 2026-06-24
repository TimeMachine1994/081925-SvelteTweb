<!--
BLOG POSTS ADMIN PAGE

Manage blog posts and articles
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import BulkActionBar from '$lib/components/admin/BulkActionBar.svelte';
	import FilterBuilder from '$lib/components/admin/FilterBuilder.svelte';
	import { StatCard, ConfirmDialog } from '$lib/components/admin/ui';
	import { adminToast } from '$lib/stores/adminToast';
	import { can } from '$lib/stores/adminUser';
	import { goto } from '$app/navigation';
	import { applyFilters, type FilterRule } from '$lib/utils/filter-utils';

	let { data } = $props();

	// State
	let selectedPosts = $state<Set<string>>(new Set());
	let showFilters = $state(false);
	let activeFilters = $state<FilterRule[]>([]);

	// Bulk-delete confirmation state
	let confirmDeleteOpen = $state(false);
	let pendingDeleteIds = $state<string[]>([]);

	// Derived filtered data
	let filteredPosts = $derived.by(() => {
		return applyFilters(data.posts, activeFilters);
	});

	// Column configuration
	const columns = [
		{
			id: 'title',
			label: 'Title',
			field: 'title',
			width: 300,
			sortable: true
		},
		{
			id: 'author',
			label: 'Author',
			field: 'author',
			width: 150,
			sortable: true
		},
		{
			id: 'category',
			label: 'Category',
			field: 'category',
			width: 150,
			formatter: (val: string) => {
				const categoryMap: Record<string, string> = {
					'memorial-planning': 'Memorial Planning',
					'grief-support': 'Grief Support',
					technology: 'Technology',
					'funeral-industry': 'Funeral Industry',
					livestreaming: 'Livestreaming',
					'company-news': 'Company News',
					'customer-stories': 'Customer Stories'
				};
				return categoryMap[val] || val;
			}
		},
		{
			id: 'status',
			label: 'Status',
			field: 'status',
			width: 120,
			formatter: (val: string) => {
				const statusMap: Record<string, string> = {
					published: 'Published',
					draft: 'Draft',
					scheduled: 'Scheduled',
					archived: 'Archived'
				};
				return statusMap[val] || val;
			},
			sortable: true
		},
		{
			id: 'featured',
			label: 'Featured',
			field: 'featured',
			width: 100,
			formatter: (val: boolean) => (val ? 'Yes' : '-')
		},
		{
			id: 'publishedAt',
			label: 'Published',
			field: 'publishedAt',
			width: 120,
			sortable: true,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				return date.toLocaleDateString();
			}
		},
		{
			id: 'createdAt',
			label: 'Created',
			field: 'createdAt',
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
		if (!ids.length) return;

		if (action === 'delete') {
			pendingDeleteIds = ids;
			confirmDeleteOpen = true;
			return;
		}

		if (action === 'publish') {
			await updateStatus(ids, 'published', 'Blog posts published');
		} else if (action === 'draft') {
			await updateStatus(ids, 'draft', 'Blog posts moved to draft');
		}
	}

	async function updateStatus(ids: string[], status: string, successMessage: string) {
		try {
			for (const id of ids) {
				await fetch('/api/admin/blog', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id, status })
				});
			}
			adminToast.success(successMessage);
			location.reload();
		} catch {
			adminToast.error('Action failed. Please try again.');
		}
	}

	async function confirmBulkDelete() {
		const ids = pendingDeleteIds;
		confirmDeleteOpen = false;
		pendingDeleteIds = [];
		try {
			for (const id of ids) {
				await fetch('/api/admin/blog', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id })
				});
			}
			adminToast.success('Blog posts deleted');
			location.reload();
		} catch {
			adminToast.error('Delete failed. Please try again.');
		}
	}

	function handleRowClick(post: any) {
		goto(`/admin/content/blog/${post.id}`);
	}
</script>

<AdminLayout
	title="Blog Posts"
	subtitle="Manage blog articles and content"
	actions={[
		{
			label: 'Filters',
			icon: 'filter',
			onclick: () => (showFilters = !showFilters)
		},
		{
			label: 'View Live Blog',
			icon: 'public',
			onclick: () => window.open('/blog', '_blank')
		},
		...$can('blog_post', 'create')
			? [
					{
						label: 'New Post',
						icon: 'add',
						variant: 'primary',
						onclick: () => goto('/admin/content/blog/create')
					}
				]
			: []
	]}
>
	{#if showFilters}
		<div class="mb-6 rounded-lg border border-slate-200 bg-white p-6">
			<FilterBuilder
				fields={[
					{ id: 'title', label: 'Title', type: 'string' },
					{ id: 'author', label: 'Author', type: 'string' },
					{
						id: 'category',
						label: 'Category',
						type: 'enum',
						options: [
							{ value: 'memorial-planning', label: 'Memorial Planning' },
							{ value: 'grief-support', label: 'Grief Support' },
							{ value: 'technology', label: 'Technology' },
							{ value: 'funeral-industry', label: 'Funeral Industry' },
							{ value: 'livestreaming', label: 'Livestreaming' },
							{ value: 'company-news', label: 'Company News' },
							{ value: 'customer-stories', label: 'Customer Stories' }
						]
					},
					{
						id: 'status',
						label: 'Status',
						type: 'enum',
						options: [
							{ value: 'published', label: 'Published' },
							{ value: 'draft', label: 'Draft' },
							{ value: 'scheduled', label: 'Scheduled' },
							{ value: 'archived', label: 'Archived' }
						]
					},
					{ id: 'featured', label: 'Featured', type: 'boolean' }
				]}
				onFilterChange={(filters) => {
					activeFilters = filters;
				}}
			/>
		</div>
	{/if}

	{#if selectedPosts.size > 0}
		<BulkActionBar
			selectedCount={selectedPosts.size}
			resourceType="blog_post"
			onAction={(action) => handleBulkAction(action, Array.from(selectedPosts))}
			onClear={() => {
				selectedPosts.clear();
				selectedPosts = selectedPosts;
			}}
		/>
	{/if}

	<div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
		<StatCard label="Published" value={data.stats.published} icon="complete" variant="success" />
		<StatCard label="Drafts" value={data.stats.draft} icon="edit" variant="neutral" />
		<StatCard label="Scheduled" value={data.stats.scheduled} icon="calendar" variant="warning" />
		<StatCard label="Featured" value={data.stats.featured} icon="blog" variant="info" />
	</div>

	<DataGrid
		{columns}
		data={filteredPosts}
		selectable={$can('blog', 'update')}
		bind:selectedMemorials={selectedPosts}
		onRowClick={handleRowClick}
		resourceType="blog_post"
	/>
</AdminLayout>

<ConfirmDialog
	bind:open={confirmDeleteOpen}
	title="Delete blog posts?"
	message={`This will permanently delete ${pendingDeleteIds.length} blog ${pendingDeleteIds.length === 1 ? 'post' : 'posts'}.`}
	confirmLabel="Delete"
	variant="danger"
	onConfirm={confirmBulkDelete}
	onCancel={() => {
		confirmDeleteOpen = false;
		pendingDeleteIds = [];
	}}
/>

