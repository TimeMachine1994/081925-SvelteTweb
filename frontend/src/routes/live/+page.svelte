<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Input, Card, Stats, FAQ, Comparison } from '$lib/components/minimal-modern';

	let video: HTMLVideoElement;
	let eventName = $state('');

	const theme = getTheme('minimal');

	// Sample data for components
	const statsData = [
		{ label: "Events Streamed", value: "500+" },
		{ label: "Live Viewers", value: "120 avg" },
		{ label: "Happy Hosts", value: "95%" }
	];

	const faqItems = [
		{ q: "What types of events can you stream?", a: "Birthdays, graduations, anniversaries, weddings, parties, corporate events, and any celebration!" },
		{ q: "How quickly can we set up streaming?", a: "Same day setup available for most events. Call us at 407-221-5922 for availability." },
		{ q: "Can guests interact during the stream?", a: "Yes! We offer interactive features like live chat, virtual toasts, and guest messages." },
		{ q: "Do you provide equipment?", a: "Absolutely! We bring all professional cameras, audio equipment, and streaming technology." },
		{ q: "Can we customize the stream?", a: "Yes! Custom graphics, overlays, music, and branding options available for your special event." }
	];

	const packages = [
		{ 
			name: "Starter", 
			price: "$295", 
			features: ["Single camera", "2-hour stream", "HD quality", "Custom link"] 
		},
		{ 
			name: "Celebration", 
			price: "$595", 
			featured: true,
			features: ["Multi-camera setup", "Interactive features", "Live chat", "Custom graphics"] 
		},
		{ 
			name: "Premium Party", 
			price: "$995", 
			features: ["Multiple locations", "Professional host", "Live editing", "Extended archive"] 
		}
	];

	onMount(() => {
		console.log('🎉 Live homepage mounted, setting video playback rate.');
		if (video) {
			video.playbackRate = 0.5;
		}
	});

	function handleCreateEvent() {
		console.log('🎯 Creating event for:', eventName);
		const params = new URLSearchParams();
		if (eventName.trim()) {
			params.set('name', eventName.trim());
		}
		goto(`/live/register/event?${params.toString()}`);
	}

	function handleSearchEvents() {
		console.log('🔍 Searching events for:', eventName);
		const params = new URLSearchParams();
		if (eventName.trim()) {
			params.set('q', eventName.trim());
		}
		goto(`/search?${params.toString()}`);
	}
</script>

<svelte:head>
	<title>TributeStream Live - Celebrate Life's Special Moments</title>
	<meta name="description" content="Professional live event streaming for birthdays, graduations, celebrations, and special moments. Connect friends and family anywhere with high-quality broadcasts." />
</svelte:head>

