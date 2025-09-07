<script lang="ts">
	import type { BookingItem } from '$lib/types/livestream';
	import { onMount, createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let { bookingItems, total } = $props<{ bookingItems: BookingItem[]; total: number }>();

	console.log('🧾 Summary Component Initializing...', { bookingItems, total });
	$inspect(bookingItems, total);

	let groupedItems = $derived.by(() => {
		console.log('🔄 Recalculating grouped items...');
		const result = bookingItems.reduce(
			(acc: Record<string, BookingItem[]>, item: BookingItem) => {
				const pkg = item.package;
				if (!acc[pkg]) {
					acc[pkg] = [];
				}
				acc[pkg].push(item);
				return acc;
			},
			{}
		);
		console.log('📦 Grouped items:', result);
		return result;
	});

	let isSticky = $state(false);
	let sentinel: HTMLDivElement;
	let summaryEl;

	onMount(() => {
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				isSticky = !entry.isIntersecting;
				console.log('📝 Intersection observer triggered. Is sticky:', !entry.isIntersecting);
			},
			{ threshold: 0 }
		);

		observer.observe(sentinel);

		return () => observer.disconnect();
	});
</script>

<div bind:this={sentinel}></div>
<div
	class="card preset-filled-surface-100-900 p-4 md:p-6 space-y-4 transition-all duration-300"
	class:sticky={isSticky}
	class:shadow-lg={isSticky}
	bind:this={summaryEl}
	style={isSticky ? 'position: sticky; top: 1.25rem;' : ''}
>
	{#if isSticky && bookingItems.length > 0}
		<div class="text-center">
			<h3 class="h3 font-bold">Total: <span class="text-primary-500">${total}</span></h3>
			{#if bookingItems[0]}
				<p class="text-sm opacity-75">{bookingItems[0].name}</p>
			{/if}
		</div>
	{:else}
		<h2 class="h2 text-center">Booking Summary</h2>
	{/if}

	{#if bookingItems.length === 0}
		<p class="text-center opacity-60 py-8">Please select a package to begin.</p>
	{:else}
		<div class="space-y-6">
			{#each Object.entries(groupedItems) as [pkg, items]}
				{@const typedItems = items as BookingItem[]}
				<div class="space-y-2">
					<h4 class="h4 font-semibold border-b border-surface-300-700 pb-2">{pkg}</h4>
					<div class="space-y-1">
						{#each typedItems as item}
							<div class="flex justify-between items-baseline">
								<span>{item.name} {#if item.quantity > 1}(x{item.quantity}){/if}</span>
								<span class="font-medium">${item.total}</span>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
		<hr class="!border-surface-300-700" />
		<div class="flex justify-between items-center text-xl">
			<h3 class="h3">Total</h3>
			<span class="font-bold text-primary-500">${total}</span>
		</div>
	{/if}

	<div class="grid grid-cols-2 gap-2 pt-4">
		<button class="btn preset-tonal-surface" onclick={() => { console.log('💾 Dispatching save event'); dispatch('save'); }}>Save and Pay Later</button>
		<button class="btn preset-tonal-surface" onclick={() => { console.log('💳 Dispatching payNow event'); dispatch('payNow'); }}>Pay Now</button>
		<button class="btn preset-filled-primary col-span-2" onclick={() => { console.log('💳 Dispatching pay event'); dispatch('pay'); }}>Continue to Payment</button>
	</div>
</div>