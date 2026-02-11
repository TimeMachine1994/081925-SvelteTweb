<script lang="ts">
	interface TimeSlot {
		start: string;
		end: string;
		display: string;
	}

	import { onMount } from 'svelte';

	// State
	let step = $state<'pick' | 'form' | 'success'>('pick');
	let selectedDate = $state('');
	let slots = $state<TimeSlot[]>([]);
	let slotsMessage = $state('');
	let loadingSlots = $state(false);
	let selectedSlot = $state<TimeSlot | null>(null);

	// Auto-select today (or next weekday) and load slots on mount
	onMount(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const day = today.getDay();
		// If weekend, advance to Monday
		if (day === 0) today.setDate(today.getDate() + 1);
		if (day === 6) today.setDate(today.getDate() + 2);
		const dateStr = today.toISOString().split('T')[0];
		fetchSlots(dateStr);
	});

	// Form state
	let formStatus = $state<'idle' | 'submitting' | 'error'>('idle');
	let errorMessage = $state('');
	let touched = $state<Record<string, boolean>>({});
	let fieldErrors = $state<Record<string, string>>({});

	// Success state
	let icsContent = $state('');
	let googleCalendarUrl = $state('');
	let bookedSlot = $state<{ start: string; end: string } | null>(null);

	// Week navigation
	let weekOffset = $state(0);

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

	function getWeekDays(offset: number): { date: string; label: string; dayName: string; isToday: boolean; isPast: boolean; isWeekend: boolean }[] {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const startOfWeek = new Date(today);
		const day = startOfWeek.getDay();
		const diff = day === 0 ? -6 : 1 - day; // Start on Monday
		startOfWeek.setDate(startOfWeek.getDate() + diff + offset * 7);

		const days = [];
		for (let i = 0; i < 5; i++) { // Mon–Fri only
			const d = new Date(startOfWeek);
			d.setDate(d.getDate() + i);
			const dateStr = d.toISOString().split('T')[0];
			days.push({
				date: dateStr,
				label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
				dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
				isToday: d.getTime() === today.getTime(),
				isPast: d < today,
				isWeekend: d.getDay() === 0 || d.getDay() === 6
			});
		}
		return days;
	}

	let weekDays = $derived(getWeekDays(weekOffset));
	let weekLabel = $derived(() => {
		const days = getWeekDays(weekOffset);
		if (days.length === 0) return '';
		const first = new Date(days[0].date);
		const last = new Date(days[days.length - 1].date);
		const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
		if (first.getMonth() === last.getMonth()) {
			return `${first.toLocaleDateString('en-US', { month: 'long' })} ${first.getDate()}–${last.getDate()}, ${first.getFullYear()}`;
		}
		return `${first.toLocaleDateString('en-US', opts)} – ${last.toLocaleDateString('en-US', opts)}, ${last.getFullYear()}`;
	});

	async function fetchSlots(dateStr: string) {
		selectedDate = dateStr;
		selectedSlot = null;
		loadingSlots = true;
		slotsMessage = '';
		slots = [];

		try {
			const res = await fetch(`/api/schedule/availability?date=${dateStr}`);
			const data = await res.json();

			if (!res.ok) {
				slotsMessage = data.error || 'Failed to load availability.';
				return;
			}

			slots = data.slots || [];
			slotsMessage = data.message || '';

			if (slots.length === 0 && !slotsMessage) {
				slotsMessage = 'No available slots for this day.';
			}
		} catch {
			slotsMessage = 'Failed to load availability. Please try again.';
		} finally {
			loadingSlots = false;
		}
	}

	function selectSlot(slot: TimeSlot) {
		selectedSlot = slot;
		step = 'form';
		formStatus = 'idle';
		errorMessage = '';
		touched = {};
		fieldErrors = {};
	}

	function backToPicker() {
		step = 'pick';
		selectedSlot = null;
	}

	function validateField(name: string, value: string) {
		if (name === 'firstName' || name === 'lastName') {
			if (!value.trim()) { fieldErrors[name] = 'Required'; return; }
		}
		if (name === 'email') {
			if (!value.trim()) { fieldErrors[name] = 'Required'; return; }
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { fieldErrors[name] = 'Enter a valid email'; return; }
		}
		delete fieldErrors[name];
	}

	function handleBlur(e: FocusEvent) {
		const input = e.target as HTMLInputElement;
		touched[input.name] = true;
		validateField(input.name, input.value);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!selectedSlot) return;

		formStatus = 'submitting';
		errorMessage = '';

		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);

		const body = {
			firstName: fd.get('firstName'),
			lastName: fd.get('lastName'),
			email: fd.get('email'),
			phone: fd.get('phone'),
			matterType: fd.get('matterType'),
			currentlyRepresented: fd.get('currentlyRepresented'),
			briefDescription: fd.get('briefDescription'),
			urgency: fd.get('urgency'),
			start: selectedSlot.start,
			end: selectedSlot.end
		};

		try {
			const res = await fetch('/api/schedule/book', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			const data = await res.json();

			if (!res.ok) {
				errorMessage = data.error || 'Booking failed. Please try again.';
				formStatus = 'error';
				if (res.status === 409) {
					// Slot taken — go back to picker
					setTimeout(() => { step = 'pick'; fetchSlots(selectedDate); }, 2000);
				}
				return;
			}

			icsContent = data.icsContent;
			googleCalendarUrl = data.googleCalendarUrl;
			bookedSlot = { start: selectedSlot.start, end: selectedSlot.end };
			step = 'success';
		} catch {
			errorMessage = 'Failed to book. Please try again.';
			formStatus = 'error';
		}
	}

	function downloadICS() {
		if (!icsContent) return;
		const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'king-law-consultation.ics';
		a.click();
		URL.revokeObjectURL(url);
	}

	function formatBookedTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatBookedDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Schedule a Consultation | King Law</title>
