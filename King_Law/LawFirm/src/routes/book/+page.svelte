<script lang="ts">
	import { faCalendarCheck, faSpinner, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
	import Icon from '$lib/components/Icon.svelte';

	let { data } = $props();

	const serviceTypes = [
		'Personal Injury & Civil Suits',
		'Business & Intellectual Property',
		'Family & Estate Law',
		'Criminal Defense',
		'General Consultation'
	];

	let formData = $state({
		name: '',
		email: '',
		phone: '',
		serviceType: '',
		preferredDate: '',
		preferredTime: '',
		notes: ''
	});

	let formSubmitting = $state(false);
	let bookingSuccess = $state(false);
	let bookingError = $state('');
	let availableSlots = $state<{ start: string; end: string; available: boolean }[]>([]);
	let loadingSlots = $state(false);

	// Minimum date is tomorrow
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const minDate = tomorrow.toISOString().split('T')[0];

	// Max date is 60 days out
	const maxDateObj = new Date();
	maxDateObj.setDate(maxDateObj.getDate() + 60);
	const maxDate = maxDateObj.toISOString().split('T')[0];

	async function fetchAvailability() {
		if (!formData.preferredDate) return;

		loadingSlots = true;
		formData.preferredTime = '';

		try {
			const res = await fetch(`/api/book/availability?date=${formData.preferredDate}`);
			const result = await res.json();

			if (result.success) {
				availableSlots = result.slots.filter((s: { available: boolean }) => s.available);
			} else {
				availableSlots = [];
				bookingError = result.error ?? 'Failed to load availability.';
			}
		} catch {
			availableSlots = [];
			bookingError = 'Failed to load availability. Please try again.';
		} finally {
			loadingSlots = false;
		}
	}

	function formatTime(isoString: string): string {
		const date = new Date(isoString);
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function extractTime(isoString: string): string {
		const date = new Date(isoString);
		return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		formSubmitting = true;
		bookingError = '';

		try {
			// Get reCAPTCHA token if available
			let recaptchaToken = '';
			if (data.recaptchaSiteKey && typeof window !== 'undefined' && (window as any).grecaptcha) {
				try {
					recaptchaToken = await (window as any).grecaptcha.execute(data.recaptchaSiteKey, {
						action: 'book_consultation'
					});
				} catch {
					console.warn('reCAPTCHA execution failed');
				}
			}

			const res = await fetch('/api/book', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					recaptchaToken
				})
			});

			const result = await res.json();

			if (result.success) {
				bookingSuccess = true;
			} else {
				bookingError = result.error ?? 'Booking failed. Please try again.';
			}
		} catch {
			bookingError = 'An unexpected error occurred. Please try again.';
		} finally {
			formSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Book a Consultation - King Law Firm</title>
	{#if data.recaptchaSiteKey}
		<script src="https://www.google.com/recaptcha/api.js?render={data.recaptchaSiteKey}"></script>
	{/if}
</svelte:head>

<!-- Hero -->
<section class="bg-gradient-to-br from-background via-secondary to-background py-16">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center">
			<h1 class="font-title text-5xl font-bold mb-4">Book a Consultation</h1>
			<p class="text-xl text-muted-foreground max-w-2xl mx-auto">
				Schedule a meeting with our legal team. Select a service, pick a date and time, and
				we'll confirm your appointment.
			</p>
		</div>
	</div>
</section>

<section class="py-16 bg-background">
	<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
		{#if bookingSuccess}
			<!-- Success State -->
			<div class="text-center py-12">
				<div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 mb-6">
					<Icon icon={faCheckCircle} size="2xl" class="text-green-600 dark:text-green-400" />
				</div>
				<h2 class="font-title text-3xl font-bold mb-4">Consultation Booked!</h2>
				<p class="text-lg text-muted-foreground mb-2">
					Your consultation has been scheduled for
					<span class="font-semibold text-foreground">
						{new Date(formData.preferredDate).toLocaleDateString('en-US', {
							weekday: 'long',
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</span>
				</p>
				<p class="text-muted-foreground mb-8">
					A confirmation will be sent to <span class="font-semibold">{formData.email}</span>.
				</p>
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<a
						href="/book"
						onclick={() => {
							bookingSuccess = false;
							formData = {
								name: '',
								email: '',
								phone: '',
								serviceType: '',
								preferredDate: '',
								preferredTime: '',
								notes: ''
							};
						}}
						class="px-8 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold-dark transition-colors"
					>
						Book Another
					</a>
					<a
						href="/"
						class="px-8 py-3 bg-secondary text-foreground font-semibold rounded-lg hover:bg-muted transition-colors"
					>
						Return Home
					</a>
				</div>
			</div>
		{:else}
			<!-- Booking Form -->
			<form onsubmit={handleSubmit} class="space-y-8">
				{#if bookingError}
					<div
						class="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
					>
						<Icon icon={faExclamationTriangle} class="text-red-600 dark:text-red-400 mt-0.5" />
						<p class="text-red-700 dark:text-red-300">{bookingError}</p>
					</div>
				{/if}

				<!-- Personal Information -->
				<div>
					<h2 class="font-title text-2xl font-bold mb-6 flex items-center gap-3">
						<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gold text-black text-sm font-bold">1</span>
						Your Information
					</h2>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label for="book-name" class="block text-sm font-semibold mb-2">Full Name *</label>
							<input
								type="text"
								id="book-name"
								bind:value={formData.name}
								required
								placeholder="John Smith"
								class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
							/>
						</div>
						<div>
							<label for="book-email" class="block text-sm font-semibold mb-2">Email *</label>
							<input
								type="email"
								id="book-email"
								bind:value={formData.email}
								required
								placeholder="john@example.com"
								class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
							/>
						</div>
						<div>
							<label for="book-phone" class="block text-sm font-semibold mb-2">Phone</label>
							<input
								type="tel"
								id="book-phone"
								bind:value={formData.phone}
								placeholder="(555) 123-4567"
								class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
							/>
						</div>
						<div>
							<label for="book-service" class="block text-sm font-semibold mb-2"
								>Service Type *</label
							>
							<select
								id="book-service"
								bind:value={formData.serviceType}
								required
								class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
							>
								<option value="" disabled>Select a service...</option>
								{#each serviceTypes as service}
									<option value={service}>{service}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>

				<!-- Date & Time -->
				<div>
					<h2 class="font-title text-2xl font-bold mb-6 flex items-center gap-3">
						<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gold text-black text-sm font-bold">2</span>
						Select Date & Time
					</h2>

					<div class="space-y-6">
						<div>
							<label for="book-date" class="block text-sm font-semibold mb-2"
								>Preferred Date *</label
							>
							<input
								type="date"
								id="book-date"
								bind:value={formData.preferredDate}
								min={minDate}
								max={maxDate}
								required
								onchange={fetchAvailability}
								class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
							/>
						</div>

						{#if loadingSlots}
							<div class="flex items-center gap-2 text-muted-foreground">
								<Icon icon={faSpinner} class="animate-spin" />
								<span>Loading available times...</span>
							</div>
						{:else if formData.preferredDate && availableSlots.length > 0}
							<div>
								<label for="available-times" class="block text-sm font-semibold mb-3">Available Times *</label>
								<div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
									{#each availableSlots as slot}
										<button
											type="button"
											onclick={() => (formData.preferredTime = extractTime(slot.start))}
											class="px-4 py-3 rounded-lg border text-center transition-all {formData.preferredTime ===
											extractTime(slot.start)
												? 'bg-gold text-black border-gold font-semibold'
												: 'bg-secondary border-gray-300 dark:border-gray-700 hover:border-gold'}"
										>
											{formatTime(slot.start)}
										</button>
									{/each}
								</div>
							</div>
						{:else if formData.preferredDate && !loadingSlots}
							<p class="text-muted-foreground">
								No available times for this date. Please select a different date.
							</p>
						{/if}
					</div>
				</div>

				<!-- Notes -->
				<div>
					<h2 class="font-title text-2xl font-bold mb-6 flex items-center gap-3">
						<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gold text-black text-sm font-bold">3</span>
						Additional Details
					</h2>
					<div>
						<label for="book-notes" class="block text-sm font-semibold mb-2"
							>Notes (optional)</label
						>
						<textarea
							id="book-notes"
							bind:value={formData.notes}
							rows="4"
							placeholder="Briefly describe your legal matter or any questions you have..."
							class="w-full px-4 py-3 bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
						></textarea>
					</div>
				</div>

				<!-- Submit -->
				<div class="pt-4">
					<button
						type="submit"
						disabled={formSubmitting || !formData.preferredTime}
						class="w-full px-8 py-4 bg-gold text-black font-semibold text-lg rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
					>
						{#if formSubmitting}
							<Icon icon={faSpinner} class="animate-spin" />
							Booking...
						{:else}
							<Icon icon={faCalendarCheck} />
							Book Consultation
						{/if}
					</button>
					<p class="text-xs text-muted-foreground text-center mt-3">
						By booking, you agree to our consultation terms. Consultations are 1 hour.
					</p>
				</div>
			</form>
		{/if}
	</div>
</section>
