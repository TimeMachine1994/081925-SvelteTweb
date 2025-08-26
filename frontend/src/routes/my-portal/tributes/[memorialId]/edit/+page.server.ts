import { error, fail, redirect } from '@sveltejs/kit';
import { adminDb, adminStorage } from '$lib/server/firebase';
import type { PageServerLoad, Actions } from './$types';
import type { Memorial } from '$lib/types/memorial';

export const load: PageServerLoad = async ({ params, locals }) => {
    if (!locals.user) {
        throw redirect(302, '/login');
    }

    const { memorialId } = params;
    const memorialRef = adminDb.collection('memorials').doc(memorialId);
    const memorialDoc = await memorialRef.get();

    if (!memorialDoc.exists) {
        throw error(404, 'Not Found');
    }

    const memorialData = memorialDoc.data();
    const isOwner = memorialData?.creatorUid === locals.user.uid || memorialData?.createdByUserId === locals.user.uid;
   
    if (memorialData?.createdByUserId) {
    	console.warn(`Memorial ${memorialId} is using the deprecated "createdByUserId" field. Please migrate to "creatorUid".`);
    }
   
    if (!memorialData || !isOwner) {
    	throw error(403, 'Forbidden');
    }
    
    const memorial = {
        id: memorialDoc.id,
        ...memorialData,
        createdAt: memorialData.createdAt?.toDate ? memorialData.createdAt.toDate().toISOString() : null,
        updatedAt: memorialData.updatedAt?.toDate ? memorialData.updatedAt.toDate().toISOString() : null,
    } as Memorial;

    return {
        memorial
    };
};

// Helper function to validate memorial ownership
async function validateMemorialOwnership(memorialId: string, userId: string) {
    console.log(`🔍 Validating ownership for memorial ${memorialId} by user ${userId}`);
    
    const memorialRef = adminDb.collection('memorials').doc(memorialId);
    const memorialDoc = await memorialRef.get();

    if (!memorialDoc.exists) {
        console.log(`❌ Memorial ${memorialId} not found`);
        return { valid: false, error: 'Memorial not found', status: 404 };
    }

    const memorialData = memorialDoc.data();
    const isOwner = memorialData?.creatorUid === userId || memorialData?.createdByUserId === userId;

    if (memorialData?.createdByUserId) {
        console.warn(`Memorial ${memorialId} is using the deprecated "createdByUserId" field. Please migrate to "creatorUid".`);
    }

    if (!isOwner) {
        console.log(`🚫 User ${userId} is not the owner of memorial ${memorialId}`);
        return { valid: false, error: 'Forbidden', status: 403 };
    }

    console.log(`✅ Ownership validated for memorial ${memorialId}`);
    return { valid: true, memorialRef, memorialData };
}

