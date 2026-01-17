<script lang="ts">
	import { page } from '$app/stores';

	let { user = null } = $props<{ user: any }>();
	let mobileMenuOpen = $state(false);
</script>

<nav class="bg-background border-b border-border sticky top-0 z-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-16">
			<div class="flex items-center">
				<a href="/" class="font-title text-2xl text-gold">King Law Firm</a>
			</div>

			<!-- Desktop Navigation -->
			<div class="hidden md:flex items-center space-x-8">
				<a href="/" class="hover:text-gold transition-colors">Home</a>
				
				<div class="relative group">
					<button class="hover:text-gold transition-colors flex items-center">
						Services
						<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					<div class="absolute left-0 mt-2 w-64 bg-background border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
						<a href="/services/personal-injury" class="block px-4 py-2 hover:bg-muted">Personal Injury & Civil Suits</a>
						<a href="/services/business-intellectual-property" class="block px-4 py-2 hover:bg-muted">Business & Intellectual Property</a>
						<a href="/services/family-estate-law" class="block px-4 py-2 hover:bg-muted">Family & Estate Law</a>
						<a href="/services/criminal-defense" class="block px-4 py-2 hover:bg-muted">Criminal Defense</a>
					</div>
				</div>

				<a href="/about" class="hover:text-gold transition-colors">About</a>
				<a href="/contact" class="hover:text-gold transition-colors">Contact</a>

				{#if user}
					<a 
						href={user.role === 'lawyer' || user.role === 'admin' ? '/dashboard/lawyer' : '/dashboard/client'} 
						class="bg-gold hover:bg-gold-dark text-black px-4 py-2 rounded-md font-semibold transition-colors"
					>
						Dashboard
					</a>
				{:else}
					<a href="/login" class="hover:text-gold transition-colors">Login</a>
					<a href="/contact" class="bg-gold hover:bg-gold-dark text-black px-4 py-2 rounded-md font-semibold transition-colors">
						Schedule Consultation
					</a>
				{/if}
			</div>

			<!-- Mobile menu button -->
			<button 
				class="md:hidden"
				onclick={() => mobileMenuOpen = !mobileMenuOpen}
				aria-label="Toggle mobile menu"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Mobile Navigation -->
	{#if mobileMenuOpen}
		<div class="md:hidden border-t border-border">
			<div class="px-2 pt-2 pb-3 space-y-1">
				<a href="/" class="block px-3 py-2 hover:bg-muted rounded-md">Home</a>
				<div class="px-3 py-2 font-semibold">Services</div>
				<a href="/services/personal-injury" class="block px-6 py-2 hover:bg-muted rounded-md">Personal Injury</a>
				<a href="/services/business-intellectual-property" class="block px-6 py-2 hover:bg-muted rounded-md">Business & IP</a>
				<a href="/services/family-estate-law" class="block px-6 py-2 hover:bg-muted rounded-md">Family & Estate</a>
				<a href="/services/criminal-defense" class="block px-6 py-2 hover:bg-muted rounded-md">Criminal Defense</a>
				<a href="/about" class="block px-3 py-2 hover:bg-muted rounded-md">About</a>
				<a href="/contact" class="block px-3 py-2 hover:bg-muted rounded-md">Contact</a>
				{#if user}
					<a 
						href={user.role === 'lawyer' ? '/dashboard/lawyer' : '/dashboard/client'}
						class="block px-3 py-2 bg-gold text-black rounded-md font-semibold"
					>
						Dashboard
					</a>
				{:else}
					<a href="/login" class="block px-3 py-2 hover:bg-muted rounded-md">Login</a>
				{/if}
			</div>
		</div>
	{/if}
</nav>