</svelte:head>

<div class="min-h-screen pt-20">
	<!-- Hero -->
	<section class="py-16 md:py-20 bg-king-blue">
		<div class="max-w-4xl mx-auto px-6 lg:px-8 text-center">
			<p class="text-gold uppercase tracking-[0.3em] text-sm mb-6">Book Online</p>
			<h1 class="font-title text-4xl sm:text-5xl md:text-6xl text-white leading-[1.1] mb-6">
				Schedule a<br />
				<span class="text-gold">Consultation</span>
			</h1>
			<p class="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
				Choose a convenient time below. Consultations are 30 minutes and completely confidential.
			</p>
		</div>
	</section>

	<!-- Main Content -->
	<section class="py-12 md:py-20 bg-king-blue-dark">
		<div class="max-w-4xl mx-auto px-6 lg:px-8">

			{#if step === 'pick'}
				<!-- STEP 1: Date & Slot Picker -->
				<div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-10">
					<h2 class="font-title text-2xl md:text-3xl text-white mb-2">Select a Date & Time</h2>
					<p class="text-white/50 text-sm mb-8">Monday – Friday, 9:00 AM – 5:00 PM Eastern</p>

					<!-- Week Navigation -->
					<div class="flex items-center justify-between mb-6">
						<button
							onclick={() => weekOffset--}
							disabled={weekOffset <= 0}
							aria-label="Previous week"
							class="p-2 rounded-lg border border-white/10 text-white/60 hover:text-gold hover:border-gold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
						</button>
						<span class="text-white/80 font-semibold text-sm md:text-base">{weekLabel()}</span>
						<button
							onclick={() => weekOffset++}
							disabled={weekOffset >= 8}
							aria-label="Next week"
							class="p-2 rounded-lg border border-white/10 text-white/60 hover:text-gold hover:border-gold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
						</button>
					</div>

					<!-- Day Cards -->
					<div class="grid grid-cols-5 gap-2 md:gap-3 mb-8">
						{#each weekDays as day}
							<button
								onclick={() => !day.isPast && fetchSlots(day.date)}
								disabled={day.isPast}
								class="flex flex-col items-center py-3 md:py-4 rounded-xl border transition-all {
									selectedDate === day.date
										? 'bg-gold/20 border-gold text-gold'
										: day.isPast
											? 'border-white/5 text-white/20 cursor-not-allowed'
											: day.isToday
												? 'border-gold/40 text-white hover:border-gold hover:bg-gold/10'
												: 'border-white/10 text-white/60 hover:border-gold/50 hover:text-white hover:bg-white/5'
								}"
							>
								<span class="text-xs uppercase tracking-wider mb-1">{day.dayName}</span>
								<span class="text-lg md:text-xl font-bold">{day.label}</span>
								{#if day.isToday}
									<span class="text-[10px] text-gold mt-1">Today</span>
								{/if}
							</button>
						{/each}
					</div>

					<!-- Time Slots -->
					{#if selectedDate}
						<div class="border-t border-white/10 pt-8">
							{#if loadingSlots}
								<div class="flex items-center justify-center py-12">
									<div class="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin"></div>
									<span class="ml-3 text-white/50">Loading availability...</span>
								</div>
							{:else if slotsMessage && slots.length === 0}
								<div class="text-center py-12">
									<svg class="w-12 h-12 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
									<p class="text-white/40">{slotsMessage}</p>
								</div>
							{:else}
								<p class="text-white/60 text-sm mb-4">Available times for <span class="text-gold font-semibold">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>:</p>
								<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
									{#each slots as slot}
										<button
											onclick={() => selectSlot(slot)}
											class="py-3 px-4 rounded-lg border border-white/10 text-white/80 hover:border-gold hover:text-gold hover:bg-gold/10 transition-all text-sm font-medium"
										>
											{slot.display}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{:else}
						<div class="text-center py-12 border-t border-white/10">
							<svg class="w-12 h-12 text-white/15 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
							<p class="text-white/30">Select a date above to see available times</p>
						</div>
					{/if}
				</div>

			{:else if step === 'form'}
				<!-- STEP 2: Booking Form -->
				<div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-10">
					<button onclick={backToPicker} class="flex items-center gap-2 text-white/50 hover:text-gold transition-colors mb-6 text-sm">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
						Back to calendar
					</button>

					<h2 class="font-title text-2xl md:text-3xl text-white mb-2">Confirm Your Booking</h2>

					<!-- Selected slot summary -->
					{#if selectedSlot}
						<div class="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-8 flex items-center gap-4">
							<div class="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
								<svg class="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
							</div>
							<div>
								<p class="text-gold font-semibold">{selectedSlot.display}</p>
								<p class="text-white/50 text-sm">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
							</div>
						</div>
					{/if}

					<form class="space-y-6" onsubmit={handleSubmit}>
						<div class="grid sm:grid-cols-2 gap-6">
							<div>
								<label for="firstName" class="block text-sm font-medium text-white/80 mb-2">First Name <span class="text-gold">*</span></label>
								<input
									type="text" id="firstName" name="firstName" required
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
									type="text" id="lastName" name="lastName" required
									onblur={handleBlur}
									class="w-full px-4 py-3.5 rounded-lg bg-white/5 border text-white placeholder-white/30 outline-none transition-all {touched['lastName'] && fieldErrors['lastName'] ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' : touched['lastName'] && !fieldErrors['lastName'] ? 'border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20' : 'border-white/10 focus:border-gold focus:ring-2 focus:ring-gold/20'}"
									placeholder="Doe"
								/>
								{#if touched['lastName'] && fieldErrors['lastName']}
									<p class="text-red-400 text-xs mt-1">{fieldErrors['lastName']}</p>
								{/if}
							</div>
						</div>

						<div class="grid sm:grid-cols-2 gap-6">
							<div>
								<label for="email" class="block text-sm font-medium text-white/80 mb-2">Email <span class="text-gold">*</span></label>
								<input
									type="email" id="email" name="email" required
									onblur={handleBlur}
									class="w-full px-4 py-3.5 rounded-lg bg-white/5 border text-white placeholder-white/30 outline-none transition-all {touched['email'] && fieldErrors['email'] ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' : touched['email'] && !fieldErrors['email'] ? 'border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20' : 'border-white/10 focus:border-gold focus:ring-2 focus:ring-gold/20'}"
									placeholder="john@example.com"
								/>
								{#if touched['email'] && fieldErrors['email']}
									<p class="text-red-400 text-xs mt-1">{fieldErrors['email']}</p>
								{/if}
							</div>
							<div>
								<label for="phone" class="block text-sm font-medium text-white/80 mb-2">Phone</label>
								<input
									type="tel" id="phone" name="phone"
									class="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
									placeholder="(689) 353-6943"
								/>
							</div>
						</div>

						<div>
							<label for="matterType" class="block text-sm font-medium text-white/80 mb-2">Matter Type</label>
							<select
								id="matterType" name="matterType"
								class="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
								style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23F2B022'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 12px center; background-size: 20px;"
							>
								<option value="" class="bg-king-blue-dark text-white/50">Select one</option>
								{#each matterTypes as type}
									<option value={type} class="bg-king-blue-dark text-white">{type}</option>
								{/each}
							</select>
						</div>

						<div class="grid sm:grid-cols-2 gap-6">
							<div>
								<label for="currentlyRepresented" class="block text-sm font-medium text-white/80 mb-2">Currently Represented?</label>
								<select
									id="currentlyRepresented"
									name="currentlyRepresented"
									class="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
									style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23F2B022'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 12px center; background-size: 20px;"
								>
									<option value="" class="bg-king-blue-dark text-white/50">Not Sure</option>
									<option value="yes" class="bg-king-blue-dark text-white">Yes</option>
									<option value="no" class="bg-king-blue-dark text-white">No</option>
								</select>
							</div>
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
						</div>

						<div>
							<label for="briefDescription" class="block text-sm font-medium text-white/80 mb-2">Brief Description</label>
							<textarea
								id="briefDescription"
								name="briefDescription"
								rows="3"
								class="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all resize-y"
								placeholder="High-level overview only."
							></textarea>
						</div>

						{#if formStatus === 'error' && errorMessage}
							<div class="bg-red-500/10 border border-red-400/30 rounded-lg px-4 py-3">
								<p class="text-red-400 text-sm">{errorMessage}</p>
							</div>
						{/if}

						<button
							type="submit"
							disabled={formStatus === 'submitting'}
							class="w-full sm:w-auto bg-gold hover:bg-gold-light text-king-blue px-10 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-gold/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
						>
							{formStatus === 'submitting' ? 'Booking...' : 'Confirm Booking'}
						</button>

						<p class="text-white/30 text-xs">
							By booking, you agree to our privacy policy. Your information is confidential and protected.
						</p>
					</form>
				</div>

			{:else if step === 'success'}
				<!-- STEP 3: Success -->
				<div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12 text-center">
					<div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
						<svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>

					<h2 class="font-title text-3xl text-white mb-4">You're Booked!</h2>

					{#if bookedSlot}
						<p class="text-white/60 text-lg mb-1">{formatBookedDate(bookedSlot.start)}</p>
						<p class="text-gold text-xl font-semibold mb-8">
							{formatBookedTime(bookedSlot.start)} – {formatBookedTime(bookedSlot.end)}
						</p>
					{/if}

					<p class="text-white/40 mb-8 max-w-md mx-auto">
						A confirmation has been sent to your email. Add this consultation to your calendar so you don't miss it.
					</p>

					<div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
						<button
							onclick={downloadICS}
							class="flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-king-blue px-8 py-3 rounded-lg font-bold transition-all"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
							Download .ics
						</button>
						{#if googleCalendarUrl}
							<a
								href={googleCalendarUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center justify-center gap-2 border border-white/20 hover:border-gold text-white px-8 py-3 rounded-lg font-semibold transition-all"
							>
								<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.5 22h-15A2.5 2.5 0 012 19.5v-15A2.5 2.5 0 014.5 2H8v2H4.5a.5.5 0 00-.5.5v15a.5.5 0 00.5.5h15a.5.5 0 00.5-.5V16h2v3.5a2.5 2.5 0 01-2.5 2.5zM12 2h8v8h-2V5.414l-7.293 7.293-1.414-1.414L16.586 4H12V2z"/></svg>
								Add to Google Calendar
							</a>
						{/if}
					</div>

					<div class="flex justify-center">
						<a href="/" class="border border-white/10 hover:border-white/30 text-white/60 hover:text-white px-8 py-3 rounded-lg font-semibold transition-all text-center">
							Return Home
						</a>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- Trust Indicators -->
	<section class="py-16 bg-king-blue border-t border-white/5">
		<div class="max-w-4xl mx-auto px-6 lg:px-8">
			<div class="grid sm:grid-cols-3 gap-8 text-center">
				<div>
					<div class="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center mx-auto mb-4">
						<svg class="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
					</div>
					<h3 class="text-white font-semibold mb-1">100% Confidential</h3>
					<p class="text-white/40 text-sm">Protected by attorney-client privilege.</p>
				</div>
				<div>
					<div class="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center mx-auto mb-4">
						<svg class="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
					</div>
					<h3 class="text-white font-semibold mb-1">Instant Confirmation</h3>
					<p class="text-white/40 text-sm">Book directly into the firm's calendar.</p>
				</div>
				<div>
					<div class="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center mx-auto mb-4">
						<svg class="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
					</div>
					<h3 class="text-white font-semibold mb-1">No Obligation</h3>
					<p class="text-white/40 text-sm">Free initial consultation, no strings attached.</p>
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
