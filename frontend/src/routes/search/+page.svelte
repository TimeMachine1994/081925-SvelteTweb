<script lang="ts">
	import { onMount } from 'svelte';

	let { data } = $props();
	const { query, client, indexName } = data;

	let searchQuery = $state(query);
	let searchResults = $state<any[]>([]);
	let loading = $state(false);

	async function performSearch() {
		if (searchQuery.length < 2) {
			searchResults = [];
			return;
		}

		loading = true;
		try {
			// Use Algolia v5 API: client.searchSingleIndex()
			const response = await client.searchSingleIndex({
				indexName,
				searchParams: {
					query: searchQuery
				}
			});
			
			searchResults = response.results?.hits || [];
		} catch (error) {
			console.error('Error searching Algolia:', error);
			console.error('Error details:', error);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const debounce = setTimeout(() => {
			performSearch();
		}, 300);

		return () => clearTimeout(debounce);
	});
</script>

<div class="container mx-auto p-4 md:p-8 lg:p-12">
	<h1 class="h1 text-center mb-8">Search Tributes</h1>
	<div class="max-w-2xl mx-auto">
		<input
			type="text"
			placeholder="Search for a loved one..."
			class="w-full px-4 py-3 rounded-md border border-gray-300 text-lg"
			bind:value={searchQuery}
		/>

		{#if loading}
			<p class="text-center mt-4">Searching...</p>
		{/if}

		<div class="mt-8">
			{#if searchResults.length > 0}
				<ul class="space-y-4">
					{#each searchResults as hit}
						<li>
							<a href="/{hit.fullSlug || `tributes/${hit.slug}`}" class="block p-4 border rounded-lg hover:bg-gray-100">
								<h2 class="text-xl font-bold">{hit.lovedOneName}</h2>
								{#if hit.createdAt?._seconds}
									<p class="text-gray-600">
										Created on: {new Date(hit.createdAt._seconds * 1000).toLocaleDateString()}
									</p>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			{:else if searchQuery.length >= 2 && !loading}
				<p class="text-center mt-4">No results found for "{searchQuery}".</p>
			{/if}
		</div>
	</div>
</div>