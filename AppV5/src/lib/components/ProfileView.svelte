<script lang="ts">
	import type { POTJ, FileProfile } from '$lib/types/journey';
	import type { ChatMessage } from '$lib/server/db/schema';
	import type { FileAnalysis } from '$lib/server/file-analyzer';
	import DataTable from './DataTable.svelte';

	let { 
		selectedPOTJ,
		selectedFile,
		viewMode,
		files = [],
		onSelectFile,
		onHighlightRange,
		projectPath = null
	}: { 
		selectedPOTJ: POTJ | null;
		selectedFile: FileProfile | null;
		viewMode: 'potj' | 'file';
		files?: FileProfile[];
		onSelectFile?: (file: FileProfile) => void;
		onHighlightRange?: (start: number, end: number, filePath: string) => void;
		projectPath?: string | null;
	} = $props();

	// Tab state
	let activeTab = $state<'overview' | 'state' | 'functions' | 'imports' | 'chat'>('overview');
	
	// File analysis state
	let fileAnalysis = $state<FileAnalysis | null>(null);
	let isAnalyzing = $state(false);
	let analysisError = $state<string | null>(null);

	const activeProfile = $derived(viewMode === 'potj' ? selectedPOTJ : selectedFile);
	const currentFilePath = $derived(
		viewMode === 'potj' ? selectedPOTJ?.fileRef : selectedFile?.path
	);

	// Reset tab when selection changes
	$effect(() => {
		if (activeProfile) {
			activeTab = 'overview';
			fileAnalysis = null;
			analysisError = null;
		}
	});

	// Load file analysis when switching to analysis tabs
	// First check for persisted analysis in POTJ, then fall back to API
	$effect(() => {
		if ((activeTab === 'state' || activeTab === 'functions' || activeTab === 'imports') && currentFilePath && !fileAnalysis && !isAnalyzing) {
			// Check if POTJ has persisted analysis
			if (viewMode === 'potj' && selectedPOTJ?.analysis) {
				console.log('[ProfileView] Using persisted analysis from POTJ');
				usePerssistedAnalysis();
			} else {
				analyzeCurrentFile();
			}
		}
	});

	// Use persisted analysis from POTJ
	function usePerssistedAnalysis() {
		if (!selectedPOTJ?.analysis || !currentFilePath) return;
		
		const pa = selectedPOTJ.analysis;
		fileAnalysis = {
			filePath: currentFilePath,
			fileType: currentFilePath.endsWith('.svelte') ? 'svelte' : 
					  currentFilePath.endsWith('.ts') ? 'typescript' : 'javascript',
			state: pa.state || [],
			props: [], // Props not persisted
			functions: pa.functions || [],
			imports: [
				...(pa.imports?.projectFiles || []),
				...(pa.imports?.frameworkModules || [])
			],
			summary: {
				stateCount: pa.metadata?.stateCount || 0,
				functionCount: pa.metadata?.functionCount || 0,
				importCount: pa.metadata?.importCount || 0,
				propCount: 0
			},
			analyzedAt: pa.metadata?.analyzedAt || new Date().toISOString()
		};
	}

	async function analyzeCurrentFile(forceRefresh = false) {
		if (!currentFilePath) return;
		
		// Skip if we already have analysis and not forcing refresh
		if (fileAnalysis && !forceRefresh) return;
		
		isAnalyzing = true;
		analysisError = null;
		
		try {
			console.log('[ProfileView] Fetching live analysis from API');
			const response = await fetch('/api/analyze-file', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					filePath: currentFilePath,
					projectPath
				})
			});
			
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Analysis failed');
			}
			
			const data = await response.json();
			fileAnalysis = data.analysis;
		} catch (err) {
			analysisError = err instanceof Error ? err.message : 'Failed to analyze file';
		} finally {
			isAnalyzing = false;
		}
	}

	// Chat state
	let chatMessages = $state<ChatMessage[]>([]);
	let chatInput = $state('');
	let isSendingMessage = $state(false);
	let chatError = $state<string | null>(null);
	let chatScrollContainer: HTMLElement | null = null;

	// Load chat history when selection changes
	$effect(() => {
		if (activeProfile) {
			loadChatHistory();
		} else {
			chatMessages = [];
		}
	});

	async function loadChatHistory() {
		try {
			const contextType = viewMode === 'potj' ? 'potj' : 'file';
			const contextId = viewMode === 'potj' ? selectedPOTJ?.id : selectedFile?.path;
			
			if (!contextId) return;

			const params = new URLSearchParams({ contextType, contextId });
			const response = await fetch(`/api/chat?${params}`);
			
			if (!response.ok) throw new Error('Failed to load chat');
			
			const data = await response.json();
			chatMessages = data.messages || [];
			
			// Auto-scroll to bottom after messages load
			setTimeout(scrollToBottom, 100);
		} catch (err) {
			console.error('Error loading chat:', err);
		}
	}

	async function sendMessage() {
		if (!chatInput.trim() || isSendingMessage) return;
		
		const userMessage = chatInput.trim();
		chatInput = ''; // Clear input immediately
		isSendingMessage = true;
		chatError = null;
		
		try {
			const contextType = viewMode === 'potj' ? 'potj' : 'file';
			const contextId = viewMode === 'potj' ? selectedPOTJ?.id : selectedFile?.path;
			
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contextType,
					contextId,
					message: userMessage,
					context: {
						potj: viewMode === 'potj' ? selectedPOTJ : null,
						fileContent: selectedFile?.codeSnippets?.[0]?.code || null,
						relatedFiles: []
					}
				})
			});
			
			if (!response.ok) throw new Error('Failed to send message');
			
			const data = await response.json();
			
			// Add both messages to chat
			chatMessages = [...chatMessages, data.userMessage, data.assistantMessage];
			
			// Scroll to bottom
			setTimeout(scrollToBottom, 100);
		} catch (err) {
			chatError = err instanceof Error ? err.message : 'Failed to send message';
		} finally {
			isSendingMessage = false;
		}
	}

	function scrollToBottom() {
		if (chatScrollContainer) {
			chatScrollContainer.scrollTop = chatScrollContainer.scrollHeight;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	// Check if path is a SvelteKit internal/framework module
	function isFrameworkModule(path: string): boolean {
		const frameworkPrefixes = ['$app/', '$env/', 'svelte/', 'svelte', '@sveltejs/'];
		return frameworkPrefixes.some(prefix => path.startsWith(prefix));
	}

	function handleFileClick(filePath: string) {
		console.log('[ProfileView.handleFileClick] Called with:', filePath);
		console.log('[ProfileView.handleFileClick] onSelectFile exists:', !!onSelectFile);
		console.log('[ProfileView.handleFileClick] projectPath:', projectPath);
		
		// Check if it's a framework module
		if (isFrameworkModule(filePath)) {
			console.log('[ProfileView.handleFileClick] Framework module detected, showing alert');
			alert(`"${filePath}" is a SvelteKit/Svelte framework module, not a project file.`);
			return;
		}
		
		if (!onSelectFile) {
			console.warn('[ProfileView.handleFileClick] No onSelectFile callback, returning');
			return;
		}
		
		// Extract path from dependency format like "Uses `@/lib/path.svelte`"
		let cleanPath = filePath;
		console.log('[ProfileView.handleFileClick] Original path:', cleanPath);
		
		if (cleanPath.startsWith('Uses ')) {
			cleanPath = cleanPath.replace(/^Uses\s+/, '');
			console.log('[ProfileView.handleFileClick] After removing "Uses ":', cleanPath);
		}
		// Remove backticks if present
		cleanPath = cleanPath.replace(/`/g, '');
		console.log('[ProfileView.handleFileClick] After removing backticks:', cleanPath);
		
		// Find the file in the files array
		let file = files.find(f => f.path === cleanPath);
		console.log('[ProfileView.handleFileClick] Found in files array:', !!file);
		console.log('[ProfileView.handleFileClick] Files array length:', files.length);
		
		// If not found, create a temporary FileProfile on-the-fly
		if (!file) {
			const fileName = cleanPath.split('/').pop() || cleanPath;
			console.log('[ProfileView.handleFileClick] Creating temp file profile for:', cleanPath);
			file = {
				id: 'temp-' + cleanPath.replace(/[^a-zA-Z0-9]/g, '-'),
				path: cleanPath,
				title: fileName.replace(/\.(svelte|ts|js)$/, ''),
				description: 'File loaded from reference',
				tags: [],
				codeSnippets: [],
				relatedPOTJs: [],
				notes: [],
				chatHistory: []
			};
			console.log('[ProfileView.handleFileClick] Created temp file:', JSON.stringify(file, null, 2));
		}
		
		console.log('[ProfileView.handleFileClick] Calling onSelectFile with path:', file.path);
		onSelectFile(file);
	}
</script>

<div class="profile-view">
	{#if activeProfile}
		<div class="profile-content">
			<div class="profile-header">
				<div class="header-top">
					<h2 class="profile-title">
						{#if viewMode === 'potj'}
							{selectedPOTJ?.title}
						{:else}
							{selectedFile?.title}
						{/if}
					</h2>
					<span class="profile-type-badge">
						{viewMode === 'potj' ? '🗺️ POTJ' : '📄 File'}
					</span>
				</div>
				
				{#if viewMode === 'potj' && selectedPOTJ?.section}
					<span class="section-badge section-{selectedPOTJ.section}">
						{selectedPOTJ.section}
					</span>
				{/if}

				{#if viewMode === 'file' && selectedFile?.path}
					<p class="file-path">{selectedFile.path}</p>
				{/if}

				<!-- Tab Navigation -->
				<div class="tab-nav">
					<button 
						class="tab-btn" 
						class:active={activeTab === 'overview'}
						onclick={() => activeTab = 'overview'}
					>
						📋 Overview
					</button>
					<button 
						class="tab-btn" 
						class:active={activeTab === 'state'}
						onclick={() => activeTab = 'state'}
					>
						📊 State
					</button>
					<button 
						class="tab-btn" 
						class:active={activeTab === 'functions'}
						onclick={() => activeTab = 'functions'}
					>
						⚡ Functions
					</button>
					<button 
						class="tab-btn" 
						class:active={activeTab === 'imports'}
						onclick={() => activeTab = 'imports'}
					>
						📦 Imports
					</button>
					<button 
						class="tab-btn" 
						class:active={activeTab === 'chat'}
						onclick={() => activeTab = 'chat'}
					>
						💬 Chat
					</button>
				</div>
			</div>

			<div class="profile-body">
				<!-- Analysis Loading State -->
				{#if isAnalyzing}
					<div class="loading-state">
						<div class="spinner"></div>
						<p>Analyzing file structure...</p>
					</div>
				{:else if analysisError && activeTab !== 'overview' && activeTab !== 'chat'}
					<div class="error-state">
						<span class="error-icon">⚠️</span>
						<p>{analysisError}</p>
						<button class="retry-btn" onclick={analyzeCurrentFile}>Retry</button>
					</div>
				{:else if activeTab === 'state'}
					<!-- State Tab -->
					<div class="tab-content">
						<h3 class="content-heading">📊 State Management</h3>
						{#if fileAnalysis?.state && fileAnalysis.state.length > 0}
							<DataTable 
								columns={[
									{ key: 'name', label: 'Variable', width: '30%' },
									{ key: 'type', label: 'Type', width: '25%' },
									{ key: 'initialValue', label: 'Initial Value', width: '35%' },
									{ key: 'line', label: 'Line', width: '10%' }
								]}
								rows={fileAnalysis.state}
								emptyMessage="No state variables found"
							/>
						{:else}
							<p class="empty-message">No state variables found in this file</p>
						{/if}

						{#if fileAnalysis?.props && fileAnalysis.props.length > 0}
							<h3 class="content-heading" style="margin-top: 1.5rem;">🎯 Props</h3>
							<DataTable 
								columns={[
									{ key: 'name', label: 'Prop', width: '30%' },
									{ key: 'type', label: 'Type', width: '35%' },
									{ key: 'defaultValue', label: 'Default', width: '25%' },
									{ key: 'line', label: 'Line', width: '10%' }
								]}
								rows={fileAnalysis.props}
								emptyMessage="No props found"
							/>
						{/if}
					</div>
				{:else if activeTab === 'functions'}
					<!-- Functions Tab -->
					<div class="tab-content">
						<h3 class="content-heading">⚡ Functions <span class="click-hint-text">(click to highlight in code)</span></h3>
						{#if fileAnalysis?.functions && fileAnalysis.functions.length > 0}
							<DataTable 
								columns={[
									{ key: 'name', label: 'Function', width: '25%' },
									{ key: 'params', label: 'Parameters', width: '30%' },
									{ key: 'returnType', label: 'Returns', width: '20%' },
									{ key: 'isAsync', label: 'Async', width: '10%' },
									{ key: 'line', label: 'Line', width: '10%' }
								]}
								rows={fileAnalysis.functions}
								onRowClick={(row) => {
									console.log('[ProfileView] Function clicked:', row.name, 'lines:', row.line, '-', row.endLine);
									console.log('[ProfileView] Current file path:', currentFilePath);
									if (onHighlightRange && row.line && row.endLine && currentFilePath) {
										onHighlightRange(row.line, row.endLine, currentFilePath);
									}
								}}
								emptyMessage="No functions found"
							/>
						{:else}
							<p class="empty-message">No functions found in this file</p>
						{/if}
					</div>
				{:else if activeTab === 'imports'}
					<!-- Imports Tab -->
					<div class="tab-content">
						<h3 class="content-heading">📦 Imports ({fileAnalysis?.imports?.length || 0})</h3>
						{#if fileAnalysis?.imports && fileAnalysis.imports.length > 0}
							<!-- Project imports (clickable) -->
							{@const projectImports = fileAnalysis.imports.filter(i => !isFrameworkModule(i.path))}
							{@const frameworkImports = fileAnalysis.imports.filter(i => isFrameworkModule(i.path))}
							
							{#if projectImports.length > 0}
								<h4 class="subsection-heading">📁 Project Files ({projectImports.length})</h4>
								<DataTable 
									columns={[
										{ key: 'path', label: 'Import Path', width: '50%' },
										{ key: 'category', label: 'Category', width: '25%' },
										{ key: 'imports', label: 'Named Imports', width: '25%' }
									]}
									rows={projectImports}
									onRowClick={(row) => handleFileClick(row.path)}
									emptyMessage="No project imports"
								/>
							{/if}
							
							{#if frameworkImports.length > 0}
								<h4 class="subsection-heading" style="margin-top: 1rem;">🔧 Framework Modules ({frameworkImports.length})</h4>
								<DataTable 
									columns={[
										{ key: 'path', label: 'Import Path', width: '50%' },
										{ key: 'category', label: 'Category', width: '25%' },
										{ key: 'imports', label: 'Named Imports', width: '25%' }
									]}
									rows={frameworkImports}
									emptyMessage="No framework imports"
								/>
							{/if}
						{:else}
							<p class="empty-message">No imports found in this file</p>
						{/if}
					</div>
				{:else if activeTab === 'overview'}
					<!-- Overview Tab -->
					<div class="tab-content">
				{#if viewMode === 'potj' && selectedPOTJ?.description}
					<div class="section">
						<h3 class="section-title">Description</h3>
						<p class="description-text">{selectedPOTJ.description}</p>
					</div>
				{:else if viewMode === 'file' && selectedFile?.description}
					<div class="section">
						<h3 class="section-title">Description</h3>
						<p class="description-text">{selectedFile.description}</p>
					</div>
				{/if}

				{#if viewMode === 'potj' && selectedPOTJ?.fileRef}
					<div class="section">
						<h3 class="section-title">Related File</h3>
						<button 
							class="file-ref clickable"
							onclick={() => handleFileClick(selectedPOTJ.fileRef!)}
							title="Click to view in Code Viewer"
						>
							<span class="file-icon">📄</span>
							<span>{selectedPOTJ.fileRef}</span>
							<span class="click-hint">👁️</span>
						</button>
					</div>
				{/if}

				{#if viewMode === 'potj' && selectedPOTJ?.keyBehavior && selectedPOTJ.keyBehavior.length > 0}
					<div class="section">
						<h3 class="section-title">Key Behavior</h3>
						<ul class="behavior-list">
							{#each selectedPOTJ.keyBehavior as behavior}
								<li>{behavior}</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if viewMode === 'potj' && selectedPOTJ?.codeReference}
					<div class="section">
						<h3 class="section-title">Code Reference</h3>
						<div class="code-snippet">
							<div class="snippet-header">
								<span class="file-ref-small">📄 {selectedPOTJ.codeReference.file}</span>
								<span class="line-range">Lines {selectedPOTJ.codeReference.lines}</span>
							</div>
							<pre class="code-block"><code>{selectedPOTJ.codeReference.code}</code></pre>
						</div>
					</div>
				{/if}

				{#if viewMode === 'potj' && selectedPOTJ?.dependencies && selectedPOTJ.dependencies.length > 0}
					<div class="section">
						<h3 class="section-title">Dependencies</h3>
						<ul class="dependencies-list">
							{#each selectedPOTJ.dependencies as dep}
								<li>
									<button 
										class="dependency-link"
										onclick={() => handleFileClick(dep)}
										title="Click to view in Code Viewer"
									>
										{dep}
										<span class="click-hint-small">👁️</span>
									</button>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if viewMode === 'file' && selectedFile?.codeSnippets && selectedFile.codeSnippets.length > 0}
					<div class="section">
						<h3 class="section-title">Code Snippets</h3>
						{#each selectedFile.codeSnippets as snippet}
							<div class="code-snippet">
								<div class="snippet-header">
									<span class="language">{snippet.language}</span>
									{#if snippet.lineStart && snippet.lineEnd}
										<span class="line-range">Lines {snippet.lineStart}-{snippet.lineEnd}</span>
									{/if}
								</div>
								<pre class="code-block"><code>{snippet.code}</code></pre>
							</div>
						{/each}
					</div>
				{/if}

				{#if activeProfile.tags && activeProfile.tags.length > 0}
					<div class="section">
						<h3 class="section-title">Tags</h3>
						<div class="tags-list">
							{#each activeProfile.tags as tag}
								<span class="tag">{tag}</span>
							{/each}
						</div>
					</div>
				{/if}

				{#if activeProfile.notes && activeProfile.notes.length > 0}
					<div class="section">
						<h3 class="section-title">Notes</h3>
						<div class="notes-list">
							{#each activeProfile.notes as note}
								<div class="note-item">
									<span class="note-bullet">•</span>
									<p>{note}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if activeProfile.chatHistory && activeProfile.chatHistory.length > 0}
					<div class="section">
						<h3 class="section-title">Chat History</h3>
						<div class="chat-list">
							{#each activeProfile.chatHistory as message}
								<div class="chat-message {message.role}">
									<div class="message-header">
										<span class="role">{message.role === 'user' ? '👤' : '🤖'}</span>
										<span class="timestamp">{new Date(message.timestamp).toLocaleString()}</span>
									</div>
									<p class="message-content">{message.content}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if viewMode === 'potj' && selectedPOTJ?.dataFlow}
					<div class="section data-flow-section">
						<h3 class="section-title">📊 Data Flow</h3>
						
						{#if selectedPOTJ.dataFlow.receives && selectedPOTJ.dataFlow.receives.length > 0}
							<div class="flow-group receives">
								<h4 class="flow-heading">📥 Receives (Props In)</h4>
								<ul class="flow-list">
									{#each selectedPOTJ.dataFlow.receives as item}
										<li class="flow-item">
											<code class="flow-name">{item.name}</code>
											{#if item.type}
												<span class="flow-type">: {item.type}</span>
											{/if}
											{#if item.description}
												<p class="flow-desc">{item.description}</p>
											{/if}
											{#if item.source}
												<span class="flow-meta">from {item.source}</span>
											{/if}
										</li>
									{/each}
								</ul>
							</div>
						{/if}
						
						{#if selectedPOTJ.dataFlow.provides && selectedPOTJ.dataFlow.provides.length > 0}
							<div class="flow-group provides">
								<h4 class="flow-heading">📤 Provides (Props Out)</h4>
								<ul class="flow-list">
									{#each selectedPOTJ.dataFlow.provides as item}
										<li class="flow-item">
											<code class="flow-name">{item.name}</code>
											{#if item.type}
												<span class="flow-type">: {item.type}</span>
											{/if}
											{#if item.destination}
												<span class="flow-meta">→ {item.destination}</span>
											{/if}
											{#if item.description}
												<p class="flow-desc">{item.description}</p>
											{/if}
										</li>
									{/each}
								</ul>
							</div>
						{/if}
						
						{#if selectedPOTJ.dataFlow.emits && selectedPOTJ.dataFlow.emits.length > 0}
							<div class="flow-group emits">
								<h4 class="flow-heading">⚡ Emits (Events Up)</h4>
								<ul class="flow-list">
									{#each selectedPOTJ.dataFlow.emits as item}
										<li class="flow-item">
											<code class="flow-name">{item.name}</code>
											{#if item.type}
												<span class="flow-type">: {item.type}</span>
											{/if}
											{#if item.description}
												<p class="flow-desc">{item.description}</p>
											{/if}
										</li>
									{/each}
								</ul>
							</div>
						{/if}
						
						{#if selectedPOTJ.dataFlow.stores && selectedPOTJ.dataFlow.stores.length > 0}
							<div class="flow-group stores">
								<h4 class="flow-heading">🌐 State Access</h4>
								<ul class="flow-list">
									{#each selectedPOTJ.dataFlow.stores as item}
										<li class="flow-item">
											<code class="flow-name">{item.name}</code>
											{#if item.description}
												<p class="flow-desc">{item.description}</p>
											{/if}
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				{/if}
					</div>
				{:else if activeTab === 'chat'}
					<!-- Chat Tab -->
					<div class="tab-content">
				<!-- Chat Interface -->
				<div class="chat-section">
					<h3 class="section-title">💬 Ask About This {viewMode === 'potj' ? 'Journey Step' : 'File'}</h3>
					
					{#if chatError}
						<div class="chat-error">
							<span class="error-icon">⚠️</span>
							<p>{chatError}</p>
						</div>
					{/if}
					
					<div class="chat-container">
						<div class="chat-messages" bind:this={chatScrollContainer}>
							{#if chatMessages.length === 0}
								<div class="chat-empty">
									<span class="empty-icon">💭</span>
									<p>Start a conversation about this code</p>
									<p class="hint">Ask questions, request explanations, or discuss improvements</p>
								</div>
							{:else}
								{#each chatMessages as message (message.id)}
									<div class="chat-message {message.role}">
										<div class="message-avatar">
											{message.role === 'user' ? '👤' : '🤖'}
										</div>
										<div class="message-content">
											<div class="message-text">{message.content}</div>
											<div class="message-time">
												{new Date(message.timestamp).toLocaleTimeString()}
											</div>
										</div>
									</div>
								{/each}
							{/if}
							
							{#if isSendingMessage}
								<div class="chat-message assistant typing">
									<div class="message-avatar">🤖</div>
									<div class="message-content">
										<div class="typing-indicator">
											<span></span>
											<span></span>
											<span></span>
										</div>
									</div>
								</div>
							{/if}
						</div>
						
						<div class="chat-input-container">
							<textarea
								bind:value={chatInput}
								onkeydown={handleKeydown}
								placeholder="Ask a question about this code..."
								class="chat-input"
								rows="2"
								disabled={isSendingMessage}
							></textarea>
							<button 
								onclick={sendMessage}
								disabled={!chatInput.trim() || isSendingMessage}
								class="send-btn"
							>
								{isSendingMessage ? '⏳' : '📤'} Send
							</button>
						</div>
					</div>
				</div>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="empty-state">
			<span class="empty-icon">📋</span>
			<h3>No Selection</h3>
			<p>Select a journey item or file to view its profile</p>
		</div>
	{/if}
</div>

<style>
	.profile-view {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #fff;
		overflow-y: auto;
	}

	.profile-content {
		flex: 1;
	}

	.profile-header {
		padding: 1.5rem;
		padding-bottom: 0;
		background: linear-gradient(to bottom, #f8fafc, #fff);
		border-bottom: 1px solid #e2e8f0;
	}

	.tab-nav {
		display: flex;
		gap: 0.25rem;
		margin-top: 1rem;
		padding-bottom: 0;
		overflow-x: auto;
	}

	.tab-btn {
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: #64748b;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.15s ease;
	}

	.tab-btn:hover {
		color: #3b82f6;
		background: #f1f5f9;
	}

	.tab-btn.active {
		color: #3b82f6;
		border-bottom-color: #3b82f6;
		background: #eff6ff;
	}

	.tab-content {
		padding: 0;
	}

	.content-heading {
		margin: 0 0 0.75rem 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: #1e293b;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.subsection-heading {
		margin: 0.5rem 0;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #475569;
	}

	.click-hint-text {
		font-size: 0.6875rem;
		font-weight: 400;
		color: #94a3b8;
		font-style: italic;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		color: #64748b;
	}

	.loading-state .spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #e2e8f0;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		color: #991b1b;
		text-align: center;
	}

	.retry-btn {
		margin-top: 0.75rem;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		color: #3b82f6;
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		border-radius: 0.375rem;
		cursor: pointer;
	}

	.retry-btn:hover {
		background: #dbeafe;
	}

	.empty-message {
		padding: 1.5rem;
		color: #94a3b8;
		font-size: 0.875rem;
		text-align: center;
	}

	.header-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.profile-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #0f172a;
		line-height: 1.3;
	}

	.profile-type-badge {
		font-size: 0.75rem;
		padding: 0.375rem 0.75rem;
		background: #e0e7ff;
		color: #4338ca;
		border-radius: 0.375rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.section-badge {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		text-transform: capitalize;
	}

	.section-beginning {
		background: #dcfce7;
		color: #166534;
	}

	.section-middle {
		background: #fef3c7;
		color: #92400e;
	}

	.section-end {
		background: #fecaca;
		color: #991b1b;
	}

	.file-path {
		margin: 0;
		font-size: 0.8125rem;
		color: #64748b;
		font-family: 'Courier New', monospace;
	}

	.profile-body {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #475569;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.description-text {
		margin: 0;
		font-size: 0.9375rem;
		color: #334155;
		line-height: 1.6;
	}

	.file-ref {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: #475569;
		font-family: 'Courier New', monospace;
		width: 100%;
		text-align: left;
		justify-content: space-between;
	}

	.file-ref.clickable {
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.file-ref.clickable:hover {
		background: #eff6ff;
		border-color: #3b82f6;
		color: #1e40af;
		transform: translateX(4px);
	}

	.file-ref.clickable:hover .click-hint {
		opacity: 1;
	}

	.click-hint {
		font-size: 1rem;
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.click-hint-small {
		font-size: 0.75rem;
		opacity: 0;
		transition: opacity 0.15s ease;
		margin-left: 0.25rem;
	}

	.file-icon {
		font-size: 1rem;
	}

	.file-ref-small {
		font-size: 0.75rem;
		font-weight: 600;
		color: #475569;
	}

	.behavior-list,
	.dependencies-list {
		margin: 0;
		padding-left: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.behavior-list li,
	.dependencies-list li {
		font-size: 0.875rem;
		color: #334155;
		line-height: 1.6;
		list-style: none;
	}

	.dependency-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		margin: -0.25rem -0.5rem;
		border: none;
		background: transparent;
		color: #475569;
		font-size: 0.875rem;
		font-family: 'Courier New', monospace;
		cursor: pointer;
		border-radius: 0.25rem;
		transition: all 0.15s ease;
	}

	.dependency-link:hover {
		background: #eff6ff;
		color: #1e40af;
	}

	.dependency-link:hover .click-hint-small {
		opacity: 1;
	}

	.code-snippet {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.snippet-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: #f8fafc;
		border-bottom: 1px solid #e2e8f0;
	}

	.language {
		font-size: 0.75rem;
		font-weight: 600;
		color: #475569;
		text-transform: uppercase;
	}

	.line-range {
		font-size: 0.75rem;
		color: #64748b;
	}

	.code-block {
		margin: 0;
		padding: 1rem;
		background: #0f172a;
		color: #e2e8f0;
		font-family: 'Courier New', monospace;
		font-size: 0.8125rem;
		line-height: 1.5;
		overflow-x: auto;
	}

	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		font-size: 0.8125rem;
		padding: 0.375rem 0.75rem;
		background: #e0e7ff;
		color: #4338ca;
		border-radius: 0.375rem;
		font-weight: 500;
	}

	.notes-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.note-item {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem;
		background: #fffbeb;
		border-left: 3px solid #f59e0b;
		border-radius: 0.25rem;
	}

	.note-bullet {
		color: #f59e0b;
		font-weight: 700;
		flex-shrink: 0;
	}

	.note-item p {
		margin: 0;
		font-size: 0.875rem;
		color: #475569;
		line-height: 1.5;
	}

	.chat-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.chat-message {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		border: 1px solid #e2e8f0;
	}

	.chat-message.user {
		background: #eff6ff;
		border-color: #bfdbfe;
	}

	.chat-message.assistant {
		background: #f0fdf4;
		border-color: #bbf7d0;
	}

	.message-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.role {
		font-size: 1rem;
	}

	.timestamp {
		font-size: 0.6875rem;
		color: #64748b;
	}

	.message-content {
		margin: 0;
		font-size: 0.875rem;
		color: #334155;
		line-height: 1.5;
	}

	/* Data Flow Section Styles */
	.data-flow-section {
		background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
		border-left: 4px solid #0ea5e9;
		padding: 1.25rem;
		border-radius: 8px;
	}

	.flow-group {
		margin-bottom: 1rem;
		padding-left: 0.5rem;
	}

	.flow-group:last-child {
		margin-bottom: 0;
	}

	.flow-heading {
		font-size: 0.875rem;
		font-weight: 600;
		color: #0f172a;
		margin: 0 0 0.625rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.flow-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.flow-item {
		padding: 0.625rem 0.75rem;
		background: white;
		border-radius: 6px;
		border: 1px solid #e2e8f0;
		border-left: 3px solid #94a3b8;
	}

	.receives .flow-item {
		border-left-color: #10b981;
	}

	.provides .flow-item {
		border-left-color: #3b82f6;
	}

	.emits .flow-item {
		border-left-color: #f59e0b;
	}

	.stores .flow-item {
		border-left-color: #8b5cf6;
	}

	.flow-name {
		font-family: 'Courier New', monospace;
		font-size: 0.8125rem;
		color: #1e40af;
		font-weight: 600;
	}

	.flow-type {
		font-family: 'Courier New', monospace;
		font-size: 0.75rem;
		color: #64748b;
		margin-left: 0.125rem;
	}

	.flow-desc {
		margin: 0.375rem 0 0 0;
		font-size: 0.8125rem;
		color: #475569;
		line-height: 1.5;
	}

	.flow-meta {
		font-size: 0.75rem;
		color: #0ea5e9;
		font-weight: 500;
		margin-left: 0.5rem;
		display: inline-block;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 3rem 1.5rem;
		color: #94a3b8;
		text-align: center;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		color: #64748b;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.9375rem;
	}

	/* Chat Interface Styles */
	.chat-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		border-top: 1px solid #e2e8f0;
		padding-top: 1.5rem;
		margin-top: 1.5rem;
	}

	.chat-error {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.5rem;
		color: #991b1b;
		font-size: 0.875rem;
	}

	.error-icon {
		font-size: 1rem;
	}

	.chat-container {
		display: flex;
		flex-direction: column;
		height: 400px;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		overflow: hidden;
		background: #f8fafc;
	}

	.chat-messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.chat-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #94a3b8;
		text-align: center;
		padding: 2rem;
	}

	.chat-empty .empty-icon {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}

	.chat-empty p {
		margin: 0.25rem 0;
		font-size: 0.9375rem;
	}

	.chat-empty .hint {
		font-size: 0.8125rem;
		color: #cbd5e1;
	}

	.chat-message {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
	}

	.chat-message.user {
		flex-direction: row-reverse;
	}

	.message-avatar {
		font-size: 1.5rem;
		flex-shrink: 0;
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #fff;
		border-radius: 50%;
		border: 2px solid #e2e8f0;
	}

	.chat-message.user .message-avatar {
		background: #eff6ff;
		border-color: #bfdbfe;
	}

	.message-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-width: 80%;
	}

	.message-text {
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		font-size: 0.9375rem;
		line-height: 1.5;
		background: #fff;
		border: 1px solid #e2e8f0;
		color: #334155;
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.chat-message.user .message-text {
		background: #3b82f6;
		border-color: #3b82f6;
		color: #fff;
	}

	.message-time {
		font-size: 0.6875rem;
		color: #94a3b8;
		padding: 0 0.5rem;
	}

	.chat-message.user .message-time {
		text-align: right;
	}

	.typing-indicator {
		display: flex;
		gap: 0.25rem;
		padding: 0.75rem 1rem;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		width: fit-content;
	}

	.typing-indicator span {
		width: 8px;
		height: 8px;
		background: #94a3b8;
		border-radius: 50%;
		animation: typing 1.4s infinite;
	}

	.typing-indicator span:nth-child(2) {
		animation-delay: 0.2s;
	}

	.typing-indicator span:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes typing {
		0%, 60%, 100% {
			transform: translateY(0);
			opacity: 0.5;
		}
		30% {
			transform: translateY(-10px);
			opacity: 1;
		}
	}

	.chat-input-container {
		display: flex;
		gap: 0.5rem;
		padding: 1rem;
		background: #fff;
		border-top: 1px solid #e2e8f0;
	}

	.chat-input {
		flex: 1;
		padding: 0.75rem 1rem;
		font-size: 0.9375rem;
		font-family: inherit;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		resize: none;
		background: #f8fafc;
		color: #1e293b;
		transition: border-color 0.15s ease;
	}

	.chat-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		background: #fff;
	}

	.chat-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.send-btn {
		padding: 0.75rem 1.5rem;
		font-size: 0.9375rem;
		font-weight: 500;
		color: #fff;
		background: #3b82f6;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.15s ease;
		white-space: nowrap;
		align-self: flex-end;
	}

	.send-btn:hover:not(:disabled) {
		background: #2563eb;
	}

	.send-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
