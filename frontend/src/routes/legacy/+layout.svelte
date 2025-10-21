<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import NavbarLegacy from '$lib/components/NavbarLegacy.svelte';
	
	// Set brand context for legacy
	onMount(() => {
		if (browser) {
			localStorage.setItem('tributestream-brand', 'legacy');
			// Apply legacy theme class to document
			document.documentElement.setAttribute('data-brand', 'legacy');
		}
	});
</script>

<!-- Legacy Brand Layout -->
<div class="legacy-brand">
	<NavbarLegacy />
	<slot />
</div>

<style>
	:global(.legacy-brand) {
		/* Legacy brand styling can be added here */
		--brand-primary: #d5ba7f;
		--brand-secondary: #c5aa6f;
		--brand-accent: #e5ca8f;
	}
</style>
