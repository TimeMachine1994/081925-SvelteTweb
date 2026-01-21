<script lang="ts">
	import Modal from './Modal.svelte';

	let { 
		open = false, 
		title = 'Confirm Action', 
		message = 'Are you sure you want to proceed?', 
		confirmText = 'Confirm', 
		cancelText = 'Cancel', 
		variant = 'warning',
		loading = false,
		onconfirm,
		oncancel 
	} = $props();

	function handleConfirm() {
		if (onconfirm) onconfirm();
	}

	function handleCancel() {
		if (oncancel) oncancel();
	}
</script>

<Modal {open} {title} size="sm" onclose={handleCancel}>
	<div class="py-2">
		<p class="text-muted-foreground">
			{message}
		</p>
	</div>

	<div slot="footer" class="flex justify-end gap-3">
		<button
			type="button"
			class="px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors disabled:opacity-50"
			onclick={handleCancel}
			disabled={loading}
		>
			{cancelText}
		</button>
		<button
			type="button"
			class="px-4 py-2 rounded-md font-semibold text-white transition-colors disabled:opacity-50 flex items-center gap-2
				{variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-gold hover:bg-gold-dark text-black'}"
			onclick={handleConfirm}
			disabled={loading}
		>
			{#if loading}
				<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			{/if}
			{confirmText}
		</button>
	</div>
</Modal>
