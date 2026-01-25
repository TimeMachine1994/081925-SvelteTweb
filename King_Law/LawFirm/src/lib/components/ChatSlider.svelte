<script lang="ts">
	import { messagesStore } from '$lib/stores/messages.svelte';
	import { casesStore } from '$lib/stores/cases.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import MessageBubble from './MessageBubble.svelte';
	import AttachmentUploader from './AttachmentUploader.svelte';
	import { onMount, onDestroy } from 'svelte';

	let { 
		caseId,
		open = false,
		onclose
	}: { 
		caseId?: string;
		open?: boolean;
		onclose?: () => void;
	} = $props();

	let isOpen = $state(open);
	let messageContent = $state('');
	let selectedFile = $state<File | null>(null);
	let messagesContainer: HTMLDivElement;
	let sending = $state(false);

	// Auto-scroll to bottom when new messages arrive
	$effect(() => {
		if (messagesStore.messages.length && messagesContainer) {
			setTimeout(() => {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}, 100);
		}
	});

	onMount(async () => {
		// Load initial messages
		if (caseId) {
			await messagesStore.fetchMessages(caseId);
			messagesStore.startPolling(caseId, 5000);
		}

		// Fetch unread counts
		await messagesStore.fetchUnreadCounts();
	});

	onDestroy(() => {
		messagesStore.stopPolling();
	});

	function toggleChat() {
		isOpen = !isOpen;
		if (!isOpen && onclose) {
			onclose();
		}
	}

	async function handleSend(e: Event) {
		e.preventDefault();

		if ((!messageContent.trim() && !selectedFile) || sending) return;

		sending = true;

		let result;
		if (selectedFile) {
			result = await messagesStore.sendMessageWithAttachment(
				caseId || null,
				messageContent.trim(),
				selectedFile
			);
		} else {
			result = await messagesStore.sendMessage(caseId || null, messageContent.trim());
		}

		if (result.success) {
			messageContent = '';
			selectedFile = null;
		}

		sending = false;
	}

	function handleFileSelect(e: CustomEvent<File>) {
		selectedFile = e.detail;
	}

	function handleFileClear() {
		selectedFile = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend(e);
		}
	}

	let unreadCount = $derived(messagesStore.getUnreadCount(caseId));

	// Sync with external open prop
	$effect(() => {
		isOpen = open;
	});

	// Mark messages as read when chat opens
	$effect(() => {
		if (isOpen && messagesStore.messages.length > 0) {
			const unreadIds = messagesStore.messages
				.filter(item => !item.message.readAt && item.message.senderId !== authStore.user?.id)
				.map(item => item.message.id);
			
			if (unreadIds.length > 0) {
				messagesStore.markAsRead(unreadIds);
			}
		}
	});
</script>

<!-- Toggle Button -->
<button
	onclick={toggleChat}
	class="fixed right-6 bottom-6 w-14 h-14 bg-gold hover:bg-gold-dark text-black rounded-full shadow-lg flex items-center justify-center transition-all z-40"
	aria-label="Toggle chat"
>
	{#if isOpen}
		<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
		</svg>
	{:else}
		<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
			/>
		</svg>
		{#if unreadCount > 0}
			<span
				class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
			>
				{unreadCount > 9 ? '9+' : unreadCount}
			</span>
		{/if}
	{/if}
</button>

<!-- Chat Slider -->
{#if isOpen}
	<!-- Backdrop for mobile -->
	<div
		class="fixed inset-0 bg-black/50 md:hidden z-40"
		onclick={toggleChat}
		role="button"
		tabindex="-1"
	></div>

	<!-- Chat Panel -->
	<div
		class="fixed right-0 top-0 h-full w-full md:w-[400px] bg-background border-l border-border shadow-2xl flex flex-col z-50 transition-transform"
	>
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-border">
			<div>
				<h2 class="font-title text-xl">Messages</h2>
				{#if caseId && casesStore.cases.length > 0}
					{@const currentCase = casesStore.cases.find((c) => c.case.id === caseId)}
					{#if currentCase}
						<p class="text-sm text-muted-foreground">{currentCase.case.title}</p>
					{/if}
				{/if}
			</div>
			<button
				onclick={toggleChat}
				class="p-2 hover:bg-muted rounded-md transition-colors"
				aria-label="Close chat"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Messages Container -->
		<div bind:this={messagesContainer} class="flex-1 overflow-y-auto p-4">
			{#if messagesStore.loading && messagesStore.messages.length === 0}
				<div class="flex items-center justify-center h-full">
					<div class="text-center">
						<div class="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
						<p class="text-sm text-muted-foreground">Loading messages...</p>
					</div>
				</div>
			{:else if messagesStore.messages.length === 0}
				<div class="flex items-center justify-center h-full text-center">
					<div>
						<div class="text-4xl mb-2">💬</div>
						<p class="text-muted-foreground">No messages yet</p>
						<p class="text-sm text-muted-foreground">Start the conversation!</p>
					</div>
				</div>
			{:else}
				{#each messagesStore.messages as item}
					<MessageBubble
						message={item.message}
						sender={item.sender}
						attachment={item.attachment}
						isOwn={item.message.senderId === authStore.user?.id}
					/>
				{/each}
			{/if}
		</div>

		<!-- Input Area -->
		<div class="p-4 border-t border-border">
			<form onsubmit={handleSend} class="space-y-2">
				{#if selectedFile}
					<AttachmentUploader onselect={handleFileSelect} onclear={handleFileClear} />
				{/if}

				<div class="flex gap-2">
					<textarea
						bind:value={messageContent}
						onkeydown={handleKeydown}
						placeholder="Type a message..."
						rows="1"
						class="flex-1 px-3 py-2 border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-gold"
					></textarea>

					{#if !selectedFile}
						<button
							type="button"
							onclick={() => {
								const uploader = document.createElement('input');
								uploader.type = 'file';
								uploader.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt';
								uploader.onchange = (e) => {
									const file = (e.target as HTMLInputElement).files?.[0];
									if (file) selectedFile = file;
								};
								uploader.click();
							}}
							class="px-3 py-2 border border-input rounded-md hover:bg-muted transition-colors"
							aria-label="Attach file"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
								/>
							</svg>
						</button>
					{/if}

					<button
						type="submit"
						disabled={(!messageContent.trim() && !selectedFile) || sending}
						class="px-4 py-2 bg-gold hover:bg-gold-dark text-black font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if sending}
							<div class="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
						{:else}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
							</svg>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
