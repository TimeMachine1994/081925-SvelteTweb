<script lang="ts">
	import { ArrowRight, Heart, Users, Video, Star, Shield, Clock, CheckCircle, Camera, Play, Gift, Sparkles, Calendar, Globe } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Card, Input } from '$lib/components/minimal-modern';

	const theme = getTheme('minimal');

	let eventName = $state('');
	let isSubmitting = $state(false);

	function handleFormSubmit(event: Event) {
		event.preventDefault();
		
		if (!eventName.trim()) {
			const input = document.querySelector('input[placeholder="e.g., Sarah\'s 50th Birthday"]') as HTMLInputElement;
			input?.focus();
			return;
		}

		isSubmitting = true;
		goto(`/create-event?name=${encodeURIComponent(eventName.trim())}`);
	}

	function handleCreateEvent() {
		if (eventName.trim()) {
			goto(`/create-event?name=${encodeURIComponent(eventName.trim())}`);
		} else {
			goto('/create-event');
		}
	}

	function handleGetStarted() {
		goto('/create-event');
	}

	const benefits = [
		{
			icon: Heart,
			title: "Beautiful Event Pages",
			description: "Create a stunning, personalized event page that captures the joy and excitement of your celebration."
		},
		{
			icon: Users,
			title: "Bring Everyone Together",
			description: "Connect guests from around the world with live streaming and interactive features."
		},
		{
			icon: Camera,
			title: "Share Precious Moments",
			description: "Upload photos, videos, and memories that guests can cherish and revisit forever."
		}
	];

	const features = [
		{ title: "Professional Live Streaming", description: "HD quality streaming for celebrations and special moments" },
		{ title: "Interactive Digital Guestbook", description: "Collect heartfelt messages and well-wishes" },
		{ title: "Beautiful Photo Galleries", description: "Showcase life's most precious moments" },
		{ title: "Private Guest Access", description: "Control who can view and contribute" },
		{ title: "Mobile-Friendly Design", description: "Access from any device, anywhere" },
		{ title: "Permanent Archive", description: "Memories preserved for generations" }
	];

	const testimonials = [
		{ text: "Tributestream Live made our wedding accessible to family overseas. The streaming quality was incredible and they captured every special moment beautifully. Everyone felt like they were right there with us!", author: "Sarah & Michael Chen", rating: 5, date: "Jun 15, 2024" },
		{ text: "We used Tributestream Live for my mom's 80th birthday celebration and had over 150 viewers from around the world. The audio and video quality was outstanding. The team was professional and invisible. Highly recommend!", author: "Jennifer Rodriguez", rating: 5, date: "Sep 22, 2024" },
		{ text: "Amazing service for our anniversary celebration. They captured the entire event from start to finish. The recording is something we'll treasure forever. Five stars!", author: "David & Amanda Thompson", rating: 5, date: "Oct 8, 2024" }
	];
</script>

<svelte:head>
	<title>For Event Hosts - Tributestream Live</title>
	<meta
		name="description"
		content="Create a beautiful event page for your celebration. Stream weddings, birthdays, anniversaries, and special moments with Tributestream Live."
	/>
</svelte:head>

