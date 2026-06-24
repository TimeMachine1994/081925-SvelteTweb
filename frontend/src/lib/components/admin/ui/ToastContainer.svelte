<!-- ToastContainer — renders the global admin toast queue. Mount once in AdminLayout. -->
<script lang="ts">
	import { adminToast } from '$lib/stores/adminToast';
	import AdminIcon from './AdminIcon.svelte';

	const styles: Record<string, string> = {
		success: 'border-green-200 bg-green-50 text-green-800',
		error: 'border-red-200 bg-red-50 text-red-800',
		info: 'border-sky-200 bg-sky-50 text-sky-800'
	};

	const icons: Record<string, string> = {
		success: 'complete',
		error: 'incomplete',
		info: 'overview'
	};
</script>

<div class="pointer-events-none fixed bottom-4 right-4 z-[300] flex flex-col gap-2">
	{#each $adminToast as toast (toast.id)}
		<div
			class="pointer-events-auto flex items-center gap-2.5 rounded-md border px-4 py-3 text-sm shadow-md {styles[
				toast.variant
			]}"
			role="status"
		>
			<AdminIcon name={icons[toast.variant]} size={16} />
			<span class="font-medium">{toast.message}</span>
			<button
				type="button"
				class="ml-2 text-current/60 hover:text-current"
				aria-label="Dismiss"
				onclick={() => adminToast.dismiss(toast.id)}
			>
				&times;
			</button>
		</div>
	{/each}
</div>
