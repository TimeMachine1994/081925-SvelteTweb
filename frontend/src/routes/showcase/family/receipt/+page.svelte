<script lang="ts">
	// Reuse the real receipt markup with mocked receipt data. Its CTAs
	// (/my-portal, /schedule) are remapped by the showcase interceptor.
	import RealReceipt from '../../../payment/receipt/+page.svelte';
	import { receiptData } from '../../_lib/mocks/receipts';

	const data: any = { receiptData };
</script>

<RealReceipt {data} />
