<script lang="ts">
	import Stepper from '$lib/components/calculator/Stepper.svelte';
	import PackageCard from '$lib/components/calculator/PackageCard.svelte';
	import BookingSummary from '$lib/components/calculator/BookingSummary.svelte';
	import Input from '$lib/components/calculator/Input.svelte';
	import Toggle from '$lib/components/calculator/Toggle.svelte';
	import { PACKAGES, EmptyForm } from '$lib/data/calculator';
	import type { PackageKey, FormState } from '$lib/types/index';

	let step = $state(1);
	let selectedPackage = $state<PackageKey | null>(null);
	let form = $state<FormState>({ ...EmptyForm });
	let addOns = $state({
		extraHours: 0,
		extraDays: 0,
		editing: false,
		usbBox: false,
		extraVideographer: false,
		extraTech: false
	});

	const canNext = $derived.by(() => {
		if (step === 1) return !!selectedPackage;
		if (step === 2) {
			return !!(form.lovedOneName && form.memorialDate && form.memorialTime && form.locationName);
		}
		return true;
	});

	function goNext() {
		if (canNext) {
			step = Math.min(4, step + 1);
		}
	}

	function goBack() {
		step = Math.max(1, step - 1);
	}

	function handleSelectPackage(event: CustomEvent<PackageKey>) {
		selectedPackage = event.detail;
	}

	function handleSave() {
		alert('Booking saved! You can return later to complete your payment.');
	}

	function handlePay() {
		alert('Proceeding to payment. This is a demo.');
	}
</script>

<div class="min-h-screen bg-gray-50">
	<header class="border-b bg-white">
		<div class="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold">Livestream Calculator</h1>
				<p class="text-xs text-gray-600">
					Example implementation applying the Laws of UX while avoiding dark patterns.
				</p>
			</div>
			<div class="flex gap-2">
				<button class="border rounded-xl px-3 py-2 text-sm">Copy</button>
				<button class="border rounded-xl px-3 py-2 text-sm">Share</button>
				<button class="border rounded-xl px-3 py-2 text-sm">Edit</button>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-6">
		<Stepper {step} />

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
			<div class="lg:col-span-2 space-y-6">
				{#if step === 1}
					<div class="space-y-4">
						<h2 class="text-xl font-semibold">Select a Package</h2>
						{#each Object.entries(PACKAGES) as [key, pkg]}
							<PackageCard
								pkgKey={key as PackageKey}
								selected={selectedPackage === key}
								on:select={() => (selectedPackage = key as PackageKey)}
							/>
						{/each}
					</div>
				{/if}

				{#if step === 2}
					<div class="bg-white p-6 rounded-lg border">
						<h2 class="text-xl font-semibold mb-4">Memorial Details</h2>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Input label="Loved One's Name" bind:value={form.lovedOneName} required />
							<Input label="Memorial Date" type="date" bind:value={form.memorialDate} required />
							<Input label="Memorial Time" type="time" bind:value={form.memorialTime} required />
							<Input label="Location Name" bind:value={form.locationName} required />
							<Input label="Location Address" bind:value={form.locationAddress} />
							<Input label="Website or Obituary Link" bind:value={form.website} />
						</div>
					</div>
				{/if}

				{#if step === 3}
					<div class="bg-white p-6 rounded-lg border">
						<h2 class="text-xl font-semibold mb-4">Add-Ons</h2>
						<div class="space-y-4">
							<Toggle bind:checked={addOns.editing} label="Video Editing" description="Professional editing for a polished final video." />
							<Toggle bind:checked={addOns.usbBox} label="Keepsake USB Box" description="A beautiful wooden box with the final video on a USB drive." />
							<Toggle bind:checked={addOns.extraVideographer} label="Extra Videographer" description="Recommended for large services or multiple locations." />
							<Toggle bind:checked={addOns.extraTech} label="Extra Tech" description="An additional technician for complex setups." />
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label for="extraHours" class="block text-sm font-medium text-gray-700">Extra Hours</label>
									<select id="extraHours" bind:value={addOns.extraHours} class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
										<option value={0}>0</option>
										<option value={1}>1</option>
										<option value={2}>2</option>
										<option value={3}>3</option>
									</select>
								</div>
								<div>
									<label for="extraDays" class="block text-sm font-medium text-gray-700">Extra Days</label>
									<select id="extraDays" bind:value={addOns.extraDays} class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
										<option value={0}>0</option>
										<option value={1}>1</option>
										<option value={2}>2</option>
										<option value={3}>3</option>
									</select>
								</div>
							</div>
						</div>
					</div>
				{/if}

				{#if step === 4}
					<div class="bg-white p-6 rounded-lg border">
						<h2 class="text-2xl font-bold text-center">Thank You!</h2>
						<p class="text-center mt-4 text-gray-600">
							This concludes the demo. You can review your booking summary on the right.
						</p>
					</div>
				{/if}

				<div class="h-24" />
			</div>

			<div>
				<BookingSummary {selectedPackage} {addOns} {form} {step} on:save={handleSave} on:pay={handlePay} />
			</div>
		</div>
	</main>

	<div class="fixed left-0 right-0 bottom-0 border-t bg-white/90 backdrop-blur">
		<div class="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
			<button
				onclick={goBack}
				class="border rounded-xl px-4 py-2"
				disabled={step === 1}
			>
				Back
			</button>
			<div class="flex items-center gap-3">
				<span class="text-sm text-gray-600 hidden sm:block">Step {step} of 4</span>
				{#if step < 4}
					<button
						onclick={goNext}
						disabled={!canNext}
						class="rounded-xl px-5 py-2.5 text-black font-semibold {canNext ? '' : 'opacity-50 cursor-not-allowed'}"
						style="background-color: #D5BA7F;"
					>
						Next
					</button>
				{:else}
					<button
						class="rounded-xl px-5 py-2.5 text-black font-semibold"
						style="background-color: #D5BA7F;"
						onclick={handlePay}
					>
						Finish
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>