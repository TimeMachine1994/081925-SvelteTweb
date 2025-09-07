<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { FuneralDirector } from '$lib/types/funeral-director';

  let funeralDirector: FuneralDirector | null = null;
  let memorials: any[] = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    await loadDashboardData();
  });

  async function loadDashboardData() {
    try {
      // Load funeral director profile
      const profileResponse = await fetch('/api/funeral-director/profile');
      if (profileResponse.ok) {
        funeralDirector = await profileResponse.json();
      }

      // Load memorials
      const memorialsResponse = await fetch('/api/funeral-director/memorials');
      if (memorialsResponse.ok) {
        const data = await memorialsResponse.json();
        memorials = data.memorials;
      }
    } catch (err) {
      error = 'Failed to load dashboard data';
    } finally {
      loading = false;
    }
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<svelte:head>
  <title>Funeral Director Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <div class="bg-white shadow">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Funeral Director Dashboard</h1>
          {#if funeralDirector}
            <p class="text-gray-600">{funeralDirector.companyName}</p>
          {/if}
        </div>
        <button
          on:click={() => goto('/funeral-director/create-memorial')}
          class="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create Memorial
        </button>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if loading}
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 rounded-md p-4">
        <p class="text-red-800">{error}</p>
      </div>
    {:else}
      <!-- Account Status -->
      {#if funeralDirector}
        <div class="bg-white shadow rounded-lg p-6 mb-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Account Status</h2>
          <div class="flex items-center space-x-4">
            <span class="text-sm font-medium text-gray-700">Status:</span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusBadgeClass(funeralDirector.status)}">
              {funeralDirector.status.charAt(0).toUpperCase() + funeralDirector.status.slice(1)}
            </span>
            {#if funeralDirector.status === 'pending'}
              <span class="text-sm text-gray-600">Your account is pending approval. You'll be able to create memorials once approved.</span>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Total Memorials</dt>
                <dd class="text-lg font-medium text-gray-900">{memorials.length}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Active Streams</dt>
                <dd class="text-lg font-medium text-gray-900">{memorials.filter(m => m.activeStreams > 0).length}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">This Month</dt>
                <dd class="text-lg font-medium text-gray-900">{memorials.filter(m => {
                  const created = new Date(m.createdAt.seconds * 1000);
                  const now = new Date();
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                }).length}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Memorials -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Recent Memorials</h2>
        </div>
        
        {#if memorials.length === 0}
          <div class="p-6 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No memorials</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by creating your first memorial.</p>
            <div class="mt-6">
              <button
                on:click={() => goto('/funeral-director/create-memorial')}
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Memorial
              </button>
            </div>
          </div>
        {:else}
          <div class="overflow-hidden">
            <ul class="divide-y divide-gray-200">
              {#each memorials as memorial}
                <li class="px-6 py-4 hover:bg-gray-50">
                  <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center space-x-3">
                        <div class="flex-shrink-0">
                          <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span class="text-sm font-medium text-gray-700">
                              {memorial.deceased.firstName.charAt(0)}{memorial.deceased.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-gray-900 truncate">
                            {memorial.title}
                          </p>
                          <p class="text-sm text-gray-500">
                            {memorial.deceased.firstName} {memorial.deceased.lastName}
                          </p>
                          <p class="text-xs text-gray-400">
                            Created {new Date(memorial.createdAt.seconds * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      {#if memorial.livestreamEnabled}
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Streaming Enabled
                        </span>
                      {/if}
                      <button
                        on:click={() => goto(`/funeral-director/memorial/${memorial.id}`)}
                        class="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Manage
                      </button>
                      <button
                        on:click={() => goto(`/tributes/${memorial.fullSlug}`)}
                        class="text-gray-600 hover:text-gray-900 text-sm font-medium"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
