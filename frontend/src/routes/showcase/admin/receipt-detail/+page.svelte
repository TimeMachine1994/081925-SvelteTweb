<script lang="ts">
	// Showcase wrapper: reuse the real admin Receipt Detail page with a mock receipt.
	import Real from '../../../admin/services/receipts/[receiptId]/+page.svelte';

	const data: any = {
		receipt: {
			id: 'rcpt-1001',
			status: 'paid',
			paymentIntentId: 'pi_DEMO_3Nk29s8a7',
			checkoutSessionId: 'cs_DEMO_9f8a7b6c',
			paidAt: '2026-05-01T12:30:00.000Z',
			createdAt: '2026-05-01T12:30:00.000Z',
			customerName: 'Jordan Rivera',
			customerEmail: 'family@example.com',
			lovedOneName: 'Jane Eleanor Doe',
			amount: 1699,
			total: 1699,
			currency: 'usd',
			receiptNote: { content: '' },
			calculatorConfig: {
				bookingItems: [
					{ name: 'Tributestream Live (2 hours)', quantity: 1, price: 1299, total: 1299 },
					{ name: 'Professional Photography', quantity: 1, price: 400, total: 400 }
				]
			}
		}
	};
</script>

<Real {data} />
