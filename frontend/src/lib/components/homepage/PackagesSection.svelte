<script lang="ts">
  import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
  import { Button, Card } from '$lib/components/minimal-modern';
  import { CheckCircle } from 'lucide-svelte';
  import type { PackagesSectionProps } from '$lib/types/homepage';
  
  let { packages, onPackageSelection }: PackagesSectionProps = $props();
  
  const theme = getTheme('minimal');
</script>

<!-- Packages & Pricing -->
<section class="py-16 bg-slate-50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-slate-900" style="font-family: {theme.font.heading}">
        Packages & Pricing
      </h2>
      <p class="mt-4 text-lg text-slate-600">
        Professional memorial streaming options for every family's needs
      </p>
    </div>
    <!-- Custom Package Cards -->
    <div class="grid md:grid-cols-3 gap-8">
      {#each packages as pkg}
        <Card theme="minimal" class="relative p-8 text-center {pkg.popular ? 'ring-2 ring-[#D5BA7F] ring-offset-2' : ''}">
          {#if pkg.popular}
            <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#D5BA7F] text-black px-4 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </div>
          {/if}
          <h3 class="text-2xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
          <p class="text-slate-600 mb-6">{pkg.description}</p>
          <ul class="space-y-3 mb-8">
            {#each pkg.features as feature}
              <li class="flex items-center justify-center space-x-2">
                <CheckCircle class="h-4 w-4 text-[#D5BA7F] flex-shrink-0" />
                <span class="text-slate-700">{feature}</span>
              </li>
            {/each}
          </ul>
          <Button 
            theme="minimal" 
            class="w-full {pkg.popular ? 'bg-[#D5BA7F] text-black hover:bg-[#C5AA6F]' : ''}"
            onclick={() => onPackageSelection(pkg.name)}
          >
            {pkg.familyCta}
          </Button>
        </Card>
      {/each}
    </div>
  </div>
</section>
