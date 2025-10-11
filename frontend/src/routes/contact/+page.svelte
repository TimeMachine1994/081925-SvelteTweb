<script lang="ts">
	import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let name = $state('');
	let email = $state('');
	let subject = $state('');
	let message = $state('');
	let isSubmitting = $state(false);
	let error = $state('');
	let success = $state(false);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
			error = 'Please fill in all fields';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim(),
					subject: subject.trim(),
					message: message.trim()
				})
			});

			const result = await response.json();

			if (response.ok) {
				success = true;
				// Reset form
				name = '';
				email = '';
				subject = '';
				message = '';

				// Redirect to confirmation page after 2 seconds
				setTimeout(() => {
					goto('/contact/confirmation');
				}, 2000);
			} else {
				error = result.error || 'Failed to send message. Please try again.';
			}
		} catch (err) {
			error = 'Network error. Please check your connection and try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Contact Us - TributeStream</title>
	<meta
		name="description"
		content="Get in touch with TributeStream. We're here to help with your memorial services and answer any questions you may have."
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
	<!-- Hero Section -->
	<div class="px-4 py-16 text-center">
		<div class="mx-auto max-w-4xl">
			<h1 class="mb-6 text-4xl leading-tight font-bold text-gray-900 md:text-5xl">Get in Touch</h1>
			<p class="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
				We're here to help you create meaningful memorials and support you through every step of the
				process.
			</p>
		</div>
	</div>

	<div class="mx-auto max-w-6xl px-4 pb-16">
		<div class="grid gap-12 lg:grid-cols-2">
			<!-- Contact Form -->
			<div class="rounded-2xl border border-yellow-200 bg-white p-8 shadow-lg">
				<h2 class="mb-6 text-2xl font-bold text-gray-900">Send us a Message</h2>

				{#if success}
					<div class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
						<div class="flex items-center">
							<CheckCircle class="mr-2 h-5 w-5 text-green-600" />
							<p class="font-medium text-green-800">Message sent successfully!</p>
						</div>
						<p class="mt-1 text-sm text-green-700">
							We'll get back to you within 24 hours. Redirecting to confirmation page...
						</p>
					</div>
				{/if}

				{#if error}
					<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
						<p class="text-red-800">{error}</p>
					</div>
				{/if}

				<form onsubmit={handleSubmit} class="space-y-6">
					<div class="grid gap-6 md:grid-cols-2">
						<div>
							<label for="name" class="mb-2 block text-sm font-medium text-gray-700">
								Full Name *
							</label>
							<input
								id="name"
								type="text"
								bind:value={name}
								required
								class="w-full rounded-lg border-2 border-gray-200 px-4 py-3 transition-colors focus:border-yellow-500 focus:outline-none"
								placeholder="Your full name"
							/>
						</div>
						<div>
							<label for="email" class="mb-2 block text-sm font-medium text-gray-700">
								Email Address *
							</label>
							<input
								id="email"
								type="email"
								bind:value={email}
								required
								class="w-full rounded-lg border-2 border-gray-200 px-4 py-3 transition-colors focus:border-yellow-500 focus:outline-none"
								placeholder="your@email.com"
							/>
						</div>
					</div>

					<div>
						<label for="subject" class="mb-2 block text-sm font-medium text-gray-700">
							Subject *
						</label>
						<input
							id="subject"
							type="text"
							bind:value={subject}
							required
							class="w-full rounded-lg border-2 border-gray-200 px-4 py-3 transition-colors focus:border-yellow-500 focus:outline-none"
							placeholder="What can we help you with?"
						/>
					</div>

					<div>
						<label for="message" class="mb-2 block text-sm font-medium text-gray-700">
							Message *
						</label>
						<textarea
							id="message"
							bind:value={message}
							required
							rows="6"
							class="resize-vertical w-full rounded-lg border-2 border-gray-200 px-4 py-3 transition-colors focus:border-yellow-500 focus:outline-none"
							placeholder="Tell us more about how we can help you..."
						></textarea>
					</div>

					<button
						type="submit"
						disabled={isSubmitting}
						class="flex w-full transform items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-yellow-600 to-amber-600 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-yellow-700 hover:to-amber-700 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isSubmitting}
							<div
								class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
							></div>
							Sending...
						{:else}
							<Send class="h-5 w-5" />
							Send Message
						{/if}
					</button>
				</form>
			</div>

			<!-- Contact Information -->
			<div class="space-y-8">
				<div class="rounded-2xl border border-yellow-200 bg-white p-8 shadow-lg">
					<h3 class="mb-6 text-xl font-bold text-gray-900">Contact Information</h3>
					<div class="space-y-4">
						<div class="flex items-start space-x-4">
							<div
								class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100"
							>
								<Mail class="h-5 w-5 text-yellow-600" />
							</div>
							<div>
								<h4 class="font-semibold text-gray-900">Email</h4>
								<p class="text-gray-600">support@tributestream.com</p>
								<p class="text-sm text-gray-500">We typically respond within 24 hours</p>
							</div>
						</div>

						<div class="flex items-start space-x-4">
							<div
								class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100"
							>
								<Phone class="h-5 w-5 text-amber-600" />
							</div>
							<div>
								<h4 class="font-semibold text-gray-900">Phone</h4>
								<p class="text-gray-600">1-800-TRIBUTE</p>
								<p class="text-sm text-gray-500">Monday - Friday, 9 AM - 6 PM EST</p>
							</div>
						</div>

						<div class="flex items-start space-x-4">
							<div
								class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100"
							>
								<MapPin class="h-5 w-5 text-orange-600" />
							</div>
							<div>
								<h4 class="font-semibold text-gray-900">Address</h4>
								<p class="text-gray-600">
									TributeStream<br />
									123 Memorial Way<br />
									Suite 100<br />
									Anytown, ST 12345
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- FAQ Section -->
				<div class="rounded-2xl border border-yellow-200 bg-white p-8 shadow-lg">
					<h3 class="mb-6 text-xl font-bold text-gray-900">Frequently Asked Questions</h3>
					<div class="space-y-4">
						<div>
							<h4 class="mb-2 font-semibold text-gray-900">How quickly can I set up a memorial?</h4>
							<p class="text-sm text-gray-600">
								Most memorials can be set up within minutes. Our team is also available to help with
								setup if needed.
							</p>
						</div>

						<div>
							<h4 class="mb-2 font-semibold text-gray-900">
								Do you offer technical support during services?
							</h4>
							<p class="text-sm text-gray-600">
								Yes, we provide live technical support during memorial services to ensure everything
								runs smoothly.
							</p>
						</div>

						<div>
							<h4 class="mb-2 font-semibold text-gray-900">Can I customize the memorial page?</h4>
							<p class="text-sm text-gray-600">
								Absolutely! You can add photos, videos, stories, and customize the design to reflect
								your loved one's personality.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
