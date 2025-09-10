<script lang="ts">
	import { ArrowRight, CheckCircle, Video, Users, Sparkles, Shield, Star } from 'lucide-svelte';
</script>

<svelte:head>
	<title>For Funeral Directors - TributeStream</title>
	<meta name="description" content="Elevate your services with TributeStream. Offer beautiful, seamless memorial livestreams and digital guestbooks for the families you serve." />
</svelte:head>

<div class="bg-gradient-to-b from-slate-50 to-white">
	<!-- Hero Section -->
	<div class="text-center py-20 md:py-32 px-4">
		<div class="max-w-4xl mx-auto">
			<div class="inline-block bg-blue-100 text-blue-700 font-semibold px-4 py-1 rounded-full text-sm mb-4">
				Partner with TributeStream
			</div>
			<h1 class="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
				Modernize Your Memorial Services
			</h1>
			<p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
				Empower the families you serve with beautiful, reliable memorial livestreams and interactive digital guestbooks. Simple for you, meaningful for them.
			</p>
			<a href="/register/funeral-home" class="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold text-lg">
				Register Your Funeral Home
				<ArrowRight class="w-5 h-5 ml-2" />
			</a>
		</div>
	</div>

	<!-- Benefits Section -->
	<div class="py-20 px-4">
		<div class="max-w-6xl mx-auto">
			<div class="text-center mb-16">
				<h2 class="text-3xl md:text-4xl font-bold text-gray-900">Why Partner with TributeStream?</h2>
				<p class="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">Enhance your offerings, streamline your workflow, and provide unparalleled value to families.</p>
			</div>
			<div class="grid md:grid-cols-3 gap-10">
				<!-- Benefit 1 -->
				<div class="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-shadow">
					<div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
						<Video class="w-6 h-6 text-blue-600" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-2">Effortless Livestreaming</h3>
					<p class="text-gray-600">Go live in minutes with our simple, reliable streaming technology. No technical expertise required. Just click and stream from any device.</p>
				</div>
				<!-- Benefit 2 -->
				<div class="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-shadow">
					<div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
						<Users class="w-6 h-6 text-green-600" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-2">Enhanced Family Experience</h3>
					<p class="text-gray-600">Provide a dedicated, ad-free page for each memorial, complete with a digital guestbook, photo galleries, and service details.</p>
				</div>
				<!-- Benefit 3 -->
				<div class="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-shadow">
					<div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
						<Sparkles class="w-6 h-6 text-purple-600" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-2">Professional Branding</h3>
					<p class="text-gray-600">Your funeral home's name and branding are featured on each memorial page, reinforcing your value to the family and community.</p>
				</div>
			</div>
		</div>
	</div>

	<!-- How It Works Section -->
	<div class="bg-slate-50 py-20 px-4">
		<div class="max-w-5xl mx-auto">
			<div class="text-center mb-16">
				<h2 class="text-3xl md:text-4xl font-bold text-gray-900">Simple Steps to Get Started</h2>
			</div>
			<div class="flex flex-col md:flex-row justify-between items-center space-y-12 md:space-y-0 md:space-x-8">
				<!-- Step 1 -->
				<div class="text-center flex-1">
					<div class="w-16 h-16 bg-white border-2 border-blue-500 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">1</div>
					<h3 class="text-xl font-semibold text-gray-800 mb-2">Register Your Home</h3>
					<p class="text-gray-600">Complete a simple, one-time registration to create your funeral home's account.</p>
				</div>
				<div class="text-gray-300 hidden md:block"><ArrowRight size={32} /></div>
				<!-- Step 2 -->
				<div class="text-center flex-1">
					<div class="w-16 h-16 bg-white border-2 border-blue-500 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">2</div>
					<h3 class="text-xl font-semibold text-gray-800 mb-2">Create a Memorial</h3>
					<p class="text-gray-600">After approval, you can instantly create memorial pages for the families you serve.</p>
				</div>
				<div class="text-gray-300 hidden md:block"><ArrowRight size={32} /></div>
				<!-- Step 3 -->
				<div class="text-center flex-1">
					<div class="w-16 h-16 bg-white border-2 border-blue-500 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">3</div>
					<h3 class="text-xl font-semibold text-gray-800 mb-2">Go Live</h3>
					<p class="text-gray-600">Start the livestream with a single click, connecting friends and family from anywhere.</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Final CTA -->
	<div class="py-24 text-center px-4">
		<div class="max-w-3xl mx-auto">
			<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Ready to Elevate Your Services?</h2>
			<p class="text-lg text-gray-600 mb-10">
				Join our network of forward-thinking funeral directors today. Registration is free and takes just a few minutes.
			</p>
			<a href="/register/funeral-home" class="inline-flex items-center justify-center px-10 py-5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold text-xl">
				Get Started Now
			</a>
		</div>
	</div>

</div>