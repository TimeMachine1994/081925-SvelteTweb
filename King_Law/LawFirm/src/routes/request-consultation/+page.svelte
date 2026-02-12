<script lang="ts">
	let formStatus = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let errorMessage = $state('');
	let touched = $state<Record<string, boolean>>({});
	let fieldErrors = $state<Record<string, string>>({});

	const matterTypes = [
		'Personal Injury',
		'Criminal Defense',
		'Employment Law',
		'Real Estate & Business',
		'Civil Rights',
		'Cannabis Law',
		'Appeals',
		'Property Damage',
		'Other'
	];

	const urgencyOptions = [
		{ value: 'immediate', label: 'Immediate' },
		{ value: 'this_week', label: 'This Week' },
		{ value: 'this_month', label: 'This Month' },
		{ value: 'no_rush', label: 'No Rush' }
	];

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

	function getMinDate(): string {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return tomorrow.toISOString().split('T')[0];
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
			matterType: formData.get('matterType'),
			currentlyRepresented: formData.get('currentlyRepresented'),
			message: formData.get('message'),
			urgency: formData.get('urgency'),
			preferredDate: formData.get('preferredDate')
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
				touched = {};
				fieldErrors = {};
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

<svelte:head>
	<title>Request a Consultation | King Law</title>
</svelte:head>

<div class="min-h-screen pt-20">
	<!-- Hero Section -->
	<section class="py-20 bg-king-blue">
		<div class="max-w-4xl mx-auto px-6 lg:px-8 text-center">
			<p class="text-gold uppercase tracking-[0.3em] text-sm mb-6">Free Consultation</p>
			<h1 class="font-title text-4xl sm:text-5xl md:text-6xl text-white leading-[1.1] mb-6">
				Request a Confidential<br/>
				<span class="text-gold">Consultation</span>
			</h1>
			<p class="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
				Request a confidential consultation below. We review each submission personally.
			</p>
		</div>
	</section>

	<!-- Form Section -->
	<section class="py-16 md:py-24 bg-king-blue-dark">
		<div class="max-w-3xl mx-auto px-6 lg:px-8">

			{#if formStatus === 'success'}
				<div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center depth-card-dark">
					<div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
						<svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h2 class="font-title text-3xl text-white mb-4">Thank You!</h2>
					<p class="text-white/60 text-lg mb-2">We've received your consultation request.</p>
					<p class="text-white/40 mb-8">Our team will review your submission and reach out within 24 hours.</p>
					<div class="flex flex-col sm:flex-row gap-4 justify-center">
						<button
							type="button"
							onclick={() => formStatus = 'idle'}
							class="bg-gold hover:bg-gold-light text-king-blue px-8 py-3 rounded-lg font-bold transition-all depth-gold"
						>
							Submit Another Request
						</button>
						<a href="/" class="border border-white/20 hover:border-gold text-white px-8 py-3 rounded-lg font-semibold transition-all text-center">
							Return Home
						</a>
					</div>
				</div>
			{:else}
				<form class="space-y-8" onsubmit={handleSubmit}>
					<!-- Name + Phone Row -->
					<div class="grid sm:grid-cols-2 gap-6">
						<div>
							<label for="firstName" class="block text-sm font-medium text-white/80 mb-2">First Name <span class="text-gold">*</span></label>
							<input
								type="text"
								id="firstName"
								name="firstName"
								required
								onblur={handleBlur}
								class="w-full px-4 py-3.5 rounded-lg bg-white/5 border text-white placeholder-white/30 outline-none transition-all {touched['firstName'] && fieldErrors['firstName'] ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' : touched['firstName'] && !fieldErrors['firstName'] ? 'border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20' : 'border-white/10 focus:border-gold focus:ring-2 focus:ring-gold/20'}"
								placeholder="John"
							/>
							{#if touched['firstName'] && fieldErrors['firstName']}
								<p class="text-red-400 text-xs mt-1">{fieldErrors['firstName']}</p>
							{/if}
						</div>
						<div>
							<label for="lastName" class="block text-sm font-medium text-white/80 mb-2">Last Name <span class="text-gold">*</span></label>
							<input
								type="text"
								id="lastName"
								name="lastName"
								required
								onblur={handleBlur}
								class="w-full px-4 py-3.5 rounded-lg bg-white/5 border text-white placeholder-white/30 outline-none transition-all {touched['lastName'] && fieldErrors['lastName'] ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' : touched['lastName'] && !fieldErrors['lastName'] ? 'border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20' : 'border-white/10 focus:border-gold focus:ring-2 focus:ring-gold/20'}"
								placeholder="Doe"
							/>
							{#if touched['lastName'] && fieldErrors['lastName']}
								<p class="text-red-400 text-xs mt-1">{fieldErrors['lastName']}</p>
							{/if}
						</div>
					</div>

					<!-- Phone + Email Row -->
					<div class="grid sm:grid-cols-2 gap-6">
						<div>
							<label for="phone" class="block text-sm font-medium text-white/80 mb-2">Phone</label>
							<input
								type="tel"
								id="phone"
								name="phone"
								class="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
								placeholder="(689) 353-6943"
							/>
						</div>
						<div>
							<label for="email" class="block text-sm font-medium text-white/80 mb-2">Email <span class="text-gold">*</span></label>
							<input
								type="email"
								id="email"
								name="email"
								required
								onblur={handleBlur}
								class="w-full px-4 py-3.5 rounded-lg bg-white/5 border text-white placeholder-white/30 outline-none transition-all {touched['email'] && fieldErrors['email'] ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' : touched['email'] && !fieldErrors['email'] ? 'border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20' : 'border-white/10 focus:border-gold focus:ring-2 focus:ring-gold/20'}"
								placeholder="john@example.com"
							/>
							{#if touched['email'] && fieldErrors['email']}
								<p class="text-red-400 text-xs mt-1">{fieldErrors['email']}</p>
							{/if}
						</div>
					</div>

					<!-- Matter Type + Currently Represented Row -->
					<div class="grid sm:grid-cols-2 gap-6">
						<div>
							<label for="matterType" class="block text-sm font-medium text-white/80 mb-2">Matter Type</label>
							<select
								id="matterType"
								name="matterType"
								class="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
								style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23F2B022'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 12px center; background-size: 20px;"
							>
								<option value="" class="bg-king-blue-dark text-white/50">Select one</option>
								{#each matterTypes as type}
									<option value={type} class="bg-king-blue-dark text-white">{type}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="currentlyRepresented" class="block text-sm font-medium text-white/80 mb-2">Currently Represented?</label>
							<select
								id="currentlyRepresented"
								name="currentlyRepresented"
								class="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
								style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23F2B022'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 12px center; background-size: 20px;"
							>
								<option value="" class="bg-king-blue-dark text-white/50">Select one</option>
								<option value="no" class="bg-king-blue-dark text-white">No</option>
								<option value="yes" class="bg-king-blue-dark text-white">Yes</option>
								<option value="unsure" class="bg-king-blue-dark text-white">Unsure</option>
							</select>
						</div>
					</div>

					<!-- Brief Description -->
					<div>
						<label for="message" class="block text-sm font-medium text-white/80 mb-2">Brief Description</label>
						<textarea
							id="message"
							name="message"
							rows="5"
							class="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all resize-y"
							placeholder="High-level overview only."
						></textarea>
					</div>

					<!-- Urgency + Preferred Date Row -->
					<div class="grid sm:grid-cols-2 gap-6">
						<div>
							<label for="urgency" class="block text-sm font-medium text-white/80 mb-2">Urgency</label>
							<select
								id="urgency"
								name="urgency"
								class="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
								style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23F2B022'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 12px center; background-size: 20px;"
							>
								{#each urgencyOptions as opt}
									<option value={opt.value} class="bg-king-blue-dark text-white">{opt.label}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="preferredDate" class="block text-sm font-medium text-white/80 mb-2">Preferred Consultation Date</label>
							<input
								type="date"
								id="preferredDate"
								name="preferredDate"
								min={getMinDate()}
								class="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all cursor-pointer [color-scheme:dark]"
							/>
						</div>
					</div>

					<!-- Error Message -->
					{#if formStatus === 'error' && errorMessage}
						<div class="bg-red-500/10 border border-red-400/30 rounded-lg px-4 py-3">
							<p class="text-red-400 text-sm">{errorMessage}</p>
						</div>
					{/if}

					<!-- Submit Button -->
					<button
						type="submit"
						disabled={formStatus === 'submitting'}
						class="w-full sm:w-auto bg-gold hover:bg-gold-light text-king-blue px-10 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 depth-gold disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
					>
						{formStatus === 'submitting' ? 'Submitting...' : 'Request Consultation'}
					</button>

					<p class="text-white/30 text-xs">
						By submitting, you agree to our privacy policy. Your information is confidential and will only be used to evaluate your legal matter.
					</p>
				</form>
			{/if}
		</div>
	</section>

	<!-- Trust Indicators -->
	<section class="py-16 bg-king-blue border-t border-white/5">
		<div class="max-w-4xl mx-auto px-6 lg:px-8">
			<div class="grid sm:grid-cols-3 gap-6 md:gap-8 text-center">
				<div>
					<div class="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center mx-auto mb-4">
						<svg class="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
					</div>
					<h3 class="text-white font-semibold mb-1">100% Confidential</h3>
					<p class="text-white/40 text-sm">Your information is protected by attorney-client privilege.</p>
				</div>
				<div>
					<div class="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center mx-auto mb-4">
						<svg class="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
					</div>
					<h3 class="text-white font-semibold mb-1">24-Hour Response</h3>
					<p class="text-white/40 text-sm">We personally review and respond to every submission.</p>
				</div>
				<div>
					<div class="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center mx-auto mb-4">
						<svg class="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
					</div>
					<h3 class="text-white font-semibold mb-1">No Obligation</h3>
					<p class="text-white/40 text-sm">Free initial consultation with no strings attached.</p>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	select option {
		background-color: #141f2e;
		color: white;
	}
</style>
