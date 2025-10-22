<script lang="ts">
  import { Card } from '$lib/components/minimal-modern';
  import { Star } from 'lucide-svelte';
  import type { TestimonialsSectionProps } from '$lib/types/homepage';
  
  let { testimonials, partnerFuneralHomes }: TestimonialsSectionProps = $props();
  
  function renderStars(rating: number) {
    return Array(5).fill(0).map((_, i) => i < rating);
  }
</script>

<!-- Social Proof Row -->
<section class="py-16 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid md:grid-cols-3 gap-8 mb-12">
      {#each testimonials as testimonial}
        <Card theme="minimal" class="text-center">
          <div class="flex justify-center mb-3">
            {#each renderStars(testimonial.rating) as filled}
              <Star class="h-4 w-4 {filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}" />
            {/each}
          </div>
          <p class="text-sm text-slate-600 mb-4 leading-relaxed">"{testimonial.text}"</p>
          <div class="space-y-1">
            <p class="font-medium text-slate-900">— {testimonial.author}</p>
            <p class="text-xs text-slate-500">{testimonial.date}</p>
          </div>
        </Card>
      {/each}
    </div>
    
    <div class="text-center">
      <p class="text-sm text-slate-600 mb-4">Trusted by funeral homes across Central Florida</p>
      <div class="space-y-2">
        <div class="text-xs font-medium text-slate-500 uppercase tracking-wider">PARTNER FUNERAL HOMES</div>
        <div class="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs text-slate-400">
          {#each partnerFuneralHomes as home, index}
            <span>{home}</span>
            {#if index < partnerFuneralHomes.length - 1}
              <span class="hidden sm:inline">•</span>
            {/if}
          {/each}
        </div>
      </div>
    </div>
  </div>
</section>
