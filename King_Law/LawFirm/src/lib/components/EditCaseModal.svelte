<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import { casesStore } from '$lib/stores/cases.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

	type Case = {
		id: string;
		title: string;
		description: string | null;
		status: 'pending' | 'active' | 'closed';
	};

	let { 
		open = false, 
		caseData,
		onclose,
		onupdated
	}: { 
		open?: boolean; 
		caseData: Case;
		onclose?: () => void;
		onupdated?: (result: any) => void;
	} = $props();

	let submitting = $state(false);
	let error = $state<string | null>(null);

	let formData = $state({
		title: '',
		description: '',
		status: 'pending' as 'pending' | 'active' | 'closed'
	});

	$effect(() => {
		if (open && caseData) {
			formData = {
				title: caseData.title,
				description: caseData.description || '',
				status: caseData.status
			};
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

		const result = await casesStore.updateCase(caseData.id, {
			title: formData.title,
			description: formData.description,
			status: formData.status
		});

		submitting = false;

		if (result.success) {
			toastStore.success('Case updated successfully');
			if (onupdated) onupdated(result);
			handleClose();
		} else {
			error = result.error || 'Failed to update case';
			toastStore.error(error as string);
		}
	}

	function handleClose() {
		error = null;
		if (onclose) onclose();
	}
</script>

<Modal {open} title="Edit Case" size="lg" onclose={handleClose}>
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
		{#if error}
			<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
				{error}
			</div>
		{/if}

		<!-- Case Title -->
		<div>
			<label for="edit-title" class="block text-sm font-medium mb-2">
				Case Title <span class="text-red-500">*</span>
			</label>
			<input
				type="text"
				id="edit-title"
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
			<label for="edit-description" class="block text-sm font-medium mb-2">
				Description <span class="text-red-500">*</span>
			</label>
			<textarea
				id="edit-description"
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
			<label for="edit-status" class="block text-sm font-medium mb-2">
				Status
			</label>
			<select
				id="edit-status"
				bind:value={formData.status}
				class="w-full px-3 py-2 border border-input rounded-md bg-background"
			>
				<option value="pending">Pending</option>
				<option value="active">Active</option>
				<option value="closed">Closed</option>
			</select>
		</div>

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
				{submitting ? 'Updating...' : 'Save Changes'}
			</button>
		</div>
	</form>
</Modal>
