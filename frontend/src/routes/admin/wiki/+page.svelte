<script lang="ts">
	import WikiSearch from '$lib/components/wiki/WikiSearch.svelte';
	import WikiCategoryFilter from '$lib/components/wiki/WikiCategoryFilter.svelte';
	import WikiPageCard from '$lib/components/wiki/WikiPageCard.svelte';
	import { StatCard, EmptyState } from '$lib/components/admin/ui';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selectedCategory = $state<string | null>(null);

	const filteredPages = $derived(() => {
		let filtered = data.pages;

		// Filter by category
		if (selectedCategory) {
			filtered = filtered.filter((page) => page.category === selectedCategory);
		}

		return filtered;
	});

	const stats = $derived(() => {
		const totalPages = data.pages.length;
		const categories = new Set(data.pages.map((p) => p.category).filter(Boolean)).size;
		const totalViews = data.pages.reduce((sum, p) => sum + p.viewCount, 0);

		return { totalPages, categories, totalViews };
	});
</script>

<svelte:head>
	<title>Wiki - Admin Dashboard</title>
</svelte:head>

<div class="wiki-page">
	<!-- Header -->
	<div class="page-header">
		<div class="header-content">
			<div class="header-text">
				<h1 class="page-title">Admin Wiki</h1>
				<p class="page-description">Internal knowledge base and documentation</p>
			</div>
			<a href="/admin/wiki/new" class="create-btn">
				<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Create Page
			</a>
		</div>

		<!-- Stats -->
		<div class="stats-row">
			<StatCard label="Total Pages" value={stats().totalPages} icon="wiki" variant="info" />
			<StatCard label="Categories" value={stats().categories} icon="content" variant="neutral" />
			<StatCard label="Total Views" value={stats().totalViews} icon="view" variant="success" />
		</div>
	</div>

	<!-- Main Content -->
	<div class="page-content">
		<!-- Sidebar -->
		<aside class="sidebar">
			<WikiCategoryFilter pages={data.pages} bind:selectedCategory />
		</aside>

		<!-- Page List -->
		<main class="main-content">
			<!-- Search -->
			<div class="search-section">
				<WikiSearch pages={data.pages} />
			</div>

			<!-- Pages Grid -->
			{#if filteredPages().length === 0}
				{#if selectedCategory}
					<EmptyState
						icon="wiki"
						title="No pages in this category"
						description="Try selecting a different category or create a new page."
					/>
				{:else}
					<EmptyState
						icon="wiki"
						title="No wiki pages yet"
						description="Get started by creating your first page."
					>
						<a
							href="/admin/wiki/new"
							class="mt-2 inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
						>
							Create First Page
						</a>
					</EmptyState>
				{/if}
			{:else}
				<div class="pages-grid">
					{#each filteredPages() as page (page.id)}
						<WikiPageCard {page} />
					{/each}
				</div>
			{/if}
		</main>
	</div>
</div>

<style>
	.wiki-page {
		min-height: 100vh;
		background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
		padding: 2rem;
	}

	.page-header {
		max-width: 80rem;
		margin: 0 auto 2rem;
	}

	.header-content {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.header-text {
		flex: 1;
	}

	.page-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	.page-description {
		font-size: 1.125rem;
		color: #6b7280;
		margin: 0;
	}

	.create-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #d5ba7f;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
		white-space: nowrap;
	}

	.create-btn:hover {
		background: #b8a06d;
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.btn-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.stats-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.page-content {
		max-width: 80rem;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 250px 1fr;
		gap: 2rem;
		align-items: start;
	}

	.sidebar {
		position: sticky;
		top: 2rem;
	}

	.main-content {
		min-width: 0;
	}

	.search-section {
		margin-bottom: 2rem;
	}

	.pages-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	@media (max-width: 1024px) {
		.page-content {
			grid-template-columns: 1fr;
		}

		.sidebar {
			position: static;
		}
	}

	@media (max-width: 640px) {
		.wiki-page {
			padding: 1rem;
		}

		.page-title {
			font-size: 2rem;
		}

		.header-content {
			flex-direction: column;
		}

		.create-btn {
			width: 100%;
			justify-content: center;
		}

		.pages-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
