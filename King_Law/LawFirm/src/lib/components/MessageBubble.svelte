<script lang="ts">
	import FileIcon from '$lib/components/ui/FileIcon.svelte';
	import { Check, CheckCheck } from 'lucide-svelte';

	type Message = {
		id: string;
		content: string;
		createdAt: Date;
		readAt: Date | null;
	};

	type User = {
		firstName: string;
		lastName: string;
		role: string;
	};

	type Document = {
		id: string;
		fileName: string;
		fileSize: number;
		mimeType: string;
	};

	let {
		message,
		sender,
		attachment,
		isOwn
	}: {
		message: Message;
		sender: User;
		attachment?: Document | null;
		isOwn: boolean;
	} = $props();

	function formatTime(date: Date): string {
		return new Date(date).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

</script>

<div class="flex {isOwn ? 'justify-end' : 'justify-start'} mb-4">
	<div class="max-w-[70%]">
		{#if !isOwn}
			<div class="text-xs text-muted-foreground mb-1 ml-3">
				{sender.firstName} {sender.lastName}
				{#if sender.role === 'lawyer'}
					<span class="text-gold">• Attorney</span>
				{/if}
			</div>
		{/if}

		<div
			class="rounded-lg px-4 py-2 {isOwn
				? 'bg-gold text-black rounded-br-none'
				: 'bg-muted text-foreground rounded-bl-none'}"
		>
			{#if message.content}
				<p class="text-sm whitespace-pre-wrap break-words">{message.content}</p>
			{/if}

			{#if attachment}
				<div
					class="mt-2 p-2 rounded border {isOwn
						? 'border-black/20 bg-black/10'
						: 'border-border bg-background'} flex items-center gap-2"
				>
					<FileIcon mimeType={attachment.mimeType} class="w-6 h-6" />
					<div class="flex-1 min-w-0">
						<div class="text-sm font-medium truncate">{attachment.fileName}</div>
						<div class="text-xs opacity-70">{formatFileSize(attachment.fileSize)}</div>
					</div>
					<a
						href="/api/documents/{attachment.id}"
						download
						class="px-3 py-1 text-xs rounded {isOwn
							? 'bg-black/20 hover:bg-black/30'
							: 'bg-gold hover:bg-gold-dark'} text-black font-semibold transition-colors"
					>
						Download
					</a>
				</div>
			{/if}

			<div class="flex items-center gap-2 mt-1">
				<span class="text-xs opacity-70">{formatTime(message.createdAt)}</span>
				{#if isOwn}
					{#if message.readAt}
					<CheckCheck class="w-3.5 h-3.5" />
				{:else}
					<Check class="w-3.5 h-3.5" />
				{/if}
				{/if}
			</div>
		</div>
	</div>
</div>
