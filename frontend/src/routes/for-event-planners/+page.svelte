<script lang="ts">
	import { ArrowRight, CheckCircle, Video, Users, Sparkles, Shield, Star, Phone, Calendar, Gift, Play, Clock, Building2, Briefcase } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Card, Steps, Timeline, Comparison } from '$lib/components/minimal-modern';

	const theme = getTheme('minimal');

	const benefits = [
		{ 
			icon: Video, 
			title: "Professional Streaming", 
			description: "Worldwide content delivery network with automatic failover systems. 99.9% uptime guarantee for your most important events." 
		},
		{ 
			icon: Users, 
			title: "Event Creation & Management", 
			description: "Create beautiful event pages with digital guestbooks, photo galleries, slideshow creation, and easy-to-use management interface." 
		},
		{ 
			icon: Building2, 
			title: "Your Brand Featured", 
			description: "Your company's name and branding prominently displayed on each event page, reinforcing your value and professional services." 
		}
	];

	const steps = [
		{ title: "Schedule Demo", description: "Book a free consultation and demonstration" },
		{ title: "Partner Setup", description: "Simple onboarding and training process" },
		{ title: "Go Live", description: "Start offering streaming to your clients" }
	];

	const packages = [
		{ 
			name: "Basic Partnership", 
			price: "No Cost", 
			features: ["Free marketing materials", "Basic training", "Phone support", "Standard branding"],
			popular: false,
			hostCta: "Learn More",
			plannerCta: "Get Started"
		},
		{ 
			name: "Premium Partnership", 
			price: "Contact Us", 
			popular: true,
			features: ["On-site technical support", "Priority customer support", "Custom branding", "Marketing materials", "SEO optimization", "Social media promotion"],
			hostCta: "Learn More",
			plannerCta: "Learn More"
		}
	];

	function handleBookDemo() {
		goto('/book-demo');
	}

	function handleRegister() {
		goto('/register/event-planner');
	}
</script>

<svelte:head>
	<title>For Event Planners - Tributestream Live</title>
	<meta
		name="description"
		content="Elevate your services with Tributestream Live. Offer beautiful, seamless event livestreams and digital experiences for the clients you serve."
	/>
</svelte:head>

