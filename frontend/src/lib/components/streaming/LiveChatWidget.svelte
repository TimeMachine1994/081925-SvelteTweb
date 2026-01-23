<script lang="ts">
	/**
	 * Live Chat Widget Component
	 * 
	 * Created: January 22, 2026
	 * Real-time chat interface for stream viewers
	 * 
	 * Features:
	 * - Real-time message display with polling
	 * - Anonymous and authenticated messaging
	 * - Auto-scroll to latest messages
	 * - Message validation and character limit
	 * - Clean, accessible UI
	 */

	import { onMount } from 'svelte';
	import type { StreamChatMessage } from '$lib/types/chat';

	// Props interface
	interface Props {
		streamId: string;
		enabled: boolean;
		archived?: boolean;
	}

	let { streamId, enabled, archived = false }: Props = $props();

	// Component state
	let messages = $state<StreamChatMessage[]>([]);
	let newMessage = $state('');
	let userName = $state('');
	let sending = $state(false);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let messagesContainer: HTMLDivElement;
	let pollInterval: NodeJS.Timeout;

	// Enhanced debug logging for chat state diagnosis
	console.log('═══════════════════════════════════════════════════');
	console.log('💬 [CHAT WIDGET] Component initialized');
	console.log('💬 [CHAT WIDGET] Stream ID:', streamId);
	console.log('💬 [CHAT WIDGET] Chat enabled:', enabled);
	console.log('💬 [CHAT WIDGET] Chat archived:', archived);
	console.log('💬 [CHAT WIDGET] Props received:', { streamId, enabled, archived });
	console.log('═══════════════════════════════════════════════════');

	/**
	 * Load chat messages from API
	 */
	async function loadMessages() {
		console.log('💬 [CHAT WIDGET] Loading messages...');
		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/streams/${streamId}/chat/messages?limit=50`);
			
			if (!response.ok) {
				throw new Error('Failed to load messages');
			}

			const data = await response.json();
			
			console.log('✅ [CHAT WIDGET] Messages loaded:', data.messages.length);
			messages = data.messages;

			// Auto-scroll to bottom after messages load
			setTimeout(scrollToBottom, 100);

		} catch (err) {
			console.error('❌ [CHAT WIDGET] Error loading messages:', err);
			error = 'Failed to load chat messages';
		} finally {
			loading = false;
		}
	}

	/**
	 * Send a new chat message
	 */
	async function sendMessage() {
		console.log('💬 [CHAT WIDGET] Sending message...');
		console.log('💬 [CHAT WIDGET] Message length:', newMessage.trim().length);
		console.log('💬 [CHAT WIDGET] User name:', userName);

		// Validate inputs
		if (!newMessage.trim()) {
			console.warn('⚠️ [CHAT WIDGET] Empty message, ignoring');
			return;
		}

		if (!userName.trim()) {
			console.warn('⚠️ [CHAT WIDGET] No user name provided');
			error = 'Please enter your name';
			return;
		}

		if (newMessage.trim().length > 500) {
			console.warn('⚠️ [CHAT WIDGET] Message too long:', newMessage.trim().length);
			error = 'Message must be 500 characters or less';
			return;
		}

		sending = true;
		error = null;

		try {
			const response = await fetch(`/api/streams/${streamId}/chat/messages`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: newMessage.trim(),
					userName: userName.trim()
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to send message');
			}

			console.log('✅ [CHAT WIDGET] Message sent successfully');

			// Clear input
			newMessage = '';

			// Reload messages to show new message
			await loadMessages();

		} catch (err) {
			console.error('❌ [CHAT WIDGET] Error sending message:', err);
			error = err instanceof Error ? err.message : 'Failed to send message';
		} finally {
			sending = false;
		}
	}

	/**
	 * Scroll messages container to bottom
	 */
	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
			console.log('📜 [CHAT WIDGET] Scrolled to bottom');
		}
	}

	/**
	 * Format timestamp for display
	 */
	function formatTime(timestamp: string): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('en-US', { 
			hour: 'numeric', 
			minute: '2-digit' 
		});
	}

	/**
	 * Handle Enter key press in message input
	 */
	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	// Lifecycle: mount and setup polling
	onMount(() => {
		console.log('═══════════════════════════════════════════════════');
		console.log('💬 [CHAT WIDGET] Component MOUNTED');
		console.log('💬 [CHAT WIDGET] Mount state:', { streamId, enabled, archived });
		console.log('═══════════════════════════════════════════════════');

		if (!enabled) {
			console.log('🚫 [CHAT WIDGET] Chat DISABLED - skipping message load');
			console.log('🚫 [CHAT WIDGET] enabled prop value:', enabled);
			return;
		}

		// Load initial messages
		console.log('📥 [CHAT WIDGET] Loading initial messages...');
		loadMessages();

		// Poll for new messages every 2 seconds (only if not archived)
		if (!archived) {
			console.log('🔄 [CHAT WIDGET] LIVE MODE - Starting message polling (2s interval)');
			console.log('🔄 [CHAT WIDGET] archived prop value:', archived);
			pollInterval = setInterval(loadMessages, 2000);
		} else {
			console.log('📼 [CHAT WIDGET] ARCHIVED MODE - Polling DISABLED');
			console.log('📼 [CHAT WIDGET] archived prop value:', archived);
			console.log('📼 [CHAT WIDGET] Users will NOT be able to send messages');
		}

		// Cleanup on unmount
		return () => {
			if (pollInterval) {
				console.log('💬 [CHAT WIDGET] Clearing poll interval');
				clearInterval(pollInterval);
			}
		};
	});

	// Watch for messages changes and scroll
	$effect(() => {
		if (messages.length > 0) {
			scrollToBottom();
		}
	});
</script>

<div class="chat-widget" class:disabled={!enabled}>
	<!-- Chat Header -->
	<div class="chat-header">
		<div class="header-content">
			<h3>💬 Live Chat</h3>
			{#if enabled}
				<span class="message-count">{messages.length} messages</span>
			{:else}
				<span class="disabled-label">Disabled</span>
			{/if}
		</div>
		{#if archived}
			<div class="archived-notice">
				<span>📼 Chat Archived</span>
			</div>
		{/if}
	</div>

	{#if enabled}
		<!-- Messages Container -->
		<div class="messages-container" bind:this={messagesContainer}>
			{#if loading && messages.length === 0}
				<div class="loading-state">
					<p>Loading messages...</p>
				</div>
			{:else if messages.length === 0}
				<div class="empty-state">
					<p>No messages yet</p>
					<p class="help-text">Be the first to say something!</p>
				</div>
			{:else}
				{#each messages as message (message.id)}
					<div class="message" class:deleted={message.deleted}>
						<div class="message-header">
							<strong class="user-name">
								{#if message.isAnonymous}
									👤 {message.userName}
								{:else}
									✓ {message.userName}
								{/if}
							</strong>
							<span class="timestamp">{formatTime(message.timestamp)}</span>
						</div>
						<p class="message-text">
							{#if message.deleted}
								<em>Message deleted by moderator</em>
							{:else}
								{message.message}
							{/if}
						</p>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Chat Input Form (only if not archived) -->
		{#if !archived}
			<form class="chat-input" onsubmit={(e) => { e.preventDefault(); sendMessage(); }}>
				<div class="input-row">
					<input
						type="text"
						bind:value={userName}
						placeholder="Your name"
						required
						disabled={sending}
						class="name-input"
						maxlength="50"
					/>
				</div>
				<div class="input-row">
					<textarea
						bind:value={newMessage}
						placeholder="Type a message..."
						required
						disabled={sending}
						class="message-input"
						maxlength="500"
						rows="2"
						onkeypress={handleKeyPress}
					></textarea>
					<button type="submit" disabled={sending || !newMessage.trim() || !userName.trim()}>
						{#if sending}
							⏳
						{:else}
							📤 Send
						{/if}
					</button>
				</div>
				{#if error}
					<div class="error-message">
						⚠️ {error}
					</div>
				{/if}
				<div class="character-count" class:near-limit={newMessage.length > 450}>
					{newMessage.length}/500
				</div>
			</form>
		{/if}
	{:else}
		<!-- Chat Disabled State -->
		<div class="chat-disabled">
			<p>💬 Chat is currently disabled for this stream</p>
		</div>
	{/if}
</div>

<style>
	.chat-widget {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		display: flex;
		flex-direction: column;
		height: 600px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.chat-widget.disabled {
		opacity: 0.7;
	}

	/* Header */
	.chat-header {
		padding: 1rem;
		border-bottom: 1px solid #e5e7eb;
		background: #f9fafb;
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.chat-header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	.message-count {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
	}

	.disabled-label {
		font-size: 0.875rem;
		color: #ef4444;
		font-weight: 500;
	}

	.archived-notice {
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: #fef3c7;
		border-radius: 0.25rem;
		text-align: center;
	}

	.archived-notice span {
		font-size: 0.875rem;
		color: #92400e;
		font-weight: 500;
	}

	/* Messages Container */
	.messages-container {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		background: white;
	}

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #9ca3af;
	}

	.empty-state p {
		margin: 0.25rem 0;
	}

	.help-text {
		font-size: 0.875rem;
		color: #6b7280;
	}

	/* Message */
	.message {
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: #f3f4f6;
		border-radius: 0.5rem;
		transition: background-color 0.2s;
	}

	.message:hover {
		background: #e5e7eb;
	}

	.message.deleted {
		opacity: 0.6;
		background: #fee2e2;
	}

	.message-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.user-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
	}

	.timestamp {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.message-text {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
		color: #1f2937;
		word-wrap: break-word;
	}

	/* Chat Input */
	.chat-input {
		padding: 1rem;
		border-top: 1px solid #e5e7eb;
		background: #f9fafb;
	}

	.input-row {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.name-input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.message-input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		resize: vertical;
		font-family: inherit;
	}

	.chat-input input:focus,
	.chat-input textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px #93c5fd;
	}

	.chat-input button {
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
		white-space: nowrap;
	}

	.chat-input button:hover:not(:disabled) {
		background: #2563eb;
	}

	.chat-input button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.error-message {
		padding: 0.5rem;
		background: #fee2e2;
		color: #991b1b;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.character-count {
		font-size: 0.75rem;
		color: #6b7280;
		text-align: right;
	}

	.character-count.near-limit {
		color: #dc2626;
		font-weight: 600;
	}

	/* Chat Disabled State */
	.chat-disabled {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
		color: #6b7280;
	}

	.chat-disabled p {
		margin: 0;
		font-size: 1rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.chat-widget {
			height: 500px;
		}

		.input-row {
			flex-direction: column;
		}

		.chat-input button {
			width: 100%;
		}
	}
</style>
