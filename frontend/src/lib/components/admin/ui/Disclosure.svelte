<!--
Disclosure — accessible expand/collapse for short, rare, in-section content
(technical IDs, raw embed codes, advanced options). Not for primary navigation
— see SectionNav for that.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import AdminIcon from './AdminIcon.svelte';

	let {
		title,
		defaultOpen = false,
		children
	}: {
		title: string;
		defaultOpen?: boolean;
		children?: Snippet;
	} = $props();

	let open = $state(defaultOpen);
	const contentId = `disclosure-${Math.random().toString(36).slice(2)}`;
</script>

<div class="rounded-md border border-slate-200">
	<button
		type="button"
		aria-expanded={open}
		aria-controls={contentId}
		onclick={() => (open = !open)}
		class="flex min-h-11 w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
	>
		<span>{title}</span>
		<span class="shrink-0 text-slate-400 transition-transform" class:rotate-180={open}>
			<AdminIcon name="chevron-down" size={16} />
		</span>
	</button>
	{#if open}
		<div id={contentId} class="border-t border-slate-200 px-4 py-3">
			{@render children?.()}
		</div>
	{/if}
</div>
