<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import { invoicesStore } from '$lib/stores/invoices.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

	type Invoice = {
		id: string;
		description: string;
		amount: number;
		dueDate: Date | string;
		status: 'unpaid' | 'partial' | 'paid';
		paidAmount: number;
	};

	let { 
		open = false, 
		mode = 'create',
		caseId,
		caseName,
		invoice,
		onclose,
		onsaved
	}: { 
		open?: boolean; 
		mode?: 'create' | 'edit';
		caseId?: string;
		caseName?: string;
		invoice?: Invoice | null;
		onclose?: () => void;
		onsaved?: (invoice: any) => void;
	} = $props();

	let submitting = $state(false);
	let error = $state<string | null>(null);

	let formData = $state({
		description: '',
		amount: '',
		dueDate: '',
		status: 'unpaid' as 'unpaid' | 'partial' | 'paid',
		paidAmount: ''
	});

	// Populate form when editing
	$effect(() => {
		if (open && mode === 'edit' && invoice) {
			formData = {
				description: invoice.description,
				amount: (invoice.amount / 100).toFixed(2),
				dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
				status: invoice.status,
				paidAmount: (invoice.paidAmount / 100).toFixed(2)
			};
		} else if (open && mode === 'create') {
			formData = {
				description: '',
				amount: '',
				dueDate: '',
				status: 'unpaid',
				paidAmount: ''
			};
		}
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
			let result;
			
			if (mode === 'create') {
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

				result = await response.json();
				toastStore.success('Invoice created successfully');
			} else if (invoice) {
				const paidAmountCents = Math.round(parseFloat(formData.paidAmount || '0') * 100);
				
				const response = await fetch(`/api/invoices/${invoice.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						description: formData.description.trim(),
						amount: amountCents,
						dueDate: new Date(formData.dueDate).toISOString(),
						status: formData.status,
						paidAmount: paidAmountCents
					})
				});

				if (!response.ok) {
					const data = await response.json();
					throw new Error(data.message || 'Failed to update invoice');
				}

				result = await response.json();
				toastStore.success('Invoice updated successfully');
			}

			if (onsaved) onsaved(result?.invoice);
			handleClose();
		} catch (err: any) {
			error = err.message;
			toastStore.error(error as string);
		} finally {
			submitting = false;
		}
	}

	function handleClose() {
		formData = {
			description: '',
			amount: '',
			dueDate: '',
			status: 'unpaid',
			paidAmount: ''
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

	let title = $derived(mode === 'create' ? 'Create Invoice' : 'Edit Invoice');
</script>

<Modal {open} {title} size="md" onclose={handleClose}>
	<form onsubmit={handleSubmit} class="space-y-6">
		{#if error}
			<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
				{error}
			</div>
		{/if}

		{#if caseName}
			<div class="text-sm text-muted-foreground">
				{mode === 'create' ? 'Creating invoice for case:' : 'Editing invoice for case:'} 
				<span class="font-medium text-foreground">{caseName}</span>
			</div>
		{/if}

		<!-- Description -->
		<div>
			<label for="invoice-description" class="block text-sm font-medium mb-2">
				Description <span class="text-red-500">*</span>
			</label>
			<textarea
				id="invoice-description"
				bind:value={formData.description}
				rows="3"
				placeholder="e.g., Legal consultation services for January 2026"
				required
				class="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
			></textarea>
		</div>

		<!-- Amount -->
		<div>
			<label for="invoice-amount" class="block text-sm font-medium mb-2">
				Amount (USD) <span class="text-red-500">*</span>
			</label>
			<div class="relative">
				<span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
				<input
					type="number"
					id="invoice-amount"
					bind:value={formData.amount}
					step="0.01"
					min="0.01"
					placeholder="0.00"
					required
					onblur={() => (formData.amount = formatCurrency(formData.amount))}
					class="w-full pl-8 pr-3 py-2 border border-input rounded-md bg-background"
				/>
			</div>
		</div>

		<!-- Due Date -->
		<div>
			<label for="invoice-dueDate" class="block text-sm font-medium mb-2">
				Due Date <span class="text-red-500">*</span>
			</label>
			<input
				type="date"
				id="invoice-dueDate"
				bind:value={formData.dueDate}
				min={mode === 'create' ? getMinDate() : undefined}
				required
				class="w-full px-3 py-2 border border-input rounded-md bg-background"
			/>
		</div>

		<!-- Status & Paid Amount (Edit mode only) -->
		{#if mode === 'edit'}
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="invoice-status" class="block text-sm font-medium mb-2">
						Status
					</label>
					<select
						id="invoice-status"
						bind:value={formData.status}
						class="w-full px-3 py-2 border border-input rounded-md bg-background"
					>
						<option value="unpaid">Unpaid</option>
						<option value="partial">Partial</option>
						<option value="paid">Paid</option>
					</select>
				</div>
				<div>
					<label for="invoice-paidAmount" class="block text-sm font-medium mb-2">
						Paid Amount
					</label>
					<div class="relative">
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
						<input
							type="number"
							id="invoice-paidAmount"
							bind:value={formData.paidAmount}
							step="0.01"
							min="0"
							placeholder="0.00"
							onblur={() => (formData.paidAmount = formatCurrency(formData.paidAmount))}
							class="w-full pl-8 pr-3 py-2 border border-input rounded-md bg-background"
						/>
					</div>
				</div>
			</div>
		{/if}

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
						<span class="{formData.status === 'paid' 
							? 'text-green-600 dark:text-green-400' 
							: formData.status === 'partial' 
								? 'text-yellow-600 dark:text-yellow-400' 
								: 'text-red-600 dark:text-red-400'}">
							{formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
						</span>
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
				{submitting ? 'Saving...' : mode === 'create' ? 'Create Invoice' : 'Save Changes'}
			</button>
		</div>
	</form>
</Modal>
