<script lang="ts">
	import { page } from '$app/stores';

	let { user = null } = $props<{ user: any }>();
	let mobileMenuOpen = $state(false);
	let servicesOpen = $state(false);
</script>

<nav class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
	<div class="max-w-7xl mx-auto px-6 lg:px-8">
		<div class="flex justify-between items-center h-20">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-3 group">
				<img src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/King+Law+Official+Logo++No+BKG.png" alt="King Law" class="h-12 w-auto" />
				<span class="font-title text-xl text-king-blue">King Law, P.L.L.C.</span>
			</a>

			<!-- Desktop Navigation -->
			<div class="hidden lg:flex items-center gap-10">
				<a href="/" class="text-king-blue/70 hover:text-king-blue transition-colors text-sm tracking-wide uppercase">Home</a>
				
				<div class="relative group">
					<button class="text-king-blue/70 hover:text-king-blue transition-colors text-sm tracking-wide uppercase flex items-center gap-1">
						Practice Areas
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					<div class="absolute left-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
						<div class="bg-king-blue rounded-lg shadow-xl p-2 min-w-[320px]">
							<a href="/services/personal-injury" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Personal Injury</a>
							<a href="/services/criminal-defense" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Criminal Defense</a>
							<a href="/services/employment-law" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Employment Law</a>
							<a href="/services/real-estate-business" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Real Estate & Business</a>
							<a href="/services/civil-rights" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Civil Rights Violations</a>
							<a href="/services/cannabis-law" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Medical Marijuana & Cannabis</a>
							<a href="/services/appeals" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Appeals</a>
							<a href="/services/property-damage" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Property Damage</a>
						</div>
					</div>
				</div>

				<a href="/meet-ben-king" class="text-king-blue/70 hover:text-king-blue transition-colors text-sm tracking-wide uppercase">Meet Ben King</a>
				<a href="/our-team" class="text-king-blue/70 hover:text-king-blue transition-colors text-sm tracking-wide uppercase">Our Team</a>
				<a href="/contact" class="text-king-blue/70 hover:text-king-blue transition-colors text-sm tracking-wide uppercase">Contact</a>
			</div>

			<!-- CTA Buttons -->
			<div class="hidden lg:flex items-center gap-4">
				{#if user}
					<a 
						href={user.role === 'lawyer' || user.role === 'admin' ? '/dashboard/lawyer' : '/dashboard/client'} 
						class="bg-gold hover:bg-gold-light text-king-blue px-6 py-2.5 rounded-lg font-semibold transition-all hover:shadow-lg"
					>
						Dashboard
					</a>
				{:else}
					<a href="/login" class="text-king-blue/70 hover:text-king-blue transition-colors text-sm">Login</a>
					<a href="/contact" class="bg-king-blue hover:bg-king-blue-light text-white px-6 py-2.5 rounded-lg font-semibold transition-all hover:shadow-lg">
						Free Consultation
					</a>
				{/if}
			</div>

			<!-- Mobile menu button -->
			<button 
				class="lg:hidden text-king-blue p-2"
				onclick={() => mobileMenuOpen = !mobileMenuOpen}
				aria-label="Toggle mobile menu"
			>
				{#if mobileMenuOpen}
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{:else}
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile Navigation -->
	{#if mobileMenuOpen}
		<div class="lg:hidden bg-king-blue">
			<div class="px-6 py-6 space-y-1">
				<a href="/" class="block py-3 text-white/80 hover:text-gold border-b border-white/10">Home</a>
				
				<button 
					class="w-full flex justify-between items-center py-3 text-white/80 hover:text-gold border-b border-white/10"
					onclick={() => servicesOpen = !servicesOpen}
				>
					Practice Areas
					<svg class="w-4 h-4 transition-transform {servicesOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>
				{#if servicesOpen}
					<div class="pl-4 space-y-1 pb-2">
						<a href="/services/personal-injury" class="block py-2 text-white/60 hover:text-gold text-sm">Personal Injury</a>
						<a href="/services/criminal-defense" class="block py-2 text-white/60 hover:text-gold text-sm">Criminal Defense</a>
						<a href="/services/employment-law" class="block py-2 text-white/60 hover:text-gold text-sm">Employment Law</a>
						<a href="/services/real-estate-business" class="block py-2 text-white/60 hover:text-gold text-sm">Real Estate & Business</a>
						<a href="/services/civil-rights" class="block py-2 text-white/60 hover:text-gold text-sm">Civil Rights</a>
						<a href="/services/cannabis-law" class="block py-2 text-white/60 hover:text-gold text-sm">Cannabis Law</a>
						<a href="/services/appeals" class="block py-2 text-white/60 hover:text-gold text-sm">Appeals</a>
						<a href="/services/property-damage" class="block py-2 text-white/60 hover:text-gold text-sm">Property Damage</a>
					</div>
				{/if}
				
				<a href="/meet-ben-king" class="block py-3 text-white/80 hover:text-gold border-b border-white/10">Meet Ben King</a>
				<a href="/our-team" class="block py-3 text-white/80 hover:text-gold border-b border-white/10">Our Team</a>
				<a href="/contact" class="block py-3 text-white/80 hover:text-gold border-b border-white/10">Contact</a>
				
				<div class="pt-4 space-y-3">
					{#if user}
						<a 
							href={user.role === 'lawyer' ? '/dashboard/lawyer' : '/dashboard/client'}
							class="block text-center bg-gold text-king-blue py-3 rounded-lg font-semibold"
						>
							Dashboard
						</a>
					{:else}
						<a href="/login" class="block text-center text-white/80 hover:text-gold py-2">Login</a>
						<a href="/contact" class="block text-center bg-gold text-king-blue py-3 rounded-lg font-semibold">
							Free Consultation
						</a>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</nav>
