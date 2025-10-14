<script lang="ts">
	import { signInWithCustomToken } from 'firebase/auth';
	import { auth } from '$lib/firebase';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Input, Card, Toast } from '$lib/components/minimal-modern';
	import { executeRecaptcha, RECAPTCHA_ACTIONS } from '$lib/utils/recaptcha';

	let error: string | null = null;
	let loading = false;
	let name = '';
	let email = '';
	let password = '';
	let selectedRole: 'owner' | 'viewer' = 'owner';

	const theme = getTheme('minimal');

	const handleRegister: SubmitFunction = ({ formData }) => {
		loading = true;
		error = null;

		return async ({ result, update }) => {
			// Execute reCAPTCHA before processing result
			const recaptchaAction = selectedRole === 'owner' ? RECAPTCHA_ACTIONS.REGISTER_OWNER : RECAPTCHA_ACTIONS.REGISTER_VIEWER;
			const recaptchaToken = await executeRecaptcha(recaptchaAction);
			
			if (!recaptchaToken) {
				error = 'Security verification failed. Please try again.';
				loading = false;
				await update({ reset: false });
				return;
			}

			// We need to resubmit with reCAPTCHA token
			if (result.type === 'failure' && !formData.get('recaptchaToken')) {
				// Resubmit with reCAPTCHA token
				formData.append('recaptchaToken', recaptchaToken);
				
				const form = document.querySelector('form') as HTMLFormElement;
				if (form) {
					form.requestSubmit();
				}
				return;
			}
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
			<form class="space-y-6" method="POST" action="?/{selectedRole === 'owner' ? 'registerOwner' : 'registerViewer'}" use:enhance={handleRegister}>
				<div class="space-y-4">
					<div>
						<label for="name" class="block text-sm font-medium {theme.text} mb-1">
							Full Name
						</label>
						<Input
							id="name"
							name="name"
							type="text"
							autocomplete="name"
							required
							placeholder="Enter your full name"
							theme="minimal"
							bind:value={name}
						/>
					</div>

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

					<!-- Role Selection -->
					<div>
						<label class="block text-sm font-medium {theme.text} mb-3">
							I want to:
						</label>
						<div class="space-y-3">
							<label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {selectedRole === 'owner' ? 'border-[#D5BA7F] bg-[#D5BA7F]/5' : 'border-gray-300'}">
								<input
									type="radio"
									name="role"
									value="owner"
									bind:group={selectedRole}
									class="sr-only"
								/>
								<div class="flex items-center space-x-3">
									<div class="w-4 h-4 rounded-full border-2 flex items-center justify-center {selectedRole === 'owner' ? 'border-[#D5BA7F] bg-[#D5BA7F]' : 'border-gray-300'}">
										{#if selectedRole === 'owner'}
											<div class="w-2 h-2 rounded-full bg-white"></div>
										{/if}
									</div>
									<div>
										<div class="font-medium text-gray-900">Create a memorial for my loved one</div>
										<div class="text-sm text-gray-600">Register as memorial owner</div>
									</div>
								</div>
							</label>
							
							<label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {selectedRole === 'viewer' ? 'border-[#D5BA7F] bg-[#D5BA7F]/5' : 'border-gray-300'}">
								<input
									type="radio"
									name="role"
									value="viewer"
									bind:group={selectedRole}
									class="sr-only"
								/>
								<div class="flex items-center space-x-3">
									<div class="w-4 h-4 rounded-full border-2 flex items-center justify-center {selectedRole === 'viewer' ? 'border-[#D5BA7F] bg-[#D5BA7F]' : 'border-gray-300'}">
										{#if selectedRole === 'viewer'}
											<div class="w-2 h-2 rounded-full bg-white"></div>
										{/if}
									</div>
									<div>
										<div class="font-medium text-gray-900">View and support memorials</div>
										<div class="text-sm text-gray-600">Register as viewer</div>
									</div>
								</div>
							</label>
						</div>
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
