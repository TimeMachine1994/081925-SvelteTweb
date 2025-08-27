import { error, fail, redirect } from '@sveltejs/kit';
import { adminDb, adminStorage } from '$lib/server/firebase';
import type { PageServerLoad, Actions } from './$types';
import type { Memorial } from '$lib/types/memorial';

export const load: PageServerLoad = async ({ params, locals }) => {
    console.log('🔍 Edit page: Loading memorial edit page', params.memorialId);
    
    if (!locals.user) {
        console.log('❌ Edit page: No authenticated user');
        throw redirect(302, '/login');
    }

    const { memorialId } = params;
    const userId = locals.user.uid;
    const isAdmin = locals.user?.admin === true;
    
    console.log('👤 Edit page: Checking user permissions', {
        userId,
        memorialId,
        isAdmin
    });

    try {
        // Get the memorial document
        const memorialRef = adminDb.collection('memorials').doc(memorialId);
        const memorialDoc = await memorialRef.get();

        if (!memorialDoc.exists) {
            console.log('❌ Edit page: Memorial not found');
            throw error(404, 'Memorial not found');
        }

        const memorialData = memorialDoc.data();
        
        // Check if user is the owner (handle both field names for backward compatibility)
        const isOwner = memorialData?.creatorUid === userId || memorialData?.createdByUserId === userId;
        
        if (memorialData?.createdByUserId) {
            console.warn(`Memorial ${memorialId} is using the deprecated "createdByUserId" field. Please migrate to "creatorUid".`);
        }

        // Check if user is a family member
        let isFamilyMember = false;
        let familyMemberPermissions = null;
        
        console.log('🔍 Edit page: Checking family member status');
        const familyMemberRef = adminDb
            .collection('memorials')
            .doc(memorialId)
            .collection('familyMembers')
            .doc(userId);
        
        const familyMemberDoc = await familyMemberRef.get();
        
        if (familyMemberDoc.exists) {
            const familyMemberData = familyMemberDoc.data();
            // Check if active and not pending
            if (familyMemberData?.status === 'active') {
                isFamilyMember = true;
                familyMemberPermissions = familyMemberData;
                console.log('✅ Edit page: User is an active family member', {
                    role: familyMemberData.role,
                    permissions: familyMemberData.permissions
                });
            } else {
                console.log('⚠️ Edit page: User is a family member but not active', {
                    status: familyMemberData?.status
                });
            }
        }

        // Determine user role and access
        let userRole: 'owner' | 'family_member' | 'admin' | null = null;
        let hasAccess = false;

        if (isOwner) {
            userRole = 'owner';
            hasAccess = true;
            console.log('✅ Edit page: User is the owner');
        } else if (isFamilyMember) {
            userRole = 'family_member';
            hasAccess = true;
            console.log('✅ Edit page: User is a family member with access');
        } else if (isAdmin) {
            userRole = 'admin';
            hasAccess = true;
            console.log('✅ Edit page: User is an admin');
        }

        if (!hasAccess) {
            console.log('🚫 Edit page: User does not have access', {
                isOwner,
                isFamilyMember,
                isAdmin
            });
            throw error(403, 'You do not have permission to edit this memorial');
        }

        // Determine permissions based on role
        const canDelete = userRole === 'owner' || userRole === 'admin';
        const canManageSettings = userRole === 'owner' || userRole === 'admin';
        const canUploadPhotos = true; // All authorized users can upload photos
        const canEditPhotos = userRole === 'owner' || userRole === 'admin' || 
            (userRole === 'family_member' && familyMemberPermissions?.permissions?.canEditPhotos === true);
        const canInviteOthers = userRole === 'owner' || userRole === 'admin' ||
            (userRole === 'family_member' && familyMemberPermissions?.permissions?.canInvite === true);

        // Prepare memorial data with permissions
        const memorial = {
            id: memorialDoc.id,
            ...memorialData,
            createdAt: memorialData?.createdAt?.toDate ? memorialData.createdAt.toDate().toISOString() : null,
            updatedAt: memorialData?.updatedAt?.toDate ? memorialData.updatedAt.toDate().toISOString() : null,
            // Add role and permission flags
            userRole,
            canDelete,
            canManageSettings,
            canUploadPhotos,
            canEditPhotos,
            canInviteOthers,
            // Include family member details if applicable
            ...(isFamilyMember && {
                familyMemberRole: familyMemberPermissions?.role,
                familyMemberPermissions: familyMemberPermissions?.permissions
            })
        } as Memorial & {
            userRole: string;
            canDelete: boolean;
            canManageSettings: boolean;
            canUploadPhotos: boolean;
            canEditPhotos: boolean;
            canInviteOthers: boolean;
            familyMemberRole?: string;
            familyMemberPermissions?: any;
        };

        console.log('✅ Edit page: Successfully loaded memorial with permissions', {
            memorialId,
            userRole,
            permissions: {
                canDelete,
                canManageSettings,
                canUploadPhotos,
                canEditPhotos,
                canInviteOthers
            }
        });

        return {
            memorial
        };
    } catch (err) {
        console.error('🔥 Edit page: Error loading memorial', err);
        if (err instanceof Error && 'status' in err) {
            throw err; // Re-throw SvelteKit errors
        }
        throw error(500, 'Failed to load memorial');
    }
};

