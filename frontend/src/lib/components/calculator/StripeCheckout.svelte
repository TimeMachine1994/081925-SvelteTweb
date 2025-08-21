<script lang="ts">
	import type { LivestreamOptions } from '$lib/types/livestream';
	import { onMount } from 'svelte';
	import { loadStripe, type Stripe } from '@stripe/stripe-js';

	let {
		options,
		total,
		memorialId
	} = $props<{ options: LivestreamOptions; total: number; memorialId: string | null }>();
	let stripe: Stripe | null;
	let cardElement: any;

	onMount(async () => {
		stripe = await loadStripe('pk_test_51RygFQFfUFvnTxoO0Iq7qkz1W57cljvO8rEYkXSJiFR3AXh6uiwnFxdn1PynsczCJ1yMxVdHqO1jEpnKj6ku7yll00JWICxK4T');
		if (stripe) {
			const elements = stripe.elements();
			cardElement = elements.create('card');
			cardElement.mount('#card-element');
		}
	});

	async function handleCheckout() {
		if (!stripe || !cardElement) {
			return;
		}

		const response = await fetch('/app/calculator', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ options, total, memorialId })
		});

		const { clientSecret, error, configId } = await response.json();

		if (error) {
			alert(error);
			return;
		}

		const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
			payment_method: {
				card: cardElement
			}
		});

		if (stripeError) {
			alert(stripeError.message);
		} else {
			window.location.href = `/app/checkout/success?configId=${configId}`;
		}
	}
</script>

<div class="checkout">
	<div id="card-element"></div>
	<button onclick={handleCheckout}>Checkout with Stripe</button>
</div>