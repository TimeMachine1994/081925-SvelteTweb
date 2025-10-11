<script lang="ts">
	import { ArrowRight, CheckCircle, Video, Users, Sparkles, Shield, Star } from 'lucide-svelte';
</script>

<svelte:head>
	<title>For Funeral Directors - TributeStream</title>
	<meta
		name="description"
		content="Elevate your services with TributeStream. Offer beautiful, seamless memorial livestreams and digital guestbooks for the families you serve."
	/>
</svelte:head>

<div class="bg-gradient-to-b from-slate-50 to-white">
	<!-- Hero Section -->
	<div class="px-4 py-20 text-center md:py-32">
		<div class="mx-auto max-w-4xl">
			<div
				class="mb-4 inline-block rounded-full bg-yellow-100 px-4 py-1 text-sm font-semibold text-yellow-700"
			>
				Partner with TributeStream
			</div>
			<h1 class="mb-6 text-4xl leading-tight font-bold text-gray-900 md:text-6xl">
				Modernize Your Memorial Services
			</h1>
			<p class="mx-auto mb-10 max-w-2xl text-lg text-gray-600 md:text-xl">
				Empower the families you serve with beautiful, reliable memorial livestreams and interactive
				digital guestbooks. Simple for you, meaningful for them.
			</p>
			<a
				href="/register/funeral-home"
				class="inline-flex transform items-center justify-center rounded-xl bg-yellow-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-yellow-700"
			>
				Register Your Funeral Home
				<ArrowRight class="ml-2 h-5 w-5" />
			</a>
		</div>
	</div>

	<!-- Benefits Section -->
	<div class="px-4 py-20">
		<div class="mx-auto max-w-6xl">
			<div class="mb-16 text-center">
				<h2 class="text-3xl font-bold text-gray-900 md:text-4xl">
					Why Partner with TributeStream?
				</h2>
				<p class="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
					Enhance your offerings, streamline your workflow, and provide unparalleled value to
					families.
				</p>
			</div>
			<div class="grid gap-10 md:grid-cols-3">
				<!-- Benefit 1 -->
				<div class="rounded-2xl bg-white p-8 shadow-md transition-shadow hover:shadow-xl">
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
						<Video class="h-6 w-6 text-yellow-600" />
					</div>
					<h3 class="mb-2 text-xl font-bold text-gray-900">Effortless Livestreaming</h3>
					<p class="text-gray-600">
						Go live in minutes with our simple, reliable streaming technology. No technical
						expertise required. Just click and stream from any device.
					</p>
				</div>
				<!-- Benefit 2 -->
				<div class="rounded-2xl bg-white p-8 shadow-md transition-shadow hover:shadow-xl">
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
						<Users class="h-6 w-6 text-green-600" />
					</div>
					<h3 class="mb-2 text-xl font-bold text-gray-900">Enhanced Family Experience</h3>
					<p class="text-gray-600">
						Provide a dedicated, ad-free page for each memorial, complete with a digital guestbook,
						photo galleries, and service details.
					</p>
				</div>
				<!-- Benefit 3 -->
				<div class="rounded-2xl bg-white p-8 shadow-md transition-shadow hover:shadow-xl">
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
						<Sparkles class="h-6 w-6 text-amber-600" />
					</div>
					<h3 class="mb-2 text-xl font-bold text-gray-900">Professional Branding</h3>
					<p class="text-gray-600">
						Your funeral home's name and branding are featured on each memorial page, reinforcing
						your value to the family and community.
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- How It Works Section -->
	<div class="bg-slate-50 px-4 py-20">
		<div class="mx-auto max-w-5xl">
			<div class="mb-16 text-center">
				<h2 class="text-3xl font-bold text-gray-900 md:text-4xl">Simple Steps to Get Started</h2>
			</div>
			<div
				class="flex flex-col items-center justify-between space-y-12 md:flex-row md:space-y-0 md:space-x-8"
			>
				<!-- Step 1 -->
				<div class="flex-1 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-yellow-500 bg-white text-2xl font-bold text-yellow-600"
					>
						1
					</div>
					<h3 class="mb-2 text-xl font-semibold text-gray-800">Register Your Home</h3>
					<p class="text-gray-600">
						Complete a simple, one-time registration to create your funeral home's account.
					</p>
				</div>
				<div class="hidden text-gray-300 md:block"><ArrowRight size={32} /></div>
				<!-- Step 2 -->
				<div class="flex-1 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-yellow-500 bg-white text-2xl font-bold text-yellow-600"
					>
						2
					</div>
					<h3 class="mb-2 text-xl font-semibold text-gray-800">Create a Memorial</h3>
					<p class="text-gray-600">
						After approval, you can instantly create memorial pages for the families you serve.
					</p>
				</div>
				<div class="hidden text-gray-300 md:block"><ArrowRight size={32} /></div>
				<!-- Step 3 -->
				<div class="flex-1 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-yellow-500 bg-white text-2xl font-bold text-yellow-600"
					>
						3
					</div>
					<h3 class="mb-2 text-xl font-semibold text-gray-800">Go Live</h3>
					<p class="text-gray-600">
						Start the livestream with a single click, connecting friends and family from anywhere.
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Final CTA -->
	<div class="px-4 py-24 text-center">
		<div class="mx-auto max-w-3xl">
			<h2 class="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
				Ready to Elevate Your Services?
			</h2>
			<p class="mb-10 text-lg text-gray-600">
				Join our network of forward-thinking funeral directors today. Registration is free and takes
				just a few minutes.
			</p>
			<a
				href="/register/funeral-home"
				class="inline-flex transform items-center justify-center rounded-xl bg-yellow-600 px-10 py-5 text-xl font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-yellow-700"
			>
				Get Started Now
			</a>
		</div>
	</div>
</div>
