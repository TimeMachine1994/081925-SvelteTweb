<script lang="ts">
	// Showcase wrapper: reuse the real invoice receipt page (amounts in cents).
	import Real from '../../../pay/[invoiceId]/receipt/+page.svelte';

	const data: any = {
		receipt: {
			invoiceId: 'TS-2026-2001',
			items: [
				{ name: 'Tributestream Live (2 hours)', quantity: 1, price: 129900, total: 129900 },
				{ name: 'Professional Photography', quantity: 1, price: 40000, total: 40000 }
			],
			total: 169900,
			customerEmail: 'family@example.com',
			customerName: 'Jordan Rivera',
			paidAt: '2026-05-01T12:30:00.000Z',
			paymentIntentId: 'pi_DEMO_3Nk29s8a7'
		},
		error: null
	};
</script>

<Real {data} />
