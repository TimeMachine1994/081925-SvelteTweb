<script lang="ts">
	import type { PaymentStatus } from '$lib/utils/payment';

	let { status }: { status: PaymentStatus } = $props();

	console.log('💳 PaymentStatusBadge rendering with status:', status);
</script>

{#if status === 'complete'}
	<div class="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
		<span class="text-xs">✓</span>
		Payment Status: Complete
	</div>
{:else if status === 'incomplete'}
	<div class="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
		<span class="text-xs">⚠</span>
		Payment Incomplete
	</div>
{/if}