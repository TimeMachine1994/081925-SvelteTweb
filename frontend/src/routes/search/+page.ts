import { algoliasearch } from 'algoliasearch';
import { PUBLIC_ALGOLIA_APP_ID, PUBLIC_ALGOLIA_SEARCH_ONLY_API_KEY } from '$env/static/public';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	console.log('--- Search Page Load Function ---');
	console.log('Received URL:', url.toString());

	const query = url.searchParams.get('q') || '';
	console.log('Search Query:', query);

	console.log('Initializing Algolia client with App ID:', PUBLIC_ALGOLIA_APP_ID ? 'Provided' : 'Missing');
	console.log('Algolia Search-Only API Key:', PUBLIC_ALGOLIA_SEARCH_ONLY_API_KEY ? 'Provided' : 'Missing');

	const client = algoliasearch(PUBLIC_ALGOLIA_APP_ID, PUBLIC_ALGOLIA_SEARCH_ONLY_API_KEY);
	console.log('Algolia client initialized:', client ? 'Yes' : 'No');

	const returnProps = {
		query,
		client,
		indexName: 'memorials'
	};
	console.log('Returning props to the page:', {
		query: returnProps.query,
		client: 'AlgoliaClient object',
		indexName: returnProps.indexName
	});
	console.log('--- End Search Page Load Function ---');

	return returnProps;
};