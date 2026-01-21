<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	type MessageData = {
		message: {
			id: string;
			content: string;
			createdAt: number;
			readAt: number | null;
		};
		sender: {
			id: string;
			firstName: string;
			lastName: string;
			email: string;
			role: string;
		};
		attachment: {
			id: string;
			fileName: string;
			fileSize: number;
			mimeType: string;
		} | null;
	};

	interface Props {
		message: MessageData;
	}

	let { message }: Props = $props();

	const dispatch = createEventDispatcher<{ assign: MessageData }>();

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp * 1000);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffHours = diffMs / (1000 * 60 * 60);

		if (diffHours < 24) {
			return date.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			});
		} else if (diffHours < 48) {
			return 'Yesterday ' + date.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			});
		} else {
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit'
			});
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function handleAssignClick() {
		dispatch('assign', message);
	}
</script>

<div class="bg-background border border-border rounded-lg p-4 hover:border-gold/50 transition-colors">
	<div class="flex items-start justify-between gap-4">
		<div class="flex-1 min-w-0">
			<!-- Sender info -->
			<div class="flex items-center gap-2 mb-2">
				<div class="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-sm font-semibold text-gold">
					{message.sender.firstName.charAt(0)}{message.sender.lastName.charAt(0)}
				</div>
				<div>
					<div class="font-medium text-sm">
						{message.sender.firstName} {message.sender.lastName}
					</div>
					<div class="text-xs text-muted-foreground">{message.sender.email}</div>
				</div>
			</div>

			<!-- Message content -->
			<p class="text-sm text-foreground mb-2 line-clamp-2">{message.message.content}</p>

			<!-- Attachment indicator -->
			{#if message.attachment}
				<a
					href="/api/documents/{message.attachment.id}"
					class="inline-flex items-center gap-1 text-xs text-gold hover:underline"
				>
					📎 {message.attachment.fileName} ({formatFileSize(message.attachment.fileSize)})
				</a>
			{/if}
		</div>

		<div class="flex flex-col items-end gap-2">
			<!-- Timestamp -->
			<span class="text-xs text-muted-foreground whitespace-nowrap">
				{formatDate(message.message.createdAt)}
			</span>

			<!-- Assign button -->
			<button
				type="button"
				onclick={handleAssignClick}
				class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gold hover:bg-gold-dark text-black rounded-md transition-colors"
			>
				📁 Assign to Case
			</button>
		</div>
	</div>
</div>
