<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  import Button from './Button.svelte';
  import Badge from './Badge.svelte';
  
  interface Event {
    id: string;
    name: string;
    dates: string;
    description?: string;
    imageUrl?: string;
    isLive?: boolean;
    isPrivate?: boolean;
    viewerCount?: number;
    serviceDate?: string;
    location?: string;
  }
  
  interface Props {
    theme?: ThemeKey;
    event: Event;
    class?: string;
    onView?: () => void;
    onShare?: () => void;
  }
  
  let {
    theme = 'minimal',
    event,
    class: className = '',
    onView,
    onShare
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
</script>

<div class="{themeConfig.card} p-6 {className} hover:shadow-lg transition-shadow duration-200">
  <!-- Event Image -->
  {#if event.imageUrl}
    <div class="relative mb-4 overflow-hidden rounded-xl">
      <img 
        src={event.imageUrl} 
        alt={event.name}
        class="w-full h-48 object-cover"
      />
      {#if event.isLive}
        <div class="absolute top-3 right-3">
          <Badge theme={theme} class="bg-red-500 text-white animate-pulse">
            🔴 Live
          </Badge>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Event Header -->
  <div class="mb-4">
    <div class="flex items-start justify-between mb-2">
      <h3 class="text-xl font-semibold {themeConfig.text}" style="font-family: {themeConfig.font.heading}">
        {event.name}
      </h3>
      <div class="flex gap-2">
        {#if event.isPrivate}
          <Badge theme={theme} class="bg-slate-100 text-slate-700 text-xs">
            🔒 Private
          </Badge>
        {/if}
      </div>
    </div>
    
    <p class="text-sm {themeConfig.hero.sub} font-medium">
      {event.dates}
    </p>
    
    {#if event.location}
      <p class="text-sm {themeConfig.hero.sub} mt-1">
        📍 {event.location}
      </p>
    {/if}
  </div>

  <!-- Event Description -->
  {#if event.description}
    <p class="text-sm {themeConfig.hero.sub} mb-4 line-clamp-3">
      {event.description}
    </p>
  {/if}

  <!-- Service Information -->
  {#if event.serviceDate}
    <div class="mb-4 p-3 rounded-lg bg-blue-500/10 border border-[#3B82F6]/20">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium {themeConfig.text}">Service:</span>
        <span class="text-sm {themeConfig.hero.sub}">{event.serviceDate}</span>
      </div>
      {#if event.viewerCount !== undefined}
        <div class="flex items-center gap-2 mt-1">
          <span class="text-xs {themeConfig.hero.sub}">
            {event.viewerCount} {event.viewerCount === 1 ? 'viewer' : 'viewers'}
            {event.isLive ? 'watching' : 'attended'}
          </span>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Action Buttons -->
  <div class="flex gap-3">
    <Button theme={theme} onclick={onView} class="flex-1">
      {event.isLive ? 'Watch Live' : 'View Event'}
    </Button>
    {#if onShare}
      <Button theme={theme} variant="secondary" onclick={onShare}>
        Share
      </Button>
    {/if}
  </div>
</div>

<style>
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
