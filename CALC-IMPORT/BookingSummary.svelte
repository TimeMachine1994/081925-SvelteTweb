<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { PACKAGES, RATES } from '$lib/data/calculator';
	import { cn, fmt, slugify } from '$lib/utils/calculator';

	// Types
	export type PackageKey = 'record' | 'live' | 'legacy';

	export type AddOns = {
		extraHours: number;
		extraDays: number;
		editing: boolean;
		usbBox: boolean;
		extraVideographer: boolean;
		extraTech: boolean;
	};

	export type FormState = {
		lovedOneName: string;
		memorialDate: string;
		// ... other form fields
	};

	// Props
	let {
		selectedPackage,
		addOns,
		form,
		step
	}: {
		selectedPackage: PackageKey | null;
		addOns: AddOns;
		form: FormState;
		step: number;
	} = $props();

	const dispatch = createEventDispatcher();

	// Reactive declarations
	const breakdown = $derived.by(() => {
		const items: Array<{ label: string; amount: number }> = [];
		let total = 0;
		if (selectedPackage) {
			const base = PACKAGES[selectedPackage].price;
			items.push({ label: PACKAGES[selectedPackage].name, amount: base });
			total += base;
		}
		if (addOns.extraHours > 0) {
			const amt = addOns.extraHours * RATES.extraHour;
			items.push({ label: `${addOns.extraHours}× Extra Hour`, amount: amt });
			total += amt;
		}
		if (addOns.extraDays > 0) {
			const amt = addOns.extraDays * RATES.extraDaySetup;
			items.push({ label: `${addOns.extraDays}× Extra Day Setup`, amount: amt });
			total += amt;
		}
		if (addOns.editing) {
			items.push({ label: 'Editing Upgrade', amount: RATES.editing });
			total += RATES.editing;
		}
		if (addOns.usbBox) {
			items.push({ label: 'Engraved USB + Box', amount: RATES.usbBox });
			total += RATES.usbBox;
		}
		if (addOns.extraVideographer) {
			items.push({ label: 'Additional Videographer', amount: RATES.extraVideographer });
			total += RATES.extraVideographer;
		}
		if (addOns.extraTech) {
			items.push({ label: 'Additional Livestream Tech', amount: RATES.extraTech });
			total += RATES.extraTech;
		}

		return { items, total };
	});

	 
</script>

<div class="sticky top-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
	<h3 class="text-lg font-semibold">Booking Summary</h3>
	<p class="mt-1 text-xs text-gray-600">
		Pricing updates in real time. One‑year hosting is included and does not auto‑renew.
		Complimentary downloads are permanent.
	</p>
	<div class="mt-4 space-y-2">
		{#if breakdown.items.length === 0}
			<p class="text-sm text-gray-600">Select a package to begin.</p>
		{/if}
		{#each breakdown.items as row (row.label)}
			<div class="flex items-center justify-between text-sm">
				<span>{row.label}</span>
				<span class="font-medium">{fmt(row.amount)}</span>
			</div>
		{/each}
		<div class="flex items-center justify-between border-t pt-2 mt-2">
			<span class="text-sm font-semibold">Total</span>
			<span class="text-lg font-bold" style="color: #D5BA7F">{fmt(breakdown.total)}</span>
		</div>
	</div>
	 
	<div class="mt-4 flex gap-2">
		<button
			class="flex-1 rounded-xl border px-4 py-2 text-sm"
			onclick={() => dispatch('save')}
		>
			Save and Pay Later
		</button>
		<button
			class={cn(
				'flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-black',
				step !== 4 && 'opacity-50 cursor-not-allowed'
			)}
			style="background-color: #D5BA7F"
			disabled={step !== 4}
			onclick={() => dispatch('pay')}
		>
			Pay Now
		</button>
	</div>
	<p class="mt-3 text-[11px] text-gray-500">
		You can extend hosting anytime after purchase. No hidden fees — travel and special requests
		quoted separately.
	</p>
</div>