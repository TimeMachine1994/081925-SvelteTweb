<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { ChatMessage, ChatMessageDisplay } from '$lib/types/chat';
	import ChatMessageComponent from './ChatMessage.svelte';
	import ChatInput from './ChatInput.svelte';

	interface Props {
		memorialId: string;
		memorialName: string;
		currentUserId?: string;
		currentUserRole?: string;
		isMemorialOwner?: boolean;
		isAuthenticated: boolean;
	}

	let {
		memorialId,
		memorialName,
		currentUserId,
		currentUserRole,
		isMemorialOwner = false,
		isAuthenticated
	}: Props = $props();

	let messages = $state<ChatMessageDisplay[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let pollInterval: ReturnType<typeof setInterval> | null = null;
	let messagesContainer: HTMLDivElement;
	let editingMessageId = $state<string | null>(null);
	let editingMessageText = $state('');
	let replyingTo = $state<{ id: string; userName: string } | null>(null);

	// Auto-scroll to bottom
	const scrollToBottom = (smooth = true) => {
		if (messagesContainer) {
			messagesContainer.scrollTo({
				top: messagesContainer.scrollHeight,
				behavior: smooth ? 'smooth' : 'auto'
			});
		}
	};

	// Fetch messages
	const fetchMessages = async () => {
		try {
			const response = await fetch(`/api/memorials/${memorialId}/chat?limit=100`);

			if (!response.ok) {
				throw new Error('Failed to fetch messages');
			}

			const data = await response.json();
			const newMessages: ChatMessageDisplay[] = data.messages.map((msg: ChatMessage) => ({
				...msg,
				userDisplayName: msg.userName,
				canEdit: isAuthenticated && msg.userId === currentUserId,
				canDelete:
					isAuthenticated && (msg.userId === currentUserId || isMemorialOwner || currentUserRole === 'admin'),
				isOwn: msg.userId === currentUserId
			}));

			// Only scroll if we're already at bottom or if this is initial load
			const wasAtBottom =
				messagesContainer &&
				messagesContainer.scrollHeight - messagesContainer.scrollTop <=
					messagesContainer.clientHeight + 100;

			messages = newMessages;

			if (loading || wasAtBottom) {
				setTimeout(() => scrollToBottom(!loading), 100);
			}

			loading = false;
			error = null;
		} catch (err: any) {
			console.error('Error fetching messages:', err);
			error = err.message;
			loading = false;
		}
	};

	// Send message
	const sendMessage = async (messageText: string, replyToId?: string) => {
		const response = await fetch(`/api/memorials/${memorialId}/chat`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				message: messageText,
				...(replyToId && { replyTo: replyToId })
			})
		});

		if (!response.ok) {
			const data = await response.json();
			throw new Error(data.message || 'Failed to send message');
		}

		// Refresh messages immediately
		await fetchMessages();
	};

	// Edit message
	const handleEdit = async (messageId: string) => {
		const message = messages.find((m) => m.id === messageId);
		if (!message) return;

		const newMessage = prompt('Edit message:', message.message);
		if (!newMessage || newMessage === message.message) return;

		try {
			const response = await fetch(`/api/memorials/${memorialId}/chat/${messageId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ message: newMessage })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to edit message');
			}

			// Refresh messages
			await fetchMessages();
		} catch (err: any) {
			alert(err.message || 'Failed to edit message');
		}
	};

	// Delete message
	const handleDelete = async (messageId: string) => {
		if (!confirm('Are you sure you want to delete this message?')) return;

		try {
			const response = await fetch(`/api/memorials/${memorialId}/chat/${messageId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to delete message');
			}

			// Refresh messages
			await fetchMessages();
		} catch (err: any) {
			alert(err.message || 'Failed to delete message');
		}
	};

	// Handle reply
	const handleReply = (messageId: string, userName: string) => {
		replyingTo = { id: messageId, userName };
	};

	// Cancel reply
	const cancelReply = () => {
		replyingTo = null;
	};

	// Start polling for new messages
	const startPolling = () => {
		pollInterval = setInterval(fetchMessages, 10000); // Poll every 10 seconds
	};

	// Stop polling
	const stopPolling = () => {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
	};

	// Lifecycle
	onMount(() => {
		fetchMessages();
		startPolling();
	});

	onDestroy(() => {
		stopPolling();
	});
</script>

<div class="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden">
	<!-- Header -->
	<div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
		<h3 class="font-semibold text-lg">Memorial Chat</h3>
		<p class="text-sm text-blue-100">
			{memorialName}
		</p>
	</div>

	<!-- Messages container -->
	<div
		bind:this={messagesContainer}
		class="flex-1 overflow-y-auto px-4 py-3 space-y-1"
		style="max-height: 500px; min-height: 300px;"
	>
		{#if loading}
			<div class="flex items-center justify-center h-full">
				<div class="text-center">
					<svg
						class="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<p class="text-gray-500">Loading chat...</p>
				</div>
			</div>
		{:else if error}
			<div class="flex items-center justify-center h-full">
				<div class="text-center">
					<svg
						class="w-12 h-12 text-red-500 mx-auto mb-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<p class="text-gray-700 font-medium">Error loading chat</p>
					<p class="text-gray-500 text-sm">{error}</p>
					<button
						onclick={fetchMessages}
						class="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Try Again
					</button>
				</div>
			</div>
		{:else if messages.length === 0}
			<div class="flex items-center justify-center h-full">
				<div class="text-center">
					<svg
						class="w-16 h-16 text-gray-300 mx-auto mb-3"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
						/>
					</svg>
					<p class="text-gray-500 font-medium">No messages yet</p>
					<p class="text-gray-400 text-sm">
						{isAuthenticated
							? 'Be the first to share your thoughts'
							: 'Sign in to join the conversation'}
					</p>
				</div>
			</div>
		{:else}
			{#each messages as message (message.id)}
				<ChatMessageComponent
					{message}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onReply={handleReply}
				/>
			{/each}
		{/if}
	</div>

	<!-- Input area -->
	<ChatInput
		onSend={sendMessage}
		disabled={!isAuthenticated}
		{replyingTo}
		onCancelReply={cancelReply}
	/>
</div>
