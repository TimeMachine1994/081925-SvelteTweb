<script lang="ts">
	import { onMount } from 'svelte';
	import { loadStripe, type Stripe, type StripeElements, type StripeCardElement } from '@stripe/stripe-js';
	
	let { amount, memorialId, lovedOneName } = $props<{ amount: number, memorialId: string, lovedOneName: string }>();
	let stripe: Stripe | null = $state(null);
	let elements: StripeElements | null = $state(null);
	let cardElement: StripeCardElement | null = $state(null);
	let processing = $state(false);
	let error: string | null = $state(null);
	let clientSecret: string | null = $state(null);
	
	onMount(async () => {
		console.log('StripeCheckout component mounted 💳');
		const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
		if (!stripeKey) {
			console.error('Stripe public key not found!');
			return;
		}
		stripe = await loadStripe(stripeKey);

		const res = await fetch('/app/calculator', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ amount, memorialId, lovedOneName })
		});

		const data = await res.json();
		clientSecret = data.clientSecret;

		if (stripe && clientSecret) {
			elements = stripe.elements({ clientSecret });
			cardElement = elements.create('card');
			cardElement.mount('#card-element');
		}
	});

	async function handleSubmit() {
		if (!stripe || !elements || !cardElement || !clientSecret) {
			return;
		}

		processing = true;

		const { error: submitError } = await stripe.confirmCardPayment(clientSecret, {
			payment_method: {
				card: cardElement
			}
		});

		if (submitError) {
			error = submitError.message ?? 'An unknown error occurred.';
			processing = false;
			return;
		}

		// Payment successful
		window.location.href = `/app/checkout/success?memorialId=${memorialId}`;
	}
</script>

<div class="stripe-checkout">
	<h3>Complete Your Payment</h3>
	<div id="card-element"></div>
	<button onclick={handleSubmit} disabled={processing || !stripe}>
		{processing ? 'Processing...' : `Pay $${amount}`}
	</button>
	{#if error}
		<p class="error">{error}</p>
	{/if}
</div>

<style>
	.stripe-checkout {
		padding: 1.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background-color: #fafafa;
	}
	#card-element {
		margin-bottom: 1rem;
	}
	.error {
		color: red;
	}
</style>