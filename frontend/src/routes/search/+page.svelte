<script lang="ts">
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Input, Card, Badge, Button } from '$lib/components/minimal-modern';
	import type { Event } from '$lib/types/event';

	// Props using SvelteKit 5 syntax
	let { data } = $props();
	const { query, memorials } = data;

	// State using SvelteKit 5 runes
	let searchQuery = $state(query);
	let searchResults = $state<Event[]>([]);
	let isSearching = $state(false);
	const theme = getTheme('minimal');

	// Debug: Check if data is loading
	console.log('🔍 Search page data:', { query, memorialsCount: memorials?.length });

	function performSearch(searchTerm: string) {
		console.log('🔎 performSearch called with:', searchTerm);
		isSearching = true;
		
		if (searchTerm.length < 2) {
			searchResults = [];
			isSearching = false;
			console.log('❌ Search term too short');
			return;
		}

		if (!memorials || memorials.length === 0) {
			console.error('❌ No memorials available:', memorials?.length);
			searchResults = [];
			isSearching = false;
			return;
		}

		// Enhanced client-side search across multiple fields
		const query = searchTerm.toLowerCase().trim();
		const filtered = memorials.filter((event: Event) => {
			// Search across name, creator, and dates
			const searchableText = [
				event.lovedOneName,
				event.creatorName,
				event.birthDate,
				event.deathDate
			].filter(Boolean).join(' ').toLowerCase();
			
			const matches = searchableText.includes(query);
			if (matches) console.log('✅ Match:', event.lovedOneName);
			return matches;
		});

		searchResults = filtered.sort((a: Event, b: Event) => {
			// Sort by relevance: exact name matches first, then partial matches
			const aName = a.lovedOneName?.toLowerCase() || '';
			const bName = b.lovedOneName?.toLowerCase() || '';
			
			const aExact = aName.startsWith(query) ? 0 : 1;
			const bExact = bName.startsWith(query) ? 0 : 1;
			
			if (aExact !== bExact) return aExact - bExact;
			return aName.localeCompare(bName);
		});
		
		isSearching = false;
		console.log('🎯 Search results:', searchResults.length);
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && searchQuery.length >= 2) {
			performSearch(searchQuery);
		}
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
			placeholder="Search by name, date, or creator..."
			class="w-full rounded-md border border-gray-300 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			bind:value={searchQuery}
			onkeypress={handleKeyPress}
			aria-label="Search memorials"
		/>

		<div class="mt-8">
			{#if isSearching}
				<div class="text-center py-8">
					<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
					<p class="text-gray-600 mt-4">Searching...</p>
				</div>
			{:else if searchResults.length > 0}
				<div class="mb-4 text-sm text-gray-600">
					Found {searchResults.length} event{searchResults.length === 1 ? '' : 's'}
				</div>
				<ul class="space-y-4">
					{#each searchResults as event}
						<li>
							<a
								href="/{event.fullSlug}"
								class="block rounded-lg border p-4 hover:bg-gray-100 transition-colors"
							>
								<h2 class="text-xl font-bold text-gray-900">{event.lovedOneName}</h2>
								{#if event.birthDate && event.deathDate}
									<p class="text-gray-600 mt-1">
										{event.birthDate} - {event.deathDate}
									</p>
								{/if}
								{#if event.creatorName}
									<p class="text-gray-500 text-sm mt-2">
										Created by {event.creatorName}
									</p>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			{:else if searchQuery.length >= 2}
				<div class="text-center py-12">
					<div class="text-5xl mb-4">🔍</div>
					<p class="text-xl text-gray-700 mb-2">No memorials found</p>
					<p class="text-gray-600 mb-4">No public memorials match "{searchQuery}"</p>
					<p class="text-sm text-gray-500">Try searching with:
						<br>• A different name or spelling
						<br>• The creator's name
						<br>• Birth or death dates
					</p>
				</div>
			{:else if searchQuery.length === 1}
				<div class="text-center py-8">
					<p class="text-gray-500">Type at least 2 characters to search</p>
				</div>
			{:else if memorials.length === 0}
				<div class="text-center py-12">
					<p class="text-gray-600">No public memorials available at this time.</p>
				</div>
			{/if}
		</div>
	</div>
</div>
