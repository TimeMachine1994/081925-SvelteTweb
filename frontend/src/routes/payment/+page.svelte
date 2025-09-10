<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { Clock } from 'lucide-svelte';

  let { data } = $props();
  
  let status = $state('Redirecting to payment...');
  let error = $state('');

  onMount(async () => {
    if (!browser) return;

    const bookingData = data.bookingData;
    if (!bookingData) {
      status = 'Error: No booking data found.';
      error = 'Navigating back to schedule page...';
      setTimeout(() => goto('/schedule'), 3000);
      return;
    }

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          bookingData,
          memorialId: bookingData.memorialId,
          customerInfo: { email: data.user?.email || '' }
        }),
      });

      const result = await response.json();

      if (response.ok && result.url) {
        status = 'Redirecting to secure payment gateway...';
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'Failed to create payment session.');
      }
    } catch (e: any) {
      console.error('Failed to initiate payment:', e);
      status = 'Payment Initiation Failed';
      error = e.message || 'An unknown error occurred. Please try again.';
    }
  });
</script>

<svelte:head>
  <title>Redirecting to Payment...</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
  <div class="text-center p-8 bg-white/50 backdrop-blur-lg rounded-xl shadow-lg">
    <div class="w-16 h-16 mx-auto mb-6 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
    <h1 class="text-2xl font-bold text-gray-800 mb-2">{status}</h1>
    {#if error}
      <p class="text-red-600">{error}</p>
    {:else}
      <p class="text-gray-600">Please wait while we securely redirect you to our payment partner.</p>
    {/if}
  </div>
</div>
