<!--
Button — shared admin button. Renders as <button> or <a> (when href set).
Variants: primary | secondary | danger | ghost. Sizes: sm | md.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import AdminIcon from './AdminIcon.svelte';

	let {
		variant = 'secondary',
		size = 'md',
		type = 'button',
		href = undefined,
		disabled = false,
		loading = false,
		icon = undefined,
		onclick = undefined,
		class: className = '',
		children,
		...rest
	}: {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'sm' | 'md';
		type?: 'button' | 'submit' | 'reset';
		href?: string;
		disabled?: boolean;
		loading?: boolean;
		icon?: string;
		onclick?: (e: MouseEvent) => void;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();

	const base =
		'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60';

	const variants: Record<string, string> = {
		primary: 'bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-500',
		secondary:
			'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
		ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400'
	};

	const sizes: Record<string, string> = {
		sm: 'px-3 py-1.5 text-xs',
		md: 'px-4 py-2 text-sm'
	};

	const classes = $derived(`${base} ${variants[variant]} ${sizes[size]} ${className}`);
</script>

{#if href}
	<a {href} class={classes} {...rest}>
		{#if loading}
			<span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
		{:else if icon}
			<AdminIcon name={icon} size={size === 'sm' ? 14 : 16} />
		{/if}
		{@render children?.()}
	</a>
{:else}
	<button {type} class={classes} disabled={disabled || loading} {onclick} {...rest}>
		{#if loading}
			<span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
		{:else if icon}
			<AdminIcon name={icon} size={size === 'sm' ? 14 : 16} />
		{/if}
		{@render children?.()}
	</button>
{/if}
