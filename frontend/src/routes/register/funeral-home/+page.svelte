<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/firebase';
	import { signInWithCustomToken, getIdToken } from 'firebase/auth';
	import { Building2, User, Mail, Phone, MapPin, FileText, Shield, Award, CheckCircle, Save, ArrowRight, Sparkles } from 'lucide-svelte';
	import { useFormAutoSave } from '$lib/composables/useFormAutoSave';

	let { form }: { form?: { error?: any; success?: boolean; message?: string; applicationId?: string } } = $props();

	// Form state using Svelte 5 runes
	let companyName = $state('');
	let contactPerson = $state('');
	let email = $state('');
	let password = $state('');
	let phone = $state('');
	let address = $state({
		street: '',
		city: '',
		state: '',
		zipCode: '',
		country: 'United States'
	});
	let website = $state('');

	// UI states
	let isSubmitting = $state(false);

	// Initialize auto-save functionality
	const autoSave = useFormAutoSave({
		storageKey: 'funeral-home-registration',
		debounceMs: 3000,
		useLocalStorage: false, // Use cookies for better persistence
		cookieExpireDays: 30,
		onSave: (data) => console.log('🏥 [AUTO-SAVE] Funeral home form data saved'),
		onLoad: (data) => {
			if (data) {
				console.log('🏥 [AUTO-SAVE] Loading saved funeral home data');
				// Restore form fields from saved data
				companyName = data.companyName || '';
				contactPerson = data.contactPerson || '';
				email = data.email || '';
				password = data.password || '';
				phone = data.phone || '';
				address = data.address || { street: '', city: '', state: '', zipCode: '', country: 'United States' };
				website = data.website || '';
			}
		}
	});

	// Auto-save form data when fields change
	$effect(() => {
		const formData = {
			companyName,
			contactPerson,
			email,
			password,
			phone,
			address,
			website
		};
		
		// Only auto-save if we have some meaningful data
		if (companyName || contactPerson || email) {
			autoSave.triggerAutoSave(formData);
		}
	});

	// Load saved data on component mount
	$effect(() => {
		autoSave.loadFromStorage();
	});

	// Check if form was successfully submitted and handle auto-login
	$effect(() => {
		if (form?.success && form?.customToken) {
			const performAutoLogin = async () => {
				isSubmitting = true;
				try {
					console.log('Custom token received, attempting auto-login...');
					const userCredential = await signInWithCustomToken(auth, form.customToken);
					const idToken = await getIdToken(userCredential.user);

					// Post the ID token to the login action to create a session
					const loginFormData = new FormData();
					loginFormData.append('idToken', idToken);

										const loginResponse = await fetch('/login?/login', {
						method: 'POST',
						body: loginFormData
					});

					if (!loginResponse.ok) {
						throw new Error('Session creation failed.');
					}

					console.log('Auto-login successful, redirecting to portal...');
					autoSave.clearStorage(); // Clear data before navigating
					window.location.href = '/my-portal'; // Use full page reload
				} catch (error) {
					console.error('Auto-login process failed:', error);
					// If auto-login fails, send user to the manual login page as a fallback
					alert('Your account was created, but we could not log you in automatically. Please log in manually.');
					await goto('/login');
				} finally {
					isSubmitting = false;
				}
			};
			performAutoLogin();
		}
	});
</script>

