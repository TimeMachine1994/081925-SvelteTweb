<script lang="ts">
	import type { Tier } from '$lib/types/livestream';
	import { createEventDispatcher } from 'svelte';

	let { selectedTier } = $props<{ selectedTier: Tier }>();
	const dispatch = createEventDispatcher<{ change: Tier }>();

	console.log('👑 TierSelector Initializing...', { selectedTier });

	function selectTier(tier: Tier) {
		console.log('👑 Tier selected:', tier);
		// Don't update the prop directly, just dispatch the event
		dispatch('change', tier);
	}

	const tiers = [
		{
			name: 'Tributestream Solo',
			alias: 'solo',
			price: 599,
			features: [
				'2 Hours of Broadcast Time',
				'Custom Link',
				'Complimentary Download',
				'One Year Hosting',
				'DIY Livestream Kit'
			]
		},
		{
			name: 'Tributestream Live',
			alias: 'live',
			price: 1299,
			features: [
				'2 Hours of Broadcast Time',
				'Custom Link',
				'Complimentary Download',
				'One Year Hosting',
				'Professional Videographer',
				'Professional Livestream Tech'
			]
		},
		{
			name: 'Tributestream Legacy',
			alias: 'legacy',
			price: 1599,
			features: [
				'2 Hours of Broadcast Time',
				'Custom Link',
				'Complimentary Download',
				'One Year Hosting',
				'Professional Videographer',
				'Professional Livestream Tech',
				'Video Editing',
				'Engraved USB Drive and Wooden Keepsake Box'
			]
		}
	];
</script>

<div class="tier-selector">
	<h2>Choose Your Package</h2>
	<div class="tiers">
		{#each tiers as tier}
			<button
				class="tier"
				class:selected={selectedTier === tier.name}
				onclick={() => dispatch('change', tier.name as Tier)}
			>
				<h3>{tier.name}</h3>
				<p class="price">${tier.price}</p>
				<ul>
					{#each tier.features as feature}
						<li>{feature}</li>
					{/each}
				</ul>
			</button>
		{/each}
	</div>
</div>

<style>
	.tier-selector {
		text-align: center;
	}
	.tiers {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}
	.tier {
		border: 1px solid #ccc;
		padding: 1rem;
		border-radius: 5px;
		text-align: left;
		background: #f9f9f9;
		cursor: pointer;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}
	.tier:hover {
		transform: translateY(-5px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	.tier.selected {
		border-color: var(--color-primary);
		box-shadow: 0 0 10px rgba(var(--color-primary-rgb), 0.5);
	}
	.price {
		font-size: 1.5rem;
		font-weight: bold;
		margin: 0.5rem 0;
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	li {
		margin-bottom: 0.5rem;
	}
</style>