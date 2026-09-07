<!-- SectionHeader — title + optional count badge / action slot for a section. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import AdminIcon from './AdminIcon.svelte';

	let {
		title,
		icon = undefined,
		count = undefined,
		countVariant = 'neutral',
		actions
	}: {
		title: string;
		icon?: string;
		count?: number | string;
		countVariant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
		actions?: Snippet;
	} = $props();

	const countStyles: Record<string, string> = {
		neutral: 'bg-slate-100 text-slate-700',
		success: 'bg-green-100 text-green-800',
		warning: 'bg-amber-100 text-amber-800',
		danger: 'bg-red-100 text-red-800',
		info: 'bg-sky-100 text-sky-800'
	};
</script>

<div class="mb-4 flex items-center justify-between gap-3">
	<div class="flex items-center gap-2">
		{#if icon}
			<span class="text-slate-500"><AdminIcon name={icon} size={20} /></span>
		{/if}
		<h2 class="text-lg font-semibold text-slate-900">{title}</h2>
		{#if count !== undefined}
			<span class="rounded-md px-2.5 py-0.5 text-xs font-semibold {countStyles[countVariant]}">
				{count}
			</span>
		{/if}
	</div>
	{#if actions}
		<div class="flex items-center gap-2">{@render actions()}</div>
	{/if}
</div>
