<script lang="ts">
	import { MessageCircle, Clock } from 'lucide-svelte';
	import type { ChatMessage } from '$lib/types/chat';

	interface Props {
		comment: ChatMessage;
		memorialName?: string;
	}

	let { comment, memorialName }: Props = $props();

	function formatTimestamp(timestamp: any) {
		try {
			const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
			const now = new Date();
			const diff = now.getTime() - date.getTime();
			const hours = Math.floor(diff / (1000 * 60 * 60));
			const days = Math.floor(hours / 24);

			if (days > 7) {
				return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
			} else if (days > 0) {
				return `${days} day${days > 1 ? 's' : ''} ago`;
			} else if (hours > 0) {
				return `${hours} hour${hours > 1 ? 's' : ''} ago`;
			} else {
				return 'Just now';
			}
		} catch {
			return 'Recently';
		}
	}

	function truncateMessage(message: string, maxLength: number = 150) {
		if (message.length <= maxLength) return message;
		return message.substring(0, maxLength) + '...';
	}
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
	<div class="flex items-start gap-3">
		<div class="bg-purple-100 rounded-full p-2 flex-shrink-0">
			<MessageCircle class="h-5 w-5 text-purple-600" />
		</div>

		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-1">
				<span class="text-sm font-medium text-gray-900">
					{memorialName || 'Memorial'}
				</span>
				<span class="text-xs text-gray-500">•</span>
				<div class="flex items-center text-xs text-gray-500">
					<Clock class="h-3 w-3 mr-1" />
					{formatTimestamp(comment.timestamp)}
				</div>
			</div>

			<p class="text-sm text-gray-700 mb-2">
				{truncateMessage(comment.message)}
			</p>

			<a
				href="/{comment.memorialId}#comment-{comment.id}"
				class="text-xs text-blue-600 hover:text-blue-700 font-medium"
			>
				View full comment →
			</a>
		</div>
	</div>
</div>