<div class="min-h-screen bg-white {theme.root}" style="font-family: {theme.font.body}">
	<!-- Hero Section with Video Background -->
	<div class="relative flex min-h-[calc(100vh-80px)] w-full items-center justify-center overflow-hidden">
		<!-- Celebration-themed background gradient overlay -->
		<div class="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-emerald-800/20 -z-10"></div>
		
		<video
			bind:this={video}
			autoplay
			loop
			muted
			playsinline
			class="absolute top-1/2 left-1/2 -z-20 h-full w-full -translate-x-1/2 -translate-y-1/2 transform object-cover"
		>
			<source
				src="https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/tributestream_advertisment%20(720p)%20(1).mp4?alt=media&token=301d3835-f64a-4ba3-8619-343600cb1117"
				type="video/mp4"
			/>
			Your browser does not support the video tag.
		</video>
		<div class="absolute top-0 left-0 -z-10 h-full w-full bg-white/80"></div>
		
		<div class="z-10 p-4 text-center text-black max-w-4xl mx-auto">
			<h1 class="mb-6 text-5xl md:text-6xl font-bold" style="font-family: {theme.font.heading}">
				Celebrate Life's Special Moments
			</h1>
			<p class="mb-8 text-xl md:text-2xl opacity-90">
				Professional live streaming for birthdays, graduations, and celebrations
			</p>
			
			<div class="flex flex-col items-center gap-4 max-w-md mx-auto">
				<Input
					type="text"
					placeholder="Enter event name"
					class="w-full bg-white/90 text-black placeholder-gray-600 border-gray-300"
					bind:value={eventName}
					onkeydown={(e) => {
						if (e.key === 'Enter') handleCreateEvent();
					}}
				/>
				<div class="flex gap-4 flex-wrap justify-center">
					<Button theme="minimal" onclick={handleCreateEvent} class="bg-emerald-500 text-white hover:bg-emerald-600">
						Plan Your Event
					</Button>
					<Button theme="minimal" variant="secondary" onclick={handleSearchEvents} class="bg-white/90 text-black border-gray-300 hover:bg-white">
						Browse Events
					</Button>
				</div>
			</div>
			
			<p class="mt-8 text-xl font-semibold">Ready to Go Live? <a href="tel:407-221-5922" class="text-emerald-600 hover:underline">407-221-5922</a></p>
		</div>
	</div>

	<!-- Stats Section -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold {theme.text}" style="font-family: {theme.font.heading}">
					Bringing Joy to Celebrations Everywhere
				</h2>
				<p class="mt-4 text-lg {theme.hero.sub}">
					Professional live streaming services for life's happiest moments
				</p>
			</div>
			<Stats theme="minimal" stats={statsData} />
		</div>
	</section>

	<!-- Packages Section -->
	<section class="py-16 bg-gradient-to-br from-emerald-50 to-green-50">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold {theme.text}" style="font-family: {theme.font.heading}">
					Celebration Streaming Packages
				</h2>
				<p class="mt-4 text-lg {theme.hero.sub}">
					Professional options to make your special event unforgettable
				</p>
			</div>
			<Comparison theme="minimal" tiers={packages} />
		</div>
	</section>

	<!-- Features Section -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				<Card title="Interactive Features" theme="minimal">
					<div class="text-center">
						<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl">
							💬
						</div>
						<p class="text-sm opacity-80">
							Live chat, virtual toasts, guest messages, and interactive elements that make remote guests feel part of the celebration.
						</p>
					</div>
				</Card>

				<Card title="Professional Quality" theme="minimal">
					<div class="text-center">
						<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl">
							🎥
						</div>
						<p class="text-sm opacity-80">
							HD video with professional lighting and audio to capture every smile, laugh, and special moment in stunning quality.
						</p>
					</div>
				</Card>

				<Card title="Custom Branding" theme="minimal">
					<div class="text-center">
						<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl">
							🎨
						</div>
						<p class="text-sm opacity-80">
							Personalized graphics, overlays, and themes that match your celebration style and make your event uniquely yours.
						</p>
					</div>
				</Card>
			</div>
		</div>
	</section>

	<!-- FAQ Section -->
	<section class="py-16 bg-slate-50">
		<div class="max-w-4xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold {theme.text}" style="font-family: {theme.font.heading}">
					Frequently Asked Questions
				</h2>
				<p class="mt-4 text-lg {theme.hero.sub}">
					Everything you need to know about celebration streaming
				</p>
			</div>
			<Card theme="minimal">
				<FAQ theme="minimal" items={faqItems} />
			</Card>
		</div>
	</section>

	<!-- Call to Action -->
	<section class="py-16 bg-gradient-to-r from-emerald-500/10 to-green-500/10">
		<div class="max-w-4xl mx-auto px-6 text-center">
			<h2 class="text-3xl font-bold {theme.text}" style="font-family: {theme.font.heading}">
				Ready to Stream Your Celebration?
			</h2>
			<p class="mt-4 text-lg {theme.hero.sub} mb-8">
				Let us help you share your special moments with everyone you love, wherever they are.
			</p>
			<div class="flex gap-4 justify-center flex-wrap">
				<Button theme="minimal" onclick={handleCreateEvent} class="text-lg px-8 py-3 bg-emerald-500 text-white hover:bg-emerald-600">
					Start Planning Today
				</Button>
				<Button theme="minimal" variant="secondary" class="text-lg px-8 py-3">
					<a href="tel:407-221-5922" class="no-underline">Call 407-221-5922</a>
				</Button>
			</div>
		</div>
	</section>
</div>
