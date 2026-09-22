<script lang="ts">
	import type { MemorialChatMessage } from '$lib/types/chat';
	import { Pencil, Trash2 } from 'lucide-svelte';

	interface Props {
		message: MemorialChatMessage;
		currentUserId?: string;
		isMemorialOwner: boolean;
		onEdit?: (messageId: string) => void;
		onDelete?: (messageId: string) => void;
	}

	let { message, currentUserId, isMemorialOwner, onEdit, onDelete }: Props = $props();

	const isOwnMessage = $derived(message.authorType === 'user' && message.userId === currentUserId);
	const canEdit = $derived(isOwnMessage && !message.isDeleted);
	const canDelete = $derived((isOwnMessage || isMemorialOwner) && !message.isDeleted);

	// Format timestamp
	const formattedTime = $derived(() => {
		try {
			const date = new Date(message.createdAt);
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} catch {
			return '';
		}
	});

	// Role badge color
	const roleBadgeClass = $derived(() => {
		if (message.authorType === 'guest') return 'bg-gray-100 text-gray-500';
		switch (message.userRole) {
			case 'admin':
				return 'bg-red-100 text-red-800';
			case 'owner':
				return 'bg-purple-100 text-purple-800';
			case 'funeral_director':
				return 'bg-blue-100 text-blue-800';
			default:
				return 'bg-gray-100 text-gray-700';
		}
	});

	// Role display name
	const roleDisplay = $derived(() => {
		if (message.authorType === 'guest') return 'Guest';
		switch (message.userRole) {
			case 'admin':
				return 'Admin';
			case 'owner':
				return 'Family';
			case 'funeral_director':
				return 'Director';
			default:
				return 'Viewer';
		}
	});
</script>

<div class="group flex flex-col gap-1 px-4 py-2 transition-colors hover:bg-gray-50">
	<!-- Message header -->
	<div class="flex items-center gap-2 text-sm">
		<span class="font-semibold text-gray-900">{message.userName}</span>
		<span class="rounded px-2 py-0.5 text-xs font-medium {roleBadgeClass()}">
			{roleDisplay()}
		</span>
		<span class="text-xs text-gray-500">{formattedTime()}</span>
		{#if message.isEdited}
			<span class="text-xs text-gray-400 italic">(edited)</span>
		{/if}
	</div>

	<!-- Message content -->
	<div class="text-sm break-words whitespace-pre-wrap text-gray-800">
		{message.message}
	</div>

	<!-- Message actions (show on hover if user has permissions) -->
	{#if (canEdit || canDelete) && !message.isDeleted}
		<div class="mt-1 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
			{#if canEdit && onEdit}
				<button
					type="button"
					onclick={() => onEdit?.(message.id)}
					class="flex items-center gap-1 text-xs text-gray-600 transition-colors hover:text-[#D5BA7F]"
					aria-label="Edit message"
				>
					<Pencil class="h-3 w-3" />
					Edit
				</button>
			{/if}
			{#if canDelete && onDelete}
				<button
					type="button"
					onclick={() => onDelete?.(message.id)}
					class="flex items-center gap-1 text-xs text-gray-600 transition-colors hover:text-red-600"
					aria-label="Delete message"
				>
					<Trash2 class="h-3 w-3" />
					Delete
				</button>
			{/if}
		</div>
	{/if}
</div>
