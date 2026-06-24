<!--
ConfirmDialog — accessible modal confirmation.
Controlled via `open` bindable prop. Emits onConfirm / onCancel.
-->
<script lang="ts">
	import Button from './Button.svelte';

	let {
		open = $bindable(false),
		title,
		message,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		variant = 'danger',
		loading = false,
		onConfirm,
		onCancel = undefined
	}: {
		open?: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		variant?: 'danger' | 'primary';
		loading?: boolean;
		onConfirm: () => void;
		onCancel?: () => void;
	} = $props();

	function cancel() {
		onCancel?.();
		open = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') cancel();
	}
</script>

<svelte:window onkeydown={open ? onKeydown : undefined} />

{#if open}
	<div class="fixed inset-0 z-[200] flex items-center justify-center p-4">
		<button
			type="button"
			class="absolute inset-0 bg-slate-900/50"
			aria-label="Close dialog"
			onclick={cancel}
		></button>
		<div
			class="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="confirm-title"
		>
			<h3 id="confirm-title" class="text-lg font-semibold text-slate-900">{title}</h3>
			<p class="mt-2 text-sm text-slate-600">{message}</p>
			<div class="mt-6 flex justify-end gap-3">
				<Button variant="secondary" onclick={cancel} disabled={loading}>{cancelLabel}</Button>
				<Button {variant} onclick={onConfirm} {loading}>{confirmLabel}</Button>
			</div>
		</div>
	</div>
{/if}
