<script lang="ts">
	let {
		icon: Icon,
		title,
		description,
		actionLabel,
		actionHref
	}: {
		icon?: any;
		title: string;
		description?: string;
		actionLabel?: string;
		actionHref?: string;
	} = $props();
</script>

<div class="bg-background border border-border rounded-lg p-8 text-center">
	{#if Icon}
		<Icon class="w-12 h-12 mb-4 text-muted-foreground mx-auto" />
	{/if}
	<h3 class="font-semibold text-lg mb-2">{title}</h3>
	{#if description}
		<p class="text-muted-foreground mb-4">{description}</p>
	{/if}
	{#if actionLabel && actionHref}
		<a
			href={actionHref}
			class="inline-block bg-gold hover:bg-gold-dark text-king-blue font-semibold px-6 py-2 rounded-md transition-colors"
		>
			{actionLabel}
		</a>
	{/if}
</div>
