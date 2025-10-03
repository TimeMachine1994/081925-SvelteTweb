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

        // Load streams for this memorial
        console.log('🎬 [MEMORIAL_PAGE] Loading streams for memorial:', memorial.id);
        const streamsSnapshot = await adminDb
            .collection('streams')
            .where('memorialId', '==', memorial.id)
            .where('isVisible', '!=', false)
            .orderBy('createdAt', 'desc')
            .get();

        const streams = streamsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title || '',
                description: data.description || '',
                memorialId: data.memorialId || memorial.id,
                status: data.status || 'ready',
                isVisible: data.isVisible !== false,
                cloudflareStreamId: data.cloudflareStreamId || null,
                cloudflareInputId: data.cloudflareInputId || null,
                playbackUrl: data.playbackUrl || null,
                thumbnailUrl: data.thumbnailUrl || null,
                scheduledStartTime: data.scheduledStartTime || null,
                scheduledEndTime: data.scheduledEndTime || null,
                recordingUrl: data.recordingUrl || null,
                recordingReady: data.recordingReady || false,
                recordingDuration: data.recordingDuration || null,
                viewerCount: data.viewerCount || null,
                peakViewerCount: data.peakViewerCount || null,
                totalViews: data.totalViews || null,
                createdBy: data.createdBy || '',
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
                startedAt: data.startedAt || null,
                endedAt: data.endedAt || null
            };
        });

        console.log('🎬 [MEMORIAL_PAGE] Found', streams.length, 'visible streams');

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
                    imageUrl: memorial.imageUrl,
                    birthDate: memorial.birthDate,
                    deathDate: memorial.deathDate,
                    createdAt: memorial.createdAt,
                    updatedAt: memorial.updatedAt
                },
                streams: [] // No streams for private memorials
            };
        }

        // Return full memorial data for public memorials
        return {
            memorial,
            streams
        };

    } catch (err) {
        console.error('🏠 [MEMORIAL_PAGE] Error loading memorial:', err);
        throw error(500, 'Failed to load memorial');
    }
};
