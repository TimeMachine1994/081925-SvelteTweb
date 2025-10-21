<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import NavbarLive from '$lib/components/NavbarLive.svelte';
	
	// Set brand context for live
	onMount(() => {
		if (browser) {
			localStorage.setItem('tributestream-brand', 'live');
			// Apply live theme class to document
			document.documentElement.setAttribute('data-brand', 'live');
		}
	});
</script>

<!-- Live Brand Layout -->
<div class="live-brand">
	<NavbarLive />
	<slot />
</div>

<style>
	:global(.live-brand) {
		/* Live brand styling can be added here */
		--brand-primary: #10b981;
		--brand-secondary: #059669;
		--brand-accent: #34d399;
	}
</style>
