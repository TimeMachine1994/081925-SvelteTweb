<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title?: string;
		onclose?: () => void;
		children: Snippet;
		footer?: Snippet;
	}

	let { open = $bindable(false), title, onclose, children, footer }: Props = $props();

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			open = false;
			onclose?.();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			open = false;
			onclose?.();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
			tabindex="0"
			onkeydown={(e) => {
				if (e.key === 'Escape') {
					open = false;
					onclose?.();
				}
			}}
		>
			{#if title}
				<div class="flex items-center justify-between px-6 py-4 border-b">
					<h2 class="text-lg font-semibold text-gray-900">{title}</h2>
					<button
						type="button"
						onclick={() => {
							open = false;
							onclose?.();
						}}
						class="text-gray-400 hover:text-gray-600 transition-colors"
						aria-label="Close modal"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			{/if}
			<div class="px-6 py-4 overflow-y-auto flex-1">
				{@render children()}
			</div>
			{#if footer}
				<div class="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
