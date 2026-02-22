<script lang="ts">
	import { faPhone, faEnvelope, faLocationDot, faClock } from '@fortawesome/free-solid-svg-icons';
	import Icon from '$lib/components/Icon.svelte';

	let formData = $state({
		name: '',
		email: '',
		phone: '',
		subject: '',
		message: ''
	});
	let formSubmitting = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		formSubmitting = true;
		
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		alert('Thank you for contacting us. We will respond within 24 hours.');
		formData = { name: '', email: '', phone: '', subject: '', message: '' };
		formSubmitting = false;
	}
</script>

<svelte:head>
	<title>Contact Us - King Law Firm</title>
</svelte:head>

<section class="bg-gradient-to-br from-background via-secondary to-background py-16">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center">
			<h1 class="font-title text-5xl font-bold mb-4">Contact Us</h1>
			<p class="text-xl text-muted-foreground">
				Get in touch with our legal team today
			</p>
		</div>
	</div>
</section>

<section class="py-16 bg-background">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
			<div>
				<h2 class="font-title text-3xl font-bold mb-8">Send Us a Message</h2>
				<form onsubmit={handleSubmit} class="space-y-6">
					<div>
						<label for="name" class="block text-sm font-semibold mb-2">Name *</label>
						<input
							type="text"
							id="name"
							bind:value={formData.name}
							required
							class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
						/>
					</div>

					<div>
						<label for="email" class="block text-sm font-semibold mb-2">Email *</label>
						<input
							type="email"
							id="email"
							bind:value={formData.email}
							required
							class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
						/>
					</div>

					<div>
						<label for="phone" class="block text-sm font-semibold mb-2">Phone</label>
						<input
							type="tel"
							id="phone"
							bind:value={formData.phone}
							class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
						/>
					</div>

					<div>
						<label for="subject" class="block text-sm font-semibold mb-2">Subject *</label>
						<input
							type="text"
							id="subject"
							bind:value={formData.subject}
							required
							class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
						/>
					</div>

					<div>
						<label for="message" class="block text-sm font-semibold mb-2">Message *</label>
						<textarea
							id="message"
							bind:value={formData.message}
							required
							rows="6"
							class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
						></textarea>
					</div>

					<button
						type="submit"
						disabled={formSubmitting}
						class="w-full px-8 py-4 bg-gold text-black font-semibold rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
					>
						{formSubmitting ? 'Sending...' : 'Send Message'}
					</button>
				</form>
			</div>

			<div class="space-y-8">
				<div>
					<h2 class="font-title text-3xl font-bold mb-8">Contact Information</h2>
					
					<div class="space-y-6">
						<div class="flex items-start space-x-4">
							<Icon icon={faLocationDot} size="lg" class="text-gold mt-1" />
							<div>
								<div class="font-semibold mb-1">Office Address</div>
								<p class="text-muted-foreground">
									123 Legal Street<br />
									Suite 100<br />
									City, State 12345
								</p>
							</div>
						</div>

						<div class="flex items-start space-x-4">
							<Icon icon={faPhone} size="lg" class="text-gold mt-1" />
							<div>
								<div class="font-semibold mb-1">Phone</div>
								<a href="tel:555-0100" class="text-muted-foreground hover:text-gold transition-colors">
									(555) 010-0100
								</a>
							</div>
						</div>

						<div class="flex items-start space-x-4">
							<Icon icon={faEnvelope} size="lg" class="text-gold mt-1" />
							<div>
								<div class="font-semibold mb-1">Email</div>
								<a href="mailto:info@kinglaw.com" class="text-muted-foreground hover:text-gold transition-colors">
									info@kinglaw.com
								</a>
							</div>
						</div>

						<div class="flex items-start space-x-4">
							<Icon icon={faClock} size="lg" class="text-gold mt-1" />
							<div>
								<div class="font-semibold mb-1">Office Hours</div>
								<div class="text-muted-foreground space-y-1">
									<div>Monday - Friday: 9:00 AM - 6:00 PM</div>
									<div>Saturday: 10:00 AM - 2:00 PM</div>
									<div>Sunday: Closed</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="bg-secondary p-6 rounded-lg">
					<h3 class="font-title text-xl font-bold mb-4">Emergency Contact</h3>
					<p class="text-muted-foreground mb-4">
						For urgent legal matters outside office hours, please call our emergency line:
					</p>
					<a
						href="tel:555-0199"
						class="inline-block px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold-dark transition-colors"
					>
						(555) 010-0199
					</a>
				</div>
			</div>
		</div>
	</div>
</section>
