<!-- Badge — small status pill. Variants map to semantic colors. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import AdminIcon from './AdminIcon.svelte';

	let {
		variant = 'neutral',
		icon = undefined,
		class: className = '',
		children
	}: {
		variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
		icon?: string;
		class?: string;
		children?: Snippet;
	} = $props();

	const variants: Record<string, string> = {
		neutral: 'bg-slate-100 text-slate-700',
		success: 'bg-green-100 text-green-800',
		warning: 'bg-amber-100 text-amber-800',
		danger: 'bg-red-100 text-red-800',
		info: 'bg-sky-100 text-sky-800'
	};
</script>

<span
	class="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium {variants[
		variant
	]} {className}"
>
	{#if icon}
		<AdminIcon name={icon} size={12} />
	{/if}
	{@render children?.()}
</span>
