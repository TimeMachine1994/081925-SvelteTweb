<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { user, initializeAuth } from '$lib/auth';
	import { page } from '$app/stores';
	import { browser } from '$app/environment'; // Import browser environment variable
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	// Initialize the client-side auth listener that syncs with the server session
	initializeAuth();

	// Initialize the user store immediately with server data to prevent hydration mismatch
	console.log('🔧 Setting user store from layout data:', data.user);
	user.set(data.user);
	
	// Log for debugging (only in browser)
	if (browser) {
		console.log('HTML data-mode:', document.documentElement.getAttribute('data-mode'));
	}
	
	// Keep the $effect only if we need to react to data changes
	$effect(() => {
		console.log('📊 Layout data updated - user:', data.user?.email);
		user.set(data.user);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<script>
		// Ensure this script only runs in the browser
		if (typeof document !== 'undefined' && typeof localStorage !== 'undefined') {
			const mode = localStorage.getItem('mode') || 'light';
			document.documentElement.setAttribute('data-mode', mode);
		}
	</script>
</svelte:head>

<div class="app-container">
	<Navbar />
	<main
		class="main-content"
		class:full-width={$page.route.id?.includes('/app/book')}
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
