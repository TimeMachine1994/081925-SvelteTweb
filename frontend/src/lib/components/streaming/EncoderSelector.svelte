<!--
ENCODER SELECTOR COMPONENT

Dropdown to select and assign an encoder to a memorial
Used by Funeral Directors on their dashboard
-->
<script lang="ts">
	import { Radio, ChevronDown, X, Check } from 'lucide-svelte';

	interface Props {
		memorialId: string;
		currentEncoderId?: string | null;
		currentEncoderName?: string | null;
		onAssigned?: (encoderId: string, encoderName: string) => void;
		onUnassigned?: () => void;
	}

	let { 
		memorialId, 
		currentEncoderId = null, 
		currentEncoderName = null,
		onAssigned,
		onUnassigned 
	}: Props = $props();

	interface AvailableEncoder {
		id: string;
		name: string;
		description?: string;
		deviceType?: string;
		location?: string;
	}

	let availableEncoders = $state<AvailableEncoder[]>([]);
	let loading = $state(false);
	let showDropdown = $state(false);
	let fetchError = $state<string | null>(null);

	// Fetch available encoders when dropdown opens
	async function fetchAvailableEncoders() {
		if (availableEncoders.length > 0) return; // Already fetched

		loading = true;
		fetchError = null;

		try {
			const response = await fetch('/api/encoders/available');
			if (response.ok) {
				const data = await response.json();
				availableEncoders = data.encoders || [];
			} else {
				fetchError = 'Failed to load encoders';
			}
		} catch (err) {
			console.error('Error fetching encoders:', err);
			fetchError = 'Failed to load encoders';
		} finally {
			loading = false;
		}
	}

	function toggleDropdown() {
		showDropdown = !showDropdown;
		if (showDropdown) {
			fetchAvailableEncoders();
		}
	}

	async function selectEncoder(encoder: AvailableEncoder) {
		if (encoder.id === currentEncoderId) {
			showDropdown = false;
			return;
		}

		if (!confirm(`Assign "${encoder.name}" to this memorial?`)) {
			return;
		}

		loading = true;
		try {
			const response = await fetch(`/api/memorials/${memorialId}/encoder/assign`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ encoderId: encoder.id })
			});

			if (response.ok) {
				currentEncoderId = encoder.id;
				currentEncoderName = encoder.name;
				showDropdown = false;
				onAssigned?.(encoder.id, encoder.name);
			} else {
				const error = await response.json();
				alert(`Failed to assign encoder: ${error.message || 'Unknown error'}`);
			}
		} catch (err) {
			console.error('Error assigning encoder:', err);
			alert('Failed to assign encoder');
		} finally {
			loading = false;
		}
	}

	async function unassignEncoder() {
		if (!confirm('Unassign this encoder from the memorial?')) {
			return;
		}

		loading = true;
		try {
			const response = await fetch(`/api/memorials/${memorialId}/encoder/assign`, {
				method: 'DELETE'
			});

			if (response.ok) {
				currentEncoderId = null;
				currentEncoderName = null;
				availableEncoders = []; // Force refetch
				onUnassigned?.();
			} else {
				const error = await response.json();
				alert(`Failed to unassign encoder: ${error.message || 'Unknown error'}`);
			}
		} catch (err) {
			console.error('Error unassigning encoder:', err);
			alert('Failed to unassign encoder');
		} finally {
			loading = false;
		}
	}

	function getDeviceIcon(type?: string) {
		switch (type) {
			case 'phone': return '📱';
			case 'hardware': return '🎥';
			case 'obs': return '💻';
			default: return '📡';
		}
	}
</script>

