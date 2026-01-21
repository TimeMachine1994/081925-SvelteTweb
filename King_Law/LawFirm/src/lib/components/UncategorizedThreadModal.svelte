<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import { messagesStore } from '$lib/stores/messages.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import AttachmentUploader from '$lib/components/AttachmentUploader.svelte';

	type Message = {
		id: string;
		content: string;
		createdAt: Date | string;
		attachmentDocumentId: string | null;
	};

	type Sender = {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
	};

	type MessageWithSender = {
		message: Message;
		sender: Sender;
	};

	let { 
		open = false, 
		client,
		messages = [],
		onclose,
		oncreatecase
	}: { 
		open?: boolean; 
		client: Sender | null;
		messages?: MessageWithSender[];
		onclose?: () => void;
		oncreatecase?: (client: Sender, messages: Message[]) => void;
	} = $props();

	let replyText = $state('');
	let sending = $state(false);
	let selectedFile = $state<File | null>(null);

	async function handleSendReply() {
		if (!replyText.trim() || !client) return;

		sending = true;

		let result;
		if (selectedFile) {
			result = await messagesStore.sendMessageWithAttachment(
				null, // uncategorized - no caseId
				replyText,
				selectedFile,
				client.id
			);
		} else {
			result = await messagesStore.sendMessage(null, replyText, client.id);
		}

		sending = false;

		if (result.success) {
			replyText = '';
			selectedFile = null;
			toastStore.success('Reply sent');
			// Refresh messages
			await messagesStore.fetchMessages(undefined, true);
		} else {
			toastStore.error(result.error || 'Failed to send reply');
		}
	}

	function handleCreateCase() {
		if (client && oncreatecase) {
			oncreatecase(client, messages.map(m => m.message));
		}
	}

	function handleClose() {
		replyText = '';
		selectedFile = null;
		if (onclose) onclose();
	}

	function handleFileSelect(e: CustomEvent<File>) {
		selectedFile = e.detail;
	}

	function handleFileClear() {
		selectedFile = null;
	}

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<Modal {open} title="Uncategorized Thread" size="lg" onclose={handleClose}>
	{#if client}
		<div class="space-y-4">
			<!-- Client Info -->
			<div class="bg-muted border border-border rounded-lg p-4">
				<div class="flex items-center justify-between">
					<div>
						<div class="font-medium">
							{client.firstName} {client.lastName}
						</div>
						<div class="text-sm text-muted-foreground">{client.email}</div>
					</div>
					<button
						type="button"
						onclick={handleCreateCase}
						class="px-4 py-2 bg-gold hover:bg-gold-dark text-black font-semibold rounded-md transition-colors text-sm"
					>
						Create Case
					</button>
				</div>
			</div>

			<!-- Messages -->
			<div class="border border-border rounded-lg overflow-hidden">
				<div class="max-h-80 overflow-y-auto p-4 space-y-3 bg-muted/30">
					{#if messages.length > 0}
						{#each messages as { message, sender }}
							<div class="p-3 rounded-lg {sender.id === client.id 
								? 'bg-muted mr-8' 
								: 'bg-gold/10 ml-8'}">
								<div class="flex justify-between items-start mb-1 gap-2">
									<span class="font-medium text-sm">
										{sender.firstName} {sender.lastName}
									</span>
									<span class="text-xs text-muted-foreground whitespace-nowrap">
										{formatDate(message.createdAt)}
									</span>
								</div>
								<p class="text-sm whitespace-pre-wrap">{message.content}</p>
								{#if message.attachmentDocumentId}
									<div class="mt-2">
										<a 
											href="/api/documents/{message.attachmentDocumentId}" 
											class="text-xs text-gold hover:underline inline-flex items-center gap-1"
											target="_blank"
										>
											📎 View Attachment
										</a>
									</div>
								{/if}
							</div>
						{/each}
					{:else}
						<div class="text-center py-8 text-muted-foreground">
							No messages in this thread
						</div>
					{/if}
				</div>

				<!-- Reply Form -->
				<div class="border-t border-border p-4 bg-background">
					<div class="space-y-3">
						<textarea
							bind:value={replyText}
							placeholder="Type your reply..."
							rows="3"
							disabled={sending}
							class="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
						></textarea>

						<AttachmentUploader 
							on:select={handleFileSelect} 
							on:clear={handleFileClear} 
						/>

						<div class="flex justify-end">
							<button
								type="button"
								onclick={handleSendReply}
								disabled={sending || !replyText.trim()}
								class="px-6 py-2 bg-gold hover:bg-gold-dark text-black font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{sending ? 'Sending...' : 'Send Reply'}
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex gap-3 justify-end pt-4 border-t border-border">
				<button
					type="button"
					onclick={handleClose}
					class="px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
				>
					Close
				</button>
			</div>
		</div>
	{:else}
		<div class="text-center py-12 text-muted-foreground">
			<p>No thread selected</p>
		</div>
	{/if}
</Modal>
