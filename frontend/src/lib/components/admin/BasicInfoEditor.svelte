<script lang="ts">
	interface Memorial {
		id: string;
		lovedOneName: string;
		fullSlug: string;
		createdAt: string | null;
		updatedAt: string | null;
		birthDate?: string | null;
		deathDate?: string | null;
		familyContactName?: string | null;
		familyContactEmail?: string | null;
		familyContactPhone?: string | null;
		familyContactPreference?: 'phone' | 'email' | null;
		additionalNotes?: string | null;
	}

	interface Props {
		memorial: Memorial;
		formatDate: (isoString: string | null) => string;
		onUpdate?: () => void | Promise<void>;
	}

	let { memorial, formatDate, onUpdate }: Props = $props();

	let isEditing = $state(false);
	let isSaving = $state(false);
	let error = $state<string | null>(null);
	let success = $state<string | null>(null);

	let lovedOneName = $state(memorial.lovedOneName || '');
	let birthDate = $state(memorial.birthDate || '');
	let deathDate = $state(memorial.deathDate || '');
	let familyContactName = $state(memorial.familyContactName || '');
	let familyContactEmail = $state(memorial.familyContactEmail || '');
	let familyContactPhone = $state(memorial.familyContactPhone || '');
	let familyContactPreference = $state<'phone' | 'email' | ''>(
		memorial.familyContactPreference || ''
	);
	let additionalNotes = $state(memorial.additionalNotes || '');

	function resetFromMemorial() {
		lovedOneName = memorial.lovedOneName || '';
		birthDate = memorial.birthDate || '';
		deathDate = memorial.deathDate || '';
		familyContactName = memorial.familyContactName || '';
		familyContactEmail = memorial.familyContactEmail || '';
		familyContactPhone = memorial.familyContactPhone || '';
		familyContactPreference = memorial.familyContactPreference || '';
		additionalNotes = memorial.additionalNotes || '';
	}

	function startEditing() {
		resetFromMemorial();
		error = null;
		isEditing = true;
	}

	function cancelEditing() {
		resetFromMemorial();
		error = null;
		isEditing = false;
	}

	async function save() {
		isSaving = true;
		error = null;
		success = null;

		try {
			const response = await fetch(`/api/admin/memorials/${memorial.id}/basic-info`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					lovedOneName,
					birthDate: birthDate || null,
					deathDate: deathDate || null,
					familyContactName,
					familyContactEmail,
					familyContactPhone,
					familyContactPreference: familyContactPreference || null,
					additionalNotes
				})
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.message || 'Failed to save basic information');
			}

			success = 'Basic information saved successfully!';
			isEditing = false;
			await onUpdate?.();

			setTimeout(() => {
				success = null;
			}, 3000);
		} catch (err: any) {
			error = err.message || 'Failed to save basic information';
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="card">
	<div class="section-header">
		<h2>📋 Basic Information</h2>
		{#if !isEditing}
			<button class="edit-btn-small" onclick={startEditing}>✏️ Edit</button>
		{/if}
	</div>

	{#if success}
		<div class="success-message">{success}</div>
	{/if}
	{#if error}
		<div class="error-message">{error}</div>
	{/if}

	{#if isEditing}
		<div class="display-form">
			<div class="form-group">
				<label for="loved-one-name">Loved One's Name *</label>
				<input
					id="loved-one-name"
					type="text"
					bind:value={lovedOneName}
					maxlength="200"
					disabled={isSaving}
					required
				/>
				<p class="help-text">
					This never changes the memorial's URL. Use "Change URL" below if the link itself needs to
					change.
				</p>
			</div>

			<div class="grid">
				<div class="form-group">
					<label for="birth-date">Birth Date</label>
					<input id="birth-date" type="date" bind:value={birthDate} disabled={isSaving} />
				</div>
				<div class="form-group">
					<label for="death-date">Death Date</label>
					<input id="death-date" type="date" bind:value={deathDate} disabled={isSaving} />
				</div>
			</div>

			<div class="grid">
				<div class="form-group">
					<label for="family-contact-name">Family Contact Name</label>
					<input
						id="family-contact-name"
						type="text"
						bind:value={familyContactName}
						maxlength="200"
						disabled={isSaving}
					/>
				</div>
				<div class="form-group">
					<label for="family-contact-preference">Preferred Contact Method</label>
					<select
						id="family-contact-preference"
						bind:value={familyContactPreference}
						disabled={isSaving}
					>
						<option value="">Not set</option>
						<option value="email">Email</option>
						<option value="phone">Phone</option>
					</select>
				</div>
				<div class="form-group">
					<label for="family-contact-email">Family Contact Email</label>
					<input
						id="family-contact-email"
						type="email"
						bind:value={familyContactEmail}
						disabled={isSaving}
					/>
				</div>
				<div class="form-group">
					<label for="family-contact-phone">Family Contact Phone</label>
					<input
						id="family-contact-phone"
						type="tel"
						bind:value={familyContactPhone}
						maxlength="40"
						disabled={isSaving}
					/>
				</div>
			</div>

			<div class="form-group">
				<label for="additional-notes">Additional Notes</label>
				<textarea
					id="additional-notes"
					bind:value={additionalNotes}
					rows="4"
					maxlength="2000"
					disabled={isSaving}
					placeholder="Any special instructions or additional information..."
				></textarea>
				<p class="help-text char-count">{additionalNotes.length}/2000</p>
			</div>

			<div class="form-actions">
				<button class="primary-btn" onclick={save} disabled={isSaving || !lovedOneName.trim()}>
					{isSaving ? '⏳ Saving...' : '💾 Save Basic Information'}
				</button>
				<button onclick={cancelEditing} disabled={isSaving}>Cancel</button>
			</div>
		</div>
	{:else}
		<div class="grid">
			<div><strong>ID:</strong> {memorial.id}</div>
			<div><strong>Loved One:</strong> {memorial.lovedOneName}</div>
			<div><strong>Slug:</strong> {memorial.fullSlug}</div>
			<div><strong>Birth Date:</strong> {memorial.birthDate || 'Not set'}</div>
			<div><strong>Death Date:</strong> {memorial.deathDate || 'Not set'}</div>
			<div><strong>Created:</strong> {formatDate(memorial.createdAt)}</div>
			<div><strong>Updated:</strong> {formatDate(memorial.updatedAt)}</div>
		</div>
		<div class="contact-grid grid">
			<div>
				<strong>Family Contact:</strong>
				{#if memorial.familyContactName}
					{memorial.familyContactName}
				{:else}
					<em>not set</em>
				{/if}
			</div>
			<div><strong>Email:</strong> {memorial.familyContactEmail || 'Not set'}</div>
			<div><strong>Phone:</strong> {memorial.familyContactPhone || 'Not set'}</div>
			<div><strong>Prefers:</strong> {memorial.familyContactPreference || 'Not set'}</div>
		</div>
		{#if memorial.additionalNotes}
			<div class="notes-block">
				<strong>Additional Notes:</strong>
				<p>{memorial.additionalNotes}</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}
	h2 {
		font-size: 1.25rem;
		margin: 0 0 1rem 0;
	}
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.section-header h2 {
		margin: 0;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
	}
	.contact-grid {
		margin-top: 0.75rem;
	}
	.notes-block {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}
	.notes-block p {
		white-space: pre-wrap;
		color: #4a5568;
		margin: 0.5rem 0 0 0;
	}
	.form-group {
		margin-bottom: 1rem;
	}
	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #4a5568;
		font-size: 0.875rem;
	}
	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-family: inherit;
	}
	.form-group textarea {
		resize: vertical;
	}
	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3182ce;
		box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
	}
	.form-group input:disabled,
	.form-group select:disabled,
	.form-group textarea:disabled {
		background: #edf2f7;
		cursor: not-allowed;
	}
	.help-text {
		margin: 0.375rem 0 0 0;
		font-size: 0.8125rem;
		color: #718096;
	}
	.char-count {
		text-align: right;
	}
	.form-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1rem;
	}
	button {
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
	}
	button:hover {
		background: #f7fafc;
	}
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	button.primary-btn {
		background: #3182ce;
		color: white;
		border-color: #3182ce;
		font-weight: 600;
	}
	button.primary-btn:hover {
		background: #2c5282;
	}
	button.edit-btn-small {
		background: #3182ce;
		color: white;
		border-color: #3182ce;
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
	}
	button.edit-btn-small:hover {
		background: #2c5282;
	}
	.success-message {
		padding: 0.75rem 1rem;
		background: #c6f6d5;
		color: #22543d;
		border-radius: 0.375rem;
		margin-bottom: 1rem;
	}
	.error-message {
		padding: 0.75rem 1rem;
		background: #fed7d7;
		color: #742a2a;
		border-radius: 0.375rem;
		margin-bottom: 1rem;
	}
</style>
