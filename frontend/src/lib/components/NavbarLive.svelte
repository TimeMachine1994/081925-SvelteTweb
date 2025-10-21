<script lang="ts">
	import { user } from '$lib/auth';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button } from '$lib/components/minimal-modern';
	import { Sparkles, Cake, Heart, GraduationCap, Building, Calendar, User, LogIn, LogOut, Plus } from 'lucide-svelte';

	// Mobile menu state
	let mobileMenuOpen = $state(false);
	const theme = getTheme('minimal');

	// Get user portal link
	const getUserPortalLink = (user: any) => {
		if (!user) return '/login';
		
		switch (user.role) {
			case 'admin':
				return '/admin';
			case 'funeral_director':
			case 'owner':
				return '/profile';
			default:
				return '/my-portal';
		}
	};

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	// Live-focused navigation items
	const navigationItems = [
		{ label: 'Birthdays', href: '/live/birthdays', icon: Cake },
		{ label: 'Weddings', href: '/live/weddings', icon: Heart },
		{ label: 'Graduations', href: '/live/graduations', icon: GraduationCap },
		{ label: 'Corporate Events', href: '/live/corporate', icon: Building },
		{ label: 'My Events', href: '/live/my-events', icon: Calendar }
	];
</script>

<nav class="sticky top-0 z-50 w-full shadow-lg bg-gradient-to-r from-emerald-600 to-emerald-700">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
		<!-- Logo/Title -->
		<a
			href="/live"
			class="flex items-center italic transition-colors text-white hover:text-emerald-200"
			style="font-family: {theme.font.heading}; font-size: 1.5rem; font-weight: 700;"
		>
			<Sparkles class="w-6 h-6 mr-2" />
			TributeStream Live
		</a>

		<!-- Desktop Navigation -->
		<div class="desktop-nav hidden md:block">
			<ul class="flex items-center list-none m-0 p-0 gap-8">
				{#each navigationItems as item}
					{@const IconComponent = item.icon}
					<li>
						<a
							href={item.href}
							class="nav-link flex items-center gap-2 transition-colors text-white hover:text-emerald-200 font-medium py-2"
							style="font-family: {theme.font.body}; text-decoration: none;"
						>
							<IconComponent class="w-4 h-4" />
							{item.label}
						</a>
					</li>
				{/each}
				
				<!-- Login/Logout Text Link -->
				<li>
					{#if $user}
						<a
							href="/logout"
							class="nav-link flex items-center gap-2 transition-colors text-white hover:text-emerald-200 font-medium py-2"
							style="font-family: {theme.font.body}; text-decoration: none;"
						>
							<LogOut class="w-4 h-4" />
							Logout
						</a>
					{:else}
						<a
							href="/login"
							class="nav-link flex items-center gap-2 transition-colors text-white hover:text-emerald-200 font-medium py-2"
							style="font-family: {theme.font.body}; text-decoration: none;"
						>
							<LogIn class="w-4 h-4" />
							Login
						</a>
					{/if}
				</li>
			</ul>
		</div>

		<!-- Mobile Menu Button -->
		<button
			class="mobile-menu-button md:hidden bg-transparent border-none cursor-pointer p-2 text-white"
			onclick={toggleMobileMenu}
			aria-label="Toggle navigation menu"
			aria-expanded={mobileMenuOpen}
		>
			<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				{#if mobileMenuOpen}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				{:else}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				{/if}
			</svg>
		</button>
	</div>

	<!-- Mobile Navigation Menu -->
	{#if mobileMenuOpen}
		<div class="mobile-menu md:hidden border-t shadow-lg bg-emerald-700 border-emerald-600">
			<ul class="flex flex-col list-none m-0 p-4 gap-0">
				{#each navigationItems as item}
					{@const IconComponent = item.icon}
					<li>
						<a
							href={item.href}
							class="mobile-nav-link flex items-center gap-3 transition-colors border-b text-white hover:text-emerald-200 font-medium py-4 border-emerald-600"
							style="font-family: {theme.font.body}; text-decoration: none;"
							onclick={closeMobileMenu}
						>
							<IconComponent class="w-5 h-5" />
							{item.label}
						</a>
					</li>
				{/each}
				
				<!-- Mobile Login/Logout Text Link -->
				<li>
					{#if $user}
						<a
							href="/logout"
							class="mobile-nav-link flex items-center gap-3 transition-colors border-b text-white hover:text-emerald-200 font-medium py-4 border-emerald-600"
							style="font-family: {theme.font.body}; text-decoration: none;"
							onclick={closeMobileMenu}
						>
							<LogOut class="w-5 h-5" />
							Logout
						</a>
					{:else}
						<a
							href="/login"
							class="mobile-nav-link flex items-center gap-3 transition-colors border-b text-white hover:text-emerald-200 font-medium py-4 border-emerald-600"
							style="font-family: {theme.font.body}; text-decoration: none;"
							onclick={closeMobileMenu}
						>
							<LogIn class="w-5 h-5" />
							Login
						</a>
					{/if}
				</li>
			</ul>
		</div>
	{/if}
</nav>

<style>
	/* Hover effects */
	.nav-link:hover {
		color: #a7f3d0 !important;
	}

	.mobile-nav-link:hover {
		color: #a7f3d0 !important;
	}

	/* Focus styles */
	.nav-link:focus-visible,
	.mobile-nav-link:focus-visible {
		outline: 2px solid #ffffff;
		outline-offset: 2px;
		border-radius: 0.25rem;
	}

	.mobile-menu-button:focus-visible {
		outline: 2px solid #ffffff;
		outline-offset: 2px;
		border-radius: 0.25rem;
	}

	/* Mobile menu animation */
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
