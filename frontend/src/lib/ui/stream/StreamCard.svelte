<script lang="ts">
	import { Card, Button } from '../index.js';
	import StreamHeader from './StreamHeader.svelte';
	import StreamCredentials from './StreamCredentials.svelte';
	import { colors } from '../tokens/colors.js';
	import { getSemanticSpacing } from '../tokens/spacing.js';
	import { getTextStyle } from '../tokens/typography.js';
	import type { Stream } from '$lib/types/stream';

	interface Props {
		stream: Stream;
		onCopy: (text: string, type: 'key' | 'url', streamId: string) => Promise<void>;
		copiedStreamKey: string | null;
		copiedRtmpUrl: string | null;
	}

	let { stream, onCopy, copiedStreamKey, copiedRtmpUrl }: Props = $props();

	// Edit schedule modal state
	let showEditModal = $state(false);
	let editDate = $state('');
	let editTime = $state('');
	let isSaving = $state(false);
	let saveError = $state('');

	function openEditModal() {
		if (!stream.scheduledStartTime) return;
		
		const date = new Date(stream.scheduledStartTime);
		// Format for datetime-local input: YYYY-MM-DDTHH:MM
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		
		editDate = `${year}-${month}-${day}`;
		editTime = `${hours}:${minutes}`;
		showEditModal = true;
		saveError = '';
	}

	async function saveScheduleChange() {
		if (!editDate || !editTime) {
			saveError = 'Please enter both date and time';
			return;
		}

		isSaving = true;
		saveError = '';

		try {
			const scheduledStartTime = new Date(`${editDate}T${editTime}`).toISOString();
			
			const response = await fetch(`/api/streams/management/${stream.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ scheduledStartTime })
			});

			if (!response.ok) {
				throw new Error('Failed to update schedule');
			}

			// Success - reload page to show updated data
			window.location.reload();
		} catch (error) {
			console.error('Error updating schedule:', error);
			saveError = 'Failed to update schedule. Please try again.';
		} finally {
			isSaving = false;
		}
	}
</script>


<Card 
	variant="default" 
	padding="none" 
	rounded="xl" 
	hoverable
	shadow="sm"
>
	<!-- Stream Header Section -->
	<StreamHeader {stream} onEditSchedule={openEditModal} />

	<!-- Stream Credentials Section -->
	<StreamCredentials 
		{stream} 
		{onCopy} 
		{copiedStreamKey} 
		{copiedRtmpUrl} 
	/>
</Card>

<!-- Edit Schedule Modal -->
{#if showEditModal}
	<div class="modal-overlay" onclick={() => showEditModal = false}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<h3 
				style="
					font-family: {getTextStyle('heading', 'h4').fontFamily};
					font-size: {getTextStyle('heading', 'h4').fontSize};
					font-weight: {getTextStyle('heading', 'h4').fontWeight};
					color: {colors.text.primary};
					margin-bottom: {getSemanticSpacing('component', 'lg')};
				"
			>
				Edit Scheduled Time
			</h3>

			<div style="display: flex; flex-direction: column; gap: {getSemanticSpacing('component', 'md')};">
				<!-- Date Input -->
				<div>
					<label 
						style="
							display: block;
							font-size: {getTextStyle('body', 'sm').fontSize};
							color: {colors.text.secondary};
							margin-bottom: {getSemanticSpacing('component', 'xs')};
						"
					>
						Date
					</label>
					<input 
						type="date" 
						bind:value={editDate}
						class="modal-input"
					/>
				</div>

				<!-- Time Input -->
				<div>
					<label 
						style="
							display: block;
							font-size: {getTextStyle('body', 'sm').fontSize};
							color: {colors.text.secondary};
							margin-bottom: {getSemanticSpacing('component', 'xs')};
						"
					>
						Time
					</label>
					<input 
						type="time" 
						bind:value={editTime}
						class="modal-input"
					/>
				</div>

				{#if saveError}
					<p style="color: {colors.error[600]}; font-size: {getTextStyle('body', 'sm').fontSize};">
						{saveError}
					</p>
				{/if}

				<!-- Action Buttons -->
				<div style="display: flex; gap: {getSemanticSpacing('component', 'sm')}; justify-content: flex-end;">
					<Button 
						variant="ghost" 
						onclick={() => showEditModal = false}
						disabled={isSaving}
					>
						Cancel
					</Button>
					<Button 
						variant="primary" 
						onclick={saveScheduleChange}
						disabled={isSaving}
					>
						{isSaving ? 'Saving...' : 'Save Changes'}
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
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
	}

	.modal-content {
		background: white;
		padding: 2rem;
		border-radius: 0.75rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		max-width: 28rem;
		width: 90%;
	}

	.modal-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.modal-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
</style>
