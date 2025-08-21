<script lang="ts">
	import type { LivestreamOptions } from '$lib/types/livestream';

	let { options, total } = $props<{ options: LivestreamOptions; total: number }>();
</script>

<div class="summary">
	<h2>Summary</h2>
	<p>Base Package: {options.basePackage}</p>
	<p>Duration: {options.duration} minutes</p>
	<p>Platform: {options.platform}</p>
	<p>OBS Scene Switching: {options.addObs ? 'Yes' : 'No'}</p>
	<p>Extra Cameras: {options.addExtraCameras}</p>
	<p>Extra Microphones: {options.addExtraMicrophones}</p>
	<hr />
	<h3>Total: ${total}</h3>
</div>

<style>
	.summary {
		border: 1px solid #ccc;
		padding: 1rem;
		border-radius: 5px;
	}
</style>