export const actions: Actions = {
    reorderPhotos: async ({ request, params, locals }) => {
        console.log('🔄 Processing photo reorder request for memorial:', params.memorialId);

        if (!locals.user) {
            console.log('🚨 Unauthorized reorder attempt: No user logged in');
            return fail(401, { error: 'Unauthorized' });
        }

        const { memorialId } = params;
        const validation = await validateMemorialOwnership(memorialId, locals.user.uid);
        
        if (!validation.valid) {
            return fail(validation.status!, { error: validation.error });
        }

        try {
            const formData = await request.formData();
            const photoOrderJson = formData.get('photoOrder') as string;

            if (!photoOrderJson) {
                console.log('❌ No photo order provided in request');
                return fail(400, { error: 'Photo order is required' });
            }

            let photoOrder: string[];
            try {
                photoOrder = JSON.parse(photoOrderJson);
            } catch (parseError) {
                console.log('❌ Invalid JSON in photo order:', parseError);
                return fail(400, { error: 'Invalid photo order format' });
            }

            if (!Array.isArray(photoOrder)) {
                console.log('❌ Photo order is not an array');
                return fail(400, { error: 'Photo order must be an array' });
            }

            // Validate that all photos in the new order exist in the current memorial
            const currentPhotos = validation.memorialData?.photos || [];
            console.log(`📋 Current photos: ${currentPhotos.length}, New order: ${photoOrder.length}`);

            if (photoOrder.length !== currentPhotos.length) {
                console.log('❌ Photo order length mismatch');
                return fail(400, { error: 'Photo order length does not match current photos' });
            }

            // Check that all photos in the new order exist in current photos
            for (const photoUrl of photoOrder) {
                if (!currentPhotos.includes(photoUrl)) {
                    console.log(`❌ Photo not found in current memorial: ${photoUrl}`);
                    return fail(400, { error: 'Invalid photo in order' });
                }
            }

            // Update the memorial with the new photo order
            await validation.memorialRef!.update({
                photos: photoOrder,
                updatedAt: new Date()
            });

            console.log(`✅ Photos reordered successfully for memorial ${memorialId}`);
            return {
                success: true,
                message: 'Photos reordered successfully',
                photos: photoOrder
            };

        } catch (err) {
            console.error('🔥 Error during photo reordering:', err);
            return fail(500, { error: 'Failed to reorder photos' });
        }
    },

    deletePhoto: async ({ request, params, locals }) => {
        console.log('🗑️ Processing photo deletion request for memorial:', params.memorialId);

        if (!locals.user) {
            console.log('🚨 Unauthorized delete attempt: No user logged in');
            return fail(401, { error: 'Unauthorized' });
        }

        const { memorialId } = params;
        const validation = await validateMemorialOwnership(memorialId, locals.user.uid);
        
        if (!validation.valid) {
            return fail(validation.status!, { error: validation.error });
        }

        try {
            const formData = await request.formData();
            const photoUrl = formData.get('photoUrl') as string;

            if (!photoUrl) {
                console.log('❌ No photo URL provided in request');
                return fail(400, { error: 'Photo URL is required' });
            }

            const currentPhotos = validation.memorialData?.photos || [];
            console.log(`🔍 Looking for photo to delete: ${photoUrl}`);

            if (!currentPhotos.includes(photoUrl)) {
                console.log('❌ Photo not found in memorial');
                return fail(404, { error: 'Photo not found' });
            }

            // Remove the photo from the array
            const updatedPhotos = currentPhotos.filter((url: string) => url !== photoUrl);

            // Update the memorial document
            await validation.memorialRef!.update({
                photos: updatedPhotos,
                updatedAt: new Date()
            });

            console.log(`✅ Photo deleted successfully from memorial ${memorialId}`);

            // Optional: Delete the actual file from Firebase Storage
            // This is commented out for safety - you may want to keep files for recovery
            /*
            try {
                const bucket = adminStorage.bucket();
                const fileName = photoUrl.split('/').pop()?.split('?')[0]; // Extract filename from URL
                if (fileName) {
                    const file = bucket.file(`memorials/${memorialId}/${fileName}`);
                    await file.delete();
                    console.log(`🗑️ Physical file deleted from storage: ${fileName}`);
                }
            } catch (storageError) {
                console.warn('⚠️ Failed to delete physical file from storage:', storageError);
                // Don't fail the request if storage deletion fails
            }
            */

            return {
                success: true,
                message: 'Photo deleted successfully',
                photos: updatedPhotos,
                deletedPhoto: photoUrl
            };

        } catch (err) {
            console.error('🔥 Error during photo deletion:', err);
            return fail(500, { error: 'Failed to delete photo' });
        }
    },

    updatePhotoMetadata: async ({ request, params, locals }) => {
        console.log('📝 Processing photo metadata update request for memorial:', params.memorialId);

        if (!locals.user) {
            console.log('🚨 Unauthorized metadata update attempt: No user logged in');
            return fail(401, { error: 'Unauthorized' });
        }

        const { memorialId } = params;
        const validation = await validateMemorialOwnership(memorialId, locals.user.uid);
        
        if (!validation.valid) {
            return fail(validation.status!, { error: validation.error });
        }

        try {
            const formData = await request.formData();
            const photoUrl = formData.get('photoUrl') as string;
            const metadataJson = formData.get('metadata') as string;

            if (!photoUrl) {
                console.log('❌ No photo URL provided in request');
                return fail(400, { error: 'Photo URL is required' });
            }

            if (!metadataJson) {
                console.log('❌ No metadata provided in request');
                return fail(400, { error: 'Metadata is required' });
            }

            let metadata: Record<string, any>;
            try {
                metadata = JSON.parse(metadataJson);
            } catch (parseError) {
                console.log('❌ Invalid JSON in metadata:', parseError);
                return fail(400, { error: 'Invalid metadata format' });
            }

            const currentPhotos = validation.memorialData?.photos || [];
            
            if (!currentPhotos.includes(photoUrl)) {
                console.log('❌ Photo not found in memorial');
                return fail(404, { error: 'Photo not found' });
            }

            // Initialize photoMetadata if it doesn't exist
            const currentMetadata = validation.memorialData?.photoMetadata || {};
            
            // Update metadata for the specific photo
            const updatedMetadata = {
                ...currentMetadata,
                [photoUrl]: {
                    ...currentMetadata[photoUrl],
                    ...metadata,
                    updatedAt: new Date().toISOString()
                }
            };

            // Update the memorial document
            await validation.memorialRef!.update({
                photoMetadata: updatedMetadata,
                updatedAt: new Date()
            });

            console.log(`✅ Photo metadata updated successfully for memorial ${memorialId}`);

            return {
                success: true,
                message: 'Photo metadata updated successfully',
                photoUrl,
                metadata: updatedMetadata[photoUrl]
            };

        } catch (err) {
            console.error('🔥 Error during photo metadata update:', err);
            return fail(500, { error: 'Failed to update photo metadata' });
        }
    },

    updateSlideshowSettings: async ({ request, params, locals }) => {
        console.log('⚙️ Processing slideshow settings update request for memorial:', params.memorialId);

        if (!locals.user) {
            console.log('🚨 Unauthorized slideshow settings update attempt: No user logged in');
            return fail(401, { error: 'Unauthorized' });
        }

        const { memorialId } = params;
        const validation = await validateMemorialOwnership(memorialId, locals.user.uid);
        
        if (!validation.valid) {
            return fail(validation.status!, { error: validation.error });
        }

        try {
            const formData = await request.formData();
            const settingsJson = formData.get('settings') as string;

            if (!settingsJson) {
                console.log('❌ No slideshow settings provided in request');
                return fail(400, { error: 'Slideshow settings are required' });
            }

            let settings: Record<string, any>;
            try {
                settings = JSON.parse(settingsJson);
            } catch (parseError) {
                console.log('❌ Invalid JSON in slideshow settings:', parseError);
                return fail(400, { error: 'Invalid slideshow settings format' });
            }

            // Validate settings structure
            const allowedSettings = [
                'autoplay', 'duration', 'transition', 'showControls',
                'allowFullscreen', 'loop', 'showThumbnails', 'backgroundColor'
            ];

            const validatedSettings: Record<string, any> = {};
            for (const [key, value] of Object.entries(settings)) {
                if (allowedSettings.includes(key)) {
                    validatedSettings[key] = value;
                }
            }

            // Update the memorial document with slideshow settings
            await validation.memorialRef!.update({
                slideshowSettings: validatedSettings,
                updatedAt: new Date()
            });

            console.log(`✅ Slideshow settings updated successfully for memorial ${memorialId}`);

            return {
                success: true,
                message: 'Slideshow settings updated successfully',
                settings: validatedSettings
            };

        } catch (err) {
            console.error('🔥 Error during slideshow settings update:', err);
            return fail(500, { error: 'Failed to update slideshow settings' });
        }
    }
};
