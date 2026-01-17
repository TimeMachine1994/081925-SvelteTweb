<script lang="ts">
	import '../app.css';
	import Navigation from '$lib/components/Navigation.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();
</script>

<div class="flex flex-col min-h-screen">
	<Navigation user={data.user} />
	
	<main class="flex-grow">
		{@render children()}
	</main>
	
	<Footer />
</div>
