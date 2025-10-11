<script lang="ts">
	import { enhance, applyAction } from '$app/forms';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { signInWithCustomToken } from 'firebase/auth';
	import { auth } from '$lib/firebase';
	import LiveUrlPreview from '$lib/components/LiveUrlPreview.svelte';
	import type { PageData } from './$types';
	import { useFormAutoSave } from '$lib/composables/useFormAutoSave';
	import { Check, Copy, Building, User, Mail, Lock, Phone, FileText } from 'lucide-svelte';

	let {
		form,
		data
	}: {
		form?: {
			error?: any;
			success?: boolean;
			memorialLink?: string;
			message?: string;
			customToken?: string;
		};
		data: PageData;
	} = $props();

	// Registration form fields
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let companyName = $state('');
	let phone = $state('');
	let licenseNumber = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let showRegistrationForm = $state(!data.isExistingDirector);

	// Load prefilled data from sessionStorage
	onMount(() => {
		const registrationData = sessionStorage.getItem('registrationData');
		if (registrationData) {
			try {
				const parsed = JSON.parse(registrationData);
				if (parsed.role === 'funeral_director') {
					name = parsed.name || '';
					email = parsed.email || '';
					password = parsed.password || '';
					confirmPassword = parsed.password || '';
				}
			} catch (e) {
				console.error('Error parsing registration data:', e);
			}
		}
	});

	// Handle successful registration
	$effect(() => {
		if (form?.success && form?.customToken) {
			// Sign in with custom token and redirect
			signInWithCustomToken(auth, form.customToken)
				.then(async (userCredential) => {
					const idToken = await userCredential.user.getIdToken();

					// Create session
					const response = await fetch('/api/session', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ idToken })
					});

					if (response.ok) {
						sessionStorage.removeItem('registrationData');
						goto('/my-portal');
					}
				})
				.catch((err) => {
					error = 'Registration successful but login failed. Please try logging in manually.';
				});
		}
	});

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
<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
	<div class="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
		{#if showRegistrationForm}
			<!-- FUNERAL DIRECTOR REGISTRATION FORM -->
			<header class="bg-[#0f0f0f] px-8 py-10 text-center">
				<h1 class="mb-4 text-3xl font-bold text-[#D5BA7F]">🏢 Funeral Director Registration</h1>
				<p class="mx-auto max-w-2xl text-gray-200/90">
					Complete your professional registration to start managing memorial services.
				</p>
			</header>

			<form
				method="POST"
				action="?/registerFuneralDirector"
				use:enhance={() => {
					loading = true;
					error = null;
					return async ({ result }) => {
						loading = false;
						if (result.type === 'failure') {
							error = result.data?.message || 'Registration failed';
						}
						await applyAction(result);
					};
				}}
				class="space-y-8 p-10"
			>
				<!-- Personal Information -->
				<section class="space-y-6 rounded-xl bg-gray-50 p-6 shadow-sm">
					<div>
						<h2 class="mb-1 flex items-center gap-2 text-xl font-semibold text-[#D5BA7F]">
							<User class="h-5 w-5" />
							Personal Information
						</h2>
						<p class="text-sm text-gray-500">Your contact details</p>
					</div>

					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div>
							<label for="name" class="mb-1 block text-sm font-medium">Full Name *</label>
							<input
								id="name"
								name="name"
								type="text"
								bind:value={name}
								placeholder="Enter your full name"
								class="w-full rounded-lg border px-4 py-2 focus:border-[#D5BA7F] focus:ring-2 focus:ring-[#D5BA7F]"
								required
							/>
						</div>

						<div>
							<label for="email" class="mb-1 block text-sm font-medium">Email Address *</label>
							<input
								id="email"
								name="email"
								type="email"
								bind:value={email}
								placeholder="Enter your email"
								class="w-full rounded-lg border px-4 py-2 focus:border-[#D5BA7F] focus:ring-2 focus:ring-[#D5BA7F]"
								required
							/>
						</div>

						<div>
							<label for="password" class="mb-1 block text-sm font-medium">Password *</label>
							<input
								id="password"
								name="password"
								type="password"
								bind:value={password}
								placeholder="Create a password"
								class="w-full rounded-lg border px-4 py-2 focus:border-[#D5BA7F] focus:ring-2 focus:ring-[#D5BA7F]"
								required
							/>
						</div>

						<div>
							<label for="phone" class="mb-1 block text-sm font-medium">Phone Number</label>
							<input
								id="phone"
								name="phone"
								type="tel"
								bind:value={phone}
								placeholder="(555) 123-4567"
								class="w-full rounded-lg border px-4 py-2 focus:border-[#D5BA7F] focus:ring-2 focus:ring-[#D5BA7F]"
							/>
						</div>
					</div>
				</section>

				<!-- Professional Information -->
				<section class="space-y-6 rounded-xl bg-gray-50 p-6 shadow-sm">
					<div>
						<h2 class="mb-1 flex items-center gap-2 text-xl font-semibold text-[#D5BA7F]">
							<Building class="h-5 w-5" />
							Professional Information
						</h2>
						<p class="text-sm text-gray-500">Your funeral home details</p>
					</div>

					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div class="md:col-span-2">
							<label for="companyName" class="mb-1 block text-sm font-medium"
								>Funeral Home Name *</label
							>
							<input
								id="companyName"
								name="companyName"
								type="text"
								bind:value={companyName}
								placeholder="Enter your funeral home name"
								class="w-full rounded-lg border px-4 py-2 focus:border-[#D5BA7F] focus:ring-2 focus:ring-[#D5BA7F]"
								required
							/>
						</div>

						<div>
							<label for="licenseNumber" class="mb-1 block text-sm font-medium"
								>License Number</label
							>
							<input
								id="licenseNumber"
								name="licenseNumber"
								type="text"
								bind:value={licenseNumber}
								placeholder="Optional license number"
								class="w-full rounded-lg border px-4 py-2 focus:border-[#D5BA7F] focus:ring-2 focus:ring-[#D5BA7F]"
							/>
						</div>
					</div>
				</section>

				<!-- Error Message -->
				{#if error || form?.message}
					<div class="rounded-lg border border-red-300 bg-red-100 p-4 text-red-600">
						❌ {error || form?.message}
					</div>
				{/if}

				<!-- Submit Button -->
				<div class="space-y-4 text-center">
					<button
						type="submit"
						class="rounded-lg bg-[#D5BA7F] px-8 py-3 font-semibold text-[#070707] shadow-md transition hover:bg-[#caa767] disabled:opacity-50"
						disabled={loading}
					>
						{#if loading}
							🔄 Creating Account...
						{:else}
							🚀 Complete Registration
						{/if}
					</button>
					<p class="mx-auto max-w-prose text-sm text-gray-500">
						By registering, you'll be able to create and manage memorial services for families.
					</p>
				</div>
			</form>
		{:else}
			<!-- EXISTING MEMORIAL COORDINATION FORM -->
			<header class="bg-[#0f0f0f] px-8 py-10 text-center">
				<h1 class="mb-4 text-3xl font-bold text-[#D5BA7F]">🎯 Funeral Service Coordination Form</h1>
				<p class="mx-auto max-w-2xl text-gray-200/90">
					This creates a memorial coordination account and collects all details for the memorial
					page and family updates.
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
				class="grid grid-cols-1 gap-8 p-10 md:grid-cols-2"
			>
				<!-- LIVE PREVIEW -->
				<section class="md:col-span-2">
					<LiveUrlPreview bind:lovedOneName />
				</section>

				<!-- ORDER SWAP: put MEMORIAL LOCATION & SCHEDULE in the left/top slot (where Director box was) -->
				<section class="space-y-6 rounded-xl bg-gray-50 p-6 shadow-sm">
					<div>
						<h2 class="mb-1 text-xl font-semibold text-[#D5BA7F]">
							📍 Memorial Location & Schedule
						</h2>
						<p class="text-sm text-gray-500">Venue and timing</p>
					</div>

					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div class="md:col-span-2">
							<label for="locationName" class="mb-1 block text-sm font-medium">Location Name</label>
							<input
								id="locationName"
								name="locationName"
								type="text"
								bind:value={locationName}
								placeholder="Church, funeral home, or venue"
								class="w-full rounded-lg border px-4 py-2 focus:border-[#D5BA7F] focus:ring-2 focus:ring-[#D5BA7F]"
							/>
						</div>

						<div class="md:col-span-2">
							<label for="locationAddress" class="mb-1 block text-sm font-medium"
								>Location Address</label
							>
							<input
								id="locationAddress"
								name="locationAddress"
								type="text"
								bind:value={locationAddress}
								placeholder="Full address"
								class="w-full rounded-lg border px-4 py-2 focus:border-[#D5BA7F] focus:ring-2 focus:ring-[#D5BA7F]"
							/>
						</div>

						<div>
							<label for="memorialDate" class="mb-1 block text-sm font-medium">Memorial Date</label>
							<input
								id="memorialDate"
								name="memorialDate"
								type="date"
								bind:value={memorialDate}
								class="w-full rounded-lg border px-4 py-2 focus:border-[#D5BA7F] focus:ring-2 focus:ring-[#D5BA7F]"
							/>
						</div>

						<div>
							<label for="memorialTime" class="mb-1 block text-sm font-medium">Memorial Time</label>
							<input
								id="memorialTime"
								name="memorialTime"
								type="time"
								bind:value={memorialTime}
								class="w-full rounded-lg border px-4 py-2 focus:border-[#D5BA7F] focus:ring-2 focus:ring-[#D5BA7F]"
							/>
						</div>
					</div>
				</section>

				<!-- FAMILY INFORMATION -->
				<section class="space-y-6 rounded-xl bg-gray-50 p-6 shadow-sm">
					<div>
						<h2 class="mb-1 text-xl font-semibold text-[#D5BA7F]">👨‍👩‍👧‍👦 Family Information</h2>
						<p class="text-sm text-gray-500">Primary family contact details</p>
					</div>

					<div class="grid grid-cols-1 gap-6">
						<div>
							<label for="lovedOneName" class="mb-1 block text-sm font-medium"
								>Loved One's Full Name *</label
							>
							<input
								id="lovedOneName"
								name="lovedOneName"
								type="text"
								required
								bind:value={lovedOneName}
								placeholder="Enter the full name of the deceased"
								class="w-full rounded-lg border px-4 py-2 focus:border-[#D5BA7F] focus:ring-2 focus:ring-[#D5BA7F]"
							/>
							{#if form?.errors?.lovedOneName}<p class="mt-1 text-sm text-red-500">
									{form.errors.lovedOneName}
								</p>{/if}
						</div>

						<div>
							<label for="familyContactName" class="mb-1 block text-sm font-medium"
								>Family Contact Name *</label
							>
							<input
								id="familyContactName"
								name="familyContactName"
								type="text"
								required
								bind:value={familyContactName}
								placeholder="Primary family contact"
								class="w-full rounded-lg border px-4 py-2 focus:border-[#D5BA7F] focus:ring-2 focus:ring-[#D5BA7F]"
							/>
							{#if form?.errors?.familyContactName}<p class="mt-1 text-sm text-red-500">
									{form.errors.familyContactName}
								</p>{/if}
						</div>

						<div>
							<label for="familyContactEmail" class="mb-1 block text-sm font-medium"
								>Family Contact Email *</label
							>
							<input
								id="familyContactEmail"
								name="familyContactEmail"
								type="email"
								required
								bind:value={familyContactEmail}
								placeholder="family@example.com"
								class="w-full rounded-lg border px-4 py-2 focus:border-[#D5BA7F] focus:ring-2 focus:ring-[#D5BA7F]"
							/>
							{#if form?.errors?.familyContactEmail}<p class="mt-1 text-sm text-red-500">
									{form.errors.familyContactEmail}
								</p>{/if}
						</div>

						<div>
							<label for="familyContactPhone" class="mb-1 block text-sm font-medium"
								>Family Contact Phone *</label
							>
							<input
								id="familyContactPhone"
								name="familyContactPhone"
								type="tel"
								required
								bind:value={familyContactPhone}
								placeholder="(555) 123-4567"
								class="w-full rounded-lg border px-4 py-2 focus:border-[#D5BA7F] focus:ring-2 focus:ring-[#D5BA7F]"
							/>
							{#if form?.errors?.familyContactPhone}<p class="mt-1 text-sm text-red-500">
									{form.errors.familyContactPhone}
								</p>{/if}
						</div>
					</div>
				</section>

				<!-- MERGED: FUNERAL DIRECTOR + CONTACT PREFERENCE -->
				<section class="space-y-6 rounded-xl bg-gray-50 p-6 shadow-sm md:col-span-2">
					<div class="flex flex-wrap items-start justify-between gap-6">
						<div>
							<h2 class="mb-1 text-xl font-semibold text-[#D5BA7F]">
								🏛️ Funeral Director & Contact
							</h2>
							<p class="text-sm text-gray-500">
								Service provider details and preferred contact method
							</p>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
						<div>
							<label for="directorName" class="mb-1 block text-sm font-medium"
								>Director Name *</label
							>
							<input
								id="directorName"
								name="directorName"
								type="text"
								required
								bind:value={directorName}
								class="w-full cursor-not-allowed rounded-lg border bg-gray-100 px-4 py-2"
								readonly
							/>
						</div>

						<div>
							<label for="directorEmail" class="mb-1 block text-sm font-medium"
								>Director Email *</label
							>
							<input
								id="directorEmail"
								name="directorEmail"
								type="email"
								required
								bind:value={directorEmail}
								class="w-full cursor-not-allowed rounded-lg border bg-gray-100 px-4 py-2"
								readonly
							/>
						</div>

						<div class="md:col-span-1">
							<p id="contact-preference-label" class="mb-1 block text-sm font-medium">
								Contact Preference
							</p>
							<div
								role="group"
								aria-labelledby="contact-preference-label"
								class="flex h-[42px] items-center gap-6"
							>
								<label class="flex cursor-pointer items-center gap-2">
									<input
										type="radio"
										name="contactPreference"
										value="email"
										bind:group={contactPreference}
										class="accent-[#D5BA7F]"
									/>
									<span>Email</span>
								</label>
								<label class="flex cursor-pointer items-center gap-2">
									<input
										type="radio"
										name="contactPreference"
										value="phone"
										bind:group={contactPreference}
										class="accent-[#D5BA7F]"
									/>
									<span>Phone</span>
								</label>
							</div>
						</div>

						<div class="md:col-span-3">
							<label for="funeralHomeName" class="mb-1 block text-sm font-medium"
								>Funeral Home Name *</label
							>
							<input
								id="funeralHomeName"
								name="funeralHomeName"
								type="text"
								required
								bind:value={funeralHomeName}
								class="w-full cursor-not-allowed rounded-lg border bg-gray-100 px-4 py-2"
								readonly
							/>
						</div>
					</div>
				</section>

				<!-- NOTES -->
				<section class="space-y-6 rounded-xl bg-gray-50 p-6 shadow-sm md:col-span-2">
					<div>
						<h2 class="mb-1 text-xl font-semibold text-[#D5BA7F]">📝 Additional Notes</h2>
						<p class="text-sm text-gray-500">Special requests or other details</p>
					</div>
					<textarea
						rows="4"
						name="additionalNotes"
						bind:value={additionalNotes}
						placeholder="Any special requests, cultural considerations, or additional info..."
						class="w-full rounded-lg border px-4 py-2 focus:border-[#D5BA7F] focus:ring-2 focus:ring-[#D5BA7F]"
					></textarea>
				</section>

				<!-- MESSAGES -->
				{#if form?.error}
					<div class="rounded-lg border border-red-300 bg-red-100 p-4 text-red-600 md:col-span-2">
						❌ {form.error}
					</div>
				{/if}

				<!-- SUBMIT -->
				<div class="space-y-4 text-center md:col-span-2">
					<button
						type="submit"
						class="rounded-lg bg-[#D5BA7F] px-8 py-3 font-semibold text-[#070707] shadow-md transition hover:bg-[#caa767]"
					>
						🚀 Submit Form & Create Account
					</button>
					<p class="mx-auto max-w-prose text-sm text-gray-500">
						By submitting, you'll create the family's account and set up the memorial page. Login
						credentials will be emailed to them.
					</p>
				</div>
			</form>
		{/if}
	</div>
</div>
