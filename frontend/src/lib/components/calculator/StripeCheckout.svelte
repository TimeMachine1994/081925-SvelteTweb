<script lang="ts">
	import type { CalculatorFormData } from '$lib/types/livestream';
	import { onMount } from 'svelte';
	import { loadStripe, type Stripe } from '@stripe/stripe-js';

	let {
		clientSecret,
		configId
	} = $props<{ clientSecret: string; configId: string }>();

	let stripe: Stripe | null;
	let cardElement: any;
	let processing = $state(false);
	let errorMessage = $state('');

	onMount(async () => {
		stripe = await loadStripe('pk_test_51RygFQFfUFvnTxoO0Iq7qkz1W57cljvO8rEYkXSJiFR3AXh6uiwnFxdn1PynsczCJ1yMxVdHqO1jEpnKj6ku7yll00JWICxK4T');
		if (stripe) {
			const elements = stripe.elements();
			cardElement = elements.create('card');
			cardElement.mount('#card-element');
		}
	});

	async function handlePayment() {
		if (!stripe || !cardElement) return;

		processing = true;
		errorMessage = '';

		const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
			payment_method: {
				card: cardElement
			}
		});

		if (stripeError) {
			errorMessage = stripeError.message ?? 'An unknown error occurred.';
			processing = false;
		} else {
			console.log('✅ Payment successful!');
			window.location.href = `/app/checkout/success?configId=${configId}`;
		}
	}
</script>

<div class="checkout-container">
	<h2>Complete Your Payment</h2>
	<div id="card-element" class="stripe-card-element"></div>
	{#if errorMessage}
		<p class="error-message">{errorMessage}</p>
	{/if}
	<button onclick={handlePayment} disabled={processing}>
		{processing ? 'Processing...' : 'Pay Now'}
	</button>
</div>

<style>
	.checkout-container {
		padding: 2rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background: #fff;
	}
	.stripe-card-element {
		padding: 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
	.error-message {
		color: red;
		margin-bottom: 1rem;
	}
	button {
		width: 100%;
		padding: 0.75rem;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		border: 1px solid transparent;
		background-color: var(--color-primary);
		color: white;
	}
	button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}
</style>