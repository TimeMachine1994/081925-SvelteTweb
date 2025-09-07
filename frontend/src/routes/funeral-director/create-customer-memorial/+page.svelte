<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let formData = {
    // Loved one (deceased) information
    lovedOne: {
      firstName: '',
      lastName: '',
      middleName: '',
      dateOfBirth: '',
      dateOfDeath: ''
    },
    
    // Customer (family owner) information
    customer: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      relationship: 'spouse' // relationship to deceased
    },
    
    // Service and livestream information
    service: {
      date: '',
      time: '',
      durationHours: 2,
      additionalDays: [],
      serviceType: 'funeral' as 'viewing' | 'funeral' | 'memorial' | 'burial',
      location: '',
      enableLivestream: true
    },
    
    // Memorial settings
    memorial: {
      isPublic: true,
      allowComments: true,
      allowPhotos: true,
      allowTributes: true,
      customMessage: ''
    }
  };

  let loading = false;
  let error = '';
  let success = false;
  let createdMemorial: any = null;

  const relationshipOptions = [
    'spouse', 'son', 'daughter', 'father', 'mother', 'brother', 'sister',
    'grandson', 'granddaughter', 'friend', 'other'
  ];

  const serviceTypeOptions = [
    { value: 'viewing', label: 'Viewing/Visitation' },
    { value: 'funeral', label: 'Funeral Service' },
    { value: 'memorial', label: 'Memorial Service' },
    { value: 'burial', label: 'Burial Service' }
  ];

  function addAdditionalDay() {
    formData.service.additionalDays = [...formData.service.additionalDays, {
      date: '',
      time: '',
      durationHours: 2,
      serviceType: 'memorial'
    }];
  }

  function removeAdditionalDay(index: number) {
    formData.service.additionalDays = formData.service.additionalDays.filter((_, i) => i !== index);
  }

  async function handleSubmit() {
    loading = true;
    error = '';

    // Validate required fields
    if (!formData.lovedOne.firstName || !formData.lovedOne.lastName || 
        !formData.customer.firstName || !formData.customer.lastName ||
        !formData.customer.email || !formData.customer.phone ||
        !formData.service.date || !formData.service.time) {
      error = 'Please fill in all required fields';
      loading = false;
      return;
    }

    try {
      const response = await fetch('/api/funeral-director/create-customer-memorial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        success = true;
        createdMemorial = result;
        
        // Reset form
        formData = {
          lovedOne: { firstName: '', lastName: '', middleName: '', dateOfBirth: '', dateOfDeath: '' },
          customer: { firstName: '', lastName: '', email: '', phone: '', relationship: 'spouse' },
          service: { date: '', time: '', durationHours: 2, additionalDays: [], serviceType: 'funeral', location: '', enableLivestream: true },
          memorial: { isPublic: true, allowComments: true, allowPhotos: true, allowTributes: true, customMessage: '' }
        };
      } else {
        error = result.error || 'Failed to create memorial';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Create Customer Memorial - Funeral Director</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="bg-white shadow rounded-lg mb-8">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Create Customer Memorial</h1>
            <p class="text-gray-600">Set up a memorial service for your customer</p>
          </div>
          <button
            on:click={() => goto('/funeral-director/dashboard')}
            class="text-gray-500 hover:text-gray-700"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    {#if success && createdMemorial}
      <div class="bg-green-50 border border-green-200 rounded-md p-6 mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-medium text-green-800">Memorial Created Successfully!</h3>
            <div class="mt-2 text-sm text-green-700">
              <p>Memorial ID: <strong>{createdMemorial.memorialId}</strong></p>
              <p>Customer account created and invitation email sent to: <strong>{createdMemorial.customerEmail}</strong></p>
              <div class="mt-4 space-x-3">
                <a
                  href="/funeral-director/memorial/{createdMemorial.memorialId}"
                  class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  Manage Memorial
                </a>
                <a
                  href="/tributes/{createdMemorial.fullSlug}"
                  class="inline-flex items-center px-3 py-2 border border-green-600 text-sm leading-4 font-medium rounded-md text-green-600 bg-white hover:bg-green-50"
                >
                  View Memorial
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      </div>
    {/if}

    <form on:submit|preventDefault={handleSubmit} class="space-y-8">
      <!-- Loved One Information -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <svg class="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Loved One Information
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label for="lovedOneFirstName" class="block text-sm font-medium text-gray-700 mb-2">
              First Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lovedOneFirstName"
              bind:value={formData.lovedOne.firstName}
              required
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="lovedOneMiddleName" class="block text-sm font-medium text-gray-700 mb-2">
              Middle Name
            </label>
            <input
              type="text"
              id="lovedOneMiddleName"
              bind:value={formData.lovedOne.middleName}
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="lovedOneLastName" class="block text-sm font-medium text-gray-700 mb-2">
              Last Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lovedOneLastName"
              bind:value={formData.lovedOne.lastName}
              required
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="dateOfBirth" class="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              bind:value={formData.lovedOne.dateOfBirth}
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="dateOfDeath" class="block text-sm font-medium text-gray-700 mb-2">
              Date of Death
            </label>
            <input
              type="date"
              id="dateOfDeath"
              bind:value={formData.lovedOne.dateOfDeath}
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Customer Information -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <svg class="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Customer (Family Owner) Information
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="customerFirstName" class="block text-sm font-medium text-gray-700 mb-2">
              First Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="customerFirstName"
              bind:value={formData.customer.firstName}
              required
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="customerLastName" class="block text-sm font-medium text-gray-700 mb-2">
              Last Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="customerLastName"
              bind:value={formData.customer.lastName}
              required
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="customerEmail" class="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span class="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="customerEmail"
              bind:value={formData.customer.email}
              required
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="customerPhone" class="block text-sm font-medium text-gray-700 mb-2">
              Phone Number <span class="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="customerPhone"
              bind:value={formData.customer.phone}
              required
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div class="md:col-span-2">
            <label for="relationship" class="block text-sm font-medium text-gray-700 mb-2">
              Relationship to Deceased
            </label>
            <select
              id="relationship"
              bind:value={formData.customer.relationship}
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {#each relationshipOptions as relationship}
                <option value={relationship}>{relationship.charAt(0).toUpperCase() + relationship.slice(1)}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>

      <!-- Service Information -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <svg class="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Service & Livestream Information
        </h2>
        
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label for="serviceDate" class="block text-sm font-medium text-gray-700 mb-2">
                Service Date <span class="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="serviceDate"
                bind:value={formData.service.date}
                required
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="serviceTime" class="block text-sm font-medium text-gray-700 mb-2">
                Service Time <span class="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="serviceTime"
                bind:value={formData.service.time}
                required
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="durationHours" class="block text-sm font-medium text-gray-700 mb-2">
                Duration (Hours)
              </label>
              <input
                type="number"
                id="durationHours"
                bind:value={formData.service.durationHours}
                min="0.5"
                max="12"
                step="0.5"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="serviceType" class="block text-sm font-medium text-gray-700 mb-2">
                Service Type
              </label>
              <select
                id="serviceType"
                bind:value={formData.service.serviceType}
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {#each serviceTypeOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
          </div>

          <div>
            <label for="location" class="block text-sm font-medium text-gray-700 mb-2">
              Service Location
            </label>
            <input
              type="text"
              id="location"
              bind:value={formData.service.location}
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Chapel, funeral home, or other location"
            />
          </div>

          <div class="flex items-center">
            <input
              type="checkbox"
              id="enableLivestream"
              bind:checked={formData.service.enableLivestream}
              class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
            />
            <label for="enableLivestream" class="ml-2 text-sm text-gray-700">
              Enable livestreaming for this service
            </label>
          </div>

          <!-- Additional Days -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-md font-medium text-gray-900">Additional Service Days</h3>
              <button
                type="button"
                on:click={addAdditionalDay}
                class="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add Day
              </button>
            </div>

            {#each formData.service.additionalDays as day, index}
              <div class="border border-gray-200 rounded-md p-4 mb-4">
                <div class="flex justify-between items-start mb-4">
                  <h4 class="font-medium text-gray-900">Day {index + 2}</h4>
                  <button
                    type="button"
                    on:click={() => removeAdditionalDay(index)}
                    class="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      bind:value={day.date}
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      bind:value={day.time}
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="number"
                      bind:value={day.durationHours}
                      min="0.5"
                      max="12"
                      step="0.5"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      bind:value={day.serviceType}
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    >
                      {#each serviceTypeOptions as option}
                        <option value={option.value}>{option.label}</option>
                      {/each}
                    </select>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Memorial Settings -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <svg class="h-5 w-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Memorial Settings
        </h2>
        
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label class="flex items-center">
              <input
                type="checkbox"
                bind:checked={formData.memorial.isPublic}
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
              />
              <span class="ml-2 text-sm text-gray-700">Make memorial public</span>
            </label>

            <label class="flex items-center">
              <input
                type="checkbox"
                bind:checked={formData.memorial.allowComments}
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
              />
              <span class="ml-2 text-sm text-gray-700">Allow comments</span>
            </label>

            <label class="flex items-center">
              <input
                type="checkbox"
                bind:checked={formData.memorial.allowPhotos}
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
              />
              <span class="ml-2 text-sm text-gray-700">Allow photo uploads</span>
            </label>

            <label class="flex items-center">
              <input
                type="checkbox"
                bind:checked={formData.memorial.allowTributes}
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
              />
              <span class="ml-2 text-sm text-gray-700">Allow tributes</span>
            </label>
          </div>

          <div>
            <label for="customMessage" class="block text-sm font-medium text-gray-700 mb-2">
              Custom Message for Family
            </label>
            <textarea
              id="customMessage"
              bind:value={formData.memorial.customMessage}
              rows="3"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Optional message to include in the memorial..."
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-end space-x-4 pt-6">
        <button
          type="button"
          on:click={() => goto('/funeral-director/dashboard')}
          class="px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          class="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Memorial...' : 'Create Memorial & Send Invitation'}
        </button>
      </div>
    </form>
  </div>
</div>
