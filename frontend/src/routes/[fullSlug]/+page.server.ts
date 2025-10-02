import { error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const { fullSlug } = params;
    
    console.log('🏠 [MEMORIAL_PAGE] Loading memorial page for slug:', fullSlug);
    
    // Filter out non-memorial requests (service workers, assets, etc.)
    if (fullSlug.includes('.') || fullSlug.startsWith('_') || fullSlug === 'favicon.ico') {
        console.log('🏠 [MEMORIAL_PAGE] Skipping non-memorial request:', fullSlug);
        throw error(404, 'Not a memorial page');
    }
    
    try {
        // Find memorial by slug
        console.log('🏠 [MEMORIAL_PAGE] Querying memorials collection for slug:', fullSlug);
        const memorialsRef = adminDb.collection('memorials');
        const snapshot = await memorialsRef.where('slug', '==', fullSlug).limit(1).get();
        console.log('🏠 [MEMORIAL_PAGE] Memorial query completed, found docs:', snapshot.docs.length);

        if (snapshot.empty) {
            console.log('🏠 [MEMORIAL_PAGE] No memorial found for slug:', fullSlug);
            throw error(404, 'Memorial not found');
        }

        const memorialDoc = snapshot.docs[0];
        const memorialData = memorialDoc.data();
        console.log('🏠 [MEMORIAL_PAGE] Memorial data keys:', Object.keys(memorialData));
        
        // Create memorial object with proper serialization (no Firestore objects)
        const memorial = {
            id: memorialDoc.id,
            lovedOneName: memorialData.lovedOneName || '',
            slug: memorialData.slug || fullSlug,
            fullSlug: memorialData.fullSlug || fullSlug,
            content: memorialData.content || '',
            isPublic: memorialData.isPublic || false,
            services: memorialData.services || null,
            imageUrl: memorialData.imageUrl || null,
            birthDate: memorialData.birthDate || null,
            deathDate: memorialData.deathDate || null,
            photos: memorialData.photos || [],
            embeds: memorialData.embeds || [],
            familyContactName: memorialData.familyContactName || null,
            familyContactEmail: memorialData.familyContactEmail || null,
            familyContactPhone: memorialData.familyContactPhone || null,
            familyContactPreference: memorialData.familyContactPreference || null,
            funeralHomeName: memorialData.funeralHomeName || null,
            directorFullName: memorialData.directorFullName || null,
            directorEmail: memorialData.directorEmail || null,
            additionalNotes: memorialData.additionalNotes || null,
            // Convert Firestore timestamps to strings for serialization
            createdAt: memorialData.createdAt?.toDate()?.toISOString() || null,
            updatedAt: memorialData.updatedAt?.toDate()?.toISOString() || null
        };

        console.log('🏠 [MEMORIAL_PAGE] Memorial found:', {
            id: memorial.id,
            lovedOneName: memorial.lovedOneName,
            slug: memorial.slug,
            isPublic: memorial.isPublic
        });

        // Security check: Only show content from public memorials to unauthenticated users
        if (memorial.isPublic !== true) {
            console.log('🔒 [MEMORIAL_PAGE] Memorial is private, returning basic info only');
            return {
                memorial: {
                    id: memorial.id,
                    lovedOneName: memorial.lovedOneName,
                    slug: memorial.slug,
                    content: memorial.content,
                    isPublic: false,
                    services: null,
                    createdAt: memorial.createdAt,
                    updatedAt: memorial.updatedAt
                }
            };
        }

        // Return full memorial data for public memorials
        return {
            memorial
        };

    } catch (err) {
        console.error('🏠 [MEMORIAL_PAGE] Error loading memorial:', err);
        throw error(500, 'Failed to load memorial');
    }
};
