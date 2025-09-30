<script lang="ts">
  import { onMount } from 'svelte';
  
  let loading = false;
  let results = null;
  let error = '';

  async function runTests() {
    loading = true;
    error = '';
    results = null;
    
    try {
      const response = await fetch('/api/debug/cloudflare-whip');
      if (response.ok) {
        results = await response.json();
      } else {
        error = `HTTP ${response.status}: ${await response.text()}`;
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    runTests();
  });
</script>

<svelte:head>
  <title>Cloudflare WHIP Debug Tests</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-4xl mx-auto">
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">🧪 Cloudflare WHIP Debug Tests</h1>
        <button 
          onclick={runTests}
          disabled={loading}
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Running Tests...' : 'Run Tests'}
        </button>
      </div>

      {#if loading}
        <div class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Running Cloudflare WHIP tests...</p>
        </div>
      {:else if error}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 class="font-semibold text-red-800 mb-2">❌ Error</h3>
          <p class="text-red-700">{error}</p>
        </div>
      {:else if results}
        <div class="space-y-6">
          <!-- Environment Info -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="font-semibold mb-3">🔧 Environment</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium">API Token:</span> 
                {results.environment.hasApiToken ? '✅ Present' : '❌ Missing'} 
                ({results.environment.apiTokenLength} chars)
              </div>
              <div>
                <span class="font-medium">Account ID:</span> 
                {results.environment.hasAccountId ? '✅ Present' : '❌ Missing'} 
                ({results.environment.accountIdLength} chars)
              </div>
            </div>
          </div>

          <!-- Test Results -->
          <div class="space-y-4">
            <h3 class="font-semibold">📋 Test Results</h3>
            {#each results.tests as test, i}
              <div class="border rounded-lg p-4 {test.status === 'PASS' ? 'border-green-200 bg-green-50' : test.status === 'FAIL' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="font-medium">{test.name}</h4>
                  <span class="px-2 py-1 rounded text-xs font-medium {test.status === 'PASS' ? 'bg-green-100 text-green-800' : test.status === 'FAIL' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
                    {test.status}
                  </span>
                </div>
                
                {#if test.statusCode}
                  <p class="text-sm text-gray-600 mb-2">Status Code: {test.statusCode}</p>
                {/if}
                
                {#if test.endpoint}
                  <p class="text-sm text-gray-600 mb-2 font-mono break-all">Endpoint: {test.endpoint}</p>
                {/if}
                
                {#if test.details}
                  <details class="text-sm">
                    <summary class="cursor-pointer text-gray-600 hover:text-gray-800">Show Details</summary>
                    <pre class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">{JSON.stringify(test.details, null, 2)}</pre>
                  </details>
                {/if}
                
                {#if test.response}
                  <p class="text-sm text-gray-700 mt-2">{test.response}</p>
                {/if}
                
                {#if test.error}
                  <p class="text-sm text-red-600 mt-2">Error: {test.error}</p>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
