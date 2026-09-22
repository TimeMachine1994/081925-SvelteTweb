<script lang="ts">
	import { onDestroy } from 'svelte';
	import { X, Send, Loader2, Lock } from 'lucide-svelte';
	import ChatMessage from './ChatMessage.svelte';
	import ChatToggleButton from './ChatToggleButton.svelte';
	import GuestNamePrompt from './GuestNamePrompt.svelte';
	import type { ChatSettings, MemorialChatMessage } from '$lib/types/chat';

	interface Props {
		memorialId: string;
		memorialName: string;
		currentUserId?: string;
		isMemorialOwner: boolean;
	}

	let { memorialId, memorialName, currentUserId, isMemorialOwner }: Props = $props();

	let isOpen = $state(false);
	let hasLoadedOnce = $state(false);
	let messages = $state<MemorialChatMessage[]>([]);
	let settings = $state<ChatSettings>({
		memorialId,
		enabled: true,
		locked: false,
		archived: false
	});
	let messageInput = $state('');
	let isLoading = $state(false);
	let isSending = $state(false);
	let error = $state('');
	let messagesContainer = $state<HTMLDivElement | undefined>(undefined);
	let showGuestPrompt = $state(false);

	let eventSource: EventSource | undefined;

	function guestName(): string | null {
		if (typeof sessionStorage === 'undefined') return null;
		return sessionStorage.getItem('guestChatName');
	}

	function guestSessionId(): string {
		if (typeof sessionStorage === 'undefined') return crypto.randomUUID();
		let id = sessionStorage.getItem('guestChatSessionId');
		if (!id) {
			id = crypto.randomUUID();
			sessionStorage.setItem('guestChatSessionId', id);
		}
		return id;
	}

	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	function connectStream(since: string) {
		disconnectStream();
		const url = `/api/memorials/${memorialId}/chat/stream?since=${encodeURIComponent(since)}`;
		eventSource = new EventSource(url);
		eventSource.addEventListener('message', (event: MessageEvent) => {
			try {
				const incoming = JSON.parse(event.data) as MemorialChatMessage;
				if (messages.some((m) => m.id === incoming.id)) return;
				messages = [...messages, incoming];
				setTimeout(scrollToBottom, 50);
			} catch (err) {
				console.error('[MemorialChatWidget] Failed to parse SSE message:', err);
			}
		});
		// Native EventSource auto-reconnects on error using the `retry` directive
		// and resumes via `Last-Event-ID` — no manual reconnect logic needed.
		eventSource.onerror = () => {
			console.warn(
				'[MemorialChatWidget] SSE connection interrupted, browser will retry automatically'
			);
		};
	}

	function disconnectStream() {
		eventSource?.close();
		eventSource = undefined;
	}

	async function loadMessages() {
		isLoading = true;
		error = '';

		try {
			const response = await fetch(`/api/memorials/${memorialId}/chat?limit=50`);
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `Server error: ${response.status}`);
			}

			const data = await response.json();
			messages = data.messages || [];
			settings = data.settings || settings;

			const latest = messages[messages.length - 1]?.createdAt || new Date().toISOString();
			connectStream(latest);

			setTimeout(scrollToBottom, 100);
		} catch (err: any) {
			console.error('[MemorialChatWidget] Error loading messages:', err);
			error = err.message || 'Failed to load chat messages. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	async function postMessage(name?: string) {
		const trimmedMessage = messageInput.trim();
		if (!trimmedMessage || isSending) return;

		if (trimmedMessage.length > 500) {
			error = 'Message cannot exceed 500 characters';
			return;
		}

		isSending = true;
		error = '';

		try {
			const response = await fetch(`/api/memorials/${memorialId}/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: trimmedMessage,
					...(!currentUserId && { guestName: name, guestSessionId: guestSessionId() })
				})
			});

			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ message: 'Failed to send message' }));
				throw new Error(errorData.message || 'Failed to send message');
			}

			const newMessage = await response.json();
			if (!messages.some((m) => m.id === newMessage.id)) {
				messages = [...messages, newMessage];
			}
			messageInput = '';
			setTimeout(scrollToBottom, 100);
		} catch (err: any) {
			console.error('[MemorialChatWidget] Error sending message:', err);
			error = err.message || 'Failed to send message';
		} finally {
			isSending = false;
		}
	}

	function handleSendClick() {
		if (!messageInput.trim()) return;
		if (!currentUserId) {
			const existingName = guestName();
			if (existingName) {
				postMessage(existingName);
			} else {
				showGuestPrompt = true;
			}
			return;
		}
		postMessage();
	}

	function handleGuestNameSubmit(name: string) {
		showGuestPrompt = false;
		postMessage(name);
	}

	async function handleDelete(messageId: string) {
		if (!confirm('Are you sure you want to delete this message?')) return;

		try {
			const response = await fetch(`/api/memorials/${memorialId}/chat/${messageId}`, {
				method: 'DELETE'
			});
			if (!response.ok) throw new Error('Failed to delete message');
			messages = messages.filter((m) => m.id !== messageId);
		} catch (err: any) {
			console.error('[MemorialChatWidget] Error deleting message:', err);
			error = 'Failed to delete message';
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSendClick();
		}
	}

	function toggleOpen() {
		isOpen = !isOpen;
		if (isOpen) {
			if (!hasLoadedOnce) {
				hasLoadedOnce = true;
				loadMessages();
			}
		} else {
			disconnectStream();
		}
	}

	onDestroy(() => {
		disconnectStream();
	});
</script>

{#if settings.enabled}
	<div class="flex flex-col gap-3">
		<ChatToggleButton {isOpen} onclick={toggleOpen} />

		{#if isOpen}
			<div
				class="mx-auto w-full max-w-2xl overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-lg transition-all duration-300 ease-in-out"
				style="animation: slideDown 0.3s ease-out;"
			>
				<!-- Header -->
				<div
					class="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 py-3"
				>
					<div class="flex items-center gap-2">
						<h3 class="font-semibold text-gray-900">Memorial Chat</h3>
						<span class="text-sm text-gray-500">·</span>
						<span class="text-sm text-gray-600">{memorialName}</span>
					</div>
					<div class="flex items-center gap-2">
						{#if settings.locked}
							<span class="flex items-center gap-1 text-xs text-gray-500">
								<Lock class="h-3 w-3" />
								Locked
							</span>
						{/if}
						<button
							type="button"
							onclick={toggleOpen}
							class="rounded-full p-1 transition-colors hover:bg-gray-100"
							aria-label="Close chat"
						>
							<X class="h-5 w-5 text-gray-600" />
						</button>
					</div>
				</div>

				<!-- Messages container -->
				<div bind:this={messagesContainer} class="h-96 overflow-y-auto bg-gray-50">
					{#if isLoading}
						<div class="flex h-full items-center justify-center">
							<Loader2 class="h-6 w-6 animate-spin text-[#D5BA7F]" />
						</div>
					{:else if messages.length === 0}
						<div class="flex h-full flex-col items-center justify-center px-4 text-center">
							<p class="mb-2 text-gray-500">No messages yet</p>
							<p class="text-sm text-gray-400">Be the first to share your thoughts</p>
						</div>
					{:else}
						<div class="flex flex-col">
							{#each messages.filter((m) => !m.isDeleted) as message (message.id)}
								<ChatMessage {message} {currentUserId} {isMemorialOwner} onDelete={handleDelete} />
							{/each}
						</div>
					{/if}
				</div>

				<!-- Input area -->
				<div class="border-t border-gray-200 bg-white px-4 py-3">
					{#if error}
						<div class="mb-2 text-sm text-red-600">{error}</div>
					{/if}

					{#if settings.locked}
						<div class="py-2 text-center text-sm text-gray-500">
							Chat is currently locked for new messages.
						</div>
					{:else}
						<div class="flex gap-2">
							<textarea
								bind:value={messageInput}
								onkeydown={handleKeyDown}
								placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
								class="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#D5BA7F]"
								rows="2"
								maxlength="500"
								disabled={isSending}
							></textarea>
							<button
								type="button"
								onclick={handleSendClick}
								disabled={!messageInput.trim() || isSending}
								class="flex items-center justify-center rounded-lg bg-[#D5BA7F] px-4 py-2 text-white transition-colors hover:bg-[#C5AA6F] disabled:cursor-not-allowed disabled:opacity-50"
								aria-label="Send message"
							>
								{#if isSending}
									<Loader2 class="h-5 w-5 animate-spin" />
								{:else}
									<Send class="h-5 w-5" />
								{/if}
							</button>
						</div>
						<div class="mt-1 text-right text-xs text-gray-500">{messageInput.length}/500</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}

{#if showGuestPrompt}
	<GuestNamePrompt onSubmit={handleGuestNameSubmit} onClose={() => (showGuestPrompt = false)} />
{/if}

<style>
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	textarea {
		font-family: inherit;
	}

	div::-webkit-scrollbar {
		width: 8px;
	}

	div::-webkit-scrollbar-track {
		background: #f1f1f1;
	}

	div::-webkit-scrollbar-thumb {
		background: #d5ba7f;
		border-radius: 4px;
	}

	div::-webkit-scrollbar-thumb:hover {
		background: #c5aa6f;
	}
</style>
