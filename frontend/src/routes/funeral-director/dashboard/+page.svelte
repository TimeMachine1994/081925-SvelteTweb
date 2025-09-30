<script lang="ts">
	import { enhance } from '$app/forms';
	import { Building2, User, Mail, Phone, MapPin, Save, ArrowLeft } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: any } = $props();
	
	// Debug logging
	console.log('Dashboard data:', data);
	
	// Form state
	let formData = $state({
		companyName: data.funeralDirector?.companyName || '',
		contactPerson: data.funeralDirector?.contactPerson || '',
		email: data.funeralDirector?.email || '',
		phone: data.funeralDirector?.phone || '',
		street: data.funeralDirector?.address?.street || '',
		city: data.funeralDirector?.address?.city || '',
		state: data.funeralDirector?.address?.state || '',
		zipCode: data.funeralDirector?.address?.zipCode || ''
	});

	let isSubmitting = $state(false);
</script>

<div class="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center mb-4">
				<a href="/profile" class="flex items-center text-amber-600 hover:text-amber-700 transition-colors mr-4">
					<ArrowLeft class="w-5 h-5 mr-2" />
					Back to Profile
				</a>
			</div>
			<h1 class="text-3xl font-bold text-gray-900 flex items-center">
				<Building2 class="w-8 h-8 mr-3 text-amber-600" />
				Funeral Director Dashboard
			</h1>
			<p class="text-gray-600 mt-2">Manage your business information and profile settings</p>
		</div>

		<!-- Debug/Error Info -->
		{#if data.error}
			<div class="mb-6 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
				<p class="text-yellow-800 font-medium">Debug Info: {data.error}</p>
			</div>
		{/if}

		<!-- Main Form -->
		<div class="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
			<form method="POST" action="?/updateProfile" use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update({ reset: false }); // Don't reset the form
					isSubmitting = false;
				};
			}} class="space-y-8">

				<!-- Company Information -->
				<div class="space-y-6">
					<h2 class="text-xl font-semibold text-gray-900 flex items-center border-b border-gray-200 pb-3">
						<Building2 class="w-6 h-6 mr-3 text-amber-600" />
						Company Information
					</h2>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label for="companyName" class="block text-sm font-medium text-gray-700 mb-2">
								Company Name *
							</label>
							<input
								type="text"
								id="companyName"
								name="companyName"
								bind:value={formData.companyName}
								required
								class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
								placeholder="Smith & Sons Funeral Home"
							/>
						</div>

						<div>
							<label for="contactPerson" class="block text-sm font-medium text-gray-700 mb-2">
								Contact Person *
							</label>
							<input
								type="text"
								id="contactPerson"
								name="contactPerson"
								bind:value={formData.contactPerson}
								required
								class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
								placeholder="John Director"
							/>
						</div>
					</div>
				</div>

				<!-- Contact Information -->
				<div class="space-y-6">
					<h2 class="text-xl font-semibold text-gray-900 flex items-center border-b border-gray-200 pb-3">
						<Mail class="w-6 h-6 mr-3 text-amber-600" />
						Contact Information
					</h2>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
								Email Address *
							</label>
							<input
								type="email"
								id="email"
								name="email"
								bind:value={formData.email}
								required
								class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
								placeholder="director@funeral-home.com"
							/>
						</div>

						<div>
							<label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
								Phone Number *
							</label>
							<input
								type="tel"
								id="phone"
								name="phone"
								bind:value={formData.phone}
								required
								class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
								placeholder="(555) 123-4567"
							/>
						</div>
					</div>
				</div>

				<!-- Address Information -->
				<div class="space-y-6">
					<h2 class="text-xl font-semibold text-gray-900 flex items-center border-b border-gray-200 pb-3">
						<MapPin class="w-6 h-6 mr-3 text-amber-600" />
						Business Address
					</h2>
					
					<div class="space-y-4">
						<div>
							<label for="street" class="block text-sm font-medium text-gray-700 mb-2">
								Street Address
							</label>
							<input
								type="text"
								id="street"
								name="street"
								bind:value={formData.street}
								class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
								placeholder="123 Memorial Drive"
							/>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label for="city" class="block text-sm font-medium text-gray-700 mb-2">
									City
								</label>
								<input
									type="text"
									id="city"
									name="city"
									bind:value={formData.city}
									class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
									placeholder="Orlando"
								/>
							</div>

							<div>
								<label for="state" class="block text-sm font-medium text-gray-700 mb-2">
									State
								</label>
								<input
									type="text"
									id="state"
									name="state"
									bind:value={formData.state}
									class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
									placeholder="FL"
								/>
							</div>

							<div>
								<label for="zipCode" class="block text-sm font-medium text-gray-700 mb-2">
									ZIP Code
								</label>
								<input
									type="text"
									id="zipCode"
									name="zipCode"
									bind:value={formData.zipCode}
									class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
									placeholder="32801"
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- Form Messages -->
				{#if form?.error}
					<div class="p-4 rounded-xl bg-red-50 border border-red-200">
						<p class="text-red-800 font-medium">{form.error}</p>
					</div>
				{/if}

				{#if form?.success}
					<div class="p-4 rounded-xl bg-green-50 border border-green-200">
						<p class="text-green-800 font-medium">{form.message}</p>
					</div>
				{/if}

				<!-- Submit Button -->
				<div class="flex justify-end pt-6 border-t border-gray-200">
					<button
						type="submit"
						disabled={isSubmitting}
						class="flex items-center px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Save class="w-5 h-5 mr-2" />
						{isSubmitting ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
