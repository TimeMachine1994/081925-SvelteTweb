<script lang="ts">
	import BookingForm from './BookingForm.svelte';
	import Summary from './Summary.svelte';
	import StripeCheckout from './StripeCheckout.svelte';
	import TierSelector from './TierSelector.svelte';
	import type {
		CalculatorFormData,
		Tier,
		BookingItem,
		LivestreamConfig
	} from '$lib/types/livestream';
	import type { Memorial } from '$lib/types/memorial';
	import { onMount } from 'svelte';
	import { auth } from '$lib/firebase';
	import { useAutoSave } from '$lib/composables/useAutoSave';

	let {
		memorialId,
		data
	}: {
		memorialId: string | null;
		data: { memorial: Memorial | null; config: LivestreamConfig | null };
	} = $props();

	console.log('🧮 Calculator Component Initializing...', { memorialId, data });

	let currentStep = $state<'booking' | 'payment' | 'payNow'>('booking');
	let clientSecret = $state<string | null>(null);
	let configId = $state<string | null>(null);
	let selectedTier = $state<Tier>('solo');
	
	// Auto-save functionality
	let autoSaveEnabled = $state(false);
	let showAutoSaveStatus = $state(false);

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

	// Initialize auto-save when memorialId is available
	const autoSave = memorialId ? useAutoSave({
		memorialId,
		delay: 3000, // 3 second delay
		onSave: (success, error) => {
			showAutoSaveStatus = true;
			if (!success && error) {
				console.error('Auto-save failed:', error);
			}
			// Hide status after 2 seconds
			setTimeout(() => {
				showAutoSaveStatus = false;
			}, 2000);
		},
		onLoad: (data) => {
			if (data) {
				console.log('📖 Auto-saved data loaded, prompting user...');
				// Show restore prompt
			}
		}
	}) : null;

	onMount(async () => {
		if (data.config) {
			console.log('📝 Pre-filling form with existing config data:', data.config);
			formData = data.config.formData;
			const basePackage = data.config.bookingItems.find(
				(item) => item.package.includes('Tributestream')
			);
			if (basePackage) {
				selectedTier = basePackage.id as Tier;
			}
		} else if (data.memorial) {
			console.log('📝 Pre-filling form with memorial data:', data.memorial);
			formData.lovedOneName = data.memorial.lovedOneName;
			
			// Try to load auto-saved data if no existing config
			if (autoSave && memorialId) {
				const autoSavedData = await autoSave.loadAutoSavedData();
				if (autoSavedData) {
					const shouldRestore = confirm('We found an auto-saved version of your schedule. Would you like to restore it?');
					if (shouldRestore) {
						formData = autoSavedData;
						console.log('✅ Auto-saved data restored');
					}
				}
			}
		}
		
		// Enable auto-save after initial load
		if (memorialId) {
			autoSaveEnabled = true;
			console.log('🔄 Auto-save enabled for memorial:', memorialId);
		}
	});

	$inspect(formData, selectedTier, currentStep, clientSecret, configId);

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
			woodenUsbDrives: tier === 'legacy' ? 1 : 0
		};
		
		// Trigger auto-save when tier changes
		if (autoSaveEnabled && autoSave) {
			autoSave.triggerAutoSave(formData);
		}
	}

	// Watch for form data changes and trigger auto-save
	$effect(() => {
		if (autoSaveEnabled && autoSave && memorialId) {
			// Only auto-save if we have meaningful data
			if (formData.lovedOneName || selectedTier) {
				autoSave.triggerAutoSave(formData);
			}
		}
	});

	async function saveAndPayLater(isPayNowFlow = false) {
		console.log('🚀 saveAndPayLater function called');
		console.log('📊 Current state check:');
		console.log('  - selectedTier:', selectedTier);
		console.log('  - formData:', formData);
		console.log('  - bookingItems:', bookingItems);
		console.log('  - total:', total);
		console.log('  - auth.currentUser:', auth.currentUser);
		
		try {
			console.log('💾 Starting save and pay later process...');
			
			// Validate required data
			if (!selectedTier) {
				console.error('❌ No tier selected!');
				return;
			}
			
			if (bookingItems.length === 0) {
				console.error('❌ No booking items found!');
				return;
			}
			
			if (total <= 0) {
				console.error('❌ Invalid total amount:', total);
				return;
			}
			
			console.log('✅ Data validation passed');
			
			// Prepare form data
			console.log('📦 Preparing FormData...');
			const formDataToSend = new FormData();
			
			const formDataJson = JSON.stringify(formData);
			const bookingItemsJson = JSON.stringify(bookingItems);
			const totalString = total.toString();
			
			console.log('📝 Data to send:');
			console.log('  - formData JSON length:', formDataJson.length);
			console.log('  - bookingItems JSON length:', bookingItemsJson.length);
			console.log('  - total string:', totalString);
			
			formDataToSend.append('formData', formDataJson);
			formDataToSend.append('bookingItems', bookingItemsJson);
			formDataToSend.append('total', totalString);
			if (memorialId) {
				formDataToSend.append('memorialId', memorialId);
			}
			
			console.log('✅ FormData prepared successfully');
			
			// Make the request
			console.log('🌐 Making fetch request to /app/calculator?/saveAndPayLater');
			const response = await fetch('/app/calculator?/saveAndPayLater', {
				method: 'POST',
				body: formDataToSend
			});
			
			console.log('📡 Response received:');
			console.log('  - status:', response.status);
			console.log('  - statusText:', response.statusText);
			console.log('  - ok:', response.ok);
			console.log('  - headers:', Object.fromEntries(response.headers.entries()));
			
			if (!response.ok) {
				console.error('❌ Response not OK:', response.status, response.statusText);
				const errorText = await response.text();
				console.error('❌ Error response body:', errorText);
				return;
			}
			
			console.log('🔄 Parsing JSON response...');
			const result = await response.json();
			console.log('✅ Save response parsed:', result);

			if (result.type === 'redirect' && !isPayNowFlow) {
				console.log(`🔀 Server initiated redirect to: ${result.location}`);
				window.location.href = result.location;
				return;
			}

			if (result.type === 'failure') {
				console.error('❌ Save failed:', result.data);
				alert(`Save failed: ${result.data?.details || result.data?.error || 'Unknown error'}`);
				return;
			}

			if (result.type === 'success' && result.data?.success) {
				console.log('🎉 Configuration saved successfully!', result.data);
				if (!isPayNowFlow) {
					alert('Configuration saved successfully!');
				}
			} else {
				console.error('❌ An unexpected error occurred:', result);
				alert('An unexpected error occurred. Please try again.');
			}
			
		} catch (error) {
			console.error('💥 Error in saveAndPayLater function:', error);
			console.error('📍 Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
			// TODO: Show error message to user
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

	async function handlePayNow() {
		console.log('💰 Pay Now button clicked, attempting to save data first...');
		await saveAndPayLater(true); // Pass a flag to indicate this is part of the "Pay Now" flow
		currentStep = 'payNow';
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
	<div class="lg:col-span-2 space-y-8">
		<!-- Auto-save Status -->
		{#if autoSaveEnabled && showAutoSaveStatus && autoSave}
			<div class="fixed top-4 right-4 z-50 transition-all duration-300">
				{#if autoSave.isSaving()}
					<div class="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
						<div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
						<span class="text-sm">Auto-saving...</span>
					</div>
				{:else if autoSave.lastSaved()}
					<div class="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
						</svg>
						<span class="text-sm">Auto-saved</span>
					</div>
				{:else if autoSave.hasUnsavedChanges()}
					<div class="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
						</svg>
						<span class="text-sm">Unsaved changes</span>
					</div>
				{/if}
			</div>
		{/if}

		{#if currentStep === 'booking'}
			<TierSelector {selectedTier} onchange={handleTierChange} />
			{#if selectedTier}
				<BookingForm bind:formData />
			{/if}
		{:else if currentStep === 'payNow'}
			{#if memorialId}
				<StripeCheckout amount={total} {memorialId} lovedOneName={formData.lovedOneName} />
			{/if}
		{:else}
			{#if clientSecret && configId && memorialId}
				<StripeCheckout
					amount={total}
					{memorialId}
					lovedOneName={formData.lovedOneName}
				/>
			{:else}
				<div class="card p-4 text-center">
					<p>There was an error preparing the payment form. Please try again.</p>
					<button class="btn preset-filled-primary mt-4" onclick={() => currentStep = 'booking'}>Go Back</button>
				</div>
			{/if}
		{/if}
	</div>

	<div class="lg:col-span-1">
		<Summary {bookingItems} {total} onsave={() => saveAndPayLater()} onpay={proceedToPayment} onpayNow={handlePayNow} />
		
		<!-- Auto-save Info Panel -->
		{#if autoSaveEnabled && autoSave}
			<div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
				<div class="flex items-center space-x-2 mb-2">
					<svg class="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path>
					</svg>
					<span class="text-sm font-medium text-gray-700">Auto-save</span>
				</div>
				<p class="text-xs text-gray-500">
					{#if autoSave.lastSaved()}
						Last saved: {autoSave.lastSaved()?.toLocaleTimeString()}
					{:else}
						Changes are automatically saved as you work
					{/if}
				</p>
				{#if autoSave.hasUnsavedChanges()}
					<p class="text-xs text-yellow-600 mt-1">You have unsaved changes</p>
				{/if}
			</div>
		{/if}
	</div>
</div>