<script lang="ts">
	import { ArrowRight, Heart, Users, Camera, Shield, Star, CheckCircle } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/ui';

	let lovedOneName = $state('');

	function handleCreateMemorial() {
		if (lovedOneName.trim()) {
			// Redirect to registration with the loved one's name pre-filled
			goto(`/register/loved-one?name=${encodeURIComponent(lovedOneName.trim())}`);
		} else {
			// Redirect to registration page without pre-fill
			goto('/register/loved-one');
		}
	}

	function handleQuickStart() {
		handleCreateMemorial();
	}
</script>

<svelte:head>
	<title>For Families - TributeStream</title>
	<meta
		name="description"
		content="Create a beautiful memorial for your loved one. Share memories, connect with family and friends, and honor their legacy with TributeStream."
	/>
</svelte:head>

<div class="bg-gradient-to-b from-yellow-50 to-white">
	<!-- Hero Section -->
	<div class="px-4 py-20 text-center md:py-32">
		<div class="mx-auto max-w-4xl">
			<div
				class="mb-4 inline-block rounded-full bg-yellow-100 px-4 py-1 text-sm font-semibold text-yellow-700"
			>
				Honor Their Memory
			</div>
			<h1 class="mb-6 text-4xl leading-tight font-bold text-gray-900 md:text-6xl">
				Create a Beautiful Memorial for Your Loved One
			</h1>
			<p class="mx-auto mb-10 max-w-2xl text-lg text-gray-600 md:text-xl">
				Share memories, photos, and stories. Connect with family and friends from anywhere. Create a
				lasting tribute that celebrates their life and legacy.
			</p>

			<!-- Quick Memorial Creation -->
			<div
				class="mx-auto mb-8 max-w-md rounded-2xl border border-yellow-200 bg-white p-8 shadow-lg"
			>
				<h3 class="mb-4 text-xl font-semibold text-gray-900">Start Your Memorial</h3>
				<div class="space-y-4">
					<div>
						<label for="lovedOneName" class="mb-2 block text-sm font-medium text-gray-700"
							>Your Loved One's Name</label
						>
						<input
							id="lovedOneName"
							type="text"
							bind:value={lovedOneName}
							placeholder="Enter their full name"
							class="w-full rounded-lg border-2 border-gray-200 px-4 py-3 transition-colors focus:border-yellow-500 focus:outline-none"
						/>
					</div>
					<Button
						onclick={handleCreateMemorial}
						variant="role"
						role="owner"
						size="lg"
						fullWidth
						rounded="lg"
					>
						<Heart class="h-5 w-5" />
						Create Memorial
					</Button>
				</div>
			</div>

			<p class="mb-6 text-sm text-gray-500">Free to start • No credit card required</p>

			<a
				href="/register/loved-one"
				class="inline-flex transform items-center justify-center rounded-xl bg-yellow-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-yellow-700"
			>
				Get Started Now
				<ArrowRight class="ml-2 h-5 w-5" />
			</a>
		</div>
	</div>

	<!-- Benefits Section -->
	<div class="px-4 py-20">
		<div class="mx-auto max-w-6xl">
			<div class="mb-16 text-center">
				<h2 class="text-3xl font-bold text-gray-900 md:text-4xl">Why Choose TributeStream?</h2>
				<p class="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
					Create a meaningful space to honor your loved one and bring family together during
					difficult times.
				</p>
			</div>
			<div class="grid gap-10 md:grid-cols-3">
				<!-- Benefit 1 -->
				<div class="rounded-2xl bg-white p-8 shadow-md transition-shadow hover:shadow-xl">
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
						<Heart class="h-6 w-6 text-yellow-600" />
					</div>
					<h3 class="mb-2 text-xl font-bold text-gray-900">Beautiful Memorial Pages</h3>
					<p class="text-gray-600">
						Create a stunning, personalized memorial page with photos, stories, and memories that
						truly capture their spirit.
					</p>
				</div>
				<!-- Benefit 2 -->
				<div class="rounded-2xl bg-white p-8 shadow-md transition-shadow hover:shadow-xl">
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
						<Users class="h-6 w-6 text-amber-600" />
					</div>
					<h3 class="mb-2 text-xl font-bold text-gray-900">Connect Family & Friends</h3>
					<p class="text-gray-600">
						Bring together loved ones from around the world with live streaming services and
						interactive guestbooks.
					</p>
				</div>
				<!-- Benefit 3 -->
				<div class="rounded-2xl bg-white p-8 shadow-md transition-shadow hover:shadow-xl">
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
						<Camera class="h-6 w-6 text-orange-600" />
					</div>
					<h3 class="mb-2 text-xl font-bold text-gray-900">Share Memories Forever</h3>
					<p class="text-gray-600">
						Upload photos, videos, and stories that family and friends can cherish and revisit for
						years to come.
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Features Section -->
	<div class="bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-20">
		<div class="mx-auto max-w-5xl">
			<div class="mb-16 text-center">
				<h2 class="text-3xl font-bold text-gray-900 md:text-4xl">
					Everything You Need to Honor Their Memory
				</h2>
			</div>
			<div class="grid gap-8 md:grid-cols-2">
				<!-- Feature List -->
				<div class="space-y-6">
					<div class="flex items-start space-x-4">
						<CheckCircle class="mt-1 h-6 w-6 flex-shrink-0 text-yellow-600" />
						<div>
							<h4 class="font-semibold text-gray-900">Live Streaming Services</h4>
							<p class="text-gray-600">
								Share funeral or memorial services with family who can't attend in person.
							</p>
						</div>
					</div>
					<div class="flex items-start space-x-4">
						<CheckCircle class="mt-1 h-6 w-6 flex-shrink-0 text-yellow-600" />
						<div>
							<h4 class="font-semibold text-gray-900">Digital Guestbook</h4>
							<p class="text-gray-600">
								Collect messages, condolences, and memories from friends and family.
							</p>
						</div>
					</div>
					<div class="flex items-start space-x-4">
						<CheckCircle class="mt-1 h-6 w-6 flex-shrink-0 text-yellow-600" />
						<div>
							<h4 class="font-semibold text-gray-900">Photo & Video Galleries</h4>
							<p class="text-gray-600">
								Create beautiful galleries to showcase their life's most precious moments.
							</p>
						</div>
					</div>
					<div class="flex items-start space-x-4">
						<CheckCircle class="mt-1 h-6 w-6 flex-shrink-0 text-yellow-600" />
						<div>
							<h4 class="font-semibold text-gray-900">Private Family Access</h4>
							<p class="text-gray-600">
								Control who can view and contribute to your loved one's memorial page.
							</p>
						</div>
					</div>
					<div class="flex items-start space-x-4">
						<CheckCircle class="mt-1 h-6 w-6 flex-shrink-0 text-yellow-600" />
						<div>
							<h4 class="font-semibold text-gray-900">Mobile Friendly</h4>
							<p class="text-gray-600">
								Access and manage the memorial from any device, anywhere, anytime.
							</p>
						</div>
					</div>
				</div>

				<!-- Visual Element -->
				<div class="rounded-2xl bg-white p-8 shadow-lg">
					<div class="text-center">
						<div
							class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-yellow-600 to-amber-600"
						>
							<Heart class="h-10 w-10 text-white" />
						</div>
						<h3 class="mb-4 text-2xl font-bold text-gray-900">Start in Minutes</h3>
						<p class="mb-6 text-gray-600">
							Creating a memorial is simple and takes just a few minutes. No technical skills
							required.
						</p>
						<Button
							onclick={handleQuickStart}
							variant="role"
							role="owner"
							size="lg"
							rounded="lg"
						>
							Create Memorial Now
						</Button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Testimonials Section -->
	<div class="px-4 py-20">
		<div class="mx-auto max-w-4xl">
			<div class="mb-16 text-center">
				<h2 class="text-3xl font-bold text-gray-900 md:text-4xl">Trusted by Families Everywhere</h2>
			</div>
			<div class="grid gap-8 md:grid-cols-2">
				<div class="rounded-2xl bg-white p-8 shadow-md">
					<div class="mb-4 flex items-center">
						<div class="flex text-yellow-500">
							<Star class="h-5 w-5 fill-current" />
							<Star class="h-5 w-5 fill-current" />
							<Star class="h-5 w-5 fill-current" />
							<Star class="h-5 w-5 fill-current" />
							<Star class="h-5 w-5 fill-current" />
						</div>
					</div>
					<p class="mb-4 text-gray-600">
						"TributeStream helped us create a beautiful memorial for my mother. Family from across
						the country could participate and share their memories. It brought us all together
						during a difficult time."
					</p>
					<p class="font-semibold text-gray-900">- Sarah M.</p>
				</div>
				<div class="rounded-2xl bg-white p-8 shadow-md">
					<div class="mb-4 flex items-center">
						<div class="flex text-yellow-500">
							<Star class="h-5 w-5 fill-current" />
							<Star class="h-5 w-5 fill-current" />
							<Star class="h-5 w-5 fill-current" />
							<Star class="h-5 w-5 fill-current" />
							<Star class="h-5 w-5 fill-current" />
						</div>
					</div>
					<p class="mb-4 text-gray-600">
						"The live streaming feature was perfect for our dad's service. Relatives who couldn't
						travel were able to be part of the ceremony. The memorial page is something we'll
						treasure forever."
					</p>
					<p class="font-semibold text-gray-900">- Michael R.</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Final CTA -->
	<div class="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-24 text-center">
		<div class="mx-auto max-w-3xl">
			<h2 class="mb-6 text-3xl font-bold text-white md:text-4xl">Ready to Honor Your Loved One?</h2>
			<p class="mb-10 text-lg text-gray-300">
				Create a lasting tribute that celebrates their life and brings family together. Start your
				memorial today.
			</p>
			<div class="space-y-4">
				<Button
					onclick={handleCreateMemorial}
					variant="role"
					role="owner"
					size="xl"
					rounded="lg"
				>
					<Heart class="mr-2 h-6 w-6" />
					Create Memorial
				</Button>
				<p class="text-sm text-gray-400">Free to start • Setup takes less than 5 minutes</p>
			</div>
		</div>
	</div>
</div>
