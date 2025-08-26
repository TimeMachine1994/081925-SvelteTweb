import { algoliasearch } from 'algoliasearch';
import { PUBLIC_ALGOLIA_APP_ID, PUBLIC_ALGOLIA_SEARCH_ONLY_API_KEY } from '$env/static/public';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	const client = algoliasearch(PUBLIC_ALGOLIA_APP_ID, PUBLIC_ALGOLIA_SEARCH_ONLY_API_KEY);
	const query = url.searchParams.get('q') || '';

	return {
		query,
		client,
		indexName: 'memorials'
	};
};