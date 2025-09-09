<script lang="ts">
	import { user } from '$lib/auth';
	import { ChevronDown, User, LogOut } from 'lucide-svelte';
	import { onMount } from 'svelte';
	
	let dropdownOpen = false;
	let dropdownElement: HTMLElement;

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
	}

	function closeDropdown() {
		dropdownOpen = false;
	}

	async function handleLogout() {
		try {
			console.log('🚪 Initiating logout...');
			closeDropdown();
			
			const response = await fetch('/logout', {
				method: 'POST',
				credentials: 'include'
			});
			
			if (response.ok || response.redirected) {
				console.log('✅ Logout successful, redirecting...');
				window.location.href = '/';
			} else {
				console.error('❌ Logout failed');
			}
		} catch (error) {
			console.error('❌ Logout error:', error);
			// Force redirect even if there's an error
			window.location.href = '/';
		}
	}

	// Close dropdown when clicking outside
	onMount(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
				closeDropdown();
			}
		}

		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<nav class="sticky top-0 z-50 w-full bg-black shadow-lg">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
		<!-- Logo/Title -->
		<a href="/" class="text-2xl font-extrabold italic text-white flex items-center hover:text-gray-200 transition-colors">
			Tributestream
		</a>

		<!-- Navigation Menu -->
		<ul class="flex items-center space-x-8 text-white">
			<li>
				<a href="/create-memorial" class="hover:text-gray-300 transition-colors font-medium">
					Create Memorial
				</a>
			</li>
			<li>
				<a href="/for-families" class="hover:text-gray-300 transition-colors font-medium">
					For Families
				</a>
			</li>
			<li>
				<a href="/for-funeral-homes" class="hover:text-gray-300 transition-colors font-medium">
					For Funeral Homes
				</a>
			</li>
			<li>
				<a href="/contact" class="hover:text-gray-300 transition-colors font-medium">
					Contact Us
				</a>
			</li>
			<li class="relative" bind:this={dropdownElement}>
				{#if $user}
					<!-- My Portal Button with Dropdown -->
					<button
						on:click={toggleDropdown}
						class="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-2 rounded-full font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 flex items-center gap-2 shadow-lg"
					>
						My Portal
						<ChevronDown class="w-4 h-4 transition-transform duration-200 {dropdownOpen ? 'rotate-180' : ''}" />
					</button>

					<!-- Dropdown Menu -->
					{#if dropdownOpen}
						<div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
							<a
								href="/profile"
								class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
								on:click={closeDropdown}
							>
								<User class="w-4 h-4 mr-3" />
								My Profile
							</a>
							<div class="border-t border-gray-100"></div>
							<button
								on:click={handleLogout}
								class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
							>
								<LogOut class="w-4 h-4 mr-3" />
								Logout
							</button>
						</div>
					{/if}
				{:else}
					<!-- Login Button -->
					<a
						href="/login"
						class="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-2 rounded-full font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 shadow-lg"
					>
						Login
					</a>
				{/if}
			</li>
		</ul>
	</div>
</nav>