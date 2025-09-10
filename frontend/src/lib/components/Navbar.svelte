<script lang="ts">
	import { user } from '$lib/auth';
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
				<a href="/for-funeral-directors" class="hover:text-gray-300 transition-colors font-medium">
					For Funeral Directors
				</a>
			</li>
			<li>
				<a href="/contact" class="hover:text-gray-300 transition-colors font-medium">
					Contact Us
				</a>
			</li>
			<li>
				{#if $user}
					<a
						href={$user.role === 'admin' ? '/admin' : $user.role === 'funeral_director' ? '/profile' : '/my-portal'}
						class="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-2 rounded-full font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 shadow-lg"
					>
						{#if $user.role === 'funeral_director'}
							My Profile
						{:else}
							My Portal
						{/if}
					</a>
				{:else}
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