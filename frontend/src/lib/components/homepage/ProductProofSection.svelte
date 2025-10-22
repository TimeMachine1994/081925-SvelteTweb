<script lang="ts">
  import VideoPlayer from '$lib/components/ui/VideoPlayer.svelte';
  import type { ProductProofSectionProps } from '$lib/types/homepage';
  
  let { videoSrc, posterSrc, features }: ProductProofSectionProps = $props();
</script>

<!-- Product Proof -->
<section class="py-16 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <VideoPlayer
          src={videoSrc}
          poster={posterSrc}
          variant="demo"
          playerId="product-proof-video"
          className="rounded-lg shadow-lg"
        />
        
        <!-- AI Generation Attribution -->
        <div class="text-center mt-4">
          <p class="text-sm text-slate-500 italic">This Ad was made with AI Generation.</p>
        </div>
      </div>
      <div>
        <h3 class="text-2xl font-bold text-slate-900 mb-6">Professional Streaming Technology</h3>
        <ul class="space-y-4">
          {#each features as feature}
            {@const IconComponent = feature.icon}
            <li class="flex items-start gap-3">
              <IconComponent class="h-5 w-5 text-[#D5BA7F] mt-0.5 flex-shrink-0" />
              <div>
                <strong>{feature.title}:</strong> {feature.description}
              </div>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
</section>
