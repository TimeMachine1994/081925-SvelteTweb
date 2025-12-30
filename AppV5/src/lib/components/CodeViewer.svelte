<script lang="ts">
	import type { FileProfile } from '$lib/types/journey';

	let { 
		file,
		projectPath,
		highlightRange = null
	}: { 
		file: FileProfile | null;
		projectPath: string | null;
		highlightRange?: { start: number; end: number } | null;
	} = $props();

	let fullContent = $state<string | null>(null);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let isImageFile = $state(false);
	let imageUrl = $state<string | null>(null);
	let codeContainer = $state<HTMLElement | null>(null);

	const IMAGE_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp'];

	function isImage(path: string): boolean {
		return IMAGE_EXTENSIONS.some(ext => path.toLowerCase().endsWith(ext));
	}

	// Fetch full file content when file changes
	$effect(() => {
		if (file?.path) {
			if (isImage(file.path)) {
				isImageFile = true;
				loadImageFile(file.path);
			} else {
				isImageFile = false;
				imageUrl = null;
				loadFileContent(file.path);
			}
		} else {
			fullContent = null;
			error = null;
			isImageFile = false;
			imageUrl = null;
		}
	});

	async function loadImageFile(filePath: string) {
		isLoading = true;
		error = null;
		
		try {
			const response = await fetch('/api/file-content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ filePath, projectPath })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to load image');
			}

			const data = await response.json();
			
			// For SVGs, we can display the content directly
			if (filePath.toLowerCase().endsWith('.svg')) {
				// Create a data URL from SVG content
				const svgContent = data.content;
				imageUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`;
				fullContent = svgContent; // Also store raw content for code view toggle
			} else {
				// For binary images, we'd need a different approach
				// For now, show the path-based URL
				imageUrl = null;
				error = 'Binary image preview not yet supported';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load image';
			imageUrl = null;
		} finally {
			isLoading = false;
		}
	}

	async function loadFileContent(filePath: string) {
		isLoading = true;
		error = null;
		
		console.log('\n[CodeViewer] === LOADING FILE ===');
		console.log('[CodeViewer] filePath:', filePath);
		console.log('[CodeViewer] projectPath:', projectPath);
		
		try {
			const requestBody = { filePath, projectPath };
			console.log('[CodeViewer] Sending request body:', JSON.stringify(requestBody, null, 2));
			
			const response = await fetch('/api/file-content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody)
			});
			
			console.log('[CodeViewer] Response status:', response.status, response.statusText);

			if (!response.ok) {
				const errorData = await response.json();
				console.error('[CodeViewer] Error response:', JSON.stringify(errorData, null, 2));
				throw new Error(errorData.error || errorData.details || 'Failed to load file');
			}

			const data = await response.json();
			console.log('[CodeViewer] SUCCESS - Content length:', data.content?.length || 0);
			fullContent = data.content;
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Failed to load file';
			console.error('[CodeViewer] CATCH ERROR:', errorMsg);
			console.error('[CodeViewer] Full error object:', err);
			error = errorMsg;
			fullContent = null;
		} finally {
			isLoading = false;
		}
	}

	function getLanguageLabel(path: string): string {
		if (path.endsWith('.svelte')) return 'Svelte';
		if (path.endsWith('.ts')) return 'TypeScript';
		if (path.endsWith('.js')) return 'JavaScript';
		if (path.endsWith('.json')) return 'JSON';
		if (path.endsWith('.css')) return 'CSS';
		if (path.endsWith('.svg')) return 'SVG';
		if (path.endsWith('.png')) return 'PNG';
		if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'JPEG';
		if (path.endsWith('.gif')) return 'GIF';
		if (path.endsWith('.webp')) return 'WebP';
		return 'Code';
	}

	// Split content into lines for line-by-line rendering
	const lines = $derived(fullContent ? fullContent.split('\n') : []);

	// Helper to check if a line is in the highlight range
	function isLineHighlighted(lineNum: number): boolean {
		if (!highlightRange) return false;
		return lineNum >= highlightRange.start && lineNum <= highlightRange.end;
	}

	// Scroll to highlighted range when it changes
	$effect(() => {
		if (highlightRange && codeContainer) {
			console.log('[CodeViewer] Scrolling to lines:', highlightRange.start, '-', highlightRange.end);
			// Wait for DOM update
			setTimeout(() => {
				const lineElement = codeContainer?.querySelector(`[data-line="${highlightRange.start}"]`);
				if (lineElement) {
					lineElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}, 100);
		}
	});
</script>

<div class="code-viewer">
	{#if file}
		<div class="viewer-header">
			<div class="file-info">
				<span class="file-icon">📄</span>
				<div class="file-details">
					<h3 class="file-name">{file.title}</h3>
					<span class="file-path">{file.path}</span>
				</div>
			</div>
			<span class="language-badge">{getLanguageLabel(file.path)}</span>
		</div>
		<div class="viewer-body">
			{#if isLoading}
				<div class="loading-state">
					<div class="spinner"></div>
					<p>Loading file content...</p>
				</div>
			{:else if error}
				<div class="error-state">
					<span class="error-icon">⚠️</span>
					<h4>Failed to Load File</h4>
					<p>{error}</p>
				</div>
			{:else if isImageFile && imageUrl}
				<div class="image-preview">
					<img src={imageUrl} alt={file?.title || 'Image'} />
				</div>
			{:else if fullContent}
				<div class="code-content" bind:this={codeContainer}>
					{#each lines as line, i}
						<div 
							class="code-line" 
							class:highlighted={isLineHighlighted(i + 1)}
							data-line={i + 1}
						>
							<span class="line-number">{i + 1}</span>
							<pre class="line-code"><code>{line || ' '}</code></pre>
						</div>
					{/each}
				</div>
			{:else}
				<div class="loading-state">
					<p>No content available</p>
				</div>
			{/if}
		</div>
	{:else}
		<div class="empty-viewer">
			<span class="empty-icon">💻</span>
			<h3>No File Selected</h3>
			<p>Select a file from the Code Bank or a POTJ with a file reference to view its code</p>
		</div>
	{/if}
</div>

<style>
	.code-viewer {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #fff;
		border-left: 1px solid #e2e8f0;
		overflow: hidden;
	}

	.viewer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		background: #f8fafc;
		border-bottom: 1px solid #e2e8f0;
		flex-shrink: 0;
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
	}

	.file-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.file-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.file-name {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: #0f172a;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.file-path {
		font-size: 0.75rem;
		color: #64748b;
		font-family: 'Courier New', monospace;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.language-badge {
		font-size: 0.6875rem;
		font-weight: 600;
		padding: 0.25rem 0.625rem;
		background: #e0e7ff;
		color: #4338ca;
		border-radius: 0.375rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		flex-shrink: 0;
	}

	.viewer-body {
		flex: 1;
		overflow: auto;
		background: #0f172a;
	}

	.code-content {
		margin: 0;
		padding: 0.5rem 0;
		color: #e2e8f0;
		font-family: 'Courier New', Monaco, monospace;
		font-size: 0.8125rem;
		line-height: 1;
		overflow-x: auto;
	}

	.code-line {
		display: flex;
		min-height: 1.5rem;
		transition: background-color 0.2s ease;
	}

	.code-line:hover {
		background: rgba(59, 130, 246, 0.1);
	}

	.code-line.highlighted {
		background: rgba(251, 191, 36, 0.25);
		border-left: 3px solid #fbbf24;
	}

	.line-number {
		flex-shrink: 0;
		width: 3.5rem;
		padding: 0 0.75rem;
		text-align: right;
		color: #475569;
		user-select: none;
		border-right: 1px solid #334155;
		background: rgba(0, 0, 0, 0.2);
	}

	.line-code {
		flex: 1;
		margin: 0;
		padding: 0 1rem;
		white-space: pre;
		overflow-x: visible;
	}

	.line-code code {
		display: block;
	}

	.empty-viewer {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 3rem 2rem;
		color: #94a3b8;
		text-align: center;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.empty-viewer h3 {
		margin: 0 0 0.5rem;
		font-size: 1.125rem;
		color: #64748b;
	}

	.empty-viewer p {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
		max-width: 20rem;
	}

	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 3rem 2rem;
		color: #e2e8f0;
		text-align: center;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(226, 232, 240, 0.2);
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.loading-state p {
		margin: 0;
		font-size: 0.875rem;
		color: #94a3b8;
	}

	.error-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.error-state h4 {
		margin: 0 0 0.5rem;
		font-size: 1.125rem;
		color: #ef4444;
	}

	.error-state p {
		margin: 0;
		font-size: 0.875rem;
		color: #fca5a5;
	}

	.image-preview {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 2rem;
		background: #1e293b;
		overflow: auto;
	}

	.image-preview img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}
</style>
