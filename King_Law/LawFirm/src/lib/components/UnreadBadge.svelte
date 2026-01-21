<script lang="ts">
	let { 
		count = 0,
		size = 'md',
		showZero = false
	}: { 
		count?: number;
		size?: 'sm' | 'md' | 'lg';
		showZero?: boolean;
	} = $props();

	const sizeClasses = {
		sm: 'text-xs min-w-4 h-4 px-1',
		md: 'text-xs min-w-5 h-5 px-1.5',
		lg: 'text-sm min-w-6 h-6 px-2'
	};

	let displayCount = $derived(count > 99 ? '99+' : count.toString());
	let shouldShow = $derived(showZero || count > 0);
</script>

{#if shouldShow}
	<span 
		class="inline-flex items-center justify-center rounded-full bg-red-500 text-white font-semibold {sizeClasses[size]}"
		aria-label="{count} unread"
	>
		{displayCount}
	</span>
{/if}
