<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ close: void; created: any }>();

	let {
		open = false,
		caseId,
		caseName
	}: {
		open?: boolean;
		caseId: string;
		caseName?: string;
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
			dispatch('created', result.invoice);
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
		dispatch('close');
	}

	function formatCurrency(value: string): string {
		if (!value) return '';
		const num = parseFloat(value);
		if (isNaN(num)) return value;
		return num.toFixed(2);
	}
</script>

{#if open}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		onclick={handleClose}
		role="button"
		tabindex="-1"
	>
		<div
			class="bg-background border border-border rounded-lg shadow-xl max-w-lg w-full"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-border">
				<div>
					<h2 class="font-title text-2xl">Create Invoice</h2>
					{#if caseName}
						<p class="text-sm text-muted-foreground mt-1">For: {caseName}</p>
					{/if}
				</div>
				<button
					onclick={handleClose}
					class="p-2 hover:bg-muted rounded-md transition-colors"
					aria-label="Close modal"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Form -->
			<form onsubmit={handleSubmit} class="p-6 space-y-6">
				{#if error}
					<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
						{error}
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
		</div>
	</div>
{/if}
