<script lang="ts">
	import { onMount } from 'svelte';

	let { children, fallback }: { children: any; fallback?: any } = $props();
	let error = $state<Error | null>(null);

	onMount(() => {
		const handleError = (event: ErrorEvent) => {
			error = event.error;
			event.preventDefault();
		};

		window.addEventListener('error', handleError);

		return () => {
			window.removeEventListener('error', handleError);
		};
	});

	function reset() {
		error = null;
	}
</script>

{#if error}
	{#if fallback}
		{@render fallback({ error, reset })}
	{:else}
		<div class="min-h-screen flex items-center justify-center bg-background p-4">
			<div class="max-w-md w-full">
				<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
					<h2 class="text-2xl font-title text-red-800 dark:text-red-200 mb-4">
						Something went wrong
					</h2>
					<p class="text-red-700 dark:text-red-300 mb-4">
						{error.message}
					</p>
					<button
						onclick={reset}
						class="bg-gold hover:bg-gold-dark text-black font-semibold px-4 py-2 rounded-md transition-colors"
					>
						Try Again
					</button>
				</div>
			</div>
		</div>
	{/if}
{:else}
	{@render children()}
{/if}
