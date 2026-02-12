<script lang="ts">
	import ScheduleWidget from '$lib/components/ScheduleWidget.svelte';
</script>

<svelte:head>
	<title>King Law, PLLC — Your Personal General Counsel</title>
</svelte:head>

<div class="min-h-screen pt-20">
	<!-- Hero Section -->
	<section class="min-h-[85vh] flex items-center relative overflow-hidden">
		<!-- Background Image -->
		<div class="absolute inset-0">
			<img 
				src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/JusticeHomeHeader.jpeg" 
				alt="Justice" 
				class="w-full h-full object-cover"
			/>
			<div class="absolute inset-0 bg-king-blue/85"></div>
		</div>

		<div class="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 py-24 text-center">
			<p class="text-gold uppercase tracking-[0.3em] text-sm mb-2">King Law, PLLC</p>
			<a href="tel:6893536943" class="text-white/70 text-sm mb-6 block">(689) 353-6943</a>
			<h1 class="font-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.1] mb-6">
				Your Personal<br/>
				<span class="text-gold">General Counsel</span>
			</h1>
			<p class="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed">
				Coordinated legal strategy for Orlando's executives, physicians, and business leaders. One firm. One roadmap. Every matter handled.
			</p>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-3xl mx-auto mb-12 text-left">
				<div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 depth-card-dark">
					<div class="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center mb-4">
						<span class="text-gold text-lg font-bold">1</span>
					</div>
					<h3 class="text-white font-semibold mb-2">Coordinated Strategy</h3>
					<p class="text-white/50 text-sm leading-relaxed">We quarterback every matter and align with your CPA and wealth manager so you don't have to.</p>
				</div>
				<div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 depth-card-dark">
					<div class="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center mb-4">
						<span class="text-gold text-lg font-bold">2</span>
					</div>
					<h3 class="text-white font-semibold mb-2">Proactive Risk Management</h3>
					<p class="text-white/50 text-sm leading-relaxed">We identify and contain exposure before it becomes a crisis, not after.</p>
				</div>
				<div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 depth-card-dark">
					<div class="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center mb-4">
						<span class="text-gold text-lg font-bold">3</span>
					</div>
					<h3 class="text-white font-semibold mb-2">Direct Attorney Access</h3>
					<p class="text-white/50 text-sm leading-relaxed">You get the attorney, not a gatekeeper. Responsive, hands-on guidance that protects your time and reputation.</p>
				</div>
			</div>

			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a href="/schedule" class="w-full sm:w-auto bg-gold hover:bg-gold-light text-king-blue px-6 sm:px-10 py-4 rounded-lg font-bold transition-all transform hover:scale-105 depth-gold text-base md:text-lg text-center">
					Schedule Free In-Person Consultation
				</a>
				<a href="tel:6893536943" class="border-2 border-white/30 hover:border-gold text-white px-8 py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 depth-ghost">
					<svg class="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
					(689) 353-6943
				</a>
			</div>
		</div>

		<!-- Scroll Indicator -->
		<div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
			<svg class="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
			</svg>
		</div>
	</section>

	<!-- How We Work -->
	<section class="py-24 bg-background">
		<div class="max-w-5xl mx-auto px-6 lg:px-8">
			<p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">How We Work</p>
			<h2 class="font-title text-4xl text-king-blue dark:text-white mb-8 md:mb-16">Built Around Your Priorities</h2>
			
			<div class="space-y-0">
				<div class="grid md:grid-cols-12 gap-4 md:gap-8 items-start border-l-4 border-l-gold border-t border-t-gray-200 dark:border-t-white/10 py-6 md:py-10 pl-4 md:pl-6">
					<div class="md:col-span-1">
						<span class="text-gold font-bold">01</span>
					</div>
					<div class="md:col-span-4">
						<h3 class="font-title text-2xl text-king-blue dark:text-white">Single Point of Accountability</h3>
					</div>
					<div class="md:col-span-7">
						<p class="text-gray-800 dark:text-white/60 text-lg leading-relaxed">One attorney coordinates every matter, aligns with your outside advisors, and owns the whole picture so you never have to chase updates.</p>
					</div>
				</div>

				<div class="grid md:grid-cols-12 gap-4 md:gap-8 items-start border-l-4 border-l-gold/40 border-t border-t-gray-200 dark:border-t-white/10 py-6 md:py-10 pl-4 md:pl-6">
					<div class="md:col-span-1">
						<span class="text-gold font-bold">02</span>
					</div>
					<div class="md:col-span-4">
						<h3 class="font-title text-2xl text-king-blue dark:text-white">Prevention Over Reaction</h3>
					</div>
					<div class="md:col-span-7">
						<p class="text-gray-800 dark:text-white/60 text-lg leading-relaxed">We map risk proactively — reviewing contracts, structuring entities, and identifying exposure before problems surface.</p>
					</div>
				</div>

				<div class="grid md:grid-cols-12 gap-4 md:gap-8 items-start border-l-4 border-l-gold border-t border-t-gray-200 dark:border-t-white/10 py-6 md:py-10 pl-4 md:pl-6">
					<div class="md:col-span-1">
						<span class="text-gold font-bold">03</span>
					</div>
					<div class="md:col-span-4">
						<h3 class="font-title text-2xl text-king-blue dark:text-white">Transparent Process</h3>
					</div>
					<div class="md:col-span-7">
						<p class="text-gray-800 dark:text-white/60 text-lg leading-relaxed">Clear fee structures, a secure client portal, and direct communication. You always know what's happening, what it costs, and what comes next.</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Practice Areas - Modern Cards -->
	<section class="py-24 bg-king-blue">
		<div class="max-w-6xl mx-auto px-6 lg:px-8">
			<div class="grid md:grid-cols-2 gap-8 md:gap-16 mb-8 md:mb-16">
				<div>
					<p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">Practice Areas</p>
					<h2 class="font-title text-4xl text-white">Integrated Legal Solutions</h2>
				</div>
				<div class="flex items-end">
					<p class="text-white/60 leading-relaxed">
						Each practice area is coordinated under one strategy — so your employment matter, real estate closing, and estate plan don't exist in silos.
					</p>
				</div>
			</div>

			<div class="grid md:grid-cols-2 gap-4 md:gap-6">
				<a href="/services/personal-injury" class="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/50 rounded-2xl p-5 md:p-8 transition-all depth-card-dark">
					<div class="flex justify-between items-start mb-6">
						<div class="w-14 h-14 bg-gold rounded-xl flex items-center justify-center">
							<svg class="w-7 h-7 text-king-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4"/></svg>
						</div>
						<span class="text-gold opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
					</div>
					<h3 class="font-title text-2xl text-white mb-3 group-hover:text-gold transition-colors">Personal Injury</h3>
					<p class="text-white/60">Comprehensive recovery management — from accident documentation through insurance coordination and resolution.</p>
				</a>

				<a href="/services/criminal-defense" class="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/50 rounded-2xl p-5 md:p-8 transition-all depth-card-dark">
					<div class="flex justify-between items-start mb-6">
						<div class="w-14 h-14 bg-gold rounded-xl flex items-center justify-center">
							<svg class="w-7 h-7 text-king-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
						</div>
						<span class="text-gold opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
					</div>
					<h3 class="font-title text-2xl text-white mb-3 group-hover:text-gold transition-colors">Criminal Defense</h3>
					<p class="text-white/60">Discreet, decisive resolution — protecting your career, clearance, and reputation at every stage.</p>
				</a>

				<a href="/services/executive-counsel" class="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/50 rounded-2xl p-5 md:p-8 transition-all depth-card-dark">
					<div class="flex justify-between items-start mb-6">
						<div class="w-14 h-14 bg-gold rounded-xl flex items-center justify-center">
							<svg class="w-7 h-7 text-king-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
						</div>
						<span class="text-gold opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
					</div>
					<h3 class="font-title text-2xl text-white mb-3 group-hover:text-gold transition-colors">Executive & Employment Counsel</h3>
					<p class="text-white/60">Severance, equity compensation, non-competes, and workplace disputes — structured for professionals with complex careers.</p>
				</a>

				<a href="/services/business-investment" class="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/50 rounded-2xl p-5 md:p-8 transition-all depth-card-dark">
					<div class="flex justify-between items-start mb-6">
						<div class="w-14 h-14 bg-gold rounded-xl flex items-center justify-center">
							<svg class="w-7 h-7 text-king-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
						</div>
						<span class="text-gold opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
					</div>
					<h3 class="font-title text-2xl text-white mb-3 group-hover:text-gold transition-colors">Business & Investment</h3>
					<p class="text-white/60">Entity formation, real estate transactions, LLC structuring, and commercial disputes — coordinated across your portfolio.</p>
				</a>

				<a href="/services/civil-rights" class="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/50 rounded-2xl p-5 md:p-8 transition-all depth-card-dark">
					<div class="flex justify-between items-start mb-6">
						<div class="w-14 h-14 bg-gold rounded-xl flex items-center justify-center">
							<svg class="w-7 h-7 text-king-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>
						</div>
						<span class="text-gold opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
					</div>
					<h3 class="font-title text-2xl text-white mb-3 group-hover:text-gold transition-colors">Civil Rights</h3>
					<p class="text-white/60">Measured accountability for government overreach, misconduct, and constitutional violations — with privacy-focused resolution.</p>
				</a>

				<a href="/services/cannabis-law" class="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/50 rounded-2xl p-5 md:p-8 transition-all depth-card-dark">
					<div class="flex justify-between items-start mb-6">
						<div class="w-14 h-14 bg-gold rounded-xl flex items-center justify-center">
							<svg class="w-7 h-7 text-king-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
						</div>
						<span class="text-gold opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
					</div>
					<h3 class="font-title text-2xl text-white mb-3 group-hover:text-gold transition-colors">Cannabis Law</h3>
					<p class="text-white/60">Regulatory compliance, licensing, business formation, and risk containment for operators and qualified patients.</p>
				</a>

				<a href="/services/appellate-strategy" class="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/50 rounded-2xl p-5 md:p-8 transition-all depth-card-dark">
					<div class="flex justify-between items-start mb-6">
						<div class="w-14 h-14 bg-gold rounded-xl flex items-center justify-center">
							<svg class="w-7 h-7 text-king-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
						</div>
						<span class="text-gold opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
					</div>
					<h3 class="font-title text-2xl text-white mb-3 group-hover:text-gold transition-colors">Appellate Strategy</h3>
					<p class="text-white/60">Strategic course-correction when trial outcomes need to be preserved, challenged, or refined on appeal.</p>
				</a>

				<a href="/services/property-claims" class="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/50 rounded-2xl p-5 md:p-8 transition-all depth-card-dark">
					<div class="flex justify-between items-start mb-6">
						<div class="w-14 h-14 bg-gold rounded-xl flex items-center justify-center">
							<svg class="w-7 h-7 text-king-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
						</div>
						<span class="text-gold opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
					</div>
					<h3 class="font-title text-2xl text-white mb-3 group-hover:text-gold transition-colors">Property & Insurance Claims</h3>
					<p class="text-white/60">Portfolio-level insurance coordination for storm damage, fire, flood, and bad-faith claim disputes across your properties.</p>
				</a>
			</div>
		</div>
	</section>

	<!-- Schedule a Consultation Section -->
	<section class="py-24 bg-background">
		<div class="max-w-6xl mx-auto px-6 lg:px-8">
			<div class="text-center mb-12">
				<p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">Get Started</p>
				<h2 class="font-title text-4xl text-king-blue dark:text-white mb-6">Schedule a Free Consultation</h2>
				<p class="text-gray-800 dark:text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
					Take the first step toward resolving your legal matter. Pick a time that works for you and book directly into our calendar.
				</p>
				<div class="flex flex-wrap gap-6 justify-center mt-8">
					<div class="flex items-center gap-2">
						<span class="text-gold text-lg">✓</span>
						<span class="text-gray-800 dark:text-white/70 text-sm">No obligation</span>
					</div>
					<div class="flex items-center gap-2">
						<span class="text-gold text-lg">✓</span>
						<span class="text-gray-800 dark:text-white/70 text-sm">100% confidential</span>
					</div>
					<div class="flex items-center gap-2">
						<span class="text-gold text-lg">✓</span>
						<span class="text-gray-800 dark:text-white/70 text-sm">Instant confirmation</span>
					</div>
				</div>
			</div>
			<div class="max-w-4xl mx-auto">
				<ScheduleWidget variant="light" />
			</div>
		</div>
	</section>

	<!-- Quote + CTA Section -->
	<section class="py-12 md:py-24 bg-muted">
		<div class="max-w-4xl mx-auto px-6 lg:px-8 text-center">
			<span class="text-gold text-6xl font-title">"</span>
			<blockquote class="font-title text-3xl md:text-4xl text-king-blue dark:text-white leading-relaxed mb-6">
				Your legal life shouldn't be fragmented across five different firms. One strategy. One call. That's how it should work.
			</blockquote>
			<p class="text-gray-400 dark:text-white/50 mb-16">— Ben King, Founder</p>

			<div class="border-t border-gray-200 dark:border-white/10 pt-16">
				<h2 class="font-title text-4xl text-king-blue dark:text-white mb-6">Start With a Conversation</h2>
				<p class="text-gray-500 dark:text-white/60 text-lg mb-10 max-w-2xl mx-auto">
					Tell us what's on your plate. We'll outline how a coordinated approach can simplify your legal landscape.
				</p>
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<a href="/schedule" class="w-full sm:w-auto bg-gold hover:bg-gold-light text-king-blue px-6 sm:px-10 py-4 rounded-lg font-bold transition-all transform hover:scale-105 depth-gold text-base md:text-lg text-center">
						Schedule Free In-Person Consultation
					</a>
					<a href="tel:6893536943" class="border-2 border-king-blue/30 dark:border-white/30 hover:border-gold text-king-blue dark:text-white px-6 sm:px-8 py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 depth-card">
						<svg class="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
						(689) 353-6943
					</a>
				</div>
			</div>
		</div>
	</section>
</div>
