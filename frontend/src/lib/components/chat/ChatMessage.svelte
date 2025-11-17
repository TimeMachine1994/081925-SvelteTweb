<script lang="ts">
	import type { ChatMessageDisplay } from '$lib/types/chat';
	import { formatDistanceToNow } from 'date-fns';

	interface Props {
		message: ChatMessageDisplay;
		onEdit?: (messageId: string) => void;
		onDelete?: (messageId: string) => void;
		onReply?: (messageId: string, userName: string) => void;
	}

	let { message, onEdit, onDelete, onReply }: Props = $props();

	// Role badge colors
	const getRoleBadgeClass = (role: string) => {
		switch (role) {
			case 'admin':
				return 'bg-red-100 text-red-800';
			case 'owner':
				return 'bg-blue-100 text-blue-800';
			case 'funeral_director':
				return 'bg-purple-100 text-purple-800';
			case 'viewer':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	// Format timestamp
	const getFormattedTime = (timestamp: Date) => {
		try {
			return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
		} catch {
			return 'just now';
		}
	};

	// Format role name
	const getRoleName = (role: string) => {
		switch (role) {
			case 'funeral_director':
				return 'Director';
			case 'owner':
				return 'Owner';
			case 'admin':
				return 'Admin';
			case 'viewer':
				return 'Viewer';
			default:
				return role;
		}
	};

	let showActions = $state(false);
</script>

<div
	class="group flex flex-col gap-1 py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors"
	onmouseenter={() => (showActions = true)}
	onmouseleave={() => (showActions = false)}
>
	<!-- Header -->
	<div class="flex items-center justify-between gap-2">
		<div class="flex items-center gap-2 min-w-0">
			<!-- User name -->
			<span class="font-medium text-gray-900 text-sm truncate">
				{message.userName}
			</span>

			<!-- Role badge -->
			<span
				class="px-2 py-0.5 rounded text-xs font-medium {getRoleBadgeClass(
					message.userRole
				)}"
			>
				{getRoleName(message.userRole)}
			</span>

			<!-- Timestamp -->
			<span class="text-xs text-gray-500">
				{getFormattedTime(message.timestamp)}
			</span>

			<!-- Edited indicator -->
			{#if message.isEdited}
				<span class="text-xs text-gray-400 italic">(edited)</span>
			{/if}
		</div>

		<!-- Actions -->
		{#if showActions && (message.canEdit || message.canDelete)}
			<div class="flex items-center gap-1 flex-shrink-0">
				{#if message.canEdit}
					<button
						onclick={() => onEdit?.(message.id)}
						class="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
						title="Edit message"
					>
						<svg
							class="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
					</button>
				{/if}

				{#if message.canDelete}
					<button
						onclick={() => onDelete?.(message.id)}
						class="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
						title="Delete message"
					>
						<svg
							class="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
					</button>
				{/if}

				<button
					onclick={() => onReply?.(message.id, message.userName)}
					class="p-1 text-gray-400 hover:text-green-600 rounded transition-colors"
					title="Reply"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
						/>
					</svg>
				</button>
			</div>
		{/if}
	</div>

	<!-- Reply indicator -->
	{#if message.replyTo}
		<div class="text-xs text-gray-500 italic pl-2 border-l-2 border-gray-300">
			Replying to a message
		</div>
	{/if}

	<!-- Message content -->
	<div class="text-gray-700 text-sm break-words whitespace-pre-wrap">
		{message.message}
	</div>
</div>
