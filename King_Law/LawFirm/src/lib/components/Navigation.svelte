<script lang="ts">
	import { page } from '$app/stores';
	import { faScaleBalanced, faGavel, faShieldHalved, faBars, faTimes, faUser, faRightToBracket } from '@fortawesome/free-solid-svg-icons';
	import Icon from './Icon.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import type { User } from '$lib/server/db/schema';

	interface Props {
		user: User | null;
	}

	let { user }: Props = $props();
	let mobileMenuOpen = $state(false);

	const services = [
		{ name: 'Personal Injury & Civil Suits', href: '/services/personal-injury' },
		{ name: 'Business & Intellectual Property', href: '/services/business-intellectual-property' },
		{ name: 'Family & Estate Law', href: '/services/family-estate-law' },
		{ name: 'Criminal Defense', href: '/services/criminal-defense' }
	];
</script>

<nav class="bg-background border-b border-gray-300 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-16">
			<!-- Logo -->
			<a href="/" class="flex items-center space-x-3">
				<Icon icon={faScaleBalanced} size="lg" class="!text-gold" />
				<span class="font-title text-2xl font-bold">King Law</span>
			</a>

			<!-- Desktop Navigation -->
			<div class="hidden md:flex items-center space-x-8">
				<!-- Services Dropdown -->
				<div class="relative group">
					<button class="flex items-center space-x-1 hover:text-gold transition-colors py-2">
						<span>Services</span>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					
					<!-- Dropdown Menu -->
					<div class="absolute left-0 mt-2 w-72 bg-white dark:bg-grey-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
						{#each services as service}
							<a
								href={service.href}
								class="block px-4 py-3 text-black dark:text-white hover:bg-gold hover:text-black transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0"
							>
								{service.name}
							</a>
						{/each}
					</div>
				</div>

				<a href="/about" class="hover:text-gold transition-colors">About</a>
				<a href="/contact" class="hover:text-gold transition-colors">Contact</a>
				
				{#if user}
					<a
						href={user.role === 'lawyer' ? '/dashboard/lawyer' : '/dashboard/client'}
						class="flex items-center space-x-2 hover:text-gold transition-colors"
					>
						<Icon icon={faUser} size="sm" />
						<span>Dashboard</span>
					</a>
					<form method="POST" action="/logout" class="inline">
						<button
							type="submit"
							class="hover:text-gold transition-colors"
						>
							Logout
						</button>
					</form>
				{:else}
					<a
						href="/login"
						class="flex items-center space-x-2 hover:text-gold transition-colors"
					>
						<Icon icon={faRightToBracket} size="sm" />
						<span>Login</span>
					</a>
				{/if}

				<ThemeToggle />

				<!-- Contact Button -->
				<a
					href="/contact"
					class="px-6 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-gold-dark transition-colors"
				>
					Free Consultation
				</a>
			</div>

			<!-- Mobile Menu Button -->
			<div class="md:hidden flex items-center space-x-4">
				<ThemeToggle />
				<button
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="p-2 rounded-lg hover:bg-secondary transition-colors"
					aria-label="Toggle menu"
				>
					{#if mobileMenuOpen}
						<Icon icon={faTimes} size="lg" />
					{:else}
						<Icon icon={faBars} size="lg" />
					{/if}
				</button>
			</div>
		</div>
	</div>

	<!-- Mobile Menu -->
	{#if mobileMenuOpen}
		<div class="md:hidden border-t border-gray-300 dark:border-gray-700 bg-background">
			<div class="px-4 py-4 space-y-3">
				<!-- Services -->
				<div class="space-y-2">
					<div class="font-semibold text-gold">Services</div>
					{#each services as service}
						<a
							href={service.href}
							class="block pl-4 py-2 hover:bg-secondary rounded-lg transition-colors"
							onclick={() => (mobileMenuOpen = false)}
						>
							{service.name}
						</a>
					{/each}
				</div>

				<a
					href="/about"
					class="block py-2 hover:text-gold transition-colors"
					onclick={() => (mobileMenuOpen = false)}
				>
					About
				</a>
				
				<a
					href="/contact"
					class="block py-2 hover:text-gold transition-colors"
					onclick={() => (mobileMenuOpen = false)}
				>
					Contact
				</a>

				{#if user}
					<a
						href={user.role === 'lawyer' ? '/dashboard/lawyer' : '/dashboard/client'}
						class="flex items-center space-x-2 py-2 hover:text-gold transition-colors"
						onclick={() => (mobileMenuOpen = false)}
					>
						<Icon icon={faUser} size="sm" />
						<span>Dashboard</span>
					</a>
				{:else}
					<a
						href="/login"
						class="flex items-center space-x-2 py-2 hover:text-gold transition-colors"
						onclick={() => (mobileMenuOpen = false)}
					>
						<Icon icon={faRightToBracket} size="sm" />
						<span>Login</span>
					</a>
				{/if}

				<a
					href="/contact"
					class="block w-full text-center px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold-dark transition-colors"
					onclick={() => (mobileMenuOpen = false)}
				>
					Free Consultation
				</a>
			</div>
		</div>
	{/if}
</nav>
