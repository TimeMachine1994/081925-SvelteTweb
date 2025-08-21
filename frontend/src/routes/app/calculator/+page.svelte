<script lang="ts">
	import Calculator from '$lib/components/calculator/Calculator.svelte';
	import { page } from '$app/stores';

	let { data } = $props();

	const memorialId = $page.url.searchParams.get('memorialId');
</script>

<svelte:head>
	<title>Livestream Calculator | Tributestream</title>
	<meta name="description" content="Calculate the cost of your livestream package." />
</svelte:head>

<div class="container">
	<h1>Livestream Calculator</h1>
	<Calculator {memorialId} {data} />
</div>