<div class="bg-white text-gray-900" style="font-family: {theme.font.body}">
	<!-- Hero Section -->
	<section class="{theme.hero.wrap}">
		<div class="{theme.hero.decoration}" aria-hidden="true"></div>
		<div class="relative z-10 mx-auto max-w-4xl px-6 text-center">
			<div class="mb-4 inline-block rounded-full bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-500">
				Partner with Tributestream Live
			</div>
			<h1 class="text-4xl md:text-6xl font-bold {theme.hero.heading} mb-6" style="font-family: {theme.font.heading}">
				Create Beautiful Events for Your Clients
			</h1>
			<p class="text-lg md:text-xl {theme.hero.sub} max-w-2xl mx-auto mb-10">
				Register your event planner account to create event pages, manage livestreams, and help clients build unforgettable digital experiences with photos, videos, and celebrations.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<Button theme="minimal" onclick={handleBookDemo} class="bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center">
					<Calendar class="h-5 w-5 mr-2" />
					Book Free Demo
				</Button>
				<Button theme="minimal" variant="secondary" onclick={handleRegister} class="flex items-center justify-center">
					<ArrowRight class="h-5 w-5 mr-2" />
					Create Your Planner Account
				</Button>
			</div>
		</div>
	</section>

	<!-- Benefits Section -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-slate-900 mb-4" style="font-family: {theme.font.heading}">
					Why Create Your Event Planner Account?
				</h2>
				<p class="text-lg text-slate-600 max-w-2xl mx-auto">
					Get your own dashboard to create events for clients, track their progress, and provide comprehensive digital event services.
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

	<!-- How It Works Section -->
	<section class="py-16 bg-slate-50">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-slate-900 mb-4" style="font-family: {theme.font.heading}">
					Simple Steps to Get Started
				</h2>
				<p class="text-lg text-slate-600">
					Partner with us in three easy steps
				</p>
			</div>
			<div class="grid md:grid-cols-2 gap-12 items-center">
				<div>
					<Steps theme="minimal" items={steps.map(s => s.title)} current={0} />
					<p class="mt-6 text-slate-600">
						Getting started is simple. Create your event planner account, get access to your dashboard, and start creating beautiful events for the clients you serve.
					</p>
				</div>
				<Card theme="minimal" class="p-8">
					<h3 class="text-xl font-bold text-slate-900 mb-6">Your Planner Dashboard Includes</h3>
					<div class="space-y-4">
						<div class="flex items-center space-x-3">
							<Users class="h-5 w-5 text-blue-500" />
							<span class="text-slate-700">Create events for clients</span>
						</div>
						<div class="flex items-center space-x-3">
							<Video class="h-5 w-5 text-blue-500" />
							<span class="text-slate-700">Manage livestreams & recordings</span>
						</div>
						<div class="flex items-center space-x-3">
							<Gift class="h-5 w-5 text-blue-500" />
							<span class="text-slate-700">Build photo galleries & slideshows</span>
						</div>
						<div class="flex items-center space-x-3">
							<Briefcase class="h-5 w-5 text-blue-500" />
							<span class="text-slate-700">Track client events & bookings</span>
						</div>
						<div class="flex items-center space-x-3">
							<CheckCircle class="h-5 w-5 text-blue-500" />
							<span class="text-slate-700">Professional technical support</span>
						</div>
					</div>
				</Card>
			</div>
		</div>
	</section>

	<!-- Packages Section -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-slate-900 mb-4" style="font-family: {theme.font.heading}">
					Partnership Options
				</h2>
				<p class="text-lg text-slate-600">
					Choose the partnership level that works best for your business
				</p>
			</div>
			<div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
				{#each packages as pkg}
					<Card theme="minimal" class="relative p-8 text-center {pkg.popular ? 'ring-2 ring-blue-500 ring-offset-2' : ''}">
						{#if pkg.popular}
							<div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
								Most Popular
							</div>
						{/if}
						<h3 class="text-2xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
						<div class="text-3xl font-bold text-blue-500 mb-6">{pkg.price}</div>
						<ul class="space-y-3 mb-8">
							{#each pkg.features as feature}
								<li class="flex items-center justify-center space-x-2">
									<CheckCircle class="h-4 w-4 text-blue-500 flex-shrink-0" />
									<span class="text-slate-700">{feature}</span>
								</li>
							{/each}
						</ul>
						<Button 
							theme="minimal" 
							class="w-full {pkg.popular ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}"
							onclick={handleBookDemo}
						>
							{pkg.plannerCta}
						</Button>
					</Card>
				{/each}
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="bg-gradient-to-r from-blue-600 to-blue-700 py-24 text-center">
		<div class="max-w-4xl mx-auto px-6">
			<h2 class="text-3xl md:text-4xl font-bold text-white mb-6" style="font-family: {theme.font.heading}">
				Ready to Partner with Us?
			</h2>
			<p class="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
				Join event planners who trust Tributestream Live to deliver professional streaming services for their clients' special moments.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<Button theme="minimal" onclick={handleBookDemo} class="bg-white text-blue-600 hover:bg-blue-50 flex items-center justify-center text-lg px-8 py-4">
					<Calendar class="h-6 w-6 mr-2" />
					Book Free Demo
				</Button>
				<Button theme="minimal" onclick={handleRegister} class="bg-blue-800 text-white hover:bg-blue-900 flex items-center justify-center text-lg px-8 py-4">
					<ArrowRight class="h-6 w-6 mr-2" />
					Create Account
				</Button>
			</div>
		</div>
	</section>
</div>
