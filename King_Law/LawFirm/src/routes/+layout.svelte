<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte.ts';
	import { themeStore } from '$lib/stores/theme.svelte.ts';
	import { onMount } from 'svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children }: { children: any } = $props();

	let isDashboard = $derived($page.url.pathname.startsWith('/dashboard'));

	onMount(() => {
		authStore.fetchUser();
		themeStore.init();
	});
</script>

{#if isDashboard}
	<!-- Dashboard routes use their own AppShell layout (no marketing nav/footer) -->
	{@render children()}
{:else}
	<div class="flex flex-col min-h-screen">
		<Navigation user={authStore.user} />
		
		<main class="flex-grow">
			{@render children()}
		</main>
		
		<Footer />
	</div>
{/if}
