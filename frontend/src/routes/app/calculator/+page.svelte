<script lang="ts">
	import Calculator from '$lib/components/calculator/Calculator.svelte';
	import StaticHeader from '$lib/components/calculator/StaticHeader.svelte';
	import { page } from '$app/stores';

	let { data } = $props();

	const memorialId = $page.url.searchParams.get('memorialId');

	console.log('👽 Calculator Page Initializing...', { memorialId, data });
</script>

<svelte:head>
	<title>Livestream Calculator | Tributestream</title>
	<meta name="description" content="Calculate the cost of your livestream package." />
</svelte:head>

<div class="container mx-auto p-4 md:p-8 lg:p-12">
	<h1 class="h1 text-center mb-8">Livestream Calculator</h1>
	{#if data.memorial}
		<StaticHeader memorial={data.memorial} />
	{/if}
	<Calculator {memorialId} {data} />
</div>