// Helper function to validate memorial access and permissions
async function validateMemorialAccess(memorialId: string, userId: string, requiredPermission?: string) {
    console.log(`🔍 Validating access for memorial ${memorialId} by user ${userId}`);
    
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

    // Owner always has full access
    if (isOwner) {
        console.log(`✅ User ${userId} is the owner of memorial ${memorialId}`);
        return { valid: true, memorialRef, memorialData, userRole: 'owner' };
    }

    // Check if user is an admin (would need to be passed in or checked via claims)
    // For now, we'll skip admin check in this helper

    // Check if user is a family member
    const familyMemberRef = adminDb
        .collection('memorials')
        .doc(memorialId)
        .collection('familyMembers')
        .doc(userId);
    
    const familyMemberDoc = await familyMemberRef.get();
    
    if (familyMemberDoc.exists) {
        const familyMemberData = familyMemberDoc.data();
        
        // Check if active
        if (familyMemberData?.status !== 'active') {
            console.log(`⚠️ User ${userId} is a family member but not active (status: ${familyMemberData?.status})`);
            return { valid: false, error: 'Your family member access is pending or inactive', status: 403 };
        }

        // Check specific permission if required
        if (requiredPermission && !familyMemberData?.permissions?.[requiredPermission]) {
            console.log(`🚫 Family member ${userId} lacks required permission: ${requiredPermission}`);
            return { valid: false, error: 'You do not have permission to perform this action', status: 403 };
        }

        console.log(`✅ Family member ${userId} has access to memorial ${memorialId}`);
        return { 
            valid: true, 
            memorialRef, 
            memorialData, 
            userRole: 'family_member',
            permissions: familyMemberData.permissions 
        };
    }

    console.log(`🚫 User ${userId} does not have access to memorial ${memorialId}`);
    return { valid: false, error: 'You do not have permission to access this memorial', status: 403 };
}

export const actions: Actions = {
    reorderPhotos: async ({ request, params, locals }) => {
        console.log('🔄 Processing photo reorder request for memorial:', params.memorialId);

        if (!locals.user) {
            console.log('🚨 Unauthorized reorder attempt: No user logged in');
            return fail(401, { error: 'Unauthorized' });
        }

        const { memorialId } = params;
        // Photo reordering requires edit permission
        const validation = await validateMemorialAccess(memorialId, locals.user.uid, 'canEditPhotos');
        
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

            console.log(`✅ Photos reordered successfully for memorial ${memorialId} by ${validation.userRole}`);
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
        // Photo deletion requires edit permission (or owner/admin)
        const validation = await validateMemorialAccess(memorialId, locals.user.uid, 'canEditPhotos');
        
        if (!validation.valid) {
            return fail(validation.status!, { error: validation.error });
        }

        // Additional check: only owners and admins can delete photos
        if (validation.userRole === 'family_member') {
            console.log('🚫 Family members cannot delete photos');
            return fail(403, { error: 'Only memorial owners can delete photos' });
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

            console.log(`✅ Photo deleted successfully from memorial ${memorialId} by ${validation.userRole}`);

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
        // Metadata update requires edit permission
        const validation = await validateMemorialAccess(memorialId, locals.user.uid, 'canEditPhotos');
        
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
                    updatedAt: new Date().toISOString(),
                    updatedBy: locals.user.uid,
                    updatedByRole: validation.userRole
                }
            };

            // Update the memorial document
            await validation.memorialRef!.update({
                photoMetadata: updatedMetadata,
                updatedAt: new Date()
            });

            console.log(`✅ Photo metadata updated successfully for memorial ${memorialId} by ${validation.userRole}`);

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
        // Slideshow settings update requires owner or admin only
        const validation = await validateMemorialAccess(memorialId, locals.user.uid);
        
        if (!validation.valid) {
            return fail(validation.status!, { error: validation.error });
        }

        // Only owners and admins can manage slideshow settings
        if (validation.userRole === 'family_member') {
            console.log('🚫 Family members cannot update slideshow settings');
            return fail(403, { error: 'Only memorial owners can manage slideshow settings' });
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

            console.log(`✅ Slideshow settings updated successfully for memorial ${memorialId} by ${validation.userRole}`);

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
