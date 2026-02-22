<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
	import Icon from './Icon.svelte';
</script>

<button
	onclick={() => theme.toggle()}
	class="rounded-lg p-2 hover:bg-secondary transition-colors"
	aria-label="Toggle theme"
	title={$theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
>
	{#if $theme === 'light'}
		<Icon icon={faMoon} class="text-foreground" />
	{:else}
		<Icon icon={faSun} class="text-gold" />
	{/if}
</button>
