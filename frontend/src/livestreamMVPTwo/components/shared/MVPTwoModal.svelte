<script lang="ts">
  export let isOpen: boolean = false;
  export let title: string = '';
  export let onClose: (() => void) | undefined = undefined;
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  function handleClose() {
    if (onClose) onClose();
    isOpen = false;
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 overflow-y-auto" on:click={handleBackdropClick}>
    <div class="flex min-h-screen items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
      
      <!-- Modal -->
      <div class="relative w-full {sizeClasses[size]} transform rounded-lg bg-white shadow-xl transition-all">
        <!-- Header -->
        {#if title}
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 focus:outline-none"
              on:click={handleClose}
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        {/if}
        
        <!-- Content -->
        <div class="px-6 py-4">
          <slot />
        </div>
        
        <!-- Footer -->
        {#if $$slots.footer}
          <div class="border-t border-gray-200 px-6 py-4">
            <slot name="footer" />
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
