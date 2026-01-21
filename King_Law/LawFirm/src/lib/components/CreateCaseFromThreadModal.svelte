<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import { casesStore } from '$lib/stores/cases.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

	type Client = {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
	};

	type ThreadMessage = {
		id: string;
		content: string;
		createdAt: Date;
	};

	let { 
		open = false, 
		client,
		threadMessages = [],
		onclose,
		oncreated
	}: { 
		open?: boolean; 
		client: Client;
		threadMessages?: ThreadMessage[];
		onclose?: () => void;
		oncreated?: (caseData: any) => void;
	} = $props();

	let submitting = $state(false);
	let error = $state<string | null>(null);

	let formData = $state({
		title: '',
		description: '',
		status: 'active' as 'pending' | 'active' | 'closed',
		linkMessages: true
	});

	// Pre-populate description from thread messages
	$effect(() => {
		if (open && threadMessages.length > 0) {
			const summary = threadMessages
				.slice(0, 3)
				.map(m => m.content.substring(0, 100))
				.join('\n---\n');
			
			if (!formData.description) {
				formData.description = `Initial inquiry from client:\n\n${summary}${threadMessages.length > 3 ? '\n\n[Additional messages...]' : ''}`;
			}
		}
	});

	async function handleSubmit() {
		error = null;

		if (!formData.title.trim()) {
			error = 'Case title is required';
			return;
		}

		if (!formData.description.trim() || formData.description.length < 20) {
			error = 'Description must be at least 20 characters';
			return;
		}

		submitting = true;

		const result = await casesStore.createCase({
			clientId: client.id,
			title: formData.title,
			description: formData.description,
			status: formData.status
		});

		if (result.success && formData.linkMessages && threadMessages.length > 0) {
			// Link messages to the new case
			try {
				const messageIds = threadMessages.map(m => m.id);
				await fetch('/api/messages/link-to-case', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						caseId: result.case.id,
						messageIds
					})
				});
			} catch (err) {
				console.error('Failed to link messages to case:', err);
				// Non-critical error, case was still created
			}
		}

		submitting = false;

		if (result.success) {
			toastStore.success('Case created from thread');
			if (oncreated) oncreated(result.case);
			handleClose();
		} else {
			error = result.error || 'Failed to create case';
			toastStore.error(error as string);
		}
	}

	function handleClose() {
		formData = {
			title: '',
			description: '',
			status: 'active',
			linkMessages: true
		};
		error = null;
		if (onclose) onclose();
	}
</script>

<Modal {open} title="Create Case from Thread" size="lg" onclose={handleClose}>
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
		{#if error}
			<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
				{error}
			</div>
		{/if}

		<!-- Client Info (Read-only) -->
		<div>
			<label class="block text-sm font-medium mb-2">Client</label>
			<div class="p-3 border border-border rounded-md bg-muted">
				<div class="font-medium">
					{client.firstName} {client.lastName}
				</div>
				<div class="text-sm text-muted-foreground">{client.email}</div>
			</div>
		</div>

		<!-- Thread Preview -->
		{#if threadMessages.length > 0}
			<div>
				<label class="block text-sm font-medium mb-2">
					Thread Preview ({threadMessages.length} message{threadMessages.length !== 1 ? 's' : ''})
				</label>
				<div class="border border-border rounded-md bg-muted/50 max-h-32 overflow-y-auto p-3 space-y-2">
					{#each threadMessages.slice(0, 3) as msg}
						<div class="text-sm">
							<span class="text-muted-foreground text-xs">
								{new Date(msg.createdAt).toLocaleDateString()}
							</span>
							<p class="truncate">{msg.content}</p>
						</div>
					{/each}
					{#if threadMessages.length > 3}
						<div class="text-xs text-muted-foreground text-center">
							+{threadMessages.length - 3} more messages
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Case Title -->
		<div>
			<label for="thread-title" class="block text-sm font-medium mb-2">
				Case Title <span class="text-red-500">*</span>
			</label>
			<input
				type="text"
				id="thread-title"
				bind:value={formData.title}
				maxlength="100"
				placeholder="e.g., Personal Injury - Car Accident"
				required
				class="w-full px-3 py-2 border border-input rounded-md bg-background"
			/>
			<div class="text-xs text-muted-foreground mt-1">
				{formData.title.length}/100 characters
			</div>
		</div>

		<!-- Case Description -->
		<div>
			<label for="thread-description" class="block text-sm font-medium mb-2">
				Description <span class="text-red-500">*</span>
			</label>
			<textarea
				id="thread-description"
				bind:value={formData.description}
				rows="4"
				placeholder="Provide details about the case..."
				required
				class="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
			></textarea>
			<div class="text-xs text-muted-foreground mt-1">
				{formData.description.length} characters (minimum 20)
			</div>
		</div>

		<!-- Status -->
		<div>
			<label for="thread-status" class="block text-sm font-medium mb-2">
				Initial Status
			</label>
			<select
				id="thread-status"
				bind:value={formData.status}
				class="w-full px-3 py-2 border border-input rounded-md bg-background"
			>
				<option value="pending">Pending</option>
				<option value="active">Active</option>
			</select>
		</div>

		<!-- Link Messages Option -->
		{#if threadMessages.length > 0}
			<div class="flex items-center gap-2">
				<input
					type="checkbox"
					id="linkMessages"
					bind:checked={formData.linkMessages}
					class="rounded border-input"
				/>
				<label for="linkMessages" class="text-sm">
					Link existing thread messages to this case
				</label>
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="flex gap-3 justify-end pt-4 border-t border-border">
			<button
				type="button"
				onclick={handleClose}
				disabled={submitting}
				class="px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors disabled:opacity-50"
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={submitting || !formData.title || formData.description.length < 20}
				class="px-6 py-2 bg-gold hover:bg-gold-dark text-black font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{submitting ? 'Creating...' : 'Create Case'}
			</button>
		</div>
	</form>
</Modal>
