<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let formData = {
    companyName: '',
    licenseNumber: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    businessType: 'funeral_home' as 'funeral_home' | 'crematory' | 'memorial_service' | 'other',
    servicesOffered: [] as string[],
    yearsInBusiness: 0
  };

  let loading = false;
  let error = '';
  let success = false;

  const serviceOptions = [
    'Traditional Funeral Services',
    'Cremation Services',
    'Memorial Services',
    'Burial Services',
    'Pre-planning Services',
    'Grief Counseling',
    'Transportation Services',
    'Embalming',
    'Viewing Services',
    'Livestreaming Services'
  ];

  function toggleService(service: string) {
    if (formData.servicesOffered.includes(service)) {
      formData.servicesOffered = formData.servicesOffered.filter(s => s !== service);
    } else {
      formData.servicesOffered = [...formData.servicesOffered, service];
    }
  }

  async function handleSubmit() {
    loading = true;
    error = '';

    try {
      const response = await fetch('/api/funeral-director/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        success = true;
        setTimeout(() => {
          goto('/funeral-director/dashboard');
        }, 2000);
      } else {
        error = result.error || 'Registration failed';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Funeral Director Registration</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-3xl mx-auto">
    <div class="bg-white shadow-lg rounded-lg p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Funeral Director Registration</h1>
        <p class="mt-2 text-gray-600">Register your funeral home to create and manage memorial services</p>
      </div>

      {#if success}
        <div class="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-green-800">
                Registration submitted successfully! Redirecting to dashboard...
              </p>
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

      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <!-- Company Information -->
        <div class="bg-gray-50 p-6 rounded-lg">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="companyName" class="block text-sm font-medium text-gray-700">Company Name *</label>
              <input
                type="text"
                id="companyName"
                bind:value={formData.companyName}
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="licenseNumber" class="block text-sm font-medium text-gray-700">License Number *</label>
              <input
                type="text"
                id="licenseNumber"
                bind:value={formData.licenseNumber}
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="contactPerson" class="block text-sm font-medium text-gray-700">Contact Person *</label>
              <input
                type="text"
                id="contactPerson"
                bind:value={formData.contactPerson}
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="businessType" class="block text-sm font-medium text-gray-700">Business Type *</label>
              <select
                id="businessType"
                bind:value={formData.businessType}
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="funeral_home">Funeral Home</option>
                <option value="crematory">Crematory</option>
                <option value="memorial_service">Memorial Service Provider</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label for="yearsInBusiness" class="block text-sm font-medium text-gray-700">Years in Business</label>
              <input
                type="number"
                id="yearsInBusiness"
                bind:value={formData.yearsInBusiness}
                min="0"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="bg-gray-50 p-6 rounded-lg">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Email Address *</label>
              <input
                type="email"
                id="email"
                bind:value={formData.email}
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                bind:value={formData.phone}
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <!-- Address -->
        <div class="bg-gray-50 p-6 rounded-lg">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Business Address</h2>
          
          <div class="space-y-4">
            <div>
              <label for="street" class="block text-sm font-medium text-gray-700">Street Address *</label>
              <input
                type="text"
                id="street"
                bind:value={formData.address.street}
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label for="city" class="block text-sm font-medium text-gray-700">City *</label>
                <input
                  type="text"
                  id="city"
                  bind:value={formData.address.city}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label for="state" class="block text-sm font-medium text-gray-700">State *</label>
                <input
                  type="text"
                  id="state"
                  bind:value={formData.address.state}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label for="zipCode" class="block text-sm font-medium text-gray-700">ZIP Code *</label>
                <input
                  type="text"
                  id="zipCode"
                  bind:value={formData.address.zipCode}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Services Offered -->
        <div class="bg-gray-50 p-6 rounded-lg">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Services Offered</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {#each serviceOptions as service}
              <label class="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.servicesOffered.includes(service)}
                  on:change={() => toggleService(service)}
                  class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span class="ml-2 text-sm text-gray-700">{service}</span>
              </label>
            {/each}
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            class="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Registration'}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
