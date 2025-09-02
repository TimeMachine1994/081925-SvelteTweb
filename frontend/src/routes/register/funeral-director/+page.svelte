<script lang="ts">
	import { enhance } from '$app/forms';
	import LiveUrlPreview from '$lib/components/LiveUrlPreview.svelte';
	import type { PageData } from './$types';

	let { form, data }: { form?: { error?: any; success?: boolean }; data: PageData } = $props();
	let funeralDirector = data.funeralDirector;

	// Svelte 5 runes
	let lovedOneName = $state('');
	let familyContactName = $state('');
	let familyContactEmail = $state('');
	let familyContactPhone = $state('');
	let directorName = $state(funeralDirector?.directorName || '');
	let directorEmail = $state(funeralDirector?.directorEmail || '');
	let funeralHomeName = $state(funeralDirector?.funeralHomeName || '');
	let locationName = $state('');
	let locationAddress = $state('');
	let memorialDate = $state('');
	let memorialTime = $state('');
	let contactPreference = $state('email');
	let additionalNotes = $state('');

	let validationErrors = $state<string[]>([]);

	function validateForm() {
		const errors: string[] = [];
		if (!lovedOneName.trim()) errors.push("Loved one's name is required");
		if (!familyContactName.trim()) errors.push('Family contact name is required');
		if (!familyContactEmail.trim()) errors.push('Family contact email is required');
		if (!familyContactPhone.trim()) errors.push('Family contact phone is required');
		if (!directorName.trim()) errors.push('Director name is required');
		if (!directorEmail.trim()) errors.push('Director email is required');
		if (!funeralHomeName.trim()) errors.push('Funeral home name is required');
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (familyContactEmail && !emailRegex.test(familyContactEmail)) errors.push('Family contact email must be valid');
		if (directorEmail && !emailRegex.test(directorEmail)) errors.push('Director email must be valid');
		validationErrors = errors;
		return errors.length === 0;
	}

	function handleSubmit(e: SubmitEvent) {
		if (!validateForm()) e.preventDefault();
	}
</script>

