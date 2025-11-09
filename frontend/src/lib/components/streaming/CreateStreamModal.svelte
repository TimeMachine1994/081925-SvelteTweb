<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { X } from 'lucide-svelte';
	import type { CreateLiveSessionResponse } from '$lib/types/stream-v2';

	export let memorialId: string;

	const dispatch = createEventDispatcher();

	let title = '';
	let description = '';
	let loading = false;
	let error = '';

	async function handleCreate() {
		if (!title.trim()) {
			error = 'Please enter a stream title';
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await fetch('/api/live-streams/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					memorialId,
					title: title.trim(),
					description: description.trim()
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to create stream');
			}

			const data: CreateLiveSessionResponse = await response.json();
			dispatch('created', data.stream);
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	function handleClose() {
		if (!loading) {
			dispatch('close');
		}
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
	on:click={handleClose}
	on:keydown={(e) => e.key === 'Escape' && handleClose()}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<div
		class="w-full max-w-lg rounded-2xl bg-white shadow-xl"
		on:click|stopPropagation
		role="dialog"
		aria-modal="true"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-200 p-6">
			<h2 class="text-2xl font-bold text-gray-900">Create Live Stream</h2>
			<button
				on:click={handleClose}
				disabled={loading}
				class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		<!-- Body -->
		<div class="p-6">
			<form on:submit|preventDefault={handleCreate} class="space-y-4">
				<!-- Title -->
				<div>
					<label for="title" class="mb-2 block text-sm font-medium text-gray-700">
						Stream Title <span class="text-red-500">*</span>
					</label>
					<input
						id="title"
						type="text"
						bind:value={title}
						disabled={loading}
						placeholder="e.g., Memorial Service Live Stream"
						class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
						required
					/>
				</div>

				<!-- Description -->
				<div>
					<label for="description" class="mb-2 block text-sm font-medium text-gray-700">
						Description (Optional)
					</label>
					<textarea
						id="description"
						bind:value={description}
						disabled={loading}
						placeholder="Add any details about this stream..."
						rows="3"
						class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
					></textarea>
				</div>

				<!-- Info Box -->
				<div class="rounded-lg bg-blue-50 p-4">
					<p class="text-sm text-blue-800">
						<strong>Note:</strong> This will create a new livestream session with browser WHIP streaming
						enabled. The stream will be automatically recorded to Mux for playback after the event.
					</p>
				</div>

				<!-- Error Message -->
				{#if error}
					<div class="rounded-lg bg-red-50 p-4">
						<p class="text-sm text-red-800">{error}</p>
					</div>
				{/if}

				<!-- Buttons -->
				<div class="flex gap-3">
					<button
						type="button"
						on:click={handleClose}
						disabled={loading}
						class="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={loading || !title.trim()}
						class="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
					>
						{loading ? 'Creating...' : 'Create Stream'}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
