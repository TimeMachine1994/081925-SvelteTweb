<script lang="ts">
	import { enhance } from '$app/forms';
	import LiveUrlPreview from '$lib/components/LiveUrlPreview.svelte';
	import { page } from '$app/stores';
	import { Button } from '$lib/ui';
	import { CheckCircle, Package, Calendar, Sparkles } from 'lucide-svelte';
	import { executeRecaptcha, RECAPTCHA_ACTIONS } from '$lib/utils/recaptcha';
	import { dev } from '$app/environment';

	console.log('🎯 Event Registration form initializing');

	let { form }: { form?: { error?: any; field?: string; success?: boolean } } = $props();

	// Pre-fill eventName from URL parameter
	let eventName = $state($page.url.searchParams.get('name') || '');
	let selectedPackage = $state($page.url.searchParams.get('package') || '');
	let name = $state('');
	let email = $state('');
	let phone = $state('');
	
	// Submission state for double-click prevention
	let isSubmitting = $state(false);
	let recaptchaToken = $state('');

	console.log('📝 Form state initialized with runes');

	// Form validation
	let validationErrors = $state<string[]>([]);
	let fieldErrors = $state<Record<string, string>>({});

	// Handle server-side validation errors
	$effect(() => {
		if (form?.error) {
			if (form.field) {
				// Field-specific error
				fieldErrors = { [form.field]: form.error };
				validationErrors = [];
			} else {
				// General error - clear field errors
				fieldErrors = {};
			}
		}
	});

	// Client-side validation function
	function validateFormFields(): boolean {
		const errors: string[] = [];

		if (!eventName.trim()) errors.push("Event name is required");
		if (!name.trim()) errors.push('Your name is required');
		if (!email.trim()) errors.push('Your email is required');

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (email && !emailRegex.test(email)) {
			errors.push('Your email must be valid');
		}

		validationErrors = errors;
		return errors.length === 0;
	}
</script>

