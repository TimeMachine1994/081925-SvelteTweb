<script lang="ts">
	import '../app.css';
	import { authStore } from '$lib/stores/auth.svelte.ts';
	import { onMount } from 'svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children }: { children: any } = $props();

	onMount(() => {
		authStore.fetchUser();
	});
</script>

<div class="flex flex-col min-h-screen">
	<Navigation user={authStore.user} />
	
	<main class="flex-grow">
		{@render children()}
	</main>
	
	<Footer />
</div>
