<script lang="ts">
  import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
  import { Button, Card, FAQ } from '$lib/components/minimal-modern';
  import type { FAQSectionProps } from '$lib/types/homepage';
  
  let { faqItems, onContactClick }: FAQSectionProps = $props();
  
  const theme = getTheme('minimal');
</script>

<!-- FAQ Section -->
<section id="faq" class="py-16 bg-slate-50">
  <div class="max-w-4xl mx-auto px-6">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-slate-900" style="font-family: {theme.font.heading}">
        Frequently Asked Questions
      </h2>
    </div>
    <Card theme="minimal">
      <FAQ theme="minimal" items={faqItems} />
    </Card>
    <div class="text-center mt-8">
      <p class="text-lg text-slate-600 mb-4">Still have questions?</p>
      <Button theme="minimal" onclick={onContactClick}>
        Contact Us
      </Button>
    </div>
  </div>
</section>
