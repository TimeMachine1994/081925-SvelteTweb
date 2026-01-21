import { fetchWithRetry, getErrorMessage } from '$lib/utils/fetchWithRetry';

type Case = {
	id: string;
	clientId: string;
	lawyerId: string;
	title: string;
	description: string | null;
	status: 'active' | 'pending' | 'closed';
	createdAt: Date;
	updatedAt: Date;
};

type CaseWithDetails = {
	case: Case;
	client?: any;
	lawyer?: any;
};

class CasesStore {
	cases = $state<CaseWithDetails[]>([]);
	currentCase = $state<CaseWithDetails | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);

	async fetchCases() {
		this.loading = true;
		this.error = null;
		try {
			const response = await fetchWithRetry('/api/cases', {}, {
				maxRetries: 2,
				onRetry: (attempt) => console.log(`Retrying fetchCases (attempt ${attempt})...`)
			});
			if (!response.ok) throw new Error('Failed to fetch cases');
			
			const data = await response.json();
			this.cases = data.cases || [];
		} catch (err) {
			this.error = getErrorMessage(err);
		} finally {
			this.loading = false;
		}
	}

	async fetchCase(id: string) {
		this.loading = true;
		this.error = null;
		try {
			const response = await fetchWithRetry(`/api/cases?id=${id}`, {}, {
				maxRetries: 2,
				onRetry: (attempt) => console.log(`Retrying fetchCase (attempt ${attempt})...`)
			});
			if (!response.ok) throw new Error('Failed to fetch case');
			
			const data = await response.json();
			this.currentCase = data.case;
			return data.case;
		} catch (err) {
			this.error = getErrorMessage(err);
			return null;
		} finally {
			this.loading = false;
		}
	}

	async createCase(caseData: {
		clientId: string;
		title: string;
		description?: string;
		status?: string;
	}) {
		this.loading = true;
		this.error = null;
		try {
			const response = await fetch('/api/cases', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(caseData)
			});

			if (!response.ok) throw new Error('Failed to create case');
			
			const data = await response.json();
			await this.fetchCases();
			return { success: true, case: data.case };
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to create case';
			return { success: false, error: this.error };
		} finally {
			this.loading = false;
		}
	}

	async updateCase(id: string, updates: Partial<Case>) {
		this.loading = true;
		this.error = null;
		try {
			const response = await fetch(`/api/cases/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates)
			});

			if (!response.ok) throw new Error('Failed to update case');
			
			await this.fetchCases();
			if (this.currentCase?.case.id === id) {
				await this.fetchCase(id);
			}
			return { success: true };
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to update case';
			return { success: false, error: this.error };
		} finally {
			this.loading = false;
		}
	}

	async deleteCase(id: string) {
		this.loading = true;
		this.error = null;
		try {
			const response = await fetch(`/api/cases/${id}`, {
				method: 'DELETE'
			});

			if (!response.ok) throw new Error('Failed to delete case');
			
			await this.fetchCases();
			if (this.currentCase?.case.id === id) {
				this.currentCase = null;
			}
			return { success: true };
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to delete case';
			return { success: false, error: this.error };
		} finally {
			this.loading = false;
		}
	}

	async archiveCase(id: string) {
		return this.updateCase(id, { status: 'closed' as const });
	}

	async reopenCase(id: string) {
		return this.updateCase(id, { status: 'active' as const });
	}
}

export const casesStore = new CasesStore();
