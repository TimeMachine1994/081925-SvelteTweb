<script lang="ts">
	import { X } from 'lucide-svelte';

	interface Props {
		onSubmit: (name: string) => void;
		onClose?: () => void;
	}

	let { onSubmit, onClose }: Props = $props();

	let guestName = $state('');
	let error = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();

		const trimmedName = guestName.trim();

		if (trimmedName.length < 2) {
			error = 'Name must be at least 2 characters';
			return;
		}

		if (trimmedName.length > 30) {
			error = 'Name must be 30 characters or less';
			return;
		}

		// Store in sessionStorage for persistence during session
		sessionStorage.setItem('guestChatName', trimmedName);
		onSubmit(trimmedName);
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
	<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-semibold text-gray-900">Join the Chat</h2>
			{#if onClose}
				<button
					onclick={onClose}
					class="text-gray-400 transition-colors hover:text-gray-600"
					aria-label="Close"
				>
					<X class="h-5 w-5" />
				</button>
			{/if}
		</div>

		<p class="mb-4 text-gray-600">Enter your name to participate in the live chat.</p>

		<form onsubmit={handleSubmit}>
			<div class="mb-4">
				<label for="guestName" class="mb-1 block text-sm font-medium text-gray-700">
					Your Name
				</label>
				<input
					type="text"
					id="guestName"
					bind:value={guestName}
					placeholder="Enter your name"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
					maxlength="30"
					autofocus
				/>
				{#if error}
					<p class="mt-1 text-sm text-red-500">{error}</p>
				{/if}
			</div>

			<button
				type="submit"
				class="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
			>
				Join Chat
			</button>
		</form>

		<p class="mt-4 text-center text-xs text-gray-500">
			Your name will be visible to other viewers and moderators.
		</p>
	</div>
</div>
