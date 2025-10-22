<script lang="ts">
  import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
  import { Button, Input } from '$lib/components/minimal-modern';
  import VideoPlayer from '$lib/components/ui/VideoPlayer.svelte';
  import { Search, Phone } from 'lucide-svelte';
  import type { HeroSectionProps } from '$lib/types/homepage';
  
  let {
    lovedOneName,
    searchQuery,
    onCreateTribute,
    onSearchTributes,
    onBookDemo,
    onHowItWorks,
    onLovedOneNameChange,
    onSearchQueryChange
  }: HeroSectionProps = $props();
  
  const theme = getTheme('minimal');
  
  function handleCreateTribute() {
    onCreateTribute(lovedOneName);
  }
  
  function handleSearchTributes() {
    onSearchTributes(searchQuery);
  }
  
  function handleLovedOneNameInput(event: Event) {
    const target = event.target as HTMLInputElement;
    onLovedOneNameChange(target.value);
  }
  
  function handleSearchQueryInput(event: Event) {
    const target = event.target as HTMLInputElement;
    onSearchQueryChange(target.value);
  }
</script>

<!-- Hero Section with Stacked Layout -->
<section class="relative min-h-[90vh] flex flex-col bg-black">
  <!-- Video Background -->
  <video
    class="absolute inset-0 w-full h-full object-cover"
    autoplay
    muted
    loop
    playsinline
  >
    <source src="https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/tributestream_advertisment%20(720p)%20(1).mp4?alt=media&token=301d3835-f64a-4ba3-8619-343600cb1117" type="video/mp4">
  </video>
  
  <!-- Dark overlay for text readability -->
  <div class="absolute inset-0 bg-black/50"></div>
  
  <!-- Stacked Content Container -->
  <div class="relative z-10 flex flex-col min-h-[80vh]">
    <!-- Top: Forms and Text -->
    <div class="pt-8 pb-8">
      <div class="mx-auto max-w-7xl px-6">
        <div class="text-center mb-8">
          <h1 class="text-4xl md:text-6xl font-bold text-white mb-4" style="font-family: {theme.font.heading}">
            Beautiful, reliable memorial livestreams
          </h1>
          <p class="text-xl md:text-2xl text-white max-w-3xl mx-auto mb-8">
            Bring everyone together—at church, graveside, or from home
          </p>
        </div>

        <!-- Dual CTA Clusters -->
        <div class="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <!-- Families CTA Cluster -->
          <div class="text-center">
            <h3 class="text-2xl font-semibold text-white mb-4">For Families</h3>
            <div class="space-y-3">
              <div class="flex gap-2">
                <Input
                  type="text"
                  placeholder="Loved one's name"
                  value={lovedOneName}
                  oninput={handleLovedOneNameInput}
                  theme="minimal"
                  class="flex-1"
                />
                <Button theme="minimal" onclick={handleCreateTribute} class="bg-[#D5BA7F] text-black hover:bg-[#C5AA6F]">
                  Create Memorial
                </Button>
              </div>
              <div class="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search memorials..."
                  value={searchQuery}
                  oninput={handleSearchQueryInput}
                  theme="minimal"
                  class="flex-1"
                />
                <Button theme="minimal" onclick={handleSearchTributes} class="bg-white text-gray-900 hover:bg-gray-100 flex items-center">
                  <Search class="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>

          <!-- Funeral Directors CTA Cluster -->
          <div class="text-center">
            <h3 class="text-2xl font-semibold text-white mb-4">For Funeral Directors</h3>
            <div class="space-y-3">
              <Button theme="minimal" onclick={onBookDemo} class="w-full bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center">
                <Phone class="h-4 w-4 mr-2" />
                Book a Demo
              </Button>
              <Button theme="minimal" variant="secondary" onclick={onHowItWorks} class="w-full">
                How it works
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Middle: Demo Video - Own row -->
    <div class="px-6 py-8">
      <div class="w-full max-w-md mx-auto">
        <div class="relative rounded-lg overflow-hidden shadow-2xl bg-black/20 backdrop-blur-sm border border-white/10">
          <VideoPlayer
            src="https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/tributestream_advertisment%20(720p)%20(1).mp4?alt=media&token=301d3835-f64a-4ba3-8619-343600cb1117"
            poster="https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/video-posters%2Ftributestream-hero-poster.jpg?alt=media&token=301d3835-f64a-4ba3-8619-343600cb1117"
            variant="hero"
            playerId="hero-demo-video"
            className="scale-110"
          />
        </div>
      </div>
    </div>
  </div>
</section>
