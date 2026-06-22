<script lang="ts">
	// Showcase wrapper: reuse the real "Select a Memorial to Book" page.
	import Real from '../../../app/book/+page.svelte';
	import { ownerMemorials } from '../../_lib/mocks/memorials';

	const data: any = { memorials: ownerMemorials };
</script>

<Real {data} />
