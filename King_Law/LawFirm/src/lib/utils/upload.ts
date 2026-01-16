interface UploadProgressCallback {
	onProgress: (progress: number, speed: number, timeRemaining: number) => void;
	onComplete: (response: any) => void;
	onError: (error: Error) => void;
}

export async function uploadFileWithProgress(
	file: File,
	caseId: string,
	messageId: string | null,
	callbacks: UploadProgressCallback
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		const formData = new FormData();
		
		formData.append('file', file);
		formData.append('caseId', caseId);
		if (messageId) {
			formData.append('messageId', messageId);
		}
		
		let startTime = Date.now();
		let lastLoaded = 0;
		let lastTime = Date.now();
		
		xhr.upload.addEventListener('progress', (e) => {
			if (e.lengthComputable) {
				const progress = Math.round((e.loaded / e.total) * 100);
				
				// Calculate upload speed
				const currentTime = Date.now();
				const timeDiff = (currentTime - lastTime) / 1000; // seconds
				const bytesDiff = e.loaded - lastLoaded;
				const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
				
				// Calculate time remaining
				const bytesRemaining = e.total - e.loaded;
				const timeRemaining = speed > 0 ? bytesRemaining / speed : 0;
				
				lastLoaded = e.loaded;
				lastTime = currentTime;
				
				callbacks.onProgress(progress, speed, timeRemaining);
			}
		});
		
		xhr.addEventListener('load', () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				try {
					const response = JSON.parse(xhr.responseText);
					callbacks.onComplete(response);
					resolve();
				} catch (error) {
					const err = new Error('Invalid server response');
					callbacks.onError(err);
					reject(err);
				}
			} else {
				const error = new Error(`Upload failed with status ${xhr.status}`);
				callbacks.onError(error);
				reject(error);
			}
		});
		
		xhr.addEventListener('error', () => {
			const error = new Error('Network error during upload');
			callbacks.onError(error);
			reject(error);
		});
		
		xhr.addEventListener('abort', () => {
			const error = new Error('Upload cancelled');
			callbacks.onError(error);
			reject(error);
		});
		
		xhr.open('POST', '/api/documents/upload');
		xhr.send(formData);
	});
}

export async function uploadMultipleFiles(
	files: File[],
	caseId: string,
	onFileProgress: (fileId: string, progress: number, speed: number, timeRemaining: number) => void,
	onFileComplete: (fileId: string, response: any) => void,
	onFileError: (fileId: string, error: Error) => void
): Promise<void> {
	const uploads = files.map((file, index) => {
		const fileId = `file-${index}-${Date.now()}`;
		
		return uploadFileWithProgress(file, caseId, null, {
			onProgress: (progress, speed, timeRemaining) => {
				onFileProgress(fileId, progress, speed, timeRemaining);
			},
			onComplete: (response) => {
				onFileComplete(fileId, response);
			},
			onError: (error) => {
				onFileError(fileId, error);
			}
		});
	});
	
	await Promise.all(uploads);
}

// Chunked upload for large files (>10MB)
export async function uploadLargeFile(
	file: File,
	caseId: string,
	chunkSize: number = 1024 * 1024 * 2, // 2MB chunks
	callbacks: UploadProgressCallback
): Promise<void> {
	const totalChunks = Math.ceil(file.size / chunkSize);
	let uploadedBytes = 0;
	const startTime = Date.now();
	
	for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
		const start = chunkIndex * chunkSize;
		const end = Math.min(start + chunkSize, file.size);
		const chunk = file.slice(start, end);
		
		const formData = new FormData();
		formData.append('chunk', chunk);
		formData.append('fileName', file.name);
		formData.append('caseId', caseId);
		formData.append('chunkIndex', chunkIndex.toString());
		formData.append('totalChunks', totalChunks.toString());
		
		try {
			const response = await fetch('/api/documents/chunk', {
				method: 'POST',
				body: formData
			});
			
			if (!response.ok) {
				throw new Error(`Chunk upload failed: ${response.statusText}`);
			}
			
			uploadedBytes += chunk.size;
			const progress = Math.round((uploadedBytes / file.size) * 100);
			
			// Calculate speed and time remaining
			const elapsedTime = (Date.now() - startTime) / 1000;
			const speed = uploadedBytes / elapsedTime;
			const bytesRemaining = file.size - uploadedBytes;
			const timeRemaining = speed > 0 ? bytesRemaining / speed : 0;
			
			callbacks.onProgress(progress, speed, timeRemaining);
			
			// If this was the last chunk, we're done
			if (chunkIndex === totalChunks - 1) {
				const finalResponse = await response.json();
				callbacks.onComplete(finalResponse);
			}
		} catch (error) {
			callbacks.onError(error as Error);
			throw error;
		}
	}
}
