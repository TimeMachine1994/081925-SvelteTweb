<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Mail } from 'lucide-svelte';

	let name: string = '';
	let email: string = '';
	let subject: string = '';
	let message: string = '';
	let errorMessage: string = '';
	let submitting: boolean = false;

	async function handleSubmit() {
		submitting = true;
		errorMessage = '';

		const response = await fetch('/api/contact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ name, email, subject, message })
		});

		submitting = false;

		if (response.ok) {
			goto('/contact/success');
		} else {
			const errorData = await response.json();
			errorMessage = errorData.message || 'An unexpected error occurred.';
			console.error('🚨 Contact form submission failed:', errorMessage);
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4 p-6 bg-white rounded-lg shadow-md">
	<h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
		<Mail class="w-6 h-6 text-blue-600" /> Contact Us
	</h2>

	{#if errorMessage}
		<p class="text-red-600 text-sm">{errorMessage}</p>
	{/if}

	<div>
		<label for="name" class="block text-sm font-medium text-gray-700">Name</label>
		<input
			type="text"
			id="name"
			name="name"
			bind:value={name}
			required
			class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
		/>
	</div>

	<div>
		<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
		<input
			type="email"
			id="email"
			name="email"
			bind:value={email}
			required
			class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
		/>
	</div>

	<div>
		<label for="subject" class="block text-sm font-medium text-gray-700">Subject</label>
		<input
			type="text"
			id="subject"
			name="subject"
			bind:value={subject}
			required
			class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
		/>
	</div>

	<div>
		<label for="message" class="block text-sm font-medium text-gray-700">Message</label>
		<textarea
			id="message"
			name="message"
			bind:value={message}
			required
			rows="5"
			class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
		></textarea>
	</div>

	<button
		type="submit"
		disabled={submitting}
		class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
	>
		{#if submitting}
			Sending...
		{:else}
			Send Message
		{/if}
	</button>
</form>