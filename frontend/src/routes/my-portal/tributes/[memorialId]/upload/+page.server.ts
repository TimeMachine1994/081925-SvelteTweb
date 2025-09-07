import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { adminAuth, adminDb } from '$lib/firebase-admin';
import type { Memorial } from '$lib/types/memorial';
import { requirePhotoUploadAccess, createMemorialRequest } from '$lib/server/memorialMiddleware';

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		const { memorialId } = params;
		
		console.log('📸 Photo upload request for memorial:', memorialId);
		console.log('👤 User:', locals.user?.email, 'Role:', locals.user?.role);

		// Authentication check
		if (!locals.user) {
			console.log('🚫 Unauthorized: No user logged in');
			return fail(401, { error: 'You must be logged in to upload photos' });
		}

		const { uid, role, email } = locals.user;

		try {
			// Use new access verification middleware
			const memorialRequest = createMemorialRequest(memorialId, locals);
			const accessResult = await requirePhotoUploadAccess(memorialRequest);
			
			console.log('✅ Photo upload access verified:', accessResult.reason);

			// Get form data
			const formData = await request.formData();
			const photoFile = formData.get('photo') as File;

			if (!photoFile || photoFile.size === 0) {
				return fail(400, { error: 'Please select a photo to upload' });
			}

			// Validate file type
			if (!photoFile.type.startsWith('image/')) {
				return fail(400, { error: 'Please upload a valid image file' });
			}

			// Validate file size (10MB limit)
			const maxSize = 10 * 1024 * 1024; // 10MB
			if (photoFile.size > maxSize) {
				return fail(400, { error: 'Photo must be smaller than 10MB' });
			}

			// Convert file to buffer for storage
			const buffer = await photoFile.arrayBuffer();
			const uint8Array = new Uint8Array(buffer);

			// Create photo document in Firestore
			const photoData = {
				memorialId,
				uploadedBy: uid,
				uploadedByEmail: email,
				uploadedByRole: role,
				fileName: photoFile.name,
				fileSize: photoFile.size,
				mimeType: photoFile.type,
				uploadedAt: new Date(),
				approved: role === 'owner' || role === 'admin', // Auto-approve owner/admin uploads
				removedByOwner: false,
				permissionReason: accessResult.reason
			};

			// Add photo document
			const photoRef = await adminDb.collection('photos').add(photoData);
			console.log('✅ Photo document created:', photoRef.id);

			// TODO: In a real implementation, you would:
			// 1. Upload the actual file to Firebase Storage or another service
			// 2. Store the download URL in the photo document
			// 3. Generate thumbnails
			// 4. Run image moderation/scanning
			
			// For now, we'll simulate successful upload
			await adminDb.collection('photos').doc(photoRef.id).update({
				storageUrl: `https://example.com/photos/${photoRef.id}`, // Placeholder
				thumbnailUrl: `https://example.com/thumbnails/${photoRef.id}`, // Placeholder
				processed: true
			});

			console.log('✅ Photo upload completed successfully');
			return { success: true, photoId: photoRef.id };

		} catch (error) {
			console.error('❌ Photo upload error:', error);
			return fail(500, { error: 'Failed to upload photo. Please try again.' });
		}
	}
};
