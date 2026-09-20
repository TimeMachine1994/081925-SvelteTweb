<script lang="ts">
	import { onMount } from 'svelte';
	import {
		MessageCircle,
		Trash2,
		Shield,
		RefreshCw,
		ToggleLeft,
		ToggleRight,
		Lock,
		Unlock,
		Flag
	} from 'lucide-svelte';
	import type { MemorialChatMessage } from '$lib/types/chat';

	interface Props {
		memorialId: string;
	}

	let { memorialId }: Props = $props();

	let enabled = $state(true);
	let isLocked = $state(false);
	let isTogglingLock = $state(false);
	let isTogglingEnabled = $state(false);

	let messages = $state<MemorialChatMessage[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let adminMessage = $state('');
	let isSending = $state(false);
	let deletingId = $state<string | null>(null);

	onMount(() => {
		loadSettings();
		loadMessages();
	});

	async function loadSettings() {
		try {
			const response = await fetch(`/api/admin/memorials/${memorialId}/chat/settings`);
			const data = await response.json();
			if (data.success) {
				enabled = data.settings.enabled;
				isLocked = data.settings.locked;
			}
		} catch (err) {
			console.error('[AdminChatPanel] Error loading settings:', err);
		}
	}

	async function loadMessages() {
		isLoading = true;
		error = null;

		try {
			const response = await fetch(`/api/admin/memorials/${memorialId}/chat/messages?limit=200`);
			if (!response.ok) throw new Error('Failed to load messages');

			const data = await response.json();
			if (data.success) {
				messages = data.messages || [];
			}
		} catch (err) {
			console.error('[AdminChatPanel] Error loading messages:', err);
			error = 'Failed to load chat messages';
		} finally {
			isLoading = false;
		}
	}

	async function deleteMessage(messageId: string) {
		if (!confirm('Are you sure you want to delete this message?')) return;

		deletingId = messageId;

		try {
			const response = await fetch(
				`/api/admin/memorials/${memorialId}/chat/messages/${messageId}`,
				{
					method: 'DELETE'
				}
			);

			if (!response.ok) throw new Error('Failed to delete message');

			messages = messages.map((m) => (m.id === messageId ? { ...m, isDeleted: true } : m));
		} catch (err) {
			console.error('[AdminChatPanel] Error deleting message:', err);
			error = 'Failed to delete message';
		} finally {
			deletingId = null;
		}
	}

	async function sendAdminMessage() {
		if (!adminMessage.trim() || isSending) return;

		isSending = true;

		try {
			const response = await fetch(`/api/admin/memorials/${memorialId}/chat/messages`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: adminMessage.trim() })
			});

			if (!response.ok) throw new Error('Failed to send message');

			adminMessage = '';
			await loadMessages();
		} catch (err) {
			console.error('[AdminChatPanel] Error sending message:', err);
			error = 'Failed to send message';
		} finally {
			isSending = false;
		}
	}

	function formatTime(timestamp: string): string {
		return new Date(timestamp).toLocaleString();
	}

	async function toggleChatLock() {
		isTogglingLock = true;

		try {
			const response = await fetch(`/api/admin/memorials/${memorialId}/chat/settings`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ locked: !isLocked })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to toggle chat lock');
			}

			isLocked = !isLocked;
		} catch (err: any) {
			console.error('[AdminChatPanel] Error toggling lock:', err);
			error = err.message || 'Failed to toggle chat lock';
		} finally {
			isTogglingLock = false;
		}
	}

	async function toggleChatEnabled() {
		isTogglingEnabled = true;

		try {
			const response = await fetch(`/api/admin/memorials/${memorialId}/chat/settings`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ enabled: !enabled })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to toggle chat');
			}

			enabled = !enabled;
		} catch (err: any) {
			console.error('[AdminChatPanel] Error toggling chat:', err);
			error = err.message || 'Failed to toggle chat';
		} finally {
			isTogglingEnabled = false;
		}
	}
</script>

