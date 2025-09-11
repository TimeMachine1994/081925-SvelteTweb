<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Heart, Users, Eye, Shield, CheckCircle, Mail, User, Lock } from 'lucide-svelte';
	import type { ActionData } from './$types';
	
	let { form }: { form?: ActionData } = $props();
	
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Join TributeStream - Create Your Account</title>
	<meta name="description" content="Create your TributeStream account to follow and access memorials, connect with families, and honor loved ones." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-yellow-50 to-white">
	<!-- Hero Section -->
	<div class="text-center py-16 px-4">
		<div class="max-w-4xl mx-auto">
			<div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-full mb-8">
				<Heart class="w-10 h-10 text-white" />
			</div>
			<h1 class="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
				Join TributeStream
			</h1>
			<p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
				Create your account to follow memorials, stay connected with families, and access all your saved tributes in one place.
			</p>
		</div>
	</div>

	<div class="max-w-6xl mx-auto px-4 pb-16">
		<div class="grid lg:grid-cols-2 gap-12 items-start">
			<!-- Registration Form -->
			<div class="bg-white p-8 rounded-2xl shadow-lg border border-yellow-200">
				<h2 class="text-2xl font-bold text-gray-900 mb-6">Create Your Account</h2>
				
				{#if form?.error}
					<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
						<p class="text-red-800">{form.error}</p>
					</div>
				{/if}
				
				{#if form?.success}
					<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
						<div class="flex items-center">
							<CheckCircle class="w-5 h-5 text-green-600 mr-2" />
							<p class="text-green-800 font-medium">Account created successfully!</p>
						</div>
					</div>
				{/if}
				
				<form method="POST" action="?/registerViewer" use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
					};
				}} class="space-y-6">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
							<User class="w-4 h-4 inline mr-1" />
							Full Name *
						</label>
						<input
							id="name"
							name="name"
							type="text"
							bind:value={name}
							required
							class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none transition-colors"
							placeholder="Your full name"
						/>
					</div>
					
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
							<Mail class="w-4 h-4 inline mr-1" />
							Email Address *
						</label>
						<input
							id="email"
							name="email"
							type="email"
							bind:value={email}
							required
							class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none transition-colors"
							placeholder="your@email.com"
						/>
					</div>
					
					<div>
						<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
							<Lock class="w-4 h-4 inline mr-1" />
							Password *
						</label>
						<input
							id="password"
							name="password"
							type="password"
							bind:value={password}
							required
							minlength="6"
							class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none transition-colors"
							placeholder="Choose a secure password"
						/>
						<p class="text-sm text-gray-500 mt-1">Minimum 6 characters</p>
					</div>
					
					<button
						type="submit"
						disabled={isSubmitting}
						class="w-full bg-gradient-to-r from-yellow-600 to-amber-600 text-white py-4 px-6 rounded-lg hover:from-yellow-700 hover:to-amber-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
					>
						{#if isSubmitting}
							<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
							Creating Account...
						{:else}
							Create My Account
						{/if}
					</button>
				</form>
				
				<div class="mt-6 text-center">
					<p class="text-sm text-gray-600">
						Already have an account? 
						<a href="/login" class="text-yellow-600 hover:text-yellow-700 font-medium">Sign in here</a>
					</p>
				</div>
			</div>

			<!-- Benefits Section -->
			<div class="space-y-8">
				<div class="bg-white p-8 rounded-2xl shadow-lg border border-yellow-200">
					<h3 class="text-xl font-bold text-gray-900 mb-6">What You Can Do</h3>
					<div class="space-y-4">
						<div class="flex items-start space-x-4">
							<div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
								<Eye class="w-5 h-5 text-yellow-600" />
							</div>
							<div>
								<h4 class="font-semibold text-gray-900">Follow Memorials</h4>
								<p class="text-gray-600 text-sm">Stay updated on memorial services and tributes for loved ones you want to remember.</p>
							</div>
						</div>
						
						<div class="flex items-start space-x-4">
							<div class="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
								<Users class="w-5 h-5 text-amber-600" />
							</div>
							<div>
								<h4 class="font-semibold text-gray-900">Connect with Families</h4>
								<p class="text-gray-600 text-sm">Share memories, leave messages, and support families during difficult times.</p>
							</div>
						</div>
						
						<div class="flex items-start space-x-4">
							<div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
								<Heart class="w-5 h-5 text-orange-600" />
							</div>
							<div>
								<h4 class="font-semibold text-gray-900">Access All in One Place</h4>
								<p class="text-gray-600 text-sm">View all your followed memorials and shared memories in your personal dashboard.</p>
							</div>
						</div>
						
						<div class="flex items-start space-x-4">
							<div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
								<Shield class="w-5 h-5 text-yellow-600" />
							</div>
							<div>
								<h4 class="font-semibold text-gray-900">Private & Secure</h4>
								<p class="text-gray-600 text-sm">Your account and interactions are kept private and secure with industry-standard protection.</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Alternative Registration Options -->
				<div class="bg-gradient-to-r from-gray-50 to-yellow-50 p-8 rounded-2xl border border-yellow-200">
					<h3 class="text-lg font-bold text-gray-900 mb-4">Looking for something else?</h3>
					<div class="space-y-3">
						<a
							href="/register/loved-one"
							class="block w-full p-4 bg-white border-2 border-yellow-200 rounded-lg hover:border-yellow-400 transition-colors text-center"
						>
							<div class="font-semibold text-gray-900">Create a Memorial</div>
							<div class="text-sm text-gray-600">Honor a loved one with a memorial page</div>
						</a>
						
						<a
							href="/register/funeral-home"
							class="block w-full p-4 bg-white border-2 border-yellow-200 rounded-lg hover:border-yellow-400 transition-colors text-center"
						>
							<div class="font-semibold text-gray-900">Funeral Professional</div>
							<div class="text-sm text-gray-600">Register your funeral home or join as a director</div>
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
