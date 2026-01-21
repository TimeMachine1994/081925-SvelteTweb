<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { onDestroy } from 'svelte';

	let { 
		open = false, 
		title = '', 
		size = 'md',
		showClose = true,
		onclose 
	} = $props();

	// Sizes mapping
	const sizes = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl',
		full: 'max-w-full m-4'
	};

	// Close handler
	function handleClose() {
		if (onclose) onclose();
	}

	// Keyboard support
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			handleClose();
		}
	}

	// Body scroll lock
	$effect(() => {
		if (typeof document !== 'undefined') {
			if (open) {
				document.body.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = '';
			}
		}
		return () => {
			if (typeof document !== 'undefined') {
				document.body.style.overflow = '';
			}
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
		role="presentation"
	>
		<!-- Backdrop -->
		<div 
			class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
			onclick={handleClose}
			role="button"
			tabindex="-1"
			transition:fade={{ duration: 200 }}
		></div>

		<!-- Modal Panel -->
		<div 
			class="relative bg-background border border-border rounded-lg shadow-xl w-full {sizes[size] as keyof typeof sizes || sizes.md} flex flex-col max-h-[90vh]"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<!-- Header -->
			{#if title || showClose}
				<div class="flex items-center justify-between p-6 border-b border-border shrink-0">
					{#if title}
						<h2 id="modal-title" class="font-title text-2xl font-semibold">
							{title}
						</h2>
					{:else}
						<div></div>
					{/if}

					{#if showClose}
						<button
							onclick={handleClose}
							class="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-muted transition-colors"
							aria-label="Close"
						>
							<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					{/if}
				</div>
			{/if}

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-6">
				<slot />
			</div>

			<!-- Footer -->
			{#if $$slots.footer}
				<div class="p-6 border-t border-border bg-muted/20 shrink-0">
					<slot name="footer" />
				</div>
			{/if}
		</div>
	</div>
{/if}
