<script lang="ts">
	let {
		label,
		value,
		icon: Icon,
		href,
		onclick,
		iconClass = 'text-muted-foreground'
	}: {
		label: string;
		value: string | number;
		icon?: any;
		href?: string;
		onclick?: () => void;
		iconClass?: string;
	} = $props();

	const interactive = $derived(!!href || !!onclick);
	const interactiveClass = 'hover:border-gold hover:shadow-md transition-all cursor-pointer';
</script>

{#if href}
	<a
		{href}
		class="bg-background border border-border rounded-lg p-6 {interactiveClass} block"
	>
		{#if Icon}
			<Icon class="w-8 h-8 mb-2 {iconClass}" />
		{/if}
		<div class="text-2xl font-bold">{value}</div>
		<div class="text-sm text-muted-foreground">{label}</div>
	</a>
{:else if onclick}
	<button
		{onclick}
		class="bg-background border border-border rounded-lg p-6 {interactiveClass} block w-full text-left"
	>
		{#if Icon}
			<Icon class="w-8 h-8 mb-2 {iconClass}" />
		{/if}
		<div class="text-2xl font-bold">{value}</div>
		<div class="text-sm text-muted-foreground">{label}</div>
	</button>
{:else}
	<div class="bg-background border border-border rounded-lg p-6">
		{#if Icon}
			<Icon class="w-8 h-8 mb-2 {iconClass}" />
		{/if}
		<div class="text-2xl font-bold">{value}</div>
		<div class="text-sm text-muted-foreground">{label}</div>
	</div>
{/if}
