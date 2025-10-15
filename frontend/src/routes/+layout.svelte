<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import DevRoleSwitcher from '$lib/components/DevRoleSwitcher.svelte';
	import RecaptchaProvider from '$lib/components/RecaptchaProvider.svelte';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';

	import { user } from '$lib/auth';
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	const theme = getTheme('minimal');

	$effect(() => {
		user.set(data.user);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<script type="text/javascript" src="//script.crazyegg.com/pages/scripts/0130/3684.js" async="async"></script>
</svelte:head>

<RecaptchaProvider>
	<div class="app-container {theme.root}" style="font-family: {theme.font.body}">
		<DevRoleSwitcher />
		<Navbar />
		<main
			class="main-content"
			class:full-width={$page.route.id?.includes('/app/calculator')}
			class:homepage={$page.route.id === '/'}
			class:memorial-page={$page.route.id === '/[fullSlug]'}
		>
			{@render children?.()}
		</main>
		<Footer />
	</div>
</RecaptchaProvider>

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

	.main-content.memorial-page {
		max-width: none;
		padding: 0;
	}
</style>