<script lang="ts">
	import type { Memorial } from '$lib/types/memorial';

	let { memorial, variant = 'primary' }: { 
		memorial: Memorial; 
		variant?: 'primary' | 'secondary' 
	} = $props();

	console.log('💳 PayNowButton rendering for memorial:', memorial.id);

	function handlePayNow() {
		console.log('🚀 Redirecting to payment for memorial:', memorial.id);
		const paymentUrl = `/app/book/${memorial.id}`;
		window.location.href = paymentUrl;
	}

	const baseClasses = "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors";
	const primaryClasses = "bg-purple-600 hover:bg-purple-700 text-white";
	const secondaryClasses = "bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300";
</script>

<button 
	onclick={handlePayNow}
	class="{baseClasses} {variant === 'primary' ? primaryClasses : secondaryClasses}"
>
	<span class="text-sm">🛒</span>
	Pay Now
</button>