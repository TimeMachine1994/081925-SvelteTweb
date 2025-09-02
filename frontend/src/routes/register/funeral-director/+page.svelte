<script lang="ts">
	import { enhance } from '$app/forms';
	import LiveUrlPreview from '$lib/components/LiveUrlPreview.svelte';

	console.log('🎯 Funeral Director Registration form initializing');

	let { form } = $props();

	// Form state
	let lovedOneName = $state('');
	let familyContactName = $state('');
	let familyContactEmail = $state('');
	let familyContactPhone = $state('');
	let directorName = $state('');
	let directorEmail = $state('');
	let funeralHomeName = $state('');
	let locationName = $state('');
	let locationAddress = $state('');
	let memorialDate = $state('');
	let memorialTime = $state('');
	let contactPreference = $state('email');
	let additionalNotes = $state('');

	console.log('📝 Form state initialized with runes');

	// Form validation
	let validationErrors: string[] = $state([]);

	function validateForm() {
		console.log('🔍 Validating form...');
		const errors = [];

		if (!lovedOneName.trim()) errors.push("Loved one's name is required");
		if (!directorName.trim()) errors.push('Director name is required');
		if (!familyContactEmail.trim()) errors.push('Family contact email is required');
		if (!familyContactPhone.trim()) errors.push('Family contact phone is required');
		if (!funeralHomeName.trim()) errors.push('Funeral home name is required');

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (familyContactEmail && !emailRegex.test(familyContactEmail)) {
			errors.push('Family contact email must be a valid address');
		}
		if (directorEmail && !emailRegex.test(directorEmail)) {
			errors.push('Director email must be a valid address');
		}

		validationErrors = errors;
		console.log('✅ Validation complete. Errors:', errors.length);
		return errors.length === 0;
	}

	function handleSubmit(event: SubmitEvent) {
		console.log('📤 Form submission started');
		if (!validateForm()) {
			event.preventDefault();
			console.log('❌ Form validation failed, preventing submission');
		} else {
			console.log('✅ Form validation passed, proceeding with submission');
		}
	}
</script>

