<script lang="ts">
	import type { Tier } from '$lib/types/livestream';

	let { selectedTier, onchange }: { selectedTier: Tier; onchange: (tier: Tier) => void } = $props();

	console.log('👑 TierSelector Initializing...', { selectedTier });

	function selectTier(tier: Tier) {
		console.log('👑 Tier selected:', tier);
		onchange(tier);
	}

	const tiers = [
		{
			name: 'Event Record',
			alias: 'record',
			price: 699,
			features: [
				'2 Hours of Event Streaming',
				'Custom Event Link',
				'HD Recording Download',
				'One Year Cloud Hosting',
				'DIY Livestream Kit'
			]
		},
		{
			name: 'Event Live',
			alias: 'live',
			price: 1299,
			features: [
				'2 Hours of Event Streaming',
				'Custom Event Link',
				'HD Recording Download',
				'One Year Cloud Hosting',
				'Professional Videographer',
				'On-Site Livestream Technician'
			]
		},
		{
			name: 'Event Premium',
			alias: 'legacy',
			price: 1599,
			features: [
				'2 Hours of Event Streaming',
				'Custom Event Link',
				'HD Recording Download',
				'One Year Cloud Hosting',
				'Professional Videographer',
				'On-Site Livestream Technician',
				'Professional Video Editing',
				'Custom USB Drive & Keepsake Box'
			]
		}
	];
</script>

<div class="card p-4 md:p-6">
	<h2 class="h2 mb-6 text-center">Choose Your Package</h2>
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		{#each tiers as tier}
			<button
				class="card card-hover space-y-4 p-4 text-left transition-all duration-200 border-2"
				class:border-blue-500={selectedTier === tier.alias}
				class:bg-blue-50={selectedTier === tier.alias}
				class:border-gray-200={selectedTier !== tier.alias}
				class:bg-white={selectedTier !== tier.alias}
				onclick={() => selectTier(tier.alias as Tier)}
			>
				<h3 class="h3 text-slate-900">{tier.name}</h3>
				<p class="h1 font-bold text-blue-600">${tier.price}</p>
				<ul class="list-inside list-disc space-y-2">
					{#each tier.features as feature}
						<li>{feature}</li>
					{/each}
				</ul>
			</button>
		{/each}
	</div>
</div>
