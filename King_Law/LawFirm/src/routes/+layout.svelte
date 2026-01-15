<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navigation from '$lib/components/Navigation.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children, data } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen flex flex-col bg-background text-foreground">
	<Navigation user={data?.user} />
	
	<main class="flex-1">
		{@render children()}
	</main>
	
	<Footer />
</div>
