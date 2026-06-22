<script lang="ts">
	// Reuse the real admin receipts data grid with mock receipts.
	import RealReceipts from '../../../admin/services/receipts/+page.svelte';
	import { adminReceipts } from '../../_lib/mocks/receipts';

	const receipts = adminReceipts.map((r) => ({
		...r,
		ownerEmail: r.email,
		ownerName: r.customerName
	}));

	const data: any = { receipts, searchQuery: '' };
</script>

<RealReceipts {data} />
