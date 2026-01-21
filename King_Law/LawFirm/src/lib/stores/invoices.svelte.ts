type Invoice = {
	id: string;
	caseId: string;
	description: string;
	amount: number;
	paidAmount: number;
	dueDate: Date;
	status: 'paid' | 'unpaid' | 'partial' | 'overdue';
	createdAt: Date;
	updatedAt: Date;
};

type InvoiceWithDetails = {
	invoice: Invoice;
	case?: {
		id: string;
		title: string;
	};
	client?: {
		firstName: string;
		lastName: string;
	};
};

class InvoicesStore {
	invoices = $state<InvoiceWithDetails[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);

	async fetchInvoices(caseId?: string) {
		this.loading = true;
		this.error = null;
		try {
			let url = '/api/invoices';
			if (caseId) {
				url += `?caseId=${caseId}`;
			}

			const response = await fetch(url);
			if (!response.ok) throw new Error('Failed to fetch invoices');
			
			const data = await response.json();
			this.invoices = data.invoices || [];
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			this.loading = false;
		}
	}

	async createInvoice(data: {
		caseId: string;
		description: string;
		amount: number;
		dueDate: string;
	}) {
		this.loading = true;
		this.error = null;
		try {
			const response = await fetch('/api/invoices', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to create invoice');
			}
			
			const result = await response.json();
			// Refresh invoices if we're viewing the list
			await this.fetchInvoices(data.caseId);
			return { success: true, invoice: result.invoice };
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to create invoice';
			return { success: false, error: this.error };
		} finally {
			this.loading = false;
		}
	}

	async updateInvoice(id: string, updates: Partial<Invoice>) {
		this.loading = true;
		this.error = null;
		try {
			const response = await fetch(`/api/invoices/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates)
			});

			if (!response.ok) throw new Error('Failed to update invoice');
			
			await this.fetchInvoices(); // Ideally we'd know which caseId to refresh or just update local state
			return { success: true };
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to update invoice';
			return { success: false, error: this.error };
		} finally {
			this.loading = false;
		}
	}

	async markAsPaid(id: string, caseId?: string): Promise<{ success: boolean; error?: string }> {
		try {
			// Find the invoice to get the full amount
			const invoiceItem = this.invoices.find(i => i.invoice.id === id);
			if (!invoiceItem) {
				return { success: false, error: 'Invoice not found' };
			}

			const response = await fetch(`/api/invoices/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status: 'paid',
					paidAmount: invoiceItem.invoice.amount,
					paidAt: new Date().toISOString()
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to mark invoice as paid');
			}

			// Update local state optimistically
			this.invoices = this.invoices.map(i => {
				if (i.invoice.id === id) {
					return {
						...i,
						invoice: {
							...i.invoice,
							status: 'paid' as const,
							paidAmount: i.invoice.amount
						}
					};
				}
				return i;
			});

			return { success: true };
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Failed to mark as paid';
			return { success: false, error: errorMsg };
		}
	}

	async deleteInvoice(id: string) {
		this.loading = true;
		this.error = null;
		try {
			const response = await fetch(`/api/invoices/${id}`, {
				method: 'DELETE'
			});

			if (!response.ok) throw new Error('Failed to delete invoice');
			
			this.invoices = this.invoices.filter(i => i.invoice.id !== id);
			return { success: true };
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to delete invoice';
			return { success: false, error: this.error };
		} finally {
			this.loading = false;
		}
	}
}

export const invoicesStore = new InvoicesStore();
