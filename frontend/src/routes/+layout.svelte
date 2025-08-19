<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	import { user } from '$lib/auth';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	$effect(() => {
		user.set(data.user);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
