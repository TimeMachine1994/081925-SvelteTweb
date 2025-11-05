<script lang="ts">
	import { Card, Button } from '../index.js';
	import { colors } from '../tokens/colors.js';
	import { getSemanticSpacing } from '../tokens/spacing.js';
	import { getTextStyle } from '../tokens/typography.js';
	import { STREAMING_METHOD_INFO } from '$lib/types/streaming-methods';
	import type { StreamingMethod } from '$lib/types/streaming-methods';

	interface Props {
		memorialId: string;
		onMethodSelect?: (method: StreamingMethod) => void;
	}

	let { memorialId, onMethodSelect }: Props = $props();

	let isCreating = $state(false);
	let createError = $state('');

	async function createStreamWithMethod(method: StreamingMethod) {
		if (isCreating) return;

		isCreating = true;
		createError = '';

		try {
			// Call parent callback if provided
			if (onMethodSelect) {
				onMethodSelect(method);
				return;
			}

			// Default: Create stream via API
			const response = await fetch(`/api/memorials/${memorialId}/streams`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: `New ${STREAMING_METHOD_INFO[method].title} Stream`,
					streamingMethod: method
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to create stream');
			}

			// Success - reload page to show new stream
			window.location.reload();
		} catch (error) {
			console.error('Error creating stream:', error);
			createError = error instanceof Error ? error.message : 'Failed to create stream. Please try again.';
			isCreating = false;
		}
	}
</script>

<Card 
	variant="default" 
	padding="none" 
	rounded="xl" 
	shadow="md"
	style="border: 2px dashed {colors.border.primary};"
