<script lang="ts">
	import type { LivestreamOptions } from '$lib/types/livestream';
	import { onMount } from 'svelte';
	import { loadStripe, type Stripe } from '@stripe/stripe-js';

	let { options, total } = $props<{ options: LivestreamOptions; total: number }>();
	let stripe: Stripe | null;
	let cardElement: any;

	onMount(async () => {
		stripe = await loadStripe('pk_test_...'); // Add your publishable key
	});

	async function handleCheckout() {
		if (!stripe) {
			return;
		}

		const response = await fetch('/app/calculator', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ options, total })
		});

		const { clientSecret, error } = await response.json();

		if (error) {
			alert(error);
			return;
		}

		const { error: stripeError } = await stripe.confirmCardPayment(clientSecret);

		if (stripeError) {
			alert(stripeError.message);
		} else {
			alert('Payment successful!');
		}
	}
</script>

<div class="checkout">
	<div id="card-element"></div>
	<button onclick={handleCheckout}>Checkout with Stripe</button>
</div>