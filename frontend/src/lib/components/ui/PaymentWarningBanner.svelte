<script lang="ts">
	import PayNowButton from './PayNowButton.svelte';
	import type { Memorial } from '$lib/types/memorial';

	let { memorial }: { memorial: Memorial } = $props();

	console.log('⚠️ PaymentWarningBanner rendering for memorial:', memorial.id);
</script>

<div class="bg-red-100 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
	<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
		<div class="flex-1">
			<div class="flex items-start gap-3">
				<span class="text-red-500 text-lg mt-0.5">⚠️</span>
				<div>
					<p class="text-red-800 font-medium text-sm sm:text-base">
						We request payments be made at least three days before the service start date,
						to give Tributestream adequate time to arrange staff and resources.
					</p>
				</div>
			</div>
		</div>
		<div class="flex-shrink-0">
			<PayNowButton {memorial} variant="primary" />
		</div>
	</div>
</div>