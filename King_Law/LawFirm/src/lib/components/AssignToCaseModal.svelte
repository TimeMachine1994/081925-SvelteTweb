<script lang="ts">
	import { onMount } from 'svelte';
	import { casesStore } from '$lib/stores/cases.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

	type MessageData = {
		message: {
			id: string;
			content: string;
			createdAt: number;
			attachmentDocumentId: string | null;
		};
		sender: {
			id: string;
			firstName: string;
			lastName: string;
			email: string;
		};
		attachment: {
			id: string;
			fileName: string;
			fileSize: number;
		} | null;
	};

	interface Props {
		open: boolean;
		message: MessageData | null;
		onclose: () => void;
		onassigned: () => void;
	}

	let { open, message, onclose, onassigned }: Props = $props();

	let assignMode = $state<'existing' | 'new'>('new');
	let selectedCaseId = $state('');
	let newCaseTitle = $state('');
	let newCaseDescription = $state('');
	let submitting = $state(false);

	// Reset form when modal opens
	$effect(() => {
		if (open) {
			assignMode = 'new';
			selectedCaseId = '';
			newCaseTitle = '';
			newCaseDescription = '';
			// Pre-fill case title with sender name
			if (message) {
				newCaseTitle = `${message.sender.firstName} ${message.sender.lastName} - New Matter`;
			}
		}
	});

	onMount(() => {
		casesStore.fetchCases();
	});

	async function handleSubmit() {
		if (assignMode === 'existing' && !selectedCaseId) {
			toastStore.error('Please select a case');
			return;
		}

		if (assignMode === 'new' && !newCaseTitle.trim()) {
			toastStore.error('Please enter a case title');
			return;
		}

		if (!message) return;

		submitting = true;
		try {
			const response = await fetch('/api/messages/assign', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messageId: message.message.id,
					caseId: assignMode === 'existing' ? selectedCaseId : undefined,
					createNewCase: assignMode === 'new',
					caseTitle: assignMode === 'new' ? newCaseTitle.trim() : undefined,
					caseDescription: assignMode === 'new' ? newCaseDescription.trim() || undefined : undefined
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to assign message');
			}

			onassigned();
		} catch (error) {
			console.error('Assignment error:', error);
			toastStore.error(error instanceof Error ? error.message : 'Failed to assign message');
		} finally {
			submitting = false;
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onclose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open && message}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<div class="bg-background border border-border rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-border">
				<h2 id="modal-title" class="font-title text-xl">Assign to Case</h2>
				<button
					type="button"
					onclick={onclose}
					class="text-muted-foreground hover:text-foreground transition-colors"
					aria-label="Close"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="p-4 space-y-4">
				<!-- Message Preview -->
				<div class="bg-muted/50 rounded-lg p-4">
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
					<p class="text-sm text-foreground line-clamp-3">{message.message.content}</p>
					{#if message.attachment}
						<div class="mt-2 inline-flex items-center gap-1 text-xs text-gold">
							📎 {message.attachment.fileName} ({formatFileSize(message.attachment.fileSize)})
						</div>
					{/if}
				</div>

				<!-- Assignment Options -->
				<div class="space-y-4">
					<!-- Radio buttons for mode selection -->
					<div class="space-y-2">
						<label class="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
							<input
								type="radio"
								name="assignMode"
								value="new"
								bind:group={assignMode}
								class="text-gold focus:ring-gold"
							/>
							<div>
								<div class="font-medium text-sm">Create new case</div>
								<div class="text-xs text-muted-foreground">Start a new case for this client</div>
							</div>
						</label>

						<label class="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
							<input
								type="radio"
								name="assignMode"
								value="existing"
								bind:group={assignMode}
								class="text-gold focus:ring-gold"
							/>
							<div>
								<div class="font-medium text-sm">Assign to existing case</div>
								<div class="text-xs text-muted-foreground">Link to a case you already have</div>
							</div>
						</label>
					</div>

					<!-- New Case Form -->
					{#if assignMode === 'new'}
						<div class="space-y-3 pl-6 border-l-2 border-gold/30">
							<div>
								<label for="caseTitle" class="block text-sm font-medium mb-1">Case Title *</label>
								<input
									id="caseTitle"
									type="text"
									bind:value={newCaseTitle}
									placeholder="e.g., Johnson Estate Planning"
									class="w-full px-3 py-2 border border-input rounded-md bg-background"
								/>
							</div>
							<div>
								<label for="caseDescription" class="block text-sm font-medium mb-1">Description (optional)</label>
								<textarea
									id="caseDescription"
									bind:value={newCaseDescription}
									placeholder="Brief description of the matter..."
									rows="2"
									class="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
								></textarea>
							</div>
						</div>
					{/if}

					<!-- Existing Case Selector -->
					{#if assignMode === 'existing'}
						<div class="pl-6 border-l-2 border-gold/30">
							<label for="caseSelect" class="block text-sm font-medium mb-1">Select Case *</label>
							{#if casesStore.cases.length > 0}
								<select
									id="caseSelect"
									bind:value={selectedCaseId}
									class="w-full px-3 py-2 border border-input rounded-md bg-background"
								>
									<option value="">-- Select a case --</option>
									{#each casesStore.cases as caseItem}
										<option value={caseItem.case.id}>
											{caseItem.case.title}
											{#if caseItem.client}
												({caseItem.client.firstName} {caseItem.client.lastName})
											{/if}
										</option>
									{/each}
								</select>
							{:else}
								<p class="text-sm text-muted-foreground">No existing cases. Create a new case instead.</p>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Info note -->
				<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
					<p class="text-xs text-blue-800 dark:text-blue-300">
						<strong>Note:</strong> Assigning this message will link the client ({message.sender.firstName} {message.sender.lastName}) to the case. 
						{#if message.attachment}
							The attached document will also be added to the case.
						{/if}
					</p>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex justify-end gap-3 p-4 border-t border-border">
				<button
					type="button"
					onclick={onclose}
					disabled={submitting}
					class="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleSubmit}
					disabled={submitting}
					class="px-4 py-2 text-sm bg-gold hover:bg-gold-dark text-black font-semibold rounded-md transition-colors disabled:opacity-50"
				>
					{#if submitting}
						Assigning...
					{:else}
						Assign to Case
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
