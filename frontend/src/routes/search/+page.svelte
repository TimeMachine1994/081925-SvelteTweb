<script lang="ts">
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Input, Card, Badge, Button } from '$lib/components/minimal-modern';
	import type { Memorial } from '$lib/types/memorial';

	// Props using SvelteKit 5 syntax
	let { data } = $props();
	const { query, memorials } = data;

	// State using SvelteKit 5 runes
	let searchQuery = $state(query);
	let searchResults = $state<Memorial[]>([]);
	const theme = getTheme('minimal');

	// Debug: Check if data is loading
	console.log('🔍 Search page data:', { query, memorialsCount: memorials?.length });

	function performSearch(searchTerm: string) {
		console.log('🔎 performSearch called with:', searchTerm);
		
		if (searchTerm.length < 2) {
			searchResults = [];
			console.log('❌ Search term too short');
			return;
		}

		if (!memorials || memorials.length === 0) {
			console.error('❌ No memorials available:', memorials?.length);
			searchResults = [];
			return;
		}

		// Simple client-side search by loved one's name
		const query = searchTerm.toLowerCase().trim();
		const filtered = memorials.filter((memorial: Memorial) => {
			const name = memorial.lovedOneName?.toLowerCase();
			const matches = name?.includes(query);
			if (matches) console.log('✅ Match:', memorial.lovedOneName);
			return matches;
		});

		searchResults = filtered.sort((a: Memorial, b: Memorial) => {
			// Sort by relevance: exact matches first, then partial matches
			const aName = a.lovedOneName?.toLowerCase() || '';
			const bName = b.lovedOneName?.toLowerCase() || '';
			
			const aExact = aName.startsWith(query) ? 0 : 1;
			const bExact = bName.startsWith(query) ? 0 : 1;
			
			if (aExact !== bExact) return aExact - bExact;
			return aName.localeCompare(bName);
		});
		
		console.log('🎯 Search results:', searchResults.length);
	}

	// SvelteKit 5 reactive effect with proper dependency tracking
	$effect(() => {
		console.log('⚡ Effect triggered, searchQuery:', searchQuery);
		const debounce = setTimeout(() => {
			performSearch(searchQuery);
		}, 150);

		return () => {
			clearTimeout(debounce);
		};
	});
</script>

<div class="container mx-auto p-4 md:p-8 lg:p-12">
	<h1 class="h1 mb-8 text-center">Search Tributes</h1>
	<div class="mx-auto max-w-2xl">
		<input
			type="text"
			placeholder="Search for a loved one..."
			class="w-full rounded-md border border-gray-300 px-4 py-3 text-lg"
			bind:value={searchQuery}
		/>

		<div class="mt-8">
			{#if searchResults.length > 0}
				<div class="mb-4 text-sm text-gray-600">
					Found {searchResults.length} memorial{searchResults.length === 1 ? '' : 's'}
				</div>
				<ul class="space-y-4">
					{#each searchResults as memorial}
						<li>
							<a
								href="/{memorial.fullSlug}"
								class="block rounded-lg border p-4 hover:bg-gray-100 transition-colors"
							>
								<h2 class="text-xl font-bold text-gray-900">{memorial.lovedOneName}</h2>
								{#if memorial.birthDate && memorial.deathDate}
									<p class="text-gray-600 mt-1">
										{memorial.birthDate} - {memorial.deathDate}
									</p>
								{/if}
								{#if memorial.creatorName}
									<p class="text-gray-500 text-sm mt-2">
										Created by {memorial.creatorName}
									</p>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			{:else if searchQuery.length >= 2}
				<div class="text-center py-8">
					<p class="text-gray-600 mb-2">No memorials found for "{searchQuery}"</p>
					<p class="text-sm text-gray-500">Try searching with a different name or check the spelling</p>
				</div>
			{:else if searchQuery.length === 1}
				<p class="text-center text-gray-500 py-4">Type at least 2 characters to search</p>
			{/if}
		</div>
	</div>
</div>
