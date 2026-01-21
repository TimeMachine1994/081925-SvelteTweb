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
	uploadProgress = $state(0);

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

	async uploadDocument(file: File, caseId?: string): Promise<{ success: boolean; document?: any; error?: string }> {
		this.loading = true;
		this.error = null;
		this.uploadProgress = 0;

		return new Promise((resolve) => {
			const formData = new FormData();
			formData.append('file', file);
			if (caseId) {
				formData.append('caseId', caseId);
			}

			const xhr = new XMLHttpRequest();

			xhr.upload.addEventListener('progress', (e) => {
				if (e.lengthComputable) {
					this.uploadProgress = Math.round((e.loaded / e.total) * 100);
				}
			});

			xhr.addEventListener('load', async () => {
				this.loading = false;
				if (xhr.status >= 200 && xhr.status < 300) {
					try {
						const data = JSON.parse(xhr.responseText);
						await this.fetchDocuments(caseId);
						this.uploadProgress = 100;
						resolve({ success: true, document: data.document });
					} catch {
						resolve({ success: false, error: 'Invalid response from server' });
					}
				} else {
					this.error = 'Failed to upload document';
					resolve({ success: false, error: this.error });
				}
			});

			xhr.addEventListener('error', () => {
				this.loading = false;
				this.error = 'Network error during upload';
				resolve({ success: false, error: this.error });
			});

			xhr.open('POST', '/api/documents/upload');
			xhr.send(formData);
		});
	}

	getDownloadUrl(documentId: string) {
		return `/api/documents/${documentId}`;
	}
}

export const documentsStore = new DocumentsStore();
