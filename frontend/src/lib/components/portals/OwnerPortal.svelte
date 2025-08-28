<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';
	import { getPaymentStatus, getDefaultMemorial } from '$lib/utils/payment';
	import PaymentStatusBadge from '$lib/components/ui/PaymentStatusBadge.svelte';
	import PayNowButton from '$lib/components/ui/PayNowButton.svelte';
	import LivestreamScheduleTable from '$lib/components/ui/LivestreamScheduleTable.svelte';
	import Calculator from '$lib/components/calculator/Calculator.svelte';

	let { memorials }: { memorials: Memorial[] } = $props();

	console.log('👑 OwnerPortal rendering with', memorials.length, 'memorials');

	let selectedMemorialId = $state('');

	$effect(() => {
		if (memorials.length > 0 && !selectedMemorialId) {
			const defaultMemorial = getDefaultMemorial(memorials);
			if (defaultMemorial) {
				selectedMemorialId = defaultMemorial.id;
				console.log('🎯 Default memorial selected:', defaultMemorial.lovedOneName);
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

	const memorialUrl = $derived(() => {
		const memorial = selectedMemorial();
		if (memorial) {
			// Assuming memorial.slug is available and forms part of the URL
			// This needs to be adjusted based on the actual URL structure
			return `${window.location.origin}/tributes/${memorial.slug}`;
		}
		return '';
	});

	let showCalculator = $state(false);

	function toggleCalculator() {
		showCalculator = !showCalculator;
	}
</script>

<div class="mx-auto px-4 py-8 {showCalculator ? 'max-w-6xl' : 'max-w-4xl'}">
	{#if memorials && memorials.length > 0}
		{@const currentMemorial = selectedMemorial()}
		{@const currentPaymentStatus = paymentStatus()}

		{#if currentMemorial}
			<!-- Loved One's URL Card -->
			<div class="bg-white shadow-lg rounded-lg p-6 mb-8 text-center">
				<h3 class="text-xl font-semibold text-gray-800 mb-4">Your Loved One's Memorial Page</h3>
				<p class="text-purple-600 text-lg font-medium break-all mb-4">
					<a href={memorialUrl()} target="_blank" rel="noopener noreferrer">
						{memorialUrl()}
					</a>
				</p>
				<button
					onclick={() => navigator.clipboard.writeText(memorialUrl())}
					class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2h2a2 2 0 002 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
					</svg>
					Copy Link
				</button>
			</div>

			<!-- Payment Status -->
			<div class="mb-8 text-center">
				<h3 class="text-xl font-semibold text-gray-800 mb-4">Payment Status</h3>
				<PaymentStatusBadge status={currentPaymentStatus} />
			</div>

			<!-- Schedule Now / Calculator Button -->
			<div class="mb-8 text-center">
				<button
					onclick={toggleCalculator}
					class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
				>
					{#if showCalculator}
						Hide Calculator
					{:else}
						Schedule Now / View Calculator
					{/if}
				</button>
			</div>

			{#if showCalculator}
				<div class="mb-8">
					<Calculator memorialId={currentMemorial.id} data={{ memorial: currentMemorial, config: currentMemorial.livestreamConfig }} />
				</div>
			{/if}

			<!-- Schedule -->
			<div class="bg-white shadow-lg rounded-lg p-6">
				<h3 class="text-xl font-semibold text-gray-800 mb-4">Livestream Schedule</h3>
				{#if currentMemorial.livestreamConfig}
					<LivestreamScheduleTable memorial={currentMemorial} />
				{:else}
					<p class="text-gray-600">No livestream schedule available. Please use the calculator to set up a livestream package.</p>
				{/if}
			</div>
		{:else}
			<!-- No memorial selected state (should not happen if default is set) -->
			<div class="text-center py-12">
				<p class="text-gray-600">Please select a memorial.</p>
			</div>
		{/if}
	{:else}
		<!-- No memorials state -->
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

	<!-- Logout Button -->
	<div class="mt-12 text-center">
		<form method="POST" action="?/logout">
			<button type="submit" class="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors">
				Log Out
			</button>
		</form>
	</div>
</div>