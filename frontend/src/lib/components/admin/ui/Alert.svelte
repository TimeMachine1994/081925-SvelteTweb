<!-- Alert — inline banner for errors/info/success messages. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import AdminIcon from './AdminIcon.svelte';

	let {
		variant = 'info',
		title = undefined,
		icon = undefined,
		children
	}: {
		variant?: 'info' | 'success' | 'warning' | 'danger';
		title?: string;
		icon?: string;
		children?: Snippet;
	} = $props();

	const styles: Record<string, string> = {
		info: 'border-sky-200 bg-sky-50 text-sky-800',
		success: 'border-green-200 bg-green-50 text-green-800',
		warning: 'border-amber-200 bg-amber-50 text-amber-800',
		danger: 'border-red-200 bg-red-50 text-red-800'
	};

	const defaultIcon: Record<string, string> = {
		info: 'overview',
		success: 'complete',
		warning: 'incomplete',
		danger: 'incomplete'
	};
</script>

<div class="flex items-start gap-3 rounded-md border px-4 py-3 {styles[variant]}" role="alert">
	<div class="mt-0.5 shrink-0">
		<AdminIcon name={icon ?? defaultIcon[variant]} size={18} />
	</div>
	<div class="text-sm">
		{#if title}
			<p class="font-semibold">{title}</p>
		{/if}
		<div class={title ? 'mt-0.5' : ''}>{@render children?.()}</div>
	</div>
</div>