<!-- PAGE WRAPPER -->
<div class="min-h-screen bg-gray-50 flex justify-center items-center py-12 px-4">
	<div class="w-full max-w-5xl bg-white shadow-2xl rounded-2xl overflow-hidden">

		<!-- HEADER -->
		<header class="text-center px-8 py-10 bg-[#0f0f0f]">
			<h1 class="text-3xl font-bold mb-4 text-[#D5BA7F]">✨ Funeral Director Registration</h1>
			<p class="max-w-2xl mx-auto text-gray-200/90">
				Create a memorial page on behalf of a family.
			</p>
		</header>

		<form method="POST" use:enhance onsubmit={handleSubmit} class="grid grid-cols-1 md:grid-cols-2 gap-8 p-10">

			<!-- LIVE PREVIEW -->
			<section class="md:col-span-2">
				<LiveUrlPreview bind:lovedOneName />
			</section>

			<!-- MEMORIAL DETAILS -->
			<section class="bg-gray-50 p-6 rounded-xl shadow-sm space-y-6 md:col-span-2">
				<div>
					<h2 class="text-xl font-semibold mb-1 text-gray-700">📝 Memorial Details</h2>
					<p class="text-gray-500 text-sm">Information about the loved one.</p>
				</div>
				<div>
					<label for="lovedOneName" class="block text-sm font-medium mb-1 text-gray-600">Loved One's Full Name *</label>
					<input
						id="lovedOneName"
						name="lovedOneName"
						type="text"
						required
						bind:value={lovedOneName}
						placeholder="Enter the full name of the deceased"
						class="w-full border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
				</div>
			</section>

			<!-- FAMILY CONTACT -->
			<section class="bg-gray-50 p-6 rounded-xl shadow-sm space-y-6">
				<div>
					<h2 class="text-xl font-semibold mb-1 text-gray-700">👨‍👩‍👧‍👦 Family Contact</h2>
					<p class="text-gray-500 text-sm">Primary contact for the family.</p>
				</div>
				<div class="space-y-4">
					<div>
						<label for="familyContactName" class="block text-sm font-medium mb-1 text-gray-600">Family Contact Name</label>
						<input id="familyContactName" name="familyContactName" type="text" bind:value={familyContactName} placeholder="e.g., Jane Doe" class="w-full border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
					</div>
					<div>
						<label for="familyContactEmail" class="block text-sm font-medium mb-1 text-gray-600">Family Contact Email *</label>
						<input id="familyContactEmail" name="familyContactEmail" type="email" required bind:value={familyContactEmail} placeholder="family@example.com" class="w-full border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
					</div>
					<div>
						<label for="familyContactPhone" class="block text-sm font-medium mb-1 text-gray-600">Family Contact Phone *</label>
						<input id="familyContactPhone" name="familyContactPhone" type="tel" required bind:value={familyContactPhone} placeholder="(555) 123-4567" class="w-full border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
					</div>
				</div>
			</section>

			<!-- FUNERAL DIRECTOR -->
			<section class="bg-gray-50 p-6 rounded-xl shadow-sm space-y-6">
				<div>
					<h2 class="text-xl font-semibold mb-1 text-gray-700">👔 Funeral Director</h2>
					<p class="text-gray-500 text-sm">Your information.</p>
				</div>
				<div class="space-y-4">
					<div>
						<label for="directorName" class="block text-sm font-medium mb-1 text-gray-600">Your Name *</label>
						<input id="directorName" name="directorName" type="text" required bind:value={directorName} placeholder="Your full name" class="w-full border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
					</div>
					<div>
						<label for="directorEmail" class="block text-sm font-medium mb-1 text-gray-600">Your Email</label>
						<input id="directorEmail" name="directorEmail" type="email" bind:value={directorEmail} placeholder="your@email.com" class="w-full border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
					</div>
					<div>
						<label for="funeralHomeName" class="block text-sm font-medium mb-1 text-gray-600">Funeral Home Name *</label>
						<input id="funeralHomeName" name="funeralHomeName" type="text" required bind:value={funeralHomeName} placeholder="e.g., Serenity Funeral Home" class="w-full border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
					</div>
				</div>
			</section>

			<!-- SERVICE DETAILS -->
			<section class="bg-gray-50 p-6 rounded-xl shadow-sm space-y-6 md:col-span-2">
				<div>
					<h2 class="text-xl font-semibold mb-1 text-gray-700">📅 Service Details</h2>
					<p class="text-gray-500 text-sm">Optional information about the memorial service.</p>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label for="locationName" class="block text-sm font-medium mb-1 text-gray-600">Location Name</label>
						<input id="locationName" name="locationName" type="text" bind:value={locationName} placeholder="e.g., Chapel of Memories" class="w-full border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
					</div>
					<div>
						<label for="locationAddress" class="block text-sm font-medium mb-1 text-gray-600">Location Address</label>
						<input id="locationAddress" name="locationAddress" type="text" bind:value={locationAddress} placeholder="123 Main St, Anytown, USA" class="w-full border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
					</div>
					<div>
						<label for="memorialDate" class="block text-sm font-medium mb-1 text-gray-600">Memorial Date</label>
						<input id="memorialDate" name="memorialDate" type="date" bind:value={memorialDate} class="w-full border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
					</div>
					<div>
						<label for="memorialTime" class="block text-sm font-medium mb-1 text-gray-600">Memorial Time</label>
						<input id="memorialTime" name="memorialTime" type="time" bind:value={memorialTime} class="w-full border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
					</div>
				</div>
			</section>

			<!-- ADDITIONAL INFO -->
			<section class="bg-gray-50 p-6 rounded-xl shadow-sm space-y-6 md:col-span-2">
				<div>
					<h2 class="text-xl font-semibold mb-1 text-gray-700">ℹ️ Additional Information</h2>
				</div>
				<div>
					<label for="contactPreference" class="block text-sm font-medium mb-1 text-gray-600">Preferred Contact Method</label>
					<select id="contactPreference" name="contactPreference" bind:value={contactPreference} class="w-full border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
						<option value="email">Email</option>
						<option value="phone">Phone</option>
					</select>
				</div>
				<div>
					<label for="additionalNotes" class="block text-sm font-medium mb-1 text-gray-600">Additional Notes</label>
					<textarea id="additionalNotes" name="additionalNotes" bind:value={additionalNotes} rows="4" placeholder="Any other details..." class="w-full border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
				</div>
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
			{#if (form as any)?.success}
				<div class="md:col-span-2 bg-green-100 border border-green-300 text-green-700 p-4 rounded-lg">
					✅ Success! You will be redirected shortly. Please check the family contact's email for login details.
				</div>
			{/if}

			<!-- SUBMIT -->
			<div class="md:col-span-2 text-center space-y-4">
				<button
					type="submit"
					class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-lg shadow-md transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
					🚀 Create Memorial
				</button>
				<p class="text-sm text-gray-500 max-w-prose mx-auto">
					By submitting this form, you'll create an account for the family and set up the memorial page. Login credentials will be emailed to the family contact.
				</p>
			</div>
		</form>
	</div>
</div>
