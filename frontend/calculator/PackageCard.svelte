<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { PACKAGES, type PackageKey } from '$lib/data/calculator';
	import { cn, fmt } from '$lib/utils/calculator';

	type Props = {
		selected: boolean;
		pkgKey: PackageKey;
	};
	const { selected, pkgKey }: Props = $props();

	const dispatch = createEventDispatcher<{
		select: void;
	}>();

	const pkg = PACKAGES[pkgKey];

	function onSelect() {
		dispatch('select');
	}
</script>

<button
	type="button"
	onclick={onSelect}
	class={cn(
		'w-full text-left rounded-2xl border p-5 shadow-sm transition-transform focus:outline-none',
		'hover:-translate-y-0.5 active:scale-[0.98]',
		selected
			? 'border-[#D5BA7F] ring-2 ring-[#D5BA7F]/40 bg-white'
			: 'border-gray-200 bg-white hover:border-gray-300'
	)}
>
	<div class="flex items-start justify-between gap-4">
		<div>
			<h3 class="text-lg font-semibold">{pkg.name}</h3>
			<p class="mt-1 text-2xl font-bold" style="color: #D5BA7F">{fmt(pkg.price)}</p>
		</div>
		<div
			class={cn(
				'mt-1 text-xs px-3 py-1 rounded-full border',
				selected ? 'border-[#D5BA7F]' : 'border-gray-300 text-gray-600'
			)}
		>
			{selected ? 'Selected' : 'Choose'}
		</div>
	</div>
	<div class="mt-4">
		<p class="text-sm font-medium">What makes it different</p>
		<ul class="mt-1 text-sm list-disc ml-5 space-y-1">
			{#each pkg.unique as u}
				<li>{u}</li>
			{/each}
		</ul>
	</div>
	<details class="mt-3">
		<summary class="text-sm cursor-pointer select-none text-gray-700">Common inclusions</summary>
		<ul class="mt-2 text-sm list-disc ml-5 space-y-1 text-gray-700">
			{#each pkg.includes as inc}
				<li>{inc}</li>
			{/each}
		</ul>
	</details>
</button>