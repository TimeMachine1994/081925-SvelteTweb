<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';

	let username = $state('');
	let password = $state('');
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		
		const result = await authStore.login(username, password);
		
		if (result.success) {
			goto(authStore.dashboardRoute);
		} else {
			error = result.error || 'Login failed';
		}
	}
</script>

<div class="min-h-screen flex">
	<!-- Left Panel - Branding -->
	<div class="hidden lg:flex lg:w-1/2 bg-king-blue items-center justify-center p-12">
		<div class="max-w-md">
			<div class="flex items-center gap-3 mb-8">
				<span class="text-gold text-4xl">♔</span>
				<span class="font-title text-3xl text-white">King Law</span>
			</div>
			<h2 class="font-title text-4xl text-white leading-tight mb-6">
				Welcome to Your<br/>Client Portal
			</h2>
			<p class="text-white/60 text-lg leading-relaxed">
				Access your case documents, communicate with your attorney, and stay updated on your legal matters—all in one secure place.
			</p>
		</div>
	</div>

	<!-- Right Panel - Login Form -->
	<div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
		<div class="w-full max-w-md">
			<!-- Mobile Logo -->
			<div class="lg:hidden flex items-center gap-3 mb-8 justify-center">
				<span class="text-gold text-3xl">♔</span>
				<span class="font-title text-2xl text-king-blue">King Law</span>
			</div>

			<div class="mb-8">
				<p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">Client Portal</p>
				<h1 class="font-title text-4xl text-king-blue mb-2">Sign In</h1>
				<p class="text-gray-500">Enter your credentials to access your account</p>
			</div>

			<form onsubmit={handleSubmit} class="space-y-6">
				{#if error}
					<div class="bg-red-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-r-lg">
						{error}
					</div>
				{/if}

				<div>
					<label for="username" class="block text-sm font-medium text-king-blue mb-2">Username</label>
					<input
						type="text"
						id="username"
						bind:value={username}
						required
						class="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-king-blue mb-2">Password</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						required
						class="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none"
					/>
				</div>

				<button
					type="submit"
					disabled={authStore.loading}
					class="w-full bg-king-blue hover:bg-king-blue-light text-white font-semibold py-4 px-6 rounded-lg transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{authStore.loading ? 'Signing in...' : 'Sign In'}
				</button>

				<p class="text-center text-gray-500">
					Don't have an account?
					<a href="/register" class="text-gold hover:text-gold-dark font-semibold">Create one</a>
				</p>
			</form>

			<div class="mt-12 pt-8 border-t border-gray-100 text-center">
				<a href="/" class="text-gray-400 hover:text-king-blue transition-colors text-sm">
					← Back to Homepage
				</a>
			</div>
		</div>
	</div>
</div>
