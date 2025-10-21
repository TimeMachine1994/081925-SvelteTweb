<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Input, Card, Stats, FAQ, Comparison } from '$lib/components/minimal-modern';

	let video: HTMLVideoElement;
	let lovedOneName = $state('');

	const theme = getTheme('minimal');

	// Sample data for components
	const statsData = [
		{ label: "Families Served", value: "1,200+" },
		{ label: "Live Viewers", value: "85 avg" },
		{ label: "Counties", value: "9" }
	];

	const faqItems = [
		{ q: "How quickly can we go live?", a: "Same day in most cases. Call us for availability at 407-221-5922." },
		{ q: "Is the memorial link private?", a: "Yes, you control who receives the link. Password protection is optional." },
		{ q: "Can we download the recording?", a: "Yes, you receive a high-quality archive file after the service." },
		{ q: "What if there are technical issues?", a: "Our expert technicians provide on-site support to ensure flawless streaming." },
		{ q: "How many people can watch?", a: "Unlimited viewers. Our worldwide content delivery network handles any audience size." }
	];

	const packages = [
		{ 
			name: "Solo", 
			price: "$395", 
			features: ["Single camera", "Custom link", "HD streaming", "Complimentary download"] 
		},
		{ 
			name: "Live", 
			price: "$895", 
			featured: true,
			features: ["Multi-camera setup", "On-site technician", "Live support", "Custom graphics"] 
		},
		{ 
			name: "Legacy", 
			price: "$1,695", 
			features: ["2+ locations", "On-site videographer", "Professional editing", "Custom USB"] 
		}
	];

	onMount(() => {
		console.log('📹 Legacy homepage mounted, setting video playback rate.');
		if (video) {
			video.playbackRate = 0.5;
		}
	});

	function handleCreateTribute() {
		console.log('🎯 Creating tribute for:', lovedOneName);
		const params = new URLSearchParams();
		if (lovedOneName.trim()) {
			params.set('name', lovedOneName.trim());
		}
		goto(`/register/loved-one?${params.toString()}`);
	}

	function handleSearchTributes() {
		console.log('🔍 Searching tributes for:', lovedOneName);
		const params = new URLSearchParams();
		if (lovedOneName.trim()) {
			params.set('q', lovedOneName.trim());
		}
		goto(`/search?${params.toString()}`);
	}
</script>

<svelte:head>
	<title>TributeStream Legacy - Honor Your Loved One's Memory</title>
	<meta name="description" content="Professional memorial livestreaming services across Central Florida. Connect families anywhere with respectful, high-quality broadcasts for funeral and memorial services." />
</svelte:head>

<div class="min-h-screen bg-white {theme.root}" style="font-family: {theme.font.body}">
	<!-- Hero Section with Video Background -->
	<div class="relative flex min-h-[calc(100vh-80px)] w-full items-center justify-center overflow-hidden">
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
		<div class="absolute top-0 left-0 -z-10 h-full w-full bg-black/60"></div>
		
		<div class="z-10 p-4 text-center text-white max-w-4xl mx-auto">
			<h1 class="mb-6 text-5xl md:text-6xl font-bold" style="font-family: {theme.font.heading}">
				Honor Your Loved One's Memory
			</h1>
			<p class="mb-8 text-xl md:text-2xl opacity-90">
				Beautiful, reliable memorial livestreams that bring everyone together
			</p>
			
			<div class="flex flex-col items-center gap-4 max-w-md mx-auto">
				<Input
					type="text"
					placeholder="Enter loved one's name"
					class="w-full bg-black/70 text-white placeholder-gray-300 border-white/30"
					bind:value={lovedOneName}
					onkeydown={(e) => {
						if (e.key === 'Enter') handleCreateTribute();
					}}
				/>
				<div class="flex gap-4 flex-wrap justify-center">
					<Button theme="minimal" onclick={handleCreateTribute} class="bg-[#D5BA7F] text-black hover:brightness-110">
						Create Memorial
					</Button>
					<Button theme="minimal" variant="secondary" onclick={handleSearchTributes} class="bg-white/20 text-white border-white/30 hover:bg-white/30">
						Search Memorials
					</Button>
				</div>
			</div>
			
			<p class="mt-8 text-xl font-semibold">Call Us To Book Today: <a href="tel:407-221-5922" class="text-[#D5BA7F] hover:underline">407-221-5922</a></p>
		</div>
	</div>

	<!-- Stats Section -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold {theme.text}" style="font-family: {theme.font.heading}">
					Trusted by Families Across Central Florida
				</h2>
				<p class="mt-4 text-lg {theme.hero.sub}">
					Professional memorial livestreaming services with compassionate support
				</p>
			</div>
			<Stats theme="minimal" stats={statsData} />
		</div>
	</section>

	<!-- Packages Section -->
	<section class="py-16 {theme.hero.decoration}">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold {theme.text}" style="font-family: {theme.font.heading}">
					Memorial Service Packages
				</h2>
				<p class="mt-4 text-lg {theme.hero.sub}">
					Professional options to honor your loved one with dignity and respect
				</p>
			</div>
			<Comparison theme="minimal" tiers={packages} />
		</div>
	</section>

	<!-- Features Section -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				<Card title="Professional Quality" theme="minimal">
					<div class="text-center">
						<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[#D5BA7F]/20 flex items-center justify-center text-2xl">
							📹
						</div>
						<p class="text-sm opacity-80">
							HD video quality with professional audio mixing for crystal-clear memorial broadcasts that honor your loved one.
						</p>
					</div>
				</Card>

				<Card title="Private & Secure" theme="minimal">
					<div class="text-center">
						<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[#D5BA7F]/20 flex items-center justify-center text-2xl">
							🔒
						</div>
						<p class="text-sm opacity-80">
							Your memorial service remains private with secure links that you control. Optional password protection available.
						</p>
					</div>
				</Card>

				<Card title="Compassionate Support" theme="minimal">
					<div class="text-center">
						<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[#D5BA7F]/20 flex items-center justify-center text-2xl">
							💝
						</div>
						<p class="text-sm opacity-80">
							Our experienced team provides respectful, professional service during this difficult time with 24/7 support.
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
					We're here to help during this difficult time
				</p>
			</div>
			<Card theme="minimal">
				<FAQ theme="minimal" items={faqItems} />
			</Card>
		</div>
	</section>

	<!-- Call to Action -->
	<section class="py-16 bg-[#D5BA7F]/10">
		<div class="max-w-4xl mx-auto px-6 text-center">
			<h2 class="text-3xl font-bold {theme.text}" style="font-family: {theme.font.heading}">
				Ready to Create a Memorial?
			</h2>
			<p class="mt-4 text-lg {theme.hero.sub} mb-8">
				Let us help you share this important moment with family and friends, near and far.
			</p>
			<div class="flex gap-4 justify-center flex-wrap">
				<Button theme="minimal" onclick={handleCreateTribute} class="text-lg px-8 py-3">
					Get Started Today
				</Button>
				<Button theme="minimal" variant="secondary" class="text-lg px-8 py-3">
					<a href="tel:407-221-5922" class="no-underline">Call 407-221-5922</a>
				</Button>
			</div>
		</div>
	</section>
</div>
