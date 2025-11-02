<script lang="ts">
	import { Card, Button } from '../index.js';
	import StreamHeader from './StreamHeader.svelte';
	import OBSMethodUI from './methods/OBSMethodUI.svelte';
	import PhoneToOBSMethodUI from './methods/PhoneToOBSMethodUI.svelte';
	import PhoneToMUXMethodUI from './methods/PhoneToMUXMethodUI.svelte';
	import { colors } from '../tokens/colors.js';
	import { getSemanticSpacing } from '../tokens/spacing.js';
	import { getTextStyle } from '../tokens/typography.js';
	import type { Stream } from '$lib/types/stream';
	import { STREAMING_METHOD_INFO } from '$lib/types/streaming-methods';
	import type { StreamingMethod } from '$lib/types/streaming-methods';

	interface Props {
		stream: Stream;
		onCopy: (text: string, type: 'key' | 'url', streamId: string) => Promise<void>;
		copiedStreamKey: string | null;
		copiedRtmpUrl: string | null;
	}

	let { stream, onCopy, copiedStreamKey, copiedRtmpUrl }: Props = $props();

	// Method selection state
	let showMethodSelection = $state(!stream.methodConfigured);
	let isConfiguringMethod = $state(false);
	let configError = $state('');

	async function selectMethod(method: StreamingMethod) {
		if (isConfiguringMethod) return;

		isConfiguringMethod = true;
		configError = '';

		try {
			// Update stream with selected method
			const response = await fetch(`/api/streams/management/${stream.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					streamingMethod: method,
					methodConfigured: true 
				})
			});

			if (!response.ok) {
				throw new Error('Failed to configure streaming method');
			}

			// Reload page to show new configuration
			window.location.reload();
		} catch (error) {
			console.error('Error configuring method:', error);
			configError = 'Failed to configure streaming method. Please try again.';
			isConfiguringMethod = false;
		}
	}

	// Edit schedule modal state
	let showEditModal = $state(false);
	let editDate = $state('');
	let editTime = $state('');
	let isSaving = $state(false);
	let saveError = $state('');

	// Emergency override state
	let overrideEmbedCode = $state(stream.overrideEmbedCode || '');
	let overrideActive = $state(stream.overrideActive || false);
	let overrideNote = $state(stream.overrideNote || '');
	let isSavingOverride = $state(false);
	let overrideError = $state('');

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

	async function saveOverride() {
		isSavingOverride = true;
		overrideError = '';

		try {
			const response = await fetch(`/api/streams/management/${stream.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					overrideEmbedCode: overrideEmbedCode.trim() || null,
					overrideActive,
					overrideNote: overrideNote.trim() || null
				})
			});

			if (!response.ok) {
				throw new Error('Failed to save override');
			}

			// Success - reload page to show updated data
			window.location.reload();
		} catch (error) {
			console.error('Error saving override:', error);
			overrideError = 'Failed to save override. Please try again.';
		} finally {
			isSavingOverride = false;
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

	<!-- Emergency Override Active Indicator (Admin Only) -->
	{#if stream.overrideActive}
		<div 
			class="override-active-indicator"
			style="
				padding: {getSemanticSpacing('card', 'padding')['md']};
				background: #fef3c7;
				border-top: 1px solid {colors.border.primary};
				border-bottom: 2px solid #f59e0b;
			"
		>
			<div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
				<span style="font-size: 1.25rem;">🚨</span>
				<strong style="color: #92400e; font-size: {getTextStyle('body', 'md').fontSize};">
					Override Active
				</strong>
			</div>
			<p style="margin: 0; font-size: {getTextStyle('body', 'sm').fontSize}; color: #78350f;">
				Memorial page is showing custom embed instead of Cloudflare stream
			</p>
			{#if stream.overrideNote}
				<p style="margin: 0.5rem 0 0 0; font-size: {getTextStyle('body', 'sm').fontSize}; color: #92400e; font-style: italic;">
					Note: {stream.overrideNote}
				</p>
			{/if}
		</div>
	{/if}

	<!-- Emergency Override Section -->
	<details 
		class="override-section"
		style="
			border-top: 1px solid {colors.border.primary};
		"
	>
		<summary 
			style="
				padding: {getSemanticSpacing('card', 'padding')['md']};
				cursor: pointer;
				font-weight: 600;
				color: #d97706;
				background: #fffbeb;
				user-select: none;
			"
		>
			🚨 Emergency Embed Override
		</summary>
		
		<div 
			style="
				padding: {getSemanticSpacing('card', 'padding')['lg']};
				background: #fffbeb;
				border-top: 1px solid #fde68a;
			"
		>
			<p 
				style="
					font-size: {getTextStyle('body', 'sm').fontSize};
					color: #78350f;
					margin: 0 0 {getSemanticSpacing('component', 'md')} 0;
					line-height: 1.5;
				"
			>
				Paste a complete embed code (Vimeo, YouTube, etc.) to replace the streaming system.
				<strong style="color: #059669;">Viewers won't see any indication this is an override.</strong>
			</p>
			
			<div style="display: flex; flex-direction: column; gap: {getSemanticSpacing('component', 'md')};">
				<!-- Embed Code Textarea -->
				<div>
					<label 
						for="override-embed-{stream.id}"
						style="
							display: block;
							font-size: {getTextStyle('body', 'sm').fontSize};
							font-weight: 600;
							color: #92400e;
							margin-bottom: {getSemanticSpacing('component', 'xs')};
						"
					>
						Embed Code
					</label>
					<textarea
						id="override-embed-{stream.id}"
						bind:value={overrideEmbedCode}
						placeholder='<iframe src="https://player.vimeo.com/video/123456789" width="640" height="360" frameborder="0" allowfullscreen></iframe>'
						rows="6"
						style="
							width: 100%;
							font-family: monospace;
							font-size: 0.875rem;
							padding: 0.5rem;
							border: 1px solid #d1d5db;
							border-radius: 0.375rem;
							resize: vertical;
						"
					></textarea>
				</div>
				
				<!-- Activate Toggle -->
				<label 
					style="
						display: flex;
						align-items: center;
						gap: 0.5rem;
						cursor: pointer;
						font-size: {getTextStyle('body', 'sm').fontSize};
						color: #78350f;
					"
				>
					<input 
						type="checkbox" 
						bind:checked={overrideActive}
						style="
							width: 1.25rem;
							height: 1.25rem;
							cursor: pointer;
						"
					/>
					<strong>Activate Override</strong> (replaces normal player on memorial page)
				</label>
				
				<!-- Note Input -->
				<div>
					<label 
						for="override-note-{stream.id}"
						style="
							display: block;
							font-size: {getTextStyle('body', 'sm').fontSize};
							font-weight: 600;
							color: #92400e;
							margin-bottom: {getSemanticSpacing('component', 'xs')};
						"
					>
						Internal Note
					</label>
					<input
						id="override-note-{stream.id}"
						type="text"
						bind:value={overrideNote}
						placeholder="Why override is being used (viewers won't see this)"
						style="
							width: 100%;
							padding: 0.5rem 0.75rem;
							border: 1px solid #d1d5db;
							border-radius: 0.375rem;
							font-size: 0.875rem;
						"
					/>
				</div>
				
				{#if overrideError}
					<p style="color: {colors.error[600]}; font-size: {getTextStyle('body', 'sm').fontSize}; margin: 0;">
						{overrideError}
					</p>
				{/if}
				
				<!-- Save Button -->
				<div>
					<Button 
						variant="primary"
						onclick={saveOverride}
						disabled={isSavingOverride}
						style="background: #f59e0b; color: white;"
					>
						{isSavingOverride ? 'Saving Override...' : 'Save Override'}
					</Button>
				</div>
			</div>
		</div>
	</details>

	<!-- Method Selection or Method-Specific UI -->
	{#if showMethodSelection}
		<!-- Method Selection UI -->
		<div 
			class="method-selection"
			style="
				padding: {getSemanticSpacing('card', 'padding')['lg']};
				border-top: 1px solid {colors.border.primary};
			"
		>
			<h4 
				style="
					font-family: {getTextStyle('heading', 'h5').fontFamily};
					font-size: {getTextStyle('heading', 'h5').fontSize};
					font-weight: {getTextStyle('heading', 'h5').fontWeight};
					color: {colors.text.primary};
					margin: 0 0 {getSemanticSpacing('component', 'xs')} 0;
				"
			>
				Choose Streaming Method
			</h4>
			<p 
				style="
					font-size: {getTextStyle('body', 'sm').fontSize};
					color: {colors.text.secondary};
					margin: 0 0 {getSemanticSpacing('component', 'lg')} 0;
				"
			>
				Select how you want to stream to this memorial
			</p>

			<div 
				class="method-grid"
				style="
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
					gap: {getSemanticSpacing('component', 'md')};
				"
			>
				{#each Object.values(STREAMING_METHOD_INFO) as methodInfo}
					<button
						class="method-option"
						onclick={() => selectMethod(methodInfo.method)}
						disabled={isConfiguringMethod}
						style="
							display: flex;
							flex-direction: column;
							align-items: center;
							gap: {getSemanticSpacing('component', 'sm')};
							padding: {getSemanticSpacing('card', 'padding')['md']};
							border: 2px solid {colors.border.primary};
							border-radius: 0.75rem;
							background: {colors.background.primary};
							cursor: pointer;
							transition: all 0.2s ease;
							text-align: center;
						"
					>
						<div style="font-size: 2.5rem;">{methodInfo.icon}</div>
						<h5 
							style="
								font-family: {getTextStyle('heading', 'h6').fontFamily};
								font-size: {getTextStyle('heading', 'h6').fontSize};
								font-weight: {getTextStyle('heading', 'h6').fontWeight};
								color: {colors.text.primary};
								margin: 0;
							"
						>
							{methodInfo.title}
						</h5>
						<p 
							style="
								font-size: {getTextStyle('body', 'sm').fontSize};
								color: {colors.text.secondary};
								margin: 0;
							"
						>
							{methodInfo.description}
						</p>
					</button>
				{/each}
			</div>

			{#if configError}
				<p 
					style="
						color: {colors.error[600]};
						font-size: {getTextStyle('body', 'sm').fontSize};
						margin-top: {getSemanticSpacing('component', 'md')};
					"
				>
					{configError}
				</p>
			{/if}
		</div>
	{:else}
		<!-- Method-Specific UI -->
		{#if stream.streamingMethod === 'obs'}
			<OBSMethodUI 
				{stream} 
				{onCopy} 
				{copiedStreamKey} 
				{copiedRtmpUrl} 
			/>
		{:else if stream.streamingMethod === 'phone-to-obs'}
			<PhoneToOBSMethodUI 
				{stream} 
				{onCopy} 
				{copiedStreamKey} 
				{copiedRtmpUrl} 
			/>
		{:else if stream.streamingMethod === 'phone-to-mux'}
			<PhoneToMUXMethodUI {stream} />
		{/if}
	{/if}

	<!-- Action Buttons at Bottom -->
	<div 
		class="stream-actions-footer"
		style="
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: {getSemanticSpacing('component', 'md')};
			padding: {getSemanticSpacing('card', 'padding')['lg']};
			border-top: 1px solid {colors.border.primary};
			background: {colors.background.secondary};
		"
	>
		<Button
			variant="outline"
			size="lg"
			fullWidth
			onclick={() => console.log('Phone to MUX clicked')}
		>
			Phone to MUX
		</Button>
		
		<Button
			variant="outline"
			size="lg"
			fullWidth
			onclick={() => console.log('Phone to OBS clicked')}
		>
			Phone to OBS
		</Button>
		
		<Button
			variant="outline"
			size="lg"
			fullWidth
			onclick={() => console.log('OBS clicked')}
		>
			OBS
		</Button>
	</div>
</Card>

<!-- Edit Schedule Modal -->
{#if showEditModal}
	<div class="modal-overlay" onclick={() => showEditModal = false} role="presentation">
		<div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="modal-title">
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

	.method-option:hover:not(:disabled) {
		border-color: var(--color-primary-500, #6366f1);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.method-option:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
