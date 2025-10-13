<script lang="ts">
	import { signInWithCustomToken } from 'firebase/auth';
	import { auth } from '$lib/firebase';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Input, Card, Toast } from '$lib/components/minimal-modern';

	let error: string | null = null;
	let loading = false;
	let email = '';
	let password = '';

	const theme = getTheme('minimal');

	const handleRegister: SubmitFunction = () => {
		loading = true;
		error = null;

		return async ({ result, update }) => {
			if (result.type === 'success' && result.data?.customToken) {
				try {
					// Step 2: Sign in with the custom token
					const userCredential = await signInWithCustomToken(auth, result.data.customToken);
					const user = userCredential.user;

					// Step 3: Get the ID token
					const idToken = await user.getIdToken();

					// Step 4: Call the session API endpoint
					const sessionResponse = await fetch('/api/session', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ idToken })
					});

					if (!sessionResponse.ok) {
						throw new Error('Failed to create session');
					}

					// Step 5: Redirect to the home page
					await goto('/');
				} catch (err: any) {
					error = err.message;
				}
			} else if (result.type === 'failure') {
				error = result.data?.message ?? 'Registration failed.';
			} else if (result.type === 'error') {
				error = result.error.message;
			}

			loading = false;
			// We call update to avoid a full-page reload and apply the action result.
			// Since we handle navigation manually with `goto`, we don't need SvelteKit to do anything else.
			await update({ reset: false });
		};
	};
</script>

<div class="{theme.root} min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8" style="font-family: {theme.font.body}">
	<!-- Background decoration -->
	<div class="{theme.hero.decoration}" aria-hidden="true"></div>
	
	<div class="relative z-10 w-full max-w-md">
		<div class="text-center mb-8">
			<h2 class="text-3xl font-extrabold {theme.hero.heading}" style="font-family: {theme.font.heading}">
				Create your account
			</h2>
			<p class="mt-2 text-sm {theme.hero.sub}">
				Join TributeStream to create meaningful memorial experiences
			</p>
		</div>

		<Card theme="minimal" class="p-8">
			<form class="space-y-6" method="POST" action="?/register" use:enhance={handleRegister}>
				<div class="space-y-4">
					<div>
						<label for="email-address" class="block text-sm font-medium {theme.text} mb-1">
							Email address
						</label>
						<Input
							id="email-address"
							name="email"
							type="email"
							autocomplete="email"
							required
							placeholder="Enter your email"
							theme="minimal"
							bind:value={email}
						/>
					</div>
					
					<div>
						<label for="password" class="block text-sm font-medium {theme.text} mb-1">
							Password
						</label>
						<Input
							id="password"
							name="password"
							type="password"
							autocomplete="new-password"
							required
							placeholder="Create a secure password"
							theme="minimal"
							bind:value={password}
						/>
					</div>
				</div>

				{#if error}
					<Toast theme="minimal" message={error} type="error" />
				{/if}

				<div class="pt-4">
					<Button
						type="submit"
						disabled={loading}
						theme="minimal"
						class="w-full"
					>
						{loading ? 'Creating Account...' : 'Create Account'}
					</Button>
				</div>

				<div class="text-center">
					<p class="text-sm {theme.hero.sub}">
						Already have an account? 
						<a href="/login" class="{theme.link} font-medium">Sign in</a>
					</p>
				</div>
			</form>
		</Card>

		<!-- Additional features section -->
		<div class="mt-8 text-center">
			<div class="grid grid-cols-3 gap-4 text-xs {theme.hero.sub}">
				<div class="flex flex-col items-center">
					<div class="w-8 h-8 rounded-full bg-[#D5BA7F]/20 flex items-center justify-center mb-2">
						🔒
					</div>
					<span>Secure</span>
				</div>
				<div class="flex flex-col items-center">
					<div class="w-8 h-8 rounded-full bg-[#D5BA7F]/20 flex items-center justify-center mb-2">
						📱
					</div>
					<span>Mobile Ready</span>
				</div>
				<div class="flex flex-col items-center">
					<div class="w-8 h-8 rounded-full bg-[#D5BA7F]/20 flex items-center justify-center mb-2">
						💝
					</div>
					<span>Compassionate</span>
				</div>
			</div>
		</div>
	</div>
</div>
