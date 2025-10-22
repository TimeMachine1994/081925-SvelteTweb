<script lang="ts">
  import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
  import { Button, Timeline } from '$lib/components/minimal-modern';
  import type { HowItWorksSectionProps } from '$lib/types/homepage';
  
  let {
    familySteps,
    directorSteps,
    sampleTimeline,
    activeTab,
    currentStep,
    onTabChange,
    onStepChange
  }: HowItWorksSectionProps = $props();
  
  const theme = getTheme('minimal');
  
  let currentSteps = $derived(activeTab === 'families' ? familySteps : directorSteps);
</script>

<!-- How It Works (Split by Audience) -->
<section id="how-it-works" class="py-16 bg-slate-50">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-slate-900" style="font-family: {theme.font.heading}">
        How It Works
      </h2>
    </div>

    <!-- Tabs -->
    <div class="flex justify-center mb-12">
      <div class="bg-white rounded-lg p-1 shadow-sm">
        <button 
          class="px-6 py-2 rounded-md transition-colors {activeTab === 'families' ? 'bg-[#D5BA7F] text-white' : 'text-gray-600 hover:text-gray-900'}"
          onclick={() => { onTabChange('families'); onStepChange(0); }}
        >
          Families
        </button>
        <button 
          class="px-6 py-2 rounded-md transition-colors {activeTab === 'directors' ? 'bg-[#D5BA7F] text-white' : 'text-gray-600 hover:text-gray-900'}"
          onclick={() => { onTabChange('directors'); onStepChange(0); }}
        >
          Funeral Directors
        </button>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-12 items-start">
      <div>
        <!-- Interactive Step Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 mb-8">
          {#each currentSteps as step, index}
            <button
              class="flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 text-left {currentStep === index ? 'border-[#D5BA7F] bg-[#D5BA7F]/10' : 'border-gray-200 bg-white hover:border-[#D5BA7F]/50'}"
              onclick={() => onStepChange(index)}
            >
              <div class="text-xs font-semibold text-[#D5BA7F] mb-1">Step {index + 1}</div>
              <div class="font-medium text-slate-900">{step.title}</div>
            </button>
          {/each}
        </div>

        <!-- Dynamic Step Description -->
        <div class="mb-8">
          <p class="text-slate-600 text-lg leading-relaxed">
            {currentSteps[currentStep].description}
          </p>
        </div>

        <!-- CTA Button -->
        <div class="flex justify-center sm:justify-start">
          {#if activeTab === 'families'}
            <Button theme="minimal" class="bg-[#D5BA7F] text-black hover:bg-[#C5AA6F] px-8 py-3">
              <a href="/register/loved-one" class="no-underline text-black font-semibold">
                Create Memorial
              </a>
            </Button>
          {:else}
            <Button theme="minimal" class="bg-[#D5BA7F] text-black hover:bg-[#C5AA6F] px-8 py-3">
              <a href="/contact" class="no-underline text-black font-semibold">
                Book Demo
              </a>
            </Button>
          {/if}
        </div>
      </div>
      
      <div>
        <h4 class="text-lg font-semibold text-slate-900 mb-4">Service Day Timeline</h4>
        <Timeline theme="minimal" events={sampleTimeline} />
      </div>
    </div>
  </div>
</section>
