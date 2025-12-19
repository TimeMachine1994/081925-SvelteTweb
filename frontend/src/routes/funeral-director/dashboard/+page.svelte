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
	<div class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<div class="mb-4 flex items-center">
				<a
					href="/profile"
					class="mr-4 flex items-center text-amber-600 transition-colors hover:text-amber-700"
				>
					<ArrowLeft class="mr-2 h-5 w-5" />
					Back to Profile
				</a>
			</div>
			<h1 class="flex items-center text-3xl font-bold text-gray-900">
				<Building2 class="mr-3 h-8 w-8 text-amber-600" />
				Funeral Director Dashboard
			</h1>
			<p class="mt-2 text-gray-600">Manage your business information and profile settings</p>
		</div>

		<!-- Quick Actions -->
		<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
			<a
				href="/funeral-director/stream"
				class="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 to-red-600 p-6 shadow-lg transition-all hover:shadow-2xl hover:scale-105"
			>
				<div class="relative z-10">
					<div class="mb-2 flex items-center gap-2 text-white">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
						</svg>
						<span class="text-lg font-bold">Start Livestream</span>
					</div>
					<p class="text-red-50 text-sm">Stream services directly from your phone</p>
				</div>
			</a>

			<a
				href="/register/funeral-director"
				class="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 p-6 shadow-lg transition-all hover:shadow-2xl hover:scale-105"
			>
				<div class="relative z-10">
					<div class="mb-2 flex items-center gap-2 text-white">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						<span class="text-lg font-bold">Create Memorial</span>
					</div>
					<p class="text-amber-50 text-sm">Quick registration for families</p>
				</div>
			</a>
		</div>

		<!-- Debug/Error Info -->
		{#if data.error}
			<div class="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
				<p class="font-medium text-yellow-800">Debug Info: {data.error}</p>
			</div>
		{/if}

		<!-- Main Form -->
		<div class="rounded-3xl border border-white/20 bg-white/70 p-8 shadow-2xl backdrop-blur-xl">
			<form
				method="POST"
				action="?/updateProfile"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update({ reset: false }); // Don't reset the form
						isSubmitting = false;
					};
				}}
				class="space-y-8"
			>
				<!-- Company Information -->
				<div class="space-y-6">
					<h2
						class="flex items-center border-b border-gray-200 pb-3 text-xl font-semibold text-gray-900"
					>
						<Building2 class="mr-3 h-6 w-6 text-amber-600" />
						Company Information
					</h2>

					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div>
							<label for="companyName" class="mb-2 block text-sm font-medium text-gray-700">
								Company Name *
							</label>
							<input
								type="text"
								id="companyName"
								name="companyName"
								bind:value={formData.companyName}
								required
								class="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500"
								placeholder="Smith & Sons Funeral Home"
							/>
						</div>

						<div>
							<label for="contactPerson" class="mb-2 block text-sm font-medium text-gray-700">
								Contact Person *
							</label>
							<input
								type="text"
								id="contactPerson"
								name="contactPerson"
								bind:value={formData.contactPerson}
								required
								class="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500"
								placeholder="John Director"
							/>
						</div>
					</div>
				</div>

				<!-- Contact Information -->
				<div class="space-y-6">
					<h2
						class="flex items-center border-b border-gray-200 pb-3 text-xl font-semibold text-gray-900"
					>
						<Mail class="mr-3 h-6 w-6 text-amber-600" />
						Contact Information
					</h2>

					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div>
							<label for="email" class="mb-2 block text-sm font-medium text-gray-700">
								Email Address *
							</label>
							<input
								type="email"
								id="email"
								name="email"
								bind:value={formData.email}
								required
								class="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500"
								placeholder="director@funeral-home.com"
							/>
						</div>

						<div>
							<label for="phone" class="mb-2 block text-sm font-medium text-gray-700">
								Phone Number *
							</label>
							<input
								type="tel"
								id="phone"
								name="phone"
								bind:value={formData.phone}
								required
								class="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500"
								placeholder="(555) 123-4567"
							/>
						</div>
					</div>
				</div>

				<!-- Address Information -->
				<div class="space-y-6">
					<h2
						class="flex items-center border-b border-gray-200 pb-3 text-xl font-semibold text-gray-900"
					>
						<MapPin class="mr-3 h-6 w-6 text-amber-600" />
						Business Address
					</h2>

					<div class="space-y-4">
						<div>
							<label for="street" class="mb-2 block text-sm font-medium text-gray-700">
								Street Address
							</label>
							<input
								type="text"
								id="street"
								name="street"
								bind:value={formData.street}
								class="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500"
								placeholder="123 Memorial Drive"
							/>
						</div>

						<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div>
								<label for="city" class="mb-2 block text-sm font-medium text-gray-700">
									City
								</label>
								<input
									type="text"
									id="city"
									name="city"
									bind:value={formData.city}
									class="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500"
									placeholder="Orlando"
								/>
							</div>

							<div>
								<label for="state" class="mb-2 block text-sm font-medium text-gray-700">
									State
								</label>
								<input
									type="text"
									id="state"
									name="state"
									bind:value={formData.state}
									class="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500"
									placeholder="FL"
								/>
							</div>

							<div>
								<label for="zipCode" class="mb-2 block text-sm font-medium text-gray-700">
									ZIP Code
								</label>
								<input
									type="text"
									id="zipCode"
									name="zipCode"
									bind:value={formData.zipCode}
									class="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500"
									placeholder="32801"
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- Form Messages -->
				{#if form?.error}
					<div class="rounded-xl border border-red-200 bg-red-50 p-4">
						<p class="font-medium text-red-800">{form.error}</p>
					</div>
				{/if}

				{#if form?.success}
					<div class="rounded-xl border border-green-200 bg-green-50 p-4">
						<p class="font-medium text-green-800">{form.message}</p>
					</div>
				{/if}

				<!-- Submit Button -->
				<div class="flex justify-end border-t border-gray-200 pt-6">
					<button
						type="submit"
						disabled={isSubmitting}
						class="flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
					>
						<Save class="mr-2 h-5 w-5" />
						{isSubmitting ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
