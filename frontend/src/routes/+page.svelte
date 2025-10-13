<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Input, Card, Stats, FAQ, Comparison, Steps, Timeline, VideoPlayer } from '$lib/components/minimal-modern';
	import { Star, Shield, Users, Play, Search, Phone, Clock } from 'lucide-svelte';

	let video: HTMLVideoElement;
	let lovedOneName = $state('');
	let searchQuery = $state('');
	let activeTab = $state('families');

	const theme = getTheme('minimal');

	// Trust badges
	const trustBadges = [
		{ icon: Shield, text: "1080p HLS" },
		{ icon: Users, text: "Private Access" },
		{ icon: Phone, text: "Expert On-Site Support" }
	];

	// Testimonials
	const testimonials = [
		{ text: "TributeStream made it possible for our family across the country to be part of Dad's service.", author: "Sarah M.", rating: 5 },
		{ text: "Professional setup, flawless streaming. Highly recommend for any memorial service.", author: "Rev. Johnson", rating: 5 },
		{ text: "The recording quality was beautiful. We'll treasure this forever.", author: "Michael R.", rating: 5 }
	];

	// How it works steps
	const familySteps = [
		{ title: "Create Memorial", description: "Set up your loved one's memorial page in minutes" },
		{ title: "Schedule Service", description: "Choose date, time, and streaming options" },
		{ title: "Share & Stream", description: "Send private link to family and friends" }
	];

	const directorSteps = [
		{ title: "Book Demo", description: "Schedule a consultation with our team" },
		{ title: "Setup Service", description: "We handle all technical setup on-site" },
		{ title: "Go Live", description: "Professional streaming with expert support" }
	];

	// Timeline example
	const sampleTimeline = [
		{ time: "2:00 PM", title: "Service Begins", description: "Welcome and opening remarks", isLive: false },
		{ time: "2:30 PM", title: "Live Stream", description: "Memorial service broadcast", isLive: true },
		{ time: "3:30 PM", title: "Recording Available", description: "Download link sent to family", isLive: false }
	];

	const faqItems = [
		{ q: "How quickly can we set up streaming?", a: "Same-day streaming available in most areas. Call 407-221-5922 for immediate availability." },
		{ q: "Is the memorial link private?", a: "Yes, you control who receives the private link. Optional password protection available." },
		{ q: "Can we download the recording?", a: "Yes, you receive a high-quality downloadable archive after the service." },
		{ q: "What if there are technical issues?", a: "Our expert technicians provide on-site support to ensure flawless streaming." },
		{ q: "How many people can watch?", a: "Unlimited viewers. Our 1080p HLS streaming handles any audience size." },
		{ q: "Do you work with funeral homes?", a: "Yes, we partner with funeral directors to provide seamless memorial streaming services." },
		{ q: "What's included in the recording?", a: "Full HD recording, downloadable file, and optional edited highlights reel." },
		{ q: "How do we share the link?", a: "We provide a private, secure link that you can share via email, text, or social media." }
	];

	const packages = [
		{ 
			name: "DIY", 
			price: "$395", 
			features: ["2 hour broadcast", "Private link", "HD recording", "Mobile ready"],
			popular: false,
			familyCta: "Start Online",
			directorCta: "Get Quote"
		},
		{ 
			name: "Standard", 
			price: "$895", 
			popular: true,
			features: ["Multi-camera setup", "On-site technician", "Live support", "Custom graphics"],
			familyCta: "Start Online",
			directorCta: "Get Quote"
		},
		{ 
			name: "Premium", 
			price: "$1,695", 
			features: ["3+ locations", "Wireless audio", "Professional editing", "Extended archive"],
			popular: false,
			familyCta: "Start Online",
			directorCta: "Get Quote"
		}
	];

	onMount(() => {
		console.log('📹 Homepage mounted');
		if (video) {
			video.playbackRate = 0.5;
		}
	});

	function renderStars(rating: number) {
		return Array(5).fill(0).map((_, i) => i < rating);
	}

	function handleCreateTribute() {
		console.log('🎯 Creating tribute for:', lovedOneName);
		const params = new URLSearchParams();
		if (lovedOneName.trim()) {
			params.set('name', lovedOneName.trim());
		}
		goto(`/register/loved-one?${params.toString()}`);
	}

	function handleSearchTributes() {
		console.log('🔍 Searching tributes for:', searchQuery);
		if (searchQuery.trim()) {
			goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	}

	function handleBookDemo() {
		console.log('📞 Booking demo');
		goto('/contact?type=demo');
	}

	function handleHowItWorks() {
		console.log('📋 Scrolling to how it works');
		document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
		const params = new URLSearchParams();
		if (lovedOneName.trim()) {
			params.set('q', lovedOneName.trim());
		}
		goto(`/search?${params.toString()}`);
	}
</script>

<svelte:head>
	<title>Beautiful, reliable memorial livestreams - TributeStream</title>
	<meta name="description" content="Private links. On-site technicians. Heirloom recordings. Professional memorial livestreaming for families and funeral directors." />
</svelte:head>

<div class="bg-white text-gray-900" style="font-family: {theme.font.body}">
	<!-- Hero Section with Dual-Path CTAs -->
	<section class="bg-gradient-to-br from-slate-50 to-amber-50 min-h-[90vh] flex items-center">
		<div class="relative z-10 mx-auto max-w-7xl px-6">
			<div class="text-center mb-12">
				<h1 class="text-4xl md:text-6xl font-bold text-slate-900 mb-6" style="font-family: {theme.font.heading}">
					Beautiful, reliable memorial livestreams
				</h1>
				<p class="text-xl md:text-2xl text-slate-700 max-w-3xl mx-auto">
					Bring everyone together—at church, graveside, or from home
				</p>
			</div>

			<!-- Dual CTA Clusters -->
			<div class="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto mb-16">
				<!-- Families CTA Cluster -->
				<div class="text-center">
					<h3 class="text-2xl font-semibold text-slate-900 mb-6">For Families</h3>
					<div class="space-y-4">
						<div class="flex gap-2">
							<Input
								type="text"
								placeholder="Loved one's name"
								bind:value={lovedOneName}
								theme="minimal"
								class="flex-1"
							/>
							<Button theme="minimal" onclick={handleCreateTribute} class="bg-[#D5BA7F] text-white hover:bg-[#C5AA6F]">
								Create Memorial
							</Button>
						</div>
						<div class="flex gap-2">
							<Input
								type="text"
								placeholder="Search existing tributes"
								bind:value={searchQuery}
								theme="minimal"
								class="flex-1"
							/>
							<Button theme="minimal" variant="secondary" onclick={handleSearchTributes}>
								<Search class="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>

				<!-- Directors CTA Cluster -->
				<div class="text-center">
					<h3 class="text-2xl font-semibold text-slate-900 mb-6">For Funeral Directors</h3>
					<div class="space-y-4">
						<Button theme="minimal" onclick={handleBookDemo} class="w-full bg-slate-900 text-white hover:bg-slate-800">
							<Phone class="h-4 w-4 mr-2" />
							Book a Demo
						</Button>
						<Button theme="minimal" variant="secondary" onclick={handleHowItWorks} class="w-full">
							How it works
						</Button>
					</div>
				</div>
			</div>

			<!-- Trust Mini-Strip -->
			<div class="flex justify-center items-center gap-8 flex-wrap">
				{#each trustBadges as badge}
					<div class="flex items-center gap-2 text-sm text-slate-600">
						<svelte:component this={badge.icon} class="h-5 w-5 text-[#D5BA7F]" />
						<span>{badge.text}</span>
					</div>
				{/each}
			</div>
		</div>
	</section>

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
						<p class="text-sm text-slate-600 mb-4">"{testimonial.text}"</p>
						<p class="font-medium text-slate-900">— {testimonial.author}</p>
					</Card>
				{/each}
			</div>
			
			<div class="text-center">
				<p class="text-sm text-slate-600 mb-4">Trusted by funeral homes across Central Florida</p>
				<div class="flex justify-center items-center gap-8 opacity-60">
					<div class="text-xs font-medium">PARTNER FUNERAL HOMES</div>
				</div>
			</div>
		</div>
	</section>

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
						onclick={() => activeTab = 'families'}
					>
						Families
					</button>
					<button 
						class="px-6 py-2 rounded-md transition-colors {activeTab === 'directors' ? 'bg-[#D5BA7F] text-white' : 'text-gray-600 hover:text-gray-900'}"
						onclick={() => activeTab = 'directors'}
					>
						Funeral Directors
					</button>
				</div>
			</div>

			<div class="grid md:grid-cols-2 gap-12 items-start">
				<div>
					{#if activeTab === 'families'}
						<Steps theme="minimal" steps={familySteps} />
						<p class="mt-6 text-slate-600">
							Creating a memorial is simple and respectful. Set up your loved one's tribute page, schedule the service, and share the private link with family and friends. We handle all the technical details so you can focus on what matters most.
						</p>
					{:else}
						<Steps theme="minimal" steps={directorSteps} />
						<p class="mt-6 text-slate-600">
							Partner with us for seamless memorial streaming. Our experienced technicians arrive early, handle all setup, and provide live support throughout the service. You focus on the family—we ensure the technology works flawlessly.
						</p>
					{/if}
				</div>
				
				<div>
					<h4 class="text-lg font-semibold text-slate-900 mb-4">Service Day Timeline</h4>
					<Timeline theme="minimal" events={sampleTimeline} />
				</div>
			</div>
		</div>
	</section>

	<!-- Product Proof -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="grid md:grid-cols-2 gap-12 items-center">
				<div>
					<VideoPlayer 
						theme="minimal"
						title="Memorial Service Demo"
						poster="https://via.placeholder.com/640x360/D5BA7F/FFFFFF?text=Memorial+Service+Demo"
						muted={true}
					/>
				</div>
				<div>
					<h3 class="text-2xl font-bold text-slate-900 mb-6">Professional Streaming Technology</h3>
					<ul class="space-y-4">
						<li class="flex items-start gap-3">
							<Shield class="h-5 w-5 text-[#D5BA7F] mt-0.5 flex-shrink-0" />
							<div>
								<strong>Reliability:</strong> 99.9% uptime with automatic failover systems
							</div>
						</li>
						<li class="flex items-start gap-3">
							<Users class="h-5 w-5 text-[#D5BA7F] mt-0.5 flex-shrink-0" />
							<div>
								<strong>Private links:</strong> Secure, password-protected access for invited guests only
							</div>
						</li>
						<li class="flex items-start gap-3">
							<Play class="h-5 w-5 text-[#D5BA7F] mt-0.5 flex-shrink-0" />
							<div>
								<strong>Downloadable archive:</strong> High-quality recording delivered within 24 hours
							</div>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

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
			<Comparison theme="minimal" tiers={packages} />
		</div>
	</section>

	<!-- Regional Trust & Availability -->
	<section class="py-16 bg-white">
		<div class="max-w-4xl mx-auto px-6 text-center">
			<h3 class="text-2xl font-bold text-slate-900 mb-8">Central Florida Coverage</h3>
			<div class="grid md:grid-cols-3 gap-8 mb-8">
				<div>
					<Clock class="h-8 w-8 text-[#D5BA7F] mx-auto mb-3" />
					<h4 class="font-semibold text-slate-900 mb-2">Same-Day Available</h4>
					<p class="text-sm text-slate-600">Emergency streaming setup in most areas</p>
				</div>
				<div>
					<Phone class="h-8 w-8 text-[#D5BA7F] mx-auto mb-3" />
					<h4 class="font-semibold text-slate-900 mb-2">24/7 Support</h4>
					<p class="text-sm text-slate-600">Call or text: <a href="tel:407-221-5922" class="text-[#D5BA7F] hover:underline">407-221-5922</a></p>
				</div>
				<div>
					<Users class="h-8 w-8 text-[#D5BA7F] mx-auto mb-3" />
					<h4 class="font-semibold text-slate-900 mb-2">9 Counties</h4>
					<p class="text-sm text-slate-600">Orange, Seminole, Lake, Volusia & more</p>
				</div>
			</div>
		</div>
	</section>

	<!-- FAQ Section -->
	<section class="py-16 bg-slate-50">
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
				<Button theme="minimal" onclick={() => goto('/contact')}>
					Contact Us
				</Button>
			</div>
		</div>
	</section>
</div>
