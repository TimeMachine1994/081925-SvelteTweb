<script lang="ts">
	import { enhance } from '$app/forms';
	import LiveUrlPreview from '$lib/components/LiveUrlPreview.svelte';

	console.log('🎯 Funeral Director Registration form initializing');

	let { form }: { form?: { error?: any; success?: boolean } } = $props();

	// Form state using Svelte 5 runes
	let lovedOneName = $state('');
	let familyContactName = $state('');
	let familyContactEmail = $state('');
	let familyContactPhone = $state('');
	let directorName = $state('');
	let directorEmail = $state('');
	let funeralHomeName = $state('');
	let locationName = $state('');
	let locationAddress = $state('');
	let memorialDate = $state('');
	let memorialTime = $state('');
	let contactPreference = $state('email');
	let additionalNotes = $state('');

	console.log('📝 Form state initialized with runes');

	// Form validation
	let validationErrors = $state<string[]>([]);

	function validateForm() {
		console.log('🔍 Validating form...');
		const errors: string[] = [];

		if (!lovedOneName.trim()) errors.push('Loved one\'s name is required');
		if (!familyContactName.trim()) errors.push('Family contact name is required');
		if (!familyContactEmail.trim()) errors.push('Family contact email is required');
		if (!familyContactPhone.trim()) errors.push('Family contact phone is required');
		if (!directorName.trim()) errors.push('Director name is required');
		if (!directorEmail.trim()) errors.push('Director email is required');
		if (!funeralHomeName.trim()) errors.push('Funeral home name is required');

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (familyContactEmail && !emailRegex.test(familyContactEmail)) {
			errors.push('Family contact email must be valid');
		}
		if (directorEmail && !emailRegex.test(directorEmail)) {
			errors.push('Director email must be valid');
		}

		validationErrors = errors;
		console.log('✅ Validation complete. Errors:', errors.length);
		return errors.length === 0;
	}

	function handleSubmit(event: SubmitEvent) {
		console.log('📤 Form submission started');
		if (!validateForm()) {
			event.preventDefault();
			console.log('❌ Form validation failed, preventing submission');
		} else {
			console.log('✅ Form validation passed, proceeding with submission');
		}
	}
</script>

