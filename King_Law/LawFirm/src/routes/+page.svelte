<script lang="ts">
	let formStatus = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let errorMessage = $state('');
	let touched = $state<Record<string, boolean>>({});
	let fieldErrors = $state<Record<string, string>>({});

	function validateField(name: string, value: string) {
		if (name === 'firstName' || name === 'lastName') {
			if (!value.trim()) {
				fieldErrors[name] = 'Required';
				return;
			}
		}
		if (name === 'email') {
			if (!value.trim()) {
				fieldErrors[name] = 'Required';
				return;
			}
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
				fieldErrors[name] = 'Enter a valid email';
				return;
			}
		}
		delete fieldErrors[name];
	}

	function handleBlur(e: FocusEvent) {
		const input = e.target as HTMLInputElement | HTMLTextAreaElement;
		touched[input.name] = true;
		validateField(input.name, input.value);
	}

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
			<p class="text-gold uppercase tracking-[0.3em] text-sm mb-6">King Law, P.L.L.C.</p>
			<h1 class="font-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.1] mb-6">
				Turning Legal Chaos into<br/>
				<span class="text-gold">Clear Direction</span>
			</h1>
			<p class="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed">
				When legal matters pull at every corner of your life and business, we bring them together with clarity and care.
			</p>

			<div class="grid sm:grid-cols-3 gap-6 md:gap-8 max-w-3xl mx-auto mb-12 text-left">
				<div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
					<div class="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center mb-4">
						<span class="text-gold text-lg font-bold">1</span>
					</div>
					<h3 class="text-white font-semibold mb-2">One Coordinated Strategy</h3>
					<p class="text-white/50 text-sm leading-relaxed">Legal matters handled under one roof, so nothing slips through the cracks.</p>
				</div>
				<div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
					<div class="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center mb-4">
						<span class="text-gold text-lg font-bold">2</span>
					</div>
					<h3 class="text-white font-semibold mb-2">Clear Direction</h3>
					<p class="text-white/50 text-sm leading-relaxed">Straight answers and a defined plan, so you can move forward with confidence.</p>
				</div>
				<div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
					<div class="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center mb-4">
						<span class="text-gold text-lg font-bold">3</span>
					</div>
					<h3 class="text-white font-semibold mb-2">Personal Commitment</h3>
					<p class="text-white/50 text-sm leading-relaxed">Responsive, hands-on guidance that protects your time, reputation, and assets.</p>
				</div>
			</div>

			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a href="/schedule" class="w-full sm:w-auto bg-gold hover:bg-gold-light text-king-blue px-10 py-4 rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-gold/30 text-lg text-center">
					Schedule Free In-Person Consultation
				</a>
				<a href="tel:6893536943" class="border-2 border-white/30 hover:border-gold text-white px-8 py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
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

	<!-- Values Section - Elegant Numbered List -->
	<section class="py-24 bg-white">
		<div class="max-w-5xl mx-auto px-6 lg:px-8">
			<p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">Why Choose Us</p>
			<h2 class="font-title text-4xl text-king-blue mb-16">The Principles That Guide Us</h2>
			
			<div class="space-y-0">
				<div class="grid md:grid-cols-12 gap-8 items-start border-l-4 border-l-gold border-t border-t-gray-200 py-10 pl-6">
					<div class="md:col-span-1">
						<span class="text-gold font-bold">01</span>
					</div>
					<div class="md:col-span-4">
						<h3 class="font-title text-2xl text-king-blue">Dedication</h3>
					</div>
					<div class="md:col-span-7">
						<p class="text-gray-500 text-lg leading-relaxed">Unwavering commitment to your success. Available 24/7 with direct attorney access—you're never just a case number.</p>
					</div>
				</div>

				<div class="grid md:grid-cols-12 gap-8 items-start border-l-4 border-l-gold/40 border-t border-t-gray-200 py-10 pl-6">
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

				<div class="grid md:grid-cols-12 gap-8 items-start border-l-4 border-l-gold border-t border-t-gray-200 py-10 pl-6">
					<div class="md:col-span-1">
						<span class="text-gold font-bold">03</span>
					</div>
					<div class="md:col-span-4">
						<h3 class="font-title text-2xl text-king-blue">Integrity</h3>
					</div>
					<div class="md:col-span-7">
						<p class="text-gray-500 text-lg leading-relaxed">We uphold the highest ethical standards in all our dealings, ensuring transparency and honesty with every client.</p>
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
						<div class="w-14 h-14 bg-gold rounded-xl flex items-center justify-center">
							<svg class="w-7 h-7 text-king-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4"/></svg>
						</div>
						<span class="text-gold opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
					</div>
					<h3 class="font-title text-2xl text-white mb-3 group-hover:text-gold transition-colors">Personal Injury</h3>
					<p class="text-white/60">Car accidents, slip & fall, medical malpractice, and wrongful death claims.</p>
				</a>

				<a href="/services/criminal-defense" class="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/50 rounded-2xl p-8 transition-all">
					<div class="flex justify-between items-start mb-6">
						<div class="w-14 h-14 bg-gold rounded-xl flex items-center justify-center">
							<svg class="w-7 h-7 text-king-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
						</div>
						<span class="text-gold opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
					</div>
					<h3 class="font-title text-2xl text-white mb-3 group-hover:text-gold transition-colors">Criminal Defense</h3>
					<p class="text-white/60">DUI, misdemeanors, felonies, expungement, and appeals.</p>
				</a>

				<a href="/services/employment-law" class="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/50 rounded-2xl p-8 transition-all">
					<div class="flex justify-between items-start mb-6">
						<div class="w-14 h-14 bg-gold rounded-xl flex items-center justify-center">
							<svg class="w-7 h-7 text-king-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
						</div>
						<span class="text-gold opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
					</div>
					<h3 class="font-title text-2xl text-white mb-3 group-hover:text-gold transition-colors">Employment Law</h3>
					<p class="text-white/60">Workplace discrimination, wrongful termination, wage disputes, and harassment claims.</p>
				</a>

				<a href="/services/real-estate-business" class="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/50 rounded-2xl p-8 transition-all">
					<div class="flex justify-between items-start mb-6">
						<div class="w-14 h-14 bg-gold rounded-xl flex items-center justify-center">
							<svg class="w-7 h-7 text-king-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
						</div>
						<span class="text-gold opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
					</div>
					<h3 class="font-title text-2xl text-white mb-3 group-hover:text-gold transition-colors">Real Estate & Business</h3>
					<p class="text-white/60">Contracts, transactions, business formation, commercial disputes, and property matters.</p>
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
									onblur={handleBlur}
									class="w-full px-4 py-3 rounded-lg border text-gray-900 bg-white transition-all {touched['firstName'] && fieldErrors['firstName'] ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100' : touched['firstName'] && !fieldErrors['firstName'] ? 'border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-100' : 'border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20'}"
									placeholder="John"
								/>
								{#if touched['firstName'] && fieldErrors['firstName']}
									<p class="text-red-500 text-xs mt-1">{fieldErrors['firstName']}</p>
								{/if}
							</div>
							<div>
								<label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
								<input 
									type="text" 
									id="lastName" 
									name="lastName" 
									required
									onblur={handleBlur}
									class="w-full px-4 py-3 rounded-lg border text-gray-900 bg-white transition-all {touched['lastName'] && fieldErrors['lastName'] ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100' : touched['lastName'] && !fieldErrors['lastName'] ? 'border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-100' : 'border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20'}"
									placeholder="Doe"
								/>
								{#if touched['lastName'] && fieldErrors['lastName']}
									<p class="text-red-500 text-xs mt-1">{fieldErrors['lastName']}</p>
								{/if}
							</div>
						</div>
						<div>
							<label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
							<input 
								type="email" 
								id="email" 
								name="email" 
								required
								onblur={handleBlur}
								class="w-full px-4 py-3 rounded-lg border text-gray-900 bg-white transition-all {touched['email'] && fieldErrors['email'] ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100' : touched['email'] && !fieldErrors['email'] ? 'border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-100' : 'border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20'}"
								placeholder="john@example.com"
							/>
							{#if touched['email'] && fieldErrors['email']}
								<p class="text-red-500 text-xs mt-1">{fieldErrors['email']}</p>
							{/if}
						</div>
						<div>
							<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone <span class="text-gray-400 font-normal">(optional)</span></label>
							<input 
								type="tel" 
								id="phone" 
								name="phone" 
								class="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 bg-white focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
								placeholder="(689) 353-6943"
							/>
						</div>
						<div>
							<label for="message" class="block text-sm font-medium text-gray-700 mb-1">How Can We Help? <span class="text-gray-400 font-normal">(optional)</span></label>
							<textarea 
								id="message" 
								name="message" 
								rows="4"
								class="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 bg-white focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all resize-none"
								placeholder="Briefly describe your legal matter..."
							></textarea>
						</div>
						<button 
							type="submit"
							disabled={formStatus === 'submitting'}
							class="w-full bg-gold hover:bg-gold-light text-king-blue py-4 rounded-lg font-bold transition-all hover:shadow-lg hover:shadow-gold/20 disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{formStatus === 'submitting' ? 'Submitting...' : 'Request Consultation'}
						</button>
						{#if formStatus === 'error' && errorMessage}
							<p class="text-red-500 text-sm text-center">{errorMessage}</p>
						{/if}
						<p class="text-xs text-gray-400 text-center">
							By submitting, you agree to our privacy policy. Your information is confidential.
						</p>
					</form>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- Quote + CTA Section -->
	<section class="py-24 bg-gray-50">
		<div class="max-w-4xl mx-auto px-6 lg:px-8 text-center">
			<span class="text-gold text-6xl font-title">"</span>
			<blockquote class="font-title text-3xl md:text-4xl text-king-blue leading-relaxed mb-6">
				The law is not merely a profession, but a calling to serve those who need guidance through life's most challenging moments.
			</blockquote>
			<p class="text-gray-400 mb-16">— Ben King, Founder</p>

			<div class="border-t border-gray-200 pt-16">
				<h2 class="font-title text-4xl text-king-blue mb-6">Let's Discuss Your Needs</h2>
				<p class="text-gray-500 text-lg mb-10 max-w-2xl mx-auto">
					Every great outcome begins with a conversation. Reach out to schedule your confidential consultation.
				</p>
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<a href="/schedule" class="w-full sm:w-auto bg-gold hover:bg-gold-light text-king-blue px-10 py-4 rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-gold/30 text-lg text-center">
						Schedule Free In-Person Consultation
					</a>
					<a href="tel:6893536943" class="border-2 border-king-blue/30 hover:border-gold text-king-blue px-8 py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
						<svg class="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
						(689) 353-6943
					</a>
				</div>
			</div>
		</div>
	</section>
</div>
