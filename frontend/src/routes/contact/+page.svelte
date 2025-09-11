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
	<meta name="description" content="Get in touch with TributeStream. We're here to help with your memorial services and answer any questions you may have." />
</svelte:head>

<div class="bg-gradient-to-b from-yellow-50 to-white min-h-screen">
	<!-- Hero Section -->
	<div class="text-center py-16 px-4">
		<div class="max-w-4xl mx-auto">
			<h1 class="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
				Get in Touch
			</h1>
			<p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
				We're here to help you create meaningful memorials and support you through every step of the process.
			</p>
		</div>
	</div>

	<div class="max-w-6xl mx-auto px-4 pb-16">
		<div class="grid lg:grid-cols-2 gap-12">
			<!-- Contact Form -->
			<div class="bg-white p-8 rounded-2xl shadow-lg border border-yellow-200">
				<h2 class="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
				
				{#if success}
					<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
						<div class="flex items-center">
							<CheckCircle class="w-5 h-5 text-green-600 mr-2" />
							<p class="text-green-800 font-medium">Message sent successfully!</p>
						</div>
						<p class="text-green-700 text-sm mt-1">We'll get back to you within 24 hours. Redirecting to confirmation page...</p>
					</div>
				{/if}
				
				{#if error}
					<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
						<p class="text-red-800">{error}</p>
					</div>
				{/if}
				
				<form onsubmit={handleSubmit} class="space-y-6">
					<div class="grid md:grid-cols-2 gap-6">
						<div>
							<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
								Full Name *
							</label>
							<input
								id="name"
								type="text"
								bind:value={name}
								required
								class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none transition-colors"
								placeholder="Your full name"
							/>
						</div>
						<div>
							<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
								Email Address *
							</label>
							<input
								id="email"
								type="email"
								bind:value={email}
								required
								class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none transition-colors"
								placeholder="your@email.com"
							/>
						</div>
					</div>
					
					<div>
						<label for="subject" class="block text-sm font-medium text-gray-700 mb-2">
							Subject *
						</label>
						<input
							id="subject"
							type="text"
							bind:value={subject}
							required
							class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none transition-colors"
							placeholder="What can we help you with?"
						/>
					</div>
					
					<div>
						<label for="message" class="block text-sm font-medium text-gray-700 mb-2">
							Message *
						</label>
						<textarea
							id="message"
							bind:value={message}
							required
							rows="6"
							class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none transition-colors resize-vertical"
							placeholder="Tell us more about how we can help you..."
						></textarea>
					</div>
					
					<button
						type="submit"
						disabled={isSubmitting}
						class="w-full bg-gradient-to-r from-yellow-600 to-amber-600 text-white py-4 px-6 rounded-lg hover:from-yellow-700 hover:to-amber-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
					>
						{#if isSubmitting}
							<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							Sending...
						{:else}
							<Send class="w-5 h-5" />
							Send Message
						{/if}
					</button>
				</form>
			</div>

			<!-- Contact Information -->
			<div class="space-y-8">
				<div class="bg-white p-8 rounded-2xl shadow-lg border border-yellow-200">
					<h3 class="text-xl font-bold text-gray-900 mb-6">Contact Information</h3>
					<div class="space-y-4">
						<div class="flex items-start space-x-4">
							<div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
								<Mail class="w-5 h-5 text-yellow-600" />
							</div>
							<div>
								<h4 class="font-semibold text-gray-900">Email</h4>
								<p class="text-gray-600">support@tributestream.com</p>
								<p class="text-sm text-gray-500">We typically respond within 24 hours</p>
							</div>
						</div>
						
						<div class="flex items-start space-x-4">
							<div class="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
								<Phone class="w-5 h-5 text-amber-600" />
							</div>
							<div>
								<h4 class="font-semibold text-gray-900">Phone</h4>
								<p class="text-gray-600">1-800-TRIBUTE</p>
								<p class="text-sm text-gray-500">Monday - Friday, 9 AM - 6 PM EST</p>
							</div>
						</div>
						
						<div class="flex items-start space-x-4">
							<div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
								<MapPin class="w-5 h-5 text-orange-600" />
							</div>
							<div>
								<h4 class="font-semibold text-gray-900">Address</h4>
								<p class="text-gray-600">
									TributeStream<br>
									123 Memorial Way<br>
									Suite 100<br>
									Anytown, ST 12345
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- FAQ Section -->
				<div class="bg-white p-8 rounded-2xl shadow-lg border border-yellow-200">
					<h3 class="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
					<div class="space-y-4">
						<div>
							<h4 class="font-semibold text-gray-900 mb-2">How quickly can I set up a memorial?</h4>
							<p class="text-gray-600 text-sm">Most memorials can be set up within minutes. Our team is also available to help with setup if needed.</p>
						</div>
						
						<div>
							<h4 class="font-semibold text-gray-900 mb-2">Do you offer technical support during services?</h4>
							<p class="text-gray-600 text-sm">Yes, we provide live technical support during memorial services to ensure everything runs smoothly.</p>
						</div>
						
						<div>
							<h4 class="font-semibold text-gray-900 mb-2">Can I customize the memorial page?</h4>
							<p class="text-gray-600 text-sm">Absolutely! You can add photos, videos, stories, and customize the design to reflect your loved one's personality.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