<svelte:head>
	<title>Register Your Funeral Home - TributeStream</title>
	<meta name="description" content="Join TributeStream's network of professional funeral directors and provide families with beautiful memorial experiences." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
	<div class="container mx-auto px-4 py-12">
		
		<!-- Header -->
		<div class="text-center mb-12">
			<div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
				<Building2 class="w-8 h-8 text-white" />
			</div>
			<h1 class="text-4xl font-bold text-gray-900 mb-4">Register Your Funeral Home</h1>
			<p class="text-xl text-gray-600 max-w-2xl mx-auto">
				Join TributeStream's network of professional funeral directors and provide families with beautiful, lasting memorial experiences.
			</p>
		</div>


		<!-- Form -->
		<div class="max-w-4xl mx-auto">
			<div class="bg-white rounded-2xl shadow-xl p-8">
				<!-- Auto-save Status Indicator -->
				{#if autoSave.hasSavedData()}
					<div class="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
						<Save class="w-4 h-4 text-green-600" />
						<div class="flex-1">
							<p class="text-sm text-green-800 font-medium">Form data auto-saved</p>
							<p class="text-xs text-green-600">
								Last saved: {autoSave.getLastSaveTime()?.toLocaleString() || 'Recently'}
							</p>
						</div>
						<button
							type="button"
							onclick={() => autoSave.clearStorage()}
							class="text-xs text-green-600 hover:text-green-800 underline"
						>
							Clear saved data
						</button>
					</div>
				{/if}<form method="POST" use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update({ reset: false });
						isSubmitting = false;
					};
				}}>
						
					<div class="space-y-6">
						<div class="text-center mb-8">
							<h2 class="text-2xl font-bold text-gray-900 mb-2">Account & Business Information</h2>
							<p class="text-gray-600">Create your account and tell us about your funeral home.</p>
						</div>
				
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label for="companyName" class="block text-sm font-medium text-gray-700 mb-2">
									<Building2 class="w-4 h-4 inline mr-1" />
									Funeral Home Name *
								</label>
								<input
									type="text"
									id="companyName"
									name="companyName"
									bind:value={companyName}
									onchange={(e) => companyName = e.currentTarget.value}
									required
									class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
									placeholder="Smith & Sons Funeral Home"
								/>
							</div>
				
							<div>
								<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
									<Shield class="w-4 h-4 inline mr-1" />
									Password *
								</label>
								<input
									type="password"
									id="password"
									name="password"
									bind:value={password}
									onchange={(e) => password = e.currentTarget.value}
									required
									minlength="6"
									class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
									placeholder="Choose a secure password"
								/>
							</div>
				
							<div>
								<label for="contactPerson" class="block text-sm font-medium text-gray-700 mb-2">
									<User class="w-4 h-4 inline mr-1" />
									Primary Contact Name *
								</label>
								<input
									type="text"
									id="contactPerson"
									name="contactPerson"
									bind:value={contactPerson}
									onchange={(e) => contactPerson = e.currentTarget.value}
									required
									class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
									placeholder="John Smith"
								/>
							</div>
				
				
							<div>
								<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
									<Mail class="w-4 h-4 inline mr-1" />
									Email Address *
								</label>
								<input
									type="email"
									id="email"
									name="email"
									bind:value={email}
									onchange={(e) => email = e.currentTarget.value}
									required
									class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
									placeholder="john@smithfuneralhome.com"
								/>
							</div>
				
							<div>
								<label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
									<Phone class="w-4 h-4 inline mr-1" />
									Phone Number *
								</label>
								<input
									type="tel"
									id="phone"
									name="phone"
									bind:value={phone}
									onchange={(e) => phone = e.currentTarget.value}
									required
									class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
									placeholder="(555) 123-4567"
								/>
							</div>
						</div>
				
						<!-- Address Section -->
						<div class="border-t pt-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
								<MapPin class="w-5 h-5 mr-2" />
								Business Address
							</h3>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div class="md:col-span-2">
									<input
										type="text"
										name="address.street"
										bind:value={address.street}
										onchange={(e) => address.street = e.currentTarget.value}
										required
										class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
										placeholder="Street Address"
									/>
								</div>
								<div>
									<input
										type="text"
										name="address.city"
										bind:value={address.city}
										onchange={(e) => address.city = e.currentTarget.value}
										required
										class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
										placeholder="City"
									/>
								</div>
								<div>
									<input
										type="text"
										name="address.state"
										bind:value={address.state}
										onchange={(e) => address.state = e.currentTarget.value}
										required
										class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
										placeholder="State"
									/>
								</div>
								<div>
									<input
										type="text"
										name="address.zipCode"
										bind:value={address.zipCode}
										onchange={(e) => address.zipCode = e.currentTarget.value}
										required
										class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
										placeholder="ZIP Code"
									/>
								</div>
								<div>
									<input
										type="text"
										name="address.country"
										bind:value={address.country}
										onchange={(e) => address.country = e.currentTarget.value}
										class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
										placeholder="Country"
									/>
								</div>
							</div>
						</div>
					</div>
				
					{#if form?.error}
						<div class="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
							<p class="text-red-800">❌ {form.error}</p>
						</div>
					{/if}
				
					<!-- Navigation Buttons -->
					<div class="flex justify-end mt-8 pt-6 border-t">
						<button
							type="submit"
							disabled={isSubmitting}
							class="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? 'Creating Account...' : 'Create Account & Get Started'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
