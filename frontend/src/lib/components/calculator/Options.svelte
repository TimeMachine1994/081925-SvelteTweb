<script lang="ts">
	import type { LivestreamOptions } from '$lib/types/livestream';

	let { options = $bindable() } = $props<{ options: LivestreamOptions }>();
</script>

<div class="options">
	<h2>Customize Your Package</h2>

	<label>
		Base Package
		<select bind:value={options.basePackage}>
			<option value="standard">Standard</option>
			<option value="premium">Premium</option>
		</select>
	</label>

	<label>
		Duration (minutes)
		<input type="number" bind:value={options.duration} min="30" step="15" />
	</label>

	<label>
		Platform
		<select bind:value={options.platform}>
			<option value="youtube">YouTube</option>
			<option value="facebook">Facebook</option>
			<option value="custom">Custom</option>
		</select>
	</label>

	<label>
		<input type="checkbox" bind:checked={options.addObs} />
		Add OBS Scene Switching
	</label>

	<label>
		Extra Cameras
		<input type="number" bind:value={options.addExtraCameras} min="0" max="5" />
	</label>

	<label>
		Extra Microphones
		<input type="number" bind:value={options.addExtraMicrophones} min="0" max="5" />
	</label>
</div>

<style>
	.options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>