>
	<!-- Header Section -->
	<div 
		style="
			padding: {getSemanticSpacing('card', 'padding')['lg']};
			text-align: center;
			background: linear-gradient(to bottom, {colors.background.primary}, {colors.background.secondary});
			border-bottom: 1px solid {colors.border.primary};
		"
	>
		<div style="font-size: 3rem; margin-bottom: {getSemanticSpacing('component', 'sm')};">🎥</div>
		<h3 
			style="
				font-family: {getTextStyle('heading', 'h4').fontFamily};
				font-size: {getTextStyle('heading', 'h4').fontSize};
				font-weight: {getTextStyle('heading', 'h4').fontWeight};
				color: {colors.text.primary};
				margin: 0 0 {getSemanticSpacing('component', 'xs')} 0;
			"
		>
			Create New Stream
		</h3>
		<p 
			style="
				font-size: {getTextStyle('body', 'md').fontSize};
				color: {colors.text.secondary};
				margin: 0;
				line-height: 1.5;
			"
		>
			Choose your streaming method below
		</p>
	</div>

	<!-- Three Streaming Method Buttons -->
	<div 
		class="method-grid"
		style="
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: {getSemanticSpacing('component', 'lg')};
			padding: {getSemanticSpacing('card', 'padding')['xl']};
		"
	>
		<!-- Phone to MUX Button -->
		<button
			class="method-button"
			onclick={() => createStreamWithMethod('phone-to-mux')}
			disabled={isCreating}
			style="
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: {getSemanticSpacing('component', 'md')};
				padding: {getSemanticSpacing('card', 'padding')['xl']};
				border: 2px solid {colors.border.primary};
				border-radius: 1rem;
				background: {colors.background.primary};
				cursor: pointer;
				transition: all 0.2s ease;
				text-align: center;
				position: relative;
				overflow: hidden;
			"
		>
			<div class="method-icon" style="font-size: 3.5rem;">📱</div>
			<div style="z-index: 1;">
				<h4 
					style="
						font-family: {getTextStyle('heading', 'h5').fontFamily};
						font-size: {getTextStyle('heading', 'h5').fontSize};
						font-weight: {getTextStyle('heading', 'h5').fontWeight};
						color: {colors.text.primary};
						margin: 0 0 {getSemanticSpacing('component', 'xs')} 0;
					"
				>
					Phone to MUX
				</h4>
				<p 
					style="
						font-size: {getTextStyle('body', 'sm').fontSize};
						color: {colors.text.secondary};
						margin: 0 0 {getSemanticSpacing('component', 'sm')} 0;
						line-height: 1.5;
					"
				>
					Simple phone streaming with dual recording
				</p>
				<div 
					class="method-badge"
					style="
						display: inline-block;
						padding: 0.25rem 0.75rem;
						background: {colors.success[50]};
						color: {colors.success[700]};
						border-radius: 9999px;
						font-size: 0.75rem;
						font-weight: 600;
					"
				>
					✨ Easiest
				</div>
			</div>
		</button>

		<!-- Phone to OBS Button -->
		<button
			class="method-button"
			onclick={() => createStreamWithMethod('phone-to-obs')}
			disabled={isCreating}
			style="
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: {getSemanticSpacing('component', 'md')};
				padding: {getSemanticSpacing('card', 'padding')['xl']};
				border: 2px solid {colors.border.primary};
				border-radius: 1rem;
				background: {colors.background.primary};
				cursor: pointer;
				transition: all 0.2s ease;
				text-align: center;
				position: relative;
				overflow: hidden;
			"
		>
			<div class="method-icon" style="font-size: 3.5rem;">📱➡️💻</div>
			<div style="z-index: 1;">
				<h4 
					style="
						font-family: {getTextStyle('heading', 'h5').fontFamily};
						font-size: {getTextStyle('heading', 'h5').fontSize};
						font-weight: {getTextStyle('heading', 'h5').fontWeight};
						color: {colors.text.primary};
						margin: 0 0 {getSemanticSpacing('component', 'xs')} 0;
					"
				>
					Phone to OBS
				</h4>
				<p 
					style="
						font-size: {getTextStyle('body', 'sm').fontSize};
						color: {colors.text.secondary};
						margin: 0 0 {getSemanticSpacing('component', 'sm')} 0;
						line-height: 1.5;
					"
				>
					Use phone as camera in OBS scenes
				</p>
				<div 
					class="method-badge"
					style="
						display: inline-block;
						padding: 0.25rem 0.75rem;
						background: {colors.primary[50]};
						color: {colors.primary[700]};
						border-radius: 9999px;
						font-size: 0.75rem;
						font-weight: 600;
					"
				>
					🎨 Flexible
				</div>
			</div>
		</button>

		<!-- OBS Button -->
		<button
			class="method-button"
			onclick={() => createStreamWithMethod('obs')}
			disabled={isCreating}
			style="
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: {getSemanticSpacing('component', 'md')};
				padding: {getSemanticSpacing('card', 'padding')['xl']};
				border: 2px solid {colors.border.primary};
				border-radius: 1rem;
				background: {colors.background.primary};
				cursor: pointer;
				transition: all 0.2s ease;
				text-align: center;
				position: relative;
				overflow: hidden;
			"
		>
			<div class="method-icon" style="font-size: 3.5rem;">💻</div>
			<div style="z-index: 1;">
				<h4 
					style="
						font-family: {getTextStyle('heading', 'h5').fontFamily};
						font-size: {getTextStyle('heading', 'h5').fontSize};
						font-weight: {getTextStyle('heading', 'h5').fontWeight};
						color: {colors.text.primary};
						margin: 0 0 {getSemanticSpacing('component', 'xs')} 0;
					"
				>
					OBS
				</h4>
				<p 
					style="
						font-size: {getTextStyle('body', 'sm').fontSize};
						color: {colors.text.secondary};
						margin: 0 0 {getSemanticSpacing('component', 'sm')} 0;
						line-height: 1.5;
					"
				>
					Professional streaming with full control
				</p>
				<div 
					class="method-badge"
					style="
						display: inline-block;
						padding: 0.25rem 0.75rem;
						background: {colors.warning[50]};
						color: {colors.warning[700]};
						border-radius: 9999px;
						font-size: 0.75rem;
						font-weight: 600;
					"
				>
					⚙️ Pro
				</div>
			</div>
		</button>
	</div>

	<!-- Loading/Error State -->
	{#if isCreating || createError}
		<div 
			style="
				padding: {getSemanticSpacing('card', 'padding')['md']};
				background: {createError ? colors.error[50] : colors.primary[50]};
				border-top: 1px solid {createError ? colors.error[200] : colors.primary[200]};
				text-align: center;
			"
		>
			{#if isCreating}
				<p 
					style="
						margin: 0;
						color: {colors.primary[700]};
						font-size: {getTextStyle('body', 'sm').fontSize};
						font-weight: 600;
					"
				>
					⏳ Creating stream...
				</p>
			{/if}
			{#if createError}
				<p 
					style="
						margin: 0;
						color: {colors.error[700]};
						font-size: {getTextStyle('body', 'sm').fontSize};
					"
				>
					❌ {createError}
				</p>
			{/if}
		</div>
	{/if}

	<!-- Setup Time Comparison -->
	<div 
		style="
			padding: {getSemanticSpacing('card', 'padding')['md']};
			background: {colors.background.tertiary};
			border-top: 1px solid {colors.border.primary};
			text-align: center;
		"
	>
		<p 
			style="
				margin: 0;
				font-size: {getTextStyle('body', 'xs').fontSize};
				color: {colors.text.tertiary};
				line-height: 1.5;
			"
		>
			⏱️ Setup time: <strong>Phone to MUX (30 sec)</strong> · Phone to OBS (5 min) · OBS (10 min)
		</p>
	</div>
</Card>

<style>
	.method-button {
		position: relative;
	}

	.method-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%);
		opacity: 0;
		transition: opacity 0.2s ease;
		pointer-events: none;
	}

	.method-button:hover:not(:disabled)::before {
		opacity: 1;
	}

	.method-button:hover:not(:disabled) {
		border-color: var(--color-primary-500, #6366f1);
		box-shadow: 0 8px 16px -4px rgba(99, 102, 241, 0.2);
		transform: translateY(-4px) scale(1.02);
	}

	.method-button:hover:not(:disabled) .method-icon {
		transform: scale(1.1);
		animation: bounce 0.6s ease infinite;
	}

	.method-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.method-icon {
		transition: transform 0.2s ease;
	}

	@keyframes bounce {
		0%, 100% {
			transform: scale(1.1) translateY(0);
		}
		50% {
			transform: scale(1.1) translateY(-8px);
		}
	}

	@media (max-width: 768px) {
		.method-grid {
			grid-template-columns: 1fr !important;
		}
	}
</style>
