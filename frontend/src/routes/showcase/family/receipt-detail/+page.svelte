<script lang="ts">
	// Showcase wrapper: reuse the real shareable Receipt page with a mock receipt.
	import Real from '../../../receipt/[receiptId]/+page.svelte';

	const data: any = {
		receipt: {
			id: 'rcpt-1001',
			status: 'paid',
			paymentIntentId: 'pi_DEMO_3Nk29s8a7',
			paidAt: '2026-05-01T12:30:00.000Z',
			customerName: 'Jordan Rivera',
			customerEmail: 'family@example.com',
			lovedOneName: 'Jane Eleanor Doe',
			amount: 1699,
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
