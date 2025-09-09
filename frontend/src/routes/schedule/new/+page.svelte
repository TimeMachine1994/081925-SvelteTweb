<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Plus, User, Calendar } from 'lucide-svelte';

  let lovedOneName = $state('');
  let isCreating = $state(false);

  async function createNewMemorial() {
    if (!lovedOneName.trim()) {
      alert('Please enter the name of your loved one');
      return;
    }

    isCreating = true;

    try {
      const response = await fetch('/api/memorials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lovedOneName: lovedOneName.trim(),
          type: 'memorial_service'
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Redirect to the memorial-specific calculator
        goto(`/schedule/${result.memorialId}`);
      } else {
        alert(`Failed to create memorial: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating memorial:', error);
      alert('Failed to create memorial. Please try again.');
    } finally {
      isCreating = false;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      createNewMemorial();
    }
  }
</script>

<svelte:head>
  <title>Create New Memorial - TributeStream</title>
  <meta name="description" content="Create a new memorial service and configure your livestream package." />
</svelte:head>

<!-- Header -->
<section class="bg-gradient-to-br from-black via-gray-900 to-amber-900 text-white py-16">
  <div class="max-w-4xl mx-auto px-4 text-center">
    <div class="flex items-center justify-center mb-6">
      <Plus class="w-12 h-12 text-amber-400 mr-4" />
      <h1 class="text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
        Create New Memorial Service
      </h1>
    </div>
    <p class="text-xl text-gray-300 max-w-2xl mx-auto">
      Start by creating a memorial service, then configure your livestream package
    </p>
  </div>
</section>

<!-- Creation Form -->
<section class="py-12 px-4 bg-gray-900 min-h-screen">
  <div class="max-w-2xl mx-auto">
    <div class="bg-black/80 backdrop-blur-sm rounded-lg shadow-lg p-8 border border-amber-500/20">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <User class="w-8 h-8 text-amber-400" />
        </div>
        <h2 class="text-2xl font-bold text-white mb-2">Memorial Information</h2>
        <p class="text-gray-400">Let's start with the basic information for your memorial service</p>
      </div>

      <div class="space-y-6">
        <div>
          <label for="loved-one-name" class="block text-sm font-medium text-gray-300 mb-2">
            Name of your loved one *
          </label>
          <input 
            id="loved-one-name"
            type="text" 
            bind:value={lovedOneName}
            onkeypress={handleKeyPress}
            placeholder="Enter the full name"
            class="w-full p-4 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
            disabled={isCreating}
          />
          <p class="text-xs text-gray-500 mt-1">This will be used throughout your memorial service configuration</p>
        </div>

        <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 class="text-lg font-semibold text-white mb-2 flex items-center">
            <Calendar class="w-5 h-5 text-amber-400 mr-2" />
            What happens next?
          </h3>
          <ul class="text-sm text-gray-300 space-y-2">
            <li class="flex items-start">
              <span class="text-amber-400 mr-2">1.</span>
              We'll create your memorial service profile
            </li>
            <li class="flex items-start">
              <span class="text-amber-400 mr-2">2.</span>
              You'll configure your livestream package and pricing
            </li>
            <li class="flex items-start">
              <span class="text-amber-400 mr-2">3.</span>
              Your configuration will be automatically saved as you work
            </li>
            <li class="flex items-start">
              <span class="text-amber-400 mr-2">4.</span>
              You can save and return later, or proceed to payment
            </li>
          </ul>
        </div>

        <div class="flex space-x-4">
          <button 
            onclick={createNewMemorial}
            disabled={isCreating || !lovedOneName.trim()}
            class="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 disabled:from-gray-600 disabled:to-gray-700 text-black disabled:text-gray-400 py-4 px-6 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 disabled:cursor-not-allowed"
          >
            {#if isCreating}
              <div class="flex items-center justify-center">
                <div class="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                Creating Memorial...
              </div>
            {:else}
              Create Memorial & Continue
            {/if}
          </button>
          
          <button 
            onclick={() => goto('/my-portal')}
            disabled={isCreating}
            class="px-6 py-4 border border-amber-500 hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</section>
