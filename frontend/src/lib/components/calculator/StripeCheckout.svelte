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
	
	<!-- Test Card Information -->
	<div class="test-cards-section">
		<h4>Test Credit Cards (Development Only)</h4>
		<div class="test-cards-grid">
			<div class="test-card">
				<strong>Visa (Success)</strong>
				<p>4242 4242 4242 4242</p>
				<small>Any future date, any CVC</small>
			</div>
			<div class="test-card">
				<strong>Visa (Declined)</strong>
				<p>4000 0000 0000 0002</p>
				<small>Any future date, any CVC</small>
			</div>
			<div class="test-card">
				<strong>Mastercard</strong>
				<p>5555 5555 5555 4444</p>
				<small>Any future date, any CVC</small>
			</div>
			<div class="test-card">
				<strong>American Express</strong>
				<p>3782 822463 10005</p>
				<small>Any future date, any CVC</small>
			</div>
		</div>
		<div class="test-info">
			<p><strong>For testing:</strong> Use any future expiry date and any 3-4 digit CVC</p>
			<p><strong>ZIP Code:</strong> Use any valid ZIP code (e.g., 12345)</p>
		</div>
	</div>

	<div class="payment-form">
		<h4>Payment Information</h4>
		<div id="card-element"></div>
		<button onclick={handleSubmit} disabled={processing || !stripe}>
			{processing ? 'Processing...' : `Pay $${amount}`}
		</button>
		{#if error}
			<p class="error">{error}</p>
		{/if}
	</div>
</div>

<style>
	.stripe-checkout {
		padding: 1.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background-color: #fafafa;
	}
	.test-cards-section {
		background: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.test-cards-section h4 {
		margin: 0 0 1rem 0;
		color: #495057;
		font-size: 1.1rem;
	}

	.test-cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.test-card {
		background: white;
		border: 1px solid #e9ecef;
		border-radius: 6px;
		padding: 1rem;
		text-align: center;
	}

	.test-card strong {
		display: block;
		color: #495057;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.test-card p {
		font-family: 'Courier New', monospace;
		font-size: 1rem;
		font-weight: bold;
		color: #007bff;
		margin: 0.5rem 0;
		letter-spacing: 1px;
	}

	.test-card small {
		color: #6c757d;
		font-size: 0.8rem;
	}

	.test-info {
		background: #e7f3ff;
		border: 1px solid #b8daff;
		border-radius: 4px;
		padding: 1rem;
	}

	.test-info p {
		margin: 0.25rem 0;
		font-size: 0.9rem;
		color: #004085;
	}

	.payment-form {
		background: white;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		padding: 1.5rem;
	}

	.payment-form h4 {
		margin: 0 0 1rem 0;
		color: #495057;
		font-size: 1.1rem;
	}

	#card-element {
		margin-bottom: 1rem;
		padding: 0.75rem;
		border: 1px solid #ced4da;
		border-radius: 4px;
		background: white;
	}

	button {
		background: #007bff;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s ease;
		width: 100%;
	}

	button:hover:not(:disabled) {
		background: #0056b3;
	}

	button:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}

	.error {
		color: #dc3545;
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: 4px;
		padding: 0.75rem;
		margin-top: 1rem;
		font-size: 0.9rem;
	}
</style>