<script lang="ts">
	import { faComments, faTimes, faPaperPlane, faSpinner, faCircle, faPaperclip, faFile, faDownload } from '@fortawesome/free-solid-svg-icons';
	import Icon from './Icon.svelte';
	import { onMount, onDestroy } from 'svelte';

	interface Case {
		id: string;
		title: string;
	}

	interface Message {
		id: string;
		caseId: string | null;
		senderId: string;
		content: string;
		createdAt: Date;
		readAt: Date | null;
		senderFirstName: string | null;
		senderLastName: string | null;
		senderRole: string | null;
		attachmentDocumentId?: string | null;
		attachmentFileName?: string | null;
		attachmentFileSize?: number | null;
	}

	interface Props {
		cases: Case[];
		currentUserId: string;
		userRole: 'client' | 'lawyer' | 'admin';
		defaultRecipientId?: string | null;
	}

	let { cases, currentUserId, userRole, defaultRecipientId = null }: Props = $props();

	let isOpen = $state(false);
	let selectedCaseId = $state<string | null>(null);
	let messages = $state<Message[]>([]);
	let newMessage = $state('');
	let isLoading = $state(false);
	let isSending = $state(false);
	let unreadCounts = $state<Record<string, number>>({});
	let totalUnread = $state(0);
	let messagesContainer: HTMLDivElement;
	let unreadPollingInterval: ReturnType<typeof setInterval> | null = null;
	let messagePollingInterval: ReturnType<typeof setInterval> | null = null;
	let attachmentFile = $state<File | null>(null);
	let fileInput: HTMLInputElement;

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	// Fetch unread counts on mount
	onMount(() => {
		fetchUnreadCounts();
		// Poll for unread counts every 10 seconds
		unreadPollingInterval = setInterval(fetchUnreadCounts, 10000);
	});

	onDestroy(() => {
		if (unreadPollingInterval) {
			clearInterval(unreadPollingInterval);
		}
		if (messagePollingInterval) {
			clearInterval(messagePollingInterval);
		}
	});

	// Start/stop message polling based on open state
	$effect(() => {
		if (isOpen && selectedCaseId) {
			// Start polling for new messages every 5 seconds
			messagePollingInterval = setInterval(() => {
				if (selectedCaseId) {
					pollNewMessages(selectedCaseId);
				}
			}, 5000);
		} else {
			// Stop polling when closed
			if (messagePollingInterval) {
				clearInterval(messagePollingInterval);
				messagePollingInterval = null;
			}
		}
	});

	async function pollNewMessages(caseId: string) {
		try {
			const res = await fetch(`/api/messages?caseId=${caseId}`);
			if (res.ok) {
				const data = await res.json();
				// Only update if there are new messages
				if (data.messages.length > messages.length) {
					const hadNewMessages = data.messages.length > messages.length;
					messages = data.messages;
					if (hadNewMessages) {
						scrollToBottom();
						// Mark new messages as read
						await markMessagesAsRead(caseId);
					}
				}
			}
		} catch (e) {
			console.error('Failed to poll messages:', e);
		}
	}

	async function fetchUnreadCounts() {
		try {
			const res = await fetch('/api/messages/unread');
			if (res.ok) {
				const data = await res.json();
				unreadCounts = data.unreadByCaseId;
				totalUnread = data.unreadCount;
			}
		} catch (e) {
			console.error('Failed to fetch unread counts:', e);
		}
	}

	async function fetchMessages(caseId: string) {
		isLoading = true;
		try {
			const res = await fetch(`/api/messages?caseId=${caseId}`);
			if (res.ok) {
				const data = await res.json();
				messages = data.messages;
				scrollToBottom();
				// Mark messages as read
				await markMessagesAsRead(caseId);
			}
		} catch (e) {
			console.error('Failed to fetch messages:', e);
		} finally {
			isLoading = false;
		}
	}

	async function markMessagesAsRead(caseId: string) {
		try {
			await fetch('/api/messages/mark-read', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ caseId })
			});
			// Update local unread count
			if (unreadCounts[caseId]) {
				totalUnread -= unreadCounts[caseId];
				unreadCounts[caseId] = 0;
			}
		} catch (e) {
			console.error('Failed to mark messages as read:', e);
		}
	}

	async function sendMessage() {
		if ((!newMessage.trim() && !attachmentFile) || isSending) return;
		
		// For clients with no cases, need a recipient
		const canSend = selectedCaseId || (cases.length === 0 && defaultRecipientId);
		if (!canSend) return;

		isSending = true;
		try {
			let attachmentDocumentId = null;

			// Upload file first if there's an attachment
			if (attachmentFile && selectedCaseId) {
				const formData = new FormData();
				formData.append('file', attachmentFile);
				formData.append('caseId', selectedCaseId);
				const uploadRes = await fetch('/api/documents/upload', {
					method: 'POST',
					body: formData
				});
				if (uploadRes.ok) {
					const uploadData = await uploadRes.json();
					attachmentDocumentId = uploadData.documentId;
				}
			}

			const res = await fetch('/api/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					caseId: selectedCaseId || null,
					recipientId: selectedCaseId ? null : defaultRecipientId,
					content: newMessage.trim() || (attachmentFile ? `Attached: ${attachmentFile.name}` : ''),
					attachmentDocumentId
				})
			});

			if (res.ok) {
				const data = await res.json();
				messages = [...messages, data.message];
				newMessage = '';
				attachmentFile = null;
				scrollToBottom();
			}
		} catch (e) {
			console.error('Failed to send message:', e);
		} finally {
			isSending = false;
		}
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			attachmentFile = target.files[0];
		}
	}

	function removeAttachment() {
		attachmentFile = null;
		if (fileInput) fileInput.value = '';
	}

	function scrollToBottom() {
		setTimeout(() => {
			if (messagesContainer) {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}
		}, 50);
	}

	function selectCase(caseId: string) {
		selectedCaseId = caseId;
		fetchMessages(caseId);
	}

	function toggleSlider() {
		isOpen = !isOpen;
		if (isOpen) {
			if (cases.length > 0 && !selectedCaseId) {
				selectCase(cases[0].id);
			} else if (cases.length === 0) {
				// No cases - show uncategorized message area
				selectedCaseId = null;
				messages = [];
			}
		}
	}

	function formatTime(date: Date): string {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(date));
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}
</script>

