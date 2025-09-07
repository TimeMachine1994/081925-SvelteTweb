<script lang="ts">
  import { onMount } from 'svelte';
  import { AlertTriangle, RefreshCw, Home } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  interface Props {
    fallback?: boolean;
    showRetry?: boolean;
    showHome?: boolean;
    errorTitle?: string;
    errorMessage?: string;
  }

  let {
    fallback = false,
    showRetry = true,
    showHome = true,
    errorTitle = 'Something went wrong',
    errorMessage = 'An unexpected error occurred. Please try again.'
  }: Props = $props();

  let error = $state<Error | null>(null);
  let errorInfo = $state<string>('');
  let retrying = $state(false);

  // Global error handler
  onMount(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      error = event.error;
      errorInfo = event.error?.stack || 'No stack trace available';
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      error = new Error(event.reason?.message || 'Unhandled promise rejection');
      errorInfo = event.reason?.stack || 'No stack trace available';
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  });

  async function retry() {
    retrying = true;
    try {
      // Clear error state
      error = null;
      errorInfo = '';
      
      // Reload the page
      window.location.reload();
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      retrying = false;
    }
  }

  function goHome() {
    goto('/');
  }

  // Log error for monitoring
  $effect(() => {
    if (error) {
      // In production, send to error monitoring service
      console.error('Error boundary caught:', {
        error: error.message,
        stack: errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
  });
</script>

{#if error || fallback}
  <div class="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
        <!-- Error Icon -->
        <div class="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle class="w-8 h-8 text-red-600" />
        </div>

        <!-- Error Title -->
        <h1 class="text-2xl font-bold text-gray-900 mb-4">
          {errorTitle}
        </h1>

        <!-- Error Message -->
        <p class="text-gray-600 mb-8">
          {errorMessage}
        </p>

        <!-- Error Details (Development) -->
        {#if error && import.meta.env.DEV}
          <details class="text-left mb-6">
            <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Technical Details
            </summary>
            <div class="mt-2 p-3 bg-gray-50 rounded-lg text-xs font-mono text-gray-700 overflow-auto max-h-32">
              <div class="font-semibold mb-1">{error.message}</div>
              <div class="whitespace-pre-wrap">{errorInfo}</div>
            </div>
          </details>
        {/if}

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-3">
          {#if showRetry}
            <button
              onclick={retry}
              disabled={retrying}
              class="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw class="w-4 h-4 mr-2 {retrying ? 'animate-spin' : ''}" />
              {retrying ? 'Retrying...' : 'Try Again'}
            </button>
          {/if}

          {#if showHome}
            <button
              onclick={goHome}
              class="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Home class="w-4 h-4 mr-2" />
              Go Home
            </button>
          {/if}
        </div>

        <!-- Help Text -->
        <p class="text-xs text-gray-500 mt-6">
          If this problem persists, please contact support with the error details above.
        </p>
      </div>
    </div>
  </div>
{:else}
  <slot />
{/if}

<style>
  /* Ensure error boundary takes full height */
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
