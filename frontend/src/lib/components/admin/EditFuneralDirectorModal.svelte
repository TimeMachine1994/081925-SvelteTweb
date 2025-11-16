<!--
EDIT FUNERAL DIRECTOR MODAL

Inline editing for funeral director information
Following UX principles: Clear feedback, validation
-->
<script lang="ts">
	let {
		director,
		onConfirm,
		onCancel
	}: {
		director: {
			companyName: string;
			contactPerson: string;
			email: string;
			phone: string;
			licenseNumber: string;
			website: string;
			address: { street: string; city: string; state: string; zipCode: string };
			adminNotes: string;
		};
		onConfirm: (updates: any) => void;
		onCancel: () => void;
	} = $props();

	// Editable state
	let companyName = $state(director.companyName);
	let contactPerson = $state(director.contactPerson);
	let email = $state(director.email);
	let phone = $state(director.phone);
	let licenseNumber = $state(director.licenseNumber);
	let website = $state(director.website);
	let street = $state(director.address.street);
	let city = $state(director.address.city);
	let state = $state(director.address.state);
	let zipCode = $state(director.address.zipCode);
	let adminNotes = $state(director.adminNotes);

	// Validation
	let isValid = $derived(
		companyName.trim().length > 0 &&
		contactPerson.trim().length > 0 &&
		email.trim().length > 0
	);

	function handleSubmit() {
		if (!isValid) return;

		const updates = {
			companyName,
			contactPerson,
			email,
			phone,
			licenseNumber,
			website,
			address: { street, city, state, zipCode },
			adminNotes
		};

		onConfirm(updates);
	}
</script>

<div class="modal-backdrop" onclick={onCancel}>
	<div class="modal-content" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<h2>✏️ Edit Funeral Director</h2>
			<button class="close-btn" onclick={onCancel} aria-label="Close">✕</button>
		</div>

		<div class="modal-body">
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
				<!-- Company Information -->
				<div class="form-section">
					<h3>🏢 Company Information</h3>
					<div class="form-grid">
						<div class="form-field">
							<label for="companyName">
								Company Name <span class="required">*</span>
							</label>
							<input
								id="companyName"
								type="text"
								bind:value={companyName}
								placeholder="Smith Funeral Home"
								required
							/>
						</div>

						<div class="form-field">
							<label for="contactPerson">
								Contact Person <span class="required">*</span>
							</label>
							<input
								id="contactPerson"
								type="text"
								bind:value={contactPerson}
								placeholder="John Smith"
								required
							/>
						</div>

						<div class="form-field">
							<label for="email">
								Email <span class="required">*</span>
							</label>
							<input
								id="email"
								type="email"
								bind:value={email}
								placeholder="contact@smithfuneral.com"
								required
							/>
						</div>

						<div class="form-field">
							<label for="phone">Phone</label>
							<input
								id="phone"
								type="tel"
								bind:value={phone}
								placeholder="(555) 123-4567"
							/>
						</div>

						<div class="form-field">
							<label for="licenseNumber">License Number</label>
							<input
								id="licenseNumber"
								type="text"
								bind:value={licenseNumber}
								placeholder="FD-12345"
							/>
						</div>

						<div class="form-field">
							<label for="website">Website</label>
							<input
								id="website"
								type="url"
								bind:value={website}
								placeholder="https://smithfuneral.com"
							/>
						</div>
					</div>
				</div>

				<!-- Address -->
				<div class="form-section">
					<h3>📍 Address</h3>
					<div class="form-grid">
						<div class="form-field full-width">
							<label for="street">Street Address</label>
							<input
								id="street"
								type="text"
								bind:value={street}
								placeholder="123 Main Street"
							/>
						</div>

						<div class="form-field">
							<label for="city">City</label>
							<input
								id="city"
								type="text"
								bind:value={city}
								placeholder="Springfield"
							/>
						</div>

						<div class="form-field">
							<label for="state">State</label>
							<input
								id="state"
								type="text"
								bind:value={state}
								placeholder="IL"
								maxlength="2"
							/>
						</div>

						<div class="form-field">
							<label for="zipCode">ZIP Code</label>
							<input
								id="zipCode"
								type="text"
								bind:value={zipCode}
								placeholder="62701"
							/>
						</div>
					</div>
				</div>

				<!-- Admin Notes -->
				<div class="form-section">
					<h3>📝 Admin Notes (Internal)</h3>
					<div class="form-field">
						<label for="adminNotes">Notes</label>
						<textarea
							id="adminNotes"
							bind:value={adminNotes}
							placeholder="Internal notes about this funeral director..."
							rows="4"
						></textarea>
						<span class="field-hint">These notes are only visible to administrators</span>
					</div>
				</div>
			</form>
		</div>

		<div class="modal-footer">
			<button class="btn-cancel" onclick={onCancel}>
				Cancel
			</button>
			<button 
				class="btn-save" 
				onclick={handleSubmit}
				disabled={!isValid}
			>
				💾 Save Changes
			</button>
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 0.75rem;
		max-width: 800px;
		width: 100%;
		max-height: 90vh;
		overflow: auto;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #1e293b;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #64748b;
		cursor: pointer;
		padding: 0.25rem;
		transition: color 0.2s;
	}

	.close-btn:hover {
		color: #1e293b;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.form-section {
		margin-bottom: 2rem;
	}

	.form-section:last-child {
		margin-bottom: 0;
	}

	.form-section h3 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #475569;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #e2e8f0;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-field.full-width {
		grid-column: 1 / -1;
	}

	label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #1e293b;
	}

	.required {
		color: #dc2626;
	}

	input,
	textarea {
		padding: 0.625rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		font-size: 0.9375rem;
		font-family: inherit;
		transition: border-color 0.2s;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: #3b82f6;
	}

	textarea {
		resize: vertical;
		min-height: 100px;
	}

	.field-hint {
		font-size: 0.8125rem;
		color: #64748b;
		font-style: italic;
	}

	.modal-footer {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		padding: 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-cancel,
	.btn-save {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		min-width: 120px;
	}

	.btn-cancel {
		background: white;
		color: #64748b;
		border: 1px solid #cbd5e0;
	}

	.btn-cancel:hover {
		background: #f8fafc;
		border-color: #94a3b8;
	}

	.btn-save {
		background: #3b82f6;
		color: white;
	}

	.btn-save:hover:not(:disabled) {
		background: #2563eb;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
	}

	.btn-save:disabled {
		background: #cbd5e0;
		color: #94a3b8;
		cursor: not-allowed;
		transform: none;
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.modal-footer {
			flex-direction: column-reverse;
		}

		.btn-cancel,
		.btn-save {
			width: 100%;
		}
	}
</style>
