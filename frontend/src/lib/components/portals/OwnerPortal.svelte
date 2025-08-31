<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';
	import type { Booking } from '$lib/types/booking';
	import LivestreamScheduleTable from '$lib/components/ui/LivestreamScheduleTable.svelte';

	let { memorials, bookings }: { memorials: Memorial[], bookings: Booking[] } = $props();

	console.log('👑 OwnerPortal rendering with', memorials.length, 'memorials and', bookings.length, 'bookings');

	let selectedMemorialId = $state('');

	$effect(() => {
		if (memorials.length > 0 && !selectedMemorialId) {
			selectedMemorialId = memorials[0].id;
			console.log('🎯 Default memorial selected:', memorials[0].lovedOneName);
		}
	});

	const selectedMemorial = $derived(() => {
		return memorials.find(m => m.id === selectedMemorialId) || null;
	});

	const bookingForSelectedMemorial = $derived(() => {
		return bookings.find(b => b.memorialId === selectedMemorialId) || null;
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

	// Removed showCalculator state and toggleCalculator function as we're linking to the page
</script>

<div class="mx-auto px-4 py-8 max-w-4xl">
	{#if memorials && memorials.length > 0}
		{@const currentMemorial = selectedMemorial()}

		{#if currentMemorial}
			<!-- Loved One's URL Card -->
			<div class="bg-white shadow-lg rounded-lg p-6 mb-8 text-center">
				<h3 class="text-xl font-semibold text-gray-900 mb-4">Your Loved One's Memorial Page</h3>
				<p class="text-purple-600 text-lg font-medium break-all mb-4">
					<a href={memorialUrl()} target="_blank" rel="noopener noreferrer">
						{memorialUrl()}
					</a>
				</p>
				<button
					onclick={() => navigator.clipboard.writeText(memorialUrl())}
					class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2h2a2 2 0 002 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
					</svg>
					Copy Link
				</button>
			</div>

			<!-- Schedule -->
			<div class="bg-white shadow-lg rounded-lg p-6">
				<h3 class="text-xl font-semibold text-gray-900 mb-4">Livestream Schedule</h3>
				{#if bookingForSelectedMemorial()}
					{@const booking = bookingForSelectedMemorial()}
					{#if booking}
						<p>Status: {booking.status}</p>
						<a href={`/app/calculator?bookingId=${booking.id}`} class="text-purple-600 hover:underline">
							View or Edit Booking
						</a>
					{/if}
				{:else}
					<p class="text-gray-600">No livestream schedule available for this memorial.</p>
					<a href="/app/calculator" class="text-purple-600 hover:underline">
						Create a new booking
					</a>
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
				class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
			>
				Create Your First Memorial
			</a>
		</div>
	{/if}

	<!-- Logout Button -->
	<div class="mt-12 text-center">
		<form method="POST" action="?/logout">
			<button type="submit" class="text-sm text-gray-600 hover:text-gray-800 hover:underline transition-colors">
				Log Out
			</button>
		</form>
	</div>
</div>