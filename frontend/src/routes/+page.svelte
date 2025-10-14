<script lang="ts">
	import { goto } from '$app/navigation';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Input, Card, Stats, FAQ, Comparison, Steps, Timeline, VideoPlayer } from '$lib/components/minimal-modern';
	import { Star, Shield, Users, Play, Search, Phone, Clock, Pause, Volume2, Maximize, CheckCircle } from 'lucide-svelte';

	let lovedOneName = $state('');
	let searchQuery = $state('');
	let activeTab = $state('families');
	
	// Video player state
	let video: HTMLVideoElement;
	let isPlaying = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state(1);

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
		{ time: "2:00 PM", title: "Service Begins", detail: "Welcome and opening remarks" },
		{ time: "2:30 PM", title: "Live Stream", detail: "Memorial service broadcast" },
		{ time: "3:30 PM", title: "Recording Available", detail: "Download link sent to family" }
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
			description: "Perfect for intimate services",
			features: ["2 hour broadcast", "Private link", "HD recording", "Mobile ready"],
			popular: false,
			familyCta: "Select Package",
			directorCta: "Get Quote"
		},
		{ 
			name: "Standard", 
			description: "Most popular choice",
			popular: true,
			features: ["Multi-camera setup", "On-site technician", "Live support", "Custom graphics"],
			familyCta: "Select Package",
			directorCta: "Get Quote"
		},
		{ 
			name: "Premium", 
			description: "Complete professional service",
			features: ["3+ locations", "Wireless audio", "Professional editing", "Extended archive"],
			popular: false,
			familyCta: "Select Package",
			directorCta: "Get Quote"
		}
	];


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
		goto('/book-demo');
	}

	function handleHowItWorks() {
		console.log('📋 Scrolling to how it works');
		document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
	}

	// Video player functions
	function togglePlay() {
		if (!video) return;
		if (video.paused) {
			video.play();
			isPlaying = true;
		} else {
			video.pause();
			isPlaying = false;
		}
	}

	function handleTimeUpdate() {
		if (!video) return;
		currentTime = video.currentTime;
	}

	function handleLoadedMetadata() {
		if (!video) return;
		duration = video.duration;
	}

	function handleSeek(event: Event) {
		if (!video) return;
		const target = event.target as HTMLInputElement;
		const time = (parseFloat(target.value) / 100) * duration;
		video.currentTime = time;
		currentTime = time;
	}

	function handleVolumeChange(event: Event) {
		if (!video) return;
		const target = event.target as HTMLInputElement;
		volume = parseFloat(target.value) / 100;
		video.volume = volume;
	}

	function toggleFullscreen() {
		if (!video || !video.requestFullscreen) return;
		video.requestFullscreen();
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function handlePackageSelection(packageName: string) {
		console.log('📦 Package selected:', packageName);
		const params = new URLSearchParams();
		params.set('package', packageName.toLowerCase());
		if (lovedOneName.trim()) {
			params.set('name', lovedOneName.trim());
		}
		goto(`/register/loved-one?${params.toString()}`);
	}
</script>

<svelte:head>
	<title>Beautiful, reliable memorial livestreams - TributeStream</title>
	<meta name="description" content="Private links. On-site technicians. Heirloom recordings. Professional memorial livestreaming for families and funeral directors." />
</svelte:head>

<div class="bg-white text-gray-900" style="font-family: {theme.font.body}">
	<!-- Hero Section with Dual-Path CTAs -->
	<section class="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
		<!-- Subtle pattern overlay -->
		<div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 25% 25%, #D5BA7F 2px, transparent 2px); background-size: 60px 60px;"></div>
		
		<div class="relative mx-auto max-w-7xl px-6 z-10">
			<div class="text-center mb-12">
				<h1 class="text-4xl md:text-6xl font-bold text-white mb-6" style="font-family: {theme.font.heading}">
					Beautiful, reliable memorial livestreams
				</h1>
				<p class="text-xl md:text-2xl text-white max-w-3xl mx-auto">
					Bring everyone together—at church, graveside, or from home
				</p>
			</div>

			<!-- Dual CTA Clusters -->
			<div class="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto mb-16">
				<!-- Families CTA Cluster -->
				<div class="text-center">
					<h3 class="text-2xl font-semibold text-white mb-6">For Families</h3>
					<div class="space-y-4">
						<div class="flex gap-2">
							<Input
								type="text"
								placeholder="Loved one's name"
								bind:value={lovedOneName}
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
					<h3 class="text-2xl font-semibold text-white mb-6">For Funeral Directors</h3>
					<div class="space-y-4">
						<Button theme="minimal" onclick={handleBookDemo} class="w-full bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center">
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
					{@const IconComponent = badge.icon}
					<div class="flex items-center gap-2 text-sm text-white">
						<IconComponent class="h-5 w-5 text-[#D5BA7F]" />
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
						<Steps theme="minimal" items={familySteps.map(s => s.title)} current={0} />
						<p class="mt-6 text-slate-600">
							Creating a memorial is simple and respectful. Set up your loved one's tribute page, schedule the service, and share the private link with family and friends. We handle all the technical details so you can focus on what matters most.
						</p>
					{:else}
						<Steps theme="minimal" items={directorSteps.map(s => s.title)} current={0} />
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
					<div class="video-player-custom rounded-lg overflow-hidden shadow-lg bg-black">
						<!-- Video Element -->
						<video 
							bind:this={video}
							class="w-full aspect-video bg-black"
							preload="metadata"
							poster="https://via.placeholder.com/640x360/D5BA7F/FFFFFF?text=TributeStream+About+Us"
							ontimeupdate={handleTimeUpdate}
							onloadedmetadata={handleLoadedMetadata}
							onplay={() => isPlaying = true}
							onpause={() => isPlaying = false}
							onloadstart={() => console.log('About Us video loading started')}
							oncanplay={() => console.log('About Us video can play')}
							onerror={(e) => console.error('About Us video error:', e)}
						>
							<source src="https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/tributestream_-_about_us%20(1080p).mp4?alt=media&token=54cb483c-aa04-4b60-8f3d-15a3085a365a" type="video/mp4">
							<track kind="captions" src="" srclang="en" label="English captions" default>
							Your browser does not support the video tag.
						</video>
						
						<!-- Custom Control Bar -->
						<div class="bg-gradient-to-r from-[#D5BA7F] to-[#C5AA6F] p-4 border-t border-[#B59A5F]">
							<div class="flex items-center space-x-4">
								<!-- Play/Pause Button -->
								<button 
									onclick={togglePlay}
									class="flex items-center justify-center w-12 h-12 bg-black text-[#D5BA7F] rounded-full hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
								>
									{#if isPlaying}
										<Pause class="h-6 w-6" />
									{:else}
										<Play class="h-6 w-6 ml-0.5" />
									{/if}
								</button>
								
								<!-- Progress Bar -->
								<div class="flex-1 flex items-center space-x-3">
									<span class="text-black text-sm font-bold min-w-[45px] tabular-nums">
										{formatTime(currentTime)}
									</span>
									<div class="flex-1 relative">
										<input
											type="range"
											min="0"
											max="100"
											value={duration ? (currentTime / duration) * 100 : 0}
											oninput={handleSeek}
											class="w-full progress-slider"
										/>
									</div>
									<span class="text-black text-sm font-bold min-w-[45px] tabular-nums">
										{formatTime(duration)}
									</span>
								</div>
								
								<!-- Volume Control -->
								<div class="flex items-center space-x-2">
									<Volume2 class="h-5 w-5 text-black" />
									<div class="w-24">
										<input
											type="range"
											min="0"
											max="100"
											value={volume * 100}
											oninput={handleVolumeChange}
											class="w-full volume-slider"
										/>
									</div>
								</div>
								
								<!-- Fullscreen Button -->
								<button 
									onclick={toggleFullscreen}
									class="flex items-center justify-center w-10 h-10 text-black hover:bg-black/10 rounded-lg transition-colors"
								>
									<Maximize class="h-5 w-5" />
								</button>
							</div>
						</div>
					</div>
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
							onclick={() => handlePackageSelection(pkg.name)}
						>
							{pkg.familyCta}
						</Button>
					</Card>
				{/each}
			</div>
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
				<Button theme="minimal" onclick={() => goto('/contact')}>
					Contact Us
				</Button>
			</div>
		</div>
	</section>
</div>

<style>
	/* Custom video player styling */
	:global(.video-player-custom video) {
		background-color: #000;
	}

	:global(.video-player-custom video:focus) {
		outline: 2px solid #D5BA7F;
		outline-offset: 2px;
	}

	/* Progress Slider Styling */
	:global(.progress-slider) {
		-webkit-appearance: none;
		appearance: none;
		height: 6px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 3px;
		outline: none;
		cursor: pointer;
	}

	:global(.progress-slider::-webkit-slider-thumb) {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #000;
		border: 3px solid #D5BA7F;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		margin-top: -6px;
		transition: all 0.2s ease;
	}

	:global(.progress-slider::-webkit-slider-thumb:hover) {
		transform: scale(1.15);
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
	}

	:global(.progress-slider::-moz-range-thumb) {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #000;
		border: 3px solid #D5BA7F;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		-moz-appearance: none;
		transition: all 0.2s ease;
	}

	:global(.progress-slider::-moz-range-track) {
		height: 6px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 3px;
		border: none;
	}

	/* Volume Slider Styling */
	:global(.volume-slider) {
		-webkit-appearance: none;
		appearance: none;
		height: 4px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 2px;
		outline: none;
		cursor: pointer;
	}

	:global(.volume-slider::-webkit-slider-thumb) {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #000;
		border: 2px solid #D5BA7F;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		margin-top: -5px; /* Centers 14px thumb on 4px track */
		transition: all 0.2s ease;
	}

	:global(.volume-slider::-webkit-slider-thumb:hover) {
		transform: scale(1.1);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
	}

	:global(.volume-slider::-moz-range-thumb) {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #000;
		border: 2px solid #D5BA7F;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		-moz-appearance: none;
		transition: all 0.2s ease;
		margin-top: 0;
	}

	:global(.volume-slider::-moz-range-track) {
		height: 4px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 2px;
		border: none;
	}

	/* Progress bar fill effect */
	:global(.progress-slider::-webkit-slider-runnable-track) {
		background: linear-gradient(
			to right,
			#000 0%,
			#000 var(--progress, 0%),
			rgba(0, 0, 0, 0.2) var(--progress, 0%),
			rgba(0, 0, 0, 0.2) 100%
		);
		height: 8px;
		border-radius: 4px;
	}
</style>
