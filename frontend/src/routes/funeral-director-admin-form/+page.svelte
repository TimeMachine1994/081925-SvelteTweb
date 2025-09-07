<script lang="ts">
  import { goto } from '$app/navigation';
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
    yearsInBusiness: 0,
    // Additional admin fields
    adminNotes: '',
    requestedPermissions: {
      canCreateMemorials: true,
      canManageMemorials: true,
      canLivestream: true,
      maxMemorials: 50
    }
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
    'Livestreaming Services',
    'Cemetery Services',
    'Monument Services'
  ];

  const businessTypeLabels = {
    funeral_home: 'Funeral Home',
    crematory: 'Crematory',
    memorial_service: 'Memorial Service Provider',
    other: 'Other'
  };

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

    // Validate required fields
    if (!formData.companyName || !formData.licenseNumber || !formData.contactPerson || 
        !formData.email || !formData.phone || !formData.address.street || 
        !formData.address.city || !formData.address.state || !formData.address.zipCode) {
      error = 'Please fill in all required fields';
      loading = false;
      return;
    }

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
        }, 3000);
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
  <title>Funeral Director Registration - Admin Form</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-4xl mx-auto">
    <div class="bg-white shadow-xl rounded-lg overflow-hidden">
      <!-- Header -->
      <div class="bg-indigo-600 px-8 py-6">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-white">Funeral Director Registration</h1>
          <p class="mt-2 text-indigo-100">Professional Account Setup</p>
        </div>
      </div>

      <div class="px-8 py-8">
        {#if success}
          <div class="bg-green-50 border border-green-200 rounded-md p-6 mb-6">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-medium text-green-800">Registration Successful!</h3>
                <p class="text-sm text-green-700 mt-1">
                  Your funeral director account has been submitted for approval. You will be redirected to your dashboard shortly.
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

        <form on:submit|preventDefault={handleSubmit} class="space-y-8">
          <!-- Company Information -->
          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg class="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Company Information
            </h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="companyName" class="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  bind:value={formData.companyName}
                  required
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="ABC Funeral Home"
                />
              </div>

              <div>
                <label for="licenseNumber" class="block text-sm font-medium text-gray-700 mb-2">
                  License Number <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="licenseNumber"
                  bind:value={formData.licenseNumber}
                  required
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="FD-12345"
                />
              </div>

              <div>
                <label for="contactPerson" class="block text-sm font-medium text-gray-700 mb-2">
                  Primary Contact Person <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contactPerson"
                  bind:value={formData.contactPerson}
                  required
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label for="businessType" class="block text-sm font-medium text-gray-700 mb-2">
                  Business Type <span class="text-red-500">*</span>
                </label>
                <select
                  id="businessType"
                  bind:value={formData.businessType}
                  required
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {#each Object.entries(businessTypeLabels) as [value, label]}
                    <option value={value}>{label}</option>
                  {/each}
                </select>
              </div>

              <div>
                <label for="yearsInBusiness" class="block text-sm font-medium text-gray-700 mb-2">
                  Years in Business
                </label>
                <input
                  type="number"
                  id="yearsInBusiness"
                  bind:value={formData.yearsInBusiness}
                  min="0"
                  max="100"
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <!-- Contact Information -->
          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg class="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Information
            </h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span class="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  bind:value={formData.email}
                  required
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="contact@funeralhome.com"
                />
              </div>

              <div>
                <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span class="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  bind:value={formData.phone}
                  required
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          <!-- Business Address -->
          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg class="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Business Address
            </h2>
            
            <div class="space-y-4">
              <div>
                <label for="street" class="block text-sm font-medium text-gray-700 mb-2">
                  Street Address <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="street"
                  bind:value={formData.address.street}
                  required
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="123 Main Street"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label for="city" class="block text-sm font-medium text-gray-700 mb-2">
                    City <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    bind:value={formData.address.city}
                    required
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Springfield"
                  />
                </div>

                <div>
                  <label for="state" class="block text-sm font-medium text-gray-700 mb-2">
                    State <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="state"
                    bind:value={formData.address.state}
                    required
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="IL"
                  />
                </div>

                <div>
                  <label for="zipCode" class="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    bind:value={formData.address.zipCode}
                    required
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="62701"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Services Offered -->
          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg class="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Services Offered
            </h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {#each serviceOptions as service}
                <label class="flex items-center p-3 border border-gray-200 rounded-md hover:bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.servicesOffered.includes(service)}
                    on:change={() => toggleService(service)}
                    class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <span class="ml-3 text-sm text-gray-700">{service}</span>
                </label>
              {/each}
            </div>
          </div>

          <!-- Requested Permissions -->
          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg class="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Requested Permissions
            </h2>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 bg-white rounded-md border border-gray-200">
                <div>
                  <h4 class="font-medium text-gray-900">Create Memorials</h4>
                  <p class="text-sm text-gray-600">Ability to create new memorial pages</p>
                </div>
                <input
                  type="checkbox"
                  bind:checked={formData.requestedPermissions.canCreateMemorials}
                  class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                />
              </div>

              <div class="flex items-center justify-between p-4 bg-white rounded-md border border-gray-200">
                <div>
                  <h4 class="font-medium text-gray-900">Manage Memorials</h4>
                  <p class="text-sm text-gray-600">Edit and update memorial content</p>
                </div>
                <input
                  type="checkbox"
                  bind:checked={formData.requestedPermissions.canManageMemorials}
                  class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                />
              </div>

              <div class="flex items-center justify-between p-4 bg-white rounded-md border border-gray-200">
                <div>
                  <h4 class="font-medium text-gray-900">Livestreaming</h4>
                  <p class="text-sm text-gray-600">Start and manage livestreams for services</p>
                </div>
                <input
                  type="checkbox"
                  bind:checked={formData.requestedPermissions.canLivestream}
                  class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                />
              </div>

              <div class="p-4 bg-white rounded-md border border-gray-200">
                <label for="maxMemorials" class="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Memorials Limit
                </label>
                <input
                  type="number"
                  id="maxMemorials"
                  bind:value={formData.requestedPermissions.maxMemorials}
                  min="1"
                  max="1000"
                  class="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p class="text-xs text-gray-500 mt-1">Recommended: 50-100 for most funeral homes</p>
              </div>
            </div>
          </div>

          <!-- Admin Notes -->
          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg class="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Additional Information
            </h2>
            
            <div>
              <label for="adminNotes" class="block text-sm font-medium text-gray-700 mb-2">
                Special Requirements or Notes
              </label>
              <textarea
                id="adminNotes"
                bind:value={formData.adminNotes}
                rows="4"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Any special requirements, certifications, or additional information..."
              ></textarea>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              class="bg-indigo-600 text-white px-8 py-3 rounded-md font-medium text-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Submitting Registration...' : 'Submit Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
