<script lang="ts">
	// No external JS required; accordions use <details> for accessibility.
	const brand = {
		gold: '#D5BA7F',
		ink: '#070707',
		cloud: '#CFCFCE'
	};
	console.log('🎨 How It Works page initialized!', { brand });
</script>

<!--
  SvelteKit + Tailwind page markup.
  Drop this into routes/how-it-works/+page.svelte (or similar).
-->

<section class="relative isolate overflow-hidden bg-gradient-to-b from-black via-zinc-900 to-black text-white">
	<!-- Decorative blurred glow -->
	<div class="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[32rem] w-[32rem] rounded-full blur-3xl opacity-30" style="background: radial-gradient(closest-side, #D5BA7F, transparent 70%)"></div>

	<!-- HERO -->
	<div class="mx-auto max-w-7xl px-6 pt-20 pb-10 lg:px-8 lg:pt-28">
		<div class="mx-auto max-w-3xl text-center">
			<h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">
				How Tributestream® Works
			</h1>
			<p class="mt-4 text-lg text-zinc-300">
				Three clear options. One private link. Heirloom‑quality results.
			</p>
			<div class="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
				<a href="/schedule" class="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium ring-1 ring-white/10 shadow-sm transition hover:opacity-90" style="background-color: {brand.gold}; color: {brand.ink}">
					Create Link
				</a>
				<a href="/contact" class="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-white ring-1 ring-white/15 hover:bg-white/5">
					Talk to a Tribute Tech
				</a>
			</div>
		</div>
	</div>

	<!-- OPTIONS GRID -->
	<div class="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			<!-- Option 1: DIY Kit -->
			<article class="group relative rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur">
				<header class="flex items-start justify-between">
					<h2 class="text-xl font-semibold">
						DIY Solo Camera Kit <span class="ml-2 rounded-full px-2 py-0.5 text-xs" style="background-color: {brand.gold}; color: {brand.ink}">2 Hours</span>
					</h2>
					<span class="text-xs text-zinc-300">Most budget‑friendly</span>
				</header>
				<p class="mt-3 text-sm text-zinc-300">
					Set up in minutes. Stream up to two hours. Private link included. Recorded for later.
				</p>
				<ul class="mt-4 space-y-2 text-sm text-zinc-200">
					<li class="flex gap-2"><span class="mt-1 h-1.5 w-1.5 rounded-full" style="background-color: {brand.gold}"></span> Compact, simple kit; no tech skills required.</li>
					<li class="flex gap-2"><span class="mt-1 h-1.5 w-1.5 rounded-full" style="background-color: {brand.gold}"></span> Private viewing link for family & friends.</li>
					<li class="flex gap-2"><span class="mt-1 h-1.5 w-1.5 rounded-full" style="background-color: {brand.gold}"></span> Automatic recording and archive.</li>
				</ul>
				<details class="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
					<summary class="cursor-pointer text-sm font-medium">What’s included</summary>
					<div class="mt-3 text-sm text-zinc-300">
						<p>Camera unit, tripod, power, quick‑start card, return label. Live support available.</p>
						<p class="mt-2 italic text-zinc-400">Limitations: single angle; max 2 hours; self‑setup & monitoring.</p>
					</div>
				</details>
			</article>

			<!-- Option 2: Tribute Tech -->
			<article class="group relative rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur">
				<header class="flex items-start justify-between">
					<h2 class="text-xl font-semibold">Professional Tribute Tech Service</h2>
					<span class="text-xs text-zinc-300">Most convenient</span>
				</header>
				<p class="mt-3 text-sm text-zinc-300">We arrive early, set up discreetly, and handle the entire livestream end‑to‑end.</p>
				<ul class="mt-4 space-y-2 text-sm text-zinc-200">
					<li class="flex gap-2"><span class="mt-1 h-1.5 w-1.5 rounded-full" style="background-color: {brand.gold}"></span> On‑site camera + pro audio; pre‑service testing.</li>
					<li class="flex gap-2"><span class="mt-1 h-1.5 w-1.5 rounded-full" style="background-color: {brand.gold}"></span> Private link; watch on any device; archived for family.</li>
					<li class="flex gap-2"><span class="mt-1 h-1.5 w-1.5 rounded-full" style="background-color: {brand.gold}"></span> Keepsakes available: Engraved USB, TributeCase®, cloud.</li>
				</ul>
				<details class="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
					<summary class="cursor-pointer text-sm font-medium">What’s included</summary>
					<div class="mt-3 text-sm text-zinc-300">
						<p>Arrival 60–90 minutes early; discreet placement; technical monitoring throughout.</p>
						<p class="mt-2 italic text-zinc-400">Best for: standard services at funeral homes with minimal complexity.</p>
					</div>
				</details>
			</article>

			<!-- Option 3: Trained Videographers -->
			<article class="group relative rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur">
				<header class="flex items-start justify-between">
					<h2 class="text-xl font-semibold">Trained Videographers (Multi‑Angle / Extended)</h2>
					<span class="text-xs text-zinc-300">Most coverage</span>
				</header>
				<p class="mt-3 text-sm text-zinc-300">Cinematic multi‑camera coverage for larger, longer, or multi‑location services.</p>
				<ul class="mt-4 space-y-2 text-sm text-zinc-200">
					<li class="flex gap-2"><span class="mt-1 h-1.5 w-1.5 rounded-full" style="background-color: {brand.gold}"></span> Multiple angles, operators, and coordinated audio.</li>
					<li class="flex gap-2"><span class="mt-1 h-1.5 w-1.5 rounded-full" style="background-color: {brand.gold}"></span> Ideal for >2 hours, multiple venues, or special locations.</li>
					<li class="flex gap-2"><span class="mt-1 h-1.5 w-1.5 rounded-full" style="background-color: {brand.gold}"></span> Highest production quality and flexibility.</li>
				</ul>
				<details class="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
					<summary class="cursor-pointer text-sm font-medium">Important notes</summary>
					<div class="mt-3 text-sm text-zinc-300">
						<p><strong>Not suited for churches</strong> due to common venue restrictions.</p>
						<p class="mt-2 italic text-zinc-400">Best for: outdoor memorials, large gatherings, extended ceremonies.</p>
					</div>
				</details>
			</article>
		</div>
	</div>

	<!-- VALUE STRIP -->
	<div class="border-y border-white/10 bg-black/30">
		<div class="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-10 text-sm text-zinc-300 md:grid-cols-4 lg:px-8">
			<div class="flex items-center gap-3"><span class="h-2 w-2 rounded-full" style="background-color: {brand.gold}"></span> Private & secure link access</div>
			<div class="flex items-center gap-3"><span class="h-2 w-2 rounded-full" style="background-color: {brand.gold}"></span> Heirloom‑quality recording</div>
			<div class="flex items-center gap-3"><span class="h-2 w-2 rounded-full" style="background-color: {brand.gold}"></span> Compassionate on‑site support</div>
			<div class="flex items-center gap-3"><span class="h-2 w-2 rounded-full" style="background-color: {brand.gold}"></span> Clear, simple setup</div>
		</div>
	</div>

	<!-- FAQ / EXPANDABLE DETAILS -->
	<div class="mx-auto max-w-4xl px-6 py-16 lg:px-8">
		<h3 class="text-center text-2xl font-semibold">Details (tap to expand)</h3>
		<div class="mt-8 space-y-4">
			<details class="rounded-xl border border-white/10 bg-white/5 p-5">
				<summary class="cursor-pointer select-none text-sm font-medium">How scheduling works</summary>
				<div class="mt-3 text-sm text-zinc-300">Fill the short form with date, time, and location. A private link is instantly generated and shared via email/SMS.</div>
			</details>
			<details class="rounded-xl border border-white/10 bg-white/5 p-5">
				<summary class="cursor-pointer select-none text-sm font-medium">Delivery & keepsakes</summary>
				<div class="mt-3 text-sm text-zinc-300">Your livestream remains viewable on the same link. Optional engraved USB, TributeCase®, or cloud delivery available.</div>
			</details>
			<details class="rounded-xl border border-white/10 bg-white/5 p-5">
				<summary class="cursor-pointer select-none text-sm font-medium">Support</summary>
				<div class="mt-3 text-sm text-zinc-300">DIY Kit includes live support. Tribute Tech and Videographers include full on‑site support.</div>
			</details>
		</div>
		<div class="mt-10 flex justify-center gap-3">
			<a href="/schedule" class="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium ring-1 ring-white/10 shadow-sm transition hover:opacity-90" style="background-color: {brand.gold}; color: {brand.ink}">Create Link</a>
			<a href="/contact" class="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-white ring-1 ring-white/15 hover:bg-white/5">Ask a Question</a>
		</div>
	</div>

	<!-- FOOTER NOTE -->
	<div class="mx-auto max-w-5xl px-6 pb-20 text-center text-xs text-zinc-400 lg:px-8">
		<p>Tributestream® provides livestreaming options for memorial services. Availability varies by venue and region.</p>
	</div>
</section>