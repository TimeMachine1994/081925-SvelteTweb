<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import FirstVisitPopup from '$lib/components/FirstVisitPopup.svelte'; // Import FirstVisitPopup

	import { user } from '$lib/auth';
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	$effect(() => {
		user.set(data.user);
		console.log('HTML data-mode:', document.documentElement.getAttribute('data-mode'));
		console.log('✨ Layout data.showFirstVisitPopup:', data.showFirstVisitPopup);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<script>
		const mode = localStorage.getItem('mode') || 'light';
		document.documentElement.setAttribute('data-mode', mode);
	</script>
</svelte:head>

<div class="app-container">
	<Navbar />
	{#if $page.route.id?.includes('/tributes/[fullSlug]') && data.showFirstVisitPopup}
		<FirstVisitPopup />
	{/if}
	<main
		class="main-content"
		class:full-width={$page.route.id?.includes('/app/calculator')}
		class:homepage={$page.route.id === '/'}
	>
		{@render children?.()}
	</main>
	<Footer />
	<div class="fixed bottom-4 left-4 z-50">
		<ThemeToggle />
	</div>
</div>

<style>
	.app-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
		width: 100%;
		max-width: 1500px;
		margin: 0 auto;
		padding: 20px;
	}

	.main-content.full-width {
		max-width: none;
	}

	.main-content.homepage {
		max-width: none;
		padding: 0;
	}

</style>
