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
            .orderBy('createdAt', 'desc')
            .get();

        const streams = streamsSnapshot.docs
            .filter(doc => {
                const data = doc.data();
                // Filter out hidden streams (isVisible === false)
                return data.isVisible !== false;
            })
            .map(doc => {
            const data = doc.data();
            
            // Helper function for defensive timestamp handling
            const convertTimestamp = (timestamp: any) => {
                if (!timestamp) return null;
                if (typeof timestamp === 'string') return timestamp;
                if (timestamp.toDate) return timestamp.toDate().toISOString();
                if (timestamp instanceof Date) return timestamp.toISOString();
                try {
                    return new Date(timestamp).toISOString();
                } catch {
                    return null;
                }
            };
            
            return {
                id: doc.id,
                title: data.title || `Stream ${doc.id.slice(-6)}`,
                description: data.description || '',
                memorialId: data.memorialId || memorial.id,
                
                // Status with fallback logic for legacy data
                status: data.status || (data.isLive ? 'live' : 'ready'),
                isVisible: data.isVisible !== false,
                
                // Cloudflare integration with multiple field name support
                cloudflareStreamId: data.cloudflareStreamId || data.streamId || null,
                cloudflareInputId: data.cloudflareInputId || data.inputId || null,
                
                // Legacy playback fields
                playbackUrl: data.playbackUrl || null,
                thumbnailUrl: data.thumbnailUrl || null,
                
                // Scheduling with proper timestamp conversion
                scheduledStartTime: convertTimestamp(data.scheduledStartTime),
                scheduledEndTime: convertTimestamp(data.scheduledEndTime),
                startedAt: convertTimestamp(data.startedAt),
                endedAt: convertTimestamp(data.endedAt),
                
                // Recording fields with intelligent fallbacks
                recordingUrl: data.recordingUrl || null, // Legacy field
                recordingPlaybackUrl: data.recordingPlaybackUrl || data.recordingUrl || null,
                recordingReady: data.recordingReady || !!data.recordingUrl || !!data.recordingPlaybackUrl || !!data.cloudflareStreamId,
                recordingDuration: data.recordingDuration || null,
                recordingSize: data.recordingSize || null,
                recordingThumbnail: data.recordingThumbnail || data.thumbnailUrl || null,
                recordingProcessedAt: convertTimestamp(data.recordingProcessedAt),
                recordingCount: data.recordingCount || null,
                cloudflareRecordings: Array.isArray(data.cloudflareRecordings) ? data.cloudflareRecordings : [],
                
                // Analytics with safe defaults
                viewerCount: typeof data.viewerCount === 'number' ? data.viewerCount : null,
                peakViewerCount: typeof data.peakViewerCount === 'number' ? data.peakViewerCount : null,
                totalViews: typeof data.totalViews === 'number' ? data.totalViews : null,
                
                // Metadata with defensive handling
                createdBy: data.createdBy || '',
                createdAt: convertTimestamp(data.createdAt) || new Date().toISOString(),
                updatedAt: convertTimestamp(data.updatedAt) || new Date().toISOString()
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
