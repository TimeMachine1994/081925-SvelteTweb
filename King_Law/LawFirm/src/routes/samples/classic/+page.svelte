<script lang="ts">
	const services = [
		{ title: 'Personal Injury', icon: '⚖️', description: 'Fighting for fair compensation when you\'ve been wronged.' },
		{ title: 'Family Law', icon: '👨‍👩‍👧', description: 'Protecting what matters most—your family.' },
		{ title: 'Business Law', icon: '🏢', description: 'Strategic counsel for growing enterprises.' },
		{ title: 'Criminal Defense', icon: '🛡️', description: 'Vigorous defense of your rights and freedom.' }
	];
</script>

<svelte:head>
	<title>King Law - Classic Design Sample</title>
</svelte:head>

<!-- Sample 1: Classic/Traditional -->
<div class="min-h-screen">
	<!-- Hero Section -->
	<section class="bg-king-blue text-white py-24">
		<div class="max-w-6xl mx-auto px-6 text-center">
			<div class="mb-6">
				<img src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/King+Law+Official+Logo++No+BKG.png" alt="King Law" class="h-16 w-auto mx-auto" />
			</div>
			<h1 class="font-title text-5xl md:text-7xl mb-4">King Law Firm</h1>
			<div class="w-24 h-1 bg-gold mx-auto mb-6"></div>
			<p class="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-8">
				Established Excellence in Legal Representation Since 1985
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a href="/contact" class="bg-gold hover:bg-gold-dark text-king-blue px-8 py-4 rounded font-semibold text-lg transition-all">
					Schedule Consultation
				</a>
				<a href="/about" class="border-2 border-white hover:bg-white hover:text-king-blue px-8 py-4 rounded font-semibold text-lg transition-all">
					Learn More
				</a>
			</div>
		</div>
	</section>

	<!-- Tagline Banner -->
	<section class="bg-gold py-6">
		<div class="max-w-6xl mx-auto px-6 text-center">
			<p class="font-title text-2xl text-king-blue italic">
				"Justice with Integrity, Service with Honor"
			</p>
		</div>
	</section>

	<!-- Services Grid -->
	<section class="py-20 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<h2 class="font-title text-4xl text-king-blue text-center mb-4">Our Practice Areas</h2>
			<div class="w-16 h-1 bg-gold mx-auto mb-12"></div>
			
			<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
				{#each services as service}
					<div class="text-center p-6 border border-gray-200 rounded-lg hover:shadow-lg hover:border-gold transition-all group">
						<div class="text-4xl mb-4">{service.icon}</div>
						<h3 class="font-title text-xl text-king-blue mb-2 group-hover:text-gold transition-colors">{service.title}</h3>
						<p class="text-gray-600 text-sm">{service.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Trust Indicators -->
	<section class="py-16 bg-gray-50">
		<div class="max-w-6xl mx-auto px-6">
			<div class="grid md:grid-cols-3 gap-8 text-center">
				<div>
					<div class="text-5xl font-title text-gold mb-2">40+</div>
					<p class="text-king-blue font-semibold">Years of Experience</p>
				</div>
				<div>
					<div class="text-5xl font-title text-gold mb-2">5,000+</div>
					<p class="text-king-blue font-semibold">Cases Won</p>
				</div>
				<div>
					<div class="text-5xl font-title text-gold mb-2">98%</div>
					<p class="text-king-blue font-semibold">Client Satisfaction</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="py-20 bg-king-blue">
		<div class="max-w-4xl mx-auto px-6 text-center text-white">
			<h2 class="font-title text-4xl mb-4">Ready to Discuss Your Case?</h2>
			<p class="text-gray-300 mb-8 text-lg">Our attorneys are standing by for a confidential consultation.</p>
			<a href="/contact" class="inline-block bg-gold hover:bg-gold-dark text-king-blue px-10 py-4 rounded font-semibold text-lg transition-all">
				Contact Us Today
			</a>
		</div>
	</section>

	<!-- Sample Label -->
	<div class="fixed bottom-4 left-4 bg-king-blue text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
		Sample 1: Classic Design
	</div>
</div>
