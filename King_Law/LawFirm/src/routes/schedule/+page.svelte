<script lang="ts">
	import ScheduleWidget from '$lib/components/ScheduleWidget.svelte';
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
			<ScheduleWidget variant="dark" />
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