<!-- Chat Toggle Button (Fixed position) -->
<button
	onclick={toggleSlider}
	class="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-black shadow-lg transition-transform hover:scale-110 hover:bg-gold-dark"
	aria-label="Toggle chat"
>
	<Icon icon={faComments} size="lg" />
	{#if totalUnread > 0}
		<span class="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
			{totalUnread > 9 ? '9+' : totalUnread}
		</span>
	{/if}
</button>

<!-- Chat Slider Panel -->
<div
	class="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md transform flex-col bg-background shadow-2xl transition-transform duration-300 ease-in-out {isOpen ? 'translate-x-0' : 'translate-x-full'}"
>
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-border bg-secondary px-4 py-3">
		<h2 class="font-title text-xl font-bold">Messages</h2>
		<button
			onclick={toggleSlider}
			class="rounded-lg p-2 transition-colors hover:bg-background"
			aria-label="Close chat"
		>
			<Icon icon={faTimes} />
		</button>
	</div>

	<!-- Case Selector -->
	{#if cases.length > 1}
		<div class="border-b border-border p-3">
			<select
				class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
				bind:value={selectedCaseId}
				onchange={() => selectedCaseId && fetchMessages(selectedCaseId)}
			>
				{#each cases as caseItem}
					<option value={caseItem.id}>
						{caseItem.title}
						{#if unreadCounts[caseItem.id]}
							({unreadCounts[caseItem.id]} unread)
						{/if}
					</option>
				{/each}
			</select>
		</div>
	{:else if cases.length === 1}
		<div class="border-b border-border bg-secondary/50 px-4 py-2 text-sm text-muted-foreground">
			<span class="font-semibold">{cases[0].title}</span>
		</div>
	{/if}

	<!-- Messages Area -->
	<div
		bind:this={messagesContainer}
		class="flex-1 overflow-y-auto p-4"
	>
		{#if cases.length === 0 && !defaultRecipientId}
			<div class="flex h-full items-center justify-center text-center text-muted-foreground">
				<div>
					<Icon icon={faComments} size="2xl" class="mx-auto mb-4 opacity-50" />
					<p>No active cases</p>
					<p class="text-sm">Contact us to get started</p>
				</div>
			</div>
		{:else if cases.length === 0 && defaultRecipientId}
			<!-- Client with no cases can still message -->
			<div class="flex h-full flex-col">
				{#if messages.length === 0}
					<div class="flex flex-1 items-center justify-center text-center text-muted-foreground">
						<div>
							<Icon icon={faComments} size="2xl" class="mx-auto mb-4 opacity-50" />
							<p>Send a message to your attorney</p>
							<p class="text-sm">Your message will be reviewed and a case may be created</p>
						</div>
					</div>
				{:else}
					<div class="space-y-4">
						{#each messages as message}
							{@const isOwn = message.senderId === currentUserId}
							<div class="flex {isOwn ? 'justify-end' : 'justify-start'}">
								<div class="max-w-[80%]">
									<div class="rounded-2xl px-4 py-2 {isOwn ? 'bg-gold text-black rounded-br-md' : 'bg-secondary text-foreground rounded-bl-md'}">
										{#if !isOwn}
											<div class="mb-1 text-xs font-semibold text-gold">
												{message.senderFirstName} {message.senderLastName}
											</div>
										{/if}
										<p class="whitespace-pre-wrap break-words">{message.content}</p>
									</div>
									<div class="mt-1 px-2 text-xs text-muted-foreground {isOwn ? 'text-right' : ''}">
										{formatTime(message.createdAt)}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{:else if isLoading}
			<div class="flex h-full items-center justify-center">
				<Icon icon={faSpinner} class="animate-spin text-gold" size="2xl" />
			</div>
		{:else if messages.length === 0}
			<div class="flex h-full items-center justify-center text-center text-muted-foreground">
				<div>
					<Icon icon={faComments} size="2xl" class="mx-auto mb-4 opacity-50" />
					<p>No messages yet</p>
					<p class="text-sm">Start the conversation!</p>
				</div>
			</div>
		{:else}
			<div class="space-y-4">
				{#each messages as message}
					{@const isOwn = message.senderId === currentUserId}
					<div class="flex {isOwn ? 'justify-end' : 'justify-start'}">
						<div class="max-w-[80%] {isOwn ? 'order-2' : ''}">
							<div
								class="rounded-2xl px-4 py-2 {isOwn
									? 'bg-gold text-black rounded-br-md'
									: 'bg-secondary text-foreground rounded-bl-md'}"
							>
								{#if !isOwn}
									<div class="mb-1 text-xs font-semibold text-gold">
										{message.senderFirstName} {message.senderLastName}
										<span class="ml-1 text-muted-foreground capitalize">({message.senderRole})</span>
									</div>
								{/if}
								<p class="whitespace-pre-wrap break-words">{message.content}</p>
								{#if message.attachmentDocumentId}
									<a 
										href="/api/documents/{message.attachmentDocumentId}" 
										class="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg {isOwn ? 'bg-black/10 hover:bg-black/20' : 'bg-background hover:bg-background/80'} transition-colors"
									>
										<Icon icon={faFile} size="sm" />
										<span class="text-sm font-medium truncate">{message.attachmentFileName || 'Attachment'}</span>
										{#if message.attachmentFileSize}
											<span class="text-xs opacity-70">({formatFileSize(message.attachmentFileSize)})</span>
										{/if}
										<Icon icon={faDownload} size="sm" class="ml-auto" />
									</a>
								{/if}
							</div>
							<div class="mt-1 flex items-center gap-2 px-2 text-xs text-muted-foreground {isOwn ? 'justify-end' : ''}">
								<span>{formatTime(message.createdAt)}</span>
								{#if isOwn && message.readAt}
									<span class="text-green-500">Read</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Message Input -->
	{#if (cases.length > 0 && selectedCaseId) || (cases.length === 0 && defaultRecipientId)}
		<div class="border-t border-border bg-secondary p-4">
			{#if attachmentFile}
				<div class="mb-2 flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm">
					<Icon icon={faFile} class="text-gold" />
					<span class="flex-1 truncate">{attachmentFile.name}</span>
					<span class="text-muted-foreground">({formatFileSize(attachmentFile.size)})</span>
					<button onclick={removeAttachment} class="p-1 hover:text-red-500">
						<Icon icon={faTimes} size="sm" />
					</button>
				</div>
			{/if}
			<div class="flex items-end gap-2">
				{#if selectedCaseId}
					<input 
						type="file" 
						bind:this={fileInput}
						onchange={handleFileSelect}
						class="hidden" 
					/>
					<button
						onclick={() => fileInput?.click()}
						class="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-gold hover:text-gold"
						aria-label="Attach file"
					>
						<Icon icon={faPaperclip} />
					</button>
				{/if}
				<textarea
					bind:value={newMessage}
					onkeydown={handleKeydown}
					placeholder={cases.length === 0 ? "Send a message to your attorney..." : "Type a message..."}
					rows="1"
					class="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
				></textarea>
				<button
					onclick={sendMessage}
					disabled={(!newMessage.trim() && !attachmentFile) || isSending}
					class="flex h-10 w-10 items-center justify-center rounded-lg bg-gold text-black transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
					aria-label="Send message"
				>
					{#if isSending}
						<Icon icon={faSpinner} class="animate-spin" />
					{:else}
						<Icon icon={faPaperPlane} />
					{/if}
				</button>
			</div>
		</div>
	{/if}
</div>

<!-- Backdrop -->
{#if isOpen}
	<button
		onclick={toggleSlider}
		class="fixed inset-0 z-40 bg-black/50 md:hidden"
		aria-label="Close chat backdrop"
	></button>
{/if}
