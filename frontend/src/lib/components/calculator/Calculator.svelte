<script lang="ts">
	import BookingForm from './BookingForm.svelte';
	import Summary from './Summary.svelte';
	import StripeCheckout from './StripeCheckout.svelte';
	import TierSelector from './TierSelector.svelte';
	import type { CalculatorFormData, Tier, BookingItem } from '$lib/types/livestream';
	import type { Memorial } from '$lib/types/memorial';
	import { onMount } from 'svelte';

	let { memorialId, data }: { memorialId: string | null; data: { memorial: Memorial | null } } =
		$props();

	let currentStep = $state<'booking' | 'payment'>('booking');
	let clientSecret = $state<string | null>(null);
	let configId = $state<string | null>(null);
	let selectedTier = $state<Tier>(null);

	let formData = $state<CalculatorFormData>({
		lovedOneName: '',
		mainService: {
			location: { name: '', address: '', isUnknown: false },
			time: { date: null, time: null, isUnknown: false },
			hours: 2
		},
		additionalLocation: {
			enabled: false,
			location: { name: '', address: '', isUnknown: false },
			startTime: null,
			hours: 2
		},
		additionalDay: {
			enabled: false,
			location: { name: '', address: '', isUnknown: false },
			startTime: null,
			hours: 2
		},
		funeralDirectorName: '',
		funeralHome: '',
		addons: {
			photography: false,
			audioVisualSupport: false,
			liveMusician: false,
			woodenUsbDrives: 0
		}
	});

	onMount(() => {
		if (data.memorial) {
			console.log('📝 Pre-filling form with memorial data:', data.memorial);
			formData.lovedOneName = data.memorial.lovedOneName;
			// You can pre-fill other fields here as they become available in the memorial data type
		}
	});

	const TIER_PRICES: Record<string, number> = {
		Solo: 599,
		Live: 1299,
		Legacy: 1599
	};

	const ADDON_PRICES = {
		photography: 400,
		audioVisualSupport: 200,
		liveMusician: 500,
		woodenUsbDrives: 300 // First one, then 100
	};

	const HOURLY_OVERAGE_RATE = 125;
	const ADDITIONAL_SERVICE_FEE = 325;

	let bookingItems = $derived.by(() => {
		const items: BookingItem[] = [];

		// 1. Base Package
		if (selectedTier) {
			items.push({
				id: selectedTier.toLowerCase(),
				name: `Tributestream ${selectedTier}`,
				price: TIER_PRICES[selectedTier],
				quantity: 1
			});
		}

		// 2. Hourly Overage Charges
		const mainOverageHours = Math.max(0, formData.mainService.hours - 2);
		if (mainOverageHours > 0) {
			items.push({
				id: 'main_overage',
				name: 'Main Location Overage',
				price: HOURLY_OVERAGE_RATE,
				quantity: mainOverageHours
			});
		}

		// 3. Additional Location
		if (formData.additionalLocation.enabled) {
			items.push({
				id: 'addl_location_fee',
				name: 'Additional Location Fee',
				price: ADDITIONAL_SERVICE_FEE,
				quantity: 1
			});
			const addlLocationOverage = Math.max(0, formData.additionalLocation.hours - 2);
			if (addlLocationOverage > 0) {
				items.push({
					id: 'addl_location_overage',
					name: 'Add. Location Overage',
					price: HOURLY_OVERAGE_RATE,
					quantity: addlLocationOverage
				});
			}
		}

		// 4. Additional Day
		if (formData.additionalDay.enabled) {
			items.push({
				id: 'addl_day_fee',
				name: 'Additional Day Fee',
				price: ADDITIONAL_SERVICE_FEE,
				quantity: 1
			});
			const addlDayOverage = Math.max(0, formData.additionalDay.hours - 2);
			if (addlDayOverage > 0) {
				items.push({
					id: 'addl_day_overage',
					name: 'Add. Day Overage',
					price: HOURLY_OVERAGE_RATE,
					quantity: addlDayOverage
				});
			}
		}

		// 5. Add-ons
		if (formData.addons.photography) {
			items.push({
				id: 'photography',
				name: 'Photography',
				price: ADDON_PRICES.photography,
				quantity: 1
			});
		}
		if (formData.addons.audioVisualSupport) {
			items.push({
				id: 'av_support',
				name: 'Audio/Visual Support',
				price: ADDON_PRICES.audioVisualSupport,
				quantity: 1
			});
		}
		if (formData.addons.liveMusician) {
			items.push({
				id: 'live_musician',
				name: 'Live Musician',
				price: ADDON_PRICES.liveMusician,
				quantity: 1
			});
		}
		if (formData.addons.woodenUsbDrives > 0) {
			const isLegacy = selectedTier === 'Legacy';
			const usbDrives = formData.addons.woodenUsbDrives;
			const includedDrives = isLegacy ? 1 : 0;

			if (usbDrives > includedDrives) {
				const billableDrives = usbDrives - includedDrives;
				// First billable drive logic
				if (billableDrives > 0 && includedDrives === 0) {
					items.push({
						id: 'usb_drive_first',
						name: 'Wooden USB Drive',
						price: ADDON_PRICES.woodenUsbDrives,
						quantity: 1
					});
					if (billableDrives > 1) {
						items.push({
							id: 'usb_drive_additional',
							name: 'Additional Wooden USB Drives',
							price: 100,
							quantity: billableDrives - 1
						});
					}
				} else {
					items.push({
						id: 'usb_drive_additional',
						name: 'Additional Wooden USB Drives',
						price: 100,
						quantity: billableDrives
					});
				}
			}
		}

		return items;
	});

	let total = $derived(bookingItems.reduce((acc, item) => acc + item.price * item.quantity, 0));

	function handleTierChange(tier: Tier) {
		console.log('✨ Tier selected:', tier);
		selectedTier = tier;
		// Reset relevant parts of the form when tier changes
		formData.addons = {
			photography: false,
			audioVisualSupport: false,
			liveMusician: false,
			woodenUsbDrives: 0
		};
	}

	async function saveAndPayLater() {
		const formDataObj = new FormData();
		formDataObj.append('formData', JSON.stringify(formData));

		const response = await fetch('?/saveAndPayLater', {
			method: 'POST',
			body: formDataObj
		});
		const result = await response.json();
		if (result.success) {
			// TODO: Show success message
			console.log('✅ Configuration saved!');
		}
	}

	async function continueToPayment() {
		const formDataObj = new FormData();
		formDataObj.append('formData', JSON.stringify(formData));
		formDataObj.append('total', total.toString());
		formDataObj.append('memorialId', memorialId || '');

		const response = await fetch('?/continueToPayment', {
			method: 'POST',
			body: formDataObj
		});
		const result = await response.json();
		if (result.success) {
			console.log('💳 Payment initiated!', result);
			clientSecret = result.clientSecret;
			configId = result.configId;
			currentStep = 'payment';
		}
	}
</script>

<div class="calculator">
	{#if currentStep === 'booking'}
		<div class="booking-flow">
			<TierSelector {selectedTier} on:change={(e) => handleTierChange(e.detail)} />
			{#if selectedTier}
				<BookingForm bind:formData />
			{/if}
		</div>
		<Summary {bookingItems} {total} on:save={saveAndPayLater} on:pay={continueToPayment} />
	{:else}
		{#if clientSecret && configId}
			<StripeCheckout {clientSecret} {configId} />
		{/if}
	{/if}
</div>

<style>
	.calculator {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 2rem;
		align-items: start;
	}

	.booking-flow {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
</style>