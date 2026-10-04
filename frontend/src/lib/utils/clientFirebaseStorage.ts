import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { clientAuth } from '$lib/firebase';

/**
 * Upload video file directly to Firebase Storage from client
 * This bypasses Vercel's 4.5MB serverless function limit
 */
export async function uploadVideoToFirebaseStorage(
	videoBlob: Blob,
	memorialId: string,
	title: string,
	onProgress?: (progress: number) => void
): Promise<{ downloadURL: string; storagePath: string }> {
	try {
		// Get client-side Firebase Storage instance
		const storage = getStorage(clientAuth.app);

		// Create unique filename
		const timestamp = Date.now();
		const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '-');
		const storagePath = `slideshows/${memorialId}/${timestamp}-${sanitizedTitle}.webm`;

		// Create storage reference
		const storageRef = ref(storage, storagePath);

		console.log('📤 [CLIENT UPLOAD] Uploading video to:', storagePath);
		console.log('📤 [CLIENT UPLOAD] Video size:', videoBlob.size, 'bytes');

		// Upload file (with optional progress tracking)
		if (onProgress) {
			onProgress(0);
		}

		const metadata = {
			contentType: 'video/webm',
			customMetadata: {
				memorialId,
				title,
				uploadedAt: new Date().toISOString(),
				type: 'memorial-slideshow'
			}
		};

		const uploadResult = await uploadBytes(storageRef, videoBlob, metadata);

		if (onProgress) {
			onProgress(100);
		}

		// Get download URL
		const downloadURL = await getDownloadURL(uploadResult.ref);

		console.log('✅ [CLIENT UPLOAD] Upload successful:', downloadURL);

		return {
			downloadURL,
			storagePath
		};
	} catch (error) {
		console.error('❌ [CLIENT UPLOAD] Upload failed:', error);
		throw new Error(`Firebase Storage upload failed: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Upload individual photos directly to Firebase Storage from client
 */
export async function uploadPhotosToFirebaseStorage(
	photos: Array<{ id: string; file: File; caption?: string; duration?: number }>,
	memorialId: string,
	onProgress?: (current: number, total: number) => void
): Promise<Array<{ id: string; downloadURL: string; storagePath: string; caption?: string; duration?: number }>> {
	try {
		const storage = getStorage(clientAuth.app);
		const timestamp = Date.now();
		const uploadedPhotos = [];

		for (let i = 0; i < photos.length; i++) {
			const photo = photos[i];
			const storagePath = `slideshows/${memorialId}/photos/${timestamp}-${photo.id}.jpg`;
			const storageRef = ref(storage, storagePath);

			if (onProgress) {
				onProgress(i + 1, photos.length);
			}

			console.log(`📤 [CLIENT UPLOAD] Uploading photo ${i + 1}/${photos.length} to:`, storagePath);

			const metadata = {
				contentType: photo.file.type || 'image/jpeg',
				customMetadata: {
					memorialId,
					photoId: photo.id,
					caption: photo.caption || '',
					uploadedAt: new Date().toISOString(),
					type: 'slideshow-photo'
				}
			};

			const uploadResult = await uploadBytes(storageRef, photo.file, metadata);
			const downloadURL = await getDownloadURL(uploadResult.ref);

			uploadedPhotos.push({
				id: photo.id,
				downloadURL,
				storagePath,
				caption: photo.caption,
				duration: photo.duration
			});

			console.log(`✅ [CLIENT UPLOAD] Photo ${i + 1}/${photos.length} uploaded successfully`);
		}

		return uploadedPhotos;
	} catch (error) {
		console.error('❌ [CLIENT UPLOAD] Photo upload failed:', error);
		throw new Error(`Firebase Storage photo upload failed: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Upload a single image directly to Firebase Storage from client, for use in
 * memorial content blocks (e.g. the Image Gallery block). Bypasses Vercel's
 * serverless function upload limit the same way the slideshow uploads do.
 */
export async function uploadGalleryImageToFirebaseStorage(
	file: File,
	memorialId: string,
	onProgress?: (progress: number) => void
): Promise<{ downloadURL: string; storagePath: string }> {
	if (!file.type.startsWith('image/')) {
		throw new Error('Only image files can be added to an image gallery');
	}

	try {
		const storage = getStorage(clientAuth.app);

		const timestamp = Date.now();
		const randomId = Math.random().toString(36).slice(2, 8);
		const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '-');
		const storagePath = `memorial-blocks/${memorialId}/image-gallery/${timestamp}-${randomId}-${sanitizedName}`;

		const storageRef = ref(storage, storagePath);

		if (onProgress) {
			onProgress(0);
		}

		const metadata = {
			contentType: file.type || 'image/jpeg',
			customMetadata: {
				memorialId,
				uploadedAt: new Date().toISOString(),
				type: 'memorial-image-gallery'
			}
		};

		const uploadResult = await uploadBytes(storageRef, file, metadata);

		if (onProgress) {
			onProgress(100);
		}

		const downloadURL = await getDownloadURL(uploadResult.ref);

		return { downloadURL, storagePath };
	} catch (error) {
		console.error('❌ [CLIENT UPLOAD] Gallery image upload failed:', error);
		throw new Error(`Firebase Storage upload failed: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Upload audio file directly to Firebase Storage from client
 */
export async function uploadAudioToFirebaseStorage(
	audioFile: File,
	memorialId: string,
	onProgress?: (progress: number) => void
): Promise<{ downloadURL: string; storagePath: string }> {
	try {
		const storage = getStorage(clientAuth.app);
		
		// Create unique filename
		const timestamp = Date.now();
		const fileExtension = audioFile.name.split('.').pop() || 'mp3';
		const storagePath = `slideshows/${memorialId}/audio/${timestamp}-${audioFile.name}`;
		
		// Create storage reference
		const storageRef = ref(storage, storagePath);
		
		console.log('🎵 [CLIENT UPLOAD] Uploading audio to:', storagePath);
		console.log('🎵 [CLIENT UPLOAD] Audio size:', audioFile.size, 'bytes');
		
		if (onProgress) {
			onProgress(0);
		}
		
		const metadata = {
			contentType: audioFile.type || 'audio/mpeg',
			customMetadata: {
				memorialId,
				fileName: audioFile.name,
				uploadedAt: new Date().toISOString(),
				type: 'slideshow-audio'
			}
		};
		
		const uploadResult = await uploadBytes(storageRef, audioFile, metadata);
		
		if (onProgress) {
			onProgress(100);
		}
		
		// Get download URL
		const downloadURL = await getDownloadURL(uploadResult.ref);
		
		console.log('✅ [CLIENT UPLOAD] Audio upload successful:', downloadURL);
		
		return {
			downloadURL,
			storagePath
		};
	} catch (error) {
		console.error('❌ [CLIENT UPLOAD] Audio upload failed:', error);
		throw new Error(`Firebase Storage audio upload failed: ${error instanceof Error ? error.message : String(error)}`);
	}
}
