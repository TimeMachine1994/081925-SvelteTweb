<script lang="ts">
  import type { TrustBadgesSectionProps } from '$lib/types/homepage';
  
  let { badges }: TrustBadgesSectionProps = $props();
</script>

<!-- Trust Badges Section -->
<section class="py-8 bg-slate-900">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex justify-center items-center gap-8 flex-wrap">
      {#each badges as badge}
        {@const IconComponent = badge.icon}
        <div class="flex items-center gap-2 text-sm text-white">
          <IconComponent class="h-5 w-5 text-[#D5BA7F]" />
          <span>{badge.text}</span>
        </div>
      {/each}
    </div>
  </div>
</section>
