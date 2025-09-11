<script lang="ts">
	import { ArrowRight, Heart, Users, Camera, Shield, Star, CheckCircle } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	
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
	<meta name="description" content="Create a beautiful memorial for your loved one. Share memories, connect with family and friends, and honor their legacy with TributeStream." />
</svelte:head>

<div class="bg-gradient-to-b from-yellow-50 to-white">
	<!-- Hero Section -->
	<div class="text-center py-20 md:py-32 px-4">
		<div class="max-w-4xl mx-auto">
			<div class="inline-block bg-yellow-100 text-yellow-700 font-semibold px-4 py-1 rounded-full text-sm mb-4">
				Honor Their Memory
			</div>
			<h1 class="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
				Create a Beautiful Memorial for Your Loved One
			</h1>
			<p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
				Share memories, photos, and stories. Connect with family and friends from anywhere. Create a lasting tribute that celebrates their life and legacy.
			</p>
			
			<!-- Quick Memorial Creation -->
			<div class="bg-white p-8 rounded-2xl shadow-lg border border-yellow-200 max-w-md mx-auto mb-8">
				<h3 class="text-xl font-semibold text-gray-900 mb-4">Start Your Memorial</h3>
				<div class="space-y-4">
					<div>
						<label for="lovedOneName" class="block text-sm font-medium text-gray-700 mb-2">Your Loved One's Name</label>
						<input
							id="lovedOneName"
							type="text"
							bind:value={lovedOneName}
							placeholder="Enter their full name"
							class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none transition-colors"
						/>
					</div>
					<button
						onclick={handleCreateMemorial}
						class="w-full bg-gradient-to-r from-yellow-600 to-amber-600 text-white py-3 px-6 rounded-lg hover:from-yellow-700 hover:to-amber-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold flex items-center justify-center gap-2"
					>
						<Heart class="w-5 h-5" />
						Create Memorial
					</button>
				</div>
			</div>
			
			<p class="text-sm text-gray-500 mb-6">Free to start • No credit card required</p>
			
			<a href="/register/loved-one" class="inline-flex items-center justify-center px-8 py-4 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold text-lg">
				Get Started Now
				<ArrowRight class="w-5 h-5 ml-2" />
			</a>
		</div>
	</div>

	<!-- Benefits Section -->
	<div class="py-20 px-4">
		<div class="max-w-6xl mx-auto">
			<div class="text-center mb-16">
				<h2 class="text-3xl md:text-4xl font-bold text-gray-900">Why Choose TributeStream?</h2>
				<p class="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">Create a meaningful space to honor your loved one and bring family together during difficult times.</p>
			</div>
			<div class="grid md:grid-cols-3 gap-10">
				<!-- Benefit 1 -->
				<div class="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-shadow">
					<div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
						<Heart class="w-6 h-6 text-yellow-600" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-2">Beautiful Memorial Pages</h3>
					<p class="text-gray-600">Create a stunning, personalized memorial page with photos, stories, and memories that truly capture their spirit.</p>
				</div>
				<!-- Benefit 2 -->
				<div class="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-shadow">
					<div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
						<Users class="w-6 h-6 text-amber-600" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-2">Connect Family & Friends</h3>
					<p class="text-gray-600">Bring together loved ones from around the world with live streaming services and interactive guestbooks.</p>
				</div>
				<!-- Benefit 3 -->
				<div class="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-shadow">
					<div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
						<Camera class="w-6 h-6 text-orange-600" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-2">Share Memories Forever</h3>
					<p class="text-gray-600">Upload photos, videos, and stories that family and friends can cherish and revisit for years to come.</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Features Section -->
	<div class="bg-gradient-to-r from-yellow-50 to-amber-50 py-20 px-4">
		<div class="max-w-5xl mx-auto">
			<div class="text-center mb-16">
				<h2 class="text-3xl md:text-4xl font-bold text-gray-900">Everything You Need to Honor Their Memory</h2>
			</div>
			<div class="grid md:grid-cols-2 gap-8">
				<!-- Feature List -->
				<div class="space-y-6">
					<div class="flex items-start space-x-4">
						<CheckCircle class="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
						<div>
							<h4 class="font-semibold text-gray-900">Live Streaming Services</h4>
							<p class="text-gray-600">Share funeral or memorial services with family who can't attend in person.</p>
						</div>
					</div>
					<div class="flex items-start space-x-4">
						<CheckCircle class="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
						<div>
							<h4 class="font-semibold text-gray-900">Digital Guestbook</h4>
							<p class="text-gray-600">Collect messages, condolences, and memories from friends and family.</p>
						</div>
					</div>
					<div class="flex items-start space-x-4">
						<CheckCircle class="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
						<div>
							<h4 class="font-semibold text-gray-900">Photo & Video Galleries</h4>
							<p class="text-gray-600">Create beautiful galleries to showcase their life's most precious moments.</p>
						</div>
					</div>
					<div class="flex items-start space-x-4">
						<CheckCircle class="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
						<div>
							<h4 class="font-semibold text-gray-900">Private Family Access</h4>
							<p class="text-gray-600">Control who can view and contribute to your loved one's memorial page.</p>
						</div>
					</div>
					<div class="flex items-start space-x-4">
						<CheckCircle class="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
						<div>
							<h4 class="font-semibold text-gray-900">Mobile Friendly</h4>
							<p class="text-gray-600">Access and manage the memorial from any device, anywhere, anytime.</p>
						</div>
					</div>
				</div>
				
				<!-- Visual Element -->
				<div class="bg-white p-8 rounded-2xl shadow-lg">
					<div class="text-center">
						<div class="w-20 h-20 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
							<Heart class="w-10 h-10 text-white" />
						</div>
						<h3 class="text-2xl font-bold text-gray-900 mb-4">Start in Minutes</h3>
						<p class="text-gray-600 mb-6">Creating a memorial is simple and takes just a few minutes. No technical skills required.</p>
						<button
							onclick={handleQuickStart}
							class="bg-gradient-to-r from-yellow-600 to-amber-600 text-white py-3 px-8 rounded-lg hover:from-yellow-700 hover:to-amber-700 transition-all duration-300 font-semibold"
						>
							Create Memorial Now
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Testimonials Section -->
	<div class="py-20 px-4">
		<div class="max-w-4xl mx-auto">
			<div class="text-center mb-16">
				<h2 class="text-3xl md:text-4xl font-bold text-gray-900">Trusted by Families Everywhere</h2>
			</div>
			<div class="grid md:grid-cols-2 gap-8">
				<div class="bg-white p-8 rounded-2xl shadow-md">
					<div class="flex items-center mb-4">
						<div class="flex text-yellow-500">
							<Star class="w-5 h-5 fill-current" />
							<Star class="w-5 h-5 fill-current" />
							<Star class="w-5 h-5 fill-current" />
							<Star class="w-5 h-5 fill-current" />
							<Star class="w-5 h-5 fill-current" />
						</div>
					</div>
					<p class="text-gray-600 mb-4">"TributeStream helped us create a beautiful memorial for my mother. Family from across the country could participate and share their memories. It brought us all together during a difficult time."</p>
					<p class="font-semibold text-gray-900">- Sarah M.</p>
				</div>
				<div class="bg-white p-8 rounded-2xl shadow-md">
					<div class="flex items-center mb-4">
						<div class="flex text-yellow-500">
							<Star class="w-5 h-5 fill-current" />
							<Star class="w-5 h-5 fill-current" />
							<Star class="w-5 h-5 fill-current" />
							<Star class="w-5 h-5 fill-current" />
							<Star class="w-5 h-5 fill-current" />
						</div>
					</div>
					<p class="text-gray-600 mb-4">"The live streaming feature was perfect for our dad's service. Relatives who couldn't travel were able to be part of the ceremony. The memorial page is something we'll treasure forever."</p>
					<p class="font-semibold text-gray-900">- Michael R.</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Final CTA -->
	<div class="bg-gradient-to-r from-gray-900 to-gray-800 py-24 text-center px-4">
		<div class="max-w-3xl mx-auto">
			<h2 class="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Honor Your Loved One?</h2>
			<p class="text-lg text-gray-300 mb-10">
				Create a lasting tribute that celebrates their life and brings family together. Start your memorial today.
			</p>
			<div class="space-y-4">
				<button
					onclick={handleCreateMemorial}
					class="inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-yellow-600 to-amber-600 text-white rounded-xl hover:from-yellow-700 hover:to-amber-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold text-xl"
				>
					<Heart class="w-6 h-6 mr-2" />
					Create Memorial
				</button>
				<p class="text-sm text-gray-400">Free to start • Setup takes less than 5 minutes</p>
			</div>
		</div>
	</div>
</div>
