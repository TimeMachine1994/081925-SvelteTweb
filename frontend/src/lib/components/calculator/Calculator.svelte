<script lang="ts">
	import Options from './Options.svelte';
	import Summary from './Summary.svelte';
	import StripeCheckout from './StripeCheckout.svelte';
	import type { LivestreamOptions } from '$lib/types/livestream';

	let options = $state<LivestreamOptions>({
		basePackage: 'standard',
		duration: 60,
		platform: 'youtube',
		addObs: false,
		addExtraCameras: 0,
		addExtraMicrophones: 0
	});

	let total = $derived(calculateTotal(options));

	function calculateTotal(options: LivestreamOptions): number {
		let cost = 0;
		if (options.basePackage === 'standard') {
			cost += 500;
		} else {
			cost += 1000;
		}
		cost += options.duration * 2;
		if (options.addObs) {
			cost += 100;
		}
		cost += options.addExtraCameras * 50;
		cost += options.addExtraMicrophones * 25;
		return cost;
	}
</script>

<div class="calculator">
	<Options bind:options />
	<Summary {options} {total} />
	<StripeCheckout {options} {total} />
</div>

<style>
	.calculator {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}
</style>