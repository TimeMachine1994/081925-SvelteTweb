import { algoliasearch } from 'algoliasearch';
import { ALGOLIA_ADMIN_KEY } from '$env/static/private';
import { PUBLIC_ALGOLIA_APP_ID } from '$env/static/public';

if (!ALGOLIA_ADMIN_KEY || !PUBLIC_ALGOLIA_APP_ID) {
	throw new Error('Algolia environment variables are not set.');
}

const client = algoliasearch(PUBLIC_ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
export { client };
export default client;