<div class="encoder-selector">
	<label class="selector-label">
		<Radio class="label-icon" />
		Encoder
	</label>

	{#if currentEncoderId}
		<!-- Currently assigned encoder -->
		<div class="assigned-encoder">
			<div class="encoder-info">
				<span class="encoder-name">📡 {currentEncoderName || 'Unknown Encoder'}</span>
			</div>
			<div class="encoder-actions">
				<button 
					class="change-btn" 
					onclick={toggleDropdown}
					disabled={loading}
				>
					Change
				</button>
				<button 
					class="unassign-btn" 
					onclick={unassignEncoder}
					disabled={loading}
					title="Unassign encoder"
				>
					<X class="h-4 w-4" />
				</button>
			</div>
		</div>
	{:else}
		<!-- No encoder assigned -->
		<button 
			class="select-btn" 
			onclick={toggleDropdown}
			disabled={loading}
		>
			<span>Select Encoder</span>
			<ChevronDown class="h-4 w-4" />
		</button>
	{/if}

	<!-- Dropdown -->
	{#if showDropdown}
		<div class="dropdown-overlay" onclick={() => (showDropdown = false)}></div>
		<div class="dropdown">
			{#if loading}
				<div class="dropdown-loading">Loading encoders...</div>
			{:else if fetchError}
				<div class="dropdown-error">{fetchError}</div>
			{:else if availableEncoders.length === 0}
				<div class="dropdown-empty">
					<p>No encoders available</p>
					<small>Contact admin to add encoders</small>
				</div>
			{:else}
				{#each availableEncoders as encoder (encoder.id)}
					<button 
						class="encoder-option"
						class:selected={encoder.id === currentEncoderId}
						onclick={() => selectEncoder(encoder)}
					>
						<div class="option-icon">{getDeviceIcon(encoder.deviceType)}</div>
						<div class="option-content">
							<span class="option-name">{encoder.name}</span>
							{#if encoder.location}
								<span class="option-location">{encoder.location}</span>
							{/if}
						</div>
						{#if encoder.id === currentEncoderId}
							<Check class="option-check h-4 w-4" />
						{/if}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style>
	.encoder-selector {
		position: relative;
	}

	.selector-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: #4a5568;
		text-transform: uppercase;
		margin-bottom: 0.5rem;
	}

	.label-icon {
		width: 1rem;
		height: 1rem;
	}

	.assigned-encoder {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #f0fff4;
		border: 1px solid #9ae6b4;
		border-radius: 0.5rem;
		padding: 0.75rem;
	}

	.encoder-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.encoder-name {
		font-weight: 500;
		color: #276749;
	}

	.encoder-actions {
		display: flex;
		gap: 0.5rem;
	}

	.change-btn {
		padding: 0.375rem 0.75rem;
		background: white;
		border: 1px solid #9ae6b4;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		color: #276749;
		cursor: pointer;
	}

	.change-btn:hover {
		background: #c6f6d5;
	}

	.unassign-btn {
		padding: 0.375rem;
		background: white;
		border: 1px solid #fc8181;
		border-radius: 0.375rem;
		color: #c53030;
		cursor: pointer;
	}

	.unassign-btn:hover {
		background: #fed7d7;
	}

	.select-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.75rem;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: #4a5568;
		cursor: pointer;
	}

	.select-btn:hover {
		border-color: #cbd5e0;
		background: #f7fafc;
	}

	.select-btn:disabled,
	.change-btn:disabled,
	.unassign-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.dropdown-overlay {
		position: fixed;
		inset: 0;
		z-index: 40;
	}

	.dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 0.25rem;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		z-index: 50;
		max-height: 300px;
		overflow-y: auto;
	}

	.dropdown-loading,
	.dropdown-error,
	.dropdown-empty {
		padding: 1rem;
		text-align: center;
		color: #718096;
		font-size: 0.875rem;
	}

	.dropdown-error {
		color: #c53030;
	}

	.dropdown-empty small {
		display: block;
		margin-top: 0.25rem;
		color: #a0aec0;
	}

	.encoder-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem;
		background: none;
		border: none;
		border-bottom: 1px solid #f7fafc;
		cursor: pointer;
		text-align: left;
	}

	.encoder-option:last-child {
		border-bottom: none;
	}

	.encoder-option:hover {
		background: #f7fafc;
	}

	.encoder-option.selected {
		background: #ebf8ff;
	}

	.option-icon {
		font-size: 1.25rem;
	}

	.option-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.option-name {
		font-weight: 500;
		color: #2d3748;
	}

	.option-location {
		font-size: 0.75rem;
		color: #718096;
	}

	.option-check {
		color: #3182ce;
	}
</style>
