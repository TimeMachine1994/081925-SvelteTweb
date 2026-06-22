<script lang="ts">
	// Showcase wrapper: reuse the real standalone Calculator page.
	import Real from '../../../app/calculator/+page.svelte';

	const data: any = { memorial: null };
</script>

<Real {data} />
