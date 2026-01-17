<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="py-16 md:py-24 bg-background">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-12">
			<h1 class="font-title text-4xl md:text-5xl mb-4">Contact Us</h1>
			<p class="text-xl text-muted-foreground">Get in touch with our legal team</p>
		</div>

		<div class="grid md:grid-cols-2 gap-12">
			<div>
				<h2 class="font-title text-2xl mb-6">Send Us a Message</h2>
				
				{#if form?.success}
					<div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded mb-4">
						Thank you for contacting us. We'll get back to you soon!
					</div>
				{/if}

				{#if form?.error}
					<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded mb-4">
						{form.error}
					</div>
				{/if}

				<form method="POST" use:enhance class="space-y-4">
					<div>
						<label for="name" class="block text-sm font-medium mb-2">Name</label>
						<input
							type="text"
							id="name"
							name="name"
							required
							class="w-full px-3 py-2 border border-input rounded-md bg-background"
						/>
					</div>

					<div>
						<label for="email" class="block text-sm font-medium mb-2">Email</label>
						<input
							type="email"
							id="email"
							name="email"
							required
							class="w-full px-3 py-2 border border-input rounded-md bg-background"
						/>
					</div>

					<div>
						<label for="phone" class="block text-sm font-medium mb-2">Phone</label>
						<input
							type="tel"
							id="phone"
							name="phone"
							class="w-full px-3 py-2 border border-input rounded-md bg-background"
						/>
					</div>

					<div>
						<label for="subject" class="block text-sm font-medium mb-2">Subject</label>
						<input
							type="text"
							id="subject"
							name="subject"
							required
							class="w-full px-3 py-2 border border-input rounded-md bg-background"
						/>
					</div>

					<div>
						<label for="message" class="block text-sm font-medium mb-2">Message</label>
						<textarea
							id="message"
							name="message"
							rows="6"
							required
							class="w-full px-3 py-2 border border-input rounded-md bg-background"
						></textarea>
					</div>

					<button
						type="submit"
						class="w-full bg-gold hover:bg-gold-dark text-black font-semibold py-3 px-4 rounded-md transition-colors"
					>
						Send Message
					</button>
				</form>
			</div>

			<div>
				<h2 class="font-title text-2xl mb-6">Office Information</h2>
				
				<div class="space-y-6">
					<div>
						<h3 class="font-semibold mb-2">Address</h3>
						<p class="text-muted-foreground">
							123 Legal Street<br />
							Orlando, FL 32801
						</p>
					</div>

					<div>
						<h3 class="font-semibold mb-2">Phone</h3>
						<a href="tel:4075550100" class="text-gold hover:underline">(407) 555-0100</a>
					</div>

					<div>
						<h3 class="font-semibold mb-2">Email</h3>
						<a href="mailto:info@kinglawfirm.com" class="text-gold hover:underline">info@kinglawfirm.com</a>
					</div>

					<div>
						<h3 class="font-semibold mb-2">Office Hours</h3>
						<p class="text-muted-foreground">
							Monday - Friday: 9:00 AM - 5:00 PM<br />
							Saturday - Sunday: Closed
						</p>
					</div>

					<div class="bg-muted p-6 rounded-lg border border-border">
						<h3 class="font-semibold mb-2">Schedule a Consultation</h3>
						<p class="text-muted-foreground mb-4">
							Contact us today to schedule a free consultation. We're ready to fight for your rights.
						</p>
						<a href="/register" class="inline-block bg-gold hover:bg-gold-dark text-black font-semibold py-2 px-6 rounded-md transition-colors">
							Client Portal
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
