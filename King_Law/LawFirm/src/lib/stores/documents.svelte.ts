type Document = {
	id: string;
	caseId: string | null;
	uploadedById: string;
	fileName: string;
	filePath: string;
	fileSize: number;
	mimeType: string;
	uploadedAt: Date;
};

type DocumentWithUploader = {
	document: Document;
	uploader: any;
};

class DocumentsStore {
	documents = $state<DocumentWithUploader[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);

	async fetchDocuments(caseId?: string) {
		this.loading = true;
		this.error = null;
		try {
			let url = '/api/documents';
			if (caseId) {
				url += `?caseId=${caseId}`;
			}

			const response = await fetch(url);
			if (!response.ok) throw new Error('Failed to fetch documents');
			
			const data = await response.json();
			this.documents = data.documents || [];
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			this.loading = false;
		}
	}

	async uploadDocument(file: File, caseId?: string) {
		this.loading = true;
		this.error = null;
		try {
			const formData = new FormData();
			formData.append('file', file);
			if (caseId) {
				formData.append('caseId', caseId);
			}

			const response = await fetch('/api/documents/upload', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) throw new Error('Failed to upload document');
			
			const data = await response.json();
			await this.fetchDocuments(caseId);
			return { success: true, document: data.document };
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to upload document';
			return { success: false, error: this.error };
		} finally {
			this.loading = false;
		}
	}

	getDownloadUrl(documentId: string) {
		return `/api/documents/${documentId}`;
	}
}

export const documentsStore = new DocumentsStore();