<div class="registration-container">
	<div class="registration-card">
		<div class="form-header">
			<h1 class="form-title">🎯 Funeral Service Coordination Form</h1>
			<p class="form-description">
				Create a comprehensive memorial service coordination account. This form will collect all the details needed to set up a beautiful memorial page and coordinate with family members.
			</p>
		</div>

		<form method="POST" use:enhance onsubmit={handleSubmit}>
			<!-- Live URL Preview Section -->
			<section class="form-section">
				<LiveUrlPreview bind:lovedOneName />
			</section>

			<!-- Family Information Section -->
			<section class="form-section">
				<div class="section-header">
					<h2 class="section-title">👨‍👩‍👧‍👦 Family Information</h2>
					<p class="section-description">Primary family contact details for coordination</p>
				</div>
				
				<div class="form-grid">
					<div class="form-group">
						<label for="lovedOneName" class="form-label">
							Loved One's Full Name *
						</label>
						<input
							id="lovedOneName"
							name="lovedOneName"
							type="text"
							required
							bind:value={lovedOneName}
							class="form-input"
							placeholder="Enter the full name of the deceased"
						/>
					</div>

					<div class="form-group">
						<label for="familyContactName" class="form-label">
							Family Contact Name *
						</label>
						<input
							id="familyContactName"
							name="familyContactName"
							type="text"
							required
							bind:value={familyContactName}
							class="form-input"
							placeholder="Primary family contact person"
						/>
					</div>

					<div class="form-group">
						<label for="familyContactEmail" class="form-label">
							Family Contact Email *
						</label>
						<input
							id="familyContactEmail"
							name="familyContactEmail"
							type="email"
							required
							bind:value={familyContactEmail}
							class="form-input"
							placeholder="family@example.com"
						/>
					</div>

					<div class="form-group">
						<label for="familyContactPhone" class="form-label">
							Family Contact Phone *
						</label>
						<input
							id="familyContactPhone"
							name="familyContactPhone"
							type="tel"
							required
							bind:value={familyContactPhone}
							class="form-input"
							placeholder="(555) 123-4567"
						/>
					</div>
				</div>
			</section>

			<!-- Funeral Director & Service Details Section -->
			<section class="form-section">
				<div class="section-header">
					<h2 class="section-title">🏛️ Funeral Director & Service Details</h2>
					<p class="section-description">Professional service provider information</p>
				</div>
				
				<div class="form-grid">
					<div class="form-group">
						<label for="directorName" class="form-label">
							Director Name *
						</label>
						<input
							id="directorName"
							name="directorName"
							type="text"
							required
							bind:value={directorName}
							class="form-input"
							placeholder="Your full name"
						/>
					</div>

					<div class="form-group">
						<label for="directorEmail" class="form-label">
							Director Email *
						</label>
						<input
							id="directorEmail"
							name="directorEmail"
							type="email"
							required
							bind:value={directorEmail}
							class="form-input"
							placeholder="director@funeralhome.com"
						/>
					</div>

					<div class="form-group span-2">
						<label for="funeralHomeName" class="form-label">
							Funeral Home Name *
						</label>
						<input
							id="funeralHomeName"
							name="funeralHomeName"
							type="text"
							required
							bind:value={funeralHomeName}
							class="form-input"
							placeholder="Name of your funeral home"
						/>
					</div>
				</div>
			</section>

			<!-- Memorial Location Section -->
			<section class="form-section">
				<div class="section-header">
					<h2 class="section-title">📍 Memorial Location & Schedule</h2>
					<p class="section-description">Service venue and timing details</p>
				</div>
				
				<div class="form-grid">
					<div class="form-group">
						<label for="locationName" class="form-label">
							Location Name
						</label>
						<input
							id="locationName"
							name="locationName"
							type="text"
							bind:value={locationName}
							class="form-input"
							placeholder="Church, funeral home, or venue name"
						/>
					</div>

					<div class="form-group">
						<label for="locationAddress" class="form-label">
							Location Address
						</label>
						<input
							id="locationAddress"
							name="locationAddress"
							type="text"
							bind:value={locationAddress}
							class="form-input"
							placeholder="Full address of the service"
						/>
					</div>

					<div class="form-group">
						<label for="memorialDate" class="form-label">
							Memorial Date
						</label>
						<input
							id="memorialDate"
							name="memorialDate"
							type="date"
							bind:value={memorialDate}
							class="form-input"
						/>
					</div>

					<div class="form-group">
						<label for="memorialTime" class="form-label">
							Memorial Time
						</label>
						<input
							id="memorialTime"
							name="memorialTime"
							type="time"
							bind:value={memorialTime}
							class="form-input"
						/>
					</div>
				</div>
			</section>

			<!-- Contact Preference Section -->
			<section class="form-section">
				<div class="section-header">
					<h2 class="section-title">📞 Contact Preference</h2>
					<p class="section-description">How should we contact the family for updates?</p>
				</div>
				
				<div class="radio-group">
					<label class="radio-option">
						<input
							type="radio"
							name="contactPreference"
							value="email"
							bind:group={contactPreference}
							class="radio-input"
						/>
						<span class="radio-label">📧 Email (Recommended)</span>
					</label>
					
					<label class="radio-option">
						<input
							type="radio"
							name="contactPreference"
							value="phone"
							bind:group={contactPreference}
							class="radio-input"
						/>
						<span class="radio-label">📱 Phone</span>
					</label>
				</div>
			</section>

			<!-- Additional Notes Section -->
			<section class="form-section">
				<div class="section-header">
					<h2 class="section-title">📝 Additional Notes</h2>
					<p class="section-description">Any special requests or additional information</p>
				</div>
				
				<div class="form-group">
					<label for="additionalNotes" class="form-label">
						Additional Notes
					</label>
					<textarea
						id="additionalNotes"
						name="additionalNotes"
						bind:value={additionalNotes}
						class="form-textarea"
						rows="4"
						placeholder="Any special requests, cultural considerations, or additional information that would help us serve the family better..."
					></textarea>
				</div>
			</section>

			<!-- Validation Errors -->
			{#if validationErrors.length > 0}
				<div class="error-section">
					<h3 class="error-title">❌ Please correct the following errors:</h3>
					<ul class="error-list">
						{#each validationErrors as error}
							<li class="error-item">{error}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Form Messages -->
			{#if form?.error}
				<div class="form-message error-message">
					<span class="message-icon">❌</span>
					<span class="message-text">{form.error}</span>
				</div>
			{/if}
			
			{#if form?.success}
				<div class="form-message success-message">
					<span class="message-icon">✅</span>
					<span class="message-text">
						Success! Please check your email for your login details and memorial setup information.
					</span>
				</div>
			{/if}

			<!-- Submit Button -->
			<div class="submit-section">
				<button type="submit" class="submit-button">
					🚀 Submit Form & Create Account
				</button>
				<p class="submit-note">
					By submitting this form, you'll create your funeral director account and set up the memorial page. 
					Login credentials will be sent to your email address.
				</p>
			</div>
		</form>
	</div>
</div>

<style>
	/* Main Container */
	.registration-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 2rem 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.registration-card {
		background: white;
		border-radius: 16px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		max-width: 800px;
		width: 100%;
		overflow: hidden;
	}

	/* Form Header */
	.form-header {
		background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
		color: white;
		padding: 2rem;
		text-align: center;
	}

	.form-title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		line-height: 1.2;
	}

	.form-description {
		font-size: 1.1rem;
		margin: 0;
		opacity: 0.9;
		line-height: 1.5;
	}

	/* Form Sections */
	.form-section {
		padding: 2rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.form-section:last-child {
		border-bottom: none;
	}

	.section-header {
		margin-bottom: 1.5rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.section-description {
		font-size: 0.95rem;
		color: #6b7280;
		margin: 0;
		line-height: 1.5;
	}

	/* Form Grid */
	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group.span-2 {
		grid-column: 1 / -1;
	}

	/* Form Inputs */
	.form-label {
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
		font-size: 0.95rem;
	}

	.form-input,
	.form-textarea {
		padding: 0.75rem 1rem;
		border: 2px solid #d1d5db;
		border-radius: 8px;
		font-size: 1rem;
		transition: all 0.2s ease;
		background: white;
	}

	.form-input:focus,
	.form-textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-textarea {
		resize: vertical;
		min-height: 100px;
		font-family: inherit;
	}

	/* Radio Groups */
	.radio-group {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.radio-option {
		display: flex;
		align-items: center;
		cursor: pointer;
		padding: 0.75rem 1rem;
		border: 2px solid #d1d5db;
		border-radius: 8px;
		transition: all 0.2s ease;
		background: white;
	}

	.radio-option:hover {
		border-color: #3b82f6;
		background: #f8fafc;
	}

	.radio-input {
		margin-right: 0.5rem;
		accent-color: #3b82f6;
	}

	.radio-label {
		font-weight: 500;
		color: #374151;
	}

	/* Error Handling */
	.error-section {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: 1rem;
		margin: 1rem 2rem;
	}

	.error-title {
		color: #dc2626;
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.error-list {
		margin: 0;
		padding-left: 1.5rem;
		color: #dc2626;
	}

	.error-item {
		margin-bottom: 0.25rem;
	}

	/* Form Messages */
	.form-message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 8px;
		margin: 1rem 2rem;
		font-weight: 500;
	}

	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
	}

	.success-message {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #166534;
	}

	.message-icon {
		font-size: 1.25rem;
	}

	/* Submit Section */
	.submit-section {
		padding: 2rem;
		background: #f9fafb;
		text-align: center;
	}

	.submit-button {
		background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
		color: white;
		border: none;
		padding: 1rem 2rem;
		border-radius: 12px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		min-width: 250px;
	}

	.submit-button:hover {
		background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
		transform: translateY(-1px);
		box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
	}

	.submit-button:active {
		transform: translateY(0);
	}

	.submit-note {
		margin: 1rem 0 0 0;
		color: #6b7280;
		font-size: 0.9rem;
		line-height: 1.5;
		max-width: 500px;
		margin-left: auto;
		margin-right: auto;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.registration-container {
			padding: 1rem;
		}

		.form-header {
			padding: 1.5rem;
		}

		.form-title {
			font-size: 1.75rem;
		}

		.form-description {
			font-size: 1rem;
		}

		.form-section {
			padding: 1.5rem;
		}

		.form-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.radio-group {
			flex-direction: column;
			gap: 1rem;
		}

		.submit-section {
			padding: 1.5rem;
		}

		.submit-button {
			width: 100%;
			min-width: auto;
		}
	}

	@media (max-width: 480px) {
		.form-header {
			padding: 1rem;
		}

		.form-title {
			font-size: 1.5rem;
		}

		.form-section {
			padding: 1rem;
		}

		.form-message {
			margin: 1rem;
		}

		.error-section {
			margin: 1rem;
		}
	}
</style>