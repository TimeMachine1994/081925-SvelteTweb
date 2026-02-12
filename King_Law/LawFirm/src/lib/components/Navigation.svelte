<script lang="ts">
	import { page } from '$app/stores';
	import { themeStore } from '$lib/stores/theme.svelte.ts';

	let { user = null } = $props<{ user: any }>();
	let mobileMenuOpen = $state(false);
	let servicesOpen = $state(false);
</script>

<nav class="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-king-blue-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-white/10 shadow-sm">
	<div class="max-w-7xl mx-auto px-6 lg:px-8">
		<div class="flex items-center h-20">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-3 group shrink-0">
				<img src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/King+Law+Official+Logo++No+BKG.png" alt="King Law" class="h-12 w-auto" />
				<div class="flex flex-col">
					<span class="font-title text-xl text-king-blue dark:text-white">King Law, PLLC</span>
					<span class="text-xs font-semibold text-gold tracking-wide">(689) 353-6943</span>
				</div>
			</a>

			<!-- Desktop Navigation -->
			<div class="hidden lg:flex flex-1 items-center justify-center gap-8">
				<a href="/Fortress" class="text-king-blue/70 dark:text-white/70 hover:text-king-blue dark:hover:text-gold transition-colors text-sm tracking-wide uppercase">Fortress</a>
				
				<div class="relative group">
					<button class="text-king-blue/70 dark:text-white/70 hover:text-king-blue dark:hover:text-gold transition-colors text-sm tracking-wide uppercase flex items-center gap-1">
						Practice Areas
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					<div class="absolute left-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
						<div class="bg-king-blue rounded-lg p-2 min-w-[320px] depth-card-dark">
							<a href="/services/personal-injury" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Personal Injury</a>
							<a href="/services/criminal-defense" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Criminal Defense</a>
							<a href="/services/executive-counsel" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Executive & Employment Counsel</a>
							<a href="/services/business-investment" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Business & Investment</a>
							<a href="/services/civil-rights" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Civil Rights</a>
							<a href="/services/cannabis-law" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Cannabis Law</a>
							<a href="/services/appellate-strategy" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Appellate Strategy</a>
							<a href="/services/property-claims" class="block px-4 py-2 text-white/80 hover:text-gold hover:bg-white/10 rounded transition-colors">Property & Insurance Claims</a>
						</div>
					</div>
				</div>

				<a href="/our-team" class="text-king-blue/70 dark:text-white/70 hover:text-king-blue dark:hover:text-gold transition-colors text-sm tracking-wide uppercase">Our Team</a>
				<a href="/schedule" class="text-king-blue/70 dark:text-white/70 hover:text-king-blue dark:hover:text-gold transition-colors text-sm tracking-wide uppercase">Schedule</a>
				<a href="/contact" class="text-king-blue/70 dark:text-white/70 hover:text-king-blue dark:hover:text-gold transition-colors text-sm tracking-wide uppercase">Contact</a>
			</div>

			<!-- Theme Toggle + CTA Buttons -->
			<div class="hidden lg:flex items-center gap-4">
				<button
					onclick={() => themeStore.toggle()}
					class="p-2 rounded-lg hover:bg-king-blue/10 dark:hover:bg-white/10 transition-colors"
					aria-label="Toggle dark mode"
				>
					{#if themeStore.isDark}
						<svg class="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
					{:else}
						<svg class="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
					{/if}
				</button>
				{#if user}
					<a 
						href={user.role === 'lawyer' || user.role === 'admin' ? '/dashboard/lawyer' : '/dashboard/client'} 
						class="bg-gold hover:bg-gold-light text-king-blue px-6 py-2.5 rounded-lg font-semibold transition-all depth-gold"
					>
						Dashboard
					</a>
					<a 
						href="/logout"
						class="text-king-blue/70 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
						title="Logout"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
						</svg>
					</a>
				{:else}
					<a href="/login" class="border border-king-blue/30 dark:border-white/30 hover:border-king-blue dark:hover:border-gold text-king-blue dark:text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:bg-king-blue/5 dark:hover:bg-white/5 depth-ghost">Login</a>
					<a href="/pay-bill" class="bg-gold hover:bg-gold-light text-king-blue px-6 py-2.5 rounded-lg font-semibold transition-all depth-gold">
						Pay Bill
					</a>
				{/if}
			</div>

			<!-- Mobile menu button -->
			<button 
				class="lg:hidden ml-auto text-king-blue dark:text-white p-2"
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
		<div class="lg:hidden bg-king-blue depth-card-dark">
			<div class="px-6 py-6 space-y-1">
				<a href="/Fortress" class="block py-3 text-white/80 hover:text-gold border-b border-white/10" onclick={() => mobileMenuOpen = false}>Fortress</a>
 				
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
						<a href="/services/personal-injury" class="block py-2 text-white/60 hover:text-gold text-sm" onclick={() => mobileMenuOpen = false}>Personal Injury</a>
						<a href="/services/criminal-defense" class="block py-2 text-white/60 hover:text-gold text-sm" onclick={() => mobileMenuOpen = false}>Criminal Defense</a>
						<a href="/services/executive-counsel" class="block py-2 text-white/60 hover:text-gold text-sm" onclick={() => mobileMenuOpen = false}>Executive & Employment Counsel</a>
						<a href="/services/business-investment" class="block py-2 text-white/60 hover:text-gold text-sm" onclick={() => mobileMenuOpen = false}>Business & Investment</a>
						<a href="/services/civil-rights" class="block py-2 text-white/60 hover:text-gold text-sm" onclick={() => mobileMenuOpen = false}>Civil Rights</a>
						<a href="/services/cannabis-law" class="block py-2 text-white/60 hover:text-gold text-sm" onclick={() => mobileMenuOpen = false}>Cannabis Law</a>
						<a href="/services/appellate-strategy" class="block py-2 text-white/60 hover:text-gold text-sm" onclick={() => mobileMenuOpen = false}>Appellate Strategy</a>
						<a href="/services/property-claims" class="block py-2 text-white/60 hover:text-gold text-sm" onclick={() => mobileMenuOpen = false}>Property & Insurance Claims</a>
					</div>
				{/if}
				
				<a href="/our-team" class="block py-3 text-white/80 hover:text-gold border-b border-white/10" onclick={() => mobileMenuOpen = false}>Our Team</a>
				<a href="/schedule" class="block py-3 text-white/80 hover:text-gold border-b border-white/10" onclick={() => mobileMenuOpen = false}>Schedule</a>
				<a href="/contact" class="block py-3 text-white/80 hover:text-gold border-b border-white/10" onclick={() => mobileMenuOpen = false}>Contact</a>
				
				<div class="pt-4 space-y-3">
					<button
						onclick={() => themeStore.toggle()}
						class="w-full flex items-center justify-center gap-2 py-3 text-white/80 hover:text-gold border-b border-white/10 transition-colors"
					>
						{#if themeStore.isDark}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
							Light Mode
						{:else}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
							Dark Mode
						{/if}
					</button>
					{#if user}
						<a 
							href={user.role === 'lawyer' || user.role === 'admin' ? '/dashboard/lawyer' : '/dashboard/client'}
							class="block text-center bg-gold text-king-blue py-3 rounded-lg font-semibold depth-gold"
							onclick={() => mobileMenuOpen = false}
						>
							Dashboard
						</a>
						<a 
							href="/logout"
							class="flex items-center justify-center gap-2 text-white/80 hover:text-red-400 py-2 transition-colors"
							onclick={() => mobileMenuOpen = false}
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
							</svg>
							Logout
						</a>
					{:else}
						<a href="/login" class="block text-center text-white/80 hover:text-gold py-2" onclick={() => mobileMenuOpen = false}>Login</a>
						<a href="/pay-bill" class="block text-center bg-gold text-king-blue py-3 rounded-lg font-semibold depth-gold" onclick={() => mobileMenuOpen = false}>
						Pay Bill
						</a>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</nav>
