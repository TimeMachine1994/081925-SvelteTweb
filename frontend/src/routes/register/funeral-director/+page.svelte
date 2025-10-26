<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import {
		Heart,
		User,
		Mail,
		Calendar,
		Clock,
		CheckCircle,
		Building2,
		Users,
		AlertCircle
	} from 'lucide-svelte';
	import { Button } from '$lib/ui';
	import type { PageData } from './$types';

	let {
		data,
		form
	}: { 
		data: PageData;
		form?: { error?: any; success?: boolean; message?: string; memorialSlug?: string; familyEmail?: string } 
	} = $props();

	// Form state using Svelte 5 runes
	let lovedOneName = $state('');
	let familyEmail = $state('');
	let serviceDate = $state('');
	let serviceTime = $state('');

	// UI states
	let isSubmitting = $state(false);

	// Get today's date for minimum date input
	const today = new Date().toISOString().split('T')[0];

	// Form validation
	function validateForm() {
		if (!lovedOneName.trim()) return 'Loved one\'s name is required';
		if (!familyEmail.trim()) return 'Family email is required';
		if (!serviceDate) return 'Service date is required';
		if (!serviceTime) return 'Service time is required';
		
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(familyEmail)) return 'Please enter a valid email address';
		
		return null;
	}

	// Handle form submission
	function handleSubmit(event: SubmitEvent) {
		const error = validateForm();
		if (error) {
			event.preventDefault();
			alert(error);
			return;
		}
	}
</script>

<svelte:head>
	<title>Quick Family Registration - Tributestream</title>
	<meta
		name="description"
		content="Quickly register families and create memorial pages for funeral services. Professional tools for funeral directors."
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-yellow-50 to-white">
	<div class="container mx-auto px-4 py-12">
		<!-- Header -->
		<div class="mb-12 text-center">
			<div
				class="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-yellow-600 to-amber-600"
			>
				<Heart class="h-8 w-8 text-white" />
			</div>
			<h1 class="mb-4 text-4xl font-bold text-gray-900">Quick Family Registration</h1>
			<p class="mx-auto max-w-2xl text-xl text-gray-600">
				Quickly register families and create memorial pages for their loved ones. This will create their account, memorial page, and send them login credentials via email.
			</p>
			
			<!-- User Info Display -->
			{#if data.user}
				<div class="mt-6 inline-flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-800">
					{#if data.user.role === 'funeral_director'}
						<Building2 class="h-4 w-4" />
						<span>Logged in as: {data.funeralDirectorProfile?.companyName || 'Funeral Director'}</span>
					{:else if data.user.role === 'admin'}
						<Users class="h-4 w-4" />
						<span>Logged in as: Administrator</span>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Form -->
		<div class="mx-auto max-w-4xl">
			<div class="rounded-2xl bg-white p-8 shadow-xl">
				<!-- Success Message -->
				{#if form?.success}
					<div class="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
						<div class="flex items-center gap-3">
							<CheckCircle class="h-6 w-6 text-green-600" />
							<div class="flex-1">
								<h3 class="text-lg font-semibold text-green-800">Memorial Created Successfully!</h3>
								<p class="text-sm text-green-700 mt-1">{form.message}</p>
								{#if form.memorialSlug}
									<div class="mt-3 space-y-2">
										<p class="text-sm text-green-700">
											<strong>Memorial URL:</strong> 
											<a href="/{form.memorialSlug}" target="_blank" class="underline hover:text-green-800">
												tributestream.com/{form.memorialSlug}
											</a>
										</p>
										{#if form.familyEmail}
											<p class="text-sm text-green-700">
												<strong>Family Email:</strong> {form.familyEmail}
											</p>
										{/if}
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				<form
					method="POST"
					onsubmit={handleSubmit}
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update({ reset: false });
							isSubmitting = false;
						};
					}}
				>
					<div class="space-y-6">
						<div class="mb-8 text-center">
							<h2 class="mb-2 text-2xl font-bold text-gray-900">Family & Service Information</h2>
							<p class="text-gray-600">Enter the family and service details to create their memorial page.</p>
						</div>

						<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div>
								<label for="lovedOneName" class="mb-2 block text-sm font-medium text-gray-700">
									<Heart class="mr-1 inline h-4 w-4" />
									Loved One's Name *
								</label>
								<input
									type="text"
									id="lovedOneName"
									name="lovedOneName"
									bind:value={lovedOneName}
									required
									class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
									placeholder="John Smith"
								/>
							</div>

							<div>
								<label for="familyEmail" class="mb-2 block text-sm font-medium text-gray-700">
									<Mail class="mr-1 inline h-4 w-4" />
									Family Email Address *
								</label>
								<input
									type="email"
									id="familyEmail"
									name="familyEmail"
									bind:value={familyEmail}
									required
									class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
									placeholder="family@email.com"
								/>
							</div>

							<div>
								<label for="serviceDate" class="mb-2 block text-sm font-medium text-gray-700">
									<Calendar class="mr-1 inline h-4 w-4" />
									Service Date *
								</label>
								<input
									type="date"
									id="serviceDate"
									name="serviceDate"
									bind:value={serviceDate}
									min={today}
									required
									class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
								/>
							</div>

							<div>
								<label for="serviceTime" class="mb-2 block text-sm font-medium text-gray-700">
									<Clock class="mr-1 inline h-4 w-4" />
									Service Time *
								</label>
								<input
									type="time"
									id="serviceTime"
									name="serviceTime"
									bind:value={serviceTime}
									required
									class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
								/>
							</div>
						</div>

						<!-- Information Box -->
						<div class="border-t pt-6">
							<div class="rounded-lg bg-blue-50 p-4">
								<div class="flex items-start gap-3">
									<AlertCircle class="h-5 w-5 text-blue-600 mt-0.5" />
									<div class="flex-1">
										<h3 class="text-sm font-semibold text-blue-800">What happens next?</h3>
										<ul class="mt-2 text-sm text-blue-700 space-y-1">
											<li>• Family account will be created with temporary password</li>
											<li>• Memorial page will be set up with the loved one's information</li>
											<li>• Welcome email with login credentials will be sent to the family</li>
											<li>• Family will have full control to customize their memorial</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					</div>

					{#if form?.error}
						<div class="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
							<div class="flex items-center gap-3">
								<AlertCircle class="h-5 w-5 text-red-600" />
								<p class="text-red-800">{form.error}</p>
							</div>
						</div>
					{/if}

					<!-- Submit Button -->
					<div class="mt-8 flex justify-center border-t pt-6">
						<Button
							type="submit"
							variant="role"
							role="funeral_director"
							size="lg"
							rounded="lg"
							disabled={isSubmitting}
							loading={isSubmitting}
						>
							{isSubmitting ? 'Creating Memorial...' : 'Create Family Memorial'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
