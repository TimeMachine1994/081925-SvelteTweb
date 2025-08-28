<script lang="ts">
	import { enhance } from '$app/forms';
	import LiveUrlPreview from '$lib/components/LiveUrlPreview.svelte';
	import { page } from '$app/stores';

	console.log('🎯 Loved-One Registration form initializing');

	let { form }: { form?: { error?: any; success?: boolean } } = $props();

	// Pre-fill lovedOneName from URL parameter
	let lovedOneName = $state($page.url.searchParams.get('name') || '');
	let name = $state('');
	let email = $state('');
	let phone = $state('');

	console.log('📝 Form state initialized with runes');

	// Form validation
	let validationErrors = $state<string[]>([]);

	function validateForm() {
		console.log('🔍 Validating form...');
		const errors: string[] = [];

		if (!lovedOneName.trim()) errors.push("Loved one's name is required");
		if (!name.trim()) errors.push('Your name is required');
		if (!email.trim()) errors.push('Your email is required');

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (email && !emailRegex.test(email)) {
			errors.push('Your email must be valid');
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
			<h1 class="text-3xl font-bold mb-4 text-[#D5BA7F]">✨ Create a Memorial</h1>
			<p class="max-w-2xl mx-auto text-gray-200/90">
				Enter your loved one's name to create a beautiful memorial page.
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
					<h2 class="text-xl font-semibold mb-1 text-[#D5BA7F]">📝 Memorial Details</h2>
					<p class="text-gray-500 text-sm">Information about the loved one and memorial page creator</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
					</div>
					<div>
						<label for="name" class="block text-sm font-medium mb-1">Your Name *</label>
						<input
							id="name"
							name="name"
							type="text"
							required
							bind:value={name}
							placeholder="Your full name"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>
					<div>
						<label for="email" class="block text-sm font-medium mb-1">Your Email *</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							bind:value={email}
							placeholder="your@example.com"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>
					<div>
						<label for="phone" class="block text-sm font-medium mb-1">Your Phone Number</label>
						<input
							id="phone"
							name="phone"
							type="tel"
							bind:value={phone}
							placeholder="(555) 123-4567"
							class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]" />
					</div>
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
					🚀 Create Memorial
				</button>
				<p class="text-sm text-gray-500 max-w-prose mx-auto">
					By submitting this form, you'll create your account and set up the memorial page. Login credentials will be emailed.
				</p>
			</div>
		</form>
	</div>
</div>