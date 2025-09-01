<script lang="ts">
	import Summary from './Summary.svelte';
	import StripeCheckout from './StripeCheckout.svelte';
	import TierSelector from './TierSelector.svelte';
	import ServiceDetailsForm from './ServiceDetailsForm.svelte';
	import AdditionalServicesForm from './AdditionalServicesForm.svelte';
	import ProgressBar from './ProgressBar.svelte';
	import type {
		CalculatorFormData,
		Tier,
		BookingItem,
		LivestreamConfig
	} from '$lib/types/livestream';
	import type { Memorial } from '$lib/types/memorial';
	import { onMount } from 'svelte';
	import { auth } from '$lib/firebase';
	import { goto } from '$app/navigation'; // Import goto

	let {
		memorialId,
		data
	}: {
		memorialId: string | null;
		data: { memorial: Memorial | null; config: LivestreamConfig | null };
	} = $props();

	console.log('🧮 Calculator Component Initializing...', { memorialId, data });

	type Step = 'tier' | 'details' | 'addons' | 'payment';

	let currentStep = $state<Step>('tier');
	const steps: Step[] = ['tier', 'details', 'addons', 'payment'];
	let currentStepIndex = $derived(steps.indexOf(currentStep));

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
		if (data.config) {
			console.log('📝 Pre-filling form with existing config data:', data.config);
			formData = data.config.formData;
			console.log('bookingItems:', data.config.bookingItems);
			const basePackage = data.config.bookingItems.find(
				(item) => item.package.includes('Tributestream')
			);
			console.log('basePackage:', basePackage);
			if (basePackage) {
				selectedTier = basePackage.id as Tier;
			}
			if (data.config.currentStep) {
				currentStep = data.config.currentStep;
			}
			configId = data.config.id;
		} else if (data.memorial) {
			console.log('📝 Pre-filling form with memorial data:', data.memorial);
			formData.lovedOneName = data.memorial.lovedOneName;
		}
	});

	$inspect(formData, selectedTier, currentStep, clientSecret, configId);

	// Debounce function
	function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
		let timeout: ReturnType<typeof setTimeout>;
		return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
			clearTimeout(timeout);
			timeout = setTimeout(() => func.apply(this, args), wait);
		};
	}

	async function saveProgress() {
		if (!configId) return;
		console.log('🔄 Autosaving progress...');
		const payload = {
			formData,
			bookingItems,
			total,
			currentStep,
			selectedTier
		};
		try {
			await fetch(`/api/bookings/${configId}/autosave`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
		} catch (error) {
			console.error('🔥 Autosave failed:', error);
		}
	}

	const debouncedSaveProgress = debounce(saveProgress, 1000);

	$effect(() => {
		// Trigger autosave when formData or selectedTier changes
		if (formData || selectedTier) {
			debouncedSaveProgress();
		}
	});

	const TIER_PRICES: Record<string, number> = {
		solo: 599,
		live: 1299,
		legacy: 1599
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
			const price = TIER_PRICES[selectedTier];
			console.log(`Tier: ${selectedTier}, Price: ${price}`);
			items.push({
				id: selectedTier,
				name: `Tributestream ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`,
				package: `Tributestream ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`,
				price: price,
				quantity: 1,
				total: price
			});
		}

		// 2. Hourly Overage Charges
		const mainOverageHours = Math.max(0, formData.mainService.hours - 2);
		if (mainOverageHours > 0) {
			items.push({
				id: 'main_overage',
				name: 'Main Location Overage',
				package: 'Add-on',
				price: HOURLY_OVERAGE_RATE,
				quantity: mainOverageHours,
				total: HOURLY_OVERAGE_RATE * mainOverageHours
			});
		}

		// 3. Additional Location
		if (formData.additionalLocation.enabled) {
			items.push({
				id: 'addl_location_fee',
				name: 'Additional Location Fee',
				package: 'Add-on',
				price: ADDITIONAL_SERVICE_FEE,
				quantity: 1,
				total: ADDITIONAL_SERVICE_FEE
			});
			const addlLocationOverage = Math.max(0, formData.additionalLocation.hours - 2);
			if (addlLocationOverage > 0) {
				items.push({
					id: 'addl_location_overage',
					name: 'Add. Location Overage',
					package: 'Add-on',
					price: HOURLY_OVERAGE_RATE,
					quantity: addlLocationOverage,
					total: HOURLY_OVERAGE_RATE * addlLocationOverage
				});
			}
		}

		// 4. Additional Day
		if (formData.additionalDay.enabled) {
			items.push({
				id: 'addl_day_fee',
				name: 'Additional Day Fee',
				package: 'Add-on',
				price: ADDITIONAL_SERVICE_FEE,
				quantity: 1,
				total: ADDITIONAL_SERVICE_FEE
			});
			const addlDayOverage = Math.max(0, formData.additionalDay.hours - 2);
			if (addlDayOverage > 0) {
				items.push({
					id: 'addl_day_overage',
					name: 'Add. Day Overage',
					package: 'Add-on',
					price: HOURLY_OVERAGE_RATE,
					quantity: addlDayOverage,
					total: HOURLY_OVERAGE_RATE * addlDayOverage
				});
			}
		}

		// 5. Add-ons
		if (formData.addons.photography) {
			items.push({
				id: 'photography',
				name: 'Photography',
				package: 'Add-on',
				price: ADDON_PRICES.photography,
				quantity: 1,
				total: ADDON_PRICES.photography
			});
		}
		if (formData.addons.audioVisualSupport) {
			items.push({
				id: 'av_support',
				name: 'Audio/Visual Support',
				package: 'Add-on',
				price: ADDON_PRICES.audioVisualSupport,
				quantity: 1,
				total: ADDON_PRICES.audioVisualSupport
			});
		}
		if (formData.addons.liveMusician) {
			items.push({
				id: 'live_musician',
				name: 'Live Musician',
				package: 'Add-on',
				price: ADDON_PRICES.liveMusician,
				quantity: 1,
				total: ADDON_PRICES.liveMusician
			});
		}
		if (formData.addons.woodenUsbDrives > 0) {
			const isLegacy = selectedTier === 'legacy';
			const usbDrives = formData.addons.woodenUsbDrives;
			const includedDrives = isLegacy ? 1 : 0;

			if (usbDrives > includedDrives) {
				const billableDrives = usbDrives - includedDrives;
				// First billable drive logic
				if (billableDrives > 0 && includedDrives === 0) {
					items.push({
						id: 'usb_drive_first',
						name: 'Wooden USB Drive',
						package: 'Add-on',
						price: ADDON_PRICES.woodenUsbDrives,
						quantity: 1,
						total: ADDON_PRICES.woodenUsbDrives
					});
					if (billableDrives > 1) {
						items.push({
							id: 'usb_drive_additional',
							name: 'Additional Wooden USB Drives',
							package: 'Add-on',
							price: 100,
							quantity: billableDrives - 1,
							total: 100 * (billableDrives - 1)
						});
					}
				} else {
					items.push({
						id: 'usb_drive_additional',
						name: 'Additional Wooden USB Drives',
						package: 'Add-on',
						price: 100,
						quantity: billableDrives,
						total: 100 * billableDrives
					});
				}
			}
		}

		console.log('📝 Booking items recalculated:', items);
		return items;
	});

	let total = $derived(bookingItems.reduce((acc, item) => acc + item.total, 0));

	$inspect(bookingItems, total);

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

	async function saveAndPayLater(isPayNowFlow = false) {
		console.log('🚀 saveAndPayLater function called');
		if (!configId) {
			console.error('❌ Cannot save progress without a booking ID.');
			alert('An error occurred. Please try again.');
			return;
		}

		const payload = {
			formData,
			bookingItems,
			total,
			currentStep
		};

		try {
			const response = await fetch(`/api/bookings/${configId}/save-progress`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (response.ok) {
				console.log('✅ Progress saved successfully!');
				if (!isPayNowFlow) {
					alert('Your progress has been saved.');
					goto('/my-portal');
				}
			} else {
				const error = await response.json();
				console.error('❌ Failed to save progress:', error);
				alert('Failed to save progress. Please try again.');
			}
		} catch (error) {
			console.error('💥 Error saving progress:', error);
			alert('An error occurred while saving. Please check your connection and try again.');
		}
	}

	async function proceedToPayment() {
		console.log('💳 Proceeding to payment...');
		if (!memorialId) {
			console.error('Memorial ID is required to proceed to payment.');
			// Optionally, display an error to the user
			return;
		}
		const payload = {
			formData: formData,
			bookingItems: bookingItems,
			total: total,
			memorialId: memorialId
		};
		console.log('📦 Payload for payment:', payload);

		const response = await fetch('/app/calculator?/continueToPayment', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		const result = await response.json();
		console.log('💳 Payment initiation response:', result);

		if (result.success) {
			console.log('✅ Payment initiated successfully!', result);
			clientSecret = result.clientSecret;
			configId = result.configId;
			currentStep = 'payment';
		} else {
			console.error('🔥 Failed to initiate payment:', result);
			// Optionally, display an error to the user
		}
	}

	function nextStep() {
		const currentIndex = steps.indexOf(currentStep);
		if (currentIndex < steps.length - 1) {
			currentStep = steps[currentIndex + 1];
		}
	}

	function prevStep() {
		const currentIndex = steps.indexOf(currentStep);
		if (currentIndex > 0) {
			currentStep = steps[currentIndex - 1];
		}
	}

	async function handlePayNow() {
		console.log('💰 Pay Now button clicked, attempting to save data first...');
		await saveAndPayLater(true); // Pass a flag to indicate this is part of the "Pay Now" flow
		currentStep = 'payment';
	}
</script>

<ProgressBar {currentStepIndex} />

<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
	<div class="lg:col-span-2 space-y-8">
		{#if currentStep === 'tier'}
			<TierSelector {selectedTier} on:change={(e) => handleTierChange(e.detail)} />
		{:else if currentStep === 'details'}
			<ServiceDetailsForm bind:formData />
		{:else if currentStep === 'addons'}
			<AdditionalServicesForm bind:formData />
		{:else if currentStep === 'payment'}
			{#if memorialId}
				<StripeCheckout amount={total} {memorialId} lovedOneName={formData.lovedOneName} />
			{/if}
		{/if}
	</div>

	<div class="lg:col-span-1">
		<Summary
			{bookingItems}
			{total}
			on:save={() => saveAndPayLater()}
			on:pay={proceedToPayment}
			on:payNow={handlePayNow}
		/>
		<div class="mt-4 flex justify-between">
			<button class="btn preset-tonal-surface" onclick={prevStep} disabled={currentStepIndex === 0}>
				Back
			</button>
			<button class="btn preset-tonal-surface" onclick={() => saveAndPayLater()}>
				Save for Later
			</button>
			<button class="btn preset-filled-primary" onclick={nextStep} disabled={currentStepIndex === steps.length - 1}>
				Next
			</button>
		</div>
	</div>
</div>