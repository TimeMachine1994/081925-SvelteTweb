<script lang="ts">
	// Showcase wrapper: reuse the real public invoice payment page (amounts in cents).
	import Real from '../../../pay/[invoiceId]/+page.svelte';

	const data: any = {
		invoice: {
			id: 'TS-2026-2001',
			status: 'unpaid',
			customerName: 'Jordan Rivera',
			customerEmail: 'family@example.com',
			lovedOneName: 'Jane Eleanor Doe',
			dueDate: '2026-05-08T00:00:00.000Z',
			items: [
				{ name: 'Tributestream Live (2 hours)', quantity: 1, price: 129900, total: 129900 },
				{ name: 'Professional Photography', quantity: 1, price: 40000, total: 40000 }
			],
			subtotal: 169900,
			total: 169900
		},
		error: null
	};
</script>

<Real {data} />
