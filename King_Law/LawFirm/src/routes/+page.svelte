<script lang="ts">
	import { faGavel, faHandshake, faUsers, faShieldHalved, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
	import Icon from '$lib/components/Icon.svelte';

	let formData = $state({
		name: '',
		email: '',
		phone: '',
		message: ''
	});
	let formSubmitting = $state(false);

	const services = [
		{
			icon: faGavel,
			title: 'Personal Injury & Civil Suits',
			description: 'Expert representation for accident victims and civil litigation matters.',
			href: '/services/personal-injury'
		},
		{
			icon: faHandshake,
			title: 'Business & Intellectual Property',
			description: 'Protecting your business interests and intellectual assets.',
			href: '/services/business-intellectual-property'
		},
		{
			icon: faUsers,
			title: 'Family & Estate Law',
			description: 'Compassionate guidance through family matters and estate planning.',
			href: '/services/family-estate-law'
		},
		{
			icon: faShieldHalved,
			title: 'Criminal Defense',
			description: 'Aggressive defense to protect your rights and freedom.',
			href: '/services/criminal-defense'
		}
	];

	async function handleSubmit(e: Event) {
		e.preventDefault();
		formSubmitting = true;
		
		// TODO: Implement contact form submission
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		alert('Thank you for your message. We will contact you soon.');
		formData = { name: '', email: '', phone: '', message: '' };
		formSubmitting = false;
	}
</script>

<svelte:head>
	<title>King Law Firm - Professional Legal Services</title>
</svelte:head>

<!-- Hero Section -->
<section class="relative bg-gradient-to-br from-background via-secondary to-background py-20 md:py-32">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center">
			<h1 class="font-title text-5xl md:text-7xl font-bold mb-6">
				Excellence in Legal Representation
			</h1>
			<p class="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
				Dedicated attorneys committed to protecting your rights and securing justice
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a
					href="/contact"
					class="px-8 py-4 bg-gold text-black font-semibold rounded-lg hover:bg-gold-dark transition-colors text-lg"
				>
					Schedule Consultation
				</a>
				<a
					href="/about"
					class="px-8 py-4 bg-secondary text-foreground font-semibold rounded-lg hover:bg-muted transition-colors text-lg"
				>
					Learn More
				</a>
			</div>
		</div>
	</div>
</section>

<!-- About Section -->
<section class="py-20 bg-background">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
			<div>
				<h2 class="font-title text-4xl font-bold mb-6">About King Law Firm</h2>
				<p class="text-lg text-muted-foreground mb-4">
					For over two decades, King Law Firm has been a pillar of legal excellence in our community. 
					Our team of experienced attorneys combines deep legal knowledge with a genuine commitment to 
					our clients' success.
				</p>
				<p class="text-lg text-muted-foreground mb-6">
					We believe that everyone deserves access to quality legal representation, and we fight 
					tirelessly to ensure that justice prevails in every case we handle.
				</p>
				<blockquote class="font-quote text-2xl text-gold italic border-l-4 border-gold pl-6">
					"Justice delayed is justice denied."
				</blockquote>
			</div>
			<div class="bg-secondary rounded-lg p-8">
				<h3 class="font-title text-2xl font-bold mb-4">Why Choose Us</h3>
				<ul class="space-y-4">
					<li class="flex items-start space-x-3">
						<span class="text-gold text-xl">✓</span>
						<span class="text-muted-foreground">Over 20 years of combined legal experience</span>
					</li>
					<li class="flex items-start space-x-3">
						<span class="text-gold text-xl">✓</span>
						<span class="text-muted-foreground">Personalized attention to every client</span>
					</li>
					<li class="flex items-start space-x-3">
						<span class="text-gold text-xl">✓</span>
						<span class="text-muted-foreground">Proven track record of successful outcomes</span>
					</li>
					<li class="flex items-start space-x-3">
						<span class="text-gold text-xl">✓</span>
						<span class="text-muted-foreground">Available 24/7 for urgent matters</span>
					</li>
				</ul>
			</div>
		</div>
	</div>
</section>

<!-- Services Section -->
<section class="py-20 bg-secondary">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-12">
			<h2 class="font-title text-4xl font-bold mb-4">Our Practice Areas</h2>
			<p class="text-lg text-muted-foreground">
				Comprehensive legal services tailored to your needs
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each services as service}
				<a
					href={service.href}
					class="bg-background p-6 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-gold hover:shadow-lg transition-all group"
				>
					<div class="mb-4">
						<Icon icon={service.icon} size="2xl" class="text-gold group-hover:scale-110 transition-transform" />
					</div>
					<h3 class="font-title text-xl font-bold mb-3">{service.title}</h3>
					<p class="text-muted-foreground mb-4">{service.description}</p>
					<span class="text-gold font-semibold group-hover:underline">Learn More →</span>
				</a>
			{/each}
		</div>
	</div>
</section>

<!-- Contact Section -->
<section id="contact" class="py-20 bg-background">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-12">
			<h2 class="font-title text-4xl font-bold mb-4">Get in Touch</h2>
			<p class="text-lg text-muted-foreground">
				Schedule a free consultation to discuss your legal needs
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
			<!-- Contact Form -->
			<form onsubmit={handleSubmit} class="space-y-6">
				<div>
					<label for="name" class="block text-sm font-semibold mb-2">Name</label>
					<input
						type="text"
						id="name"
						bind:value={formData.name}
						required
						class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
					/>
				</div>

				<div>
					<label for="email" class="block text-sm font-semibold mb-2">Email</label>
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
					<label for="message" class="block text-sm font-semibold mb-2">Message</label>
					<textarea
						id="message"
						bind:value={formData.message}
						required
						rows="4"
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

			<!-- Contact Information -->
			<div class="space-y-8">
				<div>
					<h3 class="font-title text-2xl font-bold mb-6">Contact Information</h3>
					
					<div class="space-y-4">
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
					</div>
				</div>

				<div class="bg-secondary p-6 rounded-lg">
					<h4 class="font-title text-xl font-bold mb-4">Office Hours</h4>
					<div class="space-y-2 text-muted-foreground">
						<div class="flex justify-between">
							<span>Monday - Friday:</span>
							<span class="font-semibold">9:00 AM - 6:00 PM</span>
						</div>
						<div class="flex justify-between">
							<span>Saturday:</span>
							<span class="font-semibold">10:00 AM - 2:00 PM</span>
						</div>
						<div class="flex justify-between">
							<span>Sunday:</span>
							<span class="font-semibold">Closed</span>
						</div>
					</div>
					<div class="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
						<p class="text-sm text-muted-foreground">
							Emergency consultations available 24/7
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
