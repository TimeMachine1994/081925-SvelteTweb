<script lang="ts">
	import type { BookingItem } from '$lib/types/livestream';
	import { onMount, createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let { bookingItems, total } = $props<{ bookingItems: BookingItem[]; total: number }>();

	let isSticky = $state(false);
	let sentinel: HTMLDivElement;
	let summaryEl;

	onMount(() => {
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				isSticky = !entry.isIntersecting;
				console.log('Intersection observer triggered. Is sticky:', !entry.isIntersecting);
			},
			{ threshold: 0 }
		);

		observer.observe(sentinel);

		return () => observer.disconnect();
	});
</script>

<div bind:this={sentinel}></div>
<div class="summary" class:sticky={isSticky} bind:this={summaryEl}>
	{#if isSticky}
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
			{#each bookingItems as item}
				<div class="item">
					<span>{item.name} {#if item.quantity > 1}(x{item.quantity}){/if}</span>
					<span class="price">${item.price * item.quantity}</span>
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
		<button class="action-btn secondary" onclick={() => dispatch('save')}>Save and Pay Later</button>
		<button class="action-btn primary" onclick={() => dispatch('pay')}>Continue to Payment</button>
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
		position: fixed;
		top: 20px; /* Adjust as needed */
		width: calc(33.333% - 3rem); /* Corresponds to 1/3 width minus gap */
		max-width: 400px; /* Optional: prevent it from getting too wide */
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
		gap: 0.75rem;
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
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
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