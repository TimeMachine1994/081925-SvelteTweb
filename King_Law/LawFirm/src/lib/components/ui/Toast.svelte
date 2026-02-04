<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';

	const typeStyles = {
		success: 'bg-green-500 text-white',
		error: 'bg-red-500 text-white',
		info: 'bg-blue-500 text-white',
		warning: 'bg-yellow-500 text-black'
	};

	const typeIcons = {
		success: '✓',
		error: '✕',
		info: 'ℹ',
		warning: '⚠'
	};
</script>

{#if toastStore.toasts.length > 0}
	<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
		{#each toastStore.toasts as toast (toast.id)}
			<div
				class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-in {typeStyles[toast.type]}"
				role="alert"
			>
				<span class="text-lg font-bold">{typeIcons[toast.type]}</span>
				<p class="flex-1 text-sm font-medium">{toast.message}</p>
				<button
					onclick={() => toastStore.remove(toast.id)}
					class="opacity-70 hover:opacity-100 transition-opacity"
					aria-label="Dismiss"
				>
					✕
				</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	@keyframes slide-in {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.animate-slide-in {
		animation: slide-in 0.3s ease-out;
	}
</style>
