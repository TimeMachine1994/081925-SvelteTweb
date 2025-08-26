<script lang="ts">
	import PaymentStatusBadge from './PaymentStatusBadge.svelte';
	import { getPaymentStatus } from '$lib/utils/payment';
	import type { Memorial } from '$lib/types/memorial';

	let { memorial }: { memorial: Memorial } = $props();

	console.log('🏛️ MemorialCard rendering for:', memorial.lovedOneName);

	const paymentStatus = $derived(getPaymentStatus(memorial));

	const mainService = $derived.by(() => memorial.livestreamConfig?.formData?.mainService);

	const startingLocationName = $derived.by(() => mainService?.location.name || memorial.memorialLocationName || 'TBD');
	const startingLocationAddress = $derived.by(() => mainService?.location.address || memorial.memorialLocationAddress || '');

	const startingTime = $derived.by(() => mainService?.time.time || memorial.memorialTime || 'TBD');

	const notes = $derived.by(() => memorial.additionalNotes || 'none');
</script>

<div class="bg-gray-100 rounded-lg p-6 mb-6 relative shadow-sm">
	<!-- Payment Status Badge -->
	<PaymentStatusBadge status={paymentStatus} />
	
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Memorial Details -->
		<div class="pt-8">
			<h2 class="text-xl font-semibold mb-4 text-gray-900">
				Celebration of life for {memorial.lovedOneName}
			</h2>
			
			<div class="space-y-3 text-sm">
				<div>
					<span class="font-medium text-gray-700 block mb-1">Starting Location</span>
					<div class="text-gray-900">{startingLocationName}</div>
					{#if startingLocationAddress}
						<div class="text-gray-600">{startingLocationAddress}</div>
					{/if}
				</div>

				<div>
					<span class="font-medium text-gray-700 block mb-1">Start Time</span>
					<div class="text-gray-900">{startingTime}</div>
				</div>

				<div>
					<span class="font-medium text-gray-700 block mb-1">Notes</span>
					<div class="text-gray-900">{notes}</div>
				</div>

				{#if memorial.funeralHomeName}
					<div>
						<span class="font-medium text-gray-700 block mb-1">Funeral Home</span>
						<div class="text-gray-900">{memorial.funeralHomeName}</div>
					</div>
				{/if}

				{#if memorial.directorFullName}
					<div>
						<span class="font-medium text-gray-700 block mb-1">Director</span>
						<div class="text-gray-900">{memorial.directorFullName}</div>
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Video Placeholder -->
		<div class="bg-black rounded-lg aspect-video flex items-center justify-center">
			<div class="text-white text-center">
				<div class="text-4xl mb-2">📹</div>
				<div class="text-sm opacity-75">Livestream Preview</div>
			</div>
		</div>
	</div>
</div>