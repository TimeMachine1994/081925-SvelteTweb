<script lang="ts">
	interface TimeSlot {
		start: string;
		end: string;
		display: string;
	}

	interface Props {
		variant?: 'dark' | 'light';
	}

	import { onMount } from 'svelte';

	let { variant = 'dark' }: Props = $props();

	// Variant-driven style helpers
	let isDark = $derived(variant === 'dark');

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
		const diff = day === 0 ? -6 : 1 - day;
		startOfWeek.setDate(startOfWeek.getDate() + diff + offset * 7);

		const days = [];
		for (let i = 0; i < 5; i++) {
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
	let weekLabel = $derived.by(() => {
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

<div>
	{#if step === 'pick'}
		<!-- STEP 1: Date & Slot Picker -->
		<div class="{isDark ? 'bg-white/5 border-white/10 depth-card-dark' : 'bg-gray-50 border-gray-200 depth-card'} backdrop-blur-sm border rounded-2xl p-6 md:p-10">
			<h2 class="font-title text-2xl md:text-3xl {isDark ? 'text-white' : 'text-king-blue'} mb-2">Select a Date & Time</h2>
			<p class="{isDark ? 'text-white/50' : 'text-gray-400'} text-sm mb-8">Monday – Friday, 9:00 AM – 5:00 PM Eastern</p>

			<!-- Week Navigation -->
			<div class="flex items-center justify-between mb-6">
				<button
					onclick={() => weekOffset--}
					disabled={weekOffset <= 0}
					aria-label="Previous week"
					class="p-2 rounded-lg border {isDark ? 'border-white/10 text-white/60 hover:text-gold hover:border-gold' : 'border-gray-200 text-gray-400 hover:text-gold hover:border-gold'} transition-all disabled:opacity-30 disabled:cursor-not-allowed"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
				</button>
				<span class="{isDark ? 'text-white/80' : 'text-gray-700'} font-semibold text-sm md:text-base">{weekLabel}</span>
				<button
					onclick={() => weekOffset++}
					disabled={weekOffset >= 8}
					aria-label="Next week"
					class="p-2 rounded-lg border {isDark ? 'border-white/10 text-white/60 hover:text-gold hover:border-gold' : 'border-gray-200 text-gray-400 hover:text-gold hover:border-gold'} transition-all disabled:opacity-30 disabled:cursor-not-allowed"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
				</button>
			</div>

			<!-- Day Cards -->
			<div class="grid grid-cols-5 gap-1.5 sm:gap-2 md:gap-3 mb-8">
				{#each weekDays as day (day.date)}
					<button
						onclick={() => !day.isPast && fetchSlots(day.date)}
						disabled={day.isPast}
						class="flex flex-col items-center py-3 md:py-4 rounded-xl border transition-all {
							selectedDate === day.date
								? 'bg-gold/20 border-gold text-gold'
								: day.isPast
									? (isDark ? 'border-white/5 text-white/20' : 'border-gray-100 text-gray-300') + ' cursor-not-allowed'
									: day.isToday
										? (isDark ? 'border-gold/40 text-white hover:border-gold hover:bg-gold/10' : 'border-gold/40 text-gray-700 hover:border-gold hover:bg-gold/10')
										: (isDark ? 'border-white/10 text-white/60 hover:border-gold/50 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:border-gold/50 hover:text-gray-800 hover:bg-gold/5')
						}"
					>
						<span class="text-[10px] sm:text-xs uppercase tracking-wider mb-1">{day.dayName}</span>
						<span class="text-base sm:text-lg md:text-xl font-bold">{day.label}</span>
						{#if day.isToday}
							<span class="text-[10px] text-gold mt-1">Today</span>
						{/if}
					</button>
				{/each}
			</div>

			<!-- Time Slots -->
			{#if selectedDate}
				<div class="border-t {isDark ? 'border-white/10' : 'border-gray-200'} pt-8">
					{#if loadingSlots}
						<div class="flex items-center justify-center py-12">
							<div class="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin"></div>
							<span class="ml-3 {isDark ? 'text-white/50' : 'text-gray-400'}">Loading availability...</span>
						</div>
					{:else if slotsMessage && slots.length === 0}
						<div class="text-center py-12">
							<svg class="w-12 h-12 {isDark ? 'text-white/20' : 'text-gray-300'} mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
							<p class="{isDark ? 'text-white/40' : 'text-gray-400'}">{slotsMessage}</p>
						</div>
					{:else}
						<p class="{isDark ? 'text-white/60' : 'text-gray-500'} text-sm mb-4">Available times for <span class="text-gold font-semibold">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>:</p>
						<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
							{#each slots as slot (slot.start)}
								<button
									onclick={() => selectSlot(slot)}
									class="py-3.5 px-4 rounded-lg border min-h-[44px] {isDark ? 'border-white/10 text-white/80' : 'border-gray-200 text-gray-600'} hover:border-gold hover:text-gold hover:bg-gold/10 transition-all text-sm font-medium"
								>
									{slot.display}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<div class="text-center py-12 border-t {isDark ? 'border-white/10' : 'border-gray-200'}">
					<svg class="w-12 h-12 {isDark ? 'text-white/15' : 'text-gray-200'} mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
					<p class="{isDark ? 'text-white/30' : 'text-gray-300'}">Select a date above to see available times</p>
				</div>
			{/if}
		</div>

	{:else if step === 'form'}
		<!-- STEP 2: Booking Form -->
		<div class="{isDark ? 'bg-white/5 border-white/10 depth-card-dark' : 'bg-gray-50 border-gray-200 depth-card'} backdrop-blur-sm border rounded-2xl p-6 md:p-10">
			<button onclick={backToPicker} class="flex items-center gap-2 {isDark ? 'text-white/50' : 'text-gray-400'} hover:text-gold transition-colors mb-6 text-sm">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
				Back to calendar
			</button>

			<h2 class="font-title text-2xl md:text-3xl {isDark ? 'text-white' : 'text-king-blue'} mb-2">Confirm Your Booking</h2>

			<!-- Selected slot summary -->
			{#if selectedSlot}
				<div class="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-8 flex items-center gap-4">
					<div class="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
						<svg class="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
					</div>
					<div>
						<p class="text-gold font-semibold">{selectedSlot.display}</p>
						<p class="{isDark ? 'text-white/50' : 'text-gray-400'} text-sm">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
					</div>
				</div>
			{/if}

			<form class="space-y-6" onsubmit={handleSubmit}>
				<div class="grid sm:grid-cols-2 gap-6">
					<div>
						<label for="sw-firstName" class="block text-sm font-medium {isDark ? 'text-white/80' : 'text-gray-700'} mb-2">First Name <span class="text-gold">*</span></label>
						<input
							type="text" id="sw-firstName" name="firstName" required
							onblur={handleBlur}
							class="w-full px-4 py-3.5 rounded-lg {isDark ? 'bg-white/5' : 'bg-white'} border {isDark ? 'text-white placeholder-white/30' : 'text-gray-900 placeholder-gray-300'} outline-none transition-all {touched['firstName'] && fieldErrors['firstName'] ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' : touched['firstName'] && !fieldErrors['firstName'] ? 'border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20' : (isDark ? 'border-white/10' : 'border-gray-200') + ' focus:border-gold focus:ring-2 focus:ring-gold/20'}"
							placeholder="John"
						/>
						{#if touched['firstName'] && fieldErrors['firstName']}
							<p class="text-red-400 text-xs mt-1">{fieldErrors['firstName']}</p>
						{/if}
					</div>
					<div>
						<label for="sw-lastName" class="block text-sm font-medium {isDark ? 'text-white/80' : 'text-gray-700'} mb-2">Last Name <span class="text-gold">*</span></label>
						<input
							type="text" id="sw-lastName" name="lastName" required
							onblur={handleBlur}
							class="w-full px-4 py-3.5 rounded-lg {isDark ? 'bg-white/5' : 'bg-white'} border {isDark ? 'text-white placeholder-white/30' : 'text-gray-900 placeholder-gray-300'} outline-none transition-all {touched['lastName'] && fieldErrors['lastName'] ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' : touched['lastName'] && !fieldErrors['lastName'] ? 'border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20' : (isDark ? 'border-white/10' : 'border-gray-200') + ' focus:border-gold focus:ring-2 focus:ring-gold/20'}"
							placeholder="Doe"
						/>
						{#if touched['lastName'] && fieldErrors['lastName']}
							<p class="text-red-400 text-xs mt-1">{fieldErrors['lastName']}</p>
						{/if}
					</div>
				</div>

				<div class="grid sm:grid-cols-2 gap-6">
					<div>
						<label for="sw-email" class="block text-sm font-medium {isDark ? 'text-white/80' : 'text-gray-700'} mb-2">Email <span class="text-gold">*</span></label>
						<input
							type="email" id="sw-email" name="email" required
							onblur={handleBlur}
							class="w-full px-4 py-3.5 rounded-lg {isDark ? 'bg-white/5' : 'bg-white'} border {isDark ? 'text-white placeholder-white/30' : 'text-gray-900 placeholder-gray-300'} outline-none transition-all {touched['email'] && fieldErrors['email'] ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' : touched['email'] && !fieldErrors['email'] ? 'border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20' : (isDark ? 'border-white/10' : 'border-gray-200') + ' focus:border-gold focus:ring-2 focus:ring-gold/20'}"
							placeholder="john@example.com"
						/>
						{#if touched['email'] && fieldErrors['email']}
							<p class="text-red-400 text-xs mt-1">{fieldErrors['email']}</p>
						{/if}
					</div>
					<div>
						<label for="sw-phone" class="block text-sm font-medium {isDark ? 'text-white/80' : 'text-gray-700'} mb-2">Phone</label>
						<input
							type="tel" id="sw-phone" name="phone"
							class="w-full px-4 py-3.5 rounded-lg {isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-300'} border outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
							placeholder="(689) 353-6943"
						/>
					</div>
				</div>

				<div>
					<label for="sw-matterType" class="block text-sm font-medium {isDark ? 'text-white/80' : 'text-gray-700'} mb-2">Matter Type</label>
					<select
						id="sw-matterType" name="matterType"
						class="w-full px-4 py-3.5 rounded-lg {isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} border outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
						style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23F2B022'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 12px center; background-size: 20px;"
					>
						<option value="" class="{isDark ? 'bg-king-blue-dark text-white/50' : 'bg-white text-gray-400'}">Select one</option>
						{#each matterTypes as type (type)}
							<option value={type} class="{isDark ? 'bg-king-blue-dark text-white' : 'bg-white text-gray-900'}">{type}</option>
						{/each}
					</select>
				</div>

				<div class="grid sm:grid-cols-2 gap-6">
					<div>
						<label for="sw-currentlyRepresented" class="block text-sm font-medium {isDark ? 'text-white/80' : 'text-gray-700'} mb-2">Currently Represented?</label>
						<select
							id="sw-currentlyRepresented"
							name="currentlyRepresented"
							class="w-full px-4 py-3.5 rounded-lg {isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} border outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
							style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23F2B022'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 12px center; background-size: 20px;"
						>
							<option value="" class="{isDark ? 'bg-king-blue-dark text-white/50' : 'bg-white text-gray-400'}">Not Sure</option>
							<option value="yes" class="{isDark ? 'bg-king-blue-dark text-white' : 'bg-white text-gray-900'}">Yes</option>
							<option value="no" class="{isDark ? 'bg-king-blue-dark text-white' : 'bg-white text-gray-900'}">No</option>
						</select>
					</div>
					<div>
						<label for="sw-urgency" class="block text-sm font-medium {isDark ? 'text-white/80' : 'text-gray-700'} mb-2">Urgency</label>
						<select
							id="sw-urgency"
							name="urgency"
							class="w-full px-4 py-3.5 rounded-lg {isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} border outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
							style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23F2B022'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 12px center; background-size: 20px;"
						>
							{#each urgencyOptions as opt (opt.value)}
								<option value={opt.value} class="{isDark ? 'bg-king-blue-dark text-white' : 'bg-white text-gray-900'}">{opt.label}</option>
							{/each}
						</select>
					</div>
				</div>

				<div>
					<label for="sw-briefDescription" class="block text-sm font-medium {isDark ? 'text-white/80' : 'text-gray-700'} mb-2">Brief Description</label>
					<textarea
						id="sw-briefDescription"
						name="briefDescription"
						rows="3"
						class="w-full px-4 py-3.5 rounded-lg {isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-300'} border outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all resize-y"
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
					class="w-full sm:w-auto bg-gold hover:bg-gold-light text-king-blue px-10 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 depth-gold disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
				>
					{formStatus === 'submitting' ? 'Booking...' : 'Confirm Booking'}
				</button>

				<p class="{isDark ? 'text-white/30' : 'text-gray-400'} text-xs">
					By booking, you agree to our privacy policy. Your information is confidential and protected.
				</p>
			</form>
		</div>

	{:else if step === 'success'}
		<!-- STEP 3: Success -->
		<div class="{isDark ? 'bg-white/5 border-white/10 depth-card-dark' : 'bg-gray-50 border-gray-200 depth-card'} backdrop-blur-sm border rounded-2xl p-8 md:p-12 text-center">
			<div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
				<svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
			</div>

			<h2 class="font-title text-3xl {isDark ? 'text-white' : 'text-king-blue'} mb-4">You're Booked!</h2>

			{#if bookedSlot}
				<p class="{isDark ? 'text-white/60' : 'text-gray-500'} text-lg mb-1">{formatBookedDate(bookedSlot.start)}</p>
				<p class="text-gold text-xl font-semibold mb-8">
					{formatBookedTime(bookedSlot.start)} – {formatBookedTime(bookedSlot.end)}
				</p>
			{/if}

			<p class="{isDark ? 'text-white/40' : 'text-gray-400'} mb-8 max-w-md mx-auto">
				A confirmation has been sent to your email. Add this consultation to your calendar so you don't miss it.
			</p>

			<div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
				<button
					onclick={downloadICS}
					class="flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-king-blue px-8 py-3 rounded-lg font-bold transition-all depth-gold"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
					Download .ics
				</button>
				{#if googleCalendarUrl}
					<a
						href={googleCalendarUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center justify-center gap-2 border {isDark ? 'border-white/20 text-white' : 'border-gray-300 text-gray-700'} hover:border-gold px-8 py-3 rounded-lg font-semibold transition-all"
					>
						<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.5 22h-15A2.5 2.5 0 012 19.5v-15A2.5 2.5 0 014.5 2H8v2H4.5a.5.5 0 00-.5.5v15a.5.5 0 00.5.5h15a.5.5 0 00.5-.5V16h2v3.5a2.5 2.5 0 01-2.5 2.5zM12 2h8v8h-2V5.414l-7.293 7.293-1.414-1.414L16.586 4H12V2z"/></svg>
						Add to Google Calendar
					</a>
				{/if}
			</div>

			<div class="flex justify-center">
				<a href="/" class="border {isDark ? 'border-white/10 hover:border-white/30 text-white/60 hover:text-white' : 'border-gray-200 hover:border-gray-400 text-gray-400 hover:text-gray-700'} px-8 py-3 rounded-lg font-semibold transition-all text-center">
					Return Home
				</a>
			</div>
		</div>
	{/if}
</div>