<div class="registration-container">
	<div class="registration-card">
		<div class="form-header">
			<div class="flex items-center justify-center mb-4">
				<div class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600">
					<Sparkles class="h-8 w-8 text-white" />
				</div>
			</div>
			<h1 class="form-title">Create Your Event</h1>
			<p class="form-description">
				Enter your event details to create a beautiful celebration page and start streaming.
			</p>
		</div>

		<!-- Package Selection Banner -->
		{#if selectedPackage}
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
				<div class="flex items-center space-x-3">
					<div class="flex-shrink-0">
						<CheckCircle class="h-6 w-6 text-blue-600" />
					</div>
					<div class="flex-1">
						<h3 class="text-sm font-semibold text-blue-800 capitalize">
							{selectedPackage} Package Selected
						</h3>
						<p class="text-sm text-blue-700">
							Your package has been selected. Create an event to continue.
						</p>
					</div>
					<div class="flex-shrink-0">
						<Package class="h-5 w-5 text-blue-600" />
					</div>
				</div>
			</div>
		{/if}

		<form 
			method="POST"
			use:enhance={async ({ formData, cancel }) => {
				console.log('📤 Form submission started');
				
				// Client-side validation first
				if (!validateFormFields()) {
					console.log('❌ Client-side validation failed');
					cancel();
					return;
				}

				// Prevent double submission
				if (isSubmitting) {
					console.log('⏸️ Form already submitting, ignoring duplicate submission');
					cancel();
					return;
				}

				isSubmitting = true;
				console.log('🔄 Getting reCAPTCHA token...');

				try {
					// Get reCAPTCHA token
					const token = await executeRecaptcha(RECAPTCHA_ACTIONS.REGISTER_EVENT);
					if (!token) {
						console.error('❌ Failed to get reCAPTCHA token');
						if (!dev) {
							validationErrors = ['Security verification failed. Please try again.'];
							cancel();
							return;
						}
					}
					console.log('✅ Got reCAPTCHA token');
					recaptchaToken = token;
					formData.set('recaptchaToken', token);

					// Add package if selected
					if (selectedPackage) {
						formData.set('selectedPackage', selectedPackage);
					}

					console.log('📨 Submitting form to server...');

					return async ({ result, update }) => {
						console.log('📬 Server response received:', result);
						
						if (result.type === 'success') {
							console.log('✅ Form submission successful!');
						} else if (result.type === 'failure') {
							console.log('❌ Form submission failed:', result);
							isSubmitting = false;
						} else if (result.type === 'error') {
							console.error('💥 Server error:', result);
							isSubmitting = false;
						}
						
						await update();
					};
				} catch (error) {
					console.error('💥 Error during form submission:', error);
					validationErrors = ['An error occurred. Please try again.'];
					isSubmitting = false;
					cancel();
				}
			}}
		>
			<!-- Event Name Field -->
			<div class="form-group">
				<label for="eventName" class="form-label">
					<Calendar class="inline h-4 w-4 mr-1" />
					Event Name *
				</label>
				<input
					type="text"
					id="eventName"
					name="eventName"
					bind:value={eventName}
					required
					placeholder="e.g., Sarah's 50th Birthday Celebration"
					class="form-input {fieldErrors.eventName ? 'border-red-500' : ''}"
					disabled={isSubmitting}
				/>
				<LiveUrlPreview name={eventName} />
				{#if fieldErrors.eventName}
					<p class="form-error">{fieldErrors.eventName}</p>
				{/if}
			</div>

			<!-- Your Name Field -->
			<div class="form-group">
				<label for="name" class="form-label">Your Name *</label>
				<input
					type="text"
					id="name"
					name="name"
					bind:value={name}
					required
					placeholder="Enter your full name"
					class="form-input {fieldErrors.name ? 'border-red-500' : ''}"
					disabled={isSubmitting}
				/>
				{#if fieldErrors.name}
					<p class="form-error">{fieldErrors.name}</p>
				{/if}
			</div>

			<!-- Email Field -->
			<div class="form-group">
				<label for="email" class="form-label">Email Address *</label>
				<input
					type="email"
					id="email"
					name="email"
					bind:value={email}
					required
					placeholder="your.email@example.com"
					class="form-input {fieldErrors.email ? 'border-red-500' : ''}"
					disabled={isSubmitting}
				/>
				{#if fieldErrors.email}
					<p class="form-error">{fieldErrors.email}</p>
				{/if}
				<p class="form-hint">We'll send your event link and login details to this email</p>
			</div>

			<!-- Phone Field (Optional) -->
			<div class="form-group">
				<label for="phone" class="form-label">Phone Number (Optional)</label>
				<input
					type="tel"
					id="phone"
					name="phone"
					bind:value={phone}
					placeholder="(123) 456-7890"
					class="form-input {fieldErrors.phone ? 'border-red-500' : ''}"
					disabled={isSubmitting}
				/>
				{#if fieldErrors.phone}
					<p class="form-error">{fieldErrors.phone}</p>
				{/if}
				<p class="form-hint">For support and event coordination</p>
			</div>

			<!-- Validation Errors Display -->
			{#if validationErrors.length > 0}
				<div class="error-container">
					<ul class="error-list">
						{#each validationErrors as error}
							<li>{error}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Submit Button -->
			<div class="form-actions">
				<Button
					type="submit"
					disabled={isSubmitting}
					class="submit-button bg-blue-500 hover:bg-blue-600 text-white"
				>
					{#if isSubmitting}
						<div class="inline-flex items-center">
							<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
							Creating Event...
						</div>
					{:else}
						<div class="inline-flex items-center">
							<Sparkles class="h-5 w-5 mr-2" />
							Create Event Page
						</div>
					{/if}
				</Button>
			</div>

			<p class="form-footer-note">
				By creating an event, you agree to our Terms of Service and Privacy Policy.
			</p>
		</form>

		<!-- Features List -->
		<div class="features-list">
			<h3 class="features-title">What's Included:</h3>
			<ul class="features-items">
				<li class="feature-item">
					<CheckCircle class="h-5 w-5 text-blue-500 mr-2" />
					<span>Custom event page with your unique link</span>
				</li>
				<li class="feature-item">
					<CheckCircle class="h-5 w-5 text-blue-500 mr-2" />
					<span>Professional HD livestreaming</span>
				</li>
				<li class="feature-item">
					<CheckCircle class="h-5 w-5 text-blue-500 mr-2" />
					<span>Photo galleries and digital guestbook</span>
				</li>
				<li class="feature-item">
					<CheckCircle class="h-5 w-5 text-blue-500 mr-2" />
					<span>Unlimited viewers worldwide</span>
				</li>
				<li class="feature-item">
					<CheckCircle class="h-5 w-5 text-blue-500 mr-2" />
					<span>Recording available after the event</span>
				</li>
			</ul>
		</div>
	</div>
</div>

<style>
	.registration-container {
		min-height: 100vh;
		background: linear-gradient(to bottom, #f0f9ff, #ffffff);
		padding: 2rem 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.registration-card {
		max-width: 600px;
		width: 100%;
		background: white;
		border-radius: 1rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		padding: 2.5rem;
	}

	.form-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.form-title {
		font-size: 2rem;
		font-weight: bold;
		color: #1e293b;
		margin-bottom: 0.75rem;
	}

	.form-description {
		color: #64748b;
		font-size: 1rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-label {
		display: block;
		font-weight: 600;
		color: #334155;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	.form-input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.5rem;
		font-size: 1rem;
		transition: all 0.2s;
	}

	.form-input:focus {
		outline: none;
		border-color: #3b82f6;
		ring: 2px;
		ring-color: rgba(59, 130, 246, 0.2);
	}

	.form-input:disabled {
		background-color: #f1f5f9;
		cursor: not-allowed;
	}

	.form-hint {
		font-size: 0.75rem;
		color: #64748b;
		margin-top: 0.25rem;
	}

	.form-error {
		font-size: 0.75rem;
		color: #ef4444;
		margin-top: 0.25rem;
	}

	.error-container {
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.error-list {
		list-style: disc;
		margin-left: 1.25rem;
		color: #dc2626;
		font-size: 0.875rem;
	}

	.form-actions {
		margin-top: 2rem;
	}

	.submit-button {
		width: 100%;
		padding: 0.875rem 1.5rem;
		font-size: 1rem;
		font-weight: 600;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.submit-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.form-footer-note {
		text-align: center;
		font-size: 0.75rem;
		color: #94a3b8;
		margin-top: 1rem;
	}

	.features-list {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #e2e8f0;
	}

	.features-title {
		font-size: 1rem;
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 1rem;
	}

	.features-items {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.feature-item {
		display: flex;
		align-items: center;
		padding: 0.5rem 0;
		color: #475569;
		font-size: 0.875rem;
	}
</style>
