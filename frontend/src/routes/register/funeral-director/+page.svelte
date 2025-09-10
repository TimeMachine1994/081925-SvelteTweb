<script lang="ts">
	import { enhance, applyAction } from '$app/forms';
	import { goto } from '$app/navigation';
	import LiveUrlPreview from '$lib/components/LiveUrlPreview.svelte';
	import type { PageData } from './$types';
	import { useFormAutoSave } from '$lib/composables/useFormAutoSave';
	import { Check, Copy } from 'lucide-svelte';

	let { form, data }: { form?: { error?: any; success?: boolean; memorialLink?: string }; data: PageData } = $props();

	// Svelte 5 runes
	let lovedOneName = $state('');
	let familyContactName = $state('');
	let familyContactEmail = $state('');
	let familyContactPhone = $state('');
	let directorName = $state(data.funeralDirector?.contactPerson || '');
	let directorEmail = $state(data.funeralDirector?.email || '');
	let funeralHomeName = $state(data.funeralDirector?.companyName || '');
	let locationName = $state('');
	let locationAddress = $state('');
	let memorialDate = $state('');
	let memorialTime = $state('');
	let contactPreference = $state('email');
	let additionalNotes = $state('');

	let copied = $state(false);

	// Initialize auto-save functionality
	const autoSave = useFormAutoSave({
		storageKey: 'family-memorial-registration',
		debounceMs: 2500,
		useLocalStorage: false, // Use cookies for better persistence
		cookieExpireDays: 14,
		onSave: (data) => console.log('👨‍👩‍👧‍👦 [AUTO-SAVE] Family memorial form data saved'),
		onLoad: (data) => {
			if (data) {
				console.log('👨‍👩‍👧‍👦 [AUTO-SAVE] Loading saved family memorial data');
				// Restore form fields from saved data (but don't override prepopulated director data)
				lovedOneName = data.lovedOneName || '';
				familyContactName = data.familyContactName || '';
				familyContactEmail = data.familyContactEmail || '';
				familyContactPhone = data.familyContactPhone || '';
				locationName = data.locationName || '';
				locationAddress = data.locationAddress || '';
				memorialDate = data.memorialDate || '';
				memorialTime = data.memorialTime || '';
				contactPreference = data.contactPreference || 'email';
				additionalNotes = data.additionalNotes || '';
				
				// Only restore director info if not prepopulated
			}
		}
	});

	// Auto-save form data when fields change
	$effect(() => {
		const formData = {
			lovedOneName,
			familyContactName,
			familyContactEmail,
			familyContactPhone,
			directorName,
			directorEmail,
			funeralHomeName,
			locationName,
			locationAddress,
			memorialDate,
			memorialTime,
			contactPreference,
			additionalNotes
		};
		
		// Only auto-save if we have some meaningful data
		if (lovedOneName || familyContactName || familyContactEmail) {
			autoSave.triggerAutoSave(formData);
		}
	});

	// Load saved data on component mount (but after prepopulation check)
	$effect(() => {
		// Load saved data first
		autoSave.loadFromStorage();
	});


	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text).then(() => {
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		});
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

						<form 
				method="POST" 
				use:enhance={({}) => {
					return async ({ result }) => {
						if (result.type === 'success' && result.data?.success) {
							await goto(result.data.memorialLink);
						} else {
							await applyAction(result);
						}
					};
				}}
								class="grid grid-cols-1 md:grid-cols-2 gap-8 p-10"
			>

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
							id="locationName"
							name="locationName"
							type="text"
							bind:value={locationName}
							placeholder="Church, funeral home, or venue"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>

					<div class="md:col-span-2">
						<label for="locationAddress" class="block text-sm font-medium mb-1">Location Address</label>
						<input
							id="locationAddress"
							name="locationAddress"
							type="text"
							bind:value={locationAddress}
							placeholder="Full address"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>

					<div>
						<label for="memorialDate" class="block text-sm font-medium mb-1">Memorial Date</label>
						<input
							id="memorialDate"
							name="memorialDate"
							type="date"
							bind:value={memorialDate}
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>

					<div>
						<label for="memorialTime" class="block text-sm font-medium mb-1">Memorial Time</label>
						<input
							id="memorialTime"
							name="memorialTime"
							type="time"
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
							id="lovedOneName"
							name="lovedOneName"
							type="text"
							required
							bind:value={lovedOneName}
							placeholder="Enter the full name of the deceased"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
							{#if form?.errors?.lovedOneName}<p class="text-red-500 text-sm mt-1">{form.errors.lovedOneName}</p>{/if}
					</div>

					<div>
						<label for="familyContactName" class="block text-sm font-medium mb-1">Family Contact Name *</label>
						<input
							id="familyContactName"
							name="familyContactName"
							type="text"
							required
							bind:value={familyContactName}
							placeholder="Primary family contact"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
							{#if form?.errors?.familyContactName}<p class="text-red-500 text-sm mt-1">{form.errors.familyContactName}</p>{/if}
					</div>

					<div>
						<label for="familyContactEmail" class="block text-sm font-medium mb-1">Family Contact Email *</label>
						<input
							id="familyContactEmail"
							name="familyContactEmail"
							type="email"
							required
							bind:value={familyContactEmail}
							placeholder="family@example.com"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
							{#if form?.errors?.familyContactEmail}<p class="text-red-500 text-sm mt-1">{form.errors.familyContactEmail}</p>{/if}
					</div>

					<div>
						<label for="familyContactPhone" class="block text-sm font-medium mb-1">Family Contact Phone *</label>
						<input
							id="familyContactPhone"
							name="familyContactPhone"
							type="tel"
							required
							bind:value={familyContactPhone}
							placeholder="(555) 123-4567"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
							{#if form?.errors?.familyContactPhone}<p class="text-red-500 text-sm mt-1">{form.errors.familyContactPhone}</p>{/if}
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
							id="directorName"
							name="directorName"
							type="text"
							required
							bind:value={directorName}
							class="w-full border rounded-lg px-4 py-2 bg-gray-100 cursor-not-allowed"
							readonly />
					</div>

					<div>
						<label for="directorEmail" class="block text-sm font-medium mb-1">Director Email *</label>
						<input
							id="directorEmail"
							name="directorEmail"
							type="email"
							required
							bind:value={directorEmail}
							class="w-full border rounded-lg px-4 py-2 bg-gray-100 cursor-not-allowed"
							readonly />
					</div>

					<div class="md:col-span-1">
						<label class="block text-sm font-medium mb-1">Contact Preference</label>
						<div class="flex items-center gap-6 h-[42px]">
							<label class="flex items-center gap-2 cursor-pointer">
								<input type="radio" name="contactPreference" value="email" bind:group={contactPreference} class="accent-[#D5BA7F]" />
								<span>Email</span>
							</label>
							<label class="flex items-center gap-2 cursor-pointer">
								<input type="radio" name="contactPreference" value="phone" bind:group={contactPreference} class="accent-[#D5BA7F]" />
								<span>Phone</span>
							</label>
						</div>
					</div>

					<div class="md:col-span-3">
						<label for="funeralHomeName" class="block text-sm font-medium mb-1">Funeral Home Name *</label>
						<input
							id="funeralHomeName"
							name="funeralHomeName"
							type="text"
							required
							bind:value={funeralHomeName}
							class="w-full border rounded-lg px-4 py-2 bg-gray-100 cursor-not-allowed"
							readonly />
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


			<!-- MESSAGES -->
			{#if form?.error}
				<div class="md:col-span-2 bg-red-100 border border-red-300 text-red-600 p-4 rounded-lg">
					❌ {form.error}
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
					By submitting, you'll create the family's account and set up the memorial page. Login credentials will be emailed to them.
				</p>
			</div>
		</form>
	</div>
</div>
