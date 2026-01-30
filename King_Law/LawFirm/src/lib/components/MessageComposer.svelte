<script lang="ts">
	import { onMount } from 'svelte';
	import { messagesStore } from '$lib/stores/messages.svelte.ts';
	import { toastStore } from '$lib/stores/toast.svelte.ts';
	import AttachmentUploader from './AttachmentUploader.svelte';

	interface Props {
		caseId?: string | null;
		recipientId?: string;
		placeholder?: string;
		showHistory?: boolean;
		onMessageSent?: () => void;
	}

	let { 
		caseId = null, 
		recipientId = undefined, 
		placeholder = 'Type your message...', 
		showHistory = true,
		onMessageSent
	}: Props = $props();

	let messageText = $state('');
	let selectedFile = $state<File | null>(null);
	let sending = $state(false);
	let showAttachment = $state(false);
	let loadingMessages = $state(false);

	onMount(async () => {
		if (showHistory) {
			loadingMessages = true;
			try {
				if (caseId) {
					await messagesStore.fetchMessages(caseId);
				} else {
					await messagesStore.fetchMessages(undefined, true);
				}
			} catch (error) {
				console.error('Failed to load messages:', error);
			} finally {
				loadingMessages = false;
			}
		}
	});

	async function handleSend() {
		if (!messageText.trim() && !selectedFile) return;

		sending = true;
		try {
			let result;
			if (selectedFile) {
				result = await messagesStore.sendMessageWithAttachment(
					caseId ?? null,
					messageText.trim() || 'Attached file',
					selectedFile,
					recipientId
				);
			} else {
				result = await messagesStore.sendMessage(
					caseId ?? null,
					messageText.trim(),
					recipientId
				);
			}

			if (result.success) {
				messageText = '';
				selectedFile = null;
				showAttachment = false;
				toastStore.success('Message sent successfully');
				
				// Refresh messages to show the new message
				if (caseId) {
					await messagesStore.fetchMessages(caseId);
				} else {
					await messagesStore.fetchMessages(undefined, true);
				}
				
				onMessageSent?.();
			} else {
				toastStore.error(result.error || 'Failed to send message');
			}
		} catch (error) {
			console.error('Send message error:', error);
			toastStore.error('Failed to send message');
		} finally {
			sending = false;
		}
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
			handleSend();
		}
	}

	function formatDate(date: Date | string | number): string {
		// Handle Unix timestamps (seconds) - multiply by 1000 to get milliseconds
		let dateObj: Date;
		if (typeof date === 'number') {
			// If it's a small number (Unix seconds), convert to milliseconds
			dateObj = new Date(date < 10000000000 ? date * 1000 : date);
		} else {
			dateObj = new Date(date);
		}
		return dateObj.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}
</script>

<div class="space-y-4">
	<!-- Message History -->
	{#if showHistory && loadingMessages}
		<div class="border border-border rounded-lg p-6 text-center">
			<div class="animate-spin w-6 h-6 border-2 border-gold border-t-transparent rounded-full mx-auto mb-2"></div>
			<p class="text-sm text-muted-foreground">Loading messages...</p>
		</div>
	{:else if showHistory && messagesStore.messages.length > 0}
		<div class="border border-border rounded-lg divide-y divide-border max-h-64 overflow-y-auto">
			{#each messagesStore.messages as item}
				<div class="p-4 bg-background hover:bg-muted/50 transition-colors">
					<div class="flex items-start justify-between gap-2 mb-1">
						<span class="font-medium text-sm">
							{item.sender.firstName} {item.sender.lastName}
							{#if item.sender.role === 'lawyer'}
								<span class="text-gold text-xs">• Attorney</span>
							{/if}
						</span>
						<span class="text-xs text-muted-foreground whitespace-nowrap">
							{formatDate(item.message.createdAt)}
						</span>
					</div>
					<p class="text-sm text-foreground">{item.message.content}</p>
					{#if item.attachment}
						<a
							href="/api/documents/{item.attachment.id}"
							class="inline-flex items-center gap-1 mt-2 text-xs text-gold hover:underline"
						>
							📎 {item.attachment.fileName}
						</a>
					{/if}
				</div>
			{/each}
		</div>
	{:else if showHistory}
		<div class="text-center py-6 text-muted-foreground text-sm">
			No messages yet. Send a message to get started.
		</div>
	{/if}

	<!-- Compose Area -->
	<div class="space-y-3">
		<textarea
			bind:value={messageText}
			onkeydown={handleKeydown}
			{placeholder}
			rows="3"
			disabled={sending}
			class="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold resize-none disabled:opacity-50"
		></textarea>

		{#if showAttachment}
			<AttachmentUploader on:select={handleFileSelect} on:clear={handleFileClear} />
		{/if}

		<div class="flex items-center justify-between gap-3">
			<button
				type="button"
				onclick={() => (showAttachment = !showAttachment)}
				class="inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
			>
				📎 {showAttachment ? 'Hide Attachment' : 'Attach File'}
			</button>

			<button
				type="button"
				onclick={handleSend}
				disabled={sending || (!messageText.trim() && !selectedFile)}
				class="inline-flex items-center gap-2 px-6 py-2 bg-gold hover:bg-gold-dark text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if sending}
					<span class="animate-spin">⏳</span>
					Sending...
				{:else}
					Send Message
				{/if}
			</button>
		</div>
	</div>
</div>
