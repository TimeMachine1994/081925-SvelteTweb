<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';
	import { getPaymentStatus, getDefaultMemorial } from '$lib/utils/payment';
	
	import PaymentWarningBanner from '$lib/components/ui/PaymentWarningBanner.svelte';
	import MemorialSelector from '$lib/components/ui/MemorialSelector.svelte';
	import MemorialCard from '$lib/components/ui/MemorialCard.svelte';
	import PayNowButton from '$lib/components/ui/PayNowButton.svelte';

	let { memorials }: { memorials: Memorial[] } = $props();

	console.log('👑 OwnerPortalV2 rendering with', memorials.length, 'memorials');

	let selectedMemorialId = $state('');
	
	$effect(() => {
		if (memorials.length > 0 && !selectedMemorialId) {
			const defaultMemorial = getDefaultMemorial(memorials);
			if (defaultMemorial) {
				selectedMemorialId = defaultMemorial.id;
				console.log('🎯 V2: Default memorial selected:', defaultMemorial.lovedOneName);
			}
		}
	});

	const selectedMemorial = $derived(() => {
		return memorials.find(m => m.id === selectedMemorialId) || null;
	});

	const paymentStatus = $derived(() => {
		const memorial = selectedMemorial();
		return memorial ? getPaymentStatus(memorial) : 'none';
	});

	function handleMemorialChange(memorialId: string) {
		console.log('🔄 V2: Memorial selection changed to:', memorialId);
		selectedMemorialId = memorialId;
	}
</script>

<div class="max-w-4xl mx-auto px-4 py-6">
	<h2 class="text-2xl font-bold text-gray-900 mb-6">My Memorials</h2>
	
	{#if memorials && memorials.length > 0}
		{@const currentMemorial = selectedMemorial()}
		{@const currentPaymentStatus = paymentStatus()}
		
		{#if currentMemorial}
			{#if currentPaymentStatus === 'incomplete'}
				<PaymentWarningBanner memorial={currentMemorial} />
			{/if}

			<MemorialSelector 
				{memorials} 
				{selectedMemorialId}
				onSelectionChange={handleMemorialChange}
			/>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
				<div>
					<h3 class="text-lg font-semibold mb-2">Memorial Details</h3>
					<MemorialCard memorial={currentMemorial} />
				</div>
				<div class="space-y-4">
					<h3 class="text-lg font-semibold mb-2">Actions</h3>
					<a href="/app/calculator?memorialId={currentMemorial.id}" class="btn btn-primary w-full">
						Edit Livestream Schedule
					</a>
					{#if currentPaymentStatus === 'incomplete'}
						<PayNowButton memorial={currentMemorial} variant="primary" />
					{/if}
				</div>
			</div>
		{/if}
	{:else}
		<div class="text-center py-12">
			<div class="text-gray-400 text-6xl mb-4">🏛️</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No Memorials Yet</h3>
			<p class="text-gray-600 mb-6">You haven't created any memorials yet. Get started by creating your first memorial.</p>
			<a 
				href="/my-portal/tributes/new"
				class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
			>
				Create Your First Memorial
			</a>
		</div>
	{/if}
</div>