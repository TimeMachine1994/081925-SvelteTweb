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
<div class="summary" class:sticky={isSticky} bind:this={summaryEl}>
	{#if isSticky && bookingItems.length > 0}
		<div class="condensed-summary">
			<h3>Total: <span class="price">${total}</span></h3>
			{#if bookingItems[0]}
				<p>{bookingItems[0].name}</p>
			{/if}
		</div>
	{:else}
		<h2>Booking Summary</h2>
	{/if}
	{#if bookingItems.length === 0}
		<p class="empty-state">Please select a package to begin.</p>
	{:else}
		<div class="items">
			{#each Object.entries(groupedItems) as [pkg, items]}
				{@const typedItems = items as BookingItem[]}
				<div class="package-group">
					<h4>{pkg}</h4>
					{#each typedItems as item}
						<div class="item">
							<span>{item.name} {#if item.quantity > 1}(x{item.quantity}){/if}</span>
							<span class="price">${item.total}</span>
						</div>
					{/each}
				</div>
			{/each}
		</div>
		<hr />
		<div class="total">
			<h3>Total</h3>
			<span class="price">${total}</span>
		</div>
	{/if}
	<div class="actions">
		<button class="action-btn secondary" onclick={() => { console.log('💾 Dispatching save event'); dispatch('save'); }}>Save and Pay Later</button>
		<button class="action-btn" onclick={() => { console.log('💳 Dispatching payNow event'); dispatch('payNow'); }}>Pay Now</button>
		<button class="action-btn primary" onclick={() => { console.log('💳 Dispatching pay event'); dispatch('pay'); }}>Continue to Payment</button>
	</div>
</div>

<style>
	.summary {
		border: 1px solid #e0e0e0;
		padding: 1.5rem;
		border-radius: 8px;
		background-color: #fafafa;
		transition: all 0.3s ease;
	}
	.summary.sticky {
		position: sticky;
		top: 20px; /* Adjust as needed */
		padding: 1rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	.condensed-summary {
		text-align: center;
	}
	.condensed-summary h3 {
		margin: 0;
	}
	.condensed-summary p {
		margin: 0.5rem 0 0;
		font-size: 0.9rem;
		color: #555;
	}
	.empty-state {
		text-align: center;
		color: #666;
		padding: 2rem 0;
	}
	.items {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.package-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.package-group h4 {
		margin: 0;
		font-weight: 500;
		color: #333;
		border-bottom: 1px solid #eee;
		padding-bottom: 0.5rem;
	}
	.item {
		display: flex;
		justify-content: space-between;
	}
	.price {
		font-weight: 500;
	}
	hr {
		border: none;
		border-top: 1px solid #e0e0e0;
		margin: 1.5rem 0;
	}
	.total {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 1.25rem;
	}
	.total .price {
		font-weight: bold;
	}
	.actions {
		margin-top: 1.5rem;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.actions .primary {
		grid-column: 1 / -1;
	}
	.action-btn {
		padding: 0.75rem;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		border: 1px solid transparent;
	}
	.action-btn.primary {
		background-color: var(--color-primary);
		color: white;
	}
	.action-btn.secondary {
		background-color: white;
		border-color: #ccc;
	}
</style>