<div class="bg-white text-gray-900" style="font-family: {theme.font.body}">
	<!-- Hero Section -->
	<section class="{theme.hero.wrap}">
		<div class="{theme.hero.decoration}" aria-hidden="true"></div>
		<div class="relative z-10 mx-auto max-w-4xl px-6 text-center">
			<div class="mb-4 inline-block rounded-full bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-500">
				✨ Stream Your Celebration
			</div>
			<h1 class="text-4xl md:text-6xl font-bold {theme.hero.heading} mb-6" style="font-family: {theme.font.heading}">
				Celebrate Life's Special Moments
			</h1>
			<p class="text-lg md:text-xl {theme.hero.sub} max-w-2xl mx-auto mb-10">
				Create a beautiful event page that brings everyone together. Stream weddings, birthdays, anniversaries, and celebrations. Share joy, connect hearts, and create memories that last forever.
			</p>

			<!-- Quick Event Creation Form -->
			<Card theme="minimal" class="mx-auto mb-8 max-w-md p-8">
				<h3 class="mb-4 text-xl font-semibold text-slate-900 text-center">Start Your Event</h3>
				<form onsubmit={handleFormSubmit} class="space-y-4">
					<div>
						<label for="eventName" class="mb-2 block text-sm font-medium text-slate-700">
							Event Name
						</label>
						<Input
							theme="minimal"
							bind:value={eventName}
							placeholder="e.g., Sarah's 50th Birthday"
							class="w-full"
						/>
					</div>
					<div class="flex justify-center">
						<Button
							theme="minimal"
							type="submit"
							disabled={isSubmitting || !eventName.trim()}
							class="bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{#if isSubmitting}
								<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
								Creating...
							{:else}
								<Sparkles class="h-5 w-5 mr-2" />
								Get Started Free
							{/if}
						</Button>
					</div>
				</form>
			</Card>

			<p class="mb-6 text-sm text-slate-500">✨ Free to start • No credit card required • Setup in minutes</p>

			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<Button
					theme="minimal"
					onclick={handleGetStarted}
					class="bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center transition-colors"
				>
					<Sparkles class="h-5 w-5 mr-2" />
					Get Started Free
				</Button>
				<Button
					theme="minimal"
					variant="secondary"
					onclick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
					class="flex items-center justify-center"
				>
					<Play class="h-5 w-5 mr-2" />
					See How It Works
				</Button>
			</div>
		</div>
	</section>

	<!-- Benefits Section -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-slate-900 mb-4" style="font-family: {theme.font.heading}">
					Why Hosts Choose Tributestream Live
				</h2>
				<p class="text-lg text-slate-600 max-w-2xl mx-auto">
					Create a meaningful space to celebrate your special moments and bring everyone together for life's most joyful occasions.
				</p>
			</div>
			<div class="grid md:grid-cols-3 gap-8">
				{#each benefits as benefit}
					{@const IconComponent = benefit.icon}
					<Card theme="minimal" class="p-8 text-center">
						<div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 mx-auto mb-4">
							<IconComponent class="h-6 w-6 text-blue-500" />
						</div>
						<h3 class="text-xl font-bold text-slate-900 mb-4">{benefit.title}</h3>
						<p class="text-slate-600">{benefit.description}</p>
					</Card>
				{/each}
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section id="features" class="py-16 bg-slate-50">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-slate-900 mb-4" style="font-family: {theme.font.heading}">
					Everything You Need for Your Celebration
				</h2>
				<p class="text-lg text-slate-600">
					Comprehensive tools to create a meaningful event that everyone can enjoy
				</p>
			</div>
			<div class="grid md:grid-cols-2 gap-12 items-center">
				<!-- Feature List -->
				<div class="space-y-6">
					{#each features as feature}
						<div class="flex items-start space-x-4">
							<CheckCircle class="mt-1 h-6 w-6 flex-shrink-0 text-blue-500" />
							<div>
								<h4 class="font-semibold text-slate-900 mb-1">{feature.title}</h4>
								<p class="text-slate-600">{feature.description}</p>
							</div>
						</div>
					{/each}
				</div>

				<!-- Visual Element -->
				<Card theme="minimal" class="p-8">
					<div class="text-center">
						<div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600">
							<Calendar class="h-10 w-10 text-white" />
						</div>
						<h3 class="mb-4 text-2xl font-bold text-slate-900">Start in Minutes</h3>
						<p class="mb-6 text-slate-600">
							Creating an event page is simple and takes just a few minutes. No technical skills required - just excitement and joy to share.
						</p>
						<div class="flex justify-center">
							<Button
								theme="minimal"
								onclick={handleGetStarted}
								class="bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center px-6 py-3 transition-colors"
							>
								<Sparkles class="h-5 w-5 mr-2" />
								Get Started Free
							</Button>
						</div>
					</div>
				</Card>
			</div>
		</div>
	</section>

	<!-- Testimonials Section -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-slate-900 mb-4" style="font-family: {theme.font.heading}">
					Trusted by Event Hosts Everywhere
				</h2>
				<p class="text-lg text-slate-600">
					See how Tributestream Live has helped hosts celebrate their special moments
				</p>
			</div>
			<div class="grid md:grid-cols-3 gap-8">
				{#each testimonials as testimonial}
					<Card theme="minimal" class="p-6">
						<div class="mb-4 flex items-center">
							<div class="flex text-blue-500">
								{#each Array(testimonial.rating) as _}
									<Star class="h-4 w-4 fill-current" />
								{/each}
							</div>
						</div>
						<p class="mb-4 text-slate-600 italic leading-relaxed">"{testimonial.text}"</p>
						<div class="space-y-1">
							<p class="font-medium text-slate-900">— {testimonial.author}</p>
							<p class="text-xs text-slate-500">{testimonial.date}</p>
						</div>
					</Card>
				{/each}
			</div>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="bg-gradient-to-r from-blue-600 to-blue-700 py-24 text-center">
		<div class="max-w-4xl mx-auto px-6">
			<h2 class="text-3xl md:text-4xl font-bold text-white mb-6" style="font-family: {theme.font.heading}">
				Ready to Create Something Special?
			</h2>
			<p class="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
				Join thousands of hosts who have shared their celebrations with Tributestream Live. Your special moment deserves to be celebrated and remembered forever.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center mb-6">
				<Button
					theme="minimal"
					onclick={handleGetStarted}
					class="bg-white text-blue-600 hover:bg-blue-50 flex items-center justify-center text-lg px-8 py-4 transition-colors"
				>
					<Sparkles class="h-6 w-6 mr-2" />
					Get Started Free
				</Button>
			</div>
			<p class="text-sm text-blue-200">✨ Free to start • No credit card required • Setup in minutes • Cancel anytime</p>
		</div>
	</section>
</div>
