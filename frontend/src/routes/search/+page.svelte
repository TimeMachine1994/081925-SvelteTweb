<script lang="ts">
	console.log('--- Search Page Component Script ---');

	let { data } = $props();
	const { query, client, indexName } = data;
	console.log('Received data from load function:', {
		query,
		client: client ? 'AlgoliaClient object' : 'null',
		indexName
	});

	let searchQuery = $state(query);
	let searchResults = $state<any[]>([]);
	let loading = $state(false);

	console.log('Initial component state:', {
		searchQuery: searchQuery,
		searchResults: searchResults,
		loading: loading
	});

	async function performSearch() {
		console.log('--- performSearch triggered ---');
		console.log('Current searchQuery:', searchQuery);

		if (searchQuery.length < 2) {
			console.log('Search query is less than 2 characters. Clearing results.');
			searchResults = [];
			return;
		}

		console.log('Setting loading to true.');
		loading = true;
		try {
			console.log('Performing Algolia search with:', {
				indexName,
				query: searchQuery
			});
			const response = await client.searchSingleIndex({
				indexName,
				searchParams: {
					query: searchQuery
				}
			});
			console.log('Algolia API response received:', response);
			
			searchResults = response.results?.hits || [];
			console.log('Updated searchResults:', searchResults);
		} catch (error) {
			console.error('Error searching Algolia:', error);
		} finally {
			console.log('Setting loading to false.');
			loading = false;
		}
		console.log('--- performSearch finished ---');
	}

	$effect(() => {
		console.log('$effect triggered for searchQuery:', searchQuery);
		const debounce = setTimeout(() => {
			console.log('Debounce timer finished. Calling performSearch.');
			performSearch();
		}, 300);

		return () => {
			console.log('Clearing debounce timer.');
			clearTimeout(debounce);
		};
	});

	console.log('--- End Search Page Component Script ---');
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