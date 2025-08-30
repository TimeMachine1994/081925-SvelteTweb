import { client } from '$lib/server/algolia';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const query = url.searchParams.get('q') || '';
	let initialResults: any[] = [];

	if (query) {
		try {
			const { results } = await client.search({
				requests: [
					{
						indexName: 'memorials',
						query
					}
				]
			});
			initialResults = results?.hits || [];
		} catch (error) {
			console.error('Algolia search failed:', error);
			// Optionally, you could return an error state to the page
		}
	}

	return {
		query,
		initialResults
	};
};