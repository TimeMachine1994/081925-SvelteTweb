<script lang="ts">
	// Showcase wrapper: reuse the real Checkout Success page with a mock config.
	import Real from '../../../app/checkout/success/+page.svelte';

	const data: any = {
		config: {
			basePackage: 'Tributestream Live',
			duration: 120,
			platform: 'Mux',
			addObs: false,
			addExtraCameras: 0,
			addExtraMicrophones: 0,
			total: 1699
		}
	};
</script>

<Real {data} />
