<script lang="ts">
	let formStatus = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let errorMessage = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		formStatus = 'submitting';
		errorMessage = '';

		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);
		const data = {
			firstName: formData.get('firstName'),
			lastName: formData.get('lastName'),
			email: formData.get('email'),
			phone: formData.get('phone'),
			message: formData.get('message')
		};

		try {
			const response = await fetch('/api/consultations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});

			if (response.ok) {
				formStatus = 'success';
				form.reset();
			} else {
				const result = await response.json();
				errorMessage = result.error || 'Something went wrong. Please try again.';
				formStatus = 'error';
			}
		} catch (err) {
			errorMessage = 'Failed to submit. Please try again.';
			formStatus = 'error';
		}
	}
</script>

<div class="min-h-screen pt-20">
	<!-- Hero Section - Elegant with Bold Colors -->
	<section class="min-h-[90vh] flex items-center relative overflow-hidden">
		<!-- Background Image -->
		<div class="absolute inset-0">
			<img 
				src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/JusticeHomeHeader.jpeg" 
				alt="Justice" 
				class="w-full h-full object-cover"
			/>
			<div class="absolute inset-0 bg-king-blue/80"></div>
		</div>
		<div class="absolute inset-0 opacity-5">
			<div class="absolute top-20 right-20 w-96 h-96 border border-gold rounded-full"></div>
			<div class="absolute bottom-20 left-20 w-64 h-64 border border-gold rounded-full"></div>
		</div>

		<div class="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 grid lg:grid-cols-12 gap-16 items-center">
			<div class="lg:col-span-7">
				<p class="text-gold uppercase tracking-[0.3em] text-sm mb-6">Attorneys at Law</p>
				<h1 class="font-title text-5xl md:text-7xl text-white leading-[1.1] mb-8">
					Thoughtful Legal<br/>
					<span class="text-gold">Counsel</span>
				</h1>
				<p class="text-xl text-white/70 max-w-lg mb-10 leading-relaxed">
					Where legal expertise meets genuine care. We guide you through complexity with clarity, purpose, and unwavering dedication.
				</p>
				<div class="flex flex-wrap gap-4">
					<a href="/contact" class="bg-gold hover:bg-gold-light text-king-blue px-8 py-4 rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg">
						Free Consultation →
					</a>
					<a href="tel:6893536943" class="border-2 border-white/30 hover:border-gold text-white px-8 py-4 rounded-lg font-semibold transition-all flex items-center gap-2">
						<span class="text-gold">📞</span> (689) 353-6943
					</a>
				</div>
			</div>

			<div class="lg:col-span-5 hidden lg:block">
				<div class="aspect-[4/5] bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 flex flex-col justify-between">
					<div>
						<img src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/King+Law+Official+Logo++No+BKG.png" alt="King Law" class="h-16 w-auto mb-4" />
						<p class="text-white/40 text-sm tracking-widest uppercase">Our Promise</p>
					</div>
					<div class="space-y-4">
						<div class="flex items-start gap-3 py-3 border-t border-white/10">
							<span class="text-gold text-xl">⚖️</span>
							<div>
								<span class="text-white font-semibold block">Unwavering Commitment</span>
								<span class="text-white/50 text-sm">We stand by you from start to finish</span>
							</div>
						</div>
						<div class="flex items-start gap-3 py-3 border-t border-white/10">
							<span class="text-gold text-xl">🤝</span>
							<div>
								<span class="text-white font-semibold block">Respect for Every Client</span>
								<span class="text-white/50 text-sm">You're never just a case number</span>
							</div>
						</div>
						<div class="flex items-start gap-3 py-3 border-t border-white/10">
							<span class="text-gold text-xl">💪</span>
							<div>
								<span class="text-white font-semibold block">Fighting for the Underdog</span>
								<span class="text-white/50 text-sm">Big firm results, personal attention</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Values Section - Elegant Numbered List -->
	<section class="py-24 bg-white">
		<div class="max-w-5xl mx-auto px-6 lg:px-8">
			<p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">Why Choose Us</p>
			<h2 class="font-title text-4xl text-king-blue mb-16">The Principles That Guide Us</h2>
			
			<div class="space-y-0">
				<div class="grid md:grid-cols-12 gap-8 items-start border-t border-gray-200 py-10">
					<div class="md:col-span-1">
						<span class="text-gold font-bold">01</span>
					</div>
					<div class="md:col-span-4">
						<h3 class="font-title text-2xl text-king-blue">Integrity</h3>
					</div>
					<div class="md:col-span-7">
						<p class="text-gray-500 text-lg leading-relaxed">We uphold the highest ethical standards in all our dealings, ensuring transparency and honesty with every client.</p>
					</div>
				</div>

				<div class="grid md:grid-cols-12 gap-8 items-start border-t border-gray-200 py-10">
					<div class="md:col-span-1">
						<span class="text-gold font-bold">02</span>
					</div>
					<div class="md:col-span-4">
						<h3 class="font-title text-2xl text-king-blue">Excellence</h3>
					</div>
					<div class="md:col-span-7">
						<p class="text-gray-500 text-lg leading-relaxed">Meticulous attention to detail in every case. We strive for the best possible outcomes through rigorous preparation.</p>
					</div>
				</div>

				<div class="grid md:grid-cols-12 gap-8 items-start border-t border-gray-200 py-10">
					<div class="md:col-span-1">
						<span class="text-gold font-bold">03</span>
					</div>
					<div class="md:col-span-4">
						<h3 class="font-title text-2xl text-king-blue">Dedication</h3>
					</div>
					<div class="md:col-span-7">
						<p class="text-gray-500 text-lg leading-relaxed">Unwavering commitment to your success. Available 24/7 with direct attorney access—you're never just a case number.</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Practice Areas - Modern Cards -->
	<section class="py-24 bg-king-blue">
		<div class="max-w-6xl mx-auto px-6 lg:px-8">
			<div class="grid md:grid-cols-2 gap-16 mb-16">
				<div>
					<p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">Practice Areas</p>
					<h2 class="font-title text-4xl text-white">Comprehensive Legal Services</h2>
				</div>
				<div class="flex items-end">
					<p class="text-white/60 leading-relaxed">
						Our attorneys bring decades of combined experience across diverse practice areas, providing sophisticated representation tailored to your unique circumstances.
					</p>
				</div>
			</div>

			<div class="grid md:grid-cols-2 gap-6">
				<a href="/services/personal-injury" class="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/50 rounded-2xl p-8 transition-all">
					<div class="flex justify-between items-start mb-6">
						<div class="w-14 h-14 bg-gold rounded-xl flex items-center justify-center text-2xl">⚔️</div>
						<span class="text-gold opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
					</div>
					<h3 class="font-title text-2xl text-white mb-3 group-hover:text-gold transition-colors">Personal Injury & Civil Suits</h3>
					<p class="text-white/60">Car accidents, slip & fall, medical malpractice, and wrongful death claims.</p>
				</a>

				<a href="/services/business-intellectual-property" class="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/50 rounded-2xl p-8 transition-all">
					<div class="flex justify-between items-start mb-6">
						<div class="w-14 h-14 bg-gold rounded-xl flex items-center justify-center text-2xl">🏢</div>
						<span class="text-gold opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
					</div>
					<h3 class="font-title text-2xl text-white mb-3 group-hover:text-gold transition-colors">Business & Intellectual Property</h3>
					<p class="text-white/60">Contracts, trademarks, patents, business formation, and disputes.</p>
				</a>

				<a href="/services/family-estate-law" class="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/50 rounded-2xl p-8 transition-all">
					<div class="flex justify-between items-start mb-6">
						<div class="w-14 h-14 bg-gold rounded-xl flex items-center justify-center text-2xl">👨‍👩‍👧‍👦</div>
						<span class="text-gold opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
					</div>
					<h3 class="font-title text-2xl text-white mb-3 group-hover:text-gold transition-colors">Family & Estate Law</h3>
					<p class="text-white/60">Divorce, custody, wills, trusts, probate, and estate planning.</p>
				</a>

				<a href="/services/criminal-defense" class="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/50 rounded-2xl p-8 transition-all">
					<div class="flex justify-between items-start mb-6">
						<div class="w-14 h-14 bg-gold rounded-xl flex items-center justify-center text-2xl">🛡️</div>
						<span class="text-gold opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
					</div>
					<h3 class="font-title text-2xl text-white mb-3 group-hover:text-gold transition-colors">Criminal Defense</h3>
					<p class="text-white/60">DUI, misdemeanors, felonies, expungement, and appeals.</p>
				</a>
			</div>
		</div>
	</section>

	<!-- Consultation Form Section -->
	<section class="py-24 bg-white">
		<div class="max-w-6xl mx-auto px-6 lg:px-8">
			<div class="grid lg:grid-cols-2 gap-16 items-center">
				<div>
					<p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">Get Started</p>
					<h2 class="font-title text-4xl text-king-blue mb-6">Request a Free Consultation</h2>
					<p class="text-gray-500 text-lg mb-8 leading-relaxed">
						Take the first step toward resolving your legal matter. Fill out the form and we'll be in touch within 24 hours to discuss your case.
					</p>
					<div class="space-y-4">
						<div class="flex items-center gap-3">
							<span class="text-gold text-xl">✓</span>
							<span class="text-gray-600">No obligation consultation</span>
						</div>
						<div class="flex items-center gap-3">
							<span class="text-gold text-xl">✓</span>
							<span class="text-gray-600">Confidential discussion</span>
						</div>
						<div class="flex items-center gap-3">
							<span class="text-gold text-xl">✓</span>
							<span class="text-gray-600">Response within 24 hours</span>
						</div>
					</div>
				</div>

				<div class="bg-gray-50 rounded-2xl p-8 border border-gray-100">
					{#if formStatus === 'success'}
						<div class="text-center py-8">
							<div class="text-green-500 text-5xl mb-4">✓</div>
							<h3 class="font-title text-2xl text-king-blue mb-2">Thank You!</h3>
							<p class="text-gray-500">We've received your request and will be in touch within 24 hours.</p>
							<button 
								type="button"
								onclick={() => formStatus = 'idle'}
								class="mt-6 text-gold hover:text-gold-dark font-medium"
							>
								Submit Another Request
							</button>
						</div>
					{:else}
					<form id="consultation-form" class="space-y-5" onsubmit={handleSubmit}>
						<div class="grid sm:grid-cols-2 gap-4">
							<div>
								<label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
								<input 
									type="text" 
									id="firstName" 
									name="firstName" 
									required
									class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
									placeholder="John"
								/>
							</div>
							<div>
								<label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
								<input 
									type="text" 
									id="lastName" 
									name="lastName" 
									required
									class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
									placeholder="Doe"
								/>
							</div>
						</div>
						<div>
							<label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
							<input 
								type="email" 
								id="email" 
								name="email" 
								required
								class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
								placeholder="john@example.com"
							/>
						</div>
						<div>
							<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
							<input 
								type="tel" 
								id="phone" 
								name="phone" 
								class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
								placeholder="(689) 353-6943"
							/>
						</div>
						<div>
							<label for="message" class="block text-sm font-medium text-gray-700 mb-1">How Can We Help?</label>
							<textarea 
								id="message" 
								name="message" 
								rows="4"
								required
								class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all resize-none"
								placeholder="Briefly describe your legal matter..."
							></textarea>
						</div>
						<button 
							type="submit"
							class="w-full bg-king-blue hover:bg-king-blue-light text-white py-4 rounded-lg font-semibold transition-all hover:shadow-lg"
						>
							Request Consultation
						</button>
						<p class="text-xs text-gray-400 text-center">
							By submitting, you agree to our privacy policy. Your information is confidential.
						</p>
					</form>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- Quote Section -->
	<section class="py-24 bg-gray-50">
		<div class="max-w-4xl mx-auto px-6 lg:px-8 text-center">
			<span class="text-gold text-6xl font-title">"</span>
			<blockquote class="font-title text-3xl md:text-4xl text-king-blue leading-relaxed mb-8">
				The law is not merely a profession, but a calling to serve those who need guidance through life's most challenging moments.
			</blockquote>
			<p class="text-gray-400">— Ben King, Founder</p>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="py-24 bg-gray-50">
		<div class="max-w-3xl mx-auto px-6 lg:px-8 text-center">
			<p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">Begin Your Journey</p>
			<h2 class="font-title text-4xl text-king-blue mb-6">Let's Discuss Your Needs</h2>
			<p class="text-gray-500 text-lg mb-10">
				Every great outcome begins with a conversation. Reach out to schedule your confidential consultation.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a href="/contact" class="bg-king-blue hover:bg-king-blue-light text-white px-10 py-4 rounded-lg font-semibold transition-all hover:shadow-xl">
					Request Consultation
				</a>
				<a href="/register" class="border-2 border-king-blue text-king-blue hover:bg-king-blue hover:text-white px-10 py-4 rounded-lg font-semibold transition-all">
					Client Portal
				</a>
			</div>
		</div>
	</section>
</div>
