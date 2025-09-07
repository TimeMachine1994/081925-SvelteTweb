<script lang="ts">
	let {
		label,
		description = '',
		checked = $bindable(),
		class: className = ''
	} = $props();
</script>

<label class="flex items-center justify-between cursor-pointer {className}">
	<div class="text-sm">
		<p class="font-medium text-gray-900">{label}</p>
		{#if description}
			<p class="text-gray-500">{description}</p>
		{/if}
	</div>
	<div class="relative">
		<input type="checkbox" class="sr-only" bind:checked={checked} />
		<div class="block bg-gray-200 w-12 h-7 rounded-full"></div>
		<div class="dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition"></div>
	</div>
</label>

<style>
	input:checked ~ .dot {
		transform: translateX(100%);
		background-color: #fff;
	}
	input:checked ~ .block {
		background-color: #d5ba7f;
	}
</style>