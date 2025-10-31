<script lang="ts">
	import {
		Calculator,
		DollarSign,
		Users,
		Camera,
		Clock,
		Star,
		MapPin,
		Calendar
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { useAutoSave } from '$lib/composables/useAutoSave';
	import { syncStreamsWithSchedule } from '$lib/utils/streamMapper';
	import type { CalculatorFormData, Tier } from '$lib/types/livestream';

	let { data } = $props();

	// Get memorial ID from route params
	const memorialId = $page.params.memorialId as string;

	// Loading state
	let pageLoaded = $state(true);

	// Calculator form data (design spec compliant)
	let calculatorData = $state<CalculatorFormData>({
		memorialId,
		selectedTier: 'solo',
		addons: {
			photography: false,
			audioVisualSupport: false,
			liveMusician: false,
			woodenUsbDrives: 0
		},
		createdAt: new Date(),
		updatedAt: new Date(),
		autoSaved: false
	});

	// Service data (loaded from Memorial.services)
	let services = $state({
		main: data?.memorial?.services?.main || {
			location: { name: '', address: '', isUnknown: false },
			time: { date: null, time: null, isUnknown: false },
			hours: 2
		},
		additional: data?.memorial?.services?.additional || []
	});

	// Additional service toggles (UI state)
	let additionalLocation = $state({
		enabled: false,
		location: { name: '', address: '', isUnknown: false },
		time: { date: null, time: null, isUnknown: false },
		hours: 2
	});

	let additionalDay = $state({
		enabled: false,
		location: { name: '', address: '', isUnknown: false },
		time: { date: null, time: null, isUnknown: false },
		hours: 2
	});

	// Memorial metadata
	const lovedOneName = data?.memorial?.lovedOneName || '';

	// Data structure validation logging - moved to onMount to avoid state reference warnings

	// Validate data structure matches TypeScript interface
	function validateDataStructure() {
		const errors = [];

		if (!additionalLocation.time) {
			errors.push('❌ additionalLocation.time is missing');
		} else {
			if (!('date' in additionalLocation.time))
				errors.push('❌ additionalLocation.time.date is missing');
			if (!('time' in additionalLocation.time))
				errors.push('❌ additionalLocation.time.time is missing');
			if (!('isUnknown' in additionalLocation.time))
				errors.push('❌ additionalLocation.time.isUnknown is missing');
		}

		if (!additionalDay.time) {
			errors.push('❌ additionalDay.time is missing');
		} else {
			if (!('date' in additionalDay.time)) errors.push('❌ additionalDay.time.date is missing');
			if (!('time' in additionalDay.time)) errors.push('❌ additionalDay.time.time is missing');
			if (!('isUnknown' in additionalDay.time))
				errors.push('❌ additionalDay.time.isUnknown is missing');
		}

		if (errors.length > 0) {
			console.error('🚨 [VALIDATION] Data structure errors:', errors);
			return false;
		} else {
			console.log('✅ [VALIDATION] Data structure is valid');
			return true;
		}
	}

	// Auto-save functionality
	let saveStatus = $state<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
	let lastSaved = $state('');

	// Initialize auto-save
	const autoSave = useAutoSave(memorialId, {
		delay: 2000,
		onSave: (success, error) => {
			if (success) {
				saveStatus = 'saved';
				lastSaved = new Date().toLocaleTimeString();
			} else {
				saveStatus = 'error';
				console.error('Auto-save failed:', error);
			}
		},
		onLoad: (data) => {
			if (data) {
				console.log('Auto-saved data loaded');
			}
		}
	});

	// Pricing constants
	const TIER_PRICES = {
		solo: 599,
		live: 1299,
		legacy: 1599
	};

	const ADDON_PRICES = {
		photography: 400,
		audioVisualSupport: 200,
		liveMusician: 500,
		woodenUsbDrives: 300
	};

	const HOURLY_OVERAGE_RATE = 125;
	const ADDITIONAL_SERVICE_FEE = 325;

	// Reactive calculations
	const bookingItems = $derived(calculateBookingItems());
	const totalPrice = $derived(bookingItems.reduce((acc, item) => acc + item.total, 0));

	function calculateBookingItems() {
		const items = [];

		// Base Package
		if (calculatorData.selectedTier) {
			const price = TIER_PRICES[calculatorData.selectedTier as keyof typeof TIER_PRICES];
			items.push({
				name: `Tributestream ${calculatorData.selectedTier.charAt(0).toUpperCase() + calculatorData.selectedTier.slice(1)}`,
				price: price,
				quantity: 1,
				total: price
			});
		}

		// Main Service Hourly Overage
		const mainOverageHours = Math.max(0, services.main.hours - 2);
		if (mainOverageHours > 0) {
			items.push({
				name: 'Main Location Overage',
				price: HOURLY_OVERAGE_RATE,
				quantity: mainOverageHours,
				total: HOURLY_OVERAGE_RATE * mainOverageHours
			});
		}

		// Additional Location
		if (additionalLocation.enabled) {
			items.push({
				name: 'Additional Location Fee',
				price: ADDITIONAL_SERVICE_FEE,
				quantity: 1,
				total: ADDITIONAL_SERVICE_FEE
			});
			const addlLocationOverage = Math.max(0, additionalLocation.hours - 2);
			if (addlLocationOverage > 0) {
				items.push({
					name: 'Add. Location Overage',
					price: HOURLY_OVERAGE_RATE,
					quantity: addlLocationOverage,
					total: HOURLY_OVERAGE_RATE * addlLocationOverage
				});
			}
		}

		// Additional Day
		if (additionalDay.enabled) {
			items.push({
				name: 'Additional Day Fee',
				price: ADDITIONAL_SERVICE_FEE,
				quantity: 1,
				total: ADDITIONAL_SERVICE_FEE
			});
			const addlDayOverage = Math.max(0, additionalDay.hours - 2);
			if (addlDayOverage > 0) {
				items.push({
					name: 'Add. Day Overage',
					price: HOURLY_OVERAGE_RATE,
					quantity: addlDayOverage,
					total: HOURLY_OVERAGE_RATE * addlDayOverage
				});
			}
		}

		// Add-ons
		if (calculatorData.addons.photography) {
			items.push({
				name: 'Photography',
				price: ADDON_PRICES.photography,
				quantity: 1,
				total: ADDON_PRICES.photography
			});
		}
		if (calculatorData.addons.audioVisualSupport) {
			items.push({
				name: 'Audio/Visual Support',
				price: ADDON_PRICES.audioVisualSupport,
				quantity: 1,
				total: ADDON_PRICES.audioVisualSupport
			});
		}
		if (calculatorData.addons.liveMusician) {
			items.push({
				name: 'Live Musician',
				price: ADDON_PRICES.liveMusician,
				quantity: 1,
				total: ADDON_PRICES.liveMusician
			});
		}
		if (calculatorData.addons.woodenUsbDrives > 0) {
			const isLegacy = calculatorData.selectedTier === 'legacy';
			const usbDrives = calculatorData.addons.woodenUsbDrives;
			const includedDrives = isLegacy ? 1 : 0;

			if (usbDrives > includedDrives) {
				const billableDrives = usbDrives - includedDrives;
				if (billableDrives > 0 && includedDrives === 0) {
					items.push({
						name: 'Wooden USB Drive',
						price: ADDON_PRICES.woodenUsbDrives,
						quantity: 1,
						total: ADDON_PRICES.woodenUsbDrives
					});
					if (billableDrives > 1) {
						items.push({
							name: 'Additional Wooden USB Drives',
							price: 100,
							quantity: billableDrives - 1,
							total: 100 * (billableDrives - 1)
						});
					}
				} else {
					items.push({
						name: 'Additional Wooden USB Drives',
						price: 100,
						quantity: billableDrives,
						total: 100 * billableDrives
					});
				}
			}
		}

		return items;
	}

	function selectTier(tier: Tier) {
		calculatorData.selectedTier = tier;
		// Reset addons when changing tiers
		calculatorData.addons = {
			photography: false,
			audioVisualSupport: false,
			liveMusician: false,
			woodenUsbDrives: tier === 'legacy' ? 1 : 0
		};
		triggerAutoSave();
	}

	function triggerAutoSave() {
		if (saveStatus === 'saved') {
			saveStatus = 'unsaved';
		}
		calculatorData.updatedAt = new Date();

		// Update services.additional array based on UI toggles
		const updatedServices = {
			main: services.main,
			additional: [
				...(additionalLocation.enabled
					? [
							{
								type: 'location',
								location: additionalLocation.location,
								time: additionalLocation.time,
								hours: additionalLocation.hours
							}
						]
					: []),
				...(additionalDay.enabled
					? [
							{
								type: 'day',
								location: additionalDay.location,
								time: additionalDay.time,
								hours: additionalDay.hours
							}
						]
					: [])
			]
		};

		// Log form data changes for debugging
		console.log('💾 [AUTO-SAVE] Triggering auto-save with data:', {
			additionalLocation: {
				enabled: additionalLocation.enabled,
				timeDate: additionalLocation.time?.date,
				timeTime: additionalLocation.time?.time,
				hours: additionalLocation.hours
			},
			additionalDay: {
				enabled: additionalDay.enabled,
				timeDate: additionalDay.time?.date,
				timeTime: additionalDay.time?.time,
				hours: additionalDay.hours
			}
		});

		// Validate data structure before saving
		const isValid = validateDataStructure();
		if (!isValid) {
			console.error('🚨 [AUTO-SAVE] Attempting to save invalid data structure!');
		}

		// Create proper AutoSaveData structure (design spec compliant)
		const autoSaveData = {
			services: updatedServices,
			calculatorData: calculatorData
		};

		autoSave.triggerAutoSave(autoSaveData);
	}

	function handleBookNow() {
		const bookingData = {
			items: bookingItems,
			total: totalPrice,
			calculatorData,
			memorialId,
			timestamp: new Date().toISOString()
		};

		const encodedData = btoa(JSON.stringify(bookingData));
		goto(`/payment?data=${encodedData}`);
	}

	function handleTestPayment() {
		// Create test booking data with $1 total for testing
		const testBookingData = {
			items: [
				{
					name: 'Test Payment',
					price: 1,
					quantity: 1,
					total: 1
				}
			],
			total: 1, // $1 test payment
			calculatorData,
			memorialId,
			timestamp: new Date().toISOString(),
			isTest: true // Flag to indicate test payment
		};

		const encodedData = btoa(JSON.stringify(testBookingData));
		goto(`/payment?data=${encodedData}`);
	}

	async function handleSaveAndPayLater() {
		// Update services.additional array based on UI toggles
		const updatedServices = {
			main: services.main,
			additional: [
				...(additionalLocation.enabled
					? [
							{
								type: 'location' as const,
								location: additionalLocation.location,
								time: additionalLocation.time,
								hours: additionalLocation.hours
							}
						]
					: []),
				...(additionalDay.enabled
					? [
							{
								type: 'day' as const,
								location: additionalDay.location,
								time: additionalDay.time,
								hours: additionalDay.hours
							}
						]
					: [])
			]
		};

		// Force immediate save with proper data structure (design spec compliant)
		await autoSave.saveNow({
			services: updatedServices,
			calculatorData: calculatorData
		});

		// Create/sync streams from schedule data (ONLY on manual save)
		if (memorialId) {
			try {
				console.log('🎬 [SCHEDULE] Syncing streams with schedule data...');
				
				const streamSyncData = {
					services: updatedServices,
					calculatorData: calculatorData,
					memorialName: data?.memorial?.lovedOneName
				};

				const streamResults = await syncStreamsWithSchedule(memorialId, streamSyncData);
				
				if (streamResults.success) {
					console.log(`✅ [SCHEDULE] Stream sync completed:`, {
						created: streamResults.operations.created.length,
						updated: streamResults.operations.updated.length,
						deleted: streamResults.operations.deleted.length
					});
				} else {
					console.warn(`⚠️ [SCHEDULE] Stream sync had issues:`, streamResults.errors);
					// Could show user-friendly error message here
				}
			} catch (error) {
				console.error('❌ [SCHEDULE] Error during stream sync:', error);
				// Stream sync failure shouldn't block the save flow
			}
		}

		// Redirect to profile page for both owner and funeral director
		goto('/profile');
	}

	// Watch for changes and trigger auto-save
	$effect(() => {
		if (browser) {
			// Trigger reactivity for pricing calculations
			bookingItems;
			totalPrice;
		}
	});

	// Watch for checkbox changes specifically
	$effect(() => {
		if (browser) {
			console.log('🔄 [REACTIVITY] Additional services state changed:', {
				additionalLocation: additionalLocation.enabled,
				additionalDay: additionalDay.enabled,
				additionalLocationHours: additionalLocation.hours,
				additionalDayHours: additionalDay.hours
			});

			// Force reactivity trigger
			additionalLocation.enabled;
			additionalDay.enabled;
		}
	});

	onMount(async () => {
		// Data structure validation logging
		console.log('🔍 [VALIDATION] Form data initialized:', {
			additionalLocation: {
				hasTimeProperty: 'time' in additionalLocation,
				timeStructure: additionalLocation.time,
				enabled: additionalLocation.enabled
			},
			additionalDay: {
				hasTimeProperty: 'time' in additionalDay,
				timeStructure: additionalDay.time,
				enabled: additionalDay.enabled
			}
		});

		// Load existing auto-saved data
		const autoSavedData = await autoSave.loadAutoSavedData();
		if (autoSavedData) {
			// Restore calculator data
			if (autoSavedData.calculatorData) {
				calculatorData = autoSavedData.calculatorData;
			}

			// Restore service data
			if (autoSavedData.services) {
				services = autoSavedData.services;

				// Update UI toggles based on additional services
				const additionalServices = autoSavedData.services.additional || [];
				const locationService = additionalServices.find((s: any) => s.type === 'location');
				const dayService = additionalServices.find((s: any) => s.type === 'day');

				if (locationService) {
					additionalLocation = {
						enabled: true,
						location: locationService.location,
						time: locationService.time,
						hours: locationService.hours
					};
				}

				if (dayService) {
					additionalDay = {
						enabled: true,
						location: dayService.location,
						time: dayService.time,
						hours: dayService.hours
					};
				}
			}

			console.log('✅ Auto-saved data automatically restored');
			// Validate restored data structure
			validateDataStructure();
		}
	});

	const tiers = [
		{
			name: 'Tributestream Record',
			alias: 'solo',
			price: 599,
			features: [
				'2 Hours of Record Time',
				'Custom Link',
				'Complimentary Download',
				'One Year Hosting',
				'Posted Online within 24 Hours'
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

<svelte:head>
	<title>Price Calculator - Tributestream</title>
	<meta
		name="description"
		content="Configure your memorial service livestream package with our comprehensive pricing calculator."
	/>
</svelte:head>

<!-- Header -->
<section class="bg-gradient-to-br from-black via-gray-900 to-amber-900 py-16 text-white">
	<div class="mx-auto max-w-4xl px-4 text-center">
		<div class="mb-6">
			<h1
				class="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-4xl font-bold text-transparent"
			>
				Tributestream Pricing Calculator
			</h1>
		</div>
		<p class="mx-auto max-w-2xl text-xl text-gray-300">
			Configure your memorial service livestream package for {lovedOneName || 'your loved one'}
		</p>

		<!-- Auto-save status indicator -->
		{#if browser}
			<div class="mt-4 flex items-center justify-center space-x-2 text-sm">
				<div class="flex items-center space-x-1">
					{#if saveStatus === 'saving'}
						<div class="h-2 w-2 animate-pulse rounded-full bg-amber-400"></div>
						<span class="text-amber-400">Saving...</span>
					{:else if saveStatus === 'saved'}
						<div class="h-2 w-2 rounded-full bg-green-400"></div>
						<span class="text-green-400">Saved {lastSaved}</span>
					{:else if saveStatus === 'error'}
						<div class="h-2 w-2 rounded-full bg-red-400"></div>
						<span class="text-red-400">Save failed</span>
					{:else}
						<div class="h-2 w-2 animate-pulse rounded-full bg-yellow-400"></div>
						<span class="text-yellow-400">Unsaved changes</span>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</section>

<!-- Calculator Section -->
<section class="bg-gray-900 px-4 py-12">
	<div class="mx-auto max-w-6xl">
		<div class="grid gap-8 lg:grid-cols-3">
			<!-- Configuration Panel -->
			<div class="space-y-8 lg:col-span-2">
				<!-- Package Selection -->
				<div
					class="rounded-lg border border-amber-500/20 bg-black/80 p-6 shadow-lg backdrop-blur-sm"
				>
					<h2 class="mb-6 flex items-center text-2xl font-bold text-white">
						<Star class="mr-2 h-6 w-6 text-amber-400" />
						Choose Your Tributestream Package
					</h2>

					<div class="grid gap-4 md:grid-cols-3">
						{#each tiers as tier}
							<button
								class="rounded-lg border-2 p-4 text-left transition-all {calculatorData.selectedTier ===
								tier.alias
									? 'border-amber-400 bg-amber-400/10'
									: 'border-gray-600 hover:border-amber-500/50'}"
								onclick={() => selectTier(tier.alias)}
							>
								<h3 class="mb-2 text-lg font-bold text-white">{tier.name}</h3>
								<p class="mb-3 text-2xl font-bold text-amber-400">${tier.price}</p>
								<ul class="space-y-1 text-sm text-gray-300">
									{#each tier.features as feature}
										<li class="flex items-start">
											<span class="mr-2 text-amber-400">✓</span>
											{feature}
										</li>
									{/each}
								</ul>
							</button>
						{/each}
					</div>
				</div>

				<!-- Service Duration -->
				<div
					class="rounded-lg border border-amber-500/20 bg-black/80 p-6 shadow-lg backdrop-blur-sm"
				>
					<h2 class="mb-6 flex items-center text-2xl font-bold text-white">
						<Clock class="mr-2 h-6 w-6 text-amber-400" />
						Service Duration
					</h2>

					<div class="space-y-4">
						<!-- Date and Time Picker -->
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<label for="main-service-date" class="mb-2 block text-sm font-medium text-gray-300"
									>Service Date</label
								>
								<input
									id="main-service-date"
									type="date"
									bind:value={services.main.time.date}
									onchange={triggerAutoSave}
									class="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
								/>
							</div>
							<div>
								<label for="main-service-time" class="mb-2 block text-sm font-medium text-gray-300"
									>Start Time</label
								>
								<input
									id="main-service-time"
									type="time"
									bind:value={services.main.time.time}
									onchange={triggerAutoSave}
									class="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
								/>
							</div>
						</div>

						<!-- Service Hours Slider -->
						<div>
							<label for="main-service-hours" class="mb-2 block text-sm font-medium text-gray-300">
								Main Service Hours (2 hours included, ${HOURLY_OVERAGE_RATE}/hour overage)
							</label>
							<input
								id="main-service-hours"
								type="range"
								min="1"
								max="8"
								step="1"
								bind:value={services.main.hours}
								class="gold-slider w-full"
								onchange={triggerAutoSave}
							/>
							<div class="mt-1 flex justify-between text-sm text-gray-400">
								<span>1 hour</span>
								<span class="font-medium text-amber-400">{services.main.hours} hours</span>
								<span>8+ hours</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Additional Locations & Days -->
				<div
					class="rounded-lg border border-amber-500/20 bg-black/80 p-6 shadow-lg backdrop-blur-sm"
				>
					<h2 class="mb-6 flex items-center text-2xl font-bold text-white">
						<MapPin class="mr-2 h-6 w-6 text-amber-400" />
						Additional Services
					</h2>

					<div class="space-y-6">
						<!-- Additional Location -->
						<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
							<label class="mb-4 flex items-center justify-between">
								<div>
									<span class="font-medium text-white">Additional Location</span>
									<p class="text-sm text-gray-400">
										Stream from a second location (+${ADDITIONAL_SERVICE_FEE})
									</p>
								</div>
								<input
									type="checkbox"
									bind:checked={additionalLocation.enabled}
									onchange={() => {
										console.log(
											'📋 [CHECKBOX] Additional Location toggled:',
											additionalLocation.enabled
										);
										triggerAutoSave();
									}}
									class="h-5 w-5 rounded border-gray-600 bg-gray-700 text-amber-400 focus:ring-amber-500"
								/>
							</label>

							<!-- Debug: Always show state -->
							<div class="mb-2 text-xs text-gray-500">
								Debug: additionalLocation.enabled = {additionalLocation.enabled}
							</div>

							{#if additionalLocation.enabled}
								<div class="space-y-4">
									<!-- Date and Time Picker for Additional Location -->
									<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
										<div>
											<label
												for="additional-location-date"
												class="mb-2 block text-sm font-medium text-gray-300"
												>Additional Location Date</label
											>
											<input
												id="additional-location-date"
												type="date"
												bind:value={additionalLocation.time.date}
												onchange={triggerAutoSave}
												class="w-full rounded-lg border border-gray-600 bg-gray-700 p-3 text-white transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
											/>
										</div>
										<div>
											<label
												for="additional-location-time"
												class="mb-2 block text-sm font-medium text-gray-300">Start Time</label
											>
											<input
												id="additional-location-time"
												type="time"
												bind:value={additionalLocation.time.time}
												onchange={triggerAutoSave}
												class="w-full rounded-lg border border-gray-600 bg-gray-700 p-3 text-white transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
											/>
										</div>
									</div>

									<!-- Hours Slider for Additional Location -->
									<div>
										<label
											for="additional-location-hours"
											class="mb-2 block text-sm font-medium text-gray-300"
										>
											Additional Location Hours (2 hours included, ${HOURLY_OVERAGE_RATE}/hour
											overage)
										</label>
										<input
											id="additional-location-hours"
											type="range"
											min="1"
											max="8"
											step="1"
											bind:value={additionalLocation.hours}
											onchange={triggerAutoSave}
											class="gold-slider w-full"
										/>
										<div class="mt-1 flex justify-between text-sm text-gray-400">
											<span>1 hour</span>
											<span class="font-medium text-amber-400"
												>{additionalLocation.hours} hours</span
											>
											<span>8+ hours</span>
										</div>
									</div>
								</div>
							{/if}
						</div>

						<!-- Additional Day -->
						<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
							<label class="mb-4 flex items-center justify-between">
								<div>
									<span class="font-medium text-white">Additional Day</span>
									<p class="text-sm text-gray-400">
										Stream on a second day (+${ADDITIONAL_SERVICE_FEE})
									</p>
								</div>
								<input
									type="checkbox"
									bind:checked={additionalDay.enabled}
									onchange={() => {
										console.log('📋 [CHECKBOX] Additional Day toggled:', additionalDay.enabled);
										triggerAutoSave();
									}}
									class="h-5 w-5 rounded border-gray-600 bg-gray-700 text-amber-400 focus:ring-amber-500"
								/>
							</label>

							<!-- Debug: Always show state -->
							<div class="mb-2 text-xs text-gray-500">
								Debug: additionalDay.enabled = {additionalDay.enabled}
							</div>

							{#if additionalDay.enabled}
								<div class="space-y-4">
									<!-- Date and Time Picker for Additional Day -->
									<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
										<div>
											<label
												for="additional-day-date"
												class="mb-2 block text-sm font-medium text-gray-300"
												>Additional Day Date</label
											>
											<input
												id="additional-day-date"
												type="date"
												bind:value={additionalDay.time.date}
												onchange={triggerAutoSave}
												class="w-full rounded-lg border border-gray-600 bg-gray-700 p-3 text-white transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
											/>
										</div>
										<div>
											<label
												for="additional-day-time"
												class="mb-2 block text-sm font-medium text-gray-300">Start Time</label
											>
											<input
												id="additional-day-time"
												type="time"
												bind:value={additionalDay.time.time}
												onchange={triggerAutoSave}
												class="w-full rounded-lg border border-gray-600 bg-gray-700 p-3 text-white transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
											/>
										</div>
									</div>

									<!-- Hours Slider for Additional Day -->
									<div>
										<label
											for="additional-day-hours"
											class="mb-2 block text-sm font-medium text-gray-300"
										>
											Additional Day Hours (2 hours included, ${HOURLY_OVERAGE_RATE}/hour overage)
										</label>
										<input
											id="additional-day-hours"
											type="range"
											min="1"
											max="8"
											step="1"
											bind:value={additionalDay.hours}
											onchange={triggerAutoSave}
											class="gold-slider w-full"
										/>
										<div class="mt-1 flex justify-between text-sm text-gray-400">
											<span>1 hour</span>
											<span class="font-medium text-amber-400">{additionalDay.hours} hours</span>
											<span>8+ hours</span>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Add-ons -->
				<div
					class="rounded-lg border border-amber-500/20 bg-black/80 p-6 shadow-lg backdrop-blur-sm"
				>
					<h2 class="mb-6 flex items-center text-2xl font-bold text-white">
						<Camera class="mr-2 h-6 w-6 text-amber-400" />
						Add-on Services
					</h2>

					<div class="space-y-4">
						<label
							class="flex items-center justify-between rounded-lg border border-gray-700 p-4 transition-colors hover:bg-gray-800/50"
						>
							<div>
								<span class="font-medium text-white">Photography</span>
								<p class="text-sm text-gray-400">Professional photography service</p>
							</div>
							<div class="flex items-center">
								<span class="mr-4 font-bold text-amber-400">+${ADDON_PRICES.photography}</span>
								<input
									type="checkbox"
									bind:checked={calculatorData.addons.photography}
									onchange={triggerAutoSave}
									class="h-5 w-5 rounded border-gray-600 bg-gray-700 text-amber-400 focus:ring-amber-500"
								/>
							</div>
						</label>

						<label
							class="flex items-center justify-between rounded-lg border border-gray-700 p-4 transition-colors hover:bg-gray-800/50"
						>
							<div>
								<span class="font-medium text-white">Audio/Visual Support</span>
								<p class="text-sm text-gray-400">Professional A/V technical support</p>
							</div>
							<div class="flex items-center">
								<span class="mr-4 font-bold text-amber-400"
									>+${ADDON_PRICES.audioVisualSupport}</span
								>
								<input
									type="checkbox"
									bind:checked={calculatorData.addons.audioVisualSupport}
									onchange={triggerAutoSave}
									class="h-5 w-5 rounded border-gray-600 bg-gray-700 text-amber-400 focus:ring-amber-500"
								/>
							</div>
						</label>

						<label
							class="flex items-center justify-between rounded-lg border border-gray-700 p-4 transition-colors hover:bg-gray-800/50"
						>
							<div>
								<span class="font-medium text-white">Live Musician</span>
								<p class="text-sm text-gray-400">Professional live musical performance</p>
							</div>
							<div class="flex items-center">
								<span class="mr-4 font-bold text-amber-400">+${ADDON_PRICES.liveMusician}</span>
								<input
									type="checkbox"
									bind:checked={calculatorData.addons.liveMusician}
									onchange={triggerAutoSave}
									class="h-5 w-5 rounded border-gray-600 bg-gray-700 text-amber-400 focus:ring-amber-500"
								/>
							</div>
						</label>

						<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
							<div class="mb-4 flex items-center justify-between">
								<div>
									<span class="font-medium text-white">Wooden USB Drives</span>
									<p class="text-sm text-gray-400">
										{#if calculatorData.selectedTier === 'legacy'}
											First drive included with Legacy. Additional drives: first +${ADDON_PRICES.woodenUsbDrives},
											then +$100 each
										{:else}
											First drive +${ADDON_PRICES.woodenUsbDrives}, additional drives +$100 each
										{/if}
									</p>
								</div>
							</div>
							<div class="flex items-center space-x-4">
								<label for="usb-drives-quantity" class="block text-sm font-medium text-gray-300">
									Quantity:
								</label>
								<input
									id="usb-drives-quantity"
									type="number"
									min="0"
									max="10"
									bind:value={calculatorData.addons.woodenUsbDrives}
									onchange={triggerAutoSave}
									class="w-20 rounded border border-gray-600 bg-gray-700 p-2 text-white focus:border-amber-500 focus:ring-amber-500"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Price Summary -->
			<div class="lg:col-span-1">
				<div
					class="sticky top-8 rounded-lg border border-amber-500/20 bg-black/80 p-6 shadow-lg backdrop-blur-sm"
				>
					<h2 class="mb-6 flex items-center text-2xl font-bold text-white">
						<DollarSign class="mr-2 h-6 w-6 text-amber-400" />
						Price Breakdown
					</h2>

					<div class="mb-6 space-y-3">
						{#each bookingItems as item}
							<div class="flex justify-between text-sm">
								<span class="flex-1 text-gray-300">
									{item.name}
									{#if item.quantity > 1}
										<span class="text-gray-500">({item.quantity}x ${item.price})</span>
									{/if}
								</span>
								<span class="font-medium text-white">${item.total}</span>
							</div>
						{/each}
					</div>

					<div class="border-t border-gray-700 pt-4">
						<div class="flex items-center justify-between text-2xl font-bold">
							<span class="text-white">Total</span>
							<span class="text-amber-400">${totalPrice}</span>
						</div>
						<p class="mt-2 text-sm text-gray-400">One-time payment</p>
					</div>

					<div class="mt-6 space-y-3">
						<button
							onclick={handleBookNow}
							class="w-full rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-3 font-medium text-black transition-all duration-300 hover:from-amber-600 hover:to-yellow-700 hover:shadow-lg hover:shadow-amber-500/25"
						>
							Book Now
						</button>
						<button
							onclick={handleTestPayment}
							class="w-full rounded-lg border-2 border-green-500 bg-green-500/10 px-6 py-3 font-medium text-green-400 transition-colors hover:bg-green-500/20 hover:text-green-300"
						>
							$1 Test Payment
						</button>
						<button
							onclick={handleSaveAndPayLater}
							class="w-full rounded-lg border border-amber-500 px-6 py-3 font-medium text-amber-400 transition-colors hover:bg-amber-500/10 hover:text-amber-300"
						>
							Save and Pay Later
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.gold-slider {
		-webkit-appearance: none;
		appearance: none;
		height: 6px;
		background: linear-gradient(to right, #374151 0%, #374151 100%);
		border-radius: 3px;
		outline: none;
	}

	.gold-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		background: linear-gradient(135deg, #f59e0b, #d97706);
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
	}

	.gold-slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: linear-gradient(135deg, #f59e0b, #d97706);
		border-radius: 50%;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
	}
</style>
