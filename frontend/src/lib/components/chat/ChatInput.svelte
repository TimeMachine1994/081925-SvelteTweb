<script lang="ts">
	interface Props {
		onSend: (message: string, replyTo?: string) => Promise<void>;
		disabled?: boolean;
		replyingTo?: { id: string; userName: string } | null;
		onCancelReply?: () => void;
	}

	let { onSend, disabled = false, replyingTo = null, onCancelReply }: Props = $props();

	let message = $state('');
	let sending = $state(false);
	let error = $state<string | null>(null);

	const handleSubmit = async () => {
		if (!message.trim() || sending || disabled) return;

		// Client-side validation
		if (message.length > 500) {
			error = 'Message too long (max 500 characters)';
			return;
		}

		sending = true;
		error = null;

		try {
			await onSend(message.trim(), replyingTo?.id);
			message = ''; // Clear input on success
			if (onCancelReply) onCancelReply();
		} catch (err: any) {
			error = err.message || 'Failed to send message';
		} finally {
			sending = false;
		}
	};

	const handleKeyPress = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};
</script>

<div class="border-t border-gray-200 bg-white">
	<!-- Reply indicator -->
	{#if replyingTo}
		<div class="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
			<div class="flex items-center gap-2 text-sm text-blue-800">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
					/>
				</svg>
				<span>Replying to <strong>{replyingTo.userName}</strong></span>
			</div>
			<button
				onclick={onCancelReply}
				class="text-blue-600 hover:text-blue-800 transition-colors"
				title="Cancel reply"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>
	{/if}

	<!-- Error message -->
	{#if error}
		<div class="px-4 py-2 bg-red-50 border-b border-red-100">
			<p class="text-sm text-red-800">{error}</p>
		</div>
	{/if}

	<!-- Input area -->
	<div class="p-4">
		<div class="flex gap-2">
			<div class="flex-1">
				<textarea
					bind:value={message}
					onkeydown={handleKeyPress}
					placeholder={disabled
						? 'Please sign in to chat'
						: 'Type your message... (Press Enter to send, Shift+Enter for new line)'}
					{disabled}
					rows="2"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
					maxlength="500"
				></textarea>
				<div class="mt-1 flex items-center justify-between">
					<span class="text-xs text-gray-500">
						{message.length}/500 characters
					</span>
					{#if !disabled}
						<span class="text-xs text-gray-400">
							Press Enter to send
						</span>
					{/if}
				</div>
			</div>
			<button
				onclick={handleSubmit}
				disabled={disabled || sending || !message.trim()}
				class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-fit flex items-center gap-2"
			>
				{#if sending}
					<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<span>Sending...</span>
				{:else}
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
						/>
					</svg>
					<span>Send</span>
				{/if}
			</button>
		</div>
	</div>
</div>