<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
		<div class="flex items-center gap-2">
			<MessageCircle class="h-5 w-5 text-blue-600" />
			<h3 class="font-semibold text-gray-900">Chat Moderation</h3>
			<span class="text-xs text-gray-500">({messages.length} messages)</span>
		</div>
		<div class="flex items-center gap-2">
			<button
				onclick={loadMessages}
				class="rounded p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
				title="Refresh messages"
			>
				<RefreshCw class="h-4 w-4" />
			</button>
			<!-- Lock/Unlock Chat Button -->
			<button
				onclick={toggleChatLock}
				disabled={isTogglingLock}
				class="flex items-center gap-1 rounded px-3 py-1 text-sm font-medium transition-colors
					{isLocked
					? 'bg-red-100 text-red-700 hover:bg-red-200'
					: 'bg-blue-100 text-blue-700 hover:bg-blue-200'}
					disabled:cursor-not-allowed disabled:opacity-50"
				title={isLocked ? 'Unlock chat to allow new messages' : 'Lock chat to prevent new messages'}
			>
				{#if isTogglingLock}
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
					></div>
				{:else if isLocked}
					<Lock class="h-4 w-4" />
					Locked
				{:else}
					<Unlock class="h-4 w-4" />
					Unlocked
				{/if}
			</button>
			<!-- Enable/Disable Chat Button -->
			<button
				onclick={toggleChatEnabled}
				disabled={isTogglingEnabled}
				class="flex items-center gap-1 rounded px-3 py-1 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50
					{enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}"
			>
				{#if enabled}
					<ToggleRight class="h-4 w-4" />
					Chat On
				{:else}
					<ToggleLeft class="h-4 w-4" />
					Chat Off
				{/if}
			</button>
		</div>
	</div>

	<!-- Admin send message -->
	<div class="border-b border-gray-200 bg-purple-50 p-3">
		<div class="mb-2 flex items-center gap-2">
			<Shield class="h-4 w-4 text-purple-600" />
			<span class="text-sm font-medium text-purple-700">Send as Admin</span>
		</div>
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={adminMessage}
				placeholder="Type an admin message..."
				class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
				maxlength="500"
				onkeydown={(e) => e.key === 'Enter' && sendAdminMessage()}
			/>
			<button
				onclick={sendAdminMessage}
				disabled={!adminMessage.trim() || isSending}
				class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
			>
				{isSending ? 'Sending...' : 'Send'}
			</button>
		</div>
	</div>

	<!-- Messages list -->
	<div class="max-h-96 overflow-y-auto">
		{#if isLoading}
			<div class="flex items-center justify-center py-8">
				<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
			</div>
		{:else if error}
			<div class="p-4 text-center text-red-600">
				{error}
				<button onclick={loadMessages} class="ml-2 underline">Retry</button>
			</div>
		{:else if messages.length === 0}
			<div class="p-8 text-center text-gray-500">No chat messages yet</div>
		{:else}
			<div class="divide-y divide-gray-100">
				{#each messages as message (message.id)}
					<div
						class="p-3 hover:bg-gray-50 {message.isDeleted
							? 'bg-red-50 opacity-50'
							: ''} {message.flagged ? 'bg-yellow-50' : ''}"
					>
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0 flex-1">
								<div class="mb-1 flex items-center gap-2">
									<span class="text-sm font-medium text-gray-900">{message.userName}</span>
									{#if message.userRole === 'admin'}
										<span
											class="inline-flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700"
										>
											<Shield class="h-3 w-3" />
											Admin
										</span>
									{/if}
									{#if message.authorType === 'guest'}
										<span class="text-xs text-gray-400">(Guest)</span>
									{/if}
									{#if message.flagged}
										<span
											class="inline-flex items-center gap-1 rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800"
										>
											<Flag class="h-3 w-3" />
											Flagged
										</span>
									{/if}
									{#if message.isDeleted}
										<span class="text-xs text-red-500">(Deleted)</span>
									{/if}
								</div>
								<p
									class="text-sm break-words text-gray-700 {message.isDeleted
										? 'line-through'
										: ''}"
								>
									{message.message}
								</p>
								<p class="mt-1 text-xs text-gray-400">{formatTime(message.createdAt)}</p>
							</div>
							{#if !message.isDeleted}
								<button
									onclick={() => deleteMessage(message.id)}
									disabled={deletingId === message.id}
									class="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
									title="Delete message"
								>
									{#if deletingId === message.id}
										<div
											class="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"
										></div>
									{:else}
										<Trash2 class="h-4 w-4" />
									{/if}
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
