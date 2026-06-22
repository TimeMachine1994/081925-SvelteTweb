<script lang="ts">
	// Showcase wrapper: reuse the real Search page with mock results.
	import Real from '../../../search/+page.svelte';
	import showcaseData from '../../_lib/showcase-data.json';

	const data: any = {
		user: null,
		query: 'Jane Doe',
		memorials: showcaseData.searchResults
	};
</script>

<Real {data} />
