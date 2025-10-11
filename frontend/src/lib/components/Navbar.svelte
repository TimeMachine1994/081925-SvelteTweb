<script lang="ts">
	import { user } from '$lib/auth';
</script>

<nav class="sticky top-0 z-50 w-full bg-black shadow-lg">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
		<!-- Logo/Title -->
		<a
			href="/"
			class="flex items-center text-2xl font-extrabold text-white italic transition-colors hover:text-gray-200"
		>
			Tributestream
		</a>

		<!-- Navigation Menu -->
		<ul class="flex items-center space-x-8 text-white">
			<li>
				<a href="/register/loved-one" class="font-medium transition-colors hover:text-gray-300">
					Create Memorial
				</a>
			</li>
			<li>
				<a href="/for-families" class="font-medium transition-colors hover:text-gray-300">
					For Families
				</a>
			</li>
			<li>
				<a href="/for-funeral-directors" class="font-medium transition-colors hover:text-gray-300">
					For Funeral Directors
				</a>
			</li>
			<li>
				<a href="/contact" class="font-medium transition-colors hover:text-gray-300">
					Contact Us
				</a>
			</li>
			<li>
				{#if $user}
					<a
						href={$user.role === 'admin'
							? '/admin'
							: $user.role === 'funeral_director' || $user.role === 'owner'
								? '/profile'
								: '/my-portal'}
						class="rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 px-6 py-2 font-semibold text-black shadow-lg transition-all duration-200 hover:from-yellow-500 hover:to-yellow-700"
					>
						{#if $user.role === 'funeral_director' || $user.role === 'owner'}
							My Profile
						{:else}
							My Portal
						{/if}
					</a>
				{:else}
					<a
						href="/login"
						class="rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 px-6 py-2 font-semibold text-black shadow-lg transition-all duration-200 hover:from-yellow-500 hover:to-yellow-700"
					>
						Login
					</a>
				{/if}
			</li>
		</ul>
	</div>
</nav>
