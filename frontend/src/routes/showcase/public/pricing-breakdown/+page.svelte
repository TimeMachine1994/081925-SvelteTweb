<script lang="ts">
	// Showcase wrapper: reuse the real Pricing Breakdown marketing page.
	import Real from '../../../pricing-breakdown/+page.svelte';

	const data = { user: null, userMemorial: null };
</script>

<Real {data} />
