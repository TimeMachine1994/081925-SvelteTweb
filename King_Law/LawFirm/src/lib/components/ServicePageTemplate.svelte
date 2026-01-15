<script lang="ts">
	import Icon from './Icon.svelte';
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

	interface Props {
		title: string;
		icon: IconDefinition;
		description: string;
		whatWeHandle: string[];
		whyChooseUs: string[];
	}

	let { title, icon, description, whatWeHandle, whyChooseUs }: Props = $props();
</script>

<svelte:head>
	<title>{title} - King Law Firm</title>
</svelte:head>

<!-- Hero Section -->
<section class="bg-gradient-to-br from-background via-secondary to-background py-16">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center">
			<div class="mb-6">
				<Icon {icon} size="2xl" class="text-gold" />
			</div>
			<h1 class="font-title text-4xl md:text-6xl font-bold mb-4">{title}</h1>
			<p class="text-xl text-muted-foreground max-w-3xl mx-auto">{description}</p>
		</div>
	</div>
</section>

<!-- Content Section -->
<section class="py-16 bg-background">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
			<!-- What We Handle -->
			<div class="bg-secondary p-8 rounded-lg">
				<h2 class="font-title text-3xl font-bold mb-6">What We Handle</h2>
				<ul class="space-y-3">
					{#each whatWeHandle as item}
						<li class="flex items-start space-x-3">
							<span class="text-gold text-xl">✓</span>
							<span class="text-muted-foreground">{item}</span>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Why Choose Us -->
			<div class="bg-secondary p-8 rounded-lg">
				<h2 class="font-title text-3xl font-bold mb-6">Why Choose Us</h2>
				<ul class="space-y-3">
					{#each whyChooseUs as item}
						<li class="flex items-start space-x-3">
							<span class="text-gold text-xl">★</span>
							<span class="text-muted-foreground">{item}</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="py-16 bg-secondary">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
		<h2 class="font-title text-3xl font-bold mb-4">Ready to Get Started?</h2>
		<p class="text-lg text-muted-foreground mb-8">
			Contact us today for a free consultation to discuss your case.
		</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<a
				href="/contact"
				class="px-8 py-4 bg-gold text-black font-semibold rounded-lg hover:bg-gold-dark transition-colors"
			>
				Schedule Consultation
			</a>
			<a
				href="tel:555-0100"
				class="px-8 py-4 bg-background text-foreground font-semibold rounded-lg hover:bg-secondary transition-colors"
			>
				Call (555) 010-0100
			</a>
		</div>
	</div>
</section>
