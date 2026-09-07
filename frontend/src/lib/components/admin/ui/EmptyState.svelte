<!-- EmptyState — centered placeholder for empty lists/results. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import AdminIcon from './AdminIcon.svelte';

	let {
		icon = 'complete',
		title,
		description = undefined,
		children
	}: {
		icon?: string;
		title: string;
		description?: string;
		children?: Snippet;
	} = $props();
</script>

<div class="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
	<div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
		<AdminIcon name={icon} size={26} />
	</div>
	<p class="text-base font-medium text-slate-700">{title}</p>
	{#if description}
		<p class="max-w-sm text-sm text-slate-500">{description}</p>
	{/if}
	{@render children?.()}
</div>
