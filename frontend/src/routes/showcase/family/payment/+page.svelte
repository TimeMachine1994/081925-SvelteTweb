<script lang="ts">
	// The real /payment route is just a redirect interstitial to Stripe (no UI),
	// so the showcase presents a representative mock checkout. The "Pay" link is
	// remapped to the receipt screen by the showcase interceptor.
	import { CreditCard, Lock, ShieldCheck } from 'lucide-svelte';
	import { receiptData } from '../../_lib/mocks/receipts';

	const items = receiptData.bookingData.items;
	const total = receiptData.bookingData.total;
	const fmt = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
</script>

<div class="checkout">
	<div class="checkout-card">
		<header class="checkout-header">
			<h1>Secure Checkout</h1>
			<p>Complete your Tributestream booking</p>
		</header>

		<div class="checkout-body">
			<section class="summary">
				<h2>Order Summary</h2>
				{#each items as item (item.name)}
					<div class="line">
						<span>{item.name}</span>
						<span class="amount">{fmt(item.total)}</span>
					</div>
				{/each}
				<div class="line total">
					<span>Total</span>
					<span class="amount">{fmt(total)}</span>
				</div>
			</section>

			<section class="pay">
				<h2><CreditCard class="icon" /> Payment Details</h2>
				<label class="field">
					<span>Card number</span>
					<input type="text" value="4242 4242 4242 4242" readonly />
				</label>
				<div class="field-row">
					<label class="field">
						<span>Expiry</span>
						<input type="text" value="12 / 28" readonly />
					</label>
					<label class="field">
						<span>CVC</span>
						<input type="text" value="123" readonly />
					</label>
				</div>
				<label class="field">
					<span>Name on card</span>
					<input type="text" value="Jordan Rivera" readonly />
				</label>

				<a class="pay-button" href="/payment/receipt">
					<Lock class="icon" /> Pay {fmt(total)}
				</a>
				<p class="secure-note">
					<ShieldCheck class="icon" /> Payments are securely processed by Stripe.
				</p>
			</section>
		</div>
	</div>
</div>

<style>
	.checkout {
		min-height: 100vh;
		background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
		padding: 3rem 1rem;
		display: flex;
		justify-content: center;
		align-items: flex-start;
	}
	.checkout-card {
		background: #fff;
		border-radius: 16px;
		max-width: 880px;
		width: 100%;
		overflow: hidden;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
	}
	.checkout-header {
		background: linear-gradient(135deg, #d5ba7f 0%, #b8a06b 100%);
		color: #1a1a1a;
		padding: 1.75rem 2rem;
		text-align: center;
	}
	.checkout-header h1 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
	}
	.checkout-header p {
		margin: 0.25rem 0 0;
		opacity: 0.85;
	}
	.checkout-body {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
	}
	.summary,
	.pay {
		padding: 2rem;
	}
	.summary {
		background: #f9fafb;
		border-right: 1px solid #e5e7eb;
	}
	.summary h2,
	.pay h2 {
		font-size: 1.15rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 1.25rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.line {
		display: flex;
		justify-content: space-between;
		padding: 0.6rem 0;
		border-bottom: 1px solid #eef0f2;
		color: #374151;
		font-size: 0.95rem;
	}
	.line.total {
		border-bottom: none;
		margin-top: 0.5rem;
		font-weight: 700;
		font-size: 1.15rem;
		color: #111827;
	}
	.amount {
		font-variant-numeric: tabular-nums;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-bottom: 1rem;
	}
	.field span {
		font-size: 0.85rem;
		font-weight: 600;
		color: #4b5563;
	}
	.field input {
		padding: 0.7rem 0.9rem;
		border: 2px solid #d1d5db;
		border-radius: 8px;
		font-size: 1rem;
		background: #fff;
		color: #111827;
	}
	.field-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	.pay-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		margin-top: 0.5rem;
		padding: 0.9rem 1rem;
		background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
		color: #d5ba7f;
		border-radius: 10px;
		font-weight: 700;
		font-size: 1.05rem;
		text-decoration: none;
		transition: transform 0.15s ease;
	}
	.pay-button:hover {
		transform: translateY(-1px);
	}
	.secure-note {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		margin: 1rem 0 0;
		color: #6b7280;
		font-size: 0.85rem;
	}
	:global(.checkout .icon) {
		width: 1.05rem;
		height: 1.05rem;
	}
	@media (max-width: 720px) {
		.checkout-body {
			grid-template-columns: 1fr;
		}
		.summary {
			border-right: none;
			border-bottom: 1px solid #e5e7eb;
		}
	}
</style>
