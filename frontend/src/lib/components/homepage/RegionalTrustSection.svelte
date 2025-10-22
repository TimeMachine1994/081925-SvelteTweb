<script lang="ts">
  import type { RegionalTrustSectionProps } from '$lib/types/homepage';
  
  let { phoneNumber, serviceAreas, features }: RegionalTrustSectionProps = $props();
</script>

<!-- Regional Trust & Availability -->
<section class="py-16 bg-white">
  <div class="max-w-4xl mx-auto px-6 text-center">
    <h3 class="text-2xl font-bold text-slate-900 mb-8">Central Florida Coverage</h3>
    <div class="grid md:grid-cols-3 gap-8 mb-8">
      {#each features as feature}
        {@const IconComponent = feature.icon}
        <div>
          <IconComponent class="h-8 w-8 text-[#D5BA7F] mx-auto mb-3" />
          <h4 class="font-semibold text-slate-900 mb-2">{feature.title}</h4>
          <p class="text-sm text-slate-600">
            {#if feature.title === '24/7 Support'}
              Call or text: <a href="tel:{phoneNumber}" class="text-[#D5BA7F] hover:underline">{phoneNumber}</a>
            {:else if feature.title.includes('Counties')}
              {serviceAreas.join(', ')} & more
            {:else}
              {feature.description}
            {/if}
          </p>
        </div>
      {/each}
    </div>
  </div>
</section>
