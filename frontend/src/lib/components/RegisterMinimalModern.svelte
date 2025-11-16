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
	let fieldErrors: Record<string, string> = {};
	let loading = false;
	let name = '';
	let email = '';
	let password = '';
	let selectedRole: 'owner' | 'funeral_director' = 'owner';

	// Props to receive form data from server
	interface Props {
		form?: {
			message?: string;
			field?: string;
		};
	}
	
	let { form }: Props = $props();

	// Handle server-side validation errors
	$effect(() => {
		if (form?.message) {
			if (form.field) {
				// Field-specific error
				fieldErrors = { [form.field]: form.message };
				error = null;
			} else {
				// General error
				error = form.message;
				fieldErrors = {};
			}
		}
	});

	const theme = getTheme('minimal');

	let currentStep = $state('');
	let progress = $state(0);

	const handleRegister: SubmitFunction = ({ formData }) => {
		// Prevent double submission
		if (loading) {
			return async () => {};
		}
		
		loading = true;
		error = null;
		fieldErrors = {}; // Clear field errors on new submission
		currentStep = 'Verifying security...';
		progress = 10;

		return async ({ result, update }) => {
			// Execute reCAPTCHA before processing result
			const recaptchaAction = selectedRole === 'owner' 
				? RECAPTCHA_ACTIONS.REGISTER_OWNER 
				: RECAPTCHA_ACTIONS.REGISTER_FUNERAL_DIRECTOR;
			const recaptchaToken = await executeRecaptcha(recaptchaAction);
			
			if (!recaptchaToken) {
				error = 'Security verification failed. Please try again.';
				loading = false;
				currentStep = '';
				progress = 0;
				await update({ reset: false });
				return;
			}

			// We need to resubmit with reCAPTCHA token
			if (result.type === 'failure' && !formData.get('recaptchaToken')) {
				// Resubmit with reCAPTCHA token
				formData.append('recaptchaToken', recaptchaToken);
				currentStep = 'Creating your account...';
				progress = 30;
				
				const form = document.querySelector('form') as HTMLFormElement;
				if (form) {
					form.requestSubmit();
				}
				return;
			}
			
			if (result.type === 'success' && result.data?.customToken) {
				try {
					// Navigate to session page with token for better UX
					currentStep = 'Setting up your account...';
					progress = 80;
					
					// Use SvelteKit navigation to session page
					// Funeral directors go to complete their profile, owners go directly to profile
					const redirectUrl = selectedRole === 'owner' 
						? `/auth/session?token=${result.data.customToken}&redirect=profile`
						: `/auth/session?token=${result.data.customToken}&redirect=register/funeral-director`;
					
					currentStep = 'Redirecting...';
					progress = 100;
					
					// Small delay for visual feedback
					setTimeout(async () => {
						await goto(redirectUrl, { replaceState: true });
					}, 500);
					
				} catch (err: any) {
					error = err.message;
					loading = false;
					currentStep = '';
					progress = 0;
				}
			} else if (result.type === 'failure') {
				// Handle field-specific errors
				if (result.data?.field && result.data?.message) {
					fieldErrors = { [result.data.field]: result.data.message };
					error = null;
				} else {
					error = result.data?.message ?? 'Registration failed.';
					fieldErrors = {};
				}
				loading = false;
				currentStep = '';
				progress = 0;
			} else if (result.type === 'error') {
				error = result.error.message;
				loading = false;
				currentStep = '';
				progress = 0;
			}
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
				Join Tributestream to create meaningful memorial experiences
			</p>
		</div>

		<Card theme="minimal" class="p-8">
			<form class="space-y-6" method="POST" action="?/{selectedRole === 'owner' ? 'registerOwner' : 'registerFuneralDirector'}" use:enhance={handleRegister}>
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
							class={fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
						/>
						{#if fieldErrors.name}
							<p class="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
						{/if}
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
							class={fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
						/>
						{#if fieldErrors.email}
							<p class="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
						{/if}
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
							class={fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
						/>
						{#if fieldErrors.password}
							<p class="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
						{/if}
					</div>

					<!-- Role Selection -->
					<div>
						<label class="block text-sm font-medium {theme.text} mb-3">
							I want to:
						</label>
						<div class="space-y-3">
							<label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {selectedRole === 'owner' ? 'border-[#3B82F6] bg-blue-500/5' : 'border-gray-300'}">
								<input
									type="radio"
									name="role"
									value="owner"
									bind:group={selectedRole}
									class="sr-only"
								/>
								<div class="flex items-center space-x-3">
									<div class="w-4 h-4 rounded-full border-2 flex items-center justify-center {selectedRole === 'owner' ? 'border-[#3B82F6] bg-blue-500' : 'border-gray-300'}">
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
							
							<label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {selectedRole === 'funeral_director' ? 'border-[#3B82F6] bg-blue-500/5' : 'border-gray-300'}">
								<input
									type="radio"
									name="role"
									value="funeral_director"
									bind:group={selectedRole}
									class="sr-only"
								/>
								<div class="flex items-center space-x-3">
									<div class="w-4 h-4 rounded-full border-2 flex items-center justify-center {selectedRole === 'funeral_director' ? 'border-[#3B82F6] bg-blue-500' : 'border-gray-300'}">
										{#if selectedRole === 'funeral_director'}
											<div class="w-2 h-2 rounded-full bg-white"></div>
										{/if}
									</div>
									<div>
										<div class="font-medium text-gray-900">Create and manage memorials</div>
										<div class="text-sm text-gray-600">Register as funeral director</div>
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
					{#if loading && currentStep}
						<!-- Progress indicator -->
						<div class="mb-4">
							<p class="text-sm text-slate-600 mb-2">{currentStep}</p>
							<div class="w-full bg-slate-200 rounded-full h-2">
								<div 
									class="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] h-2 rounded-full transition-all duration-500 ease-out"
									style="width: {progress}%"
								></div>
							</div>
						</div>
					{/if}
					
					<Button
						type="submit"
						disabled={loading}
						theme="minimal"
						class="w-full {loading ? 'opacity-75' : ''}"
					>
						{#if loading}
							<div class="flex items-center justify-center">
								<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
								{currentStep || 'Creating Account...'}
							</div>
						{:else}
							Create Account
						{/if}
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
					<div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
						🔒
					</div>
					<span>Secure</span>
				</div>
				<div class="flex flex-col items-center">
					<div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
						📱
					</div>
					<span>Mobile Ready</span>
				</div>
				<div class="flex flex-col items-center">
					<div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
						💝
					</div>
					<span>Compassionate</span>
				</div>
			</div>
		</div>
	</div>
</div>
