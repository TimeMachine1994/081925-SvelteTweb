<script lang="ts">
	type Tab = {
		id: string;
		label: string;
		icon?: any;
		badge?: string | number;
	};

	let {
		tabs,
		activeTab = $bindable(),
		onchange
	}: {
		tabs: Tab[];
		activeTab: string;
		onchange?: (tabId: string) => void;
	} = $props();

	function selectTab(tabId: string) {
		activeTab = tabId;
		onchange?.(tabId);
	}
</script>

<div class="border-b border-border mb-6">
	<nav class="flex gap-1 -mb-px" aria-label="Tabs">
		{#each tabs as tab}
			<button
				onclick={() => selectTab(tab.id)}
				class="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
					{activeTab === tab.id
					? 'border-gold text-foreground'
					: 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}"
				aria-current={activeTab === tab.id ? 'page' : undefined}
			>
				{#if tab.icon}
					<tab.icon class="w-4 h-4" />
				{/if}
				{tab.label}
				{#if tab.badge !== undefined && tab.badge !== null}
					<span class="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-gold/20 text-gold font-semibold">
						{tab.badge}
					</span>
				{/if}
			</button>
		{/each}
	</nav>
</div>