<!-- PAGE WRAPPER -->
<div class="min-h-screen bg-gray-50 flex justify-center items-center py-12 px-4">
	<div class="w-full max-w-5xl bg-white shadow-2xl rounded-2xl overflow-hidden">

		<!-- HEADER -->
		<header class="text-center px-8 py-10 bg-[#0f0f0f]">
			<h1 class="text-3xl font-bold mb-4 text-[#D5BA7F]">🎯 Funeral Service Coordination Form</h1>
			<p class="max-w-2xl mx-auto text-gray-200/90">
				This creates a memorial coordination account and collects all details for the memorial page and family updates.
			</p>
		</header>

		<form method="POST" use:enhance onsubmit={handleSubmit} class="grid grid-cols-1 md:grid-cols-2 gap-8 p-10">

			<!-- LIVE PREVIEW -->
			<section class="md:col-span-2">
				<LiveUrlPreview bind:lovedOneName />
			</section>

			<!-- ORDER SWAP: put MEMORIAL LOCATION & SCHEDULE in the left/top slot (where Director box was) -->
			<section class="bg-gray-50 p-6 rounded-xl shadow-sm space-y-6">
				<div>
					<h2 class="text-xl font-semibold mb-1 text-[#D5BA7F]">📍 Memorial Location & Schedule</h2>
					<p class="text-gray-500 text-sm">Venue and timing</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="md:col-span-2">
						<label for="locationName" class="block text-sm font-medium mb-1">Location Name</label>
						<input
							type="text"
							id="locationName"
							name="locationName"
							bind:value={locationName}
							placeholder="Church, funeral home, or venue"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>

					<div class="md:col-span-2">
						<label for="locationAddress" class="block text-sm font-medium mb-1">Location Address</label>
						<input
							type="text"
							id="locationAddress"
							name="locationAddress"
							bind:value={locationAddress}
							placeholder="Full address"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>

					<div>
						<label for="memorialDate" class="block text-sm font-medium mb-1">Memorial Date</label>
						<input
							type="date"
							id="memorialDate"
							name="memorialDate"
							bind:value={memorialDate}
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>

					<div>
						<label for="memorialTime" class="block text-sm font-medium mb-1">Memorial Time</label>
						<input
							type="time"
							id="memorialTime"
							name="memorialTime"
							bind:value={memorialTime}
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>
				</div>
			</section>

			<!-- FAMILY INFORMATION -->
			<section class="bg-gray-50 p-6 rounded-xl shadow-sm space-y-6">
				<div>
					<h2 class="text-xl font-semibold mb-1 text-[#D5BA7F]">👨‍👩‍👧‍👦 Family Information</h2>
					<p class="text-gray-500 text-sm">Primary family contact details</p>
				</div>

				<div class="grid grid-cols-1 gap-6">
					<div>
						<label for="lovedOneName" class="block text-sm font-medium mb-1">Loved One's Full Name *</label>
						<input
							type="text"
							id="lovedOneName"
							name="lovedOneName"
							required
							bind:value={lovedOneName}
							placeholder="Enter the full name of the deceased"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>

					<div>
						<label for="familyContactName" class="block text-sm font-medium mb-1">Family Contact Name *</label>
						<input
							type="text"
							id="familyContactName"
							name="familyContactName"
							required
							bind:value={familyContactName}
							placeholder="Primary family contact"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>

					<div>
						<label for="familyContactEmail" class="block text-sm font-medium mb-1">Family Contact Email *</label>
						<input
							type="email"
							id="familyContactEmail"
							name="familyContactEmail"
							required
							bind:value={familyContactEmail}
							placeholder="family@example.com"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>

					<div>
						<label for="familyContactPhone" class="block text-sm font-medium mb-1">Family Contact Phone *</label>
						<input
							type="tel"
							id="familyContactPhone"
							name="familyContactPhone"
							required
							bind:value={familyContactPhone}
							placeholder="(555) 123-4567"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>
				</div>
			</section>

			<!-- MERGED: FUNERAL DIRECTOR + CONTACT PREFERENCE -->
			<section class="bg-gray-50 p-6 rounded-xl shadow-sm space-y-6 md:col-span-2">
				<div class="flex items-start justify-between gap-6 flex-wrap">
					<div>
						<h2 class="text-xl font-semibold mb-1 text-[#D5BA7F]">🏛️ Funeral Director & Contact</h2>
						<p class="text-gray-500 text-sm">Service provider details and preferred contact method</p>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div>
						<label for="directorName" class="block text-sm font-medium mb-1">Director Name *</label>
						<input
							type="text"
							id="directorName"
							name="directorName"
							required
							bind:value={directorName}
							placeholder="Your full name"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>

					<div>
						<label for="directorEmail" class="block text-sm font-medium mb-1">Director Email *</label>
						<input
							type="email"
							id="directorEmail"
							name="directorEmail"
							required
							bind:value={directorEmail}
							placeholder="director@funeralhome.com"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>

					<div class="md:col-span-1">
						<label id="contactPreferenceLabel" class="block text-sm font-medium mb-1">Contact Preference</label>
						<div class="flex items-center gap-6 h-[42px]" aria-labelledby="contactPreferenceLabel">
							<label class="flex items-center gap-2 cursor-pointer">
								<input type="radio" value="email" name="contactPreference" bind:group={contactPreference} class="accent-[#D5BA7F]" />
								<span>Email</span>
							</label>
							<label class="flex items-center gap-2 cursor-pointer">
								<input type="radio" value="phone" name="contactPreference" bind:group={contactPreference} class="accent-[#D5BA7F]" />
								<span>Phone</span>
							</label>
						</div>
					</div>

					<div class="md:col-span-3">
						<label for="funeralHomeName" class="block text-sm font-medium mb-1">Funeral Home Name *</label>
						<input
							type="text"
							id="funeralHomeName"
							name="funeralHomeName"
							required
							bind:value={funeralHomeName}
							placeholder="Name of your funeral home"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>
				</div>
			</section>

			<!-- NOTES -->
			<section class="bg-gray-50 p-6 rounded-xl shadow-sm space-y-6 md:col-span-2">
				<div>
					<h2 class="text-xl font-semibold mb-1 text-[#D5BA7F]">📝 Additional Notes</h2>
					<p class="text-gray-500 text-sm">Special requests or other details</p>
				</div>
				<textarea
					rows="4"
					name="additionalNotes"
					bind:value={additionalNotes}
					placeholder="Any special requests, cultural considerations, or additional info..."
					class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]"></textarea>
			</section>

			<!-- ERRORS -->
			{#if validationErrors.length > 0}
				<div class="md:col-span-2 bg-red-50 border border-red-300 text-red-700 rounded-lg p-4 space-y-2">
					<h3 class="font-semibold">❌ Please correct the following errors:</h3>
					<ul class="list-disc list-inside">
						{#each validationErrors as error}
							<li>{error}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- MESSAGES -->
			{#if form?.error}
				<div class="md:col-span-2 bg-red-100 border border-red-300 text-red-600 p-4 rounded-lg">
					❌ {form.error}
				</div>
			{/if}
			{#if form?.success}
				<div class="md:col-span-2 bg-green-100 border border-green-300 text-green-700 p-4 rounded-lg">
					✅ Success! Please check your email for login details and memorial setup info.
				</div>
			{/if}

			<!-- SUBMIT -->
			<div class="md:col-span-2 text-center space-y-4">
				<button
					type="submit"
					class="bg-[#D5BA7F] hover:bg-[#caa767] text-[#070707] font-semibold px-8 py-3 rounded-lg shadow-md transition">
					🚀 Submit Form & Create Account
				</button>
				<p class="text-sm text-gray-500 max-w-prose mx-auto">
					By submitting, you'll create your funeral director account and set up the memorial page. Login credentials will be emailed.
				</p>
			</div>
		</form>
	</div>
</div>
