<!-- Card — white panel container with consistent border/padding. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		padding = true,
		class: className = '',
		children
	}: {
		padding?: boolean;
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<div class="rounded-lg border border-slate-200 bg-white {padding ? 'p-6' : ''} {className}">
	{@render children?.()}
</div>
