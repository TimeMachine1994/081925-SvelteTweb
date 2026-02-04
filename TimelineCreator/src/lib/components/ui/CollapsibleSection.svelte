<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		subtitle?: string;
		expanded?: boolean;
		disabled?: boolean;
		complete?: boolean;
		onToggle?: () => void;
		children?: Snippet;
	}

	let {
		title,
		subtitle = '',
		expanded = $bindable(false),
		disabled = false,
		complete = false,
		onToggle,
		children
	}: Props = $props();

	function handleToggle() {
		if (disabled) return;
		expanded = !expanded;
		onToggle?.();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleToggle();
		}
	}
</script>

<div class="border border-gray-200 rounded-xl overflow-hidden bg-white {disabled ? 'opacity-50' : ''}">
	<button
		type="button"
		class="w-full px-6 py-4 flex items-center justify-between text-left {disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'} transition-colors"
		onclick={handleToggle}
		onkeydown={handleKeydown}
		disabled={disabled}
		aria-expanded={expanded}
	>
		<div class="flex items-center gap-3">
			{#if complete}
				<div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
					<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
			{:else}
				<div class="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
					<span class="text-xs text-gray-500 font-medium"></span>
				</div>
			{/if}
			<div>
				<h3 class="font-semibold text-gray-900">{title}</h3>
				{#if subtitle}
					<p class="text-sm text-gray-500">{subtitle}</p>
				{/if}
			</div>
		</div>
		<svg
			class="w-5 h-5 text-gray-400 transition-transform duration-200 {expanded ? 'rotate-180' : ''}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if expanded}
		<div class="px-6 pb-6 border-t border-gray-100">
			<div class="pt-4">
				{#if children}
					{@render children()}
				{/if}
			</div>
		</div>
	{/if}
</div>
