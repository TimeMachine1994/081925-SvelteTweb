<script lang="ts">
	// Showcase wrapper: reuse the real per-memorial Schedule/Calculator page.
	import Real from '../../../schedule/[memorialId]/+page.svelte';
	import { heroMemorial } from '../../_lib/mocks/memorials';

	const data: any = { memorial: heroMemorial, customPricing: null };
</script>

<Real {data} />
