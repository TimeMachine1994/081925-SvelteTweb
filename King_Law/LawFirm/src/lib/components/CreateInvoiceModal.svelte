<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';

	let {
		open = false,
		caseId,
		caseName,
		onclose,
		oncreated
	}: {
		open?: boolean;
		caseId: string;
		caseName?: string;
		onclose?: () => void;
		oncreated?: (invoice: any) => void;
	} = $props();

	let submitting = $state(false);
	let error = $state<string | null>(null);

	let formData = $state({
		description: '',
		amount: '',
		dueDate: ''
	});

	function getMinDate() {
		const today = new Date();
		return today.toISOString().split('T')[0];
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;

		if (!formData.description.trim()) {
			error = 'Description is required';
			return;
		}

		const amountCents = Math.round(parseFloat(formData.amount) * 100);
		if (isNaN(amountCents) || amountCents <= 0) {
			error = 'Please enter a valid amount';
			return;
		}

		if (!formData.dueDate) {
			error = 'Due date is required';
			return;
		}

		submitting = true;

		try {
			const response = await fetch('/api/invoices', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					caseId,
					description: formData.description.trim(),
					amount: amountCents,
					dueDate: new Date(formData.dueDate).toISOString()
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to create invoice');
			}

			const result = await response.json();
			if (oncreated) oncreated(result.invoice);
			handleClose();
		} catch (err: any) {
			error = err.message;
		} finally {
			submitting = false;
		}
	}

	function handleClose() {
		formData = {
			description: '',
			amount: '',
			dueDate: ''
		};
		error = null;
		if (onclose) onclose();
	}

	function formatCurrency(value: string): string {
		if (!value) return '';
		const num = parseFloat(value);
		if (isNaN(num)) return value;
		return num.toFixed(2);
	}
</script>

<Modal {open} title="Create Invoice" size="md" onclose={handleClose}>
	<form onsubmit={handleSubmit} class="space-y-6">
		{#if error}
			<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
				{error}
			</div>
		{/if}

		{#if caseName}
			<div class="text-sm text-muted-foreground">
				Creating invoice for case: <span class="font-medium text-foreground">{caseName}</span>
			</div>
		{/if}

		<!-- Description -->
		<div>
			<label for="description" class="block text-sm font-medium mb-2">
				Description <span class="text-red-500">*</span>
			</label>
			<textarea
				id="description"
				bind:value={formData.description}
				rows="3"
				placeholder="e.g., Legal consultation services for January 2026"
				required
				class="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
			></textarea>
		</div>

		<!-- Amount -->
		<div>
			<label for="amount" class="block text-sm font-medium mb-2">
				Amount (USD) <span class="text-red-500">*</span>
			</label>
			<div class="relative">
				<span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
				<input
					type="number"
					id="amount"
					bind:value={formData.amount}
					step="0.01"
					min="0.01"
					placeholder="0.00"
					required
					onblur={() => (formData.amount = formatCurrency(formData.amount))}
					class="w-full pl-8 pr-3 py-2 border border-input rounded-md bg-background"
				/>
			</div>
			{#if formData.amount}
				<div class="text-sm text-muted-foreground mt-1">
					Amount in cents: {Math.round(parseFloat(formData.amount) * 100)}
				</div>
			{/if}
		</div>

		<!-- Due Date -->
		<div>
			<label for="dueDate" class="block text-sm font-medium mb-2">
				Due Date <span class="text-red-500">*</span>
			</label>
			<input
				type="date"
				id="dueDate"
				bind:value={formData.dueDate}
				min={getMinDate()}
				required
				class="w-full px-3 py-2 border border-input rounded-md bg-background"
			/>
		</div>

		<!-- Summary -->
		{#if formData.amount && formData.dueDate}
			<div class="bg-muted border border-border rounded-lg p-4">
				<div class="text-sm font-medium mb-2">Invoice Summary</div>
				<div class="space-y-1 text-sm">
					<div class="flex justify-between">
						<span class="text-muted-foreground">Amount:</span>
						<span class="font-semibold">${formatCurrency(formData.amount)}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-muted-foreground">Due:</span>
						<span>{new Date(formData.dueDate).toLocaleDateString()}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-muted-foreground">Status:</span>
						<span class="text-yellow-600 dark:text-yellow-400">Unpaid</span>
					</div>
				</div>
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
				disabled={submitting || !formData.description || !formData.amount || !formData.dueDate}
				class="px-6 py-2 bg-gold hover:bg-gold-dark text-black font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{submitting ? 'Creating...' : 'Create Invoice'}
			</button>
		</div>
	</form>
</Modal>
