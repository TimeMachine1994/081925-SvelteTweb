<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';

	import { user } from '$lib/auth';
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	$effect(() => {
		console.log('📝 Layout effect triggered');
		user.set(data.user);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-container">
	<Navbar />
	<main class="main-content" class:full-width={$page.route.id?.includes('/app/calculator')}>
		{@render children?.()}
	</main>
	<Footer />
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
</style>
