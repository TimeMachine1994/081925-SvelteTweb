<script lang="ts">
	const practices = [
		{ title: 'Personal Injury', stat: '$50M+', statLabel: 'Recovered' },
		{ title: 'Family Law', stat: '2,000+', statLabel: 'Families Helped' },
		{ title: 'Business Law', stat: '500+', statLabel: 'Businesses Protected' },
		{ title: 'Criminal Defense', stat: '95%', statLabel: 'Cases Dismissed' }
	];

	const testimonials = [
		{ quote: 'King Law fought for me when no one else would. They won my case and changed my life.', author: 'Sarah M.' },
		{ quote: 'Professional, responsive, and genuinely caring. I couldn\'t have asked for better representation.', author: 'James T.' }
	];
</script>

<svelte:head>
	<title>King Law - Modern Design Sample</title>
</svelte:head>

<!-- Sample 2: Modern/Bold -->
<div class="min-h-screen bg-white">
	<!-- Hero Section - Full Screen -->
	<section class="min-h-screen flex items-center relative overflow-hidden">
		<!-- Background Pattern -->
		<div class="absolute inset-0 bg-gradient-to-br from-king-blue via-king-blue to-king-blue-dark"></div>
		<div class="absolute inset-0 opacity-10">
			<div class="absolute top-20 right-20 w-96 h-96 border border-gold rounded-full"></div>
			<div class="absolute bottom-20 left-20 w-64 h-64 border border-gold rounded-full"></div>
			<div class="absolute top-1/2 left-1/2 w-[600px] h-[600px] border border-gold/30 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
		</div>

		<div class="relative z-10 max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
			<div>
				<div class="inline-block bg-gold/20 text-gold px-4 py-2 rounded-full text-sm font-semibold mb-6">
					Orlando's Premier Law Firm
				</div>
				<h1 class="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
					Your Fight.<br/>
					<span class="text-gold">Our Mission.</span>
				</h1>
				<p class="text-xl text-gray-300 mb-8 max-w-lg">
					Bold representation. Uncompromising results. King Law delivers justice when it matters most.
				</p>
				<div class="flex flex-wrap gap-4">
					<a href="/contact" class="bg-gold hover:bg-gold-light text-king-blue px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg">
						Get Started →
					</a>
					<a href="tel:4075550100" class="border-2 border-white/30 hover:border-gold text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all flex items-center gap-2">
						<span class="text-gold">📞</span> (407) 555-0100
					</a>
				</div>
			</div>

			<!-- Stats Cards -->
			<div class="grid grid-cols-2 gap-4">
				{#each practices as practice}
					<div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all">
						<div class="text-3xl font-bold text-gold mb-1">{practice.stat}</div>
						<div class="text-sm text-gray-400">{practice.statLabel}</div>
						<div class="text-white font-semibold mt-2">{practice.title}</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Scroll Indicator -->
		<div class="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
			</svg>
		</div>
	</section>

	<!-- Why Choose Us -->
	<section class="py-24 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-16">
				<h2 class="text-4xl md:text-5xl font-bold text-king-blue mb-4">Why King Law?</h2>
				<div class="w-20 h-1 bg-gold mx-auto"></div>
			</div>

			<div class="grid md:grid-cols-3 gap-8">
				<div class="group">
					<div class="bg-king-blue rounded-2xl p-8 h-full transition-all group-hover:shadow-2xl group-hover:-translate-y-2">
						<div class="w-16 h-16 bg-gold rounded-xl flex items-center justify-center text-3xl mb-6">💪</div>
						<h3 class="text-2xl font-bold text-white mb-4">Aggressive Advocacy</h3>
						<p class="text-gray-300">We don't back down. Our attorneys fight relentlessly for every client, every case.</p>
					</div>
				</div>
				<div class="group">
					<div class="bg-gold rounded-2xl p-8 h-full transition-all group-hover:shadow-2xl group-hover:-translate-y-2">
						<div class="w-16 h-16 bg-king-blue rounded-xl flex items-center justify-center text-3xl mb-6">🎯</div>
						<h3 class="text-2xl font-bold text-king-blue mb-4">Results-Driven</h3>
						<p class="text-king-blue/80">Our track record speaks for itself. Millions recovered, thousands of cases won.</p>
					</div>
				</div>
				<div class="group">
					<div class="bg-king-blue rounded-2xl p-8 h-full transition-all group-hover:shadow-2xl group-hover:-translate-y-2">
						<div class="w-16 h-16 bg-gold rounded-xl flex items-center justify-center text-3xl mb-6">🤝</div>
						<h3 class="text-2xl font-bold text-white mb-4">Client-First</h3>
						<p class="text-gray-300">Available 24/7. Direct attorney access. You're never just a case number.</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Testimonials -->
	<section class="py-24 bg-gray-50">
		<div class="max-w-6xl mx-auto px-6">
			<div class="grid md:grid-cols-2 gap-8">
				{#each testimonials as testimonial}
					<div class="bg-white p-8 rounded-2xl shadow-lg border-l-4 border-gold">
						<div class="text-gold text-4xl mb-4">"</div>
						<p class="text-xl text-king-blue mb-6">{testimonial.quote}</p>
						<p class="font-bold text-gray-600">— {testimonial.author}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- CTA -->
	<section class="py-20 bg-gradient-to-r from-king-blue to-king-blue-dark">
		<div class="max-w-4xl mx-auto px-6 text-center">
			<h2 class="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Win?</h2>
			<p class="text-xl text-gray-300 mb-8">Free consultation. No fee unless we win.</p>
			<a href="/contact" class="inline-block bg-gold hover:bg-gold-light text-king-blue px-12 py-5 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-xl">
				Start Your Case Today
			</a>
		</div>
	</section>

	<!-- Sample Label -->
	<div class="fixed bottom-4 left-4 bg-gold text-king-blue px-4 py-2 rounded-full text-sm font-bold shadow-lg">
		Sample 2: Modern Bold Design
	</div>
</div>
