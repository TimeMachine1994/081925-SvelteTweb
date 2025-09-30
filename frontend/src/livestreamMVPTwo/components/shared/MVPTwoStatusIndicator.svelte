<script lang="ts">
  import type { StreamStatus } from '../../lib/types/streamTypes.js';
  
  export let status: StreamStatus;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let showText: boolean = true;

  const statusConfig = {
    scheduled: {
      color: 'bg-yellow-100 text-yellow-800',
      dotColor: 'bg-yellow-400',
      text: 'Scheduled'
    },
    live: {
      color: 'bg-red-100 text-red-800',
      dotColor: 'bg-red-400',
      text: 'Live'
    },
    completed: {
      color: 'bg-green-100 text-green-800',
      dotColor: 'bg-green-400',
      text: 'Completed'
    },
    cancelled: {
      color: 'bg-gray-100 text-gray-800',
      dotColor: 'bg-gray-400',
      text: 'Cancelled'
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  };

  const dotSizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5'
  };

  $: config = statusConfig[status];
  $: classes = `inline-flex items-center rounded-full font-medium ${config.color} ${sizeClasses[size]}`;
</script>

<span class={classes}>
  <span class="mr-1.5 flex h-2 w-2 relative">
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full {config.dotColor} opacity-75" class:hidden={status !== 'live'}></span>
    <span class="relative inline-flex rounded-full {dotSizeClasses[size]} {config.dotColor}"></span>
  </span>
  {#if showText}
    {config.text}
  {/if}
</span>
