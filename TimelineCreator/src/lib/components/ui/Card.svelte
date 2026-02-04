<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		onclick?: () => void;
		hoverable?: boolean;
		children: Snippet;
	}

	let { onclick, hoverable = false, children }: Props = $props();
</script>

{#if onclick}
	<button
		type="button"
		class="w-full text-left bg-white rounded-xl border border-gray-200 p-5 transition-all
			{hoverable ? 'hover:shadow-md hover:border-blue-300 cursor-pointer' : ''}"
		{onclick}
	>
		{@render children()}
	</button>
{:else}
	<div
		class="bg-white rounded-xl border border-gray-200 p-5 transition-all
		{hoverable ? 'hover:shadow-md hover:border-blue-300' : ''}"
	>
		{@render children()}
	</div>
{/if}
