<script lang="ts">
  import { Calculator, DollarSign, Users, Camera, Clock, Star, MapPin, Calendar } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { useAutoSave } from '$lib/composables/useAutoSave';
  import type { CalculatorFormData, Tier } from '$lib/types/livestream';

  let { data } = $props();
  
  // Get memorial ID from route params
  const memorialId = $page.params.memorialId;
  
  // Loading state
  let pageLoaded = $state(true);

  // Unified calculator data structure
  let formData = $state<CalculatorFormData>({
    memorialId,
    lovedOneName: data?.memorial?.lovedOneName || '',
    selectedTier: 'solo',
    mainService: {
      location: { name: '', address: '', isUnknown: false },
      time: { date: null, time: null, isUnknown: false },
      hours: 2
    },
    additionalLocation: {
      enabled: false,
      location: { name: '', address: '', isUnknown: false },
      time: { date: null, time: null, isUnknown: false },
      hours: 2
    },
    additionalDay: {
      enabled: false,
      location: { name: '', address: '', isUnknown: false },
      time: { date: null, time: null, isUnknown: false },
      hours: 2
    },
    funeralDirectorName: '',
    funeralHome: '',
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

  // Data structure validation logging - moved to onMount to avoid state reference warnings

  // Validate data structure matches TypeScript interface
  function validateDataStructure() {
    const errors = [];
    
    if (!formData.additionalLocation.time) {
      errors.push('❌ additionalLocation.time is missing');
    } else {
      if (!('date' in formData.additionalLocation.time)) errors.push('❌ additionalLocation.time.date is missing');
      if (!('time' in formData.additionalLocation.time)) errors.push('❌ additionalLocation.time.time is missing');
      if (!('isUnknown' in formData.additionalLocation.time)) errors.push('❌ additionalLocation.time.isUnknown is missing');
    }
    
    if (!formData.additionalDay.time) {
      errors.push('❌ additionalDay.time is missing');
    } else {
      if (!('date' in formData.additionalDay.time)) errors.push('❌ additionalDay.time.date is missing');
      if (!('time' in formData.additionalDay.time)) errors.push('❌ additionalDay.time.time is missing');
      if (!('isUnknown' in formData.additionalDay.time)) errors.push('❌ additionalDay.time.isUnknown is missing');
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
  const autoSave = useAutoSave('', 2000, '', {
    memorialId,
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
    if (formData.selectedTier) {
      const price = TIER_PRICES[formData.selectedTier as keyof typeof TIER_PRICES];
      items.push({
        name: `Tributestream ${formData.selectedTier.charAt(0).toUpperCase() + formData.selectedTier.slice(1)}`,
        price: price,
        quantity: 1,
        total: price
      });
    }

    // Main Service Hourly Overage
    const mainOverageHours = Math.max(0, formData.mainService.hours - 2);
    if (mainOverageHours > 0) {
      items.push({
        name: 'Main Location Overage',
        price: HOURLY_OVERAGE_RATE,
        quantity: mainOverageHours,
        total: HOURLY_OVERAGE_RATE * mainOverageHours
      });
    }

    // Additional Location
    if (formData.additionalLocation.enabled) {
      items.push({
        name: 'Additional Location Fee',
        price: ADDITIONAL_SERVICE_FEE,
        quantity: 1,
        total: ADDITIONAL_SERVICE_FEE
      });
      const addlLocationOverage = Math.max(0, formData.additionalLocation.hours - 2);
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
    if (formData.additionalDay.enabled) {
      items.push({
        name: 'Additional Day Fee',
        price: ADDITIONAL_SERVICE_FEE,
        quantity: 1,
        total: ADDITIONAL_SERVICE_FEE
      });
      const addlDayOverage = Math.max(0, formData.additionalDay.hours - 2);
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
    if (formData.addons.photography) {
      items.push({
        name: 'Photography',
        price: ADDON_PRICES.photography,
        quantity: 1,
        total: ADDON_PRICES.photography
      });
    }
    if (formData.addons.audioVisualSupport) {
      items.push({
        name: 'Audio/Visual Support',
        price: ADDON_PRICES.audioVisualSupport,
        quantity: 1,
        total: ADDON_PRICES.audioVisualSupport
      });
    }
    if (formData.addons.liveMusician) {
      items.push({
        name: 'Live Musician',
        price: ADDON_PRICES.liveMusician,
        quantity: 1,
        total: ADDON_PRICES.liveMusician
      });
    }
    if (formData.addons.woodenUsbDrives > 0) {
      const isLegacy = formData.selectedTier === 'legacy';
      const usbDrives = formData.addons.woodenUsbDrives;
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
    formData.selectedTier = tier;
    // Reset addons when changing tiers
    formData.addons = {
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
    formData.updatedAt = new Date();
    
    // Log form data changes for debugging
    console.log('💾 [AUTO-SAVE] Triggering auto-save with data:', {
      additionalLocation: {
        enabled: formData.additionalLocation.enabled,
        timeDate: formData.additionalLocation.time?.date,
        timeTime: formData.additionalLocation.time?.time,
        hours: formData.additionalLocation.hours
      },
      additionalDay: {
        enabled: formData.additionalDay.enabled,
        timeDate: formData.additionalDay.time?.date,
        timeTime: formData.additionalDay.time?.time,
        hours: formData.additionalDay.hours
      }
    });
    
    // Validate data structure before saving
    const isValid = validateDataStructure();
    if (!isValid) {
      console.error('🚨 [AUTO-SAVE] Attempting to save invalid data structure!');
    }
    
    autoSave.triggerAutoSave(formData);
  }

  function handleBookNow() {
    const bookingData = {
      items: bookingItems,
      total: totalPrice,
      formData,
      memorialId,
      timestamp: new Date().toISOString()
    };
    
    const encodedData = btoa(JSON.stringify(bookingData));
    goto(`/payment?data=${encodedData}`);
  }

  async function handleSaveAndPayLater() {
    // Force immediate save
    await autoSave.saveNow(formData);
    
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
        additionalLocation: formData.additionalLocation.enabled,
        additionalDay: formData.additionalDay.enabled,
        additionalLocationHours: formData.additionalLocation.hours,
        additionalDayHours: formData.additionalDay.hours
      });
      
      // Force reactivity trigger
      formData.additionalLocation.enabled;
      formData.additionalDay.enabled;
    }
  });

  onMount(async () => {
    // Data structure validation logging
    console.log('🔍 [VALIDATION] Form data initialized:', {
      additionalLocation: {
        hasTimeProperty: 'time' in formData.additionalLocation,
        timeStructure: formData.additionalLocation.time,
        hasStartTimeProperty: 'startTime' in formData.additionalLocation,
        enabled: formData.additionalLocation.enabled
      },
      additionalDay: {
        hasTimeProperty: 'time' in formData.additionalDay,
        timeStructure: formData.additionalDay.time,
        hasStartTimeProperty: 'startTime' in formData.additionalDay,
        enabled: formData.additionalDay.enabled
      }
    });
    
    // Load existing auto-saved data
    const autoSavedData = await autoSave.loadAutoSavedData();
    if (autoSavedData) {
      formData = autoSavedData;
      console.log('✅ Auto-saved data automatically restored');
      // Validate restored data structure
      validateDataStructure();
    }
  });

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

<svelte:head>
  <title>Price Calculator - TributeStream</title>
  <meta name="description" content="Configure your memorial service livestream package with our comprehensive pricing calculator." />
</svelte:head>

<!-- Header -->
<section class="bg-gradient-to-br from-black via-gray-900 to-amber-900 text-white py-16">
  <div class="max-w-4xl mx-auto px-4 text-center">
    <div class="flex items-center justify-center mb-6">
      <Calculator class="w-12 h-12 text-amber-400 mr-4" />
      <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
        TributeStream Pricing Calculator
      </h1>
    </div>
    <p class="text-xl text-gray-300 max-w-2xl mx-auto">
      Configure your memorial service livestream package for {formData.lovedOneName || 'your loved one'}
    </p>
    
    <!-- Auto-save status indicator -->
    {#if browser}
      <div class="mt-4 flex items-center justify-center space-x-2 text-sm">
        <div class="flex items-center space-x-1">
          {#if saveStatus === 'saving'}
            <div class="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <span class="text-amber-400">Saving...</span>
          {:else if saveStatus === 'saved'}
            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
            <span class="text-green-400">Saved {lastSaved}</span>
          {:else if saveStatus === 'error'}
            <div class="w-2 h-2 bg-red-400 rounded-full"></div>
            <span class="text-red-400">Save failed</span>
          {:else}
            <div class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span class="text-yellow-400">Unsaved changes</span>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</section>

<!-- Calculator Section -->
<section class="py-12 px-4 bg-gray-900">
  <div class="max-w-6xl mx-auto">
    <div class="grid lg:grid-cols-3 gap-8">
      <!-- Configuration Panel -->
      <div class="lg:col-span-2 space-y-8">
        
        <!-- Package Selection -->
        <div class="bg-black/80 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-amber-500/20">
          <h2 class="text-2xl font-bold text-white mb-6 flex items-center">
            <Star class="h-6 w-6 mr-2 text-amber-400" />
            Choose Your TributeStream Package
          </h2>
          
          <div class="grid md:grid-cols-3 gap-4">
            {#each tiers as tier}
              <button 
                class="p-4 border-2 rounded-lg transition-all text-left {formData.selectedTier === tier.alias ? 'border-amber-400 bg-amber-400/10' : 'border-gray-600 hover:border-amber-500/50'}"
                onclick={() => selectTier(tier.alias)}
              >
                <h3 class="font-bold text-lg mb-2 text-white">{tier.name}</h3>
                <p class="text-2xl font-bold text-amber-400 mb-3">${tier.price}</p>
                <ul class="text-sm text-gray-300 space-y-1">
                  {#each tier.features as feature}
                    <li class="flex items-start">
                      <span class="text-amber-400 mr-2">✓</span>
                      {feature}
                    </li>
                  {/each}
                </ul>
              </button>
            {/each}
          </div>
        </div>

        <!-- Service Duration -->
        <div class="bg-black/80 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-amber-500/20">
          <h2 class="text-2xl font-bold text-white mb-6 flex items-center">
            <Clock class="h-6 w-6 mr-2 text-amber-400" />
            Service Duration
          </h2>
          
          <div class="space-y-4">
            <!-- Date and Time Picker -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="main-service-date" class="block text-sm font-medium text-gray-300 mb-2">Service Date</label>
                <input 
                  id="main-service-date" 
                  type="date" 
                  bind:value={formData.mainService.time.date} 
                  onchange={triggerAutoSave}
                  class="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                />
              </div>
              <div>
                <label for="main-service-time" class="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                <input 
                  id="main-service-time" 
                  type="time" 
                  bind:value={formData.mainService.time.time} 
                  onchange={triggerAutoSave}
                  class="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <!-- Service Hours Slider -->
            <div>
              <label for="main-service-hours" class="block text-sm font-medium text-gray-300 mb-2">
                Main Service Hours (2 hours included, ${HOURLY_OVERAGE_RATE}/hour overage)
              </label>
              <input 
                id="main-service-hours"
                type="range" 
                min="1" 
                max="8" 
                step="1"
                bind:value={formData.mainService.hours}
                class="w-full gold-slider"
                onchange={triggerAutoSave}
              />
              <div class="flex justify-between text-sm text-gray-400 mt-1">
                <span>1 hour</span>
                <span class="font-medium text-amber-400">{formData.mainService.hours} hours</span>
                <span>8+ hours</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Additional Locations & Days -->
        <div class="bg-black/80 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-amber-500/20">
          <h2 class="text-2xl font-bold text-white mb-6 flex items-center">
            <MapPin class="h-6 w-6 mr-2 text-amber-400" />
            Additional Services
          </h2>
          
          <div class="space-y-6">
            <!-- Additional Location -->
            <div class="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
              <label class="flex items-center justify-between mb-4">
                <div>
                  <span class="font-medium text-white">Additional Location</span>
                  <p class="text-sm text-gray-400">Stream from a second location (+${ADDITIONAL_SERVICE_FEE})</p>
                </div>
                <input 
                  type="checkbox" 
                  bind:checked={formData.additionalLocation.enabled}
                  onchange={() => {
                    console.log('📋 [CHECKBOX] Additional Location toggled:', formData.additionalLocation.enabled);
                    triggerAutoSave();
                  }}
                  class="h-5 w-5 text-amber-400 bg-gray-700 border-gray-600 rounded focus:ring-amber-500"
                />
              </label>
              
              <!-- Debug: Always show state -->
              <div class="text-xs text-gray-500 mb-2">Debug: additionalLocation.enabled = {formData.additionalLocation.enabled}</div>
              
              {#if formData.additionalLocation.enabled}
                <div class="space-y-4">
                  <!-- Date and Time Picker for Additional Location -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label for="additional-location-date" class="block text-sm font-medium text-gray-300 mb-2">Additional Location Date</label>
                      <input 
                        id="additional-location-date" 
                        type="date" 
                        bind:value={formData.additionalLocation.time.date} 
                        onchange={triggerAutoSave}
                        class="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label for="additional-location-time" class="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                      <input 
                        id="additional-location-time" 
                        type="time" 
                        bind:value={formData.additionalLocation.time.time} 
                        onchange={triggerAutoSave}
                        class="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  <!-- Hours Slider for Additional Location -->
                  <div>
                    <label for="additional-location-hours" class="block text-sm font-medium text-gray-300 mb-2">
                      Additional Location Hours (2 hours included, ${HOURLY_OVERAGE_RATE}/hour overage)
                    </label>
                    <input 
                      id="additional-location-hours"
                      type="range" 
                      min="1" 
                      max="8" 
                      step="1"
                      bind:value={formData.additionalLocation.hours}
                      onchange={triggerAutoSave}
                      class="w-full gold-slider"
                    />
                    <div class="flex justify-between text-sm text-gray-400 mt-1">
                      <span>1 hour</span>
                      <span class="font-medium text-amber-400">{formData.additionalLocation.hours} hours</span>
                      <span>8+ hours</span>
                    </div>
                  </div>
                </div>
              {/if}
            </div>

            <!-- Additional Day -->
            <div class="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
              <label class="flex items-center justify-between mb-4">
                <div>
                  <span class="font-medium text-white">Additional Day</span>
                  <p class="text-sm text-gray-400">Stream on a second day (+${ADDITIONAL_SERVICE_FEE})</p>
                </div>
                <input 
                  type="checkbox" 
                  bind:checked={formData.additionalDay.enabled}
                  onchange={() => {
                    console.log('📋 [CHECKBOX] Additional Day toggled:', formData.additionalDay.enabled);
                    triggerAutoSave();
                  }}
                  class="h-5 w-5 text-amber-400 bg-gray-700 border-gray-600 rounded focus:ring-amber-500"
                />
              </label>
              
              <!-- Debug: Always show state -->
              <div class="text-xs text-gray-500 mb-2">Debug: additionalDay.enabled = {formData.additionalDay.enabled}</div>
              
              {#if formData.additionalDay.enabled}
                <div class="space-y-4">
                  <!-- Date and Time Picker for Additional Day -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label for="additional-day-date" class="block text-sm font-medium text-gray-300 mb-2">Additional Day Date</label>
                      <input 
                        id="additional-day-date" 
                        type="date" 
                        bind:value={formData.additionalDay.time.date} 
                        onchange={triggerAutoSave}
                        class="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label for="additional-day-time" class="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                      <input 
                        id="additional-day-time" 
                        type="time" 
                        bind:value={formData.additionalDay.time.time} 
                        onchange={triggerAutoSave}
                        class="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  <!-- Hours Slider for Additional Day -->
                  <div>
                    <label for="additional-day-hours" class="block text-sm font-medium text-gray-300 mb-2">
                      Additional Day Hours (2 hours included, ${HOURLY_OVERAGE_RATE}/hour overage)
                    </label>
                    <input 
                      id="additional-day-hours"
                      type="range" 
                      min="1" 
                      max="8" 
                      step="1"
                      bind:value={formData.additionalDay.hours}
                      onchange={triggerAutoSave}
                      class="w-full gold-slider"
                    />
                    <div class="flex justify-between text-sm text-gray-400 mt-1">
                      <span>1 hour</span>
                      <span class="font-medium text-amber-400">{formData.additionalDay.hours} hours</span>
                      <span>8+ hours</span>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Add-ons -->
        <div class="bg-black/80 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-amber-500/20">
          <h2 class="text-2xl font-bold text-white mb-6 flex items-center">
            <Camera class="h-6 w-6 mr-2 text-amber-400" />
            Add-on Services
          </h2>
          
          <div class="space-y-4">
            <label class="flex items-center justify-between p-4 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors">
              <div>
                <span class="font-medium text-white">Photography</span>
                <p class="text-sm text-gray-400">Professional photography service</p>
              </div>
              <div class="flex items-center">
                <span class="text-amber-400 font-bold mr-4">+${ADDON_PRICES.photography}</span>
                <input 
                  type="checkbox" 
                  bind:checked={formData.addons.photography}
                  onchange={triggerAutoSave}
                  class="h-5 w-5 text-amber-400 bg-gray-700 border-gray-600 rounded focus:ring-amber-500"
                />
              </div>
            </label>

            <label class="flex items-center justify-between p-4 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors">
              <div>
                <span class="font-medium text-white">Audio/Visual Support</span>
                <p class="text-sm text-gray-400">Professional A/V technical support</p>
              </div>
              <div class="flex items-center">
                <span class="text-amber-400 font-bold mr-4">+${ADDON_PRICES.audioVisualSupport}</span>
                <input 
                  type="checkbox" 
                  bind:checked={formData.addons.audioVisualSupport}
                  onchange={triggerAutoSave}
                  class="h-5 w-5 text-amber-400 bg-gray-700 border-gray-600 rounded focus:ring-amber-500"
                />
              </div>
            </label>

            <label class="flex items-center justify-between p-4 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors">
              <div>
                <span class="font-medium text-white">Live Musician</span>
                <p class="text-sm text-gray-400">Professional live musical performance</p>
              </div>
              <div class="flex items-center">
                <span class="text-amber-400 font-bold mr-4">+${ADDON_PRICES.liveMusician}</span>
                <input 
                  type="checkbox" 
                  bind:checked={formData.addons.liveMusician}
                  onchange={triggerAutoSave}
                  class="h-5 w-5 text-amber-400 bg-gray-700 border-gray-600 rounded focus:ring-amber-500"
                />
              </div>
            </label>

            <div class="p-4 border border-gray-700 rounded-lg bg-gray-800/50">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <span class="font-medium text-white">Wooden USB Drives</span>
                  <p class="text-sm text-gray-400">
                    {#if formData.selectedTier === 'legacy'}
                      First drive included with Legacy. Additional drives: first +${ADDON_PRICES.woodenUsbDrives}, then +$100 each
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
                  bind:value={formData.addons.woodenUsbDrives}
                  onchange={triggerAutoSave}
                  class="w-20 p-2 border border-gray-600 rounded bg-gray-700 text-white focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Price Summary -->
      <div class="lg:col-span-1">
        <div class="bg-black/80 backdrop-blur-sm rounded-lg shadow-lg p-6 sticky top-8 border border-amber-500/20">
          <h2 class="text-2xl font-bold text-white mb-6 flex items-center">
            <DollarSign class="h-6 w-6 mr-2 text-amber-400" />
            Price Breakdown
          </h2>
          
          <div class="space-y-3 mb-6">
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
            <div class="flex justify-between items-center text-2xl font-bold">
              <span class="text-white">Total</span>
              <span class="text-amber-400">${totalPrice}</span>
            </div>
            <p class="text-sm text-gray-400 mt-2">One-time payment</p>
          </div>
          
          <div class="mt-6 space-y-3">
            <button 
              onclick={handleBookNow}
              class="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black py-3 px-6 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25"
            >
              Book Now
            </button>
            <button 
              onclick={handleSaveAndPayLater}
              class="w-full border border-amber-500 hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 py-3 px-6 rounded-lg font-medium transition-colors"
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
