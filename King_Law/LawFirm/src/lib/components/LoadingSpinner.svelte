<script lang="ts">
	let { size = 'md', message }: { size?: 'sm' | 'md' | 'lg'; message?: string } = $props();

	const sizeClasses = {
		sm: 'w-8 h-8',
		md: 'w-12 h-12',
		lg: 'w-16 h-16'
	};
</script>

<div class="flex flex-col items-center justify-center p-8">
	<div
		class="{sizeClasses[size]} border-4 border-gold border-t-transparent rounded-full animate-spin"
	></div>
	{#if message}
		<p class="mt-4 text-muted-foreground">{message}</p>
	{/if}
</div>
