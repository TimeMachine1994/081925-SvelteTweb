<script lang="ts">
	import { Icon } from '$lib/components';
	import { faPaperPlane, faPaperclip, faTimes, faMessage } from '@fortawesome/free-solid-svg-icons';
	
	interface Message {
		id: string;
		content: string;
		senderId: string;
		senderName: string;
		senderLastName: string;
		senderRole: string;
		createdAt: Date;
		readAt: Date | null;
		attachmentDocumentId?: string | null;
	}
	
	interface Props {
		caseId: string;
		currentUserId: string;
		messages: Message[];
		onSendMessage: (content: string) => Promise<void>;
	}
	
	let { caseId, currentUserId, messages = $bindable([]), onSendMessage }: Props = $props();
	
	let newMessage = $state('');
	let sending = $state(false);
	let isExpanded = $state(true);
	let messagesContainer: HTMLDivElement;
	
	async function handleSend() {
		if (!newMessage.trim() || sending) return;
		
		sending = true;
		try {
			await onSendMessage(newMessage);
			newMessage = '';
			
			// Scroll to bottom after sending
			setTimeout(() => {
				if (messagesContainer) {
					messagesContainer.scrollTop = messagesContainer.scrollHeight;
				}
			}, 100);
		} catch (error) {
			console.error('Failed to send message:', error);
		} finally {
			sending = false;
		}
	}
	
	function formatTime(date: Date) {
		const d = new Date(date);
		const now = new Date();
		const diff = now.getTime() - d.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		
		if (days === 0) {
			return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
		} else if (days === 1) {
			return 'Yesterday';
		} else if (days < 7) {
			return d.toLocaleDateString('en-US', { weekday: 'short' });
		} else {
			return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		}
	}
	
	$effect(() => {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	});
</script>

<div class="message-panel flex flex-col h-full bg-background border-l border-gray-300 dark:border-gray-700">
	<!-- Header -->
	<div class="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700">
		<div class="flex items-center gap-2">
			<Icon icon={faMessage} class="text-gold" />
			<h3 class="font-title text-lg font-semibold">Messages</h3>
		</div>
		<button
			onclick={() => (isExpanded = !isExpanded)}
			class="p-2 hover:bg-secondary rounded-lg transition-colors"
		>
			<Icon icon={faTimes} />
		</button>
	</div>

	{#if isExpanded}
		<!-- Messages List -->
		<div
			bind:this={messagesContainer}
			class="flex-1 overflow-y-auto p-4 space-y-4"
		>
			{#if messages.length === 0}
				<div class="text-center text-muted-foreground py-8">
					<Icon icon={faMessage} size="2x" class="mb-2 opacity-50" />
					<p>No messages yet</p>
					<p class="text-sm mt-1">Start a conversation with your attorney</p>
				</div>
			{:else}
				{#each messages as message}
					{@const isSent = message.senderId === currentUserId}
					<div class="flex {isSent ? 'justify-end' : 'justify-start'}">
						<div
							class="max-w-[80%] rounded-lg p-3 {isSent
								? 'bg-gold text-black'
								: 'bg-secondary'}"
						>
							{#if !isSent}
								<div class="text-xs font-semibold mb-1">
									{message.senderName} {message.senderLastName}
									<span class="text-muted-foreground ml-1">
										({message.senderRole})
									</span>
								</div>
							{/if}
							<p class="text-sm whitespace-pre-wrap">{message.content}</p>
							<div
								class="text-xs mt-1 {isSent
									? 'text-black/70'
									: 'text-muted-foreground'}"
							>
								{formatTime(message.createdAt)}
								{#if isSent && message.readAt}
									<span class="ml-1">✓✓</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Message Input -->
		<div class="p-4 border-t border-gray-300 dark:border-gray-700">
			<div class="flex gap-2">
				<textarea
					bind:value={newMessage}
					onkeydown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							handleSend();
						}
					}}
					placeholder="Type a message..."
					class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-gold focus:border-transparent bg-background"
					rows="2"
					disabled={sending}
				></textarea>
				<button
					onclick={handleSend}
					disabled={!newMessage.trim() || sending}
					class="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<Icon icon={faPaperPlane} />
				</button>
			</div>
			<p class="text-xs text-muted-foreground mt-1">Press Enter to send, Shift+Enter for new line</p>
		</div>
	{/if}
</div>

<style>
	.message-panel {
		width: 100%;
		max-width: 400px;
	}

	@media (max-width: 768px) {
		.message-panel {
			max-width: 100%;
		}
	}
</style>
