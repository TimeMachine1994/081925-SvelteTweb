<!-- StatCard — dashboard metric tile with icon, value and label. -->
<script lang="ts">
	import AdminIcon from './AdminIcon.svelte';

	let {
		label,
		value,
		icon = undefined,
		variant = 'neutral',
		href = undefined
	}: {
		label: string;
		value: string | number;
		icon?: string;
		variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
		href?: string;
	} = $props();

	const accents: Record<string, string> = {
		neutral: 'bg-slate-100 text-slate-600',
		success: 'bg-green-100 text-green-700',
		warning: 'bg-amber-100 text-amber-700',
		danger: 'bg-red-100 text-red-700',
		info: 'bg-sky-100 text-sky-700'
	};

	const Tag = $derived(href ? 'a' : 'div');
</script>

<svelte:element
	this={Tag}
	{href}
	class="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 transition-colors {href
		? 'hover:border-slate-300 hover:bg-slate-50'
		: ''}"
>
	{#if icon}
		<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg {accents[variant]}">
			<AdminIcon name={icon} size={22} />
		</div>
	{/if}
	<div class="min-w-0">
		<div class="text-2xl font-bold leading-tight text-slate-900">{value}</div>
		<div class="truncate text-sm text-slate-500">{label}</div>
	</div>
</svelte:element>
