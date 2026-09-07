<script lang="ts">
	import type { MemorialBlock, TextConfig, TextStyle } from '$lib/types/memorial-blocks';

	interface Props {
		block: MemorialBlock;
		onClose: () => void;
		onSave: (updates: Partial<TextConfig>) => void;
	}

	let { block, onClose, onSave }: Props = $props();

	const config = block.config as TextConfig;

	// Font size presets
	const fontSizeOptions = [
		{ label: 'Small', value: '0.875rem' },
		{ label: 'Normal', value: '1rem' },
		{ label: 'Medium', value: '1.125rem' },
		{ label: 'Large', value: '1.25rem' },
		{ label: 'XL', value: '1.5rem' },
		{ label: '2XL', value: '2rem' },
		{ label: '3XL', value: '2.5rem' }
	];

	// Line height presets
	const lineHeightOptions = [
		{ label: 'Tight', value: '1.2' },
		{ label: 'Normal', value: '1.4' },
		{ label: 'Relaxed', value: '1.7' },
		{ label: 'Loose', value: '2.0' }
	];

	// Smart defaults based on style
	function getDefaultFontSize(s: TextStyle): string {
		return s === 'heading' ? '2rem' : '1.125rem';
	}
	function getDefaultFontColor(s: TextStyle): string {
		return s === 'note' ? '#92400e' : '#ffffff';
	}
	function getDefaultLineHeight(s: TextStyle): string {
		return s === 'heading' ? '1.3' : '1.7';
	}

	// Form state
	let content = $state(config.content || '');
	let style = $state<TextStyle>(config.style || 'paragraph');
	let fontSize = $state(config.fontSize || getDefaultFontSize(config.style || 'paragraph'));
	let fontColor = $state(config.fontColor || getDefaultFontColor(config.style || 'paragraph'));
	let lineHeight = $state(config.lineHeight || getDefaultLineHeight(config.style || 'paragraph'));
	let textAlign = $state<'left' | 'center' | 'right'>(config.textAlign || 'center');

	// When style changes, update defaults if current values match the old defaults
	let prevStyle = $state<TextStyle>(config.style || 'paragraph');
	function handleStyleChange() {
		if (fontSize === getDefaultFontSize(prevStyle)) fontSize = getDefaultFontSize(style);
		if (fontColor === getDefaultFontColor(prevStyle)) fontColor = getDefaultFontColor(style);
		if (lineHeight === getDefaultLineHeight(prevStyle)) lineHeight = getDefaultLineHeight(style);
		prevStyle = style;
	}

	function handleSubmit() {
		if (!content.trim()) {
			alert('Please enter text content');
			return;
		}

		onSave({
			content: content.trim(),
			style,
			fontSize,
			fontColor,
			lineHeight,
			textAlign
		});
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="modal-overlay" onclick={onClose}>
	<div class="modal-content" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<h3>Edit Text Block</h3>
			<button class="close-btn" onclick={onClose}>✕</button>
		</div>

		<div class="modal-body">
			<div class="form-group">
				<label for="text-style">Style</label>
				<select id="text-style" bind:value={style} onchange={handleStyleChange}>
					<option value="paragraph">¶ Paragraph — Normal body text</option>
					<option value="heading">H Heading — Larger, bold text</option>
					<option value="note">📌 Note — Styled card with background</option>
				</select>
			</div>

			<!-- Styling Controls -->
			<div class="styling-controls">
				<div class="control-row">
					<div class="form-group compact">
						<label for="font-color">Font Color</label>
						<div class="color-input-wrapper">
							<input
								id="font-color"
								type="color"
								bind:value={fontColor}
								class="color-picker"
							/>
							<span class="color-value">{fontColor}</span>
							<button
								type="button"
								class="reset-btn"
								title="Reset to default"
								onclick={() => fontColor = getDefaultFontColor(style)}
							>↺</button>
						</div>
					</div>

					<div class="form-group compact">
						<label for="font-size">Font Size</label>
						<select id="font-size" bind:value={fontSize}>
							{#each fontSizeOptions as opt}
								<option value={opt.value}>{opt.label} ({opt.value})</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="control-row">
					<div class="form-group compact">
						<label for="line-height">Line Height</label>
						<select id="line-height" bind:value={lineHeight}>
							{#each lineHeightOptions as opt}
								<option value={opt.value}>{opt.label} ({opt.value})</option>
							{/each}
						</select>
					</div>

					<div class="form-group compact">
						<label>Text Align</label>
						<div class="align-toggle">
							<button type="button" class="align-btn" class:active={textAlign === 'left'} onclick={() => textAlign = 'left'} title="Left">◧</button>
							<button type="button" class="align-btn" class:active={textAlign === 'center'} onclick={() => textAlign = 'center'} title="Center">▣</button>
							<button type="button" class="align-btn" class:active={textAlign === 'right'} onclick={() => textAlign = 'right'} title="Right">◨</button>
						</div>
					</div>
				</div>
			</div>

			<div class="form-group">
				<label for="text-content">Content *</label>
				<textarea
					id="text-content"
					bind:value={content}
					placeholder="Enter your text content..."
					rows="8"
				></textarea>
				<p class="char-count">{content.length} characters</p>
			</div>

			<div class="preview-section">
				<h4>Preview (approximate — shown on dark background)</h4>
				<div
					class="text-preview-dark"
					class:note={style === 'note'}
					style="font-size: {fontSize}; color: {fontColor}; line-height: {lineHeight}; text-align: {textAlign}; font-weight: {style === 'heading' ? '700' : '400'};"
				>
					{content || 'Your text will appear here...'}
				</div>
			</div>
		</div>

		<div class="modal-footer">
			<button class="cancel-btn" onclick={onClose}>Cancel</button>
			<button class="primary-btn" onclick={handleSubmit}>Save Changes</button>
		</div>
	</div>
</div>

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
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.125rem;
		color: #2d3748;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.25rem;
		color: #718096;
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
	}

	.close-btn:hover {
		color: #2d3748;
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
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

	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3182ce;
		box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
	}

	.form-group textarea {
		resize: vertical;
		font-family: inherit;
		line-height: 1.5;
	}

	.char-count {
		margin: 0.5rem 0 0 0;
		font-size: 0.75rem;
		color: #a0aec0;
		text-align: right;
	}

	.styling-controls {
		background: #f0f4f8;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 0.75rem;
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.control-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.form-group.compact {
		margin-bottom: 0;
	}

	.form-group.compact label {
		font-size: 0.75rem;
		margin-bottom: 0.25rem;
	}

	.color-input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.color-picker {
		width: 36px;
		height: 30px;
		padding: 1px;
		border: 1px solid #cbd5e0;
		border-radius: 0.25rem;
		cursor: pointer;
		background: none;
	}

	.color-value {
		font-size: 0.75rem;
		color: #718096;
		font-family: monospace;
	}

	.reset-btn {
		background: none;
		border: 1px solid #cbd5e0;
		border-radius: 0.25rem;
		padding: 0.125rem 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
		color: #718096;
		line-height: 1;
	}

	.reset-btn:hover {
		background: #e2e8f0;
		color: #4a5568;
	}

	.align-toggle {
		display: flex;
		gap: 2px;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		overflow: hidden;
	}

	.align-btn {
		flex: 1;
		padding: 0.375rem 0.5rem;
		border: none;
		background: white;
		cursor: pointer;
		font-size: 0.875rem;
		color: #718096;
		transition: all 0.15s;
	}

	.align-btn.active {
		background: #3182ce;
		color: white;
	}

	.align-btn:hover:not(.active) {
		background: #edf2f7;
	}

	.preview-section {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.preview-section h4 {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		color: #4a5568;
	}

	.text-preview-dark {
		padding: 1.25rem;
		border-radius: 0.5rem;
		background: #0a0a1a;
		min-height: 60px;
		white-space: pre-wrap;
	}

	.text-preview-dark.note {
		background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
		border: 1px solid #fcd34d;
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid #e2e8f0;
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.cancel-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		cursor: pointer;
	}

	.cancel-btn:hover {
		background: #f7fafc;
	}

	.primary-btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		background: #3182ce;
		color: white;
		font-weight: 600;
		cursor: pointer;
	}

	.primary-btn:hover {
		background: #2c5282;
	}
</style>
