<script lang="ts">
	import { enhance } from '$app/forms';

	let { form }: { form?: { error?: any; success?: boolean } } = $props();

	let fullName = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');

	let validationErrors = $state<string[]>([]);

	function validateForm() {
		const errors: string[] = [];
		if (!fullName.trim()) errors.push("Full name is required");
		if (!email.trim()) errors.push('Email is required');
		if (!password) errors.push('Password is required');
		if (password !== confirmPassword) errors.push('Passwords do not match');
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (email && !emailRegex.test(email)) errors.push('Email must be valid');
		validationErrors = errors;
		return errors.length === 0;
	}

	function handleSubmit(e: SubmitEvent) {
		if (!validateForm()) e.preventDefault();
	}
</script>

<div class="min-h-screen bg-gray-50 flex justify-center items-center py-12 px-4">
	<div class="w-full max-w-lg bg-white shadow-2xl rounded-2xl overflow-hidden">
		<header class="text-center px-8 py-10 bg-[#0f0f0f]">
			<h1 class="text-3xl font-bold mb-4 text-[#D5BA7F]">Create Your Account</h1>
			<p class="max-w-2xl mx-auto text-gray-200/90">
				Create an account to save your selections and continue.
			</p>
		</header>

		<form method="POST" use:enhance onsubmit={handleSubmit} class="p-10 space-y-6">
			<section class="space-y-6">
				<div>
					<label for="fullName" class="block text-sm font-medium mb-1">Full Name *</label>
					<input
						type="text"
						id="fullName"
						name="fullName"
						required
						bind:value={fullName}
						placeholder="Enter your full name"
						class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]"
					/>
				</div>
				<div>
					<label for="email" class="block text-sm font-medium mb-1">Email *</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						bind:value={email}
						placeholder="your@email.com"
						class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]"
					/>
				</div>
				<div>
					<label for="password" class="block text-sm font-medium mb-1">Password *</label>
					<input
						type="password"
						id="password"
						name="password"
						required
						bind:value={password}
						class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]"
					/>
				</div>
				<div>
					<label for="confirmPassword" class="block text-sm font-medium mb-1">Confirm Password *</label>
					<input
						type="password"
						id="confirmPassword"
						name="confirmPassword"
						required
						bind:value={confirmPassword}
						class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F]"
					/>
				</div>
			</section>

			{#if validationErrors.length > 0}
				<div class="bg-red-50 border border-red-300 text-red-700 rounded-lg p-4 space-y-2">
					<h3 class="font-semibold">Please correct the following errors:</h3>
					<ul class="list-disc list-inside">
						{#each validationErrors as error}
							<li>{error}</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if form?.error}
				<div class="bg-red-100 border border-red-300 text-red-600 p-4 rounded-lg">
					{form.error}
				</div>
			{/if}
			{#if form?.success}
				<div class="bg-green-100 border border-green-300 text-green-700 p-4 rounded-lg">
					Success! You are now being redirected.
				</div>
			{/if}

			<div class="text-center">
				<button
					type="submit"
					class="bg-[#D5BA7F] hover:bg-[#caa767] text-[#070707] font-semibold px-8 py-3 rounded-lg shadow-md transition"
				>
					Create Account & Continue
				</button>
			</div>
		</form>
	</div>
</div>