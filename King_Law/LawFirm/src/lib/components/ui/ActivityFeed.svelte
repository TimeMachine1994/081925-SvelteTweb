<script lang="ts">
	type FeedItem = {
		icon?: any;
		title: string;
		description?: string;
		time: string;
		href?: string;
	};

	let {
		items
	}: {
		items: FeedItem[];
	} = $props();

	function formatTimeAgo(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

{#if items.length > 0}
	<div class="space-y-1">
		{#each items as item}
			{@const Tag = item.href ? 'a' : 'div'}
			<svelte:element
				this={Tag}
				href={item.href}
				class="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors {item.href ? 'cursor-pointer' : ''}"
			>
				{#if item.icon}
					<div class="mt-0.5 shrink-0">
						<item.icon class="w-4 h-4 text-muted-foreground" />
					</div>
				{/if}
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-foreground">{item.title}</p>
					{#if item.description}
						<p class="text-xs text-muted-foreground truncate">{item.description}</p>
					{/if}
				</div>
				<span class="text-xs text-muted-foreground whitespace-nowrap shrink-0">
					{formatTimeAgo(item.time)}
				</span>
			</svelte:element>
		{/each}
	</div>
{:else}
	<div class="text-center py-6 text-sm text-muted-foreground">
		No recent activity
	</div>